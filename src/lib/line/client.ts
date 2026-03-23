/**
 * LINE Messaging API Client
 * Wrapper สำหรับ REST API ของ LINE
 */

const LINE_API_BASE = "https://api.line.me/v2/bot";

interface LineProfile {
  displayName: string;
  userId: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * ดึงข้อมูล profile ของ user จาก LINE
 */
export async function getLineProfile(
  userId: string,
  accessToken: string
): Promise<LineProfile | null> {
  try {
    const res = await fetch(`${LINE_API_BASE}/profile/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * ทดสอบ LINE credentials โดยเรียก bot info endpoint
 */
export async function testLineConnection(accessToken: string): Promise<{
  success: boolean;
  botName?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${LINE_API_BASE}/info`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { success: true, botName: data.displayName || data.basicId };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
