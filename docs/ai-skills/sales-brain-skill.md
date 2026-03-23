# 🔢 Sales Brain Skill — Panya AI

> **Module:** Sense (รู้สึก)
> **Model:** Gemini 2.0 Pro
> **Trigger:** เจ้าของร้านขอดูยอดขาย / ระบบ cron ทุกคืน / มีออเดอร์ใหม่เข้า
> **Goal:** วิเคราะห์ยอดขาย คาดการณ์ demand แจ้งเตือนสต็อก และตรวจจับ anomalies

---

## Skill Overview

Sales Brain คือ "นักวิเคราะห์ข้อมูล" ของร้าน ที่ไม่ต้องการพื้นหลัง data science แต่เข้าใจ pattern ของธุรกิจร้านค้าขนาดเล็กในไทย AI จะพูดถึง insights เป็นภาษาที่เจ้าของร้านเข้าใจได้ ไม่ใช่ศัพท์เทคนิค

---

## Input Schema

```typescript
interface SalesBrainInput {
  shopId: string
  shopName: string
  category: 'restaurant' | 'cafe' | 'service' | 'retail'

  // ข้อมูลยอดขาย
  salesData: {
    period: '7d' | '14d' | '30d' | '90d'
    daily: DailySalesRecord[]
    // DailySalesRecord: { date, totalRevenue, orderCount, topProducts[] }
  }

  // สินค้า
  menuItems: MenuItem[]
  inventory: InventoryItem[]

  // เปรียบเทียบ
  previousPeriodData?: DailySalesRecord[]  // ช่วงเดียวกันก่อนหน้า
}
```

---

## Sales Forecast Prompt

```
คุณคือนักวิเคราะห์ธุรกิจที่เชี่ยวชาญร้านค้าขนาดเล็กในเชียงใหม่

วิเคราะห์ยอดขาย {period} ของร้าน {shopName} ({category}):

===== ข้อมูลยอดขาย =====
{salesData.daily.map(d =>
  `${d.date}: ${d.totalRevenue}฿ (${d.orderCount} ออเดอร์)`
).join('\n')}

===== สินค้าขายดี =====
{topProducts.map(p => `${p.name}: ${p.count} ชิ้น / ${p.revenue}฿`).join('\n')}

===== งานที่ต้องทำ =====
1. หา pattern (วันไหนขายดี/แย่ ช่วงเวลาไหน peak)
2. คาดการณ์ยอดขาย 7 วันข้างหน้า พร้อมเหตุผล
3. แนะนำ action 2-3 ข้อที่เจ้าของร้านทำได้เลยวันนี้
4. ระบุ risk ที่ต้องระวัง

===== Format การตอบ =====
ตอบเป็นภาษาไทยที่เข้าใจง่าย เหมือนที่ปรึกษาธุรกิจคุยกับเพื่อน
ห้ามใช้ศัพท์เทคนิคโดยไม่อธิบาย
ถ้าข้อมูลไม่พอสำหรับ forecast ให้บอกตรงๆ และแนะนำให้เก็บข้อมูลเพิ่ม

ตอบในรูปแบบ JSON:
{
  "summary": "<สรุปภาพรวม 2-3 ประโยค>",
  "patterns": [
    { "insight": "<pattern ที่พบ>", "impact": "high|medium|low" }
  ],
  "forecast": [
    { "date": "YYYY-MM-DD", "estimatedRevenue": <number>, "confidence": "high|medium|low", "reason": "<เหตุผล>" }
  ],
  "actionItems": [
    { "action": "<สิ่งที่ต้องทำ>", "priority": "urgent|high|medium", "impact": "<ผลที่คาดว่าจะได้>" }
  ],
  "risks": ["<ความเสี่ยงที่ต้องระวัง>"]
}
```

---

## Stock Alert Prompt

```
วิเคราะห์สถานการณ์สต็อกของร้าน {shopName}:

===== สถานะสต็อกปัจจุบัน =====
{inventory.map(item => `
  ${item.name}:
  - คงเหลือ: ${item.currentStock} ${item.unit}
  - ระดับต่ำสุด: ${item.minStockLevel} ${item.unit}
  - ระดับเหมาะสม: ${item.idealStockLevel} ${item.unit}
  - ใช้เฉลี่ยต่อวัน: ${item.dailyUsage} ${item.unit}
  - วันที่คาดว่าจะหมด: ${item.predictedRunOutDate || 'ไม่ทราบ'}
