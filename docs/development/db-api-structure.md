# 🗄️ SAMART — โครงสร้าง DB & API (เรียงตาม Dependency)

> เอกสารนี้เรียงลำดับจาก "ฐานราก" ไปถึง "ส่วนต่อยอด"
> Layer 1 ต้องเสร็จก่อน Layer 2 ถึงจะทำได้

---

## 🔑 Dependency Map

```
Layer 1: users → shops                    ← ฐานราก (ทุกอย่างพึ่ง shops)
Layer 2: menuItems, knowledgeBase         ← ข้อมูลร้าน (พึ่ง shops)
Layer 3: orders, customers, inventory     ← ธุรกรรม (พึ่ง shops + menuItems)
Layer 4: learnedPatterns, scheduledPosts  ← AI features (พึ่ง Layer 2-3)
Layer 5: aiJobs, analytics               ← Background/Aggregation
Layer 6: subscriptions                    ← Billing (Phase 2)
```

---

## Layer 1: ฐานราก — Users & Shops

### `users/{uid}` — เจ้าของร้าน

```typescript
interface UserDoc {
  uid: string                    // Firebase Auth UID
  email: string
  displayName: string
  photoURL?: string
  shopId: string | null          // null = ยังไม่สร้างร้าน → redirect onboarding
  role: 'owner' | 'staff'
  lineUserId?: string            // เชื่อม LINE Login
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**tRPC Router: `auth`**

| Procedure | Type | Input | Output | หมายเหตุ |
|-----------|------|-------|--------|---------|
| `auth.createUserDoc` | mutation | `{ uid, email, displayName }` | `UserDoc` | เรียกหลัง Firebase register |
| `auth.getMe` | query | — | `UserDoc` | ดึงข้อมูล user ปัจจุบัน |
| `auth.connectLine` | mutation | `{ lineUserId }` | `UserDoc` | เชื่อม LINE Login |

---

### `shops/{shopId}` — ร้านค้า (หัวใจระบบ)

```typescript
interface ShopDoc {
  id: string
  name: string
  category: 'restaurant' | 'cafe' | 'bakery' | 'service' | 'retail' | 'other'
  phone: string
  address: string
  logoURL?: string
  businessHours: BusinessHours
  ownerId: string               // → users/{uid}

  // LINE OA Connection
  lineChannelId?: string
  lineChannelSecret?: string
  lineAccessToken?: string
  lineConnected: boolean

  // AI Style Profile (inline — ไม่แยก subcollection)
  styleProfile: StyleProfile

  // Subscription (เก็บสถานะย่อ, รายละเอียดอยู่ subscriptions/)
  plan: 'trial' | 'starter' | 'pro' | 'business'
  trialEndsAt?: Timestamp

  createdAt: Timestamp
  updatedAt: Timestamp
}

interface BusinessHours {
  monday:    { open: string; close: string; isOpen: boolean }
  tuesday:   { open: string; close: string; isOpen: boolean }
  wednesday: { open: string; close: string; isOpen: boolean }
  thursday:  { open: string; close: string; isOpen: boolean }
  friday:    { open: string; close: string; isOpen: boolean }
  saturday:  { open: string; close: string; isOpen: boolean }
  sunday:    { open: string; close: string; isOpen: boolean }
}

