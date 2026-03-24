import { OnboardingData } from "@/app/onboarding/page";
import { Bot, Sparkles, Minus, Smile, SmilePlus } from "lucide-react";

interface Props { data: OnboardingData; updateFields: (fields: Partial<OnboardingData>) => void; }

const inputClass = "w-full bg-gray-50 text-gray-900 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#00B4D8]/30 border border-gray-200 hover:border-gray-300 transition-all placeholder-gray-400";

export function StepAISetup({ data, updateFields }: Props) {
  return (
    <div className="flex flex-col gap-8 fade-in">
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#00B4D8]" /> บุคลิกผู้ช่วย AI
        </h2>
        <p className="text-sm text-gray-500">ตั้งค่าสไตล์การตอบกลับเพื่อให้เข้ากับภาพลักษณ์แบรนด์ของคุณที่สุด</p>
      </div>
      <div className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อเรียก AI</label>
          <input autoFocus type="text" value={data.botName} onChange={(e) => updateFields({ botName: e.target.value })} placeholder="เช่น แอดมินจอย, น้อนสมาร์ท" className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">ระดับความเป็นทางการ</label>
            <input type="range" min="0" max="100" value={data.formalityLevel} onChange={(e) => updateFields({ formalityLevel: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00B4D8]" />
            <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
              <span>เป็นกันเอง</span>
              <span className="text-[#00B4D8] font-bold">{data.formalityLevel}</span>
              <span>ทางการ</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">การใช้อีโมจิ</label>
            <div className="flex gap-3">
              {[
                { value: "none", label: "ไม่ใช้", icon: Minus },
                { value: "some", label: "พอดี", icon: Smile },
                { value: "lots", label: "เต็มที่", icon: SmilePlus },
              ].map((opt) => (
                <label key={opt.value} className={`flex-1 flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${data.emojiUsage === opt.value ? "border-[#00B4D8] bg-blue-50 text-[#00B4D8]" : "border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50"}`}>
                  <input type="radio" name="emoji" value={opt.value} checked={data.emojiUsage === opt.value} onChange={(e) => updateFields({ emojiUsage: e.target.value as OnboardingData["emojiUsage"] })} className="sr-only" />
                  <opt.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-semibold">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {/* Preview Card */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100 relative overflow-hidden">
          <h3 className="text-sm font-bold text-[#1A237E] mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#00B4D8]" /> ตัวอย่างการตอบกลับ</h3>
          <div className="bg-white p-4 rounded-xl text-sm text-gray-700 border border-gray-100 shadow-sm">
            <p className="font-semibold text-[#1A237E] mb-1">{data.openingGreeting}</p>
            <p className="text-gray-600">นี่คือสไตล์การพูดของ {data.botName || "AI"} นะคะ/ครับ<br /> เรายินดีให้บริการอย่างเต็มที่ {data.formalityLevel > 70 ? "ขอขอบพระคุณเป็นอย่างยิ่ง" : "มีอะไรถามได้เลยน้า"}</p>
            <p className="font-semibold text-[#1A237E] mt-2">{data.closingPhrase}</p>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A237E]/60 mb-1">คำทักทายตอนรับ</label>
              <input type="text" value={data.openingGreeting} onChange={(e) => updateFields({ openingGreeting: e.target.value })} className="w-full bg-white text-gray-900 p-2.5 rounded-lg text-sm border border-gray-200 focus:ring-1 focus:ring-[#00B4D8] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A237E]/60 mb-1">คำลงท้าย / ปิดบทสนทนา</label>
              <input type="text" value={data.closingPhrase} onChange={(e) => updateFields({ closingPhrase: e.target.value })} className="w-full bg-white text-gray-900 p-2.5 rounded-lg text-sm border border-gray-200 focus:ring-1 focus:ring-[#00B4D8] outline-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
