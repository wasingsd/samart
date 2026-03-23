"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
// NOTE: Assuming trpc client is setup at "@/lib/trpc/client"
import { trpc } from "@/lib/trpc/client";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  
  // We'll catch if trpc isn't fully ready but assume standard structure
  const createUser = trpc.auth.createUserDoc.useMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await signUp(email, password);
      // Wait for firebase auth to settle, then create user doc
      if (user) {
        await createUser.mutateAsync({
          uid: user.uid,
          email: user.email || email,
          displayName: name,
        });
      }
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">
            ชื่อ - นามสกุล
          </label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="appearance-none block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-sm placeholder-gray-500 bg-[#0A0F1F]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent transition-all hover:bg-[#0A0F1F]"
              placeholder="ชื่อร้าน หรือ ชื่อของคุณ"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            อีเมล
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-sm placeholder-gray-500 bg-[#0A0F1F]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent transition-all hover:bg-[#0A0F1F]"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            รหัสผ่าน
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-sm placeholder-gray-500 bg-[#0A0F1F]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent transition-all hover:bg-[#0A0F1F]"
              placeholder="อย่างน้อย 6 ตัวอักษร"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
            {error}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading || createUser.isPending}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/20 text-sm font-semibold text-white bg-gradient-to-r from-[#2D9C5A] to-[#10B981] hover:from-[#218048] hover:to-[#059669] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#10B981] focus:ring-offset-[#131B2F] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading || createUser.isPending ? (
              <span className="animate-pulse">กำลังสร้างบัญชี...</span>
            ) : (
              <span className="flex items-center">
                สมัครสมาชิกฟรี
                <svg
                  className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#131B2F] text-gray-500">
              หรือลงทะเบียนด้วย
            </span>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            className="w-full inline-flex justify-center py-3 px-4 rounded-xl shadow-sm bg-[#0A0F1F] border border-gray-700 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none transition-all hover:border-gray-500"
          >
            <span className="font-bold flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Google
            </span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-400">
        มีบัญชีใช้งานอยู่แล้ว?{" "}
        <Link href="/login" className="font-medium text-[#00B4D8] hover:text-[#4DD0E1] transition-colors underline underline-offset-4">
          เข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}
