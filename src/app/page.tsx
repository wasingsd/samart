import Link from "next/link";

const features = [
  {
    icon: "🤖",
    title: "AI ตอบแชท LINE",
    desc: "บอท AI ตอบลูกค้าอัตโนมัติ 24 ชม. เข้าใจบริบทร้านคุณ รู้เมนู รู้โปรโมชัน",
  },
  {
    icon: "📊",
    title: "วิเคราะห์ยอดขาย",
    desc: "AI สรุปยอดทุกเช้า ตรวจจับ anomaly แนะนำ action items ที่ทำได้ทันที",
  },
  {
    icon: "✍️",
    title: "สร้าง Content AI",
    desc: "สร้างโพสต์โปรโมชัน + รูปสินค้าด้วย AI ตั้งโทน ตั้ง platform ครบ",
  },
  {
    icon: "📱",
    title: "โพสต์ลง Social",
    desc: "เชื่อม Facebook, Instagram, LINE ในที่เดียว สร้างแล้วโพสต์ได้เลย",
  },
  {
    icon: "🎯",
    title: "จัดการลูกค้า",
    desc: "CRM อัตโนมัติ แบ่ง segment ลูกค้า ดูประวัติ ส่ง broadcast ได้",
  },
  {
    icon: "💰",
    title: "ระบบ Billing",
    desc: "เริ่มฟรี อัปเกรดเมื่อพร้อม จ่ายผ่านบัตรเครดิต/เดบิต ปลอดภัย",
  },
];

const plans = [
  {
    name: "Free",
    price: "0",
    period: "ตลอดไป",
    desc: "เริ่มต้นใช้งาน ทดลองระบบ",
    features: ["AI ตอบแชท 100 ข้อความ/เดือน", "Knowledge Base 20 รายการ", "สร้าง Content 3 ครั้ง/เดือน", "วิเคราะห์ยอดย้อนหลัง 7 วัน"],
    cta: "เริ่มต้นฟรี",
    popular: false,
  },
  {
    name: "Pro",
    price: "599",
    period: "/เดือน",
    desc: "สำหรับร้านที่เติบโต",
    features: ["AI ตอบแชท 2,000 ข้อความ/เดือน", "Knowledge Base 200 รายการ", "สร้าง Content 30 ครั้ง/เดือน", "วิเคราะห์ยอดย้อนหลัง 30 วัน", "Broadcast ลูกค้า", "Export ข้อมูล"],
    cta: "อัปเกรด Pro",
    popular: true,
  },
  {
    name: "Business",
    price: "1,499",
    period: "/เดือน",
    desc: "สำหรับธุรกิจขนาดใหญ่",
    features: ["AI ตอบแชท 10,000 ข้อความ/เดือน", "Knowledge Base ไม่จำกัด", "สร้าง Content ไม่จำกัด", "วิเคราะห์ยอดย้อนหลัง 90 วัน", "AI Insights + Anomaly Alert", "Broadcast + Priority Support"],
    cta: "ติดต่อเรา",
    popular: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#060B18] text-white overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00B4D8] rounded-full blur-[200px] opacity-[0.07]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#7C3AED] rounded-full blur-[200px] opacity-[0.07]" />
      </div>

      {/* ───── Header ───── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#060B18]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-gradient-to-tr from-[#1A237E] to-[#00B4D8] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                SAMART
              </span>
            </div>

            {/* Nav (desktop) */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">ฟีเจอร์</a>
              <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">ราคา</a>
              <a href="#about" className="text-sm text-gray-400 hover:text-white transition-colors">เกี่ยวกับเรา</a>
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:inline-flex text-sm text-gray-400 hover:text-white transition-colors px-3 py-2">
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#00B4D8] to-[#7C3AED] hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
              >
                เริ่มต้นใช้งาน
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-cyan-400 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            เปิดให้ใช้งานแล้ววันนี้ — เริ่มฟรี ไม่ต้องใช้บัตรเครดิต
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              AI สมองธุรกิจ
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#00B4D8] via-[#818CF8] to-[#7C3AED] bg-clip-text text-transparent">
              สำหรับร้านค้าของคุณ
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            ระบบ AI อัจฉริยะที่ตอบแชทลูกค้า วิเคราะห์ยอดขาย สร้าง Content
            <br className="hidden sm:block" />
            และโพสต์ลง Social Media ให้อัตโนมัติ — <span className="text-white font-medium">ครบจบในที่เดียว</span>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-[#00B4D8] to-[#7C3AED] hover:opacity-90 transition-all shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              เริ่มต้นฟรี
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all"
            >
              ดูฟีเจอร์ทั้งหมด
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" className="relative py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-cyan-400 tracking-wider uppercase">Features</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">ทุกเครื่องมือที่ร้านคุณต้องการ</h2>
            <p className="mt-3 text-gray-400 max-w-xl mx-auto">จัดการร้านค้าครบวงจรด้วย AI — ไม่ต้องจ้างทีม ไม่ต้องเขียนโค้ด</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.05] transition-all duration-300"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Pricing ───── */}
      <section id="pricing" className="relative py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-purple-400 tracking-wider uppercase">Pricing</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">เลือกแพลนที่เหมาะกับคุณ</h2>
            <p className="mt-3 text-gray-400">เริ่มต้นฟรี อัปเกรดเมื่อธุรกิจเติบโต</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-8 transition-all duration-300 ${
                  p.popular
                    ? "bg-gradient-to-b from-cyan-500/10 to-purple-500/10 border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10 scale-[1.02]"
                    : "bg-white/[0.03] border border-white/5 hover:border-white/10"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#00B4D8] to-[#7C3AED] text-xs font-semibold text-white">
                    แนะนำ
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">{p.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{p.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-sm text-gray-400">฿</span>
                  <span className="text-4xl font-extrabold text-white">{p.price}</span>
                  <span className="text-sm text-gray-500">{p.period}</span>
                </div>

                <ul className="mt-8 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <svg className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`mt-8 w-full inline-flex justify-center py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    p.popular
                      ? "bg-gradient-to-r from-[#00B4D8] to-[#7C3AED] text-white hover:opacity-90 shadow-lg shadow-cyan-500/20"
                      : "border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="relative py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">พร้อมเปลี่ยนวิธีจัดการร้านค้า?</h2>
          <p className="text-gray-400 mb-8">เริ่มใช้ SAMART ฟรีวันนี้ — ไม่ต้องใช้บัตรเครดิต ตั้งค่า 5 นาที</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-[#00B4D8] to-[#7C3AED] hover:opacity-90 transition-all shadow-xl shadow-cyan-500/25 hover:scale-[1.02]"
          >
            เริ่มต้นฟรีเลย
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer id="about" className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-gradient-to-tr from-[#1A237E] to-[#00B4D8] rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-white">S</span>
              </div>
              <span className="text-sm font-semibold text-gray-300">SAMART</span>
              <span className="text-xs text-gray-600">— AI สมองธุรกิจ</span>
            </div>
            <div className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} SAMART. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
