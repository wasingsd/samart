# 📋 SAMART — Project Spec (ไม่ให้หลุดการพัฒนา)

> เอกสารนี้เป็น "checklist ย่อ" ที่ต้องเช็คทุกครั้งก่อนเริ่มพัฒนาแต่ละฟีเจอร์
> อ้างอิงจาก docs/ ทั้งหมด — ถ้าสงสัยรายละเอียดให้ไปอ่าน docs/ ต้นฉบับ

---

## 🎯 เป้าหมายหลักของ SAMART

1. **AI ที่รู้จักร้านดีกว่าเจ้าของ** — ไม่ใช่แค่ chatbot ทั่วไป
2. **Solo developer ทำได้** — ใช้ managed services, serverless, ไม่ maintain infra เอง
3. **ราคาถูกกว่าพนักงาน 1 คน** — ต้นทุน AI < 150 ฿/ร้าน/เดือน
4. **เชียงใหม่ first** — ออกแบบสำหรับตลาดไทย ภาษาไทย LINE ecosystem

---

## 🚦 Rules ที่ห้ามทำผิด

### Security
- [ ] ข้อมูลร้าน A ห้ามรั่วไปร้าน B (Firestore Security Rules isolate per shopId)
- [ ] API keys ห้ามอยู่ใน client bundle
- [ ] LINE webhook ต้อง validate signature ทุกครั้ง
- [ ] ทุก protected route ต้องผ่าน Firebase Auth + shop ownership check

### AI
- [ ] **ห้าม hallucinate** — ถ้าไม่รู้ต้องตอบ "ขอสอบถามเพิ่มเติมนะคะ"
- [ ] ใช้ RAG context เท่านั้น ห้ามสร้างข้อมูลเมนู/ราคาเอง
- [ ] Response time ต้อง < 3 วินาที (Chat Brain)
- [ ] ทุก AI output ต้อง validate ด้วย Zod schema
- [ ] ต้องมี cost tracking — ห้ามให้ AI ใช้เกินงบ per shop
- [ ] Guardrails ของร้าน (สิ่งที่ AI ห้ามพูด) ต้องถูก enforce ทุกครั้ง

### UX
- [ ] เจ้าของร้านตั้งค่า + เริ่มใช้งานได้ภายใน 5 นาที
- [ ] Mobile responsive (375px ขึ้นไป)
- [ ] UI error message เป็นภาษาไทย
- [ ] ตอบภาษาเดียวกับที่ลูกค้าใช้ (ถ้าตั้งค่า language = 'mixed')

### Data
- [ ] Firestore path ต้องเป็น per-shop เสมอ: `shops/{shopId}/...`
- [ ] ลูกค้า LINE identify ด้วย `lineUserId`
- [ ] เก็บ `createdAt` + `updatedAt` ทุก document
- [ ] Analytics aggregate ต้องแยก collection ไม่ query live data

---

## 📐 Architecture Decision Records (ADR)

### ADR-01: ทำไมใช้ Gemini Flash สำหรับ Chat Brain?
- **เร็ว** — response time < 3 วินาที
- **ถูก** — ~0.003 ฿/reply (1,000 msg/เดือน = 3 ฿)
- **ภาษาไทยดี** — ไม่จำเป็นต้องใช้ Pro สำหรับ chat

### ADR-02: ทำไมใช้ Firestore แทน PostgreSQL?
- **Real-time listeners** — dashboard อัปเดตทันที
- **Serverless** — ไม่ต้อง maintain server
- **คุ้นเคย** — solo dev ใช้มาก่อน
- **Free tier ครอบคลุม** — 50+ ร้านแรก

### ADR-03: ทำไม RAG แทน Fine-tuning ตั้งแต่แรก?
- **ต้นทุน ~0 ฿** vs Fine-tune $2-5/1,000 examples
- **อัปเดตทันที** — เปลี่ยนเมนู → AI รู้เลย ไม่ต้อง retrain
- **Fine-tune เก็บไว้ Phase 3** สำหรับ Business tier ที่มี 500+ examples

### ADR-04: ทำไมใช้ tRPC?
- **Type-safe** — client รู้ type เดียวกับ server
- **ไม่ต้องเขียน type ซ้ำ** — ลด boilerplate สำหรับ solo dev
- **Webhooks ยังใช้ REST** — LINE/Omise ไม่รองรับ tRPC

---

## 🔀 Critical Flows ที่ต้องทำงานถูกต้อง

### 1. Chat Brain Flow (CRITICAL)
```
LINE message → validate signature → identify shop → upsert customer
→ classify intent → RAG retrieval → build prompt (4 layers)
→ Gemini Flash → validate response → LINE reply → log conversation
```
**ต้องเช็ค:**
- สินค้าหมด → ต้องบอกลูกค้า ไม่รับออเดอร์
- ร้านปิด → บอกเวลาเปิดถัดไป
- สั่งจำนวนมาก (>10) → ถามยืนยัน

