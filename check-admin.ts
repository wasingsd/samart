import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { config } from "dotenv";

config({ path: ".env.local" });

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

try {
  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });

  getAuth(app)
    .listUsers(1)
    .then(() => {
      console.log("✅ Admin SDK works!");
    })
    .catch((e) => {
      console.error("❌ Auth Error:", e.message);
    });
} catch (e: any) {
  console.error("❌ Init Error:", e.message);
}
