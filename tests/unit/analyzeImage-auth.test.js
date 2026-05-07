/**
 * TDD gate for image-analysis surface:
 *   1. Auth: /api/chat is auth-gated since Phase 1.5; missing/empty/null idToken
 *      throws a NAMED auth error before any silent-fallback path.
 *   2. Data-URL flow: /api/chat#L212 regex requires `data:image/<mime>;base64,<payload>`.
 *      The function MUST pass through the full data URL — stripping the prefix to
 *      bare base64 fails MIME-allowlist match with HTTP 400.
 *   3. Naming: provider-agnostic. Function is `analyzePurchaseImage` (renamed from
 *      `analyzeImageWithOpenAI` since the backend has been Gemini since Phase 1.7).
 */

const aiAdvisorAPI = require('../../src/lib/aiAdvisorAPI');
const { analyzePurchaseImage } = aiAdvisorAPI;

describe('analyzePurchaseImage — auth + data-URL contract', () => {
  let originalFetch;
  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('exports analyzePurchaseImage (provider-agnostic name)', () => {
    expect(typeof analyzePurchaseImage).toBe('function');
  });

  it('does not export the legacy OpenAI-named function', () => {
    expect(aiAdvisorAPI.analyzeImageWithOpenAI).toBeUndefined();
  });

  it('throws auth-specific error when idToken is missing', async () => {
    await expect(analyzePurchaseImage('data:image/jpeg;base64,XYZ', undefined)).rejects.toThrow(
      /Authentication required/i,
    );
  });

  it('throws auth-specific error when idToken is empty string', async () => {
    await expect(analyzePurchaseImage('data:image/jpeg;base64,XYZ', '')).rejects.toThrow(
      /Authentication required/i,
    );
  });

  it('throws auth-specific error when idToken is null', async () => {
    await expect(analyzePurchaseImage('data:image/jpeg;base64,XYZ', null)).rejects.toThrow(
      /Authentication required/i,
    );
  });

  it('sends Authorization: Bearer <idToken> header on /api/chat', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: '{"name":"MacBook Pro","cost":2499,"facts":"laptop"}' }),
    });
    await analyzePurchaseImage('data:image/jpeg;base64,XYZ', 'idtok-abc');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer idtok-abc' }),
      }),
    );
  });

  it('passes the full data URL through to /api/chat (not bare base64)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: '{"name":"x","cost":1,"facts":"y"}' }),
    });
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD';
    await analyzePurchaseImage(dataUrl, 'tok');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.image).toBe(dataUrl);
    // Should NOT be the stripped form
    expect(body.image).not.toBe('/9j/4AAQSkZJRgABAQEASABIAAD');
  });

  it('throws auth-specific error on 401 response (not silent fallback)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Missing Authorization header' }),
    });
    await expect(analyzePurchaseImage('data:image/jpeg;base64,XYZ', 'expired-tok')).rejects.toThrow(
      /Authentication required/i,
    );
  });

  it('returns parsed product info on success', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response:
          '{"name":"Apple MacBook Pro 14","cost":8099,"facts":"Space black M3 Pro laptop"}',
      }),
    });
    const result = await analyzePurchaseImage('data:image/jpeg;base64,XYZ', 'tok');
    expect(result.name).toBe('Apple MacBook Pro 14');
    expect(result.cost).toBe(8099);
  });

  it('returns Error sentinel on non-401 server failure (e.g. 400 / 500)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });
    const result = await analyzePurchaseImage('data:image/jpeg;base64,XYZ', 'tok');
    expect(result.name).toBe('Error');
  });
});
