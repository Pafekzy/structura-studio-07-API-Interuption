import { initializeApp, getApps, getApp, cert, applicationDefault, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let firebaseAdminApp: App | null = null;

export function getFirebaseAdmin(): App | null {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  // Check if credentials exist in environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Handle escaped newlines from environment strings
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    try {
      const apps = getApps();
      if (apps.length === 0) {
        firebaseAdminApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } else {
        firebaseAdminApp = getApp();
      }
      console.log('[FirebaseAdmin] Successfully initialized Firebase Admin SDK with Service Account credentials');
      return firebaseAdminApp;
    } catch (error) {
      console.warn('[FirebaseAdmin] Failed to initialize Firebase Admin with provided credentials:', error);
      return null;
    }
  }

  // Check if running in standard GCP environment with default credentials AND explicit Firebase project
  if (process.env.FIREBASE_PROJECT_ID && (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE)) {
    try {
      const apps = getApps();
      if (apps.length === 0) {
        firebaseAdminApp = initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
          credential: applicationDefault(),
        });
      } else {
        firebaseAdminApp = getApp();
      }
      console.log('[FirebaseAdmin] Initialized with Google Application Default Credentials');
      return firebaseAdminApp;
    } catch (e) {
      // Ignore fallback failure
    }
  }

  return null;
}

export function isFirebaseAdminAvailable(): boolean {
  return Boolean(getFirebaseAdmin());
}

export async function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken | null> {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) {
    return null;
  }
  try {
    const auth = getAuth(adminApp);
    const decoded = await auth.verifyIdToken(idToken);
    return decoded;
  } catch (error) {
    console.error('[FirebaseAdmin] Token verification failed:', error);
    return null;
  }
}

export function getFirebaseFirestore(): Firestore | null {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) return null;
  return getFirestore(adminApp);
}
