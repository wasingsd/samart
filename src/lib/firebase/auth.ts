import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./config";

// Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signUpWithEmail(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Google Sign-In (redirect flow)
 */
export async function signInWithGoogle() {
  await signInWithRedirect(auth, googleProvider);
}

export async function checkGoogleRedirectResult() {
  const credential = await getRedirectResult(auth);
  return credential?.user || null;
}

/**
 * LINE Login — redirect flow
 * LINE ใช้ OAuth2 redirect ไม่ใช่ Firebase provider
 * Flow: redirect → LINE auth → callback → get access token → exchange for Firebase custom token
 */
export function getLineLoginUrl() {
  const channelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID || "";
  const redirectUri = `${window.location.origin}/api/auth/line/callback`;
  const state = crypto.randomUUID(); // CSRF protection
  
  // Store state in sessionStorage for verification
  sessionStorage.setItem("line_login_state", state);
  
  return `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid%20email`;
}

/**
 * Sign in with Firebase custom token (used after LINE OAuth callback)
 */
export async function signInWithLineToken(customToken: string) {
  const credential = await signInWithCustomToken(auth, customToken);
  return credential.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
