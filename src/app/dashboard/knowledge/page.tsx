"use client";

import { useState } from "react";
import {
  Brain, Plus, HelpCircle, Clock, Tag, Shield, MessageSquare,
  Upload, Sparkles, ChevronRight, Search, Edit3, Trash2, X,
  Save, UploadCloud, Loader2, Check, CalendarDays, Info,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useShopStore } from "@/stores/useShopStore";

// Knowledge types — ไม่มี "menu" เพราะข้อมูลมาจากระบบเมนู/สินค้า/บริการแล้ว
type KnowledgeType = "faq" | "policy" | "promotion" | "about" | "freeform";

const typeConfig: Record<KnowledgeType, { icon: React.ElementType; label: string; color: string; bg: string; description: string }> = {
  faq: { icon: HelpCircle, label: "FAQ", color: "text-[#1A237E]", bg: "bg-[#1A237E]/10", description: "คำถาม-คำตอบที่ลูกค้าถามบ่อย" },
  policy: { icon: Shield, label: "นโยบายร้าน", color: "text-rose-500", bg: "bg-rose-500/10", description: "การจัดส่ง คืนสินค้า วิธีชำระเงิน" },
  promotion: { icon: Tag, label: "โปรโมชัน", color: "text-emerald-500", bg: "bg-emerald-500/10", description: "ส่วนลด โปรพิเศษ คูปอง" },
  about: { icon: Clock, label: "ข้อมูลทั่วไป", color: "text-amber-500", bg: "bg-amber-500/10", description: "เวลาเปิด-ปิด ที่ตั้ง ข้อมูลร้าน" },
  freeform: { icon: MessageSquare, label: "ข้อมูลอื่นๆ", color: "text-gray-500", bg: "bg-gray-100", description: "ข้อมูลอื่นๆ ที่ AI ควรรู้" },
};

// Field config per type
const typeFields: Record<KnowledgeType, { titleLabel: string; titlePlaceholder: string; contentLabel: string; contentPlaceholder: string; extraFields?: { key: string; label: string; placeholder: string; type: "text" | "date" }[] }> = {
  faq: {
    titleLabel: "คำถามลูกค้า",
    titlePlaceholder: "เช่น ร้านเปิดกี่โมง?, มีบริการจัดส่งไหม?",
    contentLabel: "คำตอบ",
    contentPlaceholder: "เช่น ร้านเราเปิดทุกวัน 8:00-20:00 ครับ",
  },
  policy: {
    titleLabel: "ชื่อนโยบาย",
    titlePlaceholder: "เช่น นโยบายการคืนสินค้า, วิธีชำระเงิน",
    contentLabel: "รายละเอียดนโยบาย",
    contentPlaceholder: "เช่น รับคืนภายใน 7 วัน สินค้าต้องอยู่ในสภาพเดิม พร้อมใบเสร็จ",
    extraFields: [
      { key: "conditions", label: "เงื่อนไขเพิ่มเติม", placeholder: "เช่น ไม่รับคืนสินค้าลดราคา, ต้องมีกล่องสินค้า", type: "text" },
    ],
  },
  promotion: {
    titleLabel: "ชื่อโปรโมชัน",
    titlePlaceholder: "เช่น ลด 20% เปิดร้านใหม่, ซื้อ 2 แถม 1",
    contentLabel: "รายละเอียด / เงื่อนไข",
    contentPlaceholder: "เช่น ลด 20% ทุกรายการ สำหรับลูกค้าใหม่ ใช้โค้ด WELCOME20",
    extraFields: [
      { key: "validFrom", label: "เริ่ม", placeholder: "วันที่เริ่ม", type: "date" },
      { key: "validUntil", label: "สิ้นสุด", placeholder: "วันที่สิ้นสุด", type: "date" },
      { key: "code", label: "โค้ดส่วนลด (ถ้ามี)", placeholder: "เช่น WELCOME20", type: "text" },
    ],
  },
  about: {
    titleLabel: "หัวข้อ",
    titlePlaceholder: "เช่น เวลาเปิด-ปิด, ที่ตั้งร้าน, วิธีเดินทาง",
    contentLabel: "รายละเอียด",
    contentPlaceholder: "เช่น ร้านอยู่ถนนนิมมาน ซอย 9 ใกล้ Maya มีที่จอดรถฟรี",
  },
  freeform: {
    titleLabel: "หัวข้อ",
    titlePlaceholder: "หัวข้อข้อมูล",
    contentLabel: "เนื้อหา",
    contentPlaceholder: "ข้อมูลอื่นๆ ที่ต้องการให้ AI รู้",
  },
};

