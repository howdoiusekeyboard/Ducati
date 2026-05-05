/**
 * Unit tests for /api/chat route — Gemini migration (Phase 8a).
 * Imports the actual handler and mocks @google/genai + firebase-admin.
 */

import { NextRequest } from 'next/server';

// ---- Mock @google/genai ----
const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => {
  return {
    __esModule: true,
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      ARRAY: 'ARRAY',
      INTEGER: 'INTEGER',
    },
  };
});

// ---- Mock firebase-admin via the project's wrapper ----
const mockVerify = jest.fn();
const mockGetProfile = jest.fn();
jest.mock('@/lib/firebase-admin', () => ({
  verifyAuthFromRequest: (...args: unknown[]) => mockVerify(...args),
  getProfileForUid: (...args: unknown[]) => mockGetProfile(...args),
}));

import { POST } from '../route';

const VALID_AUTH = { ok: true as const, uid: 'test-uid' };

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('/api/chat — Gemini route handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_API_KEY = 'test-google-key';
    mockVerify.mockResolvedValue(VALID_AUTH);
    mockGetProfile.mockResolvedValue(null);
  });

  afterEach(() => {
    delete process.env.GOOGLE_API_KEY;
  });

  describe('environment + auth gate', () => {
    it('returns 500 when GOOGLE_API_KEY is missing', async () => {
      delete process.env.GOOGLE_API_KEY;
      const res = await POST(makeRequest({ message: 'hi' }));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toMatch(/GOOGLE_API_KEY/);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('returns 401 when verifyAuthFromRequest fails', async () => {
      mockVerify.mockResolvedValue({
        ok: false,
        status: 401,
        error: 'Missing Authorization header',
      });
      const res = await POST(makeRequest({ message: 'hi' }));
      expect(res.status).toBe(401);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('does not call Gemini until auth has passed', async () => {
      mockVerify.mockResolvedValue({
        ok: false,
        status: 401,
        error: 'Invalid or expired ID token',
      });
      await POST(makeRequest({ message: 'hi' }));
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('rejects empty message with 400', async () => {
      const res = await POST(makeRequest({ message: '' }));
      expect(res.status).toBe(400);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('rejects whitespace-only message with 400', async () => {
      const res = await POST(makeRequest({ message: '   ' }));
      expect(res.status).toBe(400);
    });

    it('rejects malformed JSON body with 400', async () => {
      const req = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not-json',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('rejects non-array conversationHistory with 400', async () => {
      const res = await POST(makeRequest({ message: 'hi', conversationHistory: 'nope' }));
      expect(res.status).toBe(400);
    });
  });

  describe('default text path (Gemini grounding)', () => {
    it('returns assistant text on success', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Hello back.' });
      const res = await POST(makeRequest({ message: 'hi' }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.response).toBe('Hello back.');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.stringMatching(/^gemini-/),
          config: expect.objectContaining({
            tools: expect.arrayContaining([expect.objectContaining({ googleSearch: {} })]),
          }),
        })
      );
    });

    it('returns 500 when Gemini returns empty text', async () => {
      mockGenerateContent.mockResolvedValue({ text: '' });
      const res = await POST(makeRequest({ message: 'hi' }));
      expect(res.status).toBe(500);
    });

    it('forwards conversationHistory to Gemini in user/model role shape', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await POST(
        makeRequest({
          message: 'follow-up',
          conversationHistory: [
            { role: 'user', content: 'previous question' },
            { role: 'assistant', content: 'previous answer' },
          ],
        })
      );
      const arg = mockGenerateContent.mock.calls[0]![0]!;
      expect(arg.contents).toEqual([
        { role: 'user', parts: [{ text: 'previous question' }] },
        { role: 'model', parts: [{ text: 'previous answer' }] },
        { role: 'user', parts: [{ text: 'follow-up' }] },
      ]);
    });

    it('maps 429 errors to RATE_LIMIT_ERROR + status 429', async () => {
      const err: { status: number; message: string } = { status: 429, message: 'rate limit hit' };
      mockGenerateContent.mockRejectedValue(err);
      const res = await POST(makeRequest({ message: 'hi' }));
      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.errorType).toBe('rate_limit_error');
    });
  });

  describe('vision path (multimodal inlineData)', () => {
    it('attaches base64 image as inlineData part when body.image is a data URL', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'I see a cat.' });
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      await POST(makeRequest({ message: 'what is this', image: dataUrl }));
      const arg = mockGenerateContent.mock.calls[0]![0]!;
      const userPart = arg.contents.find((c: { role: string }) => c.role === 'user');
      expect(userPart.parts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            inlineData: expect.objectContaining({
              data: '/9j/4AAQSkZJRg==',
              mimeType: 'image/jpeg',
            }),
          }),
          { text: 'what is this' },
        ])
      );
    });

    it('rejects body.image that is not a data: URL with 400', async () => {
      const res = await POST(makeRequest({ message: 'q', image: 'https://example.com/x.jpg' }));
      expect(res.status).toBe(400);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });

  describe('Pro Mode (responseJsonSchema)', () => {
    it('routes body.proMode === true to a structured-output call', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          questions: [
            {
              id: 'q1',
              dimension: 'specs',
              answer_type: 'short_text',
              text: 'A',
              placeholder: 'p1',
              search_hint: 's1',
            },
            {
              id: 'q2',
              dimension: 'constraints',
              answer_type: 'short_text',
              text: 'B',
              placeholder: 'p2',
              search_hint: 's2',
            },
            {
              id: 'q3',
              dimension: 'timing',
              answer_type: 'short_text',
              text: 'C',
              placeholder: 'p3',
              search_hint: 's3',
            },
          ],
        }),
      });
      const res = await POST(
        makeRequest({ message: 'iPhone 17 Pro purchase context', proMode: true })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(3);
      expect(body[0].id).toBe('q1');
      const arg = mockGenerateContent.mock.calls[0]![0]!;
      expect(arg.config.responseMimeType).toBe('application/json');
      expect(arg.config.responseJsonSchema).toBeDefined();
      expect(arg.config.tools).toBeUndefined(); // structured output incompatible with grounding
    });

    it('returns 500 when Pro Mode response is not valid JSON', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'not json at all' });
      const res = await POST(makeRequest({ message: 'x', proMode: true }));
      expect(res.status).toBe(500);
    });

    it('returns 500 when Pro Mode response has the wrong question count', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          questions: [
            {
              id: 'q1',
              dimension: 'specs',
              answer_type: 'short_text',
              text: 'A',
              placeholder: 'p',
              search_hint: 's',
            },
          ],
        }),
      });
      const res = await POST(makeRequest({ message: 'x', proMode: true }));
      expect(res.status).toBe(500);
    });

    it('rejects image/svg+xml data URLs with 400', async () => {
      const svgDataUrl =
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=';
      const res = await POST(makeRequest({ message: 'q', image: svgDataUrl }));
      expect(res.status).toBe(400);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('does not trigger Pro Mode for the legacy magic-string message', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Default text response.' });
      const res = await POST(
        makeRequest({ message: 'Generate exactly 3 probing questions about X' })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.response).toBe('Default text response.');
      const arg = mockGenerateContent.mock.calls[0]![0]!;
      expect(arg.config.responseJsonSchema).toBeUndefined();
    });
  });

  describe('profile injection (Phase 1.5)', () => {
    it('injects server-fetched profile into systemInstruction; ignores body.profile', async () => {
      mockGetProfile.mockResolvedValue({ monthlyIncome: 5000, creditScore: 750 });
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await POST(
        makeRequest({
          message: 'hi',
          profile: { monthlyIncome: 99999 }, // attempted client tamper
        })
      );
      const arg = mockGenerateContent.mock.calls[0]![0]!;
      expect(arg.config.systemInstruction).toContain('Monthly income: $5000');
      expect(arg.config.systemInstruction).not.toContain('99999');
    });
  });
});
