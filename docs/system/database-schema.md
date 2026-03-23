# 🗄️ Panya — Database Schema (Firestore)

---

## Collection Structure

```
firestore/
├── shops/                          # ร้านค้า
│   └── {shopId}/
│       ├── (doc fields)            # รวม shopStyleProfile
│       ├── menuItems/              # เมนู/สินค้า
│       ├── customers/              # ลูกค้า
│       ├── orders/                 # ออเดอร์
│       ├── inventory/              # สต็อก
│       ├── scheduledPosts/         # โพสต์ที่รอโพสต์
│       ├── knowledgeBase/          # RAG knowledge (Layer 1)
│       └── learnedPatterns/        # Few-shot examples (Layer 3)
│
├── users/                          # เจ้าของร้าน (Firebase Auth)
│   └── {userId}/
│       └── (doc fields)
│
├── subscriptions/                  # Billing
│   └── {shopId}
│
├── aiJobs/                         # Background AI tasks
│   └── {jobId}
│
└── analytics/                      # Aggregated metrics
    └── {shopId}/
        └── daily/{date}
```

---

## Schema Definitions

### `shops/{shopId}`
```typescript
interface Shop {
  id: string
  name: string                    // "Doi Coffee"
  ownerId: string                 // Firebase Auth UID
  category: 'restaurant' | 'cafe' | 'service' | 'retail'
  description?: string

  // Contact & Location
  phone: string
  address: string
  coordinates: GeoPoint
  lineOaId: string                // LINE OA Channel ID
  lineOaSecret: string            // (encrypted)
  lineOaToken: string             // (encrypted)

  // Brand
  logoUrl?: string
  brandColors: string[]           // ['#1A237E', '#00B4D8']
  brandStyle: 'modern' | 'warm' | 'minimal' | 'traditional'
  botName: string                 // ชื่อ chatbot เช่น "น้องมะลิ"
  botPersonality: string

  // AI Style Profile (จาก knowledge-management)
  styleProfile: {
    formalityLevel: number          // 0-100 (0=ทางการ, 100=เป็นกันเอง)
    emojiUsage: 'none' | 'some' | 'lots'
    replyLength: 'short' | 'medium' | 'long'
    language: 'thai' | 'mixed' | 'english'
    closingPhrase: string           // "ขอบคุณมากนะคะ 😊"
    openingGreeting: string
    guardrails: string[]            // สิ่งที่ห้าม AI พูด
  }

  // AI Personalization (จาก ai-personalization)
  tunedModelId?: string             // Gemini Tuned Model (Business tier)
  tuningStatus?: 'none' | 'training' | 'ready'
  lastTunedAt?: Timestamp

  // Business Hours
  businessHours: {
    [day: string]: { open: string, close: string, closed: boolean }
  }

  // Settings
  language: 'th' | 'en' | 'both'
  timezone: string                // 'Asia/Bangkok'
  currency: 'THB'

  // Status
  status: 'active' | 'suspended' | 'trial'
  trialEndsAt?: Timestamp

  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `shops/{shopId}/menuItems/{itemId}`
```typescript
interface MenuItem {
  id: string
  name: string
  nameEn?: string
  description?: string
  price: number
  category: string               // "เครื่องดื่ม", "อาหาร", "ของหวาน"
  imageUrl?: string

  // Stock
  inStock: boolean
  stockCount?: number            // null = ไม่จำกัด
  minStockAlert?: number

  // AI metadata
  tags: string[]                 // ['bestseller', 'seasonal', 'spicy']
  allergens: string[]
  calories?: number

  isActive: boolean
  sortOrder: number
  createdAt: Timestamp
}
```

### `shops/{shopId}/customers/{lineUserId}`
```typescript
interface Customer {
  lineUserId: string
  shopId: string

  // Profile
  displayName: string
  pictureUrl?: string
  email?: string
  phone?: string

  // Engagement
  firstVisit: Timestamp
  lastVisit: Timestamp
  visitCount: number
  totalSpend: number

  // Order history (summarized — full orders in orders collection)
  favoriteItems: string[]        // itemIds
  preferences: string[]          // "ไม่หวาน", "extra shot"

  // Segmentation
  segment: 'new' | 'regular' | 'vip' | 'dormant' | 'churned'
  lifetimeValue: number

