import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * LINE OAuth2 Callback
 * GET /api/auth/line/callback?code=xxx&state=xxx
 *
 * Flow:
 * 1. Exchange code for access token
 * 2. Get LINE profile
 * 3. Create/update Firebase user
 * 4. Create Firebase custom token
 * 5. Redirect to app with custom token
 */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", req.url));
    }

    const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
    const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;

    if (!channelId || !channelSecret) {
      console.error("LINE Login credentials not configured");
      return NextResponse.redirect(new URL("/login?error=not_configured", req.url));
    }

    // 1. Exchange code for access token
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${req.nextUrl.origin}/api/auth/line/callback`,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    });

    if (!tokenRes.ok) {
      console.error("LINE token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(new URL("/login?error=token_failed", req.url));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Get LINE profile
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      console.error("LINE profile fetch failed");
      return NextResponse.redirect(new URL("/login?error=profile_failed", req.url));
    }

    const profile = await profileRes.json();
    const lineUserId = profile.userId;
    const displayName = profile.displayName || "LINE User";
    const pictureUrl = profile.pictureUrl || "";

    // 3. Create or get Firebase user
    const adminAuth = getAdminAuth();
    let firebaseUid: string;
    let isNewUser = false;

    try {
      // Check if user exists with this LINE ID
      const existingUser = await getDb()
        .collection("users")
        .where("lineUserId", "==", lineUserId)
        .limit(1)
        .get();

      if (!existingUser.empty) {
        // Existing user — use their Firebase UID
        firebaseUid = existingUser.docs[0].id;
      } else {
        // New user — create Firebase Auth user only (user doc created in complete profile)
        const fbUser = await adminAuth.createUser({
          displayName,
          photoURL: pictureUrl,
        });
        firebaseUid = fbUser.uid;
        isNewUser = true;
      }
    } catch (error) {
      console.error("Firebase user creation error:", error);
      return NextResponse.redirect(new URL("/login?error=user_creation_failed", req.url));
    }

    // 4. Create Firebase custom token
    const customToken = await getAdminAuth().createCustomToken(firebaseUid);

    // 5. Redirect: new users → complete profile, existing → login
    const redirectPath = isNewUser ? "/register/complete" : "/login";
    const redirectUrl = new URL(redirectPath, req.url);
    redirectUrl.searchParams.set("token", customToken);
    redirectUrl.searchParams.set("line", "success");

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("LINE callback error:", error);
    return NextResponse.redirect(new URL("/login?error=unknown", req.url));
  }
}
