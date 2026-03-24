# 🔌 SAMART — API Design

---

## API Architecture

SAMART ใช้ **tRPC** สำหรับ internal API (dashboard ↔ server) และ **REST** สำหรับ webhooks และ public endpoints

```
┌────────────────────────────────────┐
│          API Endpoints             │
├──────────────┬─────────────────────┤
│  tRPC        │  REST (Webhooks)    │
│  /api/trpc/* │  /api/webhook/*     │
│              │  /api/public/*      │
└──────────────┴─────────────────────┘
```

---

## tRPC Routers

### `auth` Router
```typescript
authRouter = {
  // เชื่อมต่อ LINE OA กับร้านค้า
  connectLineOA: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      channelSecret: z.string(),
      accessToken: z.string(),
    }))
    .mutation(async ({ input, ctx }) => LineOAConnector.connect(ctx.shopId, input))
}
```

### `shop` Router
```typescript
shopRouter = {
  // ดึงข้อมูลร้าน
  getProfile: protectedProcedure
    .query(async ({ ctx }) => getShopProfile(ctx.shopId)),

  // อัปเดตข้อมูลร้าน
  updateProfile: protectedProcedure
    .input(UpdateShopSchema)
    .mutation(async ({ input, ctx }) => updateShop(ctx.shopId, input)),

  // ตั้งค่า AI Style Profile (จาก knowledge-management)
  updateStyleProfile: protectedProcedure
    .input(z.object({
      botName: z.string(),
      formalityLevel: z.number().min(0).max(100),
      emojiUsage: z.enum(['none', 'some', 'lots']),
      replyLength: z.enum(['short', 'medium', 'long']),
      language: z.enum(['thai', 'mixed', 'english']),
      closingPhrase: z.string(),
      openingGreeting: z.string(),
      guardrails: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => updateStyleProfile(ctx.shopId, input)),

  // Preview AI response ตาม style ปัจจุบัน
  previewAIResponse: protectedProcedure
    .input(z.object({ testMessage: z.string() }))
    .mutation(async ({ input, ctx }) =>
      chatBrain.previewWithCurrentStyle(ctx.shopId, input.testMessage)
    ),
}
```

### `menu` Router
```typescript
menuRouter = {
  list: protectedProcedure
    .query(async ({ ctx }) => getMenuItems(ctx.shopId)),

  create: protectedProcedure
    .input(CreateMenuItemSchema)
    .mutation(async ({ input, ctx }) => createMenuItem(ctx.shopId, input)),

  update: protectedProcedure
    .input(UpdateMenuItemSchema)
    .mutation(async ({ input, ctx }) => updateMenuItem(ctx.shopId, input)),

  delete: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ input, ctx }) => deleteMenuItem(ctx.shopId, input.itemId)),

  toggleStock: protectedProcedure
    .input(z.object({ itemId: z.string(), inStock: z.boolean() }))
    .mutation(async ({ input, ctx }) => toggleMenuStock(ctx.shopId, input)),
}
```

### `knowledge` Router (ใหม่ — จาก knowledge-management.md)
```typescript
knowledgeRouter = {
  // ดึง knowledge docs ทั้งหมดของร้าน
  list: protectedProcedure
    .input(z.object({ type: KnowledgeTypeSchema.optional() }))
    .query(async ({ input, ctx }) => getKnowledgeDocs(ctx.shopId, input.type)),

  // เพิ่ม knowledge แบบ structured
  add: protectedProcedure
    .input(z.object({
      type: KnowledgeTypeSchema,
      title: z.string(),
      content: z.string(),
      keywords: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => addKnowledge(ctx.shopId, input)),

  // เพิ่ม free-form text ("สอน AI")
  addFreeform: protectedProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input, ctx }) =>
      knowledgeBrain.processFreeform(ctx.shopId, input.text)
    ),

  // อัปโหลดไฟล์ → extract → preview
  processUpload: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileBase64: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) =>
      knowledgeBrain.processUpload(ctx.shopId, input)
    ),

  // confirm import หลัง preview
  confirmImport: protectedProcedure
    .input(z.object({
      documents: z.array(KnowledgeDocumentSchema),
    }))
    .mutation(async ({ input, ctx }) =>
      knowledgeBrain.batchSave(ctx.shopId, input.documents)
    ),

  // ลบ knowledge doc
  delete: protectedProcedure
    .input(z.object({ docId: z.string() }))
    .mutation(async ({ input, ctx }) => deleteKnowledge(ctx.shopId, input.docId)),

  // ดู knowledge health + gap analysis
  getHealthReport: protectedProcedure
    .query(async ({ ctx }) => knowledgeBrain.analyzeHealth(ctx.shopId)),

  // AI แนะนำว่าควรเพิ่มอะไร (จาก unanswered questions)
  getGapSuggestions: protectedProcedure
    .query(async ({ ctx }) => knowledgeBrain.analyzeKnowledgeGaps(ctx.shopId)),
}
```

### `chatLog` Router (ใหม่ — learning loop)
```typescript
chatLogRouter = {
  // ดูบทสนทนาทั้งหมด (paginated)
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      cursor: z.string().optional(),
      filter: z.enum(['all', 'unanswered', 'corrected', 'approved']).default('all'),
    }))
    .query(async ({ input, ctx }) => getChatLogs(ctx.shopId, input)),

  // Approve reply (บันทึกเป็น learned pattern)
  approve: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ input, ctx }) =>
      learningLoop.approveReply(ctx.shopId, input.conversationId)
    ),

  // แก้ไข reply + ส่งกลับลูกค้า + เรียนรู้
  correct: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      correctedReply: z.string(),
      saveAsPattern: z.boolean().default(true),
      newKnowledgeText: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) =>
      learningLoop.correctReply(ctx.shopId, input)
    ),

  // บันทึกเป็น featured example (⭐)
  saveAsFeatured: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ input, ctx }) =>
      learningLoop.saveFeaturedPattern(ctx.shopId, input.conversationId)
    ),
}
```