### 2. Knowledge Building Flow
```
เจ้าของร้านเพิ่มข้อมูล (structured/upload/freeform)
→ process + chunk → embed (text-embedding-004)
→ save to knowledgeBase/ → update health score
```
**ต้องเช็ค:**
- มี preview ก่อน confirm import
- Knowledge Health Dashboard แสดง % coverage
- AI แนะนำ gap จาก unanswered questions

### 3. Learning Loop Flow
```
เจ้าของร้านดู chat log → approve/correct/feature reply
→ save learnedPattern → embed → ใช้เป็น few-shot ครั้งต่อไป
(optional) → เพิ่ม Knowledge Base ด้วย
```
**ต้องเช็ค:**
- Correct reply ต้องส่งกลับลูกค้าทันที
- Corrected pattern ต้อง penalize pattern เก่าที่ทำให้ AI ตอบผิด

### 4. Daily Briefing Flow
```
Cron 07:00 น. → ดึงข้อมูลเมื่อวาน (sales/stock/unanswered)
→ anomaly detection → Gemini Pro generate briefing
→ LINE push + save to dashboard
```
**ต้องเช็ค:**
- LINE message ≤ 300 ตัวอักษร
- Action items ต้องเจาะจง ทำได้เลย (ไม่ใช่แค่ "ควรปรับปรุง")
- ห้ามสร้าง false urgency

### 5. Content Generation Flow
```
เจ้าของร้านเลือก type/tone/product → generate text (Pro) + image (Imagen)
→ preview → edit/regenerate → schedule/post now
→ Facebook Graph API / LINE Broadcast
```
**ต้องเช็ค:**
- Text ต้องมีราคาถ้ามีสินค้า
- Hashtags ต้องมี local เชียงใหม่
- Image ต้อง match brand style ของร้าน

---

## 📊 Key Interfaces (ดึงจาก docs)

### ShopContext (ทุก Brain ใช้ร่วม)
```typescript
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

### StyleProfile (ร้านแต่ละร้านมีเอง)
```typescript
interface ShopStyleProfile {
  botName: string
  formalityLevel: number        // 0-100
  emojiUsage: 'none' | 'some' | 'lots'
  replyLength: 'short' | 'medium' | 'long'
  language: 'thai' | 'mixed' | 'english'
  closingPhrase: string
  openingGreeting: string
  guardrails: string[]
}
```

### Rate Limits (per subscription)
```typescript
const RATE_LIMITS = {
  starter: { aiGenerations: 50/day, lineMessages: 1000/month },
  pro:     { aiGenerations: 500/day, lineMessages: 'unlimited' },
  business:{ aiGenerations: 'unlimited', lineMessages: 'unlimited' },
}
```

---

## 🏃 Current Phase: Phase 1 — MVP Foundation

### Sprint 1 (สัปดาห์ 1-2): Core Infrastructure
- [ ] Next.js 15 + tRPC + Firebase setup
- [ ] Auth (register/login) + protected routes
- [ ] Onboarding wizard (3 steps)
- [ ] Dashboard layout
- [ ] Menu management CRUD

### Sprint 2 (สัปดาห์ 3-4): Chat Brain + Knowledge
- [ ] LINE OA webhook + connect flow
- [ ] Knowledge Center UI (structured/freeform/upload)
- [ ] AI Style Customizer + preview
- [ ] RAG knowledge base + embedding
- [ ] Chat Brain v1 (intent + RAG + reply)

### Sprint 3 (สัปดาห์ 5-6): Insight Dashboard
- [ ] Sales input (manual + CSV import)
- [ ] Charts (Recharts)
- [ ] Weekly AI summary
- [ ] LINE push notification

---

## ⚠️ Common Pitfalls (ระวัง!)

1. **อย่าลืม styleProfile** — ทุก AI response ต้อง inject style profile ของร้าน
2. **อย่า hardcode ภาษา** — ร้านบาง ร้านอาจตั้งค่าเป็น mixed/english
3. **อย่าลืม Firestore Security Rules** — เพิ่ม collection ใหม่ต้องเพิ่ม rules ด้วย
4. **อย่า embed ทุก field** — เฉพาะ content ที่ AI ต้องค้นหา embedding ที่ใหญ่จะแพง
5. **อย่าลืม LINE webhook ต้อง reply ภายใน 30 วินาที** — ถ้า AI ช้าต้องมี fallback
6. **อย่า query live data สำหรับ analytics** — ใช้ aggregated analytics collection
7. **อย่าลืม test บน LINE in-app browser** — UX ต่างจาก Chrome ปกติ

---

_Version 1.0 · มีนาคม 2026_
