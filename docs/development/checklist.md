# ✅ Panya — แผนพัฒนาละเอียด + Checklist

> แผนรายวัน Phase 1: MVP Foundation (42 วัน / 6 สัปดาห์)
> ทุกข้อเรียงตาม dependency — ทำจากบนลงล่าง

---

## 📅 สัปดาห์ 1: Project Setup + Auth + Onboarding

### Day 1: สร้างโปรเจค

- [ ] `npx -y create-next-app@latest ./ --typescript --tailwind --app --src-dir --eslint`
- [ ] ลบ boilerplate code (default page, styles)
- [ ] สร้าง `.env.local` ใส่ placeholder keys ทั้งหมด:
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  FIREBASE_ADMIN_CLIENT_EMAIL=
  FIREBASE_ADMIN_PRIVATE_KEY=
  LINE_CHANNEL_ID=
  LINE_CHANNEL_SECRET=
  LINE_ACCESS_TOKEN=
  GEMINI_API_KEY=
  ```
- [ ] สร้าง `.env.example` (ไม่มี secrets)
- [ ] ติดตั้ง dependencies หลัก:
  ```bash
  npm i firebase firebase-admin
  npm i @trpc/server @trpc/client @trpc/react-query @tanstack/react-query
  npm i zod zustand
  npm i lucide-react framer-motion recharts
  npm i -D vitest @testing-library/react
  ```
- [ ] สร้าง `.gitignore` ให้ครอบคลุม `.env.local`, `node_modules/`, `.next/`

### Day 2: Config + Design System + Firebase

- [ ] สร้าง `src/lib/firebase/config.ts` — Firebase client initialization
  - initializeApp with env vars
  - export `auth`, `db` (getFirestore)
- [ ] สร้าง `src/lib/firebase/admin.ts` — Firebase Admin SDK
  - cert from env (Base64 encoded private key)
  - export `adminAuth`, `adminDb`
- [ ] แก้ `tailwind.config.ts` — เพิ่ม brand tokens:
  - Colors: primary `#1A237E`, secondary `#00B4D8`, amber `#F4A261`, dark `#1A1A2E`, light `#F8FAFE`, success `#2D9C5A`
  - Fonts: Prompt, Sarabun, Inter, JetBrains Mono
- [ ] แก้ `src/styles/globals.css`:
  - `@import` Google Fonts (Prompt, Sarabun, Inter)
  - CSS custom properties สำหรับ brand colors
  - Base styles (body font: Sarabun)
- [ ] สร้าง `src/app/layout.tsx` — Root layout
  - `<html lang="th">`
  - Google Fonts link
  - Metadata: title "Panya — AI สมองร้านค้า"

### Day 3: tRPC Setup

- [ ] สร้าง `src/lib/trpc/context.ts` — tRPC context
  - verifyFirebaseToken จาก Authorization header
  - inject `user`, `shopId` ทุก request
- [ ] สร้าง `src/lib/trpc/server.ts` — tRPC init
  - `initTRPC.context<Context>().create()`
  - export `router`, `publicProcedure`, `protectedProcedure`
  - protectedProcedure: check user != null
- [ ] สร้าง `src/lib/trpc/routers/index.ts` — Root router
  - merge: auth, shop (เริ่มแค่ 2 ตัว)
- [ ] สร้าง `src/app/api/trpc/[trpc]/route.ts` — HTTP handler
- [ ] สร้าง `src/lib/trpc/client.ts` — tRPC client setup
- [ ] สร้าง `src/components/providers/TRPCProvider.tsx`
  - QueryClientProvider + trpc.Provider
- [ ] อัปเดต `src/app/layout.tsx` — wrap with TRPCProvider

### Day 4: Auth — Zod Schemas + tRPC Router

- [ ] สร้าง `src/types/user.ts` — Zod schemas
  ```typescript
  export const UserSchema = z.object({
    uid: z.string(),
    email: z.string().email(),
    displayName: z.string(),
    shopId: z.string().nullable(),
    role: z.enum(['owner', 'staff']),
    lineUserId: z.string().optional(),
    createdAt: z.any(),
    updatedAt: z.any(),
  })
  ```
