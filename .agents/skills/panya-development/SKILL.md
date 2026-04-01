---
name: SAMART Development Skill
description: คู่มือพัฒนาโปรเจค SAMART — AI Shop Brain สำหรับร้านค้าในเชียงใหม่ รวมถึงกฎภาษาไทย, tech stack, architecture patterns, และ coding conventions
---

# 🧠 SAMART Development Skill

## ⚡ กฎสำคัญ: ภาษาไทย

**ต้องสนทนาและตอบเป็นภาษาไทยเสมอ** ยกเว้นกรณีต่อไปนี้:
- ชื่อ technical terms (เช่น component, function, API) ให้ใช้ภาษาอังกฤษได้
- Code, comments ใน codebase ให้เขียนเป็นภาษาอังกฤษ
- ชื่อ file, variable, function ให้เป็นภาษาอังกฤษ
- เมื่อ user ถามเป็นภาษาอังกฤษ ให้ตอบเป็นภาษาอังกฤษ

**แนวทางการพูดภาษาไทย:**
- ใช้ภาษาที่เป็นกันเอง ไม่ต้องทางการมาก
- อธิบาย technical concepts ด้วยภาษาไทยที่เข้าใจง่าย
- ใช้คำทับศัพท์เทคนิคได้ เช่น deploy, build, component
- ตอบกระชับ ตรงประเด็น

---

## 📋 ภาพรวมโปรเจค

**SAMART (สามารถ)** คือแพลตฟอร์ม SaaS ที่ใช้ AI เป็นหัวใจหลัก ทำหน้าที่เป็น "สมองธุรกิจ" ให้กับร้านค้าและร้านอาหารขนาดเล็ก-กลาง ในเชียงใหม่

### 4 Brain Modules

| Module | ชื่อภายใน | หน้าที่ | AI Model |
|--------|-----------|---------|----------|
| 🔢 Sales Brain | SAMART **Sense** | วิเคราะห์ยอดขาย คาดการณ์ demand แจ้งเตือนสต็อก | Gemini 2.0 Pro |
| ✍️ Content Brain | SAMART **Create** | สร้างโพสต์ Facebook/LINE รูปภาพ โปรโมชัน | Gemini 2.0 Pro + Imagen 3 |
| 💬 Chat Brain | SAMART **Talk** | LINE OA chatbot รับออเดอร์ ตอบคำถาม | Gemini 2.0 Flash |
| 📊 Insight Brain | SAMART **Guide** | Daily AI briefing แนะนำ action รายวัน | Gemini 2.0 Pro |

### Target Market
- **เมือง**: เชียงใหม่ (เริ่มต้น) → ภาคเหนือ → ทั้งประเทศ
- **กลุ่มลูกค้า**: ร้านอาหาร, คาเฟ่, ธุรกิจบริการ (1-5 สาขา)

---

## 🛠️ Tech Stack

ใช้ tech stack ต่อไปนี้เสมอ ห้ามเปลี่ยนโดยไม่มีเหตุผล:

```
Frontend:    Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
State:       Zustand (global) + TanStack Query via tRPC (server state)
Backend:     Next.js API Routes + tRPC v11
Database:    Firebase Firestore
Auth:        Firebase Auth + LINE Login
AI Core:     Google Gemini 2.0 Pro / Flash (@google/generative-ai)
Image AI:    Gemini Imagen 3
Video AI:    FAL.ai (Veo 2)
Storage:     Firebase Storage
Messaging:   LINE Messaging API + LIFF
Payment:     Omise (Primary, Thai) + Stripe (International)
Hosting:     Vercel
Jobs:        Firebase Scheduled Functions
Email:       Resend
Analytics:   Vercel Analytics + PostHog
```

### Key Libraries
```
react ^19, next ^15, typescript ^5, tailwindcss ^4
@trpc/server ^11, @trpc/client ^11, @trpc/react-query ^11
@tanstack/react-query ^5, zustand ^5, zod ^3
firebase ^11, firebase-admin ^12
@line/bot-sdk ^9, @line/liff ^2
@google/generative-ai ^0.21
@fal-ai/client ^1, omise ^3, resend ^4
recharts ^2, lucide-react, framer-motion ^11
```

### Dev Tools
```
vitest ^2, @testing-library/react ^16, playwright ^1.45
eslint ^9, prettier ^3, husky ^9, lint-staged ^15
```

---

