import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface-dim">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto px-6">
        <h1 className="text-5xl font-bold mb-4">
          <span className="gradient-text">🧠 Panya</span>
        </h1>
        <p className="text-xl text-dark-muted mb-2 font-display">
          AI สมองร้านค้า
        </p>
        <p className="text-dark-muted mb-8">
          ระบบ AI อัจฉริยะที่รู้จักร้านคุณดีกว่าใคร
          <br />
          แชทบอท LINE · วิเคราะห์ยอดขาย · สร้างโพสต์ · สรุป Insight
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 rounded-xl text-white font-semibold gradient-primary hover:opacity-90 transition-opacity shadow-md"
          >
            🚀 เริ่มต้นใช้งาน
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 rounded-xl font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
