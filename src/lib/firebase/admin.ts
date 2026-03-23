import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const isAdminConfigured = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY
);

function initAdmin(): App | null {
  // Firebase Admin ใช้ได้เฉพาะ server-side เท่านั้น
  if (typeof window !== "undefined") return null;
  if (!isAdminConfigured) {
    console.warn("⚠️ Firebase Admin credentials ยังไม่ได้ตั้งค่า — tRPC protected routes จะ error");
    return null;
  }

  if (getApps().length > 0) {
    return getApps()[0];
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const app = initAdmin();

// Export with null safety — callers should check before use
export const adminAuth: Auth | null = app ? getAuth(app) : null;
export const adminDb: Firestore | null = app ? getFirestore(app) : null;

/**
 * Helper: ดึง Firestore instance — throw ถ้ายังไม่ configured
 * ใช้ใน tRPC routers แทน adminDb ตรงๆ
 */
export function getDb(): Firestore {
  if (!adminDb) {
    throw new Error(
      "Firebase Admin ยังไม่ได้ตั้งค่า — กรุณาเพิ่ม FIREBASE_ADMIN_* ใน .env.local"
    );
  }
  return adminDb;
}

/**
 * Helper: ดึง Auth instance — throw ถ้ายังไม่ configured
 */
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    throw new Error(
      "Firebase Admin ยังไม่ได้ตั้งค่า — กรุณาเพิ่ม FIREBASE_ADMIN_* ใน .env.local"
    );
  }
  return adminAuth;
}