## 📁 Folder Structure (App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx              ← Sidebar + Header
│   ├── page.tsx                ← Dashboard home
│   ├── menu/page.tsx           ← จัดการเมนู
│   ├── knowledge/page.tsx      ← Knowledge Center
│   ├── chat-logs/page.tsx      ← Chat Log Dashboard
│   ├── content/page.tsx        ← Content Brain UI
│   ├── analytics/page.tsx      ← Sales Brain + Insight
│   ├── customers/page.tsx      ← Customer Management
│   └── settings/page.tsx       ← ตั้งค่าร้าน + AI Style
├── onboarding/
│   └── page.tsx                ← 3-step wizard
└── api/
    ├── trpc/[trpc]/route.ts
    └── webhook/
        ├── line/route.ts
        └── payment/route.ts
```

---

## 🗄️ Database Schema (Firestore)

### Collections หลัก
```
firestore/
├── shops/{shopId}/              ← ร้านค้า (รวม styleProfile)
│   ├── menuItems/{itemId}       ← เมนู/สินค้า
│   ├── customers/{lineUserId}   ← ลูกค้า
│   ├── orders/{orderId}         ← ออเดอร์
│   ├── inventory/{itemId}       ← สต็อก
│   ├── scheduledPosts/{postId}  ← โพสต์
│   ├── knowledgeBase/{docId}    ← RAG knowledge (Layer 1)
│   └── learnedPatterns/{patternId} ← Few-shot examples (Layer 3)
├── users/{userId}/              ← เจ้าของร้าน
├── subscriptions/{shopId}       ← Billing
├── aiJobs/{jobId}               ← Background tasks
└── analytics/{shopId}/daily/{date} ← Aggregated metrics
```

### Security Rule: แต่ละร้านเห็นข้อมูลเฉพาะตัวเอง
```javascript
// ใช้ isShopOwner(shopId) check ทุก read/write
function isShopOwner(shopId) {
  return isAuth() &&
    get(.../shops/$(shopId)).data.ownerId == request.auth.uid;
}
```

---

## 🔌 API Design

### tRPC Routers
- `auth` — เชื่อมต่อ LINE OA
- `shop` — จัดการร้าน + AI Style Profile + Preview AI response
- `menu` — CRUD เมนู + toggle stock
- `knowledge` — CRUD knowledge (structured/freeform/upload) + health report + gap suggestions
- `chatLog` — ดู/approve/correct/feature conversations (Learning Loop)
- `ai` — Sales forecast, stock alerts, generate post, generate image, schedule post, daily briefing
- `analytics` — Sales overview, customer insights, today revenue
- `customers` — List/profile, send follow-up, broadcast

### REST Webhooks
- `POST /api/webhook/line` — LINE Messaging API webhook (validate x-line-signature)
- `POST /api/webhook/payment` — Omise/Stripe payment events
- `GET /api/public/menu/:shopId` — Public menu (no auth)

### Middleware Stack (ทุก protected route)
1. Firebase Auth token validation
2. Shop membership check
3. Subscription status check
4. Rate limit check
5. Request logging

---

## 🤖 AI Architecture — 4 Layers of Shop Intelligence

ทำให้ AI "รู้จัก" ร้านแต่ละร้านผ่าน 4 ชั้น:

| Layer | ชื่อ | วิธี | ต้นทุน |
|-------|------|------|--------|
| 1 | **Static Knowledge (RAG)** | embed → Firestore vector search → top-3 docs | ~5 ฿/เดือน |
| 2 | **Dynamic Context** | inject real-time data ตรงใน system prompt | ~0 ฿ |
| 3 | **Learned Patterns** | few-shot examples จาก corrections/approvals | ~2 ฿/เดือน |
| 4 | **Fine-tuning** | Gemini Tuned Model (Business tier, Phase 3) | ~15 ฿/เดือน |

### Full Prompt Assembly Flow (Chat Brain)
```
System Prompt (CORE_SYSTEM_PROMPT)
  + Layer 1: RAG context (top-3 docs)
  + Layer 2: Dynamic context (stock status, promos, hours)
  + Layer 3: Few-shot examples (top-3 patterns)
  + Style Profile (bot name, formality, emoji, guardrails)
  + Customer info (name, segment, history)
  + Customer message
