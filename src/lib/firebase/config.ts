import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

/**
 * ตรวจว่า Firebase config พร้อมใช้หรือยัง
 * ถ้ายังไม่ได้ตั้งค่า → ใช้ demo mode เพื่อไม่ให้ app crash
 */
export const isFirebaseConfigured = Boolean(apiKey && apiKey.length > 0);

const firebaseConfig = {
  apiKey: apiKey || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000:web:000",
};

// Initialize Firebase (prevent duplicate initialization)
let app: FirebaseApp;
if (getApps().length > 0) {
  app = getApps()[0];
} else {
  app = initializeApp(firebaseConfig);
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

if (!isFirebaseConfigured && typeof window !== "undefined") {
  console.warn(
    "⚠️ Firebase API key ยังไม่ได้ตั้งค่า — กรุณาเพิ่มใน .env.local\n" +
    "   ดูตัวอย่างใน .env.example"
  );
}

export default app;
