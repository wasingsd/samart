"use client";

import { useState, useRef } from "react";
import {
  Plus, Search, X, Pencil, Trash2, ToggleLeft, ToggleRight,
  Package, Sparkles, ImageIcon, Loader2, AlertCircle, Upload,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useShopStore } from "@/stores/useShopStore";
import { getBusinessConfig } from "@/lib/businessConfig";
import { uploadImage, validateImageFile } from "@/lib/firebase/upload";

type MenuItem = {
  id: string; name: string; price: number; category: string;
  description: string; imageURL?: string; inStock: boolean;
  tags: string[]; sku?: string; unit?: string; duration?: number;
};

export default function MenuPage() {
  const shop = useShopStore((s) => s.shop);
  const biz = getBusinessConfig(shop?.category || "food");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ทั้งหมด");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState(biz.defaultCategories[0] || "");
  const [formDesc, setFormDesc] = useState("");
  const [formImgURL, setFormImgURL] = useState("");
  const [formImgFile, setFormImgFile] = useState<File | null>(null);
  const [formImgPrev, setFormImgPrev] = useState("");
  const [imgErr, setImgErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const fRef = useRef<HTMLInputElement>(null);
  const [formSku, setFormSku] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formDur, setFormDur] = useState("");

  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.menu.list.useQuery(undefined);
  const createM = trpc.menu.create.useMutation({ onSuccess: () => { utils.menu.list.invalidate(); setModalOpen(false); } });
  const updateM = trpc.menu.update.useMutation({ onSuccess: () => { utils.menu.list.invalidate(); setModalOpen(false); } });
  const deleteM = trpc.menu.delete.useMutation({ onSuccess: () => utils.menu.list.invalidate() });
  const toggleM = trpc.menu.toggleStock.useMutation({ onSuccess: () => utils.menu.list.invalidate() });

  const ti = items as MenuItem[];
  const cats = ["ทั้งหมด", ...new Set(ti.map((i) => i.category).filter(Boolean))];
  const fi = ti.filter((i) => {
    const ms = i.name.toLowerCase().includes(search.toLowerCase());
    const mc = categoryFilter === "ทั้งหมด" || i.category === categoryFilter;
    return ms && mc;
  });
  const gi = fi.reduce<Record<string, MenuItem[]>>((a, i) => {
    const c = i.category || "อื่นๆ"; if (!a[c]) a[c] = []; a[c].push(i); return a;
  }, {});

  const resetImg = () => { setFormImgFile(null); setFormImgPrev(""); setFormImgURL(""); setImgErr(""); };
  const onFile = (f: File) => {
    const e = validateImageFile(f);
    if (e) { setImgErr(e); return; }
    setImgErr(""); setFormImgFile(f);
    const r = new FileReader();
    r.onload = (ev) => setFormImgPrev(ev.target?.result as string);
    r.readAsDataURL(f);
  };

  const openAdd = () => {
    setEditingItem(null); setFormName(""); setFormPrice(""); setFormCategory(biz.defaultCategories[0] || "");
    setFormDesc(""); resetImg(); setFormSku(""); setFormUnit(""); setFormDur(""); setModalOpen(true);
  };
  const openEdit = (item: MenuItem) => {
    setEditingItem(item); setFormName(item.name); setFormPrice(item.price.toString());
    setFormCategory(item.category); setFormDesc(item.description || ""); setFormImgURL(item.imageURL || "");
    setFormImgFile(null); setFormImgPrev(item.imageURL || ""); setImgErr("");
    setFormSku(item.sku || ""); setFormUnit(item.unit || ""); setFormDur(item.duration?.toString() || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formPrice) return;
    setUploading(true);
    try {
      let imageURL = formImgURL || undefined;
      if (formImgFile && shop?.id) {
        const p = `shops/${shop.id}/menu/${Date.now()}_${formImgFile.name}`;
        const res = await uploadImage(formImgFile, p);
        imageURL = res.url;
      }
      const d: Record<string, any> = {
        name: formName, price: parseFloat(formPrice), category: formCategory,
        description: formDesc, tags: [], allergens: [],
        inStock: editingItem ? editingItem.inStock : true, sortOrder: 0,
      };
      if (imageURL) d.imageURL = imageURL;
      if (biz.fields.sku && formSku) d.sku = formSku;
      if (biz.fields.unit && formUnit) d.unit = formUnit;
      if (biz.fields.duration && formDur) d.duration = parseInt(formDur);

      if (editingItem) { updateM.mutate({ id: editingItem.id, data: d }); }
      else { createM.mutate(d); }
    } catch (err: any) { setImgErr(err.message || "อัปโหลดรูปไม่สำเร็จ"); }
    finally { setUploading(false); }
  };

  const saving = createM.isPending || updateM.isPending || uploading;
  const ic = "w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-display font-bold text-gray-900">{biz.itemLabelPlural}</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการ{biz.itemLabel}ที่ AI จะแนะนำลูกค้า ({ti.length} รายการ)</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 transition-all shadow-md">
          <Plus className="w-4 h-4" /> {biz.addItemLabel}
        </button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder={`ค้นหา${biz.itemLabel}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {cats.map((c) => (
            <button key={c} onClick={() => setCategoryFilter(c)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${categoryFilter === c ? "bg-[#1A237E] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
              {c}{c !== "ทั้งหมด" && ` (${ti.filter((i) => i.category === c).length})`}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : ti.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5"><biz.icon className="w-10 h-10 text-gray-300" /></div>
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">ยังไม่มี{biz.itemLabel}</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">เพิ่ม{biz.itemLabel}เพื่อให้ AI แนะนำลูกค้าได้ถูกต้อง และใช้ในระบบ POS</p>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 shadow-md">
            <Plus className="w-4 h-4" /> {biz.addItemLabel}แรก
          </button>
          <div className="mt-8 max-w-sm mx-auto text-left space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-gray-500 bg-gray-50 rounded-lg p-3"><Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" /><span>ใส่รูปและรายละเอียดครบ AI จะแนะนำลูกค้าได้ดีขึ้น</span></div>
            <div className="flex items-start gap-2.5 text-xs text-gray-500 bg-gray-50 rounded-lg p-3"><Package className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" /><span>จัดหมวดหมู่ช่วยให้ค้นหาง่ายและใช้ POS สะดวก</span></div>
          </div>
        </div>
      ) : (
        Object.entries(gi).map(([cat, catItems]) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3"><Package className="w-4 h-4 text-gray-400" /><h3 className="text-sm font-display font-semibold text-gray-800">{cat}</h3><span className="text-xs text-gray-400">({catItems.length})</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {catItems.map((item) => (
                <div key={item.id} className={`group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all ${!item.inStock ? "opacity-60" : ""}`}>
                  <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                    {item.imageURL ? <img src={item.imageURL} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-200" /></div>}
                    {!item.inStock && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><span className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">หมด</span></div>}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-white/90 text-gray-600 hover:text-blue-600 shadow-sm"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteM.mutate({ id: item.id })} className="p-1.5 rounded-lg bg-white/90 text-gray-600 hover:text-red-600 shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>{item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>}</div>
                      <p className="text-sm font-display font-bold text-[#1A237E] whitespace-nowrap">฿{item.price.toLocaleString()}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{item.category}</span>
                      <button onClick={() => toggleM.mutate({ id: item.id })} className={`p-1 rounded-lg transition-colors ${item.inStock ? "text-emerald-500 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"}`}>
                        {item.inStock ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="font-display font-semibold text-gray-900 text-lg">{editingItem ? `แก้ไข${biz.itemLabel}` : biz.addItemLabel}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">รูปภาพ</label>
                <input ref={fRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
                {(formImgPrev || formImgURL) ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50 group">
                    <img src={formImgPrev || formImgURL} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button type="button" onClick={() => fRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-white/90 text-sm font-medium text-gray-700 hover:bg-white">เปลี่ยน</button>
                      <button type="button" onClick={resetImg} className="px-3 py-1.5 rounded-lg bg-red-500/90 text-sm font-medium text-white hover:bg-red-500">ลบ</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fRef.current?.click()} className="w-full py-8 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 bg-gray-50/50 hover:bg-blue-50/30 transition-all flex flex-col items-center gap-2 text-gray-400 hover:text-blue-500">
                    <Upload className="w-6 h-6" />
                    <span className="text-xs font-medium">คลิกเพื่ออัปโหลดรูปภาพ</span>
                    <span className="text-[10px] text-gray-300">PNG, JPEG, WebP ไม่เกิน 2MB</span>
                  </button>
                )}
                {imgErr && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{imgErr}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">ชื่อ{biz.itemLabel} *</label>
                <input autoFocus type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={biz.type === "food" ? "เช่น กาแฟ Signature" : biz.type === "retail" ? "เช่น เสื้อยืด Premium" : "เช่น นวดแผนไทย"} className={ic} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">ราคา (฿) *</label><input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="85" className={ic} /></div>
                <div><label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">หมวดหมู่</label><select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className={`${ic} appearance-none cursor-pointer`}>{biz.defaultCategories.map((c) => (<option key={c} value={c}>{c}</option>))}</select></div>
              </div>
              {(biz.fields.sku || biz.fields.unit || biz.fields.duration) && (
                <div className="grid grid-cols-2 gap-4">
                  {biz.fields.sku && <div><label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">SKU</label><input type="text" value={formSku} onChange={(e) => setFormSku(e.target.value)} placeholder="SKU-001" className={ic} /></div>}
                  {biz.fields.unit && <div><label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">หน่วย</label><input type="text" value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder={biz.unitLabel} className={ic} /></div>}
                  {biz.fields.duration && <div><label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">ระยะเวลา (นาที)</label><input type="number" value={formDur} onChange={(e) => setFormDur(e.target.value)} placeholder="60" className={ic} /></div>}
                </div>
              )}
              <div><label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">คำอธิบาย</label><textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder={`รายละเอียด${biz.itemLabel} (AI จะใช้ข้อมูลนี้แนะนำลูกค้า)`} rows={3} className={`${ic} resize-none`} /></div>
              {(createM.isError || updateM.isError) && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />เกิดข้อผิดพลาด กรุณาลองอีกครั้ง</div>}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100">ยกเลิก</button>
              <button onClick={handleSave} disabled={!formName || !formPrice || saving} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 shadow-sm disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
