# 🤖 Panya — AI Components Specification

---

## Overview

Panya ประกอบด้วย 4 AI Brain modules ที่ทำงานเชื่อมกัน ทุก module ใช้ Google Gemini เป็นฐาน แต่มี context, prompt, และ workflow ที่แตกต่างกันตามหน้าที่

```
ShopContext (ข้อมูลร้าน)
      │
      ├──▶ Sales Brain    → วิเคราะห์ + คาดการณ์
      ├──▶ Content Brain  → สร้างคอนเทนต์
      ├──▶ Chat Brain     → ตอบลูกค้า
      └──▶ Insight Brain  → สรุป + แนะนำ
```

---

## 1. Sales Brain (Panya Sense)

### หน้าที่
วิเคราะห์ข้อมูลยอดขายและคาดการณ์อนาคต

### Input
```typescript
interface SalesBrainInput {
  shopId: string
  salesHistory: SaleRecord[]    // 90 วันล่าสุด
  inventoryLevels: StockItem[]
  externalFactors: {
    isHoliday: boolean
    weather: string
    localEvents: string[]
  }
}
```

### Output
```typescript
interface SalesBrainOutput {
  forecast: {
    next7Days: DayForecast[]
    topProducts: ProductRanking[]
    expectedRevenue: number
  }
  stockAlerts: StockAlert[]      // สินค้าที่ต้องสั่งเพิ่ม
  actionItems: string[]          // "เพิ่มกาแฟ Signature ก่อนวันศุกร์"
}
```

### Prompt Strategy
```typescript
const SALES_BRAIN_PROMPT = `
คุณคือ AI วิเคราะห์ธุรกิจสำหรับร้าน{shopName}

ข้อมูลยอดขาย 30 วันที่ผ่านมา:
{salesData}

สินค้าในสต็อกปัจจุบัน:
{inventoryData}

กรุณาวิเคราะห์และตอบเป็นภาษาไทยที่เจ้าของร้านเข้าใจได้ง่าย:
1. สินค้า TOP 3 ที่ขายดีที่สุด และทำไม
2. คาดการณ์ยอดขาย 7 วันข้างหน้า
3. สินค้าที่ควรเพิ่มสต็อกและทำไม
4. 1 action ที่ควรทำวันนี้เพื่อเพิ่มยอดขาย

ตอบเป็น JSON format ตาม schema ที่กำหนด
`
```

---

## 2. Content Brain (Panya Create)

### หน้าที่
สร้างคอนเทนต์ marketing อัตโนมัติสำหรับ Facebook, LINE, Instagram

### Sub-modules

#### 2a. Text Generator
```typescript
interface ContentBrainInput {
  shopId: string
  contentType: 'promotion' | 'new-menu' | 'daily-special' | 'announcement' | 'story'
  product?: string
  discount?: string
  tone: 'fun' | 'professional' | 'warm' | 'urgent'
  targetPlatform: 'facebook' | 'line' | 'instagram'
  language: 'th' | 'en' | 'both'
}

interface ContentBrainTextOutput {
  caption: string          // โพสต์หลัก
  hashtags: string[]       // #คาเฟ่เชียงใหม่ #coffee
  cta: string              // "สั่งผ่าน LINE ได้เลย!"
  alternativeVersions: string[]  // A/B test options
  bestPostTime: string     // "โพสต์วันศุกร์ เวลา 17:00 จะได้ engagement ดีที่สุด"
}
```

#### 2b. Image Generator (Gemini Imagen 3)
```typescript
interface ImageGenInput {
  productName: string
  shopStyle: ShopBrandStyle    // สีหลัก, โลโก้, สไตล์
  contentType: string
  textOverlay?: string         // ข้อความที่ต้องการบนรูป
}

// Prompt template สำหรับ Imagen
const buildImagePrompt = (input: ImageGenInput) => `
Professional food photography style.
Product: ${input.productName}
Style: ${input.shopStyle.aesthetic}
Color palette: ${input.shopStyle.colors.join(', ')}
Mood: warm, appetizing, Thai cafe aesthetic
Text area: leave space on ${input.textOverlay ? 'right side' : 'none'} for text overlay
High quality, well-lit, Instagram-worthy
`
```

#### 2c. Scheduler
```typescript
// โพสต์อัตโนมัติตามเวลาที่ AI แนะนำ
interface ScheduledPost {
  content: string
  imageUrl?: string
  platform: Platform[]
  scheduledAt: Date
  shopId: string
  status: 'pending' | 'posted' | 'failed'
}
```

---

## 3. Chat Brain (Panya Talk)

### หน้าที่
LINE OA chatbot ที่เข้าใจบริบทร้านค้า รับออเดอร์ ตอบคำถาม และจำลูกค้า

### Intent Classification
```typescript
type ChatIntent =
  | 'order'              // ต้องการสั่งอาหาร/สินค้า
  | 'menu-inquiry'       // ถามเมนู ราคา วัตถุดิบ
  | 'hours-location'     // เวลาเปิด-ปิด ที่อยู่
  | 'complaint'          // ปัญหา/ร้องเรียน
  | 'reservation'        // จองโต๊ะ
  | 'promotion-inquiry'  // ถามโปรโมชัน
  | 'general'            // คำถามทั่วไป
```

