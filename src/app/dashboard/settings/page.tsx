"use client";

import { useState, useEffect } from "react";
import { Store, Sparkles, MessageCircle, CreditCard, Save, TestTube, ExternalLink, ShieldAlert, Plus, X, Loader2, Check, AlertCircle, Pencil } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useShopStore } from "@/stores/useShopStore";

type TabId = "shop" | "ai-style" | "line" | "plan";
const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "shop", label: "ข้อมูลร้าน", icon: Store },
  { id: "ai-style", label: "สไตล์ AI", icon: Sparkles },
  { id: "line", label: "LINE OA", icon: MessageCircle },
  { id: "plan", label: "แพลน", icon: CreditCard },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("shop");
  const shop = useShopStore((s) => s.shop);
  const shopLoading = useShopStore((s) => s.loading);

  if (shopLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-400">กำลังโหลดข้อมูลร้าน...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Store className="w-8 h-8 text-gray-300" />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold text-gray-900">ยังไม่มีข้อมูลร้านค้า</h3>
          <p className="text-sm text-gray-500 mt-1">กรุณาตั้งค่าร้านค้าก่อนใช้งาน</p>
        </div>
        <a href="/onboarding" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 transition-all shadow-md">
          ตั้งค่าร้านค้า →
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-dark">ตั้งค่า</h1>
        <p className="text-sm text-dark-muted mt-1">จัดการข้อมูลร้าน สไตล์ AI และการเชื่อมต่อ</p>
      </div>
      <div className="flex gap-1 bg-surface-container rounded-xl p-1 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${activeTab === id ? "bg-white text-primary shadow-sm" : "text-dark-muted hover:text-dark"}`}>
            <Icon className="w-4 h-4" /><span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-surface-container">
        {activeTab === "shop" && <ShopInfoTab shopId={shop.id} shop={shop} />}
        {activeTab === "ai-style" && <AIStyleTab shopId={shop.id} shop={shop} />}
        {activeTab === "line" && <LineOATab shopId={shop.id} shop={shop} />}
        {activeTab === "plan" && <PlanTab shop={shop} />}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ShopInfoTab({ shopId, shop }: { shopId: string; shop: any }) {
  const [name, setName] = useState(shop.name || "");
  const [category, setCategory] = useState(shop.category || "food");
  const [phone, setPhone] = useState(shop.phone || "");
  const [address, setAddress] = useState(shop.address || "");

  const utils = trpc.useUtils();
  const updateMutation = trpc.shop.update.useMutation({
    onSuccess: () => { utils.shop.getByOwner.invalidate(); }
  });
  const setShop = useShopStore((s) => s.setShop);

  const handleSave = async () => {
    await updateMutation.mutateAsync({ name, category, phone, address });
    setShop({ ...shop, name, category, phone, address });
  };

  return (
    <div className="p-6 space-y-6">
      <div><h3 className="font-display font-semibold text-dark mb-1">ข้อมูลร้านค้า</h3><p className="text-xs text-dark-muted">ข้อมูลพื้นฐานที่ AI ใช้ตอบลูกค้า</p></div>
      <div className="space-y-4">
        <div><label className="block text-xs font-bold tracking-wider text-dark-muted mb-1.5 uppercase">ชื่อร้าน</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อร้าน" className="w-full px-4 py-2.5 rounded-xl bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-bold tracking-wider text-dark-muted mb-1.5 uppercase">ประเภทธุรกิจ</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"><option value="food">ร้านอาหาร / เครื่องดื่ม</option><option value="retail">ร้านค้า / ค้าปลีก</option><option value="service">ธุรกิจบริการ</option></select></div>
          <div><label className="block text-xs font-bold tracking-wider text-dark-muted mb-1.5 uppercase">เบอร์โทร</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08X-XXX-XXXX" className="w-full px-4 py-2.5 rounded-xl bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div>
        </div>
        <div><label className="block text-xs font-bold tracking-wider text-dark-muted mb-1.5 uppercase">ที่อยู่</label><textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ที่อยู่ร้าน" rows={3} className="w-full px-4 py-2.5 rounded-xl bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" /></div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        {updateMutation.isSuccess && <span className="text-xs text-emerald-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" />บันทึกแล้ว</span>}
        {updateMutation.isError && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />เกิดข้อผิดพลาด</span>}
        <button onClick={handleSave} disabled={updateMutation.isPending} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50">
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึก
        </button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AIStyleTab({ shopId, shop }: { shopId: string; shop: any }) {
  const style = shop.styleProfile || {};
  const [botName, setBotName] = useState(style.botName || "น้องมะลิ");
  const [formality, setFormality] = useState(style.formalityLevel ?? 50);
  const [emoji, setEmoji] = useState<"none" | "some" | "lots">(style.emojiUsage || "some");
  const [replyLength, setReplyLength] = useState<"short" | "medium" | "long">(style.replyLength || "medium");
  const [language, setLanguage] = useState<"thai" | "mixed" | "english">(style.language || "thai");
  const [openingGreeting, setOpeningGreeting] = useState(style.openingGreeting || "สวัสดีค่ะ");
  const [closingPhrase, setClosingPhrase] = useState(style.closingPhrase || "ขอบคุณมากนะคะ");
  const [guardrails, setGuardrails] = useState<string[]>(style.guardrails || ["ห้ามบอกราคาต้นทุน"]);
  const [newGuardrail, setNewGuardrail] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [previewReply, setPreviewReply] = useState("");

  const updateStyleMutation = trpc.shop.updateStyle.useMutation();
  const previewMutation = trpc.ai.previewAI.useMutation();
  const setShop = useShopStore((s) => s.setShop);

  const addGuardrail = () => { if (newGuardrail.trim()) { setGuardrails([...guardrails, newGuardrail.trim()]); setNewGuardrail(""); } };
  const removeGuardrail = (i: number) => setGuardrails(guardrails.filter((_, idx) => idx !== i));

  const handleSaveStyle = async () => {
    const styleData = {
      botName,
      formalityLevel: formality,
      emojiUsage: emoji,
      replyLength,
      language,
      openingGreeting,
      closingPhrase,
      guardrails,
    };
    await updateStyleMutation.mutateAsync(styleData);
    setShop({ ...shop, styleProfile: styleData });
  };

  const handleTestAI = async () => {
    if (!testMessage.trim()) return;
    const result = await previewMutation.mutateAsync({ shopId, question: testMessage });
    setPreviewReply(result.reply);
  };

  return (
    <div className="p-6 space-y-6">
      <div><h3 className="font-display font-semibold text-dark mb-1">ปรับแต่งสไตล์ AI</h3><p className="text-xs text-dark-muted">ตั้งค่าบุคลิก น้ำเสียง และข้อจำกัดของ AI</p></div>
      <div className="space-y-5">
        <div><label className="block text-xs font-bold tracking-wider text-dark-muted mb-1.5 uppercase">ชื่อ Bot</label><input type="text" value={botName} onChange={(e) => setBotName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-dark-muted mb-3 uppercase">ระดับทางการ</label>
          <div className="flex items-center gap-4"><span className="text-xs text-dark-muted">ทางการ</span><input type="range" min={0} max={100} value={formality} onChange={(e) => setFormality(parseInt(e.target.value))} className="flex-1 h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary" /><span className="text-xs text-dark-muted">เป็นกันเอง</span></div>
        </div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-dark-muted mb-2 uppercase">Emoji</label>
          <div className="flex gap-2">{(["none", "some", "lots"] as const).map((opt) => (<button key={opt} onClick={() => setEmoji(opt)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${emoji === opt ? "bg-primary text-white shadow-sm" : "bg-surface-dim text-dark-muted hover:bg-surface-container"}`}>{opt === "none" ? "ไม่ใช้" : opt === "some" ? "บ้าง" : "เยอะ"}</button>))}</div>
        </div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-dark-muted mb-2 uppercase">ความยาว</label>
          <div className="flex gap-2">{(["short", "medium", "long"] as const).map((opt) => (<button key={opt} onClick={() => setReplyLength(opt)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${replyLength === opt ? "bg-primary text-white shadow-sm" : "bg-surface-dim text-dark-muted hover:bg-surface-container"}`}>{opt === "short" ? "สั้น" : opt === "medium" ? "กลาง" : "ละเอียด"}</button>))}</div>
        </div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-dark-muted mb-2 uppercase">ภาษา</label>
          <div className="flex gap-2">{(["thai", "mixed", "english"] as const).map((opt) => (<button key={opt} onClick={() => setLanguage(opt)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${language === opt ? "bg-primary text-white shadow-sm" : "bg-surface-dim text-dark-muted hover:bg-surface-container"}`}>{opt === "thai" ? "ไทย" : opt === "mixed" ? "ผสม" : "English"}</button>))}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-bold tracking-wider text-dark-muted mb-1.5 uppercase">คำทักทาย</label><input type="text" value={openingGreeting} onChange={(e) => setOpeningGreeting(e.target.value)} placeholder="สวัสดีค่ะ" className="w-full px-4 py-2.5 rounded-xl bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div>
          <div><label className="block text-xs font-bold tracking-wider text-dark-muted mb-1.5 uppercase">คำปิดท้าย</label><input type="text" value={closingPhrase} onChange={(e) => setClosingPhrase(e.target.value)} placeholder="ขอบคุณมากนะคะ" className="w-full px-4 py-2.5 rounded-xl bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div>
        </div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-dark-muted mb-2 uppercase"><ShieldAlert className="inline w-3.5 h-3.5 mr-1" />สิ่งที่ AI ห้ามพูด</label>
          <div className="space-y-2 mb-2">{guardrails.map((g, i) => (<div key={i} className="flex items-center gap-2 px-3 py-2 bg-surface-dim rounded-lg text-sm text-dark"><span className="flex-1">{g}</span><button onClick={() => removeGuardrail(i)} className="text-dark-muted hover:text-danger transition-colors"><X className="w-4 h-4" /></button></div>))}</div>
          <div className="flex gap-2"><input type="text" value={newGuardrail} onChange={(e) => setNewGuardrail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGuardrail()} placeholder="เช่น ห้ามพูดถึงคู่แข่ง" className="flex-1 px-4 py-2 rounded-lg bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 transition-all" /><button onClick={addGuardrail} className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-dark-muted"><Plus className="w-4 h-4" /></button></div>
        </div>

        {/* AI Preview */}
        <div className="border-t border-surface-container pt-5">
          <label className="block text-xs font-bold tracking-wider text-dark-muted mb-2 uppercase">ทดสอบ AI</label>
          <div className="flex gap-2">
            <input type="text" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleTestAI()} placeholder="ลองถาม: มีอะไรบ้าง" className="flex-1 px-4 py-2 rounded-lg bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            <button onClick={handleTestAI} disabled={previewMutation.isPending || !testMessage.trim()} className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50">
              {previewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "ส่ง"}
            </button>
          </div>
          <div className="mt-3 p-4 bg-surface-dim rounded-xl text-sm text-dark-muted">
            {previewMutation.isPending ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />AI กำลังคิดคำตอบ...</span>
            ) : previewReply ? (
              <span className="text-dark not-italic">{previewReply}</span>
            ) : previewMutation.isError ? (
              <span className="text-red-500">เกิดข้อผิดพลาด — ตรวจสอบว่า Gemini API Key ถูกต้อง</span>
            ) : (
              <span className="italic">พิมพ์คำถามแล้วกด &quot;ส่ง&quot; เพื่อดูว่า AI จะตอบอย่างไร</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        {updateStyleMutation.isSuccess && <span className="text-xs text-emerald-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" />บันทึกสไตล์แล้ว</span>}
        <button onClick={handleSaveStyle} disabled={updateStyleMutation.isPending} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50">
          {updateStyleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึกสไตล์
        </button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LineOATab({ shopId, shop }: { shopId: string; shop: any }) {
  const [channelId, setChannelId] = useState(shop.lineChannelId || "");
  const [channelSecret, setChannelSecret] = useState(shop.lineChannelSecret || "");
  const [accessToken, setAccessToken] = useState(shop.lineAccessToken || "");
  const connected = shop.lineConnected || false;
  const [editing, setEditing] = useState(!connected);

  const utils = trpc.useUtils();
  const connectMutation = trpc.shop.connectLine.useMutation({
    onSuccess: () => {
      utils.shop.getByOwner.invalidate();
      setEditing(false);
    }
  });
  const setShop = useShopStore((s) => s.setShop);

  const handleConnect = async () => {
    await connectMutation.mutateAsync({
      lineChannelId: channelId,
      lineChannelSecret: channelSecret,
      lineAccessToken: accessToken,
    });
    setShop({ ...shop, lineChannelId: channelId, lineChannelSecret: channelSecret, lineAccessToken: accessToken, lineConnected: true });
  };

  const handleEdit = () => setEditing(true);
  const handleCancelEdit = () => {
    setChannelId(shop.lineChannelId || "");
    setChannelSecret(shop.lineChannelSecret || "");
    setAccessToken(shop.lineAccessToken || "");
    setEditing(false);
  };

  // Mask value for read-only display
  const maskValue = (val: string) => val ? "•".repeat(Math.min(val.length, 20)) : "—";

  const inputBaseClass = "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all font-mono";
  const editableClass = `${inputBaseClass} bg-surface-dim border border-surface-container-high text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary`;
  const readOnlyClass = `${inputBaseClass} bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-dark mb-1">เชื่อมต่อ LINE OA</h3>
          <p className="text-xs text-dark-muted">เชื่อม LINE Official Account เพื่อให้ AI ตอบแชทอัตโนมัติ</p>
        </div>
        {connected && !editing && (
          <button onClick={handleEdit} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/5 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> แก้ไข
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold tracking-wider text-dark-muted mb-1.5 uppercase">Channel ID</label>
          {editing ? (
            <input type="text" value={channelId} onChange={(e) => setChannelId(e.target.value)} placeholder="Channel ID" className={editableClass} />
          ) : (
            <div className={readOnlyClass}>{channelId || "—"}</div>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold tracking-wider text-dark-muted mb-1.5 uppercase">Channel Secret</label>
          {editing ? (
            <input type="password" value={channelSecret} onChange={(e) => setChannelSecret(e.target.value)} placeholder="Channel Secret" className={editableClass} />
          ) : (
            <div className={readOnlyClass}>{maskValue(channelSecret)}</div>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold tracking-wider text-dark-muted mb-1.5 uppercase">Access Token</label>
          {editing ? (
            <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="Long-lived Access Token" className={editableClass} />
          ) : (
            <div className={readOnlyClass}>{maskValue(accessToken)}</div>
          )}
        </div>
      </div>

      <div className="p-4 bg-surface-dim rounded-xl flex items-start gap-3">
        <ExternalLink className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
        <div><p className="text-sm font-medium text-dark">วิธีหา credentials</p><p className="text-xs text-dark-muted mt-1">ไปที่ <a href="https://developers.line.biz" target="_blank" rel="noopener" className="text-secondary underline">LINE Developers Console</a> → เลือก Provider → เลือก Channel</p></div>
      </div>

      {connected && <div className="p-4 bg-success/10 rounded-xl flex items-center gap-3"><div className="w-3 h-3 bg-success rounded-full animate-pulse" /><span className="text-sm font-medium text-success">เชื่อมต่อสำเร็จ</span></div>}
      {connectMutation.isSuccess && <div className="p-4 bg-success/10 rounded-xl flex items-center gap-3"><Check className="w-4 h-4 text-success" /><span className="text-sm font-medium text-success">บันทึกสำเร็จ!</span></div>}
      {connectMutation.isError && <div className="p-4 bg-red-50 rounded-xl flex items-center gap-3"><AlertCircle className="w-4 h-4 text-red-500" /><span className="text-sm font-medium text-red-600">เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบ credentials</span></div>}

      {editing && (
        <div className="flex items-center gap-3">
          <button onClick={handleConnect} disabled={connectMutation.isPending || !channelId || !channelSecret || !accessToken} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50">
            {connectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {connected ? "อัปเดต" : "เชื่อมต่อ"}
          </button>
          {connected && (
            <button onClick={handleCancelEdit} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
              ยกเลิก
            </button>
          )}
        </div>
      )}

      {!editing && connected && (
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-secondary border border-secondary/30 hover:bg-secondary/5 transition-colors"><TestTube className="w-4 h-4" />ทดสอบ</button>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PlanTab({ shop }: { shop: any }) {
  const plans = [
    { name: "Starter", price: "1,490", features: ["Chat Brain", "Insight Dashboard", "1,000 msg/เดือน"], popular: false },
    { name: "Pro", price: "2,490", features: ["+ Content Brain", "+ Sales Brain", "+ Customer Memory", "ไม่จำกัด msg"], popular: true },
    { name: "Business", price: "3,490", features: ["+ Multi-branch", "+ Staff accounts", "+ API", "+ Custom AI Training"], popular: false },
  ];
  const currentPlan = shop.plan || "trial";
  return (
    <div className="p-6 space-y-6">
      <div><h3 className="font-display font-semibold text-dark mb-1">แพลนปัจจุบัน</h3><p className="text-xs text-dark-muted">คุณกำลังใช้แพลน <span className="text-primary font-semibold">{currentPlan === "trial" ? "ทดลองใช้ฟรี" : currentPlan}</span></p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative rounded-xl border-2 p-5 transition-all ${plan.popular ? "border-primary shadow-md" : "border-surface-container-high hover:border-primary/30"}`}>
            {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-0.5 rounded-full font-semibold">แนะนำ</span>}
            <div className="text-center mb-4">
              <h4 className="font-display font-bold text-dark mt-2">{plan.name}</h4>
              <p className="text-2xl font-display font-bold text-primary mt-1">฿{plan.price}<span className="text-xs text-dark-muted font-normal">/เดือน</span></p>
            </div>
            <ul className="space-y-2 text-xs text-dark-muted">{plan.features.map((f) => (<li key={f} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />{f}</li>))}</ul>
            <button className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-all ${plan.popular ? "gradient-primary text-white shadow-sm hover:opacity-90" : "bg-surface-dim text-dark hover:bg-surface-container"}`}>เลือกแพลน</button>
          </div>
        ))}
      </div>
    </div>
  );
}
