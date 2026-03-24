# 🧠 SAMART — ปัญญา

> **AI Shop Brain สำหรับร้านค้าและร้านอาหารในเชียงใหม่**
> _"ปัญญา ที่ร้านคุณขาดไม่ได้"_

---

## ภาพรวม

**SAMART** คือแพลตฟอร์ม SaaS ที่ใช้ AI เป็นหัวใจหลัก ทำหน้าที่เป็น "สมองธุรกิจ" ให้กับร้านค้าและร้านอาหารขนาดเล็ก-กลาง ในเชียงใหม่และภาคเหนือ ระบบรวม 4 AI Brain modules ไว้ในที่เดียว ช่วยให้เจ้าของร้านคนเดียวสามารถทำงานได้เหมือนมีทีม Marketing + Data Analyst + Customer Service

---

## 4 Brain Modules

| Module | ชื่อ | หน้าที่ |
|--------|------|---------|
| 🔢 | **Sales Brain** | วิเคราะห์ยอดขาย คาดการณ์ demand แจ้งเตือนสต็อก |
| ✍️ | **Content Brain** | สร้างโพสต์ Facebook/LINE รูปภาพ และโปรโมชันอัตโนมัติ |
| 💬 | **Chat Brain** | LINE OA chatbot รับออเดอร์ ตอบคำถาม follow-up ลูกค้า |
| 📊 | **Insight Brain** | Daily AI briefing แนะนำ action เพิ่มยอดขายรายวัน |

---

## โครงสร้างโปรเจค

```
samart/
├── README.md                      # ภาพรวมโปรเจค (ไฟล์นี้)
├── BRAND.md                       # Brand identity & positioning
│
├── docs/
│   ├── business/
│   │   ├── business-plan.md       # Business model & market analysis
│   │   ├── marketing-plan.md      # แผนการตลาด 3 phases
│   │   └── pricing.md             # Pricing tiers & revenue model
│   │
│   ├── system/
│   │   ├── architecture.md        # System architecture overview
│   │   ├── tech-stack.md          # Technology decisions & rationale
│   │   ├── ai-components.md       # 4 Brain modules specification
│   │   ├── ai-personalization.md  # Per-shop AI personalization (4 layers)
│   │   ├── knowledge-management.md # Knowledge Center UX & Learning Loop
│   │   ├── flows.md               # Business & system flow diagrams (8 flows)
│   │   ├── database-schema.md     # Firestore collections & security rules
│   │   └── api-design.md          # tRPC routers & REST webhooks
│   │
│   ├── ai-skills/
│   │   ├── chat-brain-skill.md    # Chat Brain — prompt templates & rules
│   │   ├── content-brain-skill.md # Content Brain — text & image generation
│   │   ├── sales-brain-skill.md   # Sales Brain — forecast & stock alerts
│   │   └── insight-brain-skill.md # Insight Brain — daily briefing & actions
│   │
│   └── development/
│       ├── roadmap.md             # Master timeline & milestones
│       ├── sprint-01.md           # Sprint 1: MVP Foundation (day-by-day)
│       └── mvp-checklist.md       # MVP launch checklist (50+ items)
│
└── public/
    └── (assets, logos, mockups)
```

---

## Quick Links

| หมวด | ไฟล์ |
|------|------|
| 🎨 Brand | [BRAND.md](./BRAND.md) |
| 📋 Business Plan | [business-plan.md](./docs/business/business-plan.md) |
| 📣 Marketing Plan | [marketing-plan.md](./docs/business/marketing-plan.md) |
| 💰 Pricing | [pricing.md](./docs/business/pricing.md) |
| 🏗️ Architecture | [architecture.md](./docs/system/architecture.md) |
| ⚙️ Tech Stack | [tech-stack.md](./docs/system/tech-stack.md) |
| 🤖 AI Components | [ai-components.md](./docs/system/ai-components.md) |
| 🧬 AI Personalization | [ai-personalization.md](./docs/system/ai-personalization.md) |
| 📚 Knowledge Management | [knowledge-management.md](./docs/system/knowledge-management.md) |
| 🔄 System Flows | [flows.md](./docs/system/flows.md) |
| 🗄️ Database Schema | [database-schema.md](./docs/system/database-schema.md) |
| 🔌 API Design | [api-design.md](./docs/system/api-design.md) |
| 💬 Chat Brain Skill | [chat-brain-skill.md](./docs/ai-skills/chat-brain-skill.md) |
| ✍️ Content Brain Skill | [content-brain-skill.md](./docs/ai-skills/content-brain-skill.md) |
| 🔢 Sales Brain Skill | [sales-brain-skill.md](./docs/ai-skills/sales-brain-skill.md) |
| 📊 Insight Brain Skill | [insight-brain-skill.md](./docs/ai-skills/insight-brain-skill.md) |
| 🗺️ Roadmap | [roadmap.md](./docs/development/roadmap.md) |
| 🏃 Sprint 1 | [sprint-01.md](./docs/development/sprint-01.md) |
| ✅ MVP Checklist | [mvp-checklist.md](./docs/development/mvp-checklist.md) |

---

## Target Market

- **เมือง**: เชียงใหม่ (เริ่มต้น) → ภาคเหนือ → ทั้งประเทศ
- **กลุ่มลูกค้า**: ร้านอาหาร, คาเฟ่, ธุรกิจบริการ (1-5 สาขา)
- **ขนาดตลาด**: ร้านค้า 8,000+ แห่งในเชียงใหม่

---

## Status

| Phase | สถานะ | Target |
|-------|--------|--------|
| 🔨 Planning & Design | ✅ กำลังดำเนินการ | เดือน 1 |
| 🔨 MVP Development | ⏳ รอเริ่ม | เดือน 1-3 |
| 🚀 Pilot Launch | ⏳ รอเริ่ม | เดือน 3-4 |
| 📈 Growth | ⏳ รอเริ่ม | เดือน 4-6 |
| 🌏 Expand | ⏳ รอเริ่ม | เดือน 7-12 |

---

_สร้างโดย solo developer · เชียงใหม่ · 2026_
