# 📋 SAMART — Business Plan

---

## 1. Business Overview

**ชื่อบริษัท**: SAMART (ปัญญา)
**ประเภทธุรกิจ**: SaaS (Software as a Service)
**ตลาดเป้าหมาย**: ร้านค้า SME ในเชียงใหม่และภาคเหนือ
**โมเดลธุรกิจ**: Monthly/Annual Subscription
**ผู้ก่อตั้ง**: Solo Developer

---

## 2. Problem Statement

เจ้าของร้านอาหาร คาเฟ่ และธุรกิจบริการขนาดเล็กในเชียงใหม่ต้องเผชิญกับปัญหา 3 อย่างพร้อมกัน:

| ปัญหา | ผลกระทบ |
|-------|---------|
| **ไม่มีเวลาทำ marketing** | โพสต์ Facebook ไม่สม่ำเสมอ ลูกค้าเก่าลืมร้าน |
| **ไม่รู้ข้อมูล data ตัวเอง** | ไม่รู้ว่าสินค้าไหนขายดี ไม่รู้ว่าลูกค้าหายไปไหน |
| **ตอบแชทไม่ทัน** | LINE ค้างนาน ลูกค้าไปร้านอื่น โดยเฉพาะนอกเวลาทำการ |

**ทางเลือกปัจจุบัน:**
- ใช้ Grab/LINE MAN → โดนหัก 30-35% ค่าคอมมิชชัน
- ใช้ POS ทั่วไป → แค่บันทึกข้อมูล ไม่ได้วิเคราะห์
- จ้างพนักงานทำ marketing → ค่าใช้จ่าย 10,000-15,000 บาท/เดือน

**SAMART แก้ทั้ง 3 ปัญหาในราคา 2,490 บาท/เดือน**

---

## 3. Solution

SAMART เป็น AI-native platform ที่ทำหน้าที่เป็น "สมองธุรกิจ" ผ่าน 4 modules:

```
🔢 Sales Brain     → วิเคราะห์ยอดขาย คาดการณ์ demand
✍️ Content Brain   → สร้างโพสต์ รูปภาพ โฆษณา อัตโนมัติ
💬 Chat Brain      → LINE chatbot 24/7 รับออเดอร์ จำลูกค้า
📊 Insight Brain   → Daily briefing + แนะนำ action รายวัน
```

---

## 4. Market Analysis

### ขนาดตลาด (Chiang Mai)
- ร้านอาหาร + คาเฟ่: ~8,000+ ร้าน (Google Maps, Wongnai)
- ธุรกิจบริการ (ซักรีด, ทำความสะอาด): ~2,000+ ธุรกิจ
- ร้านค้าปลีก: ~5,000+ ร้าน
- **TAM (Total Addressable Market)**: ~15,000 ธุรกิจ
- **SAM (Serviceable)**: ร้านที่มี LINE OA แล้ว ~3,000 ธุรกิจ
- **SOM (Year 1 Target)**: 100 ร้าน (3.3% ของ SAM)

### เทรนด์สนับสนุน
- LINE OA ใช้งานโดย 50+ ล้านคนในไทย
- ร้านค้าที่มี AI chatbot เพิ่มยอดขาย 20-35% (Salesforce 2025)
- SaaS สำหรับ F&B ในไทยโต 9.6% CAGR
- Digital Nomad เชียงใหม่ ~5,000 คน → ต้องการระบบ Eng/Thai

---

## 5. Competitive Analysis

| | Grab/LINE MAN | POS ทั่วไป | ChatGPT | **SAMART** |
|--|--------------|-----------|---------|-----------|
| AI Brain | ❌ | ❌ | ⚠️ DIY | ✅ Built-in |
| Content AI | ❌ | ❌ | ⚠️ DIY | ✅ Auto |
| LINE Integration | ✅ | ❌ | ❌ | ✅ Native |
| ราคา/เดือน | 30-35% commission | 1-3K | ~600 | 1,490-3,490 |
| เหมาะกับ SME ไทย | ⚠️ | ⚠️ | ❌ | ✅ |