- [ ] สร้าง `src/lib/trpc/routers/auth.ts`
  - `auth.createUserDoc` — mutation: สร้าง users/{uid} ใน Firestore
  - `auth.getMe` — query: ดึง user doc ปัจจุบัน
  - `auth.connectLine` — mutation: อัปเดต lineUserId
- [ ] สร้าง `src/lib/firebase/auth.ts` — Auth helpers
  - `signUpWithEmail(email, password)`
  - `signInWithEmail(email, password)`
  - `signOut()`
  - `onAuthStateChange(callback)`
- [ ] สร้าง `src/hooks/useAuth.ts` — Auth hook
  - `{ user, loading, error, signIn, signUp, signOut }`
- [ ] สร้าง `src/contexts/AuthProvider.tsx`
  - onAuthStateChanged listener
  - provide user + loading state

### Day 5: Auth — UI Pages

- [ ] สร้าง `src/app/(auth)/layout.tsx` — Auth layout
  - Centered, brand gradient background
  - Panya logo + tagline
- [ ] สร้าง `src/app/(auth)/login/page.tsx`
  - Email + password form
  - "เข้าด้วย LINE" button (Phase 2)
  - Link ไป register
  - **อ้างอิง Stitch**: `เข้าสู่ระบบ (V2)`
- [ ] สร้าง `src/app/(auth)/register/page.tsx`
  - ชื่อ + email + password form
  - เรียก `auth.createUserDoc` หลัง Firebase register
  - Redirect ไป `/onboarding`
  - **อ้างอิง Stitch**: `สมัครสมาชิก (V2)`
- [ ] สร้าง `src/middleware.ts` — Route protection
  - `/login`, `/register` → ไม่ต้อง auth
  - `/(dashboard)/*` → ต้อง auth, ถ้าไม่มี → redirect `/login`
  - ถ้า login แล้วแต่ไม่มี shopId → redirect `/onboarding`

### Day 6: Shop — Zod Schemas + tRPC Router

- [ ] สร้าง `src/types/shop.ts` — Zod schemas
  ```typescript
  export const BusinessHoursSchema = z.object({
    monday: DayHoursSchema,
    // ... ทุกวัน
  })
  export const StyleProfileSchema = z.object({
    botName: z.string(),
    formalityLevel: z.number().min(0).max(100),
    emojiUsage: z.enum(['none', 'some', 'lots']),
    replyLength: z.enum(['short', 'medium', 'long']),
    language: z.enum(['thai', 'mixed', 'english']),
    closingPhrase: z.string(),
    openingGreeting: z.string(),
    guardrails: z.array(z.string()),
  })
  export const ShopCreateSchema = z.object({
    name: z.string().min(1),
    category: z.enum([...]),
    phone: z.string(),
    address: z.string(),
    businessHours: BusinessHoursSchema,
    styleProfile: StyleProfileSchema,
  })
  ```
- [ ] สร้าง `src/lib/trpc/routers/shop.ts`
  - `shop.create` — mutation: สร้าง shops/{shopId}, อัปเดต users.shopId
  - `shop.getByOwner` — query: ดึงร้านของ user
  - `shop.update` — mutation: แก้ไขข้อมูลร้าน
  - `shop.updateStyle` — mutation: บันทึก styleProfile
  - `shop.connectLine` — mutation: บันทึก LINE credentials
- [ ] อัปเดต root router — merge shop router

### Day 7: Onboarding Wizard UI

- [ ] สร้าง `src/app/onboarding/page.tsx` — 3-step wizard
  - State: currentStep (1-3), formData
  - Progress bar (Step 1/3, 2/3, 3/3)
- [ ] สร้าง `src/components/onboarding/StepShopInfo.tsx`
  - ชื่อร้าน*, ประเภท* (dropdown), โทรศัพท์, ที่อยู่, โลโก้
  - **อ้างอิง Stitch**: `ออนบอร์ดดิ้ง 1: ข้อมูลร้าน (V2)`
