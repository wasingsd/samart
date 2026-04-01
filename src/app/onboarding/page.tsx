"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/hooks/useAuth";
import { StepShopInfo } from "@/components/onboarding/StepShopInfo";
import { StepAISetup } from "@/components/onboarding/StepAISetup";
import { StepScheduleMenu } from "@/components/onboarding/StepScheduleMenu";
import { Loader2, Store, Bot, Clock, Check } from "lucide-react";

// Define the shape of the gathered onboarding data
export type OnboardingData = {
  name: string;
  category: "restaurant" | "retail" | "service" | "other";
  phone: string;
  address: string;
  logoURL?: string;
  botName: string;
  formalityLevel: number;
  emojiUsage: "none" | "some" | "lots";
  replyLength: "short" | "medium" | "long";
  language: "thai" | "mixed" | "english";
  openingGreeting: string;
  closingPhrase: string;
  businessHours: any;
};

const initialData: OnboardingData = {
  name: "", category: "restaurant", phone: "", address: "",
  botName: "SAMART", formalityLevel: 50, emojiUsage: "some",
  replyLength: "medium", language: "thai",
  openingGreeting: "สวัสดีค่ะ ยินดีต้อนรับ", closingPhrase: "ขอบคุณที่ใช้บริการค่ะ",
  businessHours: {
    monday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
    tuesday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
    wednesday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
    thursday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
    friday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
    saturday: { isOpen: true, openTime: "09:00", closeTime: "21:00" },
    sunday: { isOpen: true, openTime: "09:00", closeTime: "21:00" },
  },
};

const STEPS = [
  { id: 1, label: "ข้อมูลร้าน", icon: Store },
  { id: 2, label: "ตั้งค่า AI", icon: Bot },
  { id: 3, label: "เวลาทำการ", icon: Clock },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createShopMutation = trpc.shop.create.useMutation({
    onSuccess: () => router.push("/dashboard"),
    onError: (err) => { setError(err.message || "เกิดข้อผิดพลาดในการสร้างร้านค้า"); setIsSubmitting(false); },
  });

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));
  const updateFields = (fields: Partial<OnboardingData>) => setFormData((prev) => ({ ...prev, ...fields }));

  const handleFinish = async () => {
    setIsSubmitting(true); setError(null);
    try {
      // Transform openTime/closeTime → open/close to match Zod schema
      const transformedHours: Record<string, { open: string; close: string; isOpen: boolean }> = {};
      for (const [day, val] of Object.entries(formData.businessHours)) {
        const v = val as { openTime: string; closeTime: string; isOpen: boolean };
        transformedHours[day] = { open: v.openTime, close: v.closeTime, isOpen: v.isOpen };
      }
      await createShopMutation.mutateAsync({
        name: formData.name, category: formData.category, phone: formData.phone,
        address: formData.address, businessHours: transformedHours as any,
        styleProfile: { botName: formData.botName, formalityLevel: formData.formalityLevel, emojiUsage: formData.emojiUsage, replyLength: formData.replyLength, language: formData.language, openingGreeting: formData.openingGreeting, closingPhrase: formData.closingPhrase, guardrails: [] },
      });
    } catch { /* handled by onError */ }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50 relative flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle decorative blobs */}
      <div className="absolute top-[-10%] right-[-8%] w-[35%] h-[35%] bg-[#00B4D8] rounded-full blur-[180px] opacity-[0.06] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-8%] w-[30%] h-[30%] bg-[#1A237E] rounded-full blur-[180px] opacity-[0.05] pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10 flex flex-col">
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A237E] to-[#00B4D8] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
            <span className="text-white font-display font-bold text-2xl tracking-wider">S</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-2">
            ตั้งค่าผู้ช่วย AI ของคุณ
          </h1>
          <p className="text-gray-500 max-w-xl text-center">
            สร้างระบบ AI ฉลาดๆ ที่จะช่วยดูแลร้าน ตอบลูกค้า และจัดการสต็อกแทนคุณใน 3 ขั้นตอน
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="mb-10 w-full flex items-center justify-between relative px-4">
          <div className="absolute inset-x-4 top-1/2 h-1 bg-gray-200 -translate-y-1/2 rounded-full" />
          <div className="absolute left-4 top-1/2 h-1 bg-gradient-to-r from-[#1A237E] to-[#00B4D8] -translate-y-1/2 rounded-full transition-all duration-500 ease-out" style={{ width: `calc(${((step - 1) / 2) * 100}% - 32px)` }} />
          {STEPS.map(({ id, label, icon: Icon }) => (
            <div key={id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= id ? "bg-gradient-to-br from-[#1A237E] to-[#00B4D8] text-white shadow-md shadow-blue-500/30" : "bg-white text-gray-400 border-2 border-gray-200"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-medium transition-colors ${step >= id ? "text-[#1A237E]" : "text-gray-400"}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Step Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 p-8 sm:p-12 border border-gray-100 w-full">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 flex items-center gap-2 border border-red-100">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
          <div className="min-h-[400px]">
            {step === 1 && <StepShopInfo data={formData} updateFields={updateFields} />}
            {step === 2 && <StepAISetup data={formData} updateFields={updateFields} />}
            {step === 3 && <StepScheduleMenu data={formData} updateFields={updateFields} />}
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
            <button onClick={handleBack} disabled={step === 1 || isSubmitting} className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${step === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}>ย้อนกลับ</button>
            <button onClick={step === 3 ? handleFinish : handleNext} disabled={isSubmitting || (step === 1 && (!formData.name || !formData.phone))} className="bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[140px] justify-center gap-2 group">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : step === 3 ? <><Check className="w-4 h-4" /> เริ่มใช้งาน</> : <>ถัดไป <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
