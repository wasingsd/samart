import { OnboardingData } from "@/app/onboarding/page";
import { Clock, Info } from "lucide-react";

interface Props { data: OnboardingData; updateFields: (fields: Partial<OnboardingData>) => void; }

const DAYS = [
  { key: "monday", label: "จันทร์" }, { key: "tuesday", label: "อังคาร" },
  { key: "wednesday", label: "พุธ" }, { key: "thursday", label: "พฤหัสบดี" },
  { key: "friday", label: "ศุกร์" }, { key: "saturday", label: "เสาร์" },
  { key: "sunday", label: "อาทิตย์" },
] as const;

export function StepScheduleMenu({ data, updateFields }: Props) {
  const handleToggleDay = (dayKey: string, isOpen: boolean) => {
    updateFields({ businessHours: { ...data.businessHours, [dayKey]: { ...data.businessHours[dayKey], isOpen } } });
  };
  const handleTimeChange = (dayKey: string, field: "openTime" | "closeTime", value: string) => {
    updateFields({ businessHours: { ...data.businessHours, [dayKey]: { ...data.businessHours[dayKey], [field]: value } } });
  };

  return (
    <div className="flex flex-col gap-8 fade-in">
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#00B4D8]" /> เวลาเปิดทำการ
        </h2>
        <p className="text-sm text-gray-500">AI จะแจ้งลูกค้าว่าร้านเปิดหรือปิด และรับ order เฉพาะในช่วงเวลาที่คุณกำหนด</p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100">
        <div className="grid grid-cols-12 gap-4 pb-4 border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:grid">
          <div className="col-span-4">วัน</div>
          <div className="col-span-8 text-center">เวลาทำการ</div>
        </div>
        <div className="space-y-2 mt-2">
          {DAYS.map((day) => {
            const dayData = data.businessHours[day.key];
            return (
              <div key={day.key} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center p-3 rounded-xl hover:bg-white transition-colors">
                <div className="col-span-4 flex items-center gap-3">
                  <button type="button" onClick={() => handleToggleDay(day.key, !dayData.isOpen)} className={`relative w-11 h-6 rounded-full transition-colors ${dayData.isOpen ? "bg-[#00B4D8]" : "bg-gray-300"}`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${dayData.isOpen ? "translate-x-5" : ""}`} />
                  </button>
                  <span className={`font-medium text-sm ${dayData.isOpen ? "text-gray-900" : "text-gray-400"}`}>{day.label}</span>
                </div>
                <div className="col-span-8 flex items-center justify-center sm:justify-start gap-2">
                  {dayData.isOpen ? (
                    <>
                      <input type="time" value={dayData.openTime} onChange={(e) => handleTimeChange(day.key, "openTime", e.target.value)} className="bg-white text-gray-900 p-2 rounded-lg border border-gray-200 focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8] outline-none font-medium text-sm w-32" />
                      <span className="text-gray-400 font-medium px-1">–</span>
                      <input type="time" value={dayData.closeTime} onChange={(e) => handleTimeChange(day.key, "closeTime", e.target.value)} className="bg-white text-gray-900 p-2 rounded-lg border border-gray-200 focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8] outline-none font-medium text-sm w-32" />
                    </>
                  ) : (
                    <span className="text-xs text-red-500 font-medium px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">ปิดทำการ</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <Info className="w-5 h-5 text-[#00B4D8] shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600">
          <strong className="block mb-0.5 text-gray-900">การเพิ่มเมนูสินค้า</strong>
          คุณสามารถเพิ่มและจัดการเมนูสินค้าได้ในภายหลังผ่านระบบจัดการร้านค้า หลังจากการตั้งค่าเสร็จสิ้น
        </div>
      </div>
    </div>
  );
}
