/**
 * Firebase Admin SDK singleton + ID-token verification + server-side
 * profile fetch helpers. Used by /api/chat (Phase 1.5) and the rewritten
 * Gemini Live endpoint (Phase 8).
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let cachedApp: App | undefined;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;

  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON env var is required for server-side auth verification'
    );
  }

  let serviceAccount: Record<string, unknown>;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }

  cachedApp = initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
  });
  return cachedApp;
}

export type AuthResult =
  | { ok: true; uid: string }
  | { ok: false; status: 401; error: string };

export async function verifyAuthFromRequest(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return { ok: false, status: 401, error: 'Missing Authorization header' };
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    return { ok: false, status: 401, error: 'Authorization header must use Bearer format' };
  }

  const token = match[1];

  try {
    const auth = getAuth(getAdminApp());
    const decoded = await auth.verifyIdToken(token);
    return { ok: true, uid: decoded.uid };
  } catch {
    return { ok: false, status: 401, error: 'Invalid or expired ID token' };
  }
}

export async function getProfileForUid(uid: string): Promise<Record<string, unknown> | null> {
  const db = getFirestore(getAdminApp());
  const snap = await db.doc(`financialProfiles/${uid}`).get();
  if (!snap.exists) return null;
  return (snap.data() ?? null) as Record<string, unknown> | null;
}
