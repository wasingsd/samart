"use client";

import { useState } from "react";
import {
  MessageCircle,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Star,
  ChevronDown,
  Bot,
  User,
  ThumbsUp,
  Pencil,
} from "lucide-react";

type FilterType = "all" | "pending" | "approved" | "corrected";

const filters: { id: FilterType; label: string; icon: React.ElementType; count: number }[] = [
  { id: "all", label: "ทั้งหมด", icon: MessageCircle, count: 0 },
  { id: "pending", label: "ต้องตรวจ", icon: AlertTriangle, count: 0 },
  { id: "approved", label: "ถูกต้อง", icon: CheckCircle, count: 0 },
  { id: "corrected", label: "แก้ไขแล้ว", icon: Pencil, count: 0 },
];

export default function ChatLogsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-dark">ประวัติแชทและการเรียนรู้</h1>
        <p className="text-sm text-dark-muted mt-1">
          ตรวจสอบบทสนทนา อนุมัติ / แก้ไข เพื่อสอน AI ให้ตอบดีขึ้น
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-surface-container">
          <p className="text-xs text-dark-muted">บทสนทนาทั้งหมด</p>
          <p className="text-2xl font-display font-bold text-dark mt-1">0</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-surface-container">
          <p className="text-xs text-dark-muted">อนุมัติ</p>
          <p className="text-2xl font-display font-bold text-success mt-1">0</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-surface-container">
          <p className="text-xs text-dark-muted">แก้ไข</p>
          <p className="text-2xl font-display font-bold text-amber mt-1">0</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-surface-container">
          <p className="text-xs text-dark-muted">ตัวอย่างดี</p>
          <p className="text-2xl font-display font-bold text-primary mt-1">0</p>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-surface-container rounded-xl p-1 overflow-x-auto flex-1">
          {filters.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveFilter(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeFilter === id
                  ? "bg-white text-primary shadow-sm"
                  : "text-dark-muted hover:text-dark"
              }`}
            >
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeFilter === id ? "bg-primary/10 text-primary" : "bg-surface-container-high text-dark-muted"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input
            type="text"
            placeholder="ค้นหาบทสนทนา..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl bg-white border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-2xl shadow-sm border border-surface-container p-12 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface-dim flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-10 h-10 text-dark-muted/20" />
        </div>
        <h3 className="text-lg font-display font-semibold text-dark mb-2">ยังไม่มีบทสนทนา</h3>
        <p className="text-sm text-dark-muted mb-2 max-w-md mx-auto">
          เชื่อมต่อ LINE OA เพื่อให้ AI เริ่มตอบลูกค้า บทสนทนาจะแสดงที่นี่ให้ตรวจสอบ
        </p>
        <p className="text-xs text-dark-muted/70 mb-6">
          อนุมัติคำตอบที่ถูกต้อง · แก้ไขคำตอบที่ผิด · บันทึกเป็นตัวอย่าง
        </p>

        {/* Example of what it'll look like */}
        <div className="max-w-sm mx-auto bg-surface-dim rounded-xl p-4 text-left space-y-3 opacity-50">
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-dark-muted" />
            </div>
            <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 text-xs text-dark">
              มีเมนูแนะนำไหมคะ
            </div>
          </div>
          <div className="flex items-start gap-2 justify-end">
            <div className="bg-primary/10 rounded-xl rounded-tr-sm px-3 py-2 text-xs text-dark">
              สวัสดีค่ะ วันนี้แนะนำ...
            </div>
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button className="text-[10px] text-success flex items-center gap-1 px-2 py-1 rounded bg-success/10">
              <ThumbsUp className="w-3 h-3" /> ถูกต้อง
            </button>
            <button className="text-[10px] text-amber flex items-center gap-1 px-2 py-1 rounded bg-amber/10">
              <Pencil className="w-3 h-3" /> แก้ไข
            </button>
            <button className="text-[10px] text-primary flex items-center gap-1 px-2 py-1 rounded bg-primary/10">
              <Star className="w-3 h-3" /> ตัวอย่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
