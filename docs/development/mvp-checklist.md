# ✅ Panya — MVP Launch Checklist

> ใช้ checklist นี้ก่อน launch จริงกับลูกค้าคนแรก

---

## 🔐 Authentication & Security

- [ ] Firebase Auth ทำงานได้ (register, login, logout)
- [ ] Protected routes redirect ถ้าไม่ได้ login
- [ ] Firestore Security Rules ปิดกั้น cross-shop access แล้ว
- [ ] LINE Webhook signature validation ทำงาน
- [ ] Environment variables ไม่โชว์ใน client bundle
- [ ] API keys ทั้งหมดอยู่ใน `.env.local` และ Vercel env

---

## 🏪 Shop Setup

- [ ] Onboarding wizard เสร็จสมบูรณ์ (< 5 นาที)
- [ ] เจ้าของร้านตั้งค่าเมนูได้
- [ ] เชื่อมต่อ LINE OA ได้พร้อม webhook test
- [ ] ตั้งชื่อและบุคลิก AI bot ได้
- [ ] ตั้งเวลาเปิด-ปิดร้านได้

---

## 📚 Knowledge Center (ใหม่)

- [ ] หน้า Knowledge Center เข้าถึงได้จาก sidebar
- [ ] เพิ่มเมนูผ่าน structured form ได้ (ชื่อ, ราคา, หมวดหมู่, allergen)
- [ ] FAQ Builder เพิ่ม/แก้ไข/ลบ ถาม-ตอบได้
- [ ] Free-form "สอน AI" text input บันทึกและ embed ได้
- [ ] อัปโหลด PDF/CSV → extract → preview → confirm ได้
- [ ] อัปโหลดรูปภาพเมนู → Gemini อ่านและดึงข้อมูลได้
- [ ] Knowledge build อัตโนมัติเมื่อ onboarding เสร็จ
- [ ] Knowledge Health แสดง % ความครบถ้วน

---

## 🎨 AI Style Customizer (ใหม่)

- [ ] ปรับ formalityLevel ด้วย slider ได้
- [ ] เลือก emoji usage (none/some/lots) ได้
- [ ] เลือก reply length (short/medium/long) ได้
- [ ] ตั้ง closing phrase และ opening greeting ได้
- [ ] เพิ่ม guardrails (สิ่งที่ AI ห้ามพูด) ได้
- [ ] Preview real-time: พิมพ์คำถาม → ดูว่า AI จะตอบแบบไหน
- [ ] บันทึก style profile ลง Firestore และ AI ใช้ทันที

---

## 💬 Chat Brain

- [ ] LINE webhook รับ message ได้
- [ ] AI ตอบกลับภาษาไทยได้ถูกต้องตาม style profile
- [ ] ตอบคำถามเมนูได้ (RAG จาก Knowledge Center)
- [ ] รับออเดอร์พื้นฐานได้
- [ ] บอกเวลาเปิด-ปิดได้
- [ ] กรณี AI ไม่รู้ → บอก "ขอสอบถามเพิ่มเติมนะคะ" ไม่ hallucinate
- [ ] Response time < 3 วินาที

---

## 🔄 Learning Loop (ใหม่)

- [ ] Chat Log Dashboard แสดงบทสนทนาทั้งหมดได้
- [ ] ปุ่ม ✅ Approve บันทึกเป็น learnedPattern ได้
- [ ] ปุ่ม ✏️ แก้ไข → พิมพ์ reply ใหม่ → ส่งกลับลูกค้าได้
- [ ] correction บันทึกลง learnedPatterns collection ได้
- [ ] ปุ่ม ⭐ บันทึกเป็น featured example ได้
- [ ] AI ดึง few-shot examples มาใช้ใน prompt ได้

---

## 📊 Dashboard

- [ ] หน้า dashboard โหลดข้อมูลจริงจาก Firestore
- [ ] กราฟยอดขายแสดงได้ถูกต้อง
- [ ] รายการออเดอร์วันนี้แสดงได้
- [ ] AI weekly summary ส่ง LINE ได้
- [ ] Mobile responsive (375px ขึ้นไป)

---

## 💳 Billing (สำหรับ paid customers)

- [ ] Omise integration ทดสอบกับ test mode แล้ว
- [ ] PromptPay QR generate ได้
- [ ] Credit card form ทำงานได้
- [ ] Invoice email ส่งได้ (Resend)
- [ ] Subscription status อัปเดตใน Firestore เมื่อจ่ายเงิน

---

## 🚀 Performance & Reliability

- [ ] Lighthouse score > 80 (mobile)
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1
- [ ] Error boundary ครอบทุก major component
- [ ] Firebase error logging (Crashlytics or Sentry)
- [ ] Vercel deployment ไม่มี build errors

---

## 📱 Cross-platform Testing

- [ ] Chrome Desktop ✅
- [ ] Safari Desktop ✅
- [ ] Chrome Android ✅
- [ ] Safari iOS ✅
- [ ] LINE in-app browser ✅

---

## 📧 Communication Setup

- [ ] Resend domain verified
- [ ] Welcome email ส่งเมื่อ register
- [ ] Trial reminder email (วันที่ 50 และ 58 ของ trial)
- [ ] LINE OA ของ Panya พร้อม support ลูกค้า

---

## 📋 Legal & Compliance

- [ ] Privacy Policy หน้า (กฎหมาย PDPA)
- [ ] Terms of Service หน้า
- [ ] Cookie consent (ถ้ามี analytics)
- [ ] LINE OA ปฏิบัติตาม LINE Policy

---

## 🎯 Pilot Readiness

- [ ] มี 5 ร้านที่ตกลงเข้า pilot แล้ว
- [ ] เตรียม onboarding script (จะพาร้านผ่านขั้นตอนอะไรบ้าง)
- [ ] เตรียมช่องทาง feedback (Google Form หรือ LINE group)
- [ ] มี backup plan ถ้า AI ตอบผิด (เจ้าของร้านสามารถ override ได้)
- [ ] SLA ชัดเจน: ระบบล่ม notify ภายใน 30 นาที

---

## Post-Launch (สัปดาห์แรกหลัง launch)

- [ ] Monitor Firebase Functions logs ทุกวัน
- [ ] ดู LINE webhook errors
- [ ] โทรหาลูกค้า pilot ทุกคนอย่างน้อย 1 ครั้ง
- [ ] เก็บ feedback และ prioritize bugs
- [ ] ทำ Sprint Retrospective
