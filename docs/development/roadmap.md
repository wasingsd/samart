# 🗺️ Panya — Master Roadmap

---

## Timeline Overview

```
2026
│
├── มีนาคม ─── 🔨 PHASE 1: MVP Foundation
│              สัปดาห์ 1-6 | Auth + Chat Brain + Dashboard
│
├── พฤษภาคม ── 🚀 PHASE 2: Core Features + Launch
│              สัปดาห์ 7-14 | Content AI + Billing + Launch
│
├── กรกฎาคม ── 📈 PHASE 3: Advanced AI + Scale
│              สัปดาห์ 15-24 | Video AI + Multi-branch
│
└── ธันวาคม ── 🌏 100+ ร้าน | MRR 250,000 บาท
```

---

## Phase 1: MVP Foundation (สัปดาห์ 1–6)

**เป้าหมาย**: ระบบที่ใช้งานได้จริงกับ 15 ร้าน pilot

### Milestone 1.1 — Core Infrastructure (สัปดาห์ 1-2)
- [ ] Next.js 15 project setup + tRPC + Firebase
- [ ] Firebase Auth (email + LINE Login)
- [ ] Shop onboarding flow (สมัคร → ตั้งค่าร้าน → เสร็จ)
- [ ] Firestore schema (shops, users)
- [ ] Basic dashboard layout + navigation
- [ ] Deploy to Vercel (staging)

**Definition of Done**: เจ้าของร้านสมัครและตั้งค่าร้านได้ภายใน 5 นาที

---

### Milestone 1.2 — Chat Brain v1 + Knowledge Base (สัปดาห์ 3-4)
- [ ] LINE OA webhook setup + signature validation
- [ ] LINE OA connect flow (เจ้าของร้านเชื่อมต่อ LINE OA ตัวเอง)
- [ ] **Knowledge Center UI** — หน้าจัดการความรู้ AI ของร้าน
  - [ ] เพิ่มเมนูแบบ structured form (ชื่อ, ราคา, หมวดหมู่, allergen)
  - [ ] FAQ Builder (ถาม-ตอบ)
  - [ ] Free-form "สอน AI" text input
  - [ ] อัปโหลดไฟล์ (PDF, Word, CSV, รูปภาพ) → auto-extract
  - [ ] Preview ก่อน confirm การ import
- [ ] **AI Style Customizer** — หน้าตั้งค่าบุคลิก AI
  - [ ] ชื่อ bot, น้ำเสียง, emoji, ความยาวคำตอบ
  - [ ] ประโยคปิดท้าย, คำทักทาย, guardrails
  - [ ] Preview real-time ก่อนบันทึก
- [ ] RAG knowledge base builder (Firestore + embedding)
- [ ] Auto-build knowledge จาก onboarding data
- [ ] Gemini Flash integration สำหรับ chat
- [ ] Intent detection (order / FAQ / general)
- [ ] Basic order flow (ลูกค้าสั่งผ่าน LINE)
- [ ] Reply ภาษาไทยได้ถูกต้องตาม style profile

**Definition of Done**: LINE chatbot ตอบคำถามเมนูได้ + เจ้าของร้านปรับสไตล์ AI ได้

---

### Milestone 1.3 — Insight Dashboard v1 (สัปดาห์ 5-6)
- [ ] Manual sales input (เจ้าของร้านกรอกยอดขายเอง + import CSV)
- [ ] Daily sales chart (Recharts)
- [ ] Top products ranking
- [ ] Firebase Scheduled Function → Weekly AI summary
- [ ] LINE push notification (ส่ง briefing ทุกจันทร์เช้า)
- [ ] Customer list (จาก LINE followers)

**Definition of Done**: เจ้าของร้านเห็นยอดขายและได้รับ AI summary รายสัปดาห์

---

## Phase 2: Core Features + Launch (สัปดาห์ 7–14)

**เป้าหมาย**: ฟีเจอร์ครบ + Billing + Launch 50 ร้าน

### Milestone 2.1 — Content Brain v1 (สัปดาห์ 7-8)
- [ ] Post generator UI (เลือก type, tone, product)
- [ ] Gemini Pro integration สำหรับ text generation
- [ ] Gemini Imagen 3 สำหรับ image generation
- [ ] Post preview + edit
- [ ] Scheduler (ตั้งเวลาโพสต์)
- [ ] Facebook Graph API integration (post อัตโนมัติ)

**Definition of Done**: สร้างโพสต์ Facebook ด้วย AI ได้ในคลิกเดียว

---

### Milestone 2.2 — Sales Brain v1 (สัปดาห์ 9-10)
- [ ] Automatic sales tracking (จาก LINE orders)
- [ ] 7-day forecast (Gemini Pro + historical data)
- [ ] Stock alert system
- [ ] Inventory module
- [ ] Daily Briefing v2 (auto-generated ทุกวัน 7:00 น.)
- [ ] Anomaly detection (ยอดตก, สต็อกหมด)

**Definition of Done**: AI แจ้งเตือนก่อนสต็อกหมดและบอกว่าสินค้าไหนจะขายดี

---

