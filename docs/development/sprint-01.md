# 🏃 Sprint 1 — Core Infrastructure

**ระยะเวลา**: สัปดาห์ 1-2 (14 วัน)
**เป้าหมาย**: Setup โครงสร้างระบบและ onboarding flow

---

## Sprint Goal
> เจ้าของร้านสามารถสมัครบัญชี, ตั้งค่าร้าน และเชื่อมต่อ LINE OA ได้ภายใน 5 นาที

---

## Tasks

### Day 1-2: Project Setup
- [ ] `npx create-next-app@latest panya --typescript --tailwind --app`
- [ ] Setup tRPC (server + client)
- [ ] Firebase project สร้าง + connect
- [ ] Firebase Auth setup (email/password)
- [ ] Environment variables structure
- [ ] Vercel project + staging deploy
- [ ] GitHub repo + branch strategy (`main`, `develop`, `feature/*`)

### Day 3-4: Auth Flow
- [ ] หน้า Login / Register (email)
- [ ] Firebase Auth hooks (`useAuth`)
- [ ] Protected routes middleware
- [ ] User document สร้างใน Firestore เมื่อ register
- [ ] Redirect logic (ถ้าไม่มีร้าน → ไป onboarding)

### Day 5-7: Shop Onboarding
- [ ] Onboarding wizard (3 steps):
  - Step 1: ข้อมูลร้านพื้นฐาน (ชื่อ, ประเภท, โทรศัพท์)
  - Step 2: ตั้งค่า AI bot (ชื่อ bot, บุคลิก, ภาษา)
  - Step 3: เวลาเปิด-ปิด
- [ ] Firestore: สร้าง `shops/{shopId}` document
- [ ] หลัง onboarding → redirect ไป dashboard

### Day 8-10: Dashboard Layout
- [ ] Sidebar navigation (responsive)
- [ ] Header component
- [ ] Dashboard home (placeholder cards)
- [ ] Settings page structure
- [ ] Mobile-friendly layout

### Day 11-12: Menu Management
- [ ] หน้าจัดการเมนู (list view)
- [ ] Add/Edit/Delete menu item
- [ ] Category management
- [ ] Toggle in-stock/out-of-stock
- [ ] Import เมนูจาก CSV (basic)

### Day 13-14: Testing + Deploy
- [ ] Unit tests สำหรับ auth + shop creation (Vitest)
- [ ] E2E test: register → onboarding → dashboard (Playwright)
- [ ] Deploy staging + ทดสอบบน mobile
- [ ] Sprint review: demo ให้ตัวเองดู

---

## Definition of Done (Sprint 1)
- [ ] สมัครบัญชีได้ด้วย email
- [ ] Onboarding wizard ผ่านได้ครบทั้ง 3 steps
- [ ] Dashboard โหลดได้ไม่เกิน 2 วินาที (Vercel)
- [ ] เพิ่ม/แก้ไข/ลบเมนูได้
- [ ] Responsive บน mobile (375px)
- [ ] ไม่มี console errors

---

## Tech Notes

```bash
# Folder structure (App Router)
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx              ← Sidebar + Header
│   ├── page.tsx                ← Dashboard home
│   ├── menu/page.tsx
│   ├── analytics/page.tsx
│   └── settings/page.tsx
├── onboarding/
│   └── page.tsx
└── api/
    ├── trpc/[trpc]/route.ts
    └── webhook/
        └── line/route.ts
```

```typescript
// tRPC context — inject user + shopId ทุก request
export const createContext = async (opts: CreateNextContextOptions) => {
  const token = opts.req.headers.authorization?.split(' ')[1]
  const user = token ? await verifyFirebaseToken(token) : null
  const shopId = user ? await getShopIdByOwner(user.uid) : null
  return { user, shopId }
}
```

---

## Blockers / Questions
- [ ] ชื่อ LINE OA ที่จะใช้ทดสอบ: สร้างบัญชีทดสอบก่อน
- [ ] Domain สำหรับ Panya: ตรวจสอบ `panya.ai` / `getpanya.com`
- [ ] Firebase plan: เริ่มด้วย Spark (ฟรี) → upgrade เมื่อมีลูกค้าจริง

---

## Velocity Estimate
- **Story points**: 34
- **Capacity**: 40 hours (20 hr/สัปดาห์ × 2 สัปดาห์)
- **Buffer**: 15% สำหรับ bug fixing

---

_Sprint start: มีนาคม 2026_