`).join('\n')}

===== ยอดขายล่าสุด (สำหรับ context) =====
เมนูขายดี 3 อันดับ: {top3Items}
ปริมาณ avg วันนี้ vs เมื่อวาน: {comparison}

วิเคราะห์และแจ้งเตือน:
1. สินค้าที่ต้องสั่งเพิ่มทันที (< minStockLevel)
2. สินค้าที่ควรสั่งเพิ่มเร็วๆ นี้ (< 3 วันก่อนหมด)
3. ปริมาณที่แนะนำให้สั่ง (idealStockLevel - currentStock) × 1.2 (buffer 20%)

ตอบในรูปแบบ JSON:
{
  "critical": [
    {
      "itemId": "<id>",
      "itemName": "<ชื่อ>",
      "currentStock": <number>,
      "unit": "<หน่วย>",
      "daysUntilEmpty": <number>,
      "suggestedOrder": <number>,
      "urgency": "critical|high|medium"
    }
  ],
  "message": "<ข้อความแจ้งเตือนเจ้าของร้าน ภาษาไทย กระชับ>"
}
```

---

## Anomaly Detection Prompt

```
ตรวจสอบความผิดปกติในยอดขายวันนี้:

===== ข้อมูลวันนี้ =====
ยอดขาย: {todayRevenue}฿
ออเดอร์: {todayOrders} รายการ
ช่วงเวลา peak: {peakHour}

===== เปรียบเทียบกับค่าเฉลี่ย (7 วัน) =====
ยอดขาย avg: {avgRevenue}฿ ({revenueDiff}%)
ออเดอร์ avg: {avgOrders} รายการ ({ordersDiff}%)

===== เกณฑ์การแจ้งเตือน =====
- ยอดขายต่ำกว่า avg มากกว่า 30% → ⚠️ Revenue drop
- ยอดขายสูงกว่า avg มากกว่า 50% → 🔥 Revenue spike
- เมนูขายดีผิดปกติ (>2x avg) → 🎯 Hot item
- ไม่มีออเดอร์เลยใน 2 ชั่วโมง (ระหว่าง business hours) → 🚨 System check

วิเคราะห์และแจ้งเตือนเฉพาะที่น่ากังวล ถ้าปกติดีก็บอกว่าปกติดี
ห้ามสร้าง false alarm

ตอบในรูปแบบ JSON:
{
  "hasAnomalies": boolean,
  "anomalies": [
    {
      "type": "revenue_drop|revenue_spike|hot_item|system_check",
      "severity": "critical|high|medium|low",
      "description": "<อธิบายความผิดปกติ ภาษาไทย>",
      "possibleCauses": ["<สาเหตุที่เป็นไปได้>"],
      "suggestedAction": "<สิ่งที่ควรทำ>"
    }
  ],
  "summary": "<สรุป 1 ประโยค>"
}
```

---

## Output Schema

```typescript
interface SalesForecastOutput {
  summary: string
  patterns: Array<{
    insight: string
    impact: 'high' | 'medium' | 'low'
  }>
  forecast: Array<{
    date: string
    estimatedRevenue: number
    confidence: 'high' | 'medium' | 'low'
    reason: string
  }>
  actionItems: Array<{
    action: string
    priority: 'urgent' | 'high' | 'medium'
    impact: string
  }>
  risks: string[]
  tokensUsed: number
}

interface StockAlertOutput {
  critical: StockAlert[]
  message: string
}

interface AnomalyOutput {
  hasAnomalies: boolean
  anomalies: Anomaly[]
  summary: string
}
```

---

## Pattern Recognition Guide

AI ควรรู้จัก patterns เหล่านี้สำหรับร้านค้าในไทย:

