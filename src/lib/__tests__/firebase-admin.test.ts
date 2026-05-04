/**
 * Unit tests for verifyAuthFromRequest + getProfileForUid.
 * Mocks firebase-admin/auth and firebase-admin/firestore so tests do not
 * need a real service account.
 */

const mockVerifyIdToken = jest.fn();
const mockDocGet = jest.fn();
const mockDoc = jest.fn(() => ({ get: mockDocGet }));
const mockFirestore = { doc: mockDoc };

jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  cert: jest.fn((sa) => sa),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({ verifyIdToken: mockVerifyIdToken })),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => mockFirestore),
}));

import { verifyAuthFromRequest, getProfileForUid } from '../firebase-admin';

const FAKE_SERVICE_ACCOUNT = JSON.stringify({
  project_id: 'test-project',
  private_key: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n',
  client_email: 'test@test-project.iam.gserviceaccount.com',
});

describe('verifyAuthFromRequest', () => {
  beforeEach(() => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = FAKE_SERVICE_ACCOUNT;
    mockVerifyIdToken.mockReset();
  });

  afterEach(() => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  });

  it('returns 401 when Authorization header is missing', async () => {
    const request = new Request('http://localhost/api/chat', { method: 'POST' });
    const result = await verifyAuthFromRequest(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.error).toMatch(/missing/i);
    }
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is not Bearer format', async () => {
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { Authorization: 'Basic abc123' },
    });
    const result = await verifyAuthFromRequest(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.error).toMatch(/format|bearer/i);
    }
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it('returns 401 when verifyIdToken throws (expired/invalid token)', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('Token expired'));
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { Authorization: 'Bearer expired-token' },
    });
    const result = await verifyAuthFromRequest(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.error).toMatch(/invalid|expired/i);
    }
    expect(mockVerifyIdToken).toHaveBeenCalledWith('expired-token');
  });

  it('returns ok with uid when token is valid', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: 'user-abc-123', email: 'a@b.com' });
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    });
    const result = await verifyAuthFromRequest(request);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.uid).toBe('user-abc-123');
    }
    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
  });

  it('throws config error (not 401) when FIREBASE_SERVICE_ACCOUNT_JSON is missing', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('firebase-admin/app', () => ({
        initializeApp: jest.fn(() => ({})),
        getApps: jest.fn(() => []),
        cert: jest.fn((sa) => sa),
      }));
      jest.doMock('firebase-admin/auth', () => ({
        getAuth: jest.fn(() => ({ verifyIdToken: jest.fn() })),
      }));

      const mod = await import('../firebase-admin');
      delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { Authorization: 'Bearer some-token' },
      });
      await expect(mod.verifyAuthFromRequest(request)).rejects.toThrow(
        /FIREBASE_SERVICE_ACCOUNT_JSON/
      );
    });
  });
});

describe('getProfileForUid', () => {
  beforeEach(() => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = FAKE_SERVICE_ACCOUNT;
    mockDoc.mockClear();
    mockDocGet.mockReset();
  });

  afterEach(() => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  });

  it('returns null when the financialProfile doc does not exist', async () => {
    mockDocGet.mockResolvedValueOnce({ exists: false, data: () => undefined });
    const result = await getProfileForUid('user-abc');
    expect(result).toBeNull();
    expect(mockDoc).toHaveBeenCalledWith('financialProfiles/user-abc');
  });

  it('returns the profile data when the doc exists', async () => {
    const fakeProfile = { monthlyIncome: 5000, riskTolerance: 'moderate' };
    mockDocGet.mockResolvedValueOnce({ exists: true, data: () => fakeProfile });
    const result = await getProfileForUid('user-abc');
    expect(result).toEqual(fakeProfile);
    expect(mockDoc).toHaveBeenCalledWith('financialProfiles/user-abc');
  });
});