- [ ] สร้าง `src/components/onboarding/StepAISetup.tsx`
  - ชื่อ Bot, Formality slider, Emoji radio, ภาษา, คำทักทาย, คำปิดท้าย
  - **อ้างอิง Stitch**: `ออนบอร์ดดิ้ง 2: ตั้งค่า AI (V2)`
- [ ] สร้าง `src/components/onboarding/StepScheduleMenu.tsx`
  - เวลาเปิด-ปิด 7 วัน, เพิ่มเมนูเริ่มต้น (optional)
  - **อ้างอิง Stitch**: `ออนบอร์ดดิ้ง 3: เวลาและเมนู (V2)`
- [ ] หลังกด "เสร็จสิ้น" → เรียก `shop.create` → redirect `/`

---

## 📅 สัปดาห์ 2: Dashboard + Menu + Deploy

### Day 8: Dashboard Layout

- [ ] สร้าง `src/stores/useShopStore.ts` — Zustand store
  - `{ shop, user, setShop, setUser }`
  - Hydrate จาก `shop.getByOwner` เมื่อ mount
- [ ] สร้าง `src/app/(dashboard)/layout.tsx`
  - Fetch shop data → store
  - Sidebar (desktop) + bottom nav (mobile)
  - Header: ชื่อร้าน + user avatar + dropdown
- [ ] สร้าง `src/components/layout/Sidebar.tsx`
  - Navigation items: หน้าหลัก, เมนู, ความรู้ AI, แชท, โพสต์, ยอดขาย, ลูกค้า, ตั้งค่า
  - Active state highlight, brand icons (lucide-react)
  - Responsive: collapse on mobile
  - **อ้างอิง Stitch**: sidebar ใน `หน้าหลัก Dashboard (V2)`
- [ ] สร้าง `src/components/layout/Header.tsx`
  - ชื่อร้าน, plan badge, user avatar + dropdown (settings, logout)
- [ ] สร้าง `src/components/layout/MobileNav.tsx`
  - Bottom tab bar สำหรับ mobile (5 items)

### Day 9: Dashboard Home (Placeholder)

- [ ] สร้าง `src/app/(dashboard)/page.tsx` — Dashboard home
  - Welcome message "สวัสดีตอน[เช้า/บ่าย/เย็น] คุณ{name}!"
  - Placeholder cards: ยอดเมื่อวาน, สิ่งที่ต้องทำ, กราฟยอดขาย, แชทล่าสุด
  - (จะเติมข้อมูลจริงใน Sprint 3)
  - **อ้างอิง Stitch**: `หน้าหลัก Dashboard (V2)` Desktop + Mobile

### Day 10: Menu — Zod Schemas + tRPC Router

- [ ] สร้าง `src/types/menu.ts` — Zod schemas
  ```typescript
  export const MenuCreateSchema = z.object({
    name: z.string().min(1),
    price: z.number().positive(),
    category: z.string(),
    description: z.string(),
    allergens: z.array(z.string()),
    tags: z.array(z.string()),
    inStock: z.boolean().default(true),
  })
  ```
- [ ] สร้าง `src/lib/trpc/routers/menu.ts`
  - `menu.list` — query: ดึงเมนูของร้าน (filter category)
  - `menu.create` — mutation: เพิ่มเมนูใหม่
  - `menu.update` — mutation: แก้ไข
  - `menu.delete` — mutation: ลบ
  - `menu.toggleStock` — mutation: สลับ inStock
  - `menu.listCategories` — query: ดึง unique categories
  - `menu.importCSV` — mutation: parse CSV, batch create
- [ ] อัปเดต root router — merge menu router

### Day 11: Menu — UI

- [ ] สร้าง `src/app/(dashboard)/menu/page.tsx`
  - Search bar + category filter
  - Menu items grouped by category
  - FAB: "+ เพิ่มเมนู" button
  - Import CSV button
  - **อ้างอิง Stitch**: `จัดการเมนู (V2)` Desktop + Mobile
