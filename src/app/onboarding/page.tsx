"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/hooks/useAuth";
import { StepShopInfo } from "@/components/onboarding/StepShopInfo";
import { StepAISetup } from "@/components/onboarding/StepAISetup";
import { StepScheduleMenu } from "@/components/onboarding/StepScheduleMenu";
import { Loader2 } from "lucide-react";

// Define the shape of the gathered onboarding data
export type OnboardingData = {
  // Step 1: Shop
  name: string;
  category: "restaurant" | "retail" | "service" | "other";
  phone: string;
  address: string;
  logoURL?: string;

  // Step 2: AI
  botName: string;
  formalityLevel: number; // 0-100
  emojiUsage: "none" | "some" | "lots";
  replyLength: "short" | "medium" | "long";
  language: "thai" | "mixed" | "english";
  openingGreeting: string;
  closingPhrase: string;

  // Step 3: Hours
  businessHours: any; // Using any for simplicity here, will match Zod schema before sending
};

const initialData: OnboardingData = {
  name: "",
  category: "restaurant",
  phone: "",
  address: "",
  botName: "SAMART",
  formalityLevel: 50,
  emojiUsage: "some",
  replyLength: "medium",
  language: "thai",
  openingGreeting: "สวัสดีค่ะ ยินดีต้อนรับ",
  closingPhrase: "ขอบคุณที่ใช้บริการค่ะ",
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

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createShopMutation = trpc.shop.create.useMutation({
    onSuccess: () => {
      // Upon successful shop creation, navigate to the main dashboard
      router.push("/dashboard");
    },
    onError: (err) => {
      setError(err.message || "เกิดข้อผิดพลาดในการสร้างร้านค้า");
      setIsSubmitting(false);
    },
  });

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));
  
  const updateFields = (fields: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createShopMutation.mutateAsync({
        name: formData.name,
        category: formData.category,
        phone: formData.phone,
        address: formData.address,
        businessHours: formData.businessHours,
        styleProfile: {
          botName: formData.botName,
          formalityLevel: formData.formalityLevel,
          emojiUsage: formData.emojiUsage,
          replyLength: formData.replyLength,
          language: formData.language,
          openingGreeting: formData.openingGreeting,
          closingPhrase: formData.closingPhrase,
          guardrails: [], // default empty guardrails
        },
      });
    } catch (e) {
      // Error handled by trpc onError hook above
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface relative flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary-container/10 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-3xl relative z-10 flex flex-col">
        {/* Header Setup */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg mb-6">
            <span className="text-on-primary font-display font-bold text-2xl tracking-wider">SM</span>
          </div>
          <h1 className="text-display-sm font-display font-bold text-on-surface mb-2">
            ตั้งค่าผู้ช่วย AI ของคุณ
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-xl text-center">
            สร้างระบบ AI ฉลาดๆ ที่จะช่วยดูแลร้าน ตอบลูกค้า และจัดการสต็อกแทนคุณใน 3 ขั้นตอน
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="mb-10 w-full flex items-center justify-between relative px-2">
          <div className="absolute inset-x-2 top-1/2 h-1 bg-surface-container-high -z-10 -translate-y-1/2 rounded-full" />
          <div 
            className="absolute left-2 top-1/2 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `calc(${((step - 1) / 2) * 100}% - 16px)` }}
          />
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-label-md font-bold transition-colors duration-300 ${
                step >= i 
                ? 'bg-primary text-on-primary shadow-md' 
                : 'bg-surface-container-high text-outline'
              }`}
            >
              {i}
            </div>
          ))}
        </div>

        {/* Step Container */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-[0_20px_40px_rgba(27,27,33,0.06)] p-8 sm:p-12 border border-outline-variant/15 w-full">
          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-8 flex items-start">
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
          
          <div className="min-h-[400px]">
            {step === 1 && (
              <StepShopInfo 
                data={formData} 
                updateFields={updateFields} 
              />
            )}
            {step === 2 && (
              <StepAISetup 
                data={formData} 
                updateFields={updateFields} 
              />
            )}
            {step === 3 && (
              <StepScheduleMenu 
                data={formData} 
                updateFields={updateFields} 
              />
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-surface-dim flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1 || isSubmitting}
              className={`px-6 py-3 rounded-xl text-label-md font-medium tracking-wide transition-colors ${
                step === 1 
                ? 'text-outline/50 cursor-not-allowed' 
                : 'text-primary hover:bg-surface-container-low'
              }`}
            >
              ย้อนกลับ
            </button>
            <button
              onClick={step === 3 ? handleFinish : handleNext}
              disabled={isSubmitting || (step === 1 && (!formData.name || !formData.phone))}
              className="bg-primary hover:bg-primary-fixed-variant text-on-primary px-8 py-3 rounded-xl text-label-md font-medium tracking-wide transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step === 3 ? (
                "เสร็จสิ้น"
              ) : (
                "ถัดไป"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
