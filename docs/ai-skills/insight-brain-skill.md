# 📊 Insight Brain Skill — Panya AI

> **Module:** Guide (นำทาง)
> **Model:** Gemini 2.0 Pro
> **Trigger:** Firebase Scheduled Function ทุกเช้า 07:00 น. / เจ้าของร้านขอ briefing
> **Goal:** สรุปธุรกิจรายวัน แนะนำ action ที่ทำได้วันนี้เลย ด้วยภาษาที่เข้าใจง่าย

---

## Skill Overview

Insight Brain ทำหน้าที่เป็น "ที่ปรึกษาธุรกิจส่วนตัว" ที่ส่ง morning briefing ให้เจ้าของร้านทุกวัน รวมข้อมูลจากทุก Brain module มาสังเคราะห์เป็น insight ที่นำไปใช้งานได้จริงภายในวันนั้น

---

## Input Schema

```typescript
interface InsightBrainInput {
  shopId: string
  shopName: string
  category: string
  ownerName: string

  // ยอดขายเมื่อวาน
  yesterdaySales: DailyAnalytics

  // เปรียบเทียบ
  avgLast7Days: {
    revenue: number
    orderCount: number
    avgOrderValue: number
  }

  // สัปดาห์เดียวกันเดือนที่แล้ว
  sameWeekLastMonth?: {
    revenue: number
    orderCount: number
  }

  // สต็อก
  stockAlerts: StockAlert[]

  // คำถามที่ลูกค้าถามแต่ AI ตอบไม่ได้ (unanswered)
  unansweredQuestions: Array<{
    question: string
    count: number      // ถามกี่ครั้งใน 7 วัน
  }>

  // โพสต์ที่ schedule ไว้
  scheduledPosts: ScheduledPost[]

  // วันที่และเวลา
  date: string          // "วันจันทร์ที่ 23 มีนาคม 2026"
  dayOfWeek: string     // "Monday"
  isHoliday: boolean
  holidayName?: string  // "วันสงกรานต์"
  season: string        // "หน้าร้อน"
}
```

---

## Daily Briefing System Prompt