export default function KnowledgePage() {
  const shop = useShopStore((s) => s.shop);
  const shopId = shop?.id ?? "";

  const { data: items = [], isLoading } = trpc.knowledge.list.useQuery({ shopId }, { enabled: !!shopId });
  const { data: health } = trpc.knowledge.health.useQuery({ shopId }, { enabled: !!shopId });

  const utils = trpc.useUtils();
  const inv = () => { utils.knowledge.list.invalidate({ shopId }); utils.knowledge.health.invalidate({ shopId }); };

  const createM = trpc.knowledge.create.useMutation({ onSuccess: inv });
  const deleteM = trpc.knowledge.delete.useMutation({ onSuccess: inv });
  const updateM = trpc.knowledge.update.useMutation({ onSuccess: inv });
  const freeformM = trpc.knowledge.addFreeform.useMutation({ onSuccess: inv });

  const [searchQ, setSearchQ] = useState("");
  const [freeText, setFreeText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [addType, setAddType] = useState<KnowledgeType>("faq");
  const [addTitle, setAddTitle] = useState("");
  const [addContent, setAddContent] = useState("");
  const [addExtras, setAddExtras] = useState<Record<string, string>>({});

  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const ai = (items as Array<{ id: string; type: string; title: string; content: string; isActive: boolean }>).filter((i) => i.isActive);
  const tc = ai.reduce((a, i) => { a[i.type] = (a[i.type] || 0) + 1; return a; }, {} as Record<string, number>);
  const cp = health?.completionPercent ?? 0;
  const fi = ai.filter((i) => i.title.includes(searchQ) || i.content.includes(searchQ));
  const hc = cp < 30 ? "#EF4444" : cp < 70 ? "#F59E0B" : "#10B981";
  const hl = cp < 30 ? "ต้องเพิ่มข้อมูล" : cp < 70 ? "กำลังเรียนรู้" : "พร้อมทำงาน";

  const openModal = (type: KnowledgeType) => { setAddType(type); setAddTitle(""); setAddContent(""); setAddExtras({}); setShowModal(true); };

  const handleCreate = async () => {
    if (!addTitle || !addContent || !shopId) return;
    // Build content with extra fields appended
    let fullContent = addContent;
    const fields = typeFields[addType];
    if (fields.extraFields) {
      const extras = fields.extraFields.map((f) => addExtras[f.key] ? `${f.label}: ${addExtras[f.key]}` : "").filter(Boolean);
      if (extras.length) fullContent += "\n\n" + extras.join("\n");
    }
    await createM.mutateAsync({ shopId, data: { type: addType, title: addTitle, content: fullContent, keywords: [], language: "th" } });
    setShowModal(false);
  };

  const handleDelete = async (id: string) => { if (shopId) await deleteM.mutateAsync({ shopId, docId: id }); };
  const startEdit = (i: { id: string; title: string; content: string }) => { setEditId(i.id); setEditTitle(i.title); setEditContent(i.content); };
  const saveEdit = async () => { if (!editId || !shopId) return; await updateM.mutateAsync({ shopId, docId: editId, data: { title: editTitle, content: editContent } }); setEditId(null); };
  const handleFreeform = async () => { if (!freeText.trim() || !shopId) return; await freeformM.mutateAsync({ shopId, content: freeText }); setFreeText(""); };

  const ic = "w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1A237E]/10 focus:border-[#1A237E]/30 transition-all";

  if (!shopId) return <div className="flex items-center justify-center min-h-[400px] text-gray-400"><p>กรุณาสร้างร้านก่อนใช้งานศูนย์ความรู้</p></div>;

  const mainTypes: KnowledgeType[] = ["faq", "policy", "promotion", "about"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">ศูนย์ความรู้ AI</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการฐานข้อมูลที่ AI ใช้ตอบลูกค้า (ข้อมูลสินค้า/เมนู/บริการ ดึงจากระบบอัตโนมัติ)</p>
        </div>
        <button onClick={() => openModal("faq")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 shadow-md">
          <Plus className="w-4 h-4" /> เพิ่มความรู้
        </button>
      </div>

      {/* Health Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A237E] to-[#00B4D8] flex items-center justify-center"><Brain className="w-5 h-5 text-white" /></div>
            <div><h3 className="font-display font-semibold text-gray-900">ความสมบูรณ์ของ AI Brain</h3><p className="text-xs text-gray-500">{health?.totalDocs ?? 0} เอกสาร + ข้อมูลสินค้าจากระบบเมนู</p></div>
          </div>
          <div className="text-right"><span className="text-2xl font-display font-bold" style={{ color: hc }}>{cp}%</span><p className="text-xs text-gray-500">{hl}</p></div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${Math.max(cp, 2)}%`, background: hc }} /></div>
        <div className="grid grid-cols-4 gap-3 mt-4">
          {mainTypes.map((type) => { const cfg = typeConfig[type]; const I = cfg.icon; return (
            <div key={type} className="text-center">
              <div className={`w-8 h-8 rounded-lg ${cfg.bg} mx-auto flex items-center justify-center mb-1`}><I className={`w-4 h-4 ${cfg.color}`} /></div>
              <p className="text-xs font-medium text-gray-700">{tc[type] || 0}</p>
              <p className="text-[10px] text-gray-400">{cfg.label}</p>
            </div>
          ); })}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Knowledge List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-gray-900">ฐานข้อมูลปัจจุบัน</h3>
              <div className="relative"><Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="ค้นหา..." className="pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-[#1A237E]/10 w-48" /></div>
            </div>
            {isLoading ? (
              <div className="p-10 text-center"><Loader2 className="w-8 h-8 text-gray-300 mx-auto mb-3 animate-spin" /><p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p></div>
            ) : fi.length === 0 ? (
              <div className="p-10 text-center">
                <Brain className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h4 className="font-display font-semibold text-gray-400 mb-1">ยังไม่มีข้อมูลใน AI Brain</h4>
                <p className="text-sm text-gray-400 mb-1">ข้อมูลเมนู/สินค้า/บริการ ดึงอัตโนมัติจากระบบจัดการสินค้า</p>
                <p className="text-sm text-gray-400 mb-4">เพิ่ม FAQ, นโยบาย, โปรโมชัน เพื่อให้ AI ตอบลูกค้าได้ดีขึ้น</p>
                <button onClick={() => openModal("faq")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#1A237E] bg-[#1A237E]/5 hover:bg-[#1A237E]/10"><Plus className="w-4 h-4" />เพิ่มข้อมูลแรก</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {fi.map((item) => {
                  const cfg = typeConfig[(item.type as KnowledgeType)] || typeConfig.freeform;
                  const I = cfg.icon;
                  if (editId === item.id) return (
                    <div key={item.id} className="px-5 py-4 space-y-3 bg-blue-50/30">
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={ic} />
                      <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} className={`${ic} resize-none`} />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100">ยกเลิก</button>
                        <button onClick={saveEdit} disabled={updateM.isPending} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-[#1A237E] hover:bg-[#1A237E]/90 disabled:opacity-50">
                          {updateM.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} บันทึก
                        </button>
                      </div>
                    </div>
                  );
                  return (
                    <div key={item.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group">
                      <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}><I className={`w-4 h-4 ${cfg.color}`} /></div>
                      <div className="flex-1 min-w-0"><h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4><p className="text-xs text-gray-400 truncate mt-0.5">{item.content}</p></div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(item.id)} disabled={deleteM.isPending} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Teach AI */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-[#00B4D8]" /><h3 className="font-display font-semibold text-gray-900">สอน AI เพิ่มเติม</h3></div>
            <p className="text-xs text-gray-500 mb-3">พิมพ์อะไรก็ได้ที่อยากให้ AI รู้ ระบบจะจัดหมวดหมู่อัตโนมัติ</p>
            <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="เช่น: ร้านเราอยู่ถนนนิมมาน ซอย 9 เปิดทุกวัน 8:00-20:00 มีที่จอดรถ Wi-Fi ฟรี..." rows={5} className={`${ic} resize-none`} />
            <button disabled={!freeText.trim() || freeformM.isPending} onClick={handleFreeform} className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 shadow-sm disabled:opacity-40">
              {freeformM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {freeformM.isPending ? "กำลังบันทึก..." : "บันทึกและจัดหมวดหมู่"}
            </button>
            {freeformM.isSuccess && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> บันทึกสำเร็จ!</p>}
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3"><Upload className="w-5 h-5 text-[#1A237E]" /><h3 className="font-display font-semibold text-gray-900">อัปโหลดไฟล์</h3></div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#00B4D8]/30 hover:bg-[#00B4D8]/[0.02] transition-colors cursor-pointer group">
              <UploadCloud className="w-10 h-10 text-gray-300 mx-auto mb-3 group-hover:text-[#00B4D8]" />
              <p className="text-sm font-medium text-gray-600 mb-1">ลากไฟล์มาวางหรือคลิกเพื่อเลือก</p>
              <p className="text-xs text-gray-400">รองรับ PDF, DOCX, TXT (สูงสุด 20 MB)</p>
            </div>
          </div>

          {/* Quick Add */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-display font-semibold text-gray-900 mb-3">เพิ่มข้อมูลตามหมวด</h3>
            <div className="grid grid-cols-2 gap-2">
              {mainTypes.map((type) => { const cfg = typeConfig[type]; const I = cfg.icon; return (
                <button key={type} onClick={() => openModal(type)} className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-[#1A237E]/20 hover:bg-gray-50 transition-all text-left group">
                  <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}><I className={`w-4 h-4 ${cfg.color}`} /></div>
                  <div><p className="text-sm font-medium text-gray-700">{cfg.label}</p><p className="text-[10px] text-gray-400">{tc[type] || 0} รายการ</p></div>
                </button>
              ); })}
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-600">ข้อมูลสินค้า/เมนู/บริการ ดึงจากระบบจัดการสินค้าอัตโนมัติ ไม่ต้องเพิ่มที่นี่</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (() => {
        const tf = typeFields[addType];
        return (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <h3 className="font-display font-semibold text-gray-900 text-lg">เพิ่มความรู้ใหม่</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                {/* Type chips */}
                <div>
                  <label className="block text-xs font-bold tracking-wider text-gray-500 mb-2 uppercase">ประเภท</label>
                  <div className="flex flex-wrap gap-2">
                    {mainTypes.map((t) => (
                      <button key={t} onClick={() => { setAddType(t); setAddExtras({}); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${addType === t ? "bg-[#1A237E] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                        {typeConfig[t].label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Title field */}
                <div>
                  <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">{tf.titleLabel}</label>
                  <input type="text" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} placeholder={tf.titlePlaceholder} className={ic} />
                </div>
                {/* Content field */}
                <div>
                  <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">{tf.contentLabel}</label>
                  <textarea value={addContent} onChange={(e) => setAddContent(e.target.value)} placeholder={tf.contentPlaceholder} rows={4} className={`${ic} resize-none`} />
                </div>
                {/* Extra fields */}
                {tf.extraFields && tf.extraFields.map((ef) => (
                  <div key={ef.key}>
                    <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">{ef.label}</label>
                    <input type={ef.type} value={addExtras[ef.key] || ""} onChange={(e) => setAddExtras({ ...addExtras, [ef.key]: e.target.value })} placeholder={ef.placeholder} className={ic} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 p-5 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
                <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                <button disabled={!addTitle || !addContent || createM.isPending} onClick={handleCreate} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 shadow-sm disabled:opacity-40">
                  {createM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {createM.isPending ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