- [ ] สร้าง `src/components/menu/MenuItemCard.tsx`
  - ชื่อ, ราคา, สถานะ (🟢/🔴), tags
  - ปุ่ม: แก้ไข, ลบ, toggle stock
- [ ] สร้าง `src/components/menu/MenuForm.tsx` — Modal dialog
  - Form fields: ชื่อ*, ราคา*, หมวดหมู่, คำอธิบาย, allergens, tags, สถานะ
  - ใช้สำหรับทั้ง "เพิ่ม" และ "แก้ไข"
  - **อ้างอิง Stitch**: `เพิ่มเมนูใหม่ (V2)`
- [ ] สร้าง `src/components/menu/CategoryFilter.tsx`
  - Horizontal pill tabs

### Day 12: Settings Page Structure

- [ ] สร้าง `src/app/(dashboard)/settings/page.tsx`
  - Tab navigation: ข้อมูลร้าน, สไตล์ AI, LINE OA, แพลน
  - Tab: ข้อมูลร้าน → form แก้ไข shop info
  - Tab: สไตล์ AI → placeholder (Sprint 2)
  - Tab: LINE OA → placeholder (Sprint 2)
  - Tab: แพลน → แสดง plan ปัจจุบัน (read-only)
  - **อ้างอิง Stitch**: `ตั้งค่าระบบ (V2)`

### Day 13: Firestore Rules + Testing

- [ ] สร้าง `firestore.rules` — Security rules
  - users: owner only
  - shops + subcollections: isShopOwner only
  - analytics: isShopOwner only
- [ ] สร้าง `vitest.config.ts`
- [ ] สร้าง `src/__tests__/types.test.ts` — test Zod schemas
  - Valid/invalid UserSchema, ShopCreateSchema, MenuCreateSchema
- [ ] Test: register → login → redirect to onboarding
- [ ] Test: complete onboarding → redirect to dashboard
- [ ] Test: add/edit/delete menu

### Day 14: Staging Deploy

- [ ] สร้าง `vercel.json` (ถ้าจำเป็น)
- [ ] Deploy to Vercel staging
- [ ] ตั้ง environment variables บน Vercel
- [ ] ทดสอบบน mobile Chrome + Safari
- [ ] ทดสอบบน LINE in-app browser
- [ ] Fix bugs ที่เจอ

---

## 📅 สัปดาห์ 3: LINE + Knowledge Center

### Day 15: LINE Webhook Setup

- [ ] สร้าง `src/lib/line/validate.ts` — Signature validation
  - `validateLineSignature(body, signature, channelSecret)`
- [ ] สร้าง `src/lib/line/client.ts` — LINE Messaging API client
  - `new Client({ channelAccessToken })` สำหรับแต่ละร้าน
  - `getClientForShop(shopId)` — ดึง token จาก shop doc
- [ ] สร้าง `src/lib/line/reply.ts` — Reply helpers
  - `replyText(replyToken, text)`
  - `replyFlex(replyToken, flexMessage)` (สำหรับ rich messages)
- [ ] สร้าง `src/app/api/webhook/line/route.ts`
  - POST handler: validate signature → parse events
  - Identify shop จาก channelId
  - Route message events → Chat Brain (Sprint 2 Week 4)
  - ตอนนี้: echo reply เพื่อทดสอบ
  - Response: 200 OK (ต้องตอบภายใน 30 วินาที)

### Day 16: LINE OA Connect UI

- [ ] สร้าง `src/components/settings/LineOAConnect.tsx`
  - Input: Channel ID, Channel Secret, Access Token
  - ปุ่ม "เชื่อมต่อ" → เรียก `shop.connectLine`
  - สถานะ: 🟢 เชื่อมต่อแล้ว / 🔴 ยังไม่เชื่อมต่อ
  - แสดง Webhook URL ที่ต้องตั้งค่าใน LINE Developer Console
  - ปุ่ม "ทดสอบ Webhook"
  - **อ้างอิง Stitch**: `ตั้งค่า: เชื่อมต่อ LINE OA (V2)`