```
คุณคือที่ปรึกษาธุรกิจส่วนตัวของ{ownerName} เจ้าของร้าน {shopName}
คุณส่ง morning briefing ให้ทุกเช้า เพื่อให้เจ้าของร้านเริ่มต้นวันได้อย่างมั่นใจ

วันนี้คือ: {date}
{isHoliday ? `🎉 วันหยุด: ${holidayName}` : ''}
ฤดูกาล: {season}

===== ยอดขายเมื่อวาน =====
ยอดรวม: {yesterdaySales.totalRevenue}฿
ออเดอร์: {yesterdaySales.orderCount} รายการ
ราคาเฉลี่ย/ออเดอร์: {yesterdaySales.avgOrderValue}฿

เปรียบเทียบกับ avg 7 วัน:
  ยอดขาย: {revenueDiff}% {revenueDiff > 0 ? '↑' : '↓'}
  ออเดอร์: {ordersDiff}% {ordersDiff > 0 ? '↑' : '↓'}

สินค้าขายดีเมื่อวาน:
{yesterdaySales.topProducts.map(p => `  • ${p.name}: ${p.count} ชิ้น (${p.revenue}฿)`).join('\n')}

===== สิ่งที่ต้องระวัง =====
{stockAlerts.length > 0 ? stockAlerts.map(a =>
  `⚠️ ${a.itemName} เหลือ ${a.currentStock} ${a.unit} — อีก ${a.daysUntilEmpty} วันจะหมด`
).join('\n') : 'ไม่มีการแจ้งเตือนสต็อก ✅'}

===== คำถามที่ลูกค้าถามบ่อยแต่ยังไม่มีในฐานข้อมูล =====
{unansweredQuestions.length > 0 ? unansweredQuestions.map(q =>
  `  • "${q.question}" (ถาม ${q.count} ครั้งใน 7 วัน)`
).join('\n') : 'ไม่มี — Knowledge Base ครบดีแล้ว ✅'}

===== โพสต์ที่มีวันนี้ =====
{scheduledPosts.filter(p => isToday(p.scheduledAt)).length > 0 ?
  'มีโพสต์ scheduled ไว้แล้ว ✅' :
  'ยังไม่มีโพสต์วันนี้ — แนะนำให้สร้าง content'
}

===== งานที่ต้องทำ =====
สร้าง morning briefing ที่:
1. เริ่มด้วยการสรุปยอดเมื่อวานสั้นๆ (บวก/ลบ ตรงไปตรงมา)
2. ให้ 2-3 action items ที่ทำได้วันนี้เลย เรียงตาม priority
3. ถ้ามี stock alert → รวมไว้เป็น urgent action
4. ถ้ามีวันหยุด/เทศกาล → แนะนำว่าควรทำอะไร
5. ถ้ามี unanswered questions → แนะนำให้เพิ่มใน Knowledge Base
6. ปิดด้วยประโยคกระตุ้นใจ 1 ประโยค

สไตล์การเขียน:
- ภาษาไทย เป็นกันเอง เหมือนเพื่อนที่เชี่ยวชาญธุรกิจ
- ตรงไปตรงมา ไม่ verbose
- ข้อมูลตัวเลขที่สำคัญ bold
- ใช้ emoji พอประมาณเพื่อช่วย scan
- ความยาวรวม: ไม่เกิน 300 ตัวอักษร (อ่านบน LINE ได้)

ตอบในรูปแบบ JSON:
{
  "lineMessage": "<ข้อความสำหรับส่ง LINE — ไม่เกิน 300 ตัวอักษร>",
  "dashboardBriefing": "<ข้อความฉบับเต็มสำหรับ dashboard — 500+ ตัวอักษร>",
  "actionItems": [
    {
      "action": "<สิ่งที่ต้องทำ>",
      "priority": "urgent|high|medium",
      "deadline": "today|this_week|ongoing",
      "category": "stock|content|knowledge|sales|other",
      "estimatedImpact": "<ผลที่คาดว่าจะได้>"
    }
  ],
  "highlights": {
    "topWin": "<สิ่งดีที่สุดเมื่อวาน>",
    "topConcern": "<สิ่งที่น่ากังวลที่สุด>",
    "opportunity": "<โอกาสที่ควรคว้าวันนี้>"
  }
}
```

---

## Output Schema

```typescript
interface DailyBriefingOutput {
  // ข้อความ LINE (สั้น ≤300 chars)
  lineMessage: string

  // ข้อความเต็ม Dashboard
  dashboardBriefing: string

  // Action items
  actionItems: Array<{
    action: string
    priority: 'urgent' | 'high' | 'medium'
    deadline: 'today' | 'this_week' | 'ongoing'
    category: 'stock' | 'content' | 'knowledge' | 'sales' | 'other'
    estimatedImpact: string
  }>

  highlights: {
    topWin: string
    topConcern: string
    opportunity: string
  }

  tokensUsed: number
  generatedAt: string
}
```

---

## Action Item Synthesis Prompt

> ใช้เมื่อต้องการ action items โดยเฉพาะ (แยกจาก daily briefing)

```
วิเคราะห์ข้อมูลต่อไปนี้และสรุป action items ที่สำคัญที่สุดสำหรับร้าน {shopName}:

ข้อมูลที่มี:
- Sales trend 30 วัน: {trendSummary}
- สต็อกวิกฤต: {criticalStockItems}
- คำถามที่ลูกค้าถามแต่ AI ตอบไม่ได้ (Top 5): {unansweredQuestions}
- Content โพสต์ล่าสุด: {lastPostDaysAgo} วันที่แล้ว
- Feedback ที่ได้รับ: {recentFeedback}

เลือก 5 action items ที่สำคัญที่สุดสำหรับวันนี้
เรียงจาก urgent ไป medium
แต่ละข้อต้องเป็นสิ่งที่เจ้าของร้านทำคนเดียวได้ใน < 30 นาที

ตอบในรูปแบบ:
[
  {
    "rank": 1,
    "action": "<คำกริยา + สิ่งที่ต้องทำ + เป้าหมาย>",
    "why": "<เหตุผลสั้นๆ>",
    "howTo": "<วิธีทำ 1-2 ขั้นตอน>",
    "timeRequired": "<15 นาที>",
    "priority": "urgent|high|medium"
  }
]
```

