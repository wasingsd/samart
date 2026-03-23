import { OnboardingData } from "@/app/onboarding/page";

interface Props {
  data: OnboardingData;
  updateFields: (fields: Partial<OnboardingData>) => void;
}

export function StepAISetup({ data, updateFields }: Props) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div>
        <h2 className="text-display-sm font-display font-medium text-on-surface mb-2">
          บุคลิกผู้ช่วย AI
        </h2>
        <p className="text-body-lg text-on-surface-variant">
          ตั้งค่าสไตล์การตอบกลับเพื่อให้เข้ากับภาพลักษณ์แบรนด์ของคุณที่สุด
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-label-md font-bold tracking-wider text-outline mb-2 uppercase">
            ชื่อเรียก AI
          </label>
          <input
            autoFocus
            type="text"
            value={data.botName}
            onChange={(e) => updateFields({ botName: e.target.value })}
            placeholder="เช่น แอดมินจอย, น้อนสมาร์ท"
            className="w-full bg-surface-container-highest text-on-surface p-4 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent transition-all font-body text-body-lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <label className="block text-label-md font-bold tracking-wider text-outline mb-4 uppercase">
              ระดับความเป็นทางการ
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={data.formalityLevel}
              onChange={(e) => updateFields({ formalityLevel: parseInt(e.target.value) })}
              className="w-full h-2 bg-surface-dim rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-2 text-label-sm text-outline font-medium">
              <span>เป็นกันเอง (0)</span>
              <span>ทางการ (100)</span>
            </div>
          </div>

          <div>
            <label className="block text-label-md font-bold tracking-wider text-outline mb-4 uppercase">
              การใช้อีโมจิ
            </label>
            <div className="flex gap-4">
              {[
                { value: "none", label: "ไม่ใช้เลย" },
                { value: "some", label: "พอประมาณ" },
                { value: "lots", label: "จัดเต็ม" },
              ].map((opt) => (
                <label 
                  key={opt.value} 
                  className={`flex-1 flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    data.emojiUsage === opt.value 
                      ? 'border-primary bg-primary-container/5 text-primary' 
                      : 'border-surface-dim text-outline hover:border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <input
                    type="radio"
                    name="emoji"
                    value={opt.value}
                    checked={data.emojiUsage === opt.value}
                    onChange={(e) => updateFields({ emojiUsage: e.target.value as OnboardingData["emojiUsage"] })}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold mb-1">{opt.value === "none" ? "—" : opt.value === "some" ? "A" : "A+"}</span>
                  <span className="text-label-sm font-semibold">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-tertiary-fixed rounded-2xl p-6 shadow-sm border border-tertiary/10 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-tertiary/10 text-9xl">*</div>
          <h3 className="text-title-lg text-tertiary font-bold mb-4 relative z-10 flex items-center gap-2">
            ตัวอย่างการตอบกลับ (พรีวิว)
          </h3>
          <div className="bg-surface p-4 rounded-xl text-body-md text-on-surface shadow-sm relative z-10">
            <p className="font-semibold text-primary mb-1">{data.openingGreeting}</p>
            <p>
              นี่คือสไตล์การพูดของ {data.botName || "AI"} นะคะ/ครับ 
              <br /> เรายินดีให้บริการอย่างเต็มที่ {data.formalityLevel > 70 ? "ขอขอบพระคุณเป็นอย่างยิ่ง" : "มีอะไรถามได้เลยน้า"}
            </p>
            <p className="font-semibold text-primary mt-2">{data.closingPhrase}</p>
          </div>
          
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            <div>
              <label className="block text-label-sm font-bold text-tertiary mb-1">คำทักทายตอนรับ</label>
              <input
                type="text"
                value={data.openingGreeting}
                onChange={(e) => updateFields({ openingGreeting: e.target.value })}
                className="w-full bg-surface-container-highest text-on-surface p-2 rounded-lg text-sm border-none focus:ring-1 focus:ring-tertiary"
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-tertiary mb-1">คำลงท้าย / ปิดบทสนทนา</label>
              <input
                type="text"
                value={data.closingPhrase}
                onChange={(e) => updateFields({ closingPhrase: e.target.value })}
                className="w-full bg-surface-container-highest text-on-surface p-2 rounded-lg text-sm border-none focus:ring-1 focus:ring-tertiary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