- [ ] เพิ่ม `shop.testWebhook` ใน shop router
  - ส่ง test message ไป LINE OA → ดูว่าได้ echo reply
- [ ] อัปเดต settings page — Tab: LINE OA ใช้ LineOAConnect

### Day 17: Knowledge — Zod Schemas + tRPC Router

- [ ] สร้าง `src/types/knowledge.ts` — Zod schemas
  ```typescript
  export const KnowledgeCreateSchema = z.object({
    type: z.enum(['menu','faq','policy','promotion','about','freeform']),
    title: z.string(),
    content: z.string(),
    keywords: z.array(z.string()),
    language: z.enum(['th','en','both']).default('th'),
  })
  export const KnowledgeHealthSchema = z.object({
    totalDocs: z.number(),
    menuCount: z.number(),
    faqCount: z.number(),
    hasBusinessHours: z.boolean(),
    hasDeliveryInfo: z.boolean(),
    completionPercent: z.number(),
  })
  ```
- [ ] สร้าง `src/lib/ai/embedding.ts`
  - `embedText(text)` — Google text-embedding-004 API
  - Return: number[] (768 dimensions)
- [ ] สร้าง `src/lib/trpc/routers/knowledge.ts`
  - `knowledge.list` — query: ดึงทั้งหมด (filter type)
  - `knowledge.create` — mutation: สร้าง + embed + save
  - `knowledge.createFreeform` — mutation: AI structure + embed
  - `knowledge.update` — mutation: แก้ไข + re-embed
  - `knowledge.delete` — mutation: ลบ
  - `knowledge.getHealth` — query: คำนวณ % ครบถ้วน
  - `knowledge.buildFromMenu` — mutation: สร้าง docs จากเมนูทั้งหมด
- [ ] อัปเดต root router — merge knowledge router

### Day 18: Knowledge Center UI — Main Page

- [ ] สร้าง `src/app/(dashboard)/knowledge/page.tsx`
  - Knowledge Health bar (% ครบถ้วน)
  - Sections: เมนู, FAQ, เวลา, โปรโมชัน, นโยบาย
  - แต่ละ section: จำนวน items + ปุ่ม "จัดการ"
  - **อ้างอิง Stitch**: `ศูนย์ความรู้ AI (V2)` Desktop + Mobile
- [ ] สร้าง `src/components/knowledge/KnowledgeHealth.tsx`
  - Progress bar + breakdown per category

### Day 19: Knowledge Center UI — Components

- [ ] สร้าง `src/components/knowledge/FAQBuilder.tsx`
  - คำถาม* + คำตอบ* + คำถามที่หมายความเดียวกัน (variants)
  - เพิ่ม/แก้ไข/ลบ FAQ
- [ ] สร้าง `src/components/knowledge/FreeformInput.tsx`
  - Textarea "พิมพ์อะไรก็ได้ที่อยากให้ AI รู้"
  - ปุ่ม "บันทึก" → เรียก `knowledge.createFreeform`
- [ ] สร้าง `src/components/knowledge/FileUpload.tsx`
  - Drag & drop zone
  - รองรับ: PDF, Word, CSV, รูปภาพ
  - เรียก `knowledge.uploadFile` → แสดง preview → confirm

### Day 20-21: Knowledge — Auto-build + File Processing

- [ ] สร้าง `src/lib/ai/knowledge-builder.ts`
  - `buildInitialKnowledge(shopId)` — สร้างจากข้อมูล onboarding
  - `buildMenuDocs(menuItems)` — แปลงเมนูเป็น knowledge docs
  - `buildBusinessHoursDocs(hours)` — แปลงเวลาเป็น knowledge
- [ ] สร้าง `src/lib/ai/file-processor.ts`
  - `processUploadedFile(file)` — Extract text ตามประเภท
  - CSV: papa parse
  - PDF: pdf-parse (หรือ Gemini Vision)
  - Image: Gemini Vision → extract text
  - `splitIntoKnowledgeDocs(text)` — AI แยกเป็น docs