---

## Weekly Summary Prompt

> ใช้ทุกวันอาทิตย์เย็น ส่งสรุปสัปดาห์

```
สร้างรายงานสรุปประจำสัปดาห์สำหรับร้าน {shopName}:

===== ยอดขายสัปดาห์นี้ =====
รวม: {weeklyRevenue}฿ ({weeklyChange}% vs สัปดาห์ที่แล้ว)
ออเดอร์: {weeklyOrders} รายการ
วันที่ขายดีสุด: {bestDay} ({bestDayRevenue}฿)
วันที่ขายต่ำสุด: {worstDay} ({worstDayRevenue}฿)

===== สินค้า =====
ขายดีสุด: {topProduct} ({topProductCount} ชิ้น)
ขายน้อยสุด: {bottomProduct} ({bottomProductCount} ชิ้น)

===== ลูกค้า =====
ลูกค้าใหม่: {newCustomers} คน
ลูกค้าประจำกลับมา: {returningCustomers} คน
ลูกค้าที่ไม่มาเกิน 14 วัน: {dormantCustomers} คน

===== AI Performance =====
บทสนทนาทั้งหมด: {totalConversations}
Approve โดยไม่แก้: {approvedWithoutEdit}%
แก้ไข reply: {correctedCount} ครั้ง
เพิ่ม learned patterns ใหม่: {newPatterns} อัน

สร้างรายงาน:
1. สรุปสัปดาห์ (ดี/ไม่ดี/เหตุผล) — 3-4 ประโยค
2. Learning ที่ได้จากสัปดาห์นี้ — 2-3 ข้อ
3. เป้าหมายสัปดาห์หน้า (realistic, measurable) — 2-3 ข้อ
4. Focus area สำหรับสัปดาห์หน้า — 1 ข้อ

ภาษาไทย เป็นกันเอง กระตุ้นกำลังใจ แต่ตรงไปตรงมา
```

---

## Performance Examples

### ตัวอย่าง LINE Message (สั้น กระชับ)

```
📊 สรุปวานนี้ — ดอยคอฟฟี่

💰 ยอด: 3,420฿ (+12% ✅)
🛒 28 ออเดอร์ | avg 122฿/ออเดอร์
🔥 Signature Latte ขายดีสุด (8 แก้ว)

📌 วันนี้ต้องทำ:
1. 🚨 สั่ง Oat Milk ด่วน (เหลือ 2L)
2. 📱 โพสต์โปรฯ ช่วง 14:00 น.
3. 📚 เพิ่ม FAQ เรื่อง Vegan (ลูกค้าถาม 5 ครั้ง)

วันนี้ขายให้ทะลุ 3,800฿ นะ! 💪
[ดูรายละเอียด →]
```

---

### ตัวอย่าง Dashboard Briefing (เต็ม)