```

### สำคัญ: Anti-hallucination
- ถ้า AI ไม่รู้คำตอบ → ต้องตอบ "ขอสอบถามเพิ่มเติมนะคะ" **ห้าม hallucinate**
- ใช้ RAG context เท่านั้น ห้ามสร้างข้อมูลเอง

---

## 🎨 Brand Guidelines

### Color Palette
```
Primary:   #1A237E (Deep Indigo)
Secondary: #00B4D8 (Cyan Teal)
Accent:    #F4A261 (Warm Amber)
Dark:      #1A1A2E (Near Black)
Light:     #F8FAFE (Ice White)
Success:   #2D9C5A (Leaf Green)
Gradient:  #1A237E → #00B4D8 (Linear, left to right)
```

### Typography
```
Display/Logo:   Prompt (Google Fonts) 700 Bold
Heading:        Prompt 600 SemiBold
Body Thai:      Sarabun 400 Regular
Body EN:        Inter 400 Regular
Mono/Code:      JetBrains Mono 400
```

### Brand Voice
- ✅ พูดภาษาเจ้าของร้าน ไม่ใช้ tech jargon
- ✅ เป็นกันเอง เหมือนที่ปรึกษาที่เข้าใจธุรกิจ
- ❌ ห้ามพูดศัพท์เทคนิค เช่น "pipeline", "inference", "webhook endpoint"

### UI/UX & Design Guidelines
- ✅ การออกแบบต้องดู **ทันสมัย (Modern, Sleek, Professional)** และมีความเบาบางคลีน สบายตา
- ❌ **พยายามหลีกเลี่ยง** การใช้ Emoji และ Icon ที่มีสีสันเยอะหรือมีลูกเล่นมากเกินไป (Playful/Colorful Emojis & Icons) เพราะอาจทำให้ระบบดูไม่น่าเชื่อถือหรือเหมือนของเด็กเล่น
- ✅ เลือกใช้ **Icon ที่เรียบง่าย โทนสีเดียว (เช่น Outline/Solid จาก lucide-react)** แทนการใช้ Emoji ช่วยให้ดูเป็นแอปพลิเคชันระดับองค์กร
- ✅ ตัวหนังสือต้องอ่านง่าย (High Contrast) จัดสรรพื้นที่ว่าง (White Space) ให้เหมาะสม ไม่รกเกินไป

---

## 💰 Pricing Tiers

| Tier | ราคา/เดือน | ฟีเจอร์หลัก |
|------|-----------|------------|
| 🌱 Starter | 1,490 ฿ | Chat Brain + Insight Dashboard + 1,000 msg |
| 🚀 Pro ⭐ | 2,490 ฿ | + Content Brain + Sales Brain + Customer Memory + ไม่จำกัด msg |
| 💎 Business | 3,490 ฿ | + Multi-branch + Staff accounts + API + Custom AI Training |

---

## 🔄 Development Phases

### Phase 1: MVP Foundation (สัปดาห์ 1-6)
- Core Infrastructure: Next.js + tRPC + Firebase + Auth + Onboarding
- Chat Brain v1: LINE webhook + RAG + Knowledge Center + AI Style Customizer
- Insight Dashboard v1: Sales charts + Weekly AI summary

### Phase 2: Core Features + Launch (สัปดาห์ 7-14)
- Content Brain v1: Post generator + Image AI + Scheduler
- Sales Brain v1: Forecast + Stock alerts + Daily Briefing
- Billing: Omise + Subscription plans
- Customer Memory + Learning Loop

### Phase 3: Advanced AI + Scale (สัปดาห์ 15-24)
- Video Content AI, Multi-branch, Mobile PWA, Open API, AI Fine-tuning

---

## ✅ Coding Conventions

1. **ภาษา code**: TypeScript เสมอ, strict mode
2. **Components**: React Server Components เป็นหลัก, ใช้ 'use client' เฉพาะที่จำเป็น
3. **Styling**: Tailwind CSS v4 utility classes
4. **Validation**: ใช้ Zod schema ทุก tRPC input
5. **Error messages**: user-facing ใช้ภาษาไทย
6. **API**: ใช้ tRPC สำหรับ internal, REST เฉพาะ webhooks + public
7. **State**: Zustand สำหรับ global (user, shop), TanStack Query สำหรับ server state
8. **AI responses**: validate ด้วย Zod schema + retry logic
9. **Security**: Firestore rules ต้อง isolate ข้อมูลแต่ละร้าน
10. **Testing**: Vitest สำหรับ unit, Playwright สำหรับ E2E
