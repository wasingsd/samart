import { OnboardingData } from "@/app/onboarding/page";

interface Props {
  data: OnboardingData;
  updateFields: (fields: Partial<OnboardingData>) => void;
}

const DAYS = [
  { key: "monday", label: "จันทร์" },
  { key: "tuesday", label: "อังคาร" },
  { key: "wednesday", label: "พุธ" },
  { key: "thursday", label: "พฤหัสบดี" },
  { key: "friday", label: "ศุกร์" },
  { key: "saturday", label: "เสาร์" },
  { key: "sunday", label: "อาทิตย์" },
] as const;

export function StepScheduleMenu({ data, updateFields }: Props) {
  
  const handleToggleDay = (dayKey: string, isOpen: boolean) => {
    updateFields({
      businessHours: {
        ...data.businessHours,
        [dayKey]: {
          ...data.businessHours[dayKey],
          isOpen,
        }
      }
    });
  };

  const handleTimeChange = (dayKey: string, field: "openTime" | "closeTime", value: string) => {
    updateFields({
      businessHours: {
        ...data.businessHours,
        [dayKey]: {
          ...data.businessHours[dayKey],
          [field]: value,
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div>
        <h2 className="text-display-sm font-display font-medium text-on-surface mb-2">
          เวลาเปิดทำการ
        </h2>
        <p className="text-body-lg text-on-surface-variant">
          AI จะแจ้งลูกค้าว่าร้านเปิดหรือปิด และรับ order เฉพาะในช่วงเวลาที่คุณกำหนดไว้ตามนี้
        </p>
      </div>

      <div className="bg-surface-container-low rounded-2xl p-6 border border-surface-dim shadow-sm">
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 pb-4 border-b border-surface-dim text-label-md font-bold text-outline uppercase tracking-wider hidden sm:grid">
            <div className="col-span-4">วัน</div>
            <div className="col-span-8 text-center">เวลาทำการ</div>
          </div>
          
          {DAYS.map((day) => {
            const dayData = data.businessHours[day.key];
            return (
              <div key={day.key} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-surface-container-highest transition-colors">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={dayData.isOpen}
                      onChange={(e) => handleToggleDay(day.key, e.target.checked)}
                      className="sr-only peer"
                      id={`toggle-${day.key}`}
                    />
                    <div className="w-11 h-6 bg-surface-dim rounded-full peer peer-checked:bg-primary transition-colors cursor-pointer">
                      <div className={`absolute top-1 left-1 bg-surface w-4 h-4 rounded-full transition-transform ${dayData.isOpen ? 'translate-x-5' : ''}`} />
                    </div>
                  </div>
                  <label htmlFor={`toggle-${day.key}`} className={`font-medium text-body-lg cursor-pointer ${dayData.isOpen ? 'text-on-surface' : 'text-outline'}`}>
                    {day.label}
                  </label>
                </div>
                
                <div className="col-span-8 flex items-center justify-center sm:justify-start gap-2">
                  {dayData.isOpen ? (
                    <>
                      <input
                        type="time"
                        value={dayData.openTime}
                        onChange={(e) => handleTimeChange(day.key, "openTime", e.target.value)}
                        className="bg-surface text-on-surface p-2 rounded-lg border border-surface-dim focus:border-primary focus:ring-1 focus:ring-primary outline-none font-medium w-32"
                      />
                      <span className="text-outline font-medium px-2">-</span>
                      <input
                        type="time"
                        value={dayData.closeTime}
                        onChange={(e) => handleTimeChange(day.key, "closeTime", e.target.value)}
                        className="bg-surface text-on-surface p-2 rounded-lg border border-surface-dim focus:border-primary focus:ring-1 focus:ring-primary outline-none font-medium w-32"
                      />
                    </>
                  ) : (
                    <span className="text-body-md text-error font-medium px-4 py-2 bg-error-container rounded-lg">ปิดทำการ</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex items-center gap-4 p-4 bg-secondary-fixed rounded-xl border border-secondary/10">
        <div className="text-2xl font-bold text-primary">M</div>
        <div className="text-body-md text-on-secondary-fixed">
          <strong className="block mb-1">การเพิ่มเมนูสินค้า</strong>
          คุณสามารถเพิ่มและจัดการเมนูสินค้าได้ในภายหลังผ่านระบบจัดการร้านค้า หลังจากการตั้งค่าเสร็จสิ้น
        </div>
      </div>
    </div>
  );
}
