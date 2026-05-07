/**
 * TDD red gate for the image-identification auth bug.
 *
 * Bug: analyzeImageWithOpenAI calls /api/chat without Authorization header.
 * /api/chat is auth-gated since Phase 1.5 → 401 → function returns
 * {name:'Error', cost:0} → PurchaseAdvisor's `name !== 'Error'` check skips
 * the dispatchForm → itemName stays '' → placeholder stuck on "Identifying..."
 * indefinitely.
 *
 * Fix shape mirrors findCheaperAlternative + ProModeAPI + enhancedAdvisorIntegration:
 * - require idToken parameter
 * - send Authorization: Bearer header
 * - detect 401 explicitly
 * - throw a NAMED auth error so caller can re-route (not silently swallow)
 */

import { analyzeImageWithOpenAI } from '../../src/lib/aiAdvisorAPI';

describe('analyzeImageWithOpenAI auth gating (Phase 1.5 / 8a pattern)', () => {
  let originalFetch;
  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws an auth-specific error when idToken is missing', async () => {
    await expect(analyzeImageWithOpenAI('base64data', undefined)).rejects.toThrow(
      /Authentication required/i,
    );
  });

  it('throws an auth-specific error when idToken is empty string', async () => {
    await expect(analyzeImageWithOpenAI('base64data', '')).rejects.toThrow(
      /Authentication required/i,
    );
  });

  it('throws an auth-specific error when idToken is null', async () => {
    await expect(analyzeImageWithOpenAI('base64data', null)).rejects.toThrow(
      /Authentication required/i,
    );
  });

  it('sends Authorization: Bearer <idToken> header on /api/chat', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: '{"name":"MacBook Pro","cost":2499,"facts":"Apple laptop"}',
      }),
    });
    await analyzeImageWithOpenAI('base64data', 'idtok-abc');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer idtok-abc',
        }),
      }),
    );
  });

  it('throws auth-specific error on 401 response (not silent fallback)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Missing Authorization header' }),
    });
    await expect(analyzeImageWithOpenAI('base64data', 'expired-tok')).rejects.toThrow(
      /Authentication required/i,
    );
  });

  it('returns parsed product info on success', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response:
          '{"name":"Apple MacBook Pro 14","cost":8099,"facts":"Space black laptop with M3 chip"}',
      }),
    });
    const result = await analyzeImageWithOpenAI('base64data', 'idtok-abc');
    expect(result.name).toBe('Apple MacBook Pro 14');
    expect(result.cost).toBe(8099);
  });

  it('returns Error sentinel on non-401 server failure (e.g. 500)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });
    const result = await analyzeImageWithOpenAI('base64data', 'idtok-abc');
    expect(result.name).toBe('Error');
  });
});
