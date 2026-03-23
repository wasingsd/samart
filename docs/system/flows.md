# 🔄 Panya — System Flow Diagrams

> เอกสารนี้แสดง flow หลักของระบบ Panya ทั้งในมุม Business Process และ Technical Execution

---

## 1. Shop Onboarding Flow

> flow ตั้งแต่เจ้าของร้านสมัครครั้งแรก จนถึงได้ใช้งาน Chatbot จริง

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1 — REGISTER (5 นาที)                                             │
│                                                                         │
│  Owner กรอก email + password                                            │
│       │                                                                 │
│       ▼                                                                 │
│  Firebase Auth createUser()                                             │
│       │                                                                 │
│       ▼                                                                 │
│  สร้าง Firestore: users/{uid}  +  shops/{shopId}                       │
│       │                                                                 │
│       ▼                                                                 │
│  ส่ง Welcome Email (Resend)                                             │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2 — SHOP SETUP WIZARD (3 หน้า)                                   │
│                                                                         │
│  หน้า 1: ข้อมูลร้าน                                                    │
│  ┌──────────────────────────────────┐                                   │
│  │ ชื่อร้าน | ประเภท | โทรศัพท์     │                                   │
│  │ ที่อยู่  | เวลาเปิด-ปิด          │                                   │
│  │ โลโก้ (อัปโหลด)                  │                                   │
│  └──────────────────────────────────┘                                   │
│                                                                         │
│  หน้า 2: AI Persona                                                     │
│  ┌──────────────────────────────────┐                                   │
│  │ ชื่อ bot | บุคลิก (friendly/pro) │                                   │
│  │ Formality slider | Emoji level   │                                   │
│  │ คำทักทาย | คำปิดท้าย             │                                   │
│  └──────────────────────────────────┘                                   │
│                                                                         │
│  หน้า 3: เพิ่มเมนูเริ่มต้น (optional)                                  │
│  ┌──────────────────────────────────┐                                   │
│  │ + เพิ่มเมนู (ชื่อ ราคา หมวดหมู่) │                                   │
│  │ หรือ Skip → เพิ่มทีหลัง         │                                   │
│  └──────────────────────────────────┘                                   │
│                                                                         │
│  ► onboarding.complete() →                                              │
│    - บันทึก styleProfile ลง shops/{shopId}                             │
│    - auto-build knowledge จากเมนู + business hours                     │
│    - generate embeddings (text-embedding-004)                          │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3 — LINE OA CONNECT                                               │
│                                                                         │
│  Owner กด "เชื่อมต่อ LINE OA"                                          │
│       │                                                                 │
│       ▼                                                                 │
│  กรอก Channel ID + Channel Secret + Access Token                        │
│  (จาก LINE Developers Console)                                          │
│       │                                                                 │
│       ▼                                                                 │
│  Panya encrypt + บันทึกลง Firestore                                    │
│       │                                                                 │
│       ▼                                                                 │
│  ตั้ง Webhook URL: https://panya.app/api/webhook/line                  │
│       │                                                                 │
│       ▼                                                                 │
│  ส่ง test message ผ่าน LINE API → ยืนยัน webhook ทำงาน               │
│       │                                                                 │
│       ▼                                                                 │
│  ✅ Setup Complete! → redirect ไป Dashboard                            │
└─────────────────────────────────────────────────────────────────────────┘
```

**Error Paths:**
- LINE credentials ผิด → แสดง error + link ไป LINE Developers Console
- Webhook test fail → แสดง troubleshoot guide
- Email ซ้ำ → แนะนำ Login แทน

---

## 2. LINE Chat Flow (Chat Brain)

> flow ทุกครั้งที่ลูกค้าส่งข้อความมาหาร้าน

```
ลูกค้าพิมพ์ข้อความใน LINE OA
        │
        ▼
POST /api/webhook/line
        │
        ▼
┌───────────────────────────┐
│  Signature Validation     │
│  HMAC-SHA256 ตรวจสอบ      │
│  x-line-signature header  │
└──────────────┬────────────┘
               │ valid
               ▼
┌───────────────────────────┐
│  Identify Shop            │
│  destination → shopId     │
│  ดึง shopData + styleProfile│
└──────────────┬────────────┘
               │
               ▼
┌───────────────────────────┐
│  Upsert Customer          │
│  lineUserId → customers/  │
│  อัปเดต lastVisit, count  │
└──────────────┬────────────┘
               │
               ▼
