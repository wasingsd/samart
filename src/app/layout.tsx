import type { Metadata } from "next";
import { Prompt, Sarabun, Inter } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SAMART — AI สมองร้านค้า",
  description:
    "ระบบ AI อัจฉริยะสำหรับร้านค้าเชียงใหม่ แชทบอท LINE วิเคราะห์ยอดขาย สร้างโพสต์ AI สรุป Insight รายวัน",
  keywords: [
    "AI",
    "ร้านค้า",
    "เชียงใหม่",
    "LINE OA",
    "chatbot",
    "วิเคราะห์ยอดขาย",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${prompt.variable} ${sarabun.variable} ${inter.variable}`}>
      <body className="antialiased min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