- [ ] ติดตั้ง dependencies เพิ่ม: `npm i papaparse pdf-parse`
- [ ] เพิ่ม `knowledge.uploadFile` + `knowledge.confirmImport` ใน router
- [ ] Hook: เมื่อ onboarding เสร็จ → auto `knowledge.buildFromMenu`

---

## 📅 สัปดาห์ 4: AI Style + Chat Brain + Learning Loop

### Day 22: AI Style Customizer

- [ ] สร้าง `src/components/settings/AIStyleCustomizer.tsx`
  - ชื่อ Bot input
  - Formality slider (0-100)
  - Emoji radio: ไม่ใช้ / บ้าง / เยอะ
  - Reply length radio: สั้น / กลาง / ละเอียด
  - Language radio: ไทย / ผสม / อังกฤษ
  - คำปิดท้าย input
  - คำทักทาย input
  - Guardrails list (เพิ่ม/ลบ)
  - ปุ่ม "บันทึก" → `shop.updateStyle`
- [ ] สร้าง `src/lib/ai/style-profile.ts`
  - `styleProfileToPrompt(style)` — แปลง StyleProfile เป็น system prompt segment
- [ ] อัปเดต settings page — Tab: สไตล์ AI ใช้ AIStyleCustomizer

### Day 23: AI Preview

- [ ] สร้าง `src/components/settings/AIPreview.tsx`
  - Input: "ลองพิมพ์คำถาม"
  - ปุ่ม "▶" → เรียก `shop.previewAI`
  - แสดง AI response ใน chat bubble style
- [ ] เพิ่ม `shop.previewAI` ใน shop router
  - รับ question + ใช้ shop context/style → Gemini Flash → return reply

### Day 24-25: Chat Brain Core

- [ ] สร้าง `src/lib/ai/gemini.ts` — Gemini client
  - `createGeminiClient()` — from @google/generative-ai
  - `generateText(model, prompt)` — Flash สำหรับ chat, Pro สำหรับ content
  - Error handling + retry logic
- [ ] สร้าง `src/lib/ai/rag.ts` — RAG retrieval
  - `semanticSearch(shopId, queryEmbedding, topK)` — Firestore vector search
  - `keywordSearch(shopId, query)` — Fallback keyword search
  - `retrieveContext(shopId, query)` — Combine semantic + keyword, return top-3 docs
- [ ] สร้าง `src/lib/ai/context-builder.ts`
  - `buildDynamicContext(shopId)` — real-time: stock status, promos, hours, current time
- [ ] สร้าง `src/lib/ai/intent-classifier.ts`
  - `classifyIntent(message)` — return: 'order' | 'faq' | 'booking' | 'complaint' | 'general'
  - ใช้ Gemini Flash + structured output

### Day 26-27: Chat Brain Orchestrator

- [ ] สร้าง `src/lib/ai/chat-brain.ts` — Main orchestrator
  - `handleChatMessage(shopId, customerMessage, customer)`
  - ประกอบ prompt 4 layers:
    1. Core system prompt + style profile
    2. RAG context (top-3)
    3. Dynamic context (stock, promos, hours)
    4. Few-shot examples (top-3 learned patterns)
    5. Customer info (name, segment, history)
    6. Customer message
  - เรียก Gemini Flash
  - Validate response (no hallucination check)
  - Return reply
- [ ] สร้าง `src/lib/ai/response-validator.ts`
  - `validateResponse(response, context)` — ตรวจสอบ:
    - ไม่มีราคาที่ไม่มีใน context
    - ไม่มีเมนูที่ไม่มีจริง
    - ตรวจ guardrails
  - ถ้าไม่ผ่าน → fallback "ขอสอบถามเพิ่มเติมนะคะ"
- [ ] สร้าง `src/lib/ai/customer-memory.ts`
  - `upsertCustomer(shopId, lineEvent)` — สร้าง/อัปเดต customer doc
  - `classifySegment(customer)` — new/regular/vip/dormant
