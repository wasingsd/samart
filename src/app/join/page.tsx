"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Users, ArrowRight, ArrowLeft } from "lucide-react";

export default function JoinShopPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const joinMutation = trpc.shop.joinShop.useMutation({
    onSuccess: (data) => {
      alert(`ยินดีต้อนรับสู่ร้าน ${data.shopName}!`);
      // Force hard navigation to reload layout states cleanly
      window.location.href = "/dashboard";
    },
    onError: (err) => {
      setError(err.message || "รหัสเชิญไม่ถูกต้อง");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim().length === 0) return;
    setError(null);
    joinMutation.mutate({ inviteCode: inviteCode.trim() });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50 relative flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle decorative blobs */}
      <div className="absolute top-[-10%] right-[-8%] w-[35%] h-[35%] bg-[#00B4D8] rounded-full blur-[180px] opacity-[0.06] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-8%] w-[30%] h-[30%] bg-[#1A237E] rounded-full blur-[180px] opacity-[0.05] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col">
        <button 
          onClick={() => router.push("/onboarding")} 
          className="mb-8 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" /> กลับไปหน้าสร้างร้าน
        </button>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 p-8 sm:p-10 border border-gray-100 w-full text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-[#1A237E]" />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
            เข้าร่วมทีมงาน
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            กรุณากรอกรหัสเชิญ 6 หลักที่คุณได้รับจากเจ้าของร้าน เพื่อเข้าถึงและบริหารจัดการร้านค้าร่วมกัน
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                maxLength={6}
                className="w-full text-center text-3xl tracking-[0.5em] font-display font-bold text-[#1A237E] bg-gray-50 border-2 border-gray-200 rounded-2xl py-4 focus:outline-none focus:border-[#1A237E] focus:bg-white transition-all placeholder:text-gray-300"
              />
            </div>

            <button
              type="submit"
              disabled={joinMutation.isPending || inviteCode.length < 5}
              className="w-full bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 text-white py-4 rounded-2xl text-base font-semibold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {joinMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>เข้าร่วมทีมเลย <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
