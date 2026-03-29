"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { checkGoogleRedirectResult } from "@/lib/firebase/auth";
import { trpc } from "@/lib/trpc/client";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithLine } = useAuth();
  const createUser = trpc.auth.createUserDoc.useMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkGoogleRedirectResult()
      .then((user) => {
        if (user) {
          setSocialLoading("google");
          router.push("/register/complete");
        }
      })
      .catch((err) => {
        if (err.code !== "auth/redirect-cancelled-by-user") {
          setError("ไม่สามารถเข้าสู่ระบบด้วย Google ได้");
        }
      });
  }, [router]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "กรุณากรอกชื่อ";
    if (!email.trim()) errors.email = "กรุณากรอกอีเมล";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!password) errors.password = "กรุณากรอกรหัสผ่าน";
    else if (password.length < 6) errors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
    validate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!validate()) return;

    setLoading(true);
    setError(null);
    try {
      const user = await signUp(email, password);
      if (user) {
        await createUser.mutateAsync({
          uid: user.uid,
          email: user.email || email,
          displayName: name,
        });
      }
      router.push("/onboarding");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสมัครสมาชิก";
      if (message.includes("email-already-in-use")) {
        setError("อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setSocialLoading("google");
    setError(null);
    try {
      await signInWithGoogle();
      // Code stops here because of redirect
    } catch {
      setError("ไม่สามารถเริ่มการสมัครด้วย Google ได้");
      setSocialLoading(null);
    }
  };

  const handleLineSignUp = () => {
    setSocialLoading("line");
    signInWithLine();
    // LINE redirects away, and on callback will check user doc → redirect to /register/complete if new
  };

  const inputClass = (field: string) =>
    `appearance-none block w-full px-4 py-3 rounded-xl shadow-sm placeholder-gray-400 bg-gray-50 text-gray-900 focus:outline-none transition-all ${
      touched[field] && fieldErrors[field]
        ? "border border-red-300 focus:ring-2 focus:ring-red-400"
        : "border border-gray-200 focus:ring-2 focus:ring-[#00B4D8]/50 focus:border-[#00B4D8]/60"
    }`;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            ชื่อ - นามสกุล
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleBlur("name")}
            className={inputClass("name")}
            placeholder="ชื่อร้าน หรือ ชื่อของคุณ"
          />
          {touched.name && fieldErrors.name && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {fieldErrors.name}
            </p>
          )}
        </div>

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
            onBlur={() => handleBlur("email")}
            className={inputClass("email")}
            placeholder="you@example.com"
          />
          {touched.email && fieldErrors.email && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {fieldErrors.email}
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur("password")}
            className={inputClass("password")}
            placeholder="อย่างน้อย 6 ตัวอักษร"
          />
          {touched.password && fieldErrors.password && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {fieldErrors.password}
            </p>
          )}
          {/* Password strength indicator */}
          {password.length > 0 && (
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    password.length >= i * 3
                      ? password.length >= 12
                        ? "bg-emerald-500"
                        : password.length >= 8
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Server error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100 flex items-start gap-2 animate-in fade-in duration-300">
            <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || createUser.isPending || !!socialLoading}
          className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-blue-500/20 text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00B4D8] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading || createUser.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังสร้างบัญชี...
            </span>
          ) : (
            <span className="flex items-center">
              สมัครสมาชิกฟรี
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
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
            <span className="px-2 bg-white text-gray-400">หรือลงทะเบียนด้วย</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={!!socialLoading || loading}
            className="w-full inline-flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-sm bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-100 hover:border-gray-300 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            onClick={handleLineSignUp}
            disabled={!!socialLoading || loading}
            className="w-full inline-flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#06C755] hover:bg-[#05B44C] focus:outline-none focus:ring-2 focus:ring-[#06C755]/50 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="mt-6 text-center text-sm text-gray-500">
        มีบัญชีใช้งานอยู่แล้ว?{" "}
        <Link href="/login" className="font-medium text-[#00B4D8] hover:text-[#4DD0E1] transition-colors underline underline-offset-4">
          เข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}