**Unfair Advantage**: ออกแบบสำหรับตลาดไทยโดยเฉพาะ ตั้งแต่ภาษา, LINE integration, ราคา, และการ support

---

## 6. Revenue Model

→ ดูรายละเอียดใน [pricing.md](./pricing.md)

**Summary:**
- **Starter**: 1,490 ฿/เดือน
- **Pro**: 2,490 ฿/เดือน ⭐
- **Business**: 3,490 ฿/เดือน
- **Target ARPU**: ~2,100 ฿/เดือน
- **Year 1 MRR Target**: 250,000 ฿/เดือน

---

## 7. Go-to-Market Strategy

→ ดูรายละเอียดใน [marketing-plan.md](./marketing-plan.md)

**3 Phases:**
1. **Pre-Launch** (เดือน 1-3): Guerrilla, Content, 15 pilot ร้าน
2. **Launch** (เดือน 4-6): Official launch, Referral, Paid ads
3. **Scale** (เดือน 7-12): Product-led growth, Expansion

---

## 8. Financial Plan

### Startup Costs (Year 1)

| รายการ | ค่าใช้จ่าย |
|--------|-----------|
| Firebase + Vercel | ~2,000 ฿/เดือน |
| Gemini API (100 ร้าน) | ~15,000 ฿/เดือน |
| LINE Messaging API | ~5,000 ฿/เดือน |
| Omise payment fee | ~2% ของรายได้ |
| Marketing (avg) | ~20,000 ฿/เดือน |
| Tools & SaaS | ~3,000 ฿/เดือน |
| **รวม COGS/เดือน (100 ร้าน)** | **~47,000 ฿** |

### Break-even Analysis

```
MRR ที่ break-even = Fixed Costs / Gross Margin
= 47,000 / 0.80
= ~59,000 ฿/เดือน

จำนวนร้านที่ต้องการ = 59,000 / 2,100 (ARPU)
= ~28 ร้าน

Break-even ที่เดือนที่ 5-6 (เป้า 50 ร้าน)
```

### Cash Flow Projection

| เดือน | Revenue | Expenses | Net |
|-------|---------|----------|-----|
| 1 | 0 | 5,000 | -5,000 |
| 2 | 5,000 | 8,000 | -3,000 |
| 3 | 27,000 | 15,000 | +12,000 |
| 4 | 67,000 | 25,000 | +42,000 |
| 6 | 114,000 | 35,000 | +79,000 |
| 12 | 232,000 | 50,000 | +182,000 |

---

## 9. Milestones & Success Metrics

| เวลา | Business Milestone |
|------|-------------------|
| เดือน 1 | เริ่ม pilot 5 ร้านแรก |
| เดือน 3 | 15 pilot ร้าน, 3 testimonial |
| เดือน 4 | Official launch |
| เดือน 6 | 50 ร้าน, MRR 100,000 ฿ |
| เดือน 12 | 100+ ร้าน, MRR 250,000 ฿ |
| ปีที่ 2 | Expand ภาคเหนือ, ARR 5M ฿ |

---

## 10. Solo Dev Risk Management

| Risk | โอกาส | Impact | แผนรับมือ |
|------|--------|--------|----------|
| เวลาพัฒนาไม่พอ | สูง | สูง | Ship MVP ก่อน ไม่ต้องสมบูรณ์ 100% |
| ลูกค้าแรกหายาก | กลาง | สูง | เน้น offline outreach ก่อน digital |
| AI cost เกินงบ | กลาง | กลาง | ใช้ Flash model, add usage cap |
| Burnout | กลาง | สูง | กำหนดเวลาทำงานชัดเจน 40 ชม./สัปดาห์ |
| คู่แข่งใหญ่เข้ามา | ต่ำ | กลาง | ลึกใน local market ก่อน |
