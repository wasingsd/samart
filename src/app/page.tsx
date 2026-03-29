import Link from "next/link";
import { Bot, BarChart3, Pencil, Share2, Users, CreditCard, ArrowRight, ChevronDown } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI ตอบแชท LINE",
    desc: "บอท AI ตอบลูกค้าอัตโนมัติ 24 ชม. เข้าใจบริบทร้านคุณ รู้เมนู รู้โปรโมชัน",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: BarChart3,
    title: "วิเคราะห์ยอดขาย",
    desc: "AI สรุปยอดทุกเช้า ตรวจจับ anomaly แนะนำ action items ที่ทำได้ทันที",
    color: "text-cyan-600 bg-cyan-50",
  },
  {
    icon: Pencil,
    title: "สร้าง Content AI",
    desc: "สร้างโพสต์โปรโมชัน + รูปสินค้าด้วย AI ตั้งโทน ตั้ง platform ครบ",
    color: "text-indigo-600 bg-indigo-50",
  },
  {
    icon: Share2,
    title: "โพสต์ลง Social",
    desc: "เชื่อม Facebook, Instagram, LINE ในที่เดียว สร้างแล้วโพสต์ได้เลย",
    color: "text-violet-600 bg-violet-50",
  },
  {
    icon: Users,
    title: "จัดการลูกค้า",
    desc: "CRM อัตโนมัติ แบ่ง segment ลูกค้า ดูประวัติ ส่ง broadcast ได้",
    color: "text-sky-600 bg-sky-50",
  },
  {
    icon: CreditCard,
    title: "ระบบ Billing",
    desc: "จ่ายเท่าที่ใช้ ไม่มีรายเดือน เติมเครดิตเมื่อต้องการ ปลอดภัย",
    color: "text-teal-600 bg-teal-50",
  },
];