┌───────────────────────────────────────────────────────┐
│  Intent Classification (Gemini Flash)                 │
│                                                       │
│  ข้อความลูกค้า + ประวัติบทสนทนา 3 รอบ               │
│                                                       │
│  → ORDER      "สั่ง x 2 ครับ"                        │
│  → MENU_QUERY "มีอะไรบ้าง / ราคาเท่าไหร่"            │
│  → HOURS      "เปิดกี่โมง / วันนี้เปิดไหม"           │
│  → GENERAL    "ขอบคุณ / สวัสดี / อื่นๆ"              │
│  → COMPLAINT  "ออเดอร์ผิด / ช้ามาก"                  │
└─────────────────────────┬─────────────────────────────┘
               │
       ┌───────┼───────────────────────┐
       │       │                       │
       ▼       ▼                       ▼
  ORDER    MENU_QUERY/            GENERAL/HOURS/
  FLOW     HOURS/etc              COMPLAINT
       │       │                       │
       ▼       ▼                       ▼
┌──────────┐ ┌─────────────────────┐ ┌──────────────────────┐
│ Order    │ │  RAG Retrieval      │ │  Context-aware reply  │
│ Handler  │ │                     │ │                       │
│          │ │  embed(ข้อความ)     │ │  Shop context:        │
│ parse    │ │  → vector search    │ │  businessHours        │
│ items +  │ │  → top-3 docs       │ │  + styleProfile       │
│ quantity │ │  (knowledgeBase/)   │ │  + customer name      │
└────┬─────┘ └──────────┬──────────┘ └──────────┬───────────┘
     │                  │                        │
     ▼                  ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Build Final Prompt (assemblePrompt)                        │