### Milestone 2.3 — Billing + Subscription (สัปดาห์ 11-12)
- [ ] Omise integration (PromptPay + credit card)
- [ ] Subscription plans (Starter / Pro / Business)
- [ ] Trial period logic (60 วัน pilot → จ่ายเงิน)
- [ ] Invoice generation + email (Resend)
- [ ] Plan management UI
- [ ] Webhook handlers (payment events)

**Definition of Done**: เก็บเงินลูกค้าได้จริงผ่าน PromptPay และ credit card

---

### Milestone 2.4 — Customer Memory + Learning Loop (สัปดาห์ 13-14)
- [ ] Customer profile building (จาก LINE interactions)
- [ ] Customer segmentation (new / regular / vip / dormant)
- [ ] Follow-up automation (ลูกค้าไม่มา 14 วัน → ส่ง LINE)
- [ ] Broadcast message UI
- [ ] Customer analytics (LTV, retention rate)
- [ ] **Chat Log Dashboard** — เจ้าของร้านดูบทสนทนาทั้งหมดได้
  - [ ] ✅ Approve / ✏️ แก้ไข / ⭐ บันทึกเป็นตัวอย่าง
  - [ ] แก้ไข reply → ส่งกลับลูกค้าทันที
  - [ ] บันทึก correction เป็น `learnedPatterns` อัตโนมัติ
- [ ] **Knowledge Health Dashboard**
  - [ ] แสดงความครบถ้วนของข้อมูล (%)
  - [ ] AI แนะนำหัวข้อที่ควรเพิ่มจาก unanswered questions
  - [ ] Bulk import knowledge จาก Excel template

**Definition of Done**: ส่ง follow-up LINE หาลูกค้าที่หายอัตโนมัติได้

---

### 🚀 Official Launch (สัปดาห์ 14)
- [ ] Production deployment
- [ ] Onboarding video tutorial
- [ ] Help documentation
- [ ] Support system (Crisp or Intercom)
- [ ] Press release → สื่อท้องถิ่นเชียงใหม่

---

## Phase 3: Advanced AI + Scale (สัปดาห์ 15–24)

**เป้าหมาย**: 100+ ร้าน, ฟีเจอร์ที่คู่แข่งทำไม่ได้

### Milestone 3.1 — Video Content AI (สัปดาห์ 15-17)
- [ ] FAL.ai Veo integration
- [ ] Short video generator (15-30 วินาที สำหรับ Reels/TikTok)
- [ ] Template library สำหรับ video
- [ ] Video scheduler

### Milestone 3.2 — Multi-branch (สัปดาห์ 18-19)
- [ ] Branch management UI
- [ ] Cross-branch analytics
- [ ] Staff account system (role-based)
- [ ] Per-branch LINE OA

### Milestone 3.3 — Mobile PWA (สัปดาห์ 20-21)
- [ ] next-pwa setup
- [ ] Installable mobile app
- [ ] Push notifications (สำหรับ orders + alerts)
- [ ] Offline-capable dashboard

### Milestone 3.4 — Open API + Integrations (สัปดาห์ 22-24)
- [ ] Public API documentation
- [ ] Grab / LINE MAN webhook integration
- [ ] Export ข้อมูลสำหรับ accounting software
- [ ] Zapier / Make.com connector

### Milestone 3.5 — AI Fine-tuning (Business tier, สัปดาห์ 23-24)
- [ ] Dataset builder จาก `learnedPatterns` (500+ examples)
- [ ] Gemini Tuned Model API integration
- [ ] Auto-trigger fine-tuning เมื่อครบเงื่อนไข
- [ ] Model versioning + rollback
- [ ] A/B test: tuned vs base model per shop
- [ ] Re-tune ทุก 3 เดือนอัตโนมัติ

---

## Key Metrics to Track

| Metric | สัปดาห์ 6 | สัปดาห์ 14 | สัปดาห์ 24 |
|--------|-----------|-----------|-----------|
| Pilot shops | 5 | 15 | — |
| Paying shops | 0 | 30 | 100+ |
| MRR | 0 | 60,000 ฿ | 250,000 ฿ |
| Avg chat messages/shop/day | 10 | 30 | 50 |
| Content generated/shop/month | — | 10 | 30 |
| NPS Score | — | > 40 | > 60 |
| AI accuracy (no correction needed) | 60% | 80% | 90%+ |
| Knowledge docs per shop (avg) | 20 | 60 | 100+ |
| Learned patterns per shop (avg) | 0 | 50 | 200+ |

---

## Risk Register

| Risk | ความเสี่ยง | แผนรับมือ |
|------|-----------|----------|
| LINE OA API เปลี่ยน policy | สูง | ติดตาม LINE Developer News ทุกสัปดาห์ |
| Gemini ราคาสูงขึ้น | กลาง | ออกแบบให้ใช้ Flash model มากสุด |
| ลูกค้าไม่ยอมใส่ข้อมูล | สูง | ออนบอร์ดด้วยตัวเอง 3 ร้านแรก |
| Cash flow ไม่พอ | กลาง | ตั้ง pilot fee เล็กน้อย (500 บาท/เดือน) ตั้งแต่เดือน 2 |
| คู่แข่งรายใหญ่ copy | ต่ำ | ยึด local market + customer relationship |