interface StyleProfile {
  botName: string                    // "น้องมะลิ"
  formalityLevel: number             // 0-100
  emojiUsage: 'none' | 'some' | 'lots'
  replyLength: 'short' | 'medium' | 'long'
  language: 'thai' | 'mixed' | 'english'
  closingPhrase: string              // "ขอบคุณมากนะคะ 😊"
  openingGreeting: string            // "สวัสดีค่ะ ยินดีต้อนรับ 🌸"
  guardrails: string[]               // ["ห้ามบอกราคาต้นทุน"]
}
```

**tRPC Router: `shop`**

| Procedure | Type | Input | Output | หมายเหตุ |
|-----------|------|-------|--------|---------|
| `shop.create` | mutation | `ShopCreateInput` | `ShopDoc` | Onboarding step สุดท้าย |
| `shop.getByOwner` | query | — | `ShopDoc \| null` | ดึงร้านของ user (auth) |
| `shop.update` | mutation | `Partial<ShopDoc>` | `ShopDoc` | แก้ไขข้อมูลร้าน |
| `shop.updateStyle` | mutation | `StyleProfile` | `ShopDoc` | บันทึก AI style |
| `shop.connectLine` | mutation | `{ channelId, secret, token }` | `ShopDoc` | เชื่อม LINE OA |
| `shop.testWebhook` | mutation | — | `{ success }` | ทดสอบ LINE webhook |
| `shop.previewAI` | mutation | `{ question: string }` | `{ reply }` | Preview AI ตอบตาม style |

---

## Layer 2: ข้อมูลร้าน — Menu & Knowledge

### `shops/{shopId}/menuItems/{itemId}` — เมนู/สินค้า

```typescript
interface MenuItemDoc {
  id: string
  name: string
  price: number
  category: string               // "เครื่องดื่ม", "อาหาร", "ของหวาน"
  description: string            // AI ใช้ตอบลูกค้า
  imageURL?: string
  allergens: string[]            // ["นม", "กลูเตน", "ถั่ว"]
  calories?: number
  tags: string[]                 // ["bestseller", "seasonal", "new"]
  inStock: boolean
  sortOrder: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**tRPC Router: `menu`**

| Procedure | Type | Input | Output | หมายเหตุ |
|-----------|------|-------|--------|---------|
| `menu.list` | query | `{ category? }` | `MenuItemDoc[]` | ดึงเมนูทั้งหมด (filter by category) |
| `menu.getById` | query | `{ id }` | `MenuItemDoc` | ดึงเมนูตัวเดียว |
| `menu.create` | mutation | `MenuCreateInput` | `MenuItemDoc` | เพิ่มเมนูใหม่ |
| `menu.update` | mutation | `{ id, data }` | `MenuItemDoc` | แก้ไขเมนู |
| `menu.delete` | mutation | `{ id }` | `void` | ลบเมนู |
| `menu.toggleStock` | mutation | `{ id }` | `MenuItemDoc` | สลับ inStock |
| `menu.importCSV` | mutation | `{ csvData }` | `{ imported: number }` | Import จาก CSV |
| `menu.listCategories` | query | — | `string[]` | ดึง category ทั้งหมด |

---

### `shops/{shopId}/knowledgeBase/{docId}` — ความรู้ AI (RAG)

```typescript
interface KnowledgeDoc {
  id: string
  type: 'menu' | 'faq' | 'policy' | 'promotion' | 'about' | 'freeform'
  title: string
  content: string                // ข้อความที่ AI ใช้ตอบ
  embedding: number[]            // vector จาก text-embedding-004 (768 dims)
  keywords: string[]             // keyword fallback search
  language: 'th' | 'en' | 'both'
  source: 'manual' | 'import' | 'auto' | 'onboarding'
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**tRPC Router: `knowledge`**

| Procedure | Type | Input | Output | หมายเหตุ |
|-----------|------|-------|--------|---------|
| `knowledge.list` | query | `{ type? }` | `KnowledgeDoc[]` | ดึงทั้งหมด (filter) |
| `knowledge.create` | mutation | `KnowledgeCreateInput` | `KnowledgeDoc` | เพิ่ม structured |
| `knowledge.createFreeform` | mutation | `{ text }` | `KnowledgeDoc` | "สอน AI" free-form |
| `knowledge.update` | mutation | `{ id, data }` | `KnowledgeDoc` | แก้ไข |
| `knowledge.delete` | mutation | `{ id }` | `void` | ลบ |
| `knowledge.uploadFile` | mutation | `{ fileData, mimeType }` | `{ preview, docs[] }` | อัปโหลด → preview |
| `knowledge.confirmImport` | mutation | `{ docs[] }` | `{ imported }` | ยืนยัน import |
| `knowledge.getHealth` | query | — | `KnowledgeHealth` | % ครบถ้วน |
| `knowledge.getGaps` | query | — | `GapSuggestion[]` | AI แนะนำสิ่งที่ควรเพิ่ม |
| `knowledge.buildFromMenu` | mutation | — | `{ built }` | Auto-build จากเมนู |

---

## Layer 3: ธุรกรรม — Orders, Customers, Inventory

### `shops/{shopId}/customers/{lineUserId}` — ลูกค้า

```typescript
interface CustomerDoc {
  lineUserId: string             // Primary key
  displayName: string
  pictureURL?: string
  segment: 'new' | 'regular' | 'vip' | 'dormant'
  totalSpent: number
  orderCount: number
  lastVisitAt: Timestamp | null
  preferences: string[]          // ["ไม่หวาน", "oat milk"]
  notes: string                  // หมายเหตุจากเจ้าของร้าน
  firstContactAt: Timestamp
  updatedAt: Timestamp
}
```

**tRPC Router: `customers`**

| Procedure | Type | Input | Output | หมายเหตุ |
|-----------|------|-------|--------|---------|
| `customers.list` | query | `{ segment? }` | `CustomerDoc[]` | ดึงลูกค้า (filter) |
| `customers.getProfile` | query | `{ lineUserId }` | `CustomerDoc` | ดูโปรไฟล์ |
| `customers.update` | mutation | `{ lineUserId, data }` | `CustomerDoc` | แก้ไข notes/preferences |
| `customers.sendMessage` | mutation | `{ lineUserId, message }` | `void` | ส่ง LINE follow-up |
| `customers.broadcast` | mutation | `{ segment, message }` | `{ sent }` | Broadcast by segment |
| `customers.getSegmentCounts` | query | — | `SegmentCounts` | จำนวนแต่ละ segment |

---

### `shops/{shopId}/orders/{orderId}` — ออเดอร์

```typescript
interface OrderDoc {
  id: string
  customerLineUserId: string     // → customers/
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  source: 'line_chat' | 'manual' | 'public_menu'
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  options?: string               // "ไม่หวาน, oat milk"
}
```

---

### `shops/{shopId}/inventory/{itemId}` — สต็อก

```typescript
interface InventoryDoc {
  menuItemId: string             // → menuItems/
  name: string
  currentStock: number
  unit: string                   // "แก้ว", "kg", "ลิตร"
  minStock: number               // threshold → alert
  lastRestockAt: Timestamp | null
  updatedAt: Timestamp
}
```

---

## Layer 4: AI Features — Learned Patterns & Scheduled Posts

### `shops/{shopId}/learnedPatterns/{patternId}` — AI เรียนรู้

```typescript
interface LearnedPatternDoc {
  id: string
  type: 'approved_reply' | 'corrected_reply' | 'featured'
  customerMessage: string
  aiDraftReply: string           // AI ตอบครั้งแรก
  finalReply: string             // ที่ approve/แก้ไข
  context: string                // บริบทเพิ่มเติม
  embedding: number[]            // สำหรับ semantic search
  usageCount: number             // ถูกดึงไปใช้กี่ครั้ง
  score: number                  // effectiveness (1-5)
  createdAt: Timestamp
}
```

**tRPC Router: `chatLog`**

| Procedure | Type | Input | Output | หมายเหตุ |
|-----------|------|-------|--------|---------|
| `chatLog.list` | query | `{ limit?, filter? }` | `ConversationDoc[]` | ดู chat logs |
| `chatLog.approve` | mutation | `{ conversationId }` | `LearnedPatternDoc` | ✅ approve → save pattern |
| `chatLog.correct` | mutation | `CorrectionInput` | `{ pattern, sent }` | ✏️ แก้ไข → send + save |
| `chatLog.feature` | mutation | `{ conversationId }` | `LearnedPatternDoc` | ⭐ บันทึกเป็น featured |
| `chatLog.getStats` | query | — | `ChatStats` | สถิติ: total, approved, corrected |

---

### `shops/{shopId}/scheduledPosts/{postId}` — โพสต์ที่ตั้งเวลา

```typescript
interface ScheduledPostDoc {
  id: string
  platform: 'facebook' | 'line' | 'instagram'
  textContent: string
  imageURL?: string
  scheduledAt: Timestamp
  status: 'draft' | 'scheduled' | 'posted' | 'failed'
  contentType: 'promotion' | 'menu_highlight' | 'greeting' | 'event' | 'custom'
  menuItemId?: string            // ถ้าเกี่ยวกับสินค้า
  postedAt?: Timestamp
  createdAt: Timestamp
}
```

**tRPC Router: `ai`**

| Procedure | Type | Input | Output | หมายเหตุ |
|-----------|------|-------|--------|---------|
| `ai.generatePost` | mutation | `PostGenerateInput` | `GeneratedPost` | สร้างโพสต์ด้วย AI |
| `ai.generateImage` | mutation | `ImageGenerateInput` | `{ imageURL }` | สร้างรูปด้วย Imagen |
| `ai.schedulePost` | mutation | `ScheduleInput` | `ScheduledPostDoc` | ตั้งเวลาโพสต์ |
| `ai.forecast` | query | `{ days: number }` | `ForecastResult` | คาดการณ์ยอดขาย |
| `ai.stockAlerts` | query | — | `StockAlert[]` | สินค้าใกล้หมด |
| `ai.dailyBriefing` | query | — | `DailyBriefing` | สรุปรายวัน |
| `ai.generateBriefing` | mutation | — | `DailyBriefing` | สร้าง briefing ใหม่ |

---

## Layer 5: Background & Aggregation

### `aiJobs/{jobId}` — Background AI Tasks

```typescript
interface AIJobDoc {
  id: string
  shopId: string
  type: 'daily_briefing' | 'weekly_summary' | 'knowledge_rebuild' | 'fine_tune'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: any
  error?: string
  startedAt?: Timestamp
  completedAt?: Timestamp
  createdAt: Timestamp
}
```

### `analytics/{shopId}/daily/{YYYY-MM-DD}` — Aggregated Metrics

```typescript
interface DailyAnalyticsDoc {
  date: string                   // "2026-03-22"
  revenue: number
  orderCount: number
  newCustomers: number
  topProducts: { name: string; quantity: number; revenue: number }[]
  avgOrderValue: number
  chatMessages: number
  aiAccuracy: number             // % ไม่ต้องแก้ไข
  createdAt: Timestamp
}
```

**tRPC Router: `analytics`**

| Procedure | Type | Input | Output | หมายเหตุ |
|-----------|------|-------|--------|---------|
| `analytics.getDashboard` | query | `{ period }` | `DashboardData` | Quick stats + chart data |
| `analytics.getTopProducts` | query | `{ period }` | `TopProduct[]` | สินค้าขายดี |
| `analytics.recordSale` | mutation | `SaleInput` | `void` | บันทึกยอดขาย (manual) |
| `analytics.importCSV` | mutation | `{ csvData }` | `{ imported }` | Import sales CSV |
| `analytics.getTodayRevenue` | query | — | `{ revenue, orders }` | ยอดวันนี้ (real-time) |

---

## Layer 6: Billing (Phase 2)

### `subscriptions/{shopId}` — Subscription

```typescript
interface SubscriptionDoc {
  shopId: string
  plan: 'trial' | 'starter' | 'pro' | 'business'
  status: 'active' | 'past_due' | 'cancelled' | 'trial'
  trialEndsAt: Timestamp
  currentPeriodStart: Timestamp
  currentPeriodEnd: Timestamp
  omiseCustomerId?: string
  stripeCustomerId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

> ⏱️ Phase 2 — ยังไม่ต้องทำตอนนี้

---

## 🔒 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuth() { return request.auth != null; }
    function isOwner(uid) { return isAuth() && request.auth.uid == uid; }
    function isShopOwner(shopId) {
      return isAuth() &&
        get(/databases/$(database)/documents/shops/$(shopId)).data.ownerId == request.auth.uid;
    }

