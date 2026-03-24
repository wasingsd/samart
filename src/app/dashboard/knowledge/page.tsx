"use client";

import { useState } from "react";
import {
  Brain,
  Plus,
  FileText,
  HelpCircle,
  Clock,
  Tag,
  Shield,
  MessageSquare,
  Upload,
  Sparkles,
  ChevronRight,
  Search,
  Edit3,
  Trash2,
  X,
  Save,
  UploadCloud,
  Loader2,
  Check,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useShopStore } from "@/stores/useShopStore";

// Knowledge type definitions
type KnowledgeType = "menu" | "faq" | "policy" | "promotion" | "about" | "freeform";

const typeConfig: Record<KnowledgeType, { icon: React.ElementType; label: string; color: string; bg: string; description: string }> = {
  menu: { icon: FileText, label: "เมนูสินค้า", color: "text-[#00B4D8]", bg: "bg-[#00B4D8]/10", description: "เมนู ราคา คำอธิบาย ส่วนผสม" },
  faq: { icon: HelpCircle, label: "FAQ", color: "text-[#1A237E]", bg: "bg-[#1A237E]/10", description: "คำถาม-คำตอบที่ลูกค้าถามบ่อย" },
  policy: { icon: Shield, label: "นโยบายร้าน", color: "text-rose-500", bg: "bg-rose-500/10", description: "การจัดส่ง คืนสินค้า วิธีชำระเงิน" },
  promotion: { icon: Tag, label: "โปรโมชัน", color: "text-emerald-500", bg: "bg-emerald-500/10", description: "ส่วนลด โปรพิเศษ คูปอง" },
  about: { icon: Clock, label: "ข้อมูลทั่วไป", color: "text-amber-500", bg: "bg-amber-500/10", description: "เวลาเปิด-ปิด ที่ตั้ง ข้อมูลร้าน" },
  freeform: { icon: MessageSquare, label: "ข้อมูลอื่นๆ", color: "text-gray-500", bg: "bg-gray-100", description: "ข้อมูลอื่นๆ ที่ AI ควรรู้" },
};

