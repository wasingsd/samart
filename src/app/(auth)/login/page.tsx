"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

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
    } catch (err: any) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
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
            className={`appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-500 bg-white/[0.04] text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
              emailError
                ? "border-red-500/60 focus:ring-red-500/40"
                : "border-white/10 focus:ring-[#00B4D8]/50"
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
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
            className={`appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-500 bg-white/[0.04] text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
              passwordError
                ? "border-red-500/60 focus:ring-red-500/40"
                : "border-white/10 focus:ring-[#00B4D8]/50"
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
          <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#00B4D8] focus:ring-[#00B4D8]/30 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
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
          disabled={loading}
          className="w-full relative flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] via-[#283593] to-[#00B4D8] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/50 focus:ring-offset-2 focus:ring-offset-[#131B2F] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
        >
          {/* Subtle shimmer effect */}
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
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-[#131B2F] text-gray-500">
              หรือเข้าสู่ระบบด้วย
            </span>
          </div>
        </div>

        {/* LINE Login */}
        <div className="mt-6">
          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#06C755] hover:bg-[#05B44C] focus:outline-none focus:ring-2 focus:ring-[#06C755]/50 focus:ring-offset-2 focus:ring-offset-[#131B2F] transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M22.5 10.39c0-4.44-4.71-8.03-10.5-8.03S1.5 5.95 1.5 10.39c0 3.98 3.73 7.33 8.86 7.94.34.07.82.22.94.52.12.3-.04.75-.12 1.18 0 0-.25 1.13-.3 1.34-.09.38.39.54.71.36.32-.18 3.51-1.77 6.36-4.5 2.82-2.73 4.55-5.36 4.55-6.84z" />
            </svg>
            Line
          </button>
        </div>
      </div>

      {/* Register link */}
      <div className="mt-6 text-center text-sm text-gray-400">
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

