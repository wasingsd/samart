import { OnboardingData } from "@/app/onboarding/page";
import { BUSINESS_CONFIGS, BusinessType } from "@/lib/businessConfig";
import { Store, Phone, MapPin } from "lucide-react";

interface Props { data: OnboardingData; updateFields: (fields: Partial<OnboardingData>) => void; }

const inputClass = "w-full bg-gray-50 text-gray-900 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#00B4D8]/30 border border-gray-200 hover:border-gray-300 transition-all placeholder-gray-400";

const businessTypes: BusinessType[] = ["food", "retail", "service"];

export function StepShopInfo({ data, updateFields }: Props) {
  // Map legacy categories to business types for selection
  const selectedType: BusinessType =
    ["restaurant", "cafe", "bakery", "food"].includes(data.category) ? "food"
    : data.category === "retail" ? "retail"
    : data.category === "service" ? "service"
    : "food";

  return (
    <div className="flex flex-col gap-8 fade-in">
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Store className="w-5 h-5 text-[#00B4D8]" /> ข้อมูลร้านค้าพื้นฐาน
        </h2>
        <p className="text-sm text-gray-500">ข้อมูลนี้จะถูกนำไปใช้เพื่อให้ AI เข้าใจรูปแบบธุรกิจของคุณและตอบคำถามลูกค้าได้อย่างถูกต้อง</p>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อร้านค้า <span className="text-red-500">*</span></label>
          <input autoFocus type="text" value={data.name} onChange={(e) => updateFields({ name: e.target.value })} placeholder="เช่น SAMART คาเฟ่" className={inputClass} />
        </div>

        {/* Business Type Selector — Visual Cards */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">ประเภทธุรกิจ <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {businessTypes.map((type) => {
              const cfg = BUSINESS_CONFIGS[type];
              const Icon = cfg.icon;
              const isSelected = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateFields({ category: type as any })}
                  className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all text-center ${
                    isSelected
                      ? "border-[#00B4D8] bg-blue-50 shadow-md shadow-blue-100"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#00B4D8] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? "bg-[#00B4D8] text-white" : "bg-gray-100 text-gray-500"}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isSelected ? "text-[#1A237E]" : "text-gray-900"}`}>{cfg.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{cfg.examples}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2"><Phone className="inline w-3.5 h-3.5 mr-1" />เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
            <input type="tel" value={data.phone} onChange={(e) => updateFields({ phone: e.target.value })} placeholder="08X-XXX-XXXX" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><MapPin className="inline w-3.5 h-3.5 mr-1" />ที่ตั้ง / สาขา</label>
          <textarea value={data.address} onChange={(e) => updateFields({ address: e.target.value })} placeholder="รายละเอียดที่อยู่สำหรับให้ AI แนะนำทางลูกค้า" rows={3} className={`${inputClass} resize-none`} />
        </div>
      </div>
    </div>
  );
}
