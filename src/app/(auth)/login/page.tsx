"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signInWithLineToken, checkGoogleRedirectResult } from "@/lib/firebase/auth";
import { trpc } from "@/lib/trpc/client";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle, signInWithLine } = useAuth();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  // Handle LINE OAuth callback token
  useEffect(() => {
    const token = searchParams.get("token");
    const lineStatus = searchParams.get("line");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        no_code: "LINE ไม่ได้ส่ง code กลับมา",
        not_configured: "ระบบ LINE Login ยังไม่ได้ตั้งค่า",
        token_failed: "ไม่สามารถเชื่อมต่อกับ LINE ได้",
        profile_failed: "ไม่สามารถดึงข้อมูลจาก LINE ได้",
        user_creation_failed: "ไม่สามารถสร้างบัญชีได้",
        unknown: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
      };
      setError(errorMessages[errorParam] || "เกิดข้อผิดพลาด");
      return;
    }

    if (token && lineStatus === "success") {
      setSocialLoading("line");
      signInWithLineToken(token)
        .then(async (user) => {
          // Check if user doc exists
          try {
            const me = await utils.auth.getMe.fetch();
            if (me) {
              router.push("/dashboard");
            } else {
              router.push("/register/complete");
            }
          } catch {
            router.push("/register/complete");
          }
        })
        .catch(() => {
          setError("ไม่สามารถเข้าสู่ระบบด้วย LINE ได้");
          setSocialLoading(null);
        });
    }
  }, [searchParams, router, utils]);

  // Handle Google OAuth redirect callback
  useEffect(() => {
    checkGoogleRedirectResult()
      .then(async (user) => {
        if (user) {
          setSocialLoading("google");
          try {
            const me = await utils.auth.getMe.fetch();
            if (me) {
              router.push("/dashboard");
            } else {
              router.push("/register/complete");
            }
          } catch {
            router.push("/register/complete");
          }
        }
      })
      .catch((err) => {
        // Ignored cross-origin or pop-up errors if user abandoned flow
        if (err.code !== "auth/redirect-cancelled-by-user") {
          setError("ไม่สามารถเข้าสู่ระบบด้วย Google ได้");
        }
      });
  }, [router, utils]);

  const emailError = touched.email && !email.trim()
    ? "กรุณากรอกอีเมล"
    : touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "รูปแบบอีเมลไม่ถูกต้อง"
      : null;

  const passwordError = touched.password && !password
    ? "กรุณากรอกรหัสผ่าน"
    : touched.password && password.length < 6
      ? "รหัสผ่านอย่างน้อย 6 ตัวอักษร"
      : null;

  const canSubmit = email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading("google");
    setError(null);
    try {
      await signInWithGoogle();
      // Code will stop here as the page redirects to Google
    } catch {
      setError("ไม่สามารถเตรียมระบบเข้าสู่ระบบด้วย Google ได้");
      setSocialLoading(null);
    }
  };

  const handleLineSignIn = () => {
    setSocialLoading("line");
    signInWithLine();
    // Will redirect away — no need to reset loading
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            className={`appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
              emailError
                ? "border-red-300 focus:ring-red-400"
                : "border-gray-200 focus:ring-[#00B4D8]/50"
            }`}
            placeholder="you@example.com"
          />
          {emailError && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {emailError}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            รหัสผ่าน
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            className={`appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
              passwordError
                ? "border-red-300 focus:ring-red-400"
                : "border-gray-200 focus:ring-[#00B4D8]/50"
            }`}
            placeholder="••••••••"
          />
          {passwordError && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {passwordError}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 bg-gray-50 text-[#00B4D8] focus:ring-[#00B4D8]/30 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
              จดจำฉันไว้
            </span>
          </label>
          <a
            href="#"
            className="text-sm font-medium text-[#00B4D8] hover:text-[#4DD0E1] transition-colors"
          >
            ลืมรหัสผ่าน?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !!socialLoading}
          className="w-full relative flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] via-[#283593] to-[#00B4D8] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/50 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังตรวจสอบ...
            </span>
          ) : (
            <span className="flex items-center gap-2 relative">
              เข้าสู่ระบบ
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-gray-400">
              หรือเข้าสู่ระบบด้วย
            </span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="mt-6 space-y-3">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={!!socialLoading || loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {socialLoading === "google" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
            )}
            Google
          </button>

          {/* LINE */}
          <button
            type="button"
            onClick={handleLineSignIn}
            disabled={!!socialLoading || loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#06C755] hover:bg-[#05B44C] focus:outline-none focus:ring-2 focus:ring-[#06C755]/50 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {socialLoading === "line" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M22.5 10.39c0-4.44-4.71-8.03-10.5-8.03S1.5 5.95 1.5 10.39c0 3.98 3.73 7.33 8.86 7.94.34.07.82.22.94.52.12.3-.04.75-.12 1.18 0 0-.25 1.13-.3 1.34-.09.38.39.54.71.36.32-.18 3.51-1.77 6.36-4.5 2.82-2.73 4.55-5.36 4.55-6.84z" />
              </svg>
            )}
            Line
          </button>
        </div>
      </div>

      {/* Register link */}
      <div className="mt-6 text-center text-sm text-gray-500">
        ยังไม่มีบัญชี?{" "}
        <Link
          href="/register"
          className="font-medium text-[#00B4D8] hover:text-[#4DD0E1] transition-colors underline underline-offset-4"
        >
          สมัครใช้งานฟรี
        </Link>
      </div>
    </div>
  );
}