### RAG Knowledge Base
```typescript
interface ShopKnowledge {
  menu: MenuItem[]           // เมนู ราคา วัตถุดิบ allergen
  faqs: FAQ[]                // คำถามที่พบบ่อย
  businessHours: Hours       // เวลาเปิด-ปิด
  location: LocationInfo     // ที่อยู่ แผนที่
  promotions: Promotion[]    // โปรโมชันปัจจุบัน
  shopPolicies: Policy[]     // นโยบายร้าน
}

// Build context สำหรับ Gemini
async function buildRAGContext(shopId: string, query: string): Promise<string> {
  const knowledge = await getShopKnowledge(shopId)
  const relevant = await semanticSearch(knowledge, query, topK=3)
  return `
    ข้อมูลร้าน:
    ${relevant.map(r => r.content).join('\n')}
  `
}
```

### Customer Memory System
```typescript
interface CustomerProfile {
  lineUserId: string
  shopId: string
  name?: string
  orderHistory: Order[]
  preferences: string[]       // "ไม่กินเผ็ด", "ชอบกาแฟเย็น"
  lastVisit: Timestamp
  totalSpend: number
  segment: 'vip' | 'regular' | 'new' | 'dormant'
}

// Follow-up: ลูกค้าไม่มา 14 วัน → ส่ง LINE
const FOLLOWUP_TEMPLATE = `
สวัสดีคะ {customerName} 😊
ไม่เจอกันนานเลยนะคะ {shopName} คิดถึงค่ะ
วันนี้มีเมนูใหม่ที่น่าจะถูกใจคุณมากเลยค่ะ: {recommendedItem}
แวะมาดูได้นะคะ! ☕
`
```

### System Prompt (Chat Brain)
```typescript
const buildChatSystemPrompt = (shop: ShopProfile, customer: CustomerProfile) => `
คุณคือ AI assistant ของร้าน "${shop.name}" ในเชียงใหม่
ชื่อ: ${shop.botName || 'น้องปัญญา'}
บุคลิก: ${shop.botPersonality || 'เป็นมิตร สุภาพ ช่วยเหลือดี'}

ข้อมูลร้าน:
${formatShopInfo(shop)}

ลูกค้าคนนี้: ${customer.name || 'ลูกค้าใหม่'}
ประวัติ: ${formatCustomerHistory(customer)}

กฎสำคัญ:
- ตอบภาษาไทยเสมอ (ยกเว้นลูกค้าถามเป็นภาษาอื่น)
- ห้ามสร้างข้อมูลที่ไม่มีใน context
- ถ้าไม่รู้ ให้บอกว่า "ขอสอบถามเพิ่มเติมนะคะ"
- ตอบสั้นกระชับ ไม่เกิน 3-4 ประโยค
- ถ้ามีออเดอร์ ให้ยืนยันและส่ง structured order object
`
```

---

## 4. Insight Brain (Panya Guide)

### หน้าที่
สร้าง Daily Briefing และ actionable recommendations รายวัน

### Daily Briefing Format
```typescript
interface DailyBriefing {
  date: string
  headline: string          // "วันนี้ยอดดีมาก! ☀️ กาแฟ Signature ขายได้ 40 แก้ว"
  metrics: {
    revenue: { today: number, vsYesterday: number, vsSameDay: number }
    orders: { count: number, avgValue: number }
    topProduct: string
    newCustomers: number
  }
  alerts: Alert[]           // สต็อก, ลูกค้าหาย
  todayActions: Action[]    // 3 สิ่งที่ควรทำวันนี้
  weekForecast: string      // "สุดสัปดาห์นี้คาดว่ายอดจะเพิ่ม 30%"
}
```

### Anomaly Detection
```typescript
// ตรวจสอบความผิดปกติและแจ้งเตือน
async function detectAnomalies(shopId: string): Promise<Alert[]> {
  const alerts: Alert[] = []

  // 1. ยอดขายลดฮวบ
  if (todayRevenue < avg7Days * 0.5) {
    alerts.push({ type: 'revenue-drop', severity: 'high', message: '...' })
  }

  // 2. สต็อกจะหมด
  const lowStock = inventory.filter(i => i.quantity < i.minThreshold)
  if (lowStock.length > 0) {
    alerts.push({ type: 'low-stock', items: lowStock })
  }

  // 3. ลูกค้าประจำหายไป
  const dormantVIPs = customers.filter(c =>
    c.segment === 'vip' && daysSince(c.lastVisit) > 14
  )
  if (dormantVIPs.length > 0) {
    alerts.push({ type: 'dormant-vip', customers: dormantVIPs })
  }

  return alerts
}
```

---

## AI Shared Utilities

### Context Builder
```typescript
// ทุก Brain ใช้ ShopContext ร่วมกัน
interface ShopContext {
  shopId: string
  shopName: string
  category: 'restaurant' | 'cafe' | 'service' | 'retail'
  location: string
  brandStyle: BrandStyle
  menuItems: MenuItem[]
  currentPromotions: Promotion[]
  businessHours: Hours
  subscription: SubscriptionTier
}
```

### Response Validator
```typescript
// ตรวจสอบว่า AI ตอบถูกรูปแบบ
async function validateAIResponse<T>(
  response: string,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const parsed = JSON.parse(response)
    return schema.parse(parsed)
  } catch {
    // retry with clarification prompt
    return retryWithSchema(response, schema)
  }
}
```

### Cost Tracker
```typescript
// ติดตาม AI usage ไม่ให้เกินงบ
interface AIUsageTracker {
  shopId: string
  monthlyTokens: number
  monthlyImages: number
  estimatedCost: number
  limit: UsageLimit
}
```