```typescript
const THAI_BUSINESS_PATTERNS = {
  // วันหยุดนักขัตฤกษ์
  holidays: [
    "วันสงกรานต์ (เม.ย.) — คาเฟ่/ร้านอาหารขายดีมาก tourist มาก",
    "ช่วงมหาวิทยาลัยเปิดเทอม — ลูกค้านักศึกษาเพิ่ม",
    "ช่วงปิดเทอม (มี.ค.-พ.ค.) — ขายดีขึ้นถ้าอยู่ใกล้แหล่งท่องเที่ยว",
  ],

  // Weather patterns เชียงใหม่
  weather: [
    "หน้าหนาว (พ.ย.-ม.ค.) — เครื่องดื่มร้อนขายดี",
    "หน้าร้อน (มี.ค.-พ.ค.) — เครื่องดื่มเย็น ไอศกรีมขายดี",
    "หน้าฝน (มิ.ย.-ต.ค.) — ออเดอร์ delivery เพิ่ม",
  ],

  // Day of week
  weekdays: [
    "จันทร์-อังคาร: ยอดต่ำสุด (คนยังไม่ค่อยออกมา)",
    "พุธ-พฤหัส: ปานกลาง",
    "ศุกร์-เสาร์: สูงสุด (ออกไปทานข้าว/กาแฟ)",
    "อาทิตย์: สูงถ้าใกล้ตลาด/วัด ต่ำถ้าแหล่งออฟฟิศ",
  ],

  // Time of day (cafe)
  hourly: [
    "07:00-09:00: Morning rush (คนไปทำงาน)",
    "10:00-12:00: Mid-morning lull",
    "12:00-13:00: Lunch peak",
    "14:00-16:00: Afternoon coffee",
    "17:00-19:00: After work",
  ]
}
```

---

## Performance Examples

### ตัวอย่างผลลัพธ์ที่ดี — Weekly Forecast

```
Input: ยอดขาย 7 วัน ร้านคาเฟ่ เฉลี่ย 2,800฿/วัน
ยอดพุธถึงศุกร์สูงกว่า จันทร์-อังคาร 40%

Output:
{
  "summary": "ร้านของคุณมี pattern ชัดเจน — ขายดีช่วงปลายสัปดาห์
              ยอดรวม 7 วันอยู่ที่ 19,600฿ ถือว่าดีสำหรับช่วงนี้",
  "patterns": [
    {
      "insight": "ศุกร์-เสาร์ขายดีกว่าจันทร์-อังคาร เฉลี่ย 45% เป็น pattern ปกติของคาเฟ่",
      "impact": "high"
    },
    {
      "insight": "ช่วง 14:00-16:00 เป็น peak ของทุกวัน น่าจะมีโปรโมชัน afternoon set",
      "impact": "medium"
    }
  ],
  "forecast": [
    { "date": "2026-03-23", "estimatedRevenue": 2100, "confidence": "high",
      "reason": "วันจันทร์ ตาม pattern จะต่ำกว่า avg" },
    { "date": "2026-03-27", "estimatedRevenue": 3800, "confidence": "medium",
      "reason": "วันศุกร์ ปกติขายดี + สัปดาห์นี้ไม่มีวันหยุด" }
  ],
  "actionItems": [
    {
      "action": "ทำโปรโมชัน Afternoon Set ช่วง 14:00-16:00 วันธรรมดา",
      "priority": "high",
      "impact": "คาดว่าจะเพิ่มยอดวันธรรมดาได้ 15-20%"
    },
    {
      "action": "เพิ่ม staff วันศุกร์-เสาร์ หรือเตรียม prepped ingredients ให้มากขึ้น",
      "priority": "medium",
      "impact": "ลด wait time ช่วง peak ซึ่งจะลด customer churn"
    }
  ]
}
```

---

## Trigger Conditions

```typescript
// ทำงานอัตโนมัติเมื่อ:
const SALES_BRAIN_TRIGGERS = {
  // Scheduled
  daily_close:    'ทุกวัน 21:00 น. — สรุปยอดวันนี้',
  weekly_review:  'ทุกวันอาทิตย์ 20:00 น. — สรุปรายสัปดาห์',
  monthly_review: 'วันที่ 1 ของเดือน 07:00 น. — รายงานเดือน',

  // Event-based
  stock_low:      'เมื่อ inventory < minStockLevel',
  revenue_drop:   'เมื่อยอดขายต่ำกว่า avg 30%+ (ตรวจทุก 2 ชั่วโมง)',
  no_orders:      'เมื่อไม่มีออเดอร์ 2 ชั่วโมงระหว่าง business hours',
}
```