  // Communication
  followedLineOa: boolean
  lastMessageAt?: Timestamp
  lastFollowUpAt?: Timestamp
  optOutMarketing: boolean

  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `shops/{shopId}/orders/{orderId}`
```typescript
interface Order {
  id: string
  shopId: string
  customerId?: string            // lineUserId (null = walk-in)

  // Items
  items: OrderItem[]
  subtotal: number
  discount: number
  total: number

  // Fulfillment
  type: 'dine-in' | 'takeaway' | 'delivery' | 'line-order'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

  // Payment
  paymentMethod: 'cash' | 'promptpay' | 'card' | 'truemoney'
  paymentStatus: 'unpaid' | 'paid' | 'refunded'

  // Source
  channel: 'line-chat' | 'pos' | 'walk-in' | 'phone'

  notes?: string
  createdAt: Timestamp
  completedAt?: Timestamp
}

interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  customizations?: string[]     // "ไม่หวาน", "extra ice"
  subtotal: number
}
```

### `shops/{shopId}/inventory/{itemId}`
```typescript
interface InventoryItem {
  id: string
  name: string                   // "เมล็ดกาแฟ Colombia"
  unit: string                   // "kg", "ลิตร", "ชิ้น"
  currentStock: number
  minStockLevel: number          // alert เมื่อต่ำกว่านี้
  idealStockLevel: number
  cost: number                   // ต้นทุนต่อหน่วย
  supplier?: string

  // AI tracking
  usagePerOrder: number          // เฉลี่ยใช้ต่อออเดอร์
  lastRestocked: Timestamp
  predictedRunOutDate?: Timestamp  // AI คำนวณ

  updatedAt: Timestamp
}
```

### `shops/{shopId}/scheduledPosts/{postId}`
```typescript
interface ScheduledPost {
  id: string
  shopId: string

  // Content
  caption: string
  imageUrl?: string
  videoUrl?: string
  hashtags: string[]

  // Targeting
  platforms: ('facebook' | 'line' | 'instagram')[]
  scheduledAt: Timestamp

  // Status
  status: 'draft' | 'scheduled' | 'posted' | 'failed'
  postedAt?: Timestamp
  errorMessage?: string

  // AI metadata
  generatedBy: 'ai' | 'manual'
  contentType: string
  expectedEngagement?: number

  createdAt: Timestamp
}
```

### `analytics/daily/{shopId}/{date}`
```typescript
interface DailyAnalytics {
  shopId: string
  date: string                   // "2026-03-22"

  // Revenue
  totalRevenue: number
  orderCount: number
  avgOrderValue: number

  // Products
  topProducts: { itemId: string, name: string, count: number, revenue: number }[]

  // Customers
  newCustomers: number
  returningCustomers: number
  totalCustomers: number

  // Channels
  revenueByChannel: Record<string, number>

  // Time distribution
  hourlyRevenue: Record<string, number>  // { "09": 500, "10": 1200, ... }

  // AI
  aiBriefing?: string           // Daily briefing text
  aiAlerts: Alert[]

  createdAt: Timestamp
}
```

### `shops/{shopId}/knowledgeBase/{docId}`
```typescript
// Layer 1 — RAG knowledge (จาก knowledge-management.md)
interface KnowledgeDocument {
  id: string
  type: 'menu' | 'faq' | 'policy' | 'promotion' | 'about' | 'freeform'
  title: string
  content: string              // raw text ที่ AI อ่าน
  embedding: number[]          // vector จาก text-embedding-004
  keywords: string[]           // keyword fallback search
  language: 'th' | 'en' | 'both'
  source: 'manual' | 'import' | 'auto'  // วิธีที่เพิ่มเข้ามา
  updatedAt: Timestamp
}
```

### `shops/{shopId}/learnedPatterns/{patternId}`
```typescript
// Layer 3 — Few-shot examples ที่เรียนรู้จาก corrections
interface LearnedPattern {
  id: string
  type: 'approved_reply' | 'corrected_reply'
  customerMessage: string      // สิ่งที่ลูกค้าพูด
  aiDraftReply: string         // AI ตอบแรก
  finalReply: string           // reply ที่เจ้าของร้าน approve/แก้ไข
  embedding: number[]          // vector ของ customerMessage (สำหรับ retrieval)
  usageCount: number           // ถูกดึงมาใช้กี่ครั้ง
  score: number                // 1-5 effectiveness
  createdAt: Timestamp
}
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuth() {
      return request.auth != null;
    }

    function isShopOwner(shopId) {
      return isAuth() &&
        get(/databases/$(database)/documents/shops/$(shopId)).data.ownerId
        == request.auth.uid;
    }

    // Shops — owner เท่านั้นที่ read/write ได้
    match /shops/{shopId} {
      allow read, write: if isShopOwner(shopId);

      // Sub-collections ก็ต้องเป็น owner
      match /{subcollection}/{docId} {
        allow read, write: if isShopOwner(shopId);
      }
    }

    // Users — read/write ได้เฉพาะของตัวเอง
    match /users/{userId} {
      allow read, write: if isAuth() && request.auth.uid == userId;
    }

    // Analytics — owner อ่านได้อย่างเดียว (write จาก Cloud Functions)
    match /analytics/{shopId}/{rest=**} {
      allow read: if isShopOwner(shopId);
      allow write: if false; // Cloud Functions only
    }
  }
}
```

---

## Indexes (Firestore Composite)

```
Collection: shops/{shopId}/orders
  Fields: status ASC, createdAt DESC
  Fields: customerId ASC, createdAt DESC

Collection: shops/{shopId}/customers
  Fields: segment ASC, lastVisit DESC
  Fields: totalSpend DESC

Collection: shops/{shopId}/scheduledPosts
  Fields: status ASC, scheduledAt ASC
```
