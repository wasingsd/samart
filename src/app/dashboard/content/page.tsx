"use client";

import { useState } from "react";
import {
  FileText,
  Sparkles,
  Image,
  Calendar,
  Send,
  Facebook,
  MessageCircle,
  ChevronDown,
  Wand2,
  Copy,
  Clock,
} from "lucide-react";

const postTypes = [
  { value: "promotion", label: "โปรโมชัน" },
  { value: "new-product", label: "สินค้าใหม่" },
  { value: "daily", label: "โพสต์รายวัน" },
  { value: "review", label: "รีวิว" },
  { value: "tips", label: "เกร็ดความรู้" },
];

const tones = [
  { value: "friendly", label: "เป็นกันเอง" },
  { value: "professional", label: "มืออาชีพ" },
  { value: "fun", label: "สนุกสนาน" },
  { value: "luxury", label: "หรูหรา" },
];

export default function ContentPage() {
  const [postType, setPostType] = useState("promotion");
  const [tone, setTone] = useState("friendly");
  const [topic, setTopic] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [platforms, setPlatforms] = useState({ facebook: true, line: false });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-dark">สร้างโพสต์ AI</h1>
        <p className="text-sm text-dark-muted mt-1">ให้ AI ช่วยเขียน content สำหรับโซเชียลมีเดีย</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-surface-container p-5 space-y-4">
            <h3 className="font-display font-semibold text-dark flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-secondary" />
              ตั้งค่าโพสต์
            </h3>

            {/* Post Type */}
            <div>
              <label className="block text-xs font-bold tracking-wider text-dark-muted mb-1.5 uppercase">ประเภทโพสต์</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
              >
                {postTypes.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-xs font-bold tracking-wider text-dark-muted mb-2 uppercase">น้ำเสียง</label>
              <div className="grid grid-cols-2 gap-2">
                {tones.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTone(value)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      tone === value
                        ? "bg-primary text-white shadow-sm"
                        : "bg-surface-dim text-dark-muted hover:bg-surface-container"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-bold tracking-wider text-dark-muted mb-1.5 uppercase">หัวข้อ / สินค้า</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="เช่น: กาแฟ Signature ใหม่ ลดพิเศษ 20% วันนี้ - สิ้นเดือน"
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-xs font-bold tracking-wider text-dark-muted mb-2 uppercase">แพลตฟอร์ม</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPlatforms((p) => ({ ...p, facebook: !p.facebook }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    platforms.facebook
                      ? "bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/30"
                      : "bg-surface-dim text-dark-muted border border-transparent"
                  }`}
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </button>
                <button
                  onClick={() => setPlatforms((p) => ({ ...p, line: !p.line }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    platforms.line
                      ? "bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/30"
                      : "bg-surface-dim text-dark-muted border border-transparent"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  LINE
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <button className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-opacity shadow-md">
              <Sparkles className="w-4 h-4" />
              สร้าง Content ด้วย AI
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-surface-container overflow-hidden">
            <div className="p-5 border-b border-surface-container flex items-center justify-between">
              <h3 className="font-display font-semibold text-dark flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber" />
                ผลลัพธ์
              </h3>
              {generatedContent && (
                <button className="text-xs text-dark-muted flex items-center gap-1 hover:text-dark transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                  คัดลอก
                </button>
              )}
            </div>
            <div className="p-5">
              {generatedContent ? (
                <div className="space-y-4">
                  <textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                  <div className="flex gap-2">
                    <button className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
                      <Calendar className="w-4 h-4" /> ตั้งเวลา
                    </button>
                    <button className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-opacity shadow-sm">
                      <Send className="w-4 h-4" /> โพสต์เลย
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Sparkles className="w-12 h-12 text-dark-muted/15 mx-auto mb-4" />
                  <p className="text-sm text-dark-muted">กดปุ่ม "สร้าง Content" เพื่อให้ AI เขียนให้</p>
                  <p className="text-xs text-dark-muted/70 mt-1">สามารถแก้ไขก่อนโพสต์ได้</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Image placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-surface-container p-5">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-5 h-5 text-secondary" />
              <h3 className="font-display font-semibold text-dark">สร้างรูปภาพ AI</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">เร็วๆ นี้</span>
            </div>
            <p className="text-xs text-dark-muted">ใช้ Gemini Imagen 3 สร้างรูปสินค้าสวยๆ สำหรับโพสต์</p>
          </div>
        </div>
      </div>
    </div>
  );
}
