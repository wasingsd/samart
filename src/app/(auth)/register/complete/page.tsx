"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth as useAuthContext } from "@/contexts/AuthProvider";
import {
  EmailAuthProvider,
  linkWithCredential,
  updateProfile,
} from "firebase/auth";
import { signInWithLineToken } from "@/lib/firebase/auth";
import { trpc } from "@/lib/trpc/client";
import { Loader2, UserCircle, Lock, ArrowRight } from "lucide-react";

/**
 * Complete Profile Page
 * แสดงหลัง social login (Google/LINE) เพื่อให้ user กรอกชื่อ + ตั้งรหัสผ่าน
 * จะ link email/password credential เข้ากับ social account
 */
export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <CompleteProfileContent />
    </Suspense>
  );
}

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuthContext();
  const createUser = trpc.auth.createUserDoc.useMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [signingIn, setSigningIn] = useState(false);

  // Handle LINE callback token (auto sign-in with custom token)
  useEffect(() => {
    const token = searchParams.get("token");
    const lineStatus = searchParams.get("line");
    if (token && lineStatus === "success" && !user && !signingIn) {
      setSigningIn(true);
      signInWithLineToken(token).catch(() => {
        router.push("/register");
      });
    }
  }, [searchParams, user, signingIn, router]);

  // Pre-fill from social profile
  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Redirect if not logged in (and not in the process of signing in)
  useEffect(() => {
    const hasToken = searchParams.get("token");
    if (!authLoading && !user && !hasToken && !signingIn) {
      router.push("/register");
    }
  }, [authLoading, user, router, searchParams, signingIn]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "กรุณากรอกชื่อ";
    if (!email.trim()) errors.email = "กรุณากรอกอีเมล";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!password) errors.password = "กรุณากรอกรหัสผ่าน";
    else if (password.length < 6) errors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    if (password !== confirmPassword) errors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    return errors;
  };

  const errors = validate();
  const canSubmit = Object.keys(errors).length === 0 && name && email && password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (!canSubmit || !user) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Link email/password credential to the social account
      const credential = EmailAuthProvider.credential(email, password);
      try {
        await linkWithCredential(user, credential);
      } catch (linkError: any) {
        // If email already linked or provider already exists, continue
        if (linkError.code !== "auth/provider-already-linked" &&
            linkError.code !== "auth/email-already-in-use") {
          throw linkError;
        }
      }

      // 2. Update display name
      await updateProfile(user, { displayName: name });

      // 3. Create user doc in Firestore
      await createUser.mutateAsync({
        uid: user.uid,
        email: email,
        displayName: name,
      });

      // 4. Redirect to onboarding
      router.push("/onboarding");
    } catch (err: any) {
      console.error("Complete profile error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น");
      } else if (err.code === "auth/weak-password") {
        setError("รหัสผ่านไม่ปลอดภัยพอ กรุณาใช้รหัสผ่านที่ซับซ้อนขึ้น");
      } else {
        setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const providerName = user?.providerData?.[0]?.providerId === "google.com" ? "Google" : "LINE";

  const inputClass = (field: string) =>
    `appearance-none block w-full px-4 py-3 rounded-xl shadow-sm placeholder-gray-400 bg-gray-50 text-gray-900 focus:outline-none transition-all ${
      touched[field] && errors[field]
        ? "border border-red-300 focus:ring-2 focus:ring-red-400"
        : "border border-gray-200 focus:ring-2 focus:ring-[#00B4D8]/50 focus:border-[#00B4D8]/60"
    }`;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Social profile badge */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 mb-6">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-blue-600" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-blue-700">
            เชื่อมต่อ {providerName} สำเร็จ ✓
          </p>
          <p className="text-xs text-gray-500">
            กรุณากรอกข้อมูลเพิ่มเติมเพื่อสร้างบัญชี
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            ชื่อ - นามสกุล
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            className={inputClass("name")}
            placeholder="ชื่อร้าน หรือ ชื่อของคุณ"
          />
          {touched.name && errors.name && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            อีเมล (ใช้เข้าสู่ระบบ)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            className={inputClass("email")}
            placeholder="you@example.com"
          />
          {touched.email && errors.email && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errors.email}
            </p>
          )}
          {user?.email && (
            <p className="mt-1 text-[11px] text-gray-500">
              ดึงจาก {providerName}: {user.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            <Lock className="inline w-3.5 h-3.5 mr-1" />
            ตั้งรหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            className={inputClass("password")}
            placeholder="อย่างน้อย 6 ตัวอักษร"
          />
          {touched.password && errors.password && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errors.password}
            </p>
          )}
          {password.length > 0 && (
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  password.length >= i * 3
                    ? password.length >= 12 ? "bg-emerald-500" : password.length >= 8 ? "bg-yellow-500" : "bg-red-500"
                    : "bg-gray-200"
                }`} />
              ))}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
            ยืนยันรหัสผ่าน
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
            className={inputClass("confirmPassword")}
            placeholder="กรอกรหัสผ่านอีกครั้ง"
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errors.confirmPassword}
            </p>
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
          disabled={loading || createUser.isPending}
          className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-md shadow-blue-500/20 text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading || createUser.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังสร้างบัญชี...
            </>
          ) : (
            <>
              สร้างบัญชี
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