│                                                             │
│  [System] You are {botName}. Personality: {styleProfile}   │
│  [Knowledge] {top-3 RAG docs}                               │
│  [Examples] {top-3 learnedPatterns (few-shot)}              │
│  [Context] Shop: {name}, Hours: {hours}, Today: {date}      │
│  [Customer] Name: {displayName}, Previous orders: {...}     │
│  [Guardrails] Never say: {guardrails[]}                     │
│  [Message] {customerMessage}                                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                 Gemini Flash generateContent()
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Response Validation                                        │
│  - ความยาวตาม replyLength                                   │
│  - ไม่มี guardrail words                                    │
│  - ไม่ hallucinate (ถ้าไม่มีข้อมูล → \"ขอสอบถามเพิ่มเติม\") │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
            LINE Reply API (replyToken)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Log Conversation                                           │
│  → shops/{shopId}/chatLogs/{convId}                        │
│  {customerMessage, aiReply, intent, ragDocs, timestamp}    │
└─────────────────────────────────────────────────────────────┘
```

**Response Time Target:** < 3 วินาที
**Fallback:** ถ้า Gemini timeout → ตอบด้วย template "ขออภัยค่ะ กรุณารอสักครู่"

---

## 3. Content Generation Flow (Content Brain)

> flow ตั้งแต่เจ้าของร้านขอให้ AI สร้างโพสต์ จนถึงโพสต์ขึ้น Facebook/LINE

```
เจ้าของร้านเปิด Content Brain UI
        │
        ▼
┌───────────────────────────────────────┐
│  กรอก Input Form                      │
│  ┌──────────────────────────────────┐ │
│  │ ประเภทโพสต์: [Promotion ▼]       │ │
│  │ สินค้า: [กาแฟ Signature ▼]       │ │
│  │ น้ำเสียง: [สนุกสนาน ▼]           │ │
│  │ Platform: [☑ Facebook ☑ LINE]    │ │
│  └──────────────────────────────────┘ │
│  [🪄 สร้าง Content]                   │
└──────────────────────┬────────────────┘
                       │
                       ▼
        trpc.ai.generatePost.mutate()
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Content Brain: Text Generation                             │
│                                                             │
│  ดึง shop context:                                          │
│  - brandStyle, brandColors, botPersonality                  │
│  - menu item details (ชื่อ ราคา tags)                      │
│  - styleProfile                                             │
│                                                             │
│  Prompt → Gemini Pro:                                       │
│  "สร้างโพสต์ Facebook {contentType} สำหรับ {product}       │
│   ในสไตล์ {tone} ของร้าน {shopName}..."                    │
│                                                             │
│  Output: caption + hashtags[]                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ (parallel)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Content Brain: Image Generation                            │
│                                                             │
│  Auto-build image prompt จาก:                              │
│  "Professional food photo, {product} at {shopName},         │
│   style: {brandStyle}, colors: {brandColors}..."            │
│                                                             │
│  → Gemini Imagen 3 generateImage()                          │
│  → Upload to Firebase Storage                               │
│  → return imageUrl                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────┐
│  Preview UI                          │
│  ┌────────────────────────────────┐  │
│  │  [รูปภาพ]                      │  │
│  │                                │  │
│  │  ✨ โพสต์ใหม่! กาแฟ Signature │  │
│  │  ราคาพิเศษวันนี้ 79฿ เท่านั้น! │  │
│  │  #กาแฟเชียงใหม่ #ดอยคอฟฟี่    │  │
│  └────────────────────────────────┘  │
│  [✏️ แก้ไข] [🔄 สร้างใหม่]          │
│  [📅 ตั้งเวลา] [🚀 โพสต์เลย]        │
└──────────────────────┬───────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
   โพสต์เลย (now)          ตั้งเวลา (schedule)
            │                     │
            ▼                     ▼
  Facebook Graph API      บันทึกลง scheduledPosts/
  LINE Broadcast API      status: 'scheduled'
            │                     │
            ▼                     ▼
  อัปเดต status: 'posted'  Firebase Scheduled Fn
  บันทึก postedAt          ทำงาน ณ scheduledAt
                                  │
                                  ▼
                         post to platform
                         อัปเดต status: 'posted'
```

---

## 4. Knowledge Building Flow

> flow เมื่อเจ้าของร้านเพิ่มข้อมูลเข้า Knowledge Center

```
                    Knowledge Center
                         │
        ┌────────────────┼─────────────────────┐
        │                │                     │
        ▼                ▼                     ▼
  Structured Form    File Upload         Free-form Text
  (เมนู/FAQ/โปรฯ)  (PDF/Word/CSV/IMG)   ("สอน AI")
        │                │                     │
        │                ▼                     │
        │    ┌───────────────────────────┐     │
        │    │  File Processing Pipeline │     │
        │    │                           │     │
        │    │  PDF → pdf-parse          │     │
        │    │  Word → mammoth           │     │
        │    │  CSV → papaparse          │     │
        │    │  Image → Gemini Vision    │     │
        │    │    (extract text+data)    │     │
        │    │                           │     │
        │    │  → structured text[]      │     │
        │    └───────────┬───────────────┘     │
        │                │                     │
        │                ▼                     │
        │    ┌───────────────────────────┐     │
        │    │  Preview & Confirm UI     │     │
        │    │  "พบ 12 รายการ..."        │     │
        │    │  [✅ confirm] [✏️ แก้ไข]  │     │
        │    └───────────┬───────────────┘     │
        │                │                     │
        └────────────────┼─────────────────────┘
                         │
                         ▼
              Text → Chunks (max 500 tokens)
                         │
                         ▼
           text-embedding-004.embed(chunk)
                         │
                         ▼
       ┌──────────────────────────────────────┐
       │  Firestore: knowledgeBase/{docId}    │
       │  {                                   │
       │    type, title, content,             │
       │    embedding: float[768],            │
       │    keywords[], source, updatedAt     │
       │  }                                   │
       └──────────────────────────────────────┘
                         │
                         ▼
           อัปเดต Knowledge Health Score
           (% coverage จาก categories ที่ต้องมี)
                         │
                         ▼
       ┌──────────────────────────────────────┐
       │  Knowledge Health Dashboard          │
       │  ████████░░ 80%                      │
       │  ✅ เมนู (12/12) ✅ FAQ (8/10)       │
       │  ⚠️ Promotions (0/3) — ยังไม่มี!    │
       │  💡 AI แนะนำ: "เพิ่มโปรโมชันช่วง   │
       │     เที่ยง เพราะลูกค้าถามบ่อย"       │
       └──────────────────────────────────────┘
```

---

## 5. Learning Loop Flow

> flow เมื่อเจ้าของร้านตรวจสอบและแก้ไขบทสนทนา

```
Chat Log Dashboard
        │
        ▼
┌───────────────────────────────────────────────┐
│  ลูกค้า: "มีกาแฟ Decaf ไหมคะ"                │
│  AI: "ขณะนี้ยังไม่มีเมนู Decaf นะคะ 😊"      │
│                                               │
│  [✅ Approve]  [✏️ แก้ไข]  [⭐ Featured]      │
└──────────┬────────────┬─────────────┬─────────┘
           │            │             │
           ▼            ▼             ▼
      APPROVE        CORRECT       FEATURED
           │            │             │
           ▼            ▼             ▼
  บันทึกเป็น      Owner พิมพ์    เหมือน Approve
  learnedPattern  reply ใหม่:    + score = 5
  type:           "มีนะคะ!       + ถูก inject
  'approved_reply' Decaf         เป็น top
                  เพิ่งมาเมื่อ   few-shot
                  วาน..."        example
                       │
                       ▼
              LINE Push to Customer
              (ส่ง corrected reply จริง)
                       │
                       ▼
              บันทึก learnedPattern
              type: 'corrected_reply'
              customerMessage: "มีกาแฟ Decaf..."
              aiDraftReply: "ขณะนี้ยังไม่มี..."
              finalReply: "มีนะคะ! Decaf..."
              embedding: float[768]
                       │
                       ▼
              (optional) ถ้า Owner ติ๊ก:
              "เพิ่มเป็น Knowledge ด้วย"
                       │
                       ▼
              เพิ่ม KnowledgeDocument ใหม่:
              type: 'menu'
              content: "เมนู Decaf Coffee..."
```

**Impact ต่อ AI ครั้งต่อไป:**
```
ลูกค้าถามอีกครั้งในอนาคต:
  "มี Decaf ไหม?" (similar embedding)
           │
           ▼
  RAG ดึง learnedPattern ที่บันทึกไว้
           │
           ▼
  AI ใช้ finalReply เป็น few-shot example
           │
           ▼
  AI ตอบ: "มีนะคะ! เมนู Decaf..." (ถูกต้อง)
```

---

## 6. Subscription & Billing Flow

> flow ตั้งแต่ทดลองใช้จนถึงจ่ายเงินจริง

```
สมัครใหม่
    │
    ▼
Trial Period (60 วัน)
status: 'trial'
trialEndsAt: now + 60 days
    │
    ├── วันที่ 50 → ส่ง Email "อีก 10 วันจะหมด trial"
    │
    ├── วันที่ 58 → ส่ง Email "อีก 2 วัน! เลือกแพลนได้เลย"
    │
    └── วันที่ 60 → Firebase Function trigger
                       │
                       ▼
               status → 'suspended'
               Features disabled
               แสดง upgrade wall
                       │
              Owner เลือก Plan
              (Starter/Pro/Business)
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │  Omise Payment Flow                      │
    │                                          │
    │  PromptPay:                              │
    │  1. สร้าง Omise Charge (PromptPay)       │
    │  2. แสดง QR Code                         │
    │  3. ลูกค้าสแกน → โอนเงิน               │
    │  4. Omise → POST /api/webhook/payment    │
    │  5. event: charge.complete               │
    │                                          │
    │  Credit Card:                            │
    │  1. Omise.js tokenize card               │
    │  2. ส่ง token ไป server                 │
    │  3. สร้าง Charge ฝั่ง server            │
    │  4. Omise → POST /api/webhook/payment    │
    │  5. event: charge.complete               │
    └──────────────────────┬───────────────────┘
                           │
                           ▼
              Payment Webhook Handler
                           │
                           ▼
    ┌──────────────────────────────────────────┐
    │  activate subscription                   │
    │  shops/{shopId}:                         │
    │    status: 'active'                      │
    │    plan: 'starter' | 'pro' | 'business'  │
    │  subscriptions/{shopId}:                 │
    │    status: 'active'                      │
    │    currentPeriodEnd: +30 days            │
    └──────────────────────┬───────────────────┘
                           │
                           ▼
              ส่ง Invoice Email (Resend)
                           │
                           ▼
              Recurring: ทุก 30 วัน
              Firebase Function → auto-renew
              หรือ Owner ยกเลิก → downgrade flow
```

---

## 7. Daily Briefing Flow (Insight Brain)

> flow อัตโนมัติที่ทำงานทุกเช้า 07:00 น.

```
Firebase Cloud Function (cron: "0 7 * * *")
        │
        ▼
สำหรับทุก shop ที่ status = 'active'
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│  ดึงข้อมูลเมื่อวาน                                        │
│                                                           │
│  analytics/daily/{shopId}/{yesterday}:                   │
│  - totalRevenue, orderCount, avgOrderValue               │
│  - topProducts[], newCustomers, returningCustomers        │
│  - hourlyRevenue{}, revenueByChannel{}                   │
│                                                           │
│  เปรียบเทียบกับ:                                          │
│  - 7 วันย้อนหลัง (avg)                                   │
│  - สัปดาห์เดียวกันเดือนที่แล้ว                           │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────┐
│  Anomaly Detection                                        │
│                                                           │
│  ตรวจหา:                                                  │
│  - ยอดขายต่ำกว่า avg 30%+ → ⚠️ Alert                    │
│  - สินค้าขายดีกว่าปกติ 50%+ → 🔥 Hot item               │
│  - สต็อกใกล้หมด → 📦 Stock alert                        │
│  - ลูกค้าใหม่สูงผิดปกติ → 🆕 New customer spike          │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────┐
│  Gemini Pro: Generate Briefing                            │
│                                                           │
│  Input:                                                   │
│  - sales data (yesterday vs avg)                         │
│  - anomalies detected                                    │
│  - shop context (category, season, day-of-week)          │
│  - top 3 unanswered questions จาก Chat Brain             │
│                                                           │
│  Output:                                                  │
│  - summary paragraph (ภาษาไทย กระชับ)                   │
│  - action items[] (2-3 ข้อ ทำได้วันนี้เลย)               │
│  - forecast: คาดว่าวันนี้จะ...                           │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────┴────────────────────────────┐
    │                                                   │
    ▼                                                   ▼
LINE Push Message                              บันทึกลง Firestore
ไปหา Owner's LINE                              analytics/{shopId}/
                                               daily/{date}.aiBriefing
    │
    ▼
┌──────────────────────────────────────┐
│  📊 สรุปยอดเมื่อวาน — ดอยคอฟฟี่     │
│                                      │
│  💰 ยอดขาย: 3,420 ฿ (+12% vs avg)   │
│  🛒 ออเดอร์: 28 รายการ               │
│  🔥 ขายดีสุด: Signature Latte (8 แก้ว)│
│                                      │
│  📌 แนะนำวันนี้:                     │
│  1. เติมสต็อก Oat Milk (เหลือ 2L)   │
│  2. โพสต์โปรฯ ช่วงบ่าย 13:00-15:00  │
│     (ช่วง peak ของคุณ)               │
│                                      │
│  [ดูรายละเอียด →]                    │
└──────────────────────────────────────┘
```

---

## 8. AI Cost Flow (ต้นทุน AI ต่อ request)

> แสดงว่าแต่ละ action ใช้ model ไหนและเสียค่าใช้จ่ายเท่าไหร่

```
Request Type         Model              Estimated Cost
─────────────────────────────────────────────────────
Chat reply           Gemini Flash       ~0.003 ฿/reply
Intent detection     Gemini Flash       ~0.001 ฿/msg
Content text         Gemini Pro         ~0.05 ฿/post
Image generation     Gemini Imagen 3    ~0.50 ฿/image
Daily briefing       Gemini Pro         ~0.10 ฿/day
Knowledge embed      text-embedding-004 ~0.001 ฿/doc
Sales forecast       Gemini Pro         ~0.08 ฿/request

รวมต่อร้าน/เดือน (avg usage):
─────────────────────────────
Chat: 300 replies × 0.003       =  0.90 ฿
Content: 10 posts × 0.05        =  0.50 ฿
Images: 5 × 0.50                =  2.50 ฿
Briefing: 30 × 0.10             =  3.00 ฿
Forecast: 4 × 0.08              =  0.32 ฿
Embedding: 50 docs × 0.001      =  0.05 ฿
─────────────────────────────
Total AI cost/shop/month:       ~  7.27 ฿
                                = ~25-40 ฿ (incl. buffer)
                                = 98%+ gross margin
```

---

## Summary: Key Integration Points

| Flow | Services | Trigger |
|------|----------|---------|
| Onboarding | Firebase Auth, Firestore, Resend | User signup |
| Chat Brain | LINE API, Gemini Flash, Firestore | LINE message |
| Content Brain | Gemini Pro, Imagen 3, Facebook API | Owner request |
| Knowledge Build | Gemini Vision, text-embedding-004 | Owner upload |
| Learning Loop | Firestore, LINE Push | Owner correction |
| Billing | Omise, Resend, Firestore | Payment event |
| Daily Briefing | Gemini Pro, LINE Push | Cron 07:00 |
