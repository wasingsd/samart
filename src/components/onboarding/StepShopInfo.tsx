import { OnboardingData } from "@/app/onboarding/page";

interface Props {
  data: OnboardingData;
  updateFields: (fields: Partial<OnboardingData>) => void;
}

export function StepShopInfo({ data, updateFields }: Props) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-display-sm font-display font-medium text-on-surface mb-2">
          ข้อมูลร้านค้าพื้นฐาน
        </h2>
        <p className="text-body-lg text-on-surface-variant">
          ข้อมูลนี้จะถูกนำไปใช้เพื่อให้ AI เข้าใจรูปแบบธุรกิจของคุณและตอบคำถามลูกค้าได้อย่างถูกต้อง
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-label-md font-bold tracking-wider text-outline mb-2 uppercase">
            ชื่อร้านค้า <span className="text-error">*</span>
          </label>
          <input
            autoFocus
            required
            type="text"
            value={data.name}
            onChange={(e) => updateFields({ name: e.target.value })}
            placeholder="เช่น ปัญญา คาเฟ่"
            className="w-full bg-surface-container-highest text-on-surface p-4 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent transition-all font-body text-body-lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-label-md font-bold tracking-wider text-outline mb-2 uppercase">
              ประเภทธุรกิจ <span className="text-error">*</span>
            </label>
            <select
              required
              value={data.category}
              onChange={(e) => updateFields({ category: e.target.value as OnboardingData["category"] })}
              className="w-full bg-surface-container-highest text-on-surface p-4 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent transition-all font-body text-body-lg appearance-none cursor-pointer"
            >
              <option value="restaurant">ร้านอาหาร / คาเฟ่</option>
              <option value="retail">ร้านค้าปลีก</option>
              <option value="service">บริการ</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
          <div>
            <label className="block text-label-md font-bold tracking-wider text-outline mb-2 uppercase">
              เบอร์โทรศัพท์ <span className="text-error">*</span>
            </label>
            <input
              required
              type="tel"
              value={data.phone}
              onChange={(e) => updateFields({ phone: e.target.value })}
              placeholder="08X-XXX-XXXX"
              className="w-full bg-surface-container-highest text-on-surface p-4 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent transition-all font-body text-body-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-label-md font-bold tracking-wider text-outline mb-2 uppercase">
            ที่ตั้ง / สาขา
          </label>
          <textarea
            value={data.address}
            onChange={(e) => updateFields({ address: e.target.value })}
            placeholder="รายละเอียดที่อยู่สำหรับให้ AI แนะนำทางลูกค้า"
            rows={3}
            className="w-full bg-surface-container-highest text-on-surface p-4 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent transition-all font-body text-body-lg resize-none"
          />
        </div>
      </div>
    </div>
  );
}
