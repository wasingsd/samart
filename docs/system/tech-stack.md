# ⚙️ Panya — Tech Stack

---

## Stack Overview

```
┌──────────────────────────────────────────────────────┐
│                   PANYA TECH STACK                   │
├──────────────┬───────────────────────────────────────┤
│  Frontend    │  Next.js 15 · TypeScript · Tailwind   │
│  State       │  Zustand · React Query (tRPC)          │
│  Backend     │  Next.js API Routes · tRPC             │
│  Database    │  Firebase Firestore                    │
│  Auth        │  Firebase Auth + LINE Login            │
│  AI Core     │  Google Gemini 2.0 Pro / Flash         │
│  Image AI    │  Gemini Imagen 3                       │
│  Video AI    │  FAL.ai (Veo 2)                        │
│  Storage     │  Firebase Storage                      │
│  Messaging   │  LINE Messaging API + LIFF             │
│  Payment     │  Omise (Thai) + Stripe                 │
│  Hosting     │  Vercel                                │
│  Jobs        │  Firebase Scheduled Functions          │
│  Email       │  Resend                                │
│  Analytics   │  Vercel Analytics + PostHog            │
└──────────────┴───────────────────────────────────────┘
```

---

## Detailed Decisions

### Frontend

#### Next.js 15 (App Router)
```bash
# เหตุผลที่เลือก
✅ คุ้นเคยแล้วจากโปรเจคก่อน (pos-delivery, mbs.system)
✅ SSR ดีสำหรับ SEO landing page
✅ API Routes ใช้เป็น backend ได้เลย ไม่ต้องแยก server
✅ Server Components ลด JavaScript bundle ใน dashboard
```

#### Tailwind CSS v4
```bash
✅ utility-first ทำ UI เร็ว
✅ ไม่ต้องแยก CSS file
✅ dark mode ง่าย
```

#### State Management
```typescript
// Zustand — global state (user session, shop settings)
const useShopStore = create<ShopState>((set) => ({
  currentShop: null,
  setShop: (shop) => set({ currentShop: shop }),
}))

// TanStack Query + tRPC — server state
const { data } = trpc.analytics.getSalesOverview.useQuery({ period: '7d' })
```

---

### Backend (API Layer)

#### tRPC
```typescript
// Type-safe API calls — ไม่ต้องเขียน type ซ้ำ
// client รู้ type เดียวกับ server อัตโนมัติ

// server (router)
export const shopRouter = router({
  getProfile: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input, ctx }) => {
      return await getShopProfile(input.shopId, ctx.userId)
    }),
})

// client (auto-typed)
const { data } = trpc.shop.getProfile.useQuery({ shopId })
```

---

### Database — Firebase Firestore

#### เหตุผลที่เลือก Firestore
```
✅ Real-time listeners → dashboard อัปเดตทันทีเมื่อมี order ใหม่
✅ Serverless → ไม่ต้อง maintain database server
✅ คุ้นเคยแล้ว (ใช้ในทุกโปรเจคก่อน)
✅ ราคาถูกมากสำหรับ scale แรก (free tier ครอบคลุม 50+ ร้าน)
✅ Firebase Auth + Firestore Security Rules จัดการ permission ง่าย
```

#### Collection Structure → ดู `database-schema.md`

---

### AI Stack

#### Google Gemini — Model Selection

| Use case | Model | เหตุผล |
|----------|-------|--------|
| Chat Brain (ตอบแชท) | `gemini-2.0-flash` | เร็ว, ถูก, Thai ดี |
| Content Brain (สร้างโพสต์) | `gemini-2.0-pro` | คุณภาพสูง, creative |
| Sales Forecast | `gemini-2.0-pro` | reasoning ดี |
| Daily Briefing | `gemini-2.0-flash` | ปริมาณมาก ต้องถูก |
| Image Generation | `imagen-3.0` | คุณภาพดีที่สุด |
| Video Generation | `FAL.ai veo-2` | Gemini Veo แพงเกิน |

#### RAG Implementation (Chat Brain)
```typescript
// Knowledge base: menu + FAQ + promotions + shop info
// Embedding: text-embedding-004 (Gemini)
// Vector store: Firestore (simple cosine similarity)
// → ไม่ต้องใช้ Pinecone/Weaviate ให้ซับซ้อน

async function buildContext(shopId: string, query: string) {
  const shopData = await getShopKnowledge(shopId)  // menu, FAQ, hours
  const relevant = await semanticSearch(shopData, query)
  return formatAsContext(relevant)
}
```

---

### Messaging — LINE Integration

```typescript
// LINE Messaging API + LIFF
// ทุกร้านค้าจะ connect LINE OA ของตัวเองกับ Panya

// Webhook Handler
app.post('/api/webhook/line', async (req, res) => {
  const events = req.body.events
  for (const event of events) {
    if (event.type === 'message') {
      await chatBrain.handleMessage(event, shopId)
    } else if (event.type === 'follow') {
      await chatBrain.handleFollow(event, shopId)
    }
  }
})
```

---

### Payment — Omise (Primary)

```
เหตุผลที่ใช้ Omise แทน Stripe:
✅ รองรับ PromptPay, TrueMoney, Thai credit cards
✅ เจ้าของร้านไทยคุ้นเคย
✅ KYC สำหรับ business ไทยง่ายกว่า
✅ Stripe ไว้สำหรับลูกค้าต่างชาติที่จ่ายด้วย international card
```

---

### Infrastructure

#### Vercel Deployment
```bash
# ง่ายที่สุดสำหรับ Next.js solo dev
# Zero config deployment
# Edge functions สำหรับ low-latency API
# Built-in analytics

vercel --prod
```

#### Firebase Scheduled Functions (Cron Jobs)
```typescript
// ทำงานทุกวัน 7:00 น. — สร้าง Daily Briefing
export const dailyBriefing = onSchedule('0 7 * * *', async () => {
  const shops = await getActiveShops()
  await Promise.all(shops.map(shop =>
    insightBrain.generateDailyBrief(shop.id)
  ))
})

// ทุกคืน 23:00 น. — เช็ค follow-up ลูกค้าที่หายไป
export const customerFollowUp = onSchedule('0 23 * * *', async () => {
  await chatBrain.checkDormantCustomers()
})
```

---

## Package List (package.json)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "@trpc/server": "^11.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "zod": "^3.0.0",
    "firebase": "^11.0.0",
    "firebase-admin": "^12.0.0",
    "@line/bot-sdk": "^9.0.0",
    "@line/liff": "^2.0.0",
    "@google/generative-ai": "^0.21.0",
    "@fal-ai/client": "^1.0.0",
    "omise": "^3.0.0",
    "resend": "^4.0.0",
    "date-fns": "^3.0.0",
    "recharts": "^2.0.0",
    "lucide-react": "^0.400.0",
    "framer-motion": "^11.0.0"
  }
}
```

---

## Development Tools

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "playwright": "^1.45.0",
    "prisma": "^5.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  }
}
```