const creditPackages = [
  {
    name: "Basic",
    emoji: "⚡",
    credits: "500",
    bonus: "",
    price: "149",
    perCredit: "0.30",
    popular: false,
  },
  {
    name: "Popular",
    emoji: "🔥",
    credits: "2,000",
    bonus: "+ 200 โบนัส",
    price: "499",
    perCredit: "0.25",
    popular: true,
  },
  {
    name: "Power",
    emoji: "💎",
    credits: "5,000",
    bonus: "+ 1,000 โบนัส",
    price: "999",
    perCredit: "0.20",
    popular: false,
  },
  {
    name: "Business",
    emoji: "🏢",
    credits: "15,000",
    bonus: "+ 3,000 โบนัส",
    price: "2,499",
    perCredit: "0.17",
    popular: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* ───── Header ───── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-gradient-to-tr from-[#1A237E] to-[#00B4D8] rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-[#1A237E] to-[#00B4D8] bg-clip-text text-transparent">
                SAMART
              </span>
            </div>

            {/* Nav (desktop) */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">ฟีเจอร์</a>
              <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">ราคา</a>
              <a href="#about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">เกี่ยวกับเรา</a>
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:inline-flex text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-2">
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 transition-all shadow-md shadow-blue-500/20"
              >
                เริ่มต้นใช้งาน
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-32 bg-gradient-to-b from-blue-50/50 via-white to-white">
        {/* Subtle blobs */}
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#00B4D8] rounded-full blur-[200px] opacity-[0.06] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-[#1A237E] rounded-full blur-[200px] opacity-[0.05] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-600 font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            เปิดให้ใช้งานแล้ววันนี้ — จ่ายเท่าที่ใช้ เครดิตฟรี 100
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            <span className="text-gray-900">AI สมองธุรกิจ</span>
            <br />
            <span className="bg-gradient-to-r from-[#1A237E] via-[#3F51B5] to-[#00B4D8] bg-clip-text text-transparent">
              สำหรับร้านค้าของคุณ
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            ระบบ AI อัจฉริยะที่ตอบแชทลูกค้า วิเคราะห์ยอดขาย สร้าง Content
            <br className="hidden sm:block" />
            และโพสต์ลง Social Media ให้อัตโนมัติ — <span className="text-gray-900 font-medium">ครบจบในที่เดียว</span>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              เริ่มต้นฟรี
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              ดูฟีเจอร์ทั้งหมด
              <ChevronDown className="w-5 h-5" />
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: "10K+", label: "ข้อความ AI/วัน" },
              { value: "99.9%", label: "Uptime" },
              { value: "< 1s", label: "ตอบไว" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#1A237E] to-[#00B4D8] bg-clip-text text-transparent">{s.value}</div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" className="relative py-24 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-[#00B4D8] tracking-wider uppercase">Features</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">ทุกเครื่องมือที่ร้านคุณต้องการ</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">จัดการร้านค้าครบวงจรด้วย AI — ไม่ต้องจ้างทีม ไม่ต้องเขียนโค้ด</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative p-6 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#1A237E] transition-colors">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Pricing ───── */}
      <section id="pricing" className="relative py-24 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-[#1A237E] tracking-wider uppercase">Pricing</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">จ่ายเท่าที่ใช้ ไม่มีรายเดือน</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">ฟีเจอร์ทั้งหมดใช้ฟรี เสียเครดิตเฉพาะ AI — เริ่มด้วยเครดิตฟรี 100</p>
          </div>

          {/* Free badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-sm text-emerald-600 font-medium">
              🌱 สมัครฟรี — ได้รับเครดิตฟรี 100 เครดิต ทดลองใช้ทันที
            </div>
          </div>

          {/* Credit packages */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto mb-16">
            {creditPackages.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-6 transition-all duration-300 ${
                  p.popular
                    ? "bg-white border-2 border-[#00B4D8] shadow-xl shadow-blue-100 scale-[1.03]"
                    : "bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#1A237E] to-[#00B4D8] text-xs font-semibold text-white">
                    แนะนำ
                  </div>
                )}
                <div className="text-2xl mb-2">{p.emoji}</div>
                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-sm text-gray-400">฿</span>
                  <span className="text-3xl font-extrabold text-gray-900">{p.price}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{p.credits} เครดิต</p>
                {p.bonus && (
                  <p className="text-xs text-emerald-500 font-semibold mt-0.5">{p.bonus}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">฿{p.perCredit}/เครดิต</p>
                <Link
                  href="/register"
                  className={`mt-5 w-full inline-flex justify-center py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                    p.popular
                      ? "bg-gradient-to-r from-[#1A237E] to-[#00B4D8] text-white hover:opacity-90 shadow-md shadow-blue-500/20"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  ซื้อเครดิต
                </Link>
              </div>
            ))}
          </div>

          {/* Credit cost table */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-center text-lg font-bold text-gray-900 mb-6">อัตราเครดิตต่อ Action</h3>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {[
                { action: "AI ตอบแชทลูกค้า", credits: "1 เครดิต", icon: "💬" },
                { action: "สร้าง Content โพสต์", credits: "5 เครดิต", icon: "✍️" },
                { action: "สร้างรูป AI", credits: "10 เครดิต", icon: "🎨" },
                { action: "AI Daily Briefing", credits: "3 เครดิต", icon: "☀️" },
                { action: "AI Insights", credits: "8 เครดิต", icon: "📊" },
              ].map((item, idx) => (
                <div
                  key={item.action}
                  className={`flex items-center justify-between px-6 py-3.5 ${
                    idx < 4 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-gray-700">{item.action}</span>
                  </div>
                  <span className="text-sm font-bold text-[#1A237E]">{item.credits}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-gray-400 mt-4">
              ฟีเจอร์อื่นๆ (เมนู, POS, ลูกค้า, Analytics, Knowledge) — <span className="text-emerald-500 font-semibold">ใช้ฟรีไม่จำกัด</span>
            </p>
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="relative py-24 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">พร้อมเปลี่ยนวิธีจัดการร้านค้า?</h2>
          <p className="text-gray-500 mb-8">เริ่มใช้ SAMART ฟรีวันนี้ — เครดิตฟรี 100 ตั้งค่า 5 นาที จ่ายเท่าที่ใช้</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 transition-all shadow-lg shadow-blue-500/25 hover:scale-[1.02]"
          >
            เริ่มต้นฟรีเลย
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer id="about" className="border-t border-gray-100 py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-gradient-to-tr from-[#1A237E] to-[#00B4D8] rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-white">S</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">SAMART</span>
              <span className="text-xs text-gray-400">— AI สมองธุรกิจ</span>
            </div>
            <div className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} SAMART. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