- [ ] อัปเดต LINE webhook → เรียก Chat Brain แทน echo

### Day 28: Chat Log + Learning Loop

- [ ] สร้าง `src/types/chat.ts` — Zod schemas
  - ConversationSchema, LearnedPatternSchema, CorrectionInputSchema
- [ ] สร้าง `src/lib/trpc/routers/chatLog.ts`
  - `chatLog.list` — query: ดึง conversations (with pagination)
  - `chatLog.approve` — mutation: save learnedPattern (type: approved)
  - `chatLog.correct` — mutation: save pattern + send corrected reply via LINE
  - `chatLog.feature` — mutation: save as featured example
  - `chatLog.getStats` — query: total, approved, corrected counts
- [ ] สร้าง `src/app/(dashboard)/chat-logs/page.tsx`
  - Conversation list + filter (ทั้งหมด / ⚠️ ต้องตรวจ / ✅ approved)
  - **อ้างอิง Stitch**: `ประวัติแชทและการเรียนรู้ (V2)` Desktop + Mobile
- [ ] สร้าง `src/components/chat/ConversationList.tsx`
  - แต่ละ conversation: ลูกค้า + ข้อความ + AI reply + actions
  - ปุ่ม: ✅ ดี, ✏️ แก้ไข, ⭐ บันทึก
- [ ] สร้าง `src/components/chat/CorrectionModal.tsx`
  - แสดง: ลูกค้าถาม + AI ตอบ (ผิด) + textarea แก้ไข
  - Checkbox: บันทึกเป็นตัวอย่าง + เพิ่มใน Knowledge Base
  - ปุ่ม "บันทึกและส่ง"
- [ ] อัปเดต root router — merge chatLog router

---

## 📅 สัปดาห์ 5: Analytics + Customers

### Day 29-30: Analytics — Schema + Router

- [ ] สร้าง `src/types/analytics.ts` — Zod schemas
  - SaleInputSchema, DailyAnalyticsSchema, DashboardDataSchema
- [ ] สร้าง `src/lib/trpc/routers/analytics.ts`
  - `analytics.getDashboard` — query: period (7d/14d/30d), return chart data + stats
  - `analytics.getTopProducts` — query: top products by revenue
  - `analytics.recordSale` — mutation: บันทึกยอดขาย manual
  - `analytics.importCSV` — mutation: import sales CSV
  - `analytics.getTodayRevenue` — query: real-time ยอดวันนี้
- [ ] อัปเดต root router — merge analytics router

### Day 31-32: Analytics — UI

- [ ] สร้าง `src/app/(dashboard)/analytics/page.tsx`
  - Period selector: 7 วัน / 14 วัน / 30 วัน
  - Quick stats cards: revenue, orders, avg, new customers
  - Sales chart (Recharts)
  - Top products table
  - Manual sales input button
  - **อ้างอิง Stitch**: `วิเคราะห์ยอดขาย (V2)` + `AI Insights (V2)`
- [ ] สร้าง `src/components/analytics/SalesChart.tsx` — Recharts Line/Bar chart
- [ ] สร้าง `src/components/analytics/TopProducts.tsx` — Ranked list
- [ ] สร้าง `src/components/analytics/QuickStats.tsx` — 4 stat cards
- [ ] สร้าง `src/components/analytics/SalesInput.tsx` — Manual input form

### Day 33-34: Customers

- [ ] สร้าง `src/types/customer.ts` — Zod schemas
- [ ] สร้าง `src/lib/trpc/routers/customers.ts`
  - `customers.list` — query: filter by segment
  - `customers.getProfile` — query: customer detail
  - `customers.update` — mutation: edit notes/preferences
  - `customers.sendMessage` — mutation: LINE follow-up
  - `customers.broadcast` — mutation: broadcast by segment
  - `customers.getSegmentCounts` — query: segment breakdown