    // Users — owner เท่านั้น
    match /users/{uid} {
      allow read, write: if isOwner(uid);
    }

    // Shops — owner เท่านั้น
    match /shops/{shopId} {
      allow read, write: if isShopOwner(shopId);

      // Subcollections — ใช้ isShopOwner เดียวกัน
      match /{subcollection}/{docId} {
        allow read, write: if isShopOwner(shopId);
      }
    }

    // Analytics
    match /analytics/{shopId}/{document=**} {
      allow read, write: if isShopOwner(shopId);
    }

    // AI Jobs
    match /aiJobs/{jobId} {
      allow read: if isAuth() &&
        resource.data.shopId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.shopId;
    }
  }
}
```

---

## 🌐 REST Endpoints (ไม่ใช่ tRPC)

| Method | Path | Auth | วัตถุประสงค์ |
|--------|------|------|-------------|
| POST | `/api/webhook/line` | LINE signature | รับ message จาก LINE OA |
| POST | `/api/webhook/payment` | Omise/Stripe sig | รับ payment events |
| GET | `/api/public/menu/:shopId` | ไม่มี (public) | เมนูสาธารณะ |

---

## ลำดับการพัฒนา (เรียงตาม Dependency)

```
สัปดาห์ 1:
  Day 1-2: Project setup + Firebase + tRPC
  Day 3-4: Layer 1 → users + shops + auth router + shop router
  Day 5-7: Onboarding wizard (สร้าง shops doc)

สัปดาห์ 2:
  Day 8-9:  Layer 2 → menuItems + menu router + menu UI
  Day 10:   Dashboard layout (sidebar, header)
  Day 11-12: Deploy staging + test

สัปดาห์ 3:
  Day 13-14: LINE webhook + shop.connectLine
  Day 15-17: Layer 2 → knowledgeBase + knowledge router
  Day 18:    Knowledge UI (structured + freeform + upload)

สัปดาห์ 4:
  Day 19-20: AI Style Customizer + shop.updateStyle + previewAI
  Day 21-24: Chat Brain v1 → RAG + intent + 4-layer prompt
  Day 25-28: Layer 4 → learnedPatterns + chatLog router + chat UI

สัปดาห์ 5:
  Day 29-30: Layer 3 → customers + orders (from LINE chat)
  Day 31-33: Layer 5 → analytics + analytics router + charts

สัปดาห์ 6:
  Day 34-37: Daily briefing + dashboard home (real data)
  Day 38-40: Layer 3 → inventory + stock alerts
  Day 41-42: Full testing + staging deploy
```

---

_Version 1.0 · มีนาคม 2026_
