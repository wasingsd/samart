"use client";

import { useState } from "react";
import {
  FileText,
  Sparkles,
  Image as ImageIcon,
  Calendar,
  Send,
  Facebook,
  MessageCircle,
  Wand2,
  Copy,
  Loader2,
  AlertCircle,
  Check,
  History,
  ChevronDown,
  Download,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useShopStore } from "@/stores/useShopStore";

const postTypes = [
  { value: "promotion", label: "โปรโมชัน" },
  { value: "new-product", label: "สินค้าใหม่" },
  { value: "daily", label: "โพสต์รายวัน" },
  { value: "review", label: "รีวิว" },
  { value: "tips", label: "เกร็ดความรู้" },
] as const;

const tones = [
  { value: "friendly", label: "เป็นกันเอง" },
  { value: "professional", label: "มืออาชีพ" },
  { value: "fun", label: "สนุกสนาน" },
  { value: "luxury", label: "หรูหรา" },
] as const;

type PostType = (typeof postTypes)[number]["value"];
type Tone = (typeof tones)[number]["value"];

export default function ContentPage() {
  const shop = useShopStore((s) => s.shop);
  const shopId = shop?.id || "";

  // Content generation form
  const [postType, setPostType] = useState<PostType>("promotion");
  const [tone, setTone] = useState<Tone>("friendly");
  const [topic, setTopic] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState({ facebook: true, line: false });
  const [copied, setCopied] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  // Image generation form
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // --- Mutations ---
  const generateM = trpc.content.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      setCurrentDraftId(data.id);
      utils.content.listDrafts.invalidate();
    },
  });

  const updateDraftM = trpc.content.updateDraft.useMutation({
    onSuccess: () => {
      utils.content.listDrafts.invalidate();
    },
  });

  const generateImageM = trpc.ai.generateImage.useMutation({
    onSuccess: (data) => {
      if (data?.base64) {
        setGeneratedImage(`data:${data.mimeType};base64,${data.base64}`);
      }
    },
  });

  const enhancePromptM = trpc.ai.enhancePrompt.useMutation({
    onSuccess: (data) => {
      if (data?.prompt) {
        setImagePrompt(data.prompt);
      }
    },
  });

  // --- Queries ---
  const { data: drafts = [] } = trpc.content.listDrafts.useQuery(
    { shopId },
    { enabled: !!shopId && showDrafts }
  );

  // --- Handlers ---
  const handleGenerate = () => {
    if (!shopId || !topic.trim()) return;
    generateM.mutate({
      shopId,
      postType,
      tone,
      topic: topic.trim(),
      platforms,
    });
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = generatedContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePublish = (status: "published" | "scheduled") => {
    if (!shopId || !currentDraftId) return;
    updateDraftM.mutate(
      { shopId, draftId: currentDraftId, content: generatedContent, status },
      {
        onSuccess: () => {
          setGeneratedContent("");
          setCurrentDraftId(null);
          setTopic("");
        },
      }
    );
  };

  const handleGenerateImage = () => {
    if (!shopId || !imagePrompt.trim()) return;
    generateImageM.mutate({ shopId, prompt: imagePrompt.trim() });
  };

  const handleEnhancePrompt = () => {
    if (!topic.trim()) return;
    enhancePromptM.mutate({
      productName: topic,
      productType: postType,
    });
  };

  const loadDraft = (draft: Record<string, unknown>) => {
    setGeneratedContent((draft.generatedContent as string) || "");
    setCurrentDraftId((draft.id as string) || null);
    setPostType(((draft.postType as string) || "promotion") as PostType);
    setTone(((draft.tone as string) || "friendly") as Tone);
    setTopic((draft.topic as string) || "");
    setShowDrafts(false);
  };

  const isGenerating = generateM.isPending;
  const isPublishing = updateDraftM.isPending;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">สร้างโพสต์ AI</h1>
          <p className="text-sm text-gray-500 mt-1">ให้ AI ช่วยเขียน content สำหรับโซเชียลมีเดีย</p>
        </div>
        <button
          onClick={() => setShowDrafts(!showDrafts)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <History className="w-4 h-4" />
          แบบร่างที่บันทึก
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDrafts ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Draft History Panel */}
      {showDrafts && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-display font-semibold text-gray-900">แบบร่างล่าสุด</h3>
          </div>
          {drafts.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">ยังไม่มีแบบร่าง</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {(drafts as Record<string, unknown>[]).map((draft) => (
                <button
                  key={draft.id as string}
                  onClick={() => loadDraft(draft)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {(draft.topic as string) || "ไม่มีหัวข้อ"}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      draft.status === "published"
                        ? "bg-emerald-50 text-emerald-600"
                        : draft.status === "scheduled"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {draft.status === "published" ? "โพสต์แล้ว" : draft.status === "scheduled" ? "ตั้งเวลาแล้ว" : "แบบร่าง"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    {((draft.generatedContent as string) || "").substring(0, 80)}...
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {generateM.isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {generateM.error?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่"}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h3 className="font-display font-semibold text-gray-900 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-[#00B4D8]" />
              ตั้งค่าโพสต์
            </h3>

            {/* Post Type */}
            <div>
              <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">ประเภทโพสต์</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as PostType)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer"
              >
                {postTypes.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-xs font-bold tracking-wider text-gray-500 mb-2 uppercase">น้ำเสียง</label>
              <div className="grid grid-cols-2 gap-2">
                {tones.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTone(value)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      tone === value
                        ? "bg-[#1A237E] text-white shadow-sm"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">หัวข้อ / สินค้า</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="เช่น: กาแฟ Signature ใหม่ ลดพิเศษ 20% วันนี้ - สิ้นเดือน"
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
              />
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-xs font-bold tracking-wider text-gray-500 mb-2 uppercase">แพลตฟอร์ม</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPlatforms((p) => ({ ...p, facebook: !p.facebook }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    platforms.facebook
                      ? "bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/30"
                      : "bg-gray-50 text-gray-500 border border-transparent"
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
                      : "bg-gray-50 text-gray-500 border border-transparent"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  LINE
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim() || !shopId}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  สร้าง Content ด้วย AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                ผลลัพธ์
              </h3>
              {generatedContent && (
                <button
                  onClick={handleCopy}
                  className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      คัดลอก
                    </>
                  )}
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
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePublish("scheduled")}
                      disabled={isPublishing}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-[#1A237E] bg-[#1A237E]/5 hover:bg-[#1A237E]/10 transition-colors disabled:opacity-50"
                    >
                      {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                      ตั้งเวลา
                    </button>
                    <button
                      onClick={() => handlePublish("published")}
                      disabled={isPublishing}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
                    >
                      {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      โพสต์เลย
                    </button>
                  </div>
                  {/* Regenerate */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                    สร้างใหม่
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-12 h-12 text-[#00B4D8] mx-auto mb-4 animate-spin" />
                      <p className="text-sm text-gray-600 font-medium">AI กำลังเขียน content ให้...</p>
                      <p className="text-xs text-gray-400 mt-1">อาจใช้เวลา 10-30 วินาที</p>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">กดปุ่ม &quot;สร้าง Content&quot; เพื่อให้ AI เขียนให้</p>
                      <p className="text-xs text-gray-400 mt-1">สามารถแก้ไขก่อนโพสต์ได้</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Image Generation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-[#00B4D8]" />
              <h3 className="font-display font-semibold text-gray-900">สร้างรูปภาพ AI</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#00B4D8]/10 text-[#00B4D8] font-medium">Imagen 3</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold tracking-wider text-gray-500 uppercase">คำอธิบายรูปภาพ</label>
                  {topic && (
                    <button
                      onClick={handleEnhancePrompt}
                      disabled={enhancePromptM.isPending}
                      className="text-xs text-[#00B4D8] hover:text-[#00B4D8]/80 transition-colors flex items-center gap-1"
                    >
                      {enhancePromptM.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      AI แนะนำ prompt
                    </button>
                  )}
                </div>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="เช่น: กาแฟลาเต้สวยๆ บนโต๊ะไม้ มีแสงธรรมชาติ สไตล์มินิมอล"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                />
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={generateImageM.isPending || !imagePrompt.trim() || !shopId}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#00B4D8] to-[#0096c7] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
              >
                {generateImageM.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังสร้างรูป...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    สร้างรูปภาพ
                  </>
                )}
              </button>

              {generateImageM.isError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {generateImageM.error?.message || "สร้างรูปไม่สำเร็จ"}
                </p>
              )}

              {/* Generated Image Preview */}
              {generatedImage && (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={generatedImage} alt="AI generated" className="w-full aspect-square object-cover" />
                  <div className="absolute bottom-2 right-2 flex gap-1.5">
                    <a
                      href={generatedImage}
                      download
                      className="p-2 rounded-lg bg-white/90 text-gray-600 hover:text-gray-900 shadow-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setGeneratedImage(null)}
                      className="p-2 rounded-lg bg-white/90 text-gray-600 hover:text-red-600 shadow-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