### `ai` Router
```typescript
aiRouter = {
  // Sales Brain
  getSalesForecast: protectedProcedure
    .input(z.object({ period: z.enum(['7d', '14d', '30d']) }))
    .query(async ({ input, ctx }) =>
      salesBrain.forecast(ctx.shopId, input.period)
    ),

  getStockAlerts: protectedProcedure
    .query(async ({ ctx }) => salesBrain.getStockAlerts(ctx.shopId)),

  // Content Brain
  generatePost: protectedProcedure
    .input(z.object({
      contentType: ContentTypeSchema,
      product: z.string().optional(),
      tone: ToneSchema,
      platform: PlatformSchema,
    }))
    .mutation(async ({ input, ctx }) =>
      contentBrain.generatePost(ctx.shopId, input)
    ),

  generateImage: protectedProcedure
    .input(z.object({
      prompt: z.string(),
      style: z.string(),
    }))
    .mutation(async ({ input, ctx }) =>
      contentBrain.generateImage(ctx.shopId, input)
    ),

  schedulePost: protectedProcedure
    .input(SchedulePostSchema)
    .mutation(async ({ input, ctx }) =>
      contentBrain.schedulePost(ctx.shopId, input)
    ),

  // Insight Brain
  getDailyBriefing: protectedProcedure
    .query(async ({ ctx }) => insightBrain.getLatestBriefing(ctx.shopId)),

  getActionItems: protectedProcedure
    .query(async ({ ctx }) => insightBrain.getActionItems(ctx.shopId)),
}
```

### `analytics` Router
```typescript
analyticsRouter = {
  // ยอดขายภาพรวม
  getSalesOverview: protectedProcedure
    .input(z.object({ period: z.enum(['today', '7d', '30d', '90d']) }))
    .query(async ({ input, ctx }) =>
      getAnalytics(ctx.shopId, input.period)
    ),

  // ลูกค้า
  getCustomerInsights: protectedProcedure
    .query(async ({ ctx }) => getCustomerAnalytics(ctx.shopId)),

  // Real-time revenue today
  getTodayRevenue: protectedProcedure
    .query(async ({ ctx }) => getTodayRevenue(ctx.shopId)),
}
```

### `customers` Router
```typescript
customersRouter = {
  list: protectedProcedure
    .input(z.object({
      segment: CustomerSegmentSchema.optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input, ctx }) =>
      getCustomers(ctx.shopId, input)
    ),

  getProfile: protectedProcedure
    .input(z.object({ lineUserId: z.string() }))
    .query(async ({ input, ctx }) =>
      getCustomerProfile(ctx.shopId, input.lineUserId)
    ),

  sendFollowUp: protectedProcedure
    .input(z.object({
      lineUserId: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input, ctx }) =>
      chatBrain.sendFollowUp(ctx.shopId, input)
    ),

  sendBroadcast: protectedProcedure
    .input(z.object({
      segment: CustomerSegmentSchema,
      message: z.string(),
    }))
    .mutation(async ({ input, ctx }) =>
      chatBrain.sendBroadcast(ctx.shopId, input)
    ),
}
```

---

## REST Endpoints

### LINE Webhook
```
POST /api/webhook/line

Headers:
  x-line-signature: <HMAC-SHA256>

Body:
  {
    "destination": "...",
    "events": [
      {
        "type": "message",
        "replyToken": "...",
        "source": { "type": "user", "userId": "U..." },
        "timestamp": 1234567890,
        "message": { "type": "text", "text": "สวัสดีครับ" }
      }
    ]
  }

Response: 200 OK
```

### Stripe/Omise Webhook
```
POST /api/webhook/payment

Events handled:
  - charge.complete       → activate subscription
  - charge.failed         → notify owner
  - subscription.cancel   → downgrade plan
```

### Public Menu (no auth — สำหรับหน้าเมนูสาธารณะ)
```
GET /api/public/menu/:shopId

Response:
  {
    "shop": { "name": "...", "hours": "..." },
    "menu": [
      {
        "category": "เครื่องดื่ม",
        "items": [
          { "id": "...", "name": "กาแฟ Signature", "price": 85, "inStock": true }
        ]
      }
    ]
  }
```

---

## Error Handling

```typescript
// Standard error format
interface APIError {
  code: string
  message: string        // ภาษาไทยสำหรับ user-facing
  messageEn?: string
  details?: unknown
}

// Error codes
const ERROR_CODES = {
  UNAUTHORIZED:       'AUTH_001',
  SHOP_NOT_FOUND:     'SHOP_001',
  AI_QUOTA_EXCEEDED:  'AI_001',
  LINE_API_ERROR:     'LINE_001',
  PAYMENT_FAILED:     'PAY_001',
  VALIDATION_ERROR:   'VAL_001',
} as const
```

---

## Rate Limiting

```typescript
// Per-shop limits (based on subscription tier)
const RATE_LIMITS = {
  starter: {
    aiGenerations: 50,        // per day
    lineMessages: 1000,       // per month
    apiCallsPerMin: 30,
  },
  pro: {
    aiGenerations: 500,
    lineMessages: 'unlimited',
    apiCallsPerMin: 60,
  },
  business: {
    aiGenerations: 'unlimited',
    lineMessages: 'unlimited',
    apiCallsPerMin: 120,
  },
}
```

---

## Middleware Stack

```typescript
// Every protected route goes through:
1. Firebase Auth token validation
2. Shop membership check (user owns this shopId)
3. Subscription status check (not expired)
4. Rate limit check
5. Request logging
```
