# 🏗️ Panya — System Architecture

---

## ภาพรวมระบบ

```
                         ┌─────────────────────────────────────────┐
                         │              PANYA PLATFORM              │
                         └─────────────────────────────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │                            │                            │
        ┌──────▼──────┐            ┌────────▼────────┐         ┌────────▼────────┐
        │  Dashboard  │            │   LINE OA API   │         │   Mobile PWA    │
        │  Web App    │            │   (Chat Brain)  │         │   (เจ้าของร้าน) │
        │  Next.js    │            │                 │         │                 │
        └──────┬──────┘            └────────┬────────┘         └────────┬────────┘
               │                            │                            │
               └────────────────────────────┼────────────────────────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │     API Layer (tRPC)       │
                              │     Next.js API Routes     │
                              └─────────────┬─────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
           ┌────────▼────────┐    ┌─────────▼─────────┐   ┌────────▼────────┐
           │   AI Orchestr.  │    │   Firebase Suite   │   │  External APIs  │
           │   (Gemini Pro)  │    │   Firestore + Auth │   │  LINE / Stripe  │
           └────────┬────────┘    └───────────────────┘    └────────────────┘
                    │
     ┌──────────────┼──────────────┬──────────────┐
     │              │              │              │
┌────▼────┐   ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
│  Sales  │   │  Content  │  │  Chat   │  │  Insight  │
│  Brain  │   │  Brain    │  │  Brain  │  │  Brain    │
└─────────┘   └───────────┘  └─────────┘  └───────────┘
```

---

## Component Overview

### 1. Frontend Layer

| Component | Tech | รายละเอียด |
|-----------|------|-----------|
| Dashboard Web App | Next.js 15 + TypeScript | หน้าจัดการร้านค้าหลัก |
| Mobile PWA | Next.js + next-pwa | เจ้าของร้านดูบนมือถือ |
| LINE LIFF | LINE LIFF SDK | mini app ใน LINE สำหรับลูกค้า |
| Admin Panel | Next.js (internal) | จัดการ customers + billing |

### 2. API Layer

```
POST   /api/trpc/shop.*          → Shop management
POST   /api/trpc/ai.*            → AI generation endpoints
POST   /api/trpc/analytics.*     → Sales & insights
POST   /api/webhook/line         → LINE Messaging API webhook
POST   /api/webhook/stripe       → Payment events
GET    /api/public/menu/:shopId  → Public menu (no auth)
```

### 3. AI Orchestration (Core)

```typescript
// AI Orchestrator — รับ request และ route ไปยัง brain ที่ถูกต้อง

class PanyaOrchestrator {
  salesBrain: SalesBrain       // วิเคราะห์ยอดขาย
  contentBrain: ContentBrain   // สร้างคอนเทนต์
  chatBrain: ChatBrain         // ตอบแชท LINE
  insightBrain: InsightBrain   // สรุป daily briefing

  async process(intent: Intent, context: ShopContext): Promise<Response>
}
```

### 4. Data Layer

| Service | ใช้เพื่อ |
|---------|---------|
| Firebase Firestore | Primary database (real-time) |
| Firebase Auth | User authentication |
| Firebase Storage | รูปภาพ, assets |
| Firebase Functions | Background jobs, scheduled tasks |
| Vercel / Cloud Run | Hosting API |

---

## Data Flow Diagrams

### Chat Brain Flow (LINE → AI → Response)

```
ลูกค้า
  │ ส่งข้อความ LINE
  ▼
LINE Platform
  │ Webhook POST /api/webhook/line
  ▼
ChatBrain.handleMessage()
  │
  ├─ [Intent Detection] → Gemini Flash
  │   ├── "order" → handleOrder()
  │   ├── "question" → handleFAQ()
  │   ├── "complaint" → handleComplaint()
  │   └── "other" → handleGeneral()
  │
  ├─ [Context Building] → fetch ShopContext from Firestore
  │   (menu, hours, promotions, customer history)
  │
  ├─ [RAG Query] → search knowledge base
  │
  └─ [Generate Reply] → Gemini Pro
        │
        ▼
     Reply ส่งกลับ LINE
```

### Content Brain Flow

```
เจ้าของร้านกดปุ่ม "สร้างโพสต์"
  │
  ▼
ContentBrain.generate({
  type: 'promotion',
  product: 'กาแฟ Signature',
  discount: '20%',
  tone: 'fun'
})
  │
  ├─ [Text Generation] → Gemini Pro
  │   ↳ ได้: แคปชัน + hashtag + CTA
  │
  ├─ [Image Generation] → Gemini Imagen 3
  │   ↳ ได้: รูปโปรโมชันพร้อมข้อความ
  │
  └─ [Schedule] → บันทึกใน Firestore + ตั้งเวลาโพสต์
```

### Insight Brain Flow (Daily Briefing)

```
Firebase Scheduled Function (ทุกวัน 7:00 น.)
  │
  ▼
InsightBrain.generateDailyBrief(shopId)
  │
  ├─ ดึงข้อมูล 7 วันล่าสุดจาก Firestore
  ├─ เปรียบเทียบกับ 7 วันก่อนหน้า
  ├─ ตรวจ stock alerts
  ├─ ดูว่ามีลูกค้าหายไปไหม
  │
  └─ [Gemini Pro] สรุปเป็นภาษาไทยเข้าใจง่าย
        │
        ▼
     ส่ง LINE notification + อัปเดต Dashboard
```

---

## Security Architecture

```
┌─────────────────────────────────────────────┐
│              Security Layers                │
├─────────────────────────────────────────────┤
│ 1. Firebase Auth (JWT)                      │
│    └─ ทุก API call ต้องมี valid token       │
│                                             │
│ 2. Firestore Security Rules                 │
│    └─ shop owner เห็นข้อมูลเฉพาะร้านตัวเอง│
│                                             │
│ 3. API Rate Limiting                        │
│    └─ ป้องกัน abuse + AI cost control      │
│                                             │
│ 4. LINE Signature Validation                │
│    └─ verify ทุก webhook จาก LINE          │
│                                             │
│ 5. Environment Variables                    │
│    └─ API keys ไม่โชว์ใน client side       │
└─────────────────────────────────────────────┘
```

---

## Scalability Plan

| ระดับ | ลูกค้า | Infrastructure |
|-------|--------|----------------|
| **Starter** | 1-50 ร้าน | Vercel Hobby + Firebase Spark |
| **Growth** | 50-500 ร้าน | Vercel Pro + Firebase Blaze |
| **Scale** | 500+ ร้าน | Multi-region + Cloud Run + Redis cache |

---

## AI Cost Estimation

| Feature | Model | ต้นทุนต่อร้าน/เดือน |
|---------|-------|-------------------|
| Chat Brain (1,000 msg) | Gemini 2.0 Flash | ~15 บาท |
| Content Brain (30 posts) | Gemini Pro | ~30 บาท |
| Image Generation (30 img) | Imagen 3 | ~90 บาท |
| Sales Forecast | Gemini Pro | ~10 บาท |
| Daily Briefing (30 days) | Gemini Flash | ~5 บาท |
| **รวม** | | **~150 บาท/ร้าน/เดือน** |

> Gross Margin จาก Pro Plan (2,490 บาท): **(2,490 - 150) / 2,490 = 94%** ✅
