"use client";

import { AuthProvider } from "@/contexts/AuthProvider";
import { TRPCProvider } from "./TRPCProvider";

/**
 * Root Providers — ครอบทุก client-side context
 * AuthProvider → TRPCProvider (ต้องมี auth ก่อนเพื่อส่ง token)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TRPCProvider>{children}</TRPCProvider>
    </AuthProvider>
  );
}