- [ ] สร้าง `src/app/(dashboard)/customers/page.tsx`
  - Segment tabs: ทั้งหมด / VIP / ประจำ / ใหม่ / หาย
  - Segment count badges
  - Customer list cards
  - ปุ่ม "ส่ง Broadcast"
  - **อ้างอิง Stitch**: `จัดการลูกค้า (V2)`, `โปรไฟล์ลูกค้า (V2)`
- [ ] สร้าง `src/components/customers/CustomerCard.tsx`
- [ ] สร้าง `src/components/customers/CustomerProfile.tsx` — Detail modal
- [ ] อัปเดต root router — merge customers router

---

## 📅 สัปดาห์ 6: Daily Briefing + Final

### Day 35-36: Daily Briefing

- [ ] สร้าง `src/lib/ai/insight-brain.ts`
  - `generateDailyBriefing(shopId)` — ดึงข้อมูลเมื่อวาน → Gemini Pro → briefing
  - Input: yesterday sales, top products, stock alerts, unanswered chats
  - Output: summary text + action items (2-3 ข้อ)
- [ ] สร้าง `src/lib/ai/anomaly-detector.ts`
  - `detectAnomalies(shopId)` — เช็ค: ยอดตกผิดปกติ, สต็อกหมด, ลูกค้าหาย
- [ ] สร้าง `src/components/dashboard/DailyBriefing.tsx` — Briefing card
- [ ] สร้าง `src/components/dashboard/ActionItems.tsx` — Action items list
- [ ] สร้าง `src/components/dashboard/RecentChats.tsx` — Recent chats preview
- [ ] อัปเดต `src/app/(dashboard)/page.tsx` — ใส่ real data:
  - ยอดเมื่อวาน (จาก analytics)
  - Daily briefing (จาก AI)
  - Action items
  - กราฟ 7 วัน (จาก analytics)
  - แชทล่าสุด (จาก chatLog)

### Day 37-38: Stock Alerts + Inventory

- [ ] เพิ่ม `ai.stockAlerts` ใน ai router
  - Query inventory → filter items ที่ currentStock < minStock
- [ ] เพิ่ม stock alerts component บน dashboard
- [ ] เพิ่ม `ai.forecast` ใน ai router (basic)
  - ใช้ last 7 days → Gemini Pro → predict next 7 days

### Day 39-40: Content Brain (Basic)

- [ ] สร้าง `src/app/(dashboard)/content/page.tsx`
  - ประเภทโพสต์ dropdown, สินค้า dropdown, น้ำเสียง dropdown
  - Platform checkboxes (Facebook, LINE)
  - ปุ่ม "สร้าง Content"
  - Preview area + edit textarea
  - ปุ่ม "ตั้งเวลา" / "โพสต์เลย"
  - **อ้างอิง Stitch**: `สร้างโพสต์ AI (V2)`
- [ ] เพิ่ม `ai.generatePost` ใน ai router
- [ ] เพิ่ม `ai.generateImage` ใน ai router (Gemini Imagen 3)
- [ ] เพิ่ม `ai.schedulePost` ใน ai router

### Day 41-42: Final Testing + Polish

- [ ] Firestore Security Rules — ทดสอบทุก collection
- [ ] E2E test flow: register → onboarding → add menu → knowledge → chat → analytics
- [ ] ทดสอบ LINE webhook end-to-end
- [ ] Mobile responsive check (375px, 390px, 414px)
- [ ] LINE in-app browser test
- [ ] Performance: Lighthouse score > 80
- [ ] Fix critical bugs
- [ ] Deploy staging final version
- [ ] Sprint review

---

## 📊 สรุป

| สัปดาห์ | หัวข้อ | Tasks |
|---------|--------|-------|
| 1 | Project + Auth + Onboarding | 42 items |
| 2 | Dashboard + Menu + Deploy | 30 items |
| 3 | LINE + Knowledge Center | 28 items |
| 4 | AI Style + Chat Brain | 25 items |
| 5 | Analytics + Customers | 22 items |
| 6 | Briefing + Content + Final | 20 items |
| **รวม** | | **~167 items** |

---

_Version 1.0 · มีนาคม 2026_