```
🌅 Good Morning คุณนุช! วันจันทร์ที่ 23 มีนาคม 2026

━━━━━━━━━━━━━━━━━━━
📈 ยอดขายเมื่อวาน
━━━━━━━━━━━━━━━━━━━
ยอดรวม 3,420฿ (+12% vs avg 7 วัน)
ออเดอร์ 28 รายการ | เฉลี่ย 122฿/ออเดอร์

ขายดีสุด: Signature Latte 8 แก้ว (680฿)
ขายน้อยสุด: Matcha Latte 1 แก้ว — ลองโปรโมชั่นดูไหม?

Peak hour เมื่อวาน: 14:00-15:00 น.
→ ตรงกับ pattern เดิม ดี!

━━━━━━━━━━━━━━━━━━━
🚨 ต้องทำวันนี้
━━━━━━━━━━━━━━━━━━━

1. [URGENT] สั่ง Oat Milk เพิ่ม
   เหลือแค่ 2 ลิตร ใช้ได้อีก ~1 วัน
   → โทรหา supplier เดี๋ยวนี้เลย

2. [HIGH] สร้าง Content โพสต์
   ยังไม่มีโพสต์วันนี้
   → ใช้ Content Brain สร้าง Daily Special
   → ตั้งเวลาโพสต์ 12:00-13:00 น.

3. [HIGH] เพิ่ม FAQ เรื่อง Vegan option
   ลูกค้าถามถึง 5 ครั้งในสัปดาห์นี้ แต่ AI ตอบไม่ได้
   → ไปที่ Knowledge Center → FAQ Builder
   → เพิ่มคำตอบว่าร้านมี/ไม่มี Vegan

━━━━━━━━━━━━━━━━━━━
💡 โอกาสวันนี้
━━━━━━━━━━━━━━━━━━━
วันจันทร์คนมักไม่ค่อยมา → ทำ "Monday Special"
เช่น กาแฟ + ขนม ราคาพิเศษ 100฿
โพสต์ 07:30 น. จะได้ลูกค้าเช้า

หวังว่าวันนี้จะขายดีนะคะ! ☀️
```

---

## Cross-Brain Data Aggregation

```typescript
async function aggregateInsights(shopId: string): Promise<InsightBrainInput> {
  // ดึงข้อมูลจากทุก brain แบบ parallel
  const [
    yesterdaySales,
    stockAlerts,
    unansweredQuestions,
    scheduledPosts,
    weatherForecast,
  ] = await Promise.all([
    salesBrain.getYesterdayData(shopId),
    salesBrain.getStockAlerts(shopId),
    chatBrain.getUnansweredQuestions(shopId, { days: 7, minCount: 2 }),
    contentBrain.getScheduledPosts(shopId, { date: 'today' }),
    getWeatherForecast('chiang_mai'),  // Optional: weather context
  ])

  const avgLast7Days = await salesBrain.getAverages(shopId, { days: 7 })
  const sameWeekLastMonth = await salesBrain.getAverages(shopId, {
    startDate: subMonths(new Date(), 1),
    days: 7
  })

  return {
    shopId,
    yesterdaySales,
    avgLast7Days,
    sameWeekLastMonth,
    stockAlerts,
    unansweredQuestions,
    scheduledPosts,
    date: formatThaiDate(new Date()),
    dayOfWeek: getDayOfWeek(new Date()),
    isHoliday: await checkThaiHoliday(new Date()),
    season: getCurrentSeason(),
  }
}
```

---

## Insight Quality Standards

| Criteria | Standard |
|----------|----------|
| Briefing delivery time | ก่อน 07:30 น. ทุกวัน |
| Action items | 2-4 ข้อ ไม่มากเกินไป |
| Action specificity | เจาะจง ทำได้เลย ไม่ใช่แค่ "ควรปรับปรุง" |
| Tone | กระตุ้นใจ ไม่ negative ถึงแม้ยอดจะแย่ |
| LINE message length | ≤ 300 ตัวอักษร (อ่านบนมือถือสะดวก) |
| False urgency | ห้ามสร้าง urgency ปลอม — urgent จริงๆ เท่านั้น |

---

## Personalization Over Time

```
เดือนที่ 1: Generic templates + shop data
เดือนที่ 2: เรียนรู้ preference เจ้าของร้าน (ชอบ/ไม่ชอบอะไร)
เดือนที่ 3: เริ่ม proactive suggestion (ไม่รอให้ถาม)
เดือนที่ 6: Hyper-local insights (pattern เฉพาะร้านนั้น)

ตัวอย่าง personalization:
  ถ้าเจ้าของร้านไม่เคย approve action item เรื่อง social media
  → Insight Brain จะลดความถี่ในการแนะนำ social media actions
  และเพิ่ม actions เรื่องอื่นที่เจ้าของร้านทำมากกว่า
```
