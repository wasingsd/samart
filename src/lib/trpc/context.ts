import { adminAuth } from "@/lib/firebase/admin";
import type { DecodedIdToken } from "firebase-admin/auth";

export interface Context {
  user: DecodedIdToken | null;
}

/**
 * สร้าง context จาก Authorization header
 * ทุก tRPC request จะผ่านฟังก์ชันนี้
 */
export async function createContext(opts: {
  headers: Headers;
}): Promise<Context> {
  const authHeader = opts.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null };
  }

  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    return { user: decoded };
  } catch {
    return { user: null };
  }
}