export default function KnowledgePage() {
  const shop = useShopStore((s) => s.shop);
  const shopId = shop?.id ?? "";

  // tRPC queries
  const { data: items = [], isLoading } = trpc.knowledge.list.useQuery(
    { shopId },
    { enabled: !!shopId }
  );
  const { data: health } = trpc.knowledge.health.useQuery(
    { shopId },
    { enabled: !!shopId }
  );

  // tRPC mutations
  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.knowledge.list.invalidate({ shopId });
    utils.knowledge.health.invalidate({ shopId });
  };

  const createMutation = trpc.knowledge.create.useMutation({ onSuccess: invalidate });
  const deleteMutation = trpc.knowledge.delete.useMutation({ onSuccess: invalidate });
  const updateMutation = trpc.knowledge.update.useMutation({ onSuccess: invalidate });
  const freeformMutation = trpc.knowledge.addFreeform.useMutation({ onSuccess: invalidate });

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [freeformText, setFreeformText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<KnowledgeType>("faq");
  const [addTitle, setAddTitle] = useState("");
  const [addContent, setAddContent] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Derived data
  const activeItems = (items as Array<{ id: string; type: string; title: string; content: string; isActive: boolean }>).filter((i) => i.isActive);
  const typeCounts = activeItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const completionPercent = health?.completionPercent ?? 0;

  const filteredItems = activeItems.filter(
    (i) => i.title.includes(searchQuery) || i.content.includes(searchQuery)
  );

  const healthColor = completionPercent < 30 ? "#EF4444" : completionPercent < 70 ? "#F59E0B" : "#10B981";
  const healthLabel = completionPercent < 30 ? "ต้องเพิ่มข้อมูล" : completionPercent < 70 ? "กำลังเรียนรู้" : "พร้อมทำงาน";

  // Handlers
  const handleCreate = async () => {
    if (!addTitle || !addContent || !shopId) return;
    await createMutation.mutateAsync({
      shopId,
      data: {
        type: addType,
        title: addTitle,
        content: addContent,
        keywords: [],
        language: "th",
      },
    });
    setShowAddModal(false);
    setAddTitle("");
    setAddContent("");
  };

  const handleDelete = async (docId: string) => {
    if (!shopId) return;
    await deleteMutation.mutateAsync({ shopId, docId });
  };

  const handleStartEdit = (item: { id: string; title: string; content: string }) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !shopId) return;
    await updateMutation.mutateAsync({
      shopId,
      docId: editingId,
      data: { title: editTitle, content: editContent },
    });
    setEditingId(null);
  };

  const handleFreeform = async () => {
    if (!freeformText.trim() || !shopId) return;
    await freeformMutation.mutateAsync({ shopId, content: freeformText });
    setFreeformText("");
  };

  // Loading state
  if (!shopId) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-400">
        <p>กรุณาสร้างร้านก่อนใช้งานศูนย์ความรู้</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">ศูนย์ความรู้ AI</h1>
          <p className="text-sm text-gray-500 mt-1">
            จัดการฐานข้อมูลและความสามารถของ AI ของคุณ
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 transition-opacity shadow-md"
        >
          <Plus className="w-4 h-4" />
          เพิ่มความรู้
        </button>
      </div>

      {/* Knowledge Health Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A237E] to-[#00B4D8] flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-gray-900">ความสมบูรณ์ของ AI Brain</h3>
              <p className="text-xs text-gray-500">{health?.totalDocs ?? 0} เอกสารทั้งหมด</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-display font-bold" style={{ color: healthColor }}>
              {completionPercent}%
            </span>
            <p className="text-xs text-gray-500">{healthLabel}</p>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(completionPercent, 2)}%`, background: healthColor }}
          />
        </div>
        {/* Health breakdown */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
          {(["menu", "faq", "policy", "promotion", "about"] as KnowledgeType[]).map((type) => {
            const cfg = typeConfig[type];
            const Icon = cfg.icon;
            return (
              <div key={type} className="text-center">
                <div className={`w-8 h-8 rounded-lg ${cfg.bg} mx-auto flex items-center justify-center mb-1`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <p className="text-xs font-medium text-gray-700">{typeCounts[type] || 0}</p>
                <p className="text-[10px] text-gray-400">{cfg.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Current Knowledge Base (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-gray-900">ฐานข้อมูลปัจจุบัน</h3>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหา..."
                  className="pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-[#1A237E]/10 focus:border-[#1A237E]/30 transition-all w-48"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-10 text-center">
                <Loader2 className="w-8 h-8 text-gray-300 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-10 text-center">
                <Brain className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h4 className="font-display font-semibold text-gray-400 mb-1">ยังไม่มีข้อมูลใน AI Brain</h4>
                <p className="text-sm text-gray-400 mb-4">
                  เพิ่มข้อมูลร้าน เมนู FAQ เพื่อให้ AI ตอบลูกค้าได้อัตโนมัติ
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#1A237E] bg-[#1A237E]/5 hover:bg-[#1A237E]/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มข้อมูลแรก
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredItems.map((item) => {
                  const cfg = typeConfig[(item.type as KnowledgeType)] || typeConfig.freeform;
                  const Icon = cfg.icon;
                  const isEditing = editingId === item.id;

                  if (isEditing) {
                    return (
                      <div key={item.id} className="px-5 py-4 space-y-3 bg-blue-50/30">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#1A237E]/10"
                        />
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#1A237E]/10 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            disabled={updateMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-[#1A237E] hover:bg-[#1A237E]/90 transition-colors disabled:opacity-50"
                          >
                            {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            บันทึก
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group"
                    >
                      <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{item.content}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Teach AI (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Manual Input */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#00B4D8]" />
              <h3 className="font-display font-semibold text-gray-900">สอน AI เพิ่มเติม</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              พิมพ์อะไรก็ได้ที่อยากให้ AI รู้ ระบบจะจัดหมวดหมู่อัตโนมัติ
            </p>
            <textarea
              value={freeformText}
              onChange={(e) => setFreeformText(e.target.value)}
              placeholder="เช่น: ร้านเราอยู่ถนนนิมมาน ซอย 9 เปิดทุกวัน 8:00-20:00 มีที่จอดรถ มี Wi-Fi ฟรี..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1A237E]/10 focus:border-[#1A237E]/30 transition-all resize-none"
            />
            <button
              disabled={!freeformText.trim() || freeformMutation.isPending}
              onClick={handleFreeform}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {freeformMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {freeformMutation.isPending ? "กำลังบันทึก..." : "บันทึกและจัดหมวดหมู่"}
            </button>
            {freeformMutation.isSuccess && (
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> บันทึกสำเร็จ!
              </p>
            )}
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-5 h-5 text-[#1A237E]" />
              <h3 className="font-display font-semibold text-gray-900">อัปโหลดไฟล์</h3>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#00B4D8]/30 hover:bg-[#00B4D8]/[0.02] transition-colors cursor-pointer group">
              <UploadCloud className="w-10 h-10 text-gray-300 mx-auto mb-3 group-hover:text-[#00B4D8] transition-colors" />
              <p className="text-sm font-medium text-gray-600 mb-1">
                ลากไฟล์มาวางหรือคลิกเพื่อเลือก
              </p>
              <p className="text-xs text-gray-400">
                รองรับ PDF, DOCX, TXT (สูงสุด 20 MB)
              </p>
            </div>
          </div>

          {/* Quick Add Categories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-display font-semibold text-gray-900 mb-3">เพิ่มข้อมูลตามหมวด</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(typeConfig) as KnowledgeType[])
                .filter((t) => t !== "freeform")
                .map((type) => {
                  const cfg = typeConfig[type];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setAddType(type);
                        setShowAddModal(true);
                      }}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-[#1A237E]/20 hover:bg-gray-50 transition-all text-left group"
                    >
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{cfg.label}</p>
                        <p className="text-[10px] text-gray-400">{typeCounts[type] || 0} รายการ</p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Knowledge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-display font-semibold text-gray-900 text-lg">
                เพิ่มความรู้ใหม่
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold tracking-wider text-gray-500 mb-2 uppercase">
                  ประเภท
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(typeConfig) as KnowledgeType[])
                    .filter((t) => t !== "freeform")
                    .map((type) => {
                      const cfg = typeConfig[type];
                      return (
                        <button
                          key={type}
                          onClick={() => setAddType(type)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            addType === type
                              ? "bg-[#1A237E] text-white"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                </div>
              </div>
              {/* Title */}
              <div>
                <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">
                  หัวข้อ
                </label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder={addType === "faq" ? "เช่น: ร้านเปิดกี่โมง?" : "หัวข้อ"}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1A237E]/10 focus:border-[#1A237E]/30 transition-all"
                />
              </div>
              {/* Content */}
              <div>
                <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">
                  เนื้อหา
                </label>
                <textarea
                  value={addContent}
                  onChange={(e) => setAddContent(e.target.value)}
                  placeholder={addType === "faq" ? "เช่น: เราเปิดทุกวัน 8:00-20:00 ครับ" : "รายละเอียด"}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1A237E]/10 focus:border-[#1A237E]/30 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                disabled={!addTitle || !addContent || createMutation.isPending}
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {createMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
