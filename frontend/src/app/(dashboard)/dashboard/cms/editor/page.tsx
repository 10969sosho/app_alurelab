"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  Monitor,
  Smartphone,
  Upload,
} from "lucide-react";
import api from "@/lib/api";
import type { CmsSettings, CmsHero, CmsBranding, CmsHighlights } from "@/components/templates/types";

type Viewport = "desktop" | "mobile";
type SectionKey =
  | "announcement"
  | "header"
  | "hero"
  | "featured"
  | "about"
  | "footer"
  | "style";

const DEFAULT_CMS: CmsSettings = {
  template: "editorial",
  branding: {
    storeName: "ALURELAB STORE",
    tagline: "Koleksi Pilihan Berkualitas",
    fontHeading: "bebas",
    fontBody: "inter",
    primaryColor: "#111111",
    backgroundColor: "#F5F5F3",
    textColor: "#111111",
    accentColor: "#C8FF3D",
  },
  hero: {
    headline: "ALURELAB",
    description:
      "Koleksi pilihan berkualitas dengan pengiriman cepat dan pembayaran aman.",
    bannerImage:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80",
    ctaText: "BELANJA SEKARANG",
    ctaLink: "/shop",
  },
  navigation: {
    menuItems: [
      { id: "home", label: "HOME", url: "#top", enabled: true },
      { id: "shop", label: "SHOP", url: "/shop", enabled: true },
      { id: "cart", label: "BAG", url: "/cart", enabled: true },
      { id: "account", label: "ACCOUNT", url: "/account", enabled: true },
    ],
    socialLinks: {
      instagram: "https://instagram.com/alurelab",
      whatsapp: "6281234567890",
      tiktok: "https://tiktok.com/@alurelab",
    },
  },
  sections: {
    showAnnouncementBar: true,
    showHero: true,
    showFeaturedProducts: true,
    showAbout: true,
  },
  highlights: {
    announcementText:
      "⚡ Garansi Pengiriman Cepat Multi-Kurir • Pembayaran Aman Berlisensi DOKU",
    featuredCategory: "Semua",
    featuredCount: 4,
    aboutHeading: "TENTANG TOKO KAMI",
    aboutStory:
      "Kami menghadirkan produk pilihan berkualitas dengan harga jujur dan pelayanan yang cepat.",
  },
};

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "announcement", label: "Pengumuman (Announcement Bar)" },
  { key: "header", label: "Header & Logo" },
  { key: "hero", label: "Hero Banner" },
  { key: "featured", label: "Produk Unggulan" },
  { key: "about", label: "Tentang Toko" },
  { key: "footer", label: "Footer & Media Sosial" },
  { key: "style", label: "Gaya & Warna Toko" },
];

const FONT_OPTIONS = [
  { value: "bebas", label: "Bebas Neue (Display)" },
  { value: "playfair", label: "Playfair (Serif)" },
  { value: "montserrat", label: "Montserrat (Sans Tebal)" },
  { value: "inter", label: "Inter (Modern)" },
  { value: "serif", label: "Serif Klasik" },
];

const TEMPLATE_OPTIONS = [
  { value: "editorial", label: "Editorial" },
  { value: "modern", label: "Modern" },
  { value: "marketplace", label: "Marketplace" },
  { value: "split", label: "Split" },
  { value: "brutalist", label: "Brutalist" },
];

const labelClass = "block text-[11px] font-semibold mb-1.5 text-slate-700";

const inputClass =
  "w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#EE4D2D] focus:ring-2 focus:ring-[#EE4D2D]/15 transition-all placeholder:text-slate-400";

export default function ThemeEditorPage() {
  const [cms, setCms] = useState<CmsSettings>(DEFAULT_CMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [openSection, setOpenSection] = useState<SectionKey>("announcement");
  const [uploading, setUploading] = useState(false);

  // Load settings
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/merchant/cms/settings");
        const s = res.data?.data?.settings;
        if (alive && s && Object.keys(s).length > 0) {
          setCms((prev) => ({
            ...prev,
            ...s,
            branding: { ...prev.branding, ...s.branding },
            hero: { ...prev.hero, ...s.hero },
            navigation: {
              ...prev.navigation,
              ...s.navigation,
              socialLinks: {
                ...prev.navigation?.socialLinks,
                ...s.navigation?.socialLinks,
              },
            },
            sections: { ...prev.sections, ...s.sections },
            highlights: { ...prev.highlights, ...s.highlights },
          }));
        }
      } catch (e) {
        console.warn("Using default theme settings", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const patchBranding = (k: keyof CmsBranding, v: unknown) =>
    setCms((p) => ({ ...p, branding: { ...p.branding, [k]: v } }));
  const patchHero = (k: keyof CmsHero, v: unknown) =>
    setCms((p) => ({ ...p, hero: { ...p.hero, [k]: v } }));
  const patchHighlights = (k: keyof CmsHighlights, v: unknown) =>
    setCms((p) => ({ ...p, highlights: { ...p.highlights, [k]: v } }));
  const patchSocial = (k: "instagram" | "whatsapp" | "tiktok", v: string) =>
    setCms((p) => ({
      ...p,
      navigation: {
        ...p.navigation,
        socialLinks: { ...p.navigation?.socialLinks, [k]: v },
      },
    }));

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading("Mengunggah banner...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "banners");
      const res = await api.post("/merchant/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.url) {
        patchHero("bannerImage", res.data.url);
        toast.success("Banner berhasil diunggah", { id: toastId });
      } else {
        toast.error("Unggahan tidak valid", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal mengunggah banner", { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/merchant/cms/settings", { settings: cms });
      toast.success("Perubahan tema berhasil disimpan!", {
        description: "Tampilan toko publik langsung diperbarui.",
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan perubahan tema");
    } finally {
      setSaving(false);
    }
  };

  // Preview data
  const branding = cms.branding || {};
  const hero = cms.hero || {};
  const highlights = cms.highlights || {};
  const social = cms.navigation?.socialLinks || {};
  const bgColor = branding.backgroundColor || "#F5F5F3";
  const textColor = branding.textColor || "#111111";
  const accentColor = branding.accentColor || "#C8FF3D";
  const primaryColor = branding.primaryColor || "#111111";
  const fontHeadingClass =
    branding.fontHeading === "playfair"
      ? "font-serif"
      : branding.fontHeading === "montserrat"
        ? "font-sans font-black tracking-wide"
        : branding.fontHeading === "inter"
          ? "font-sans font-black"
          : branding.fontHeading === "serif"
            ? "font-serif font-black"
            : "font-bebas";
  const isMobile = viewport === "mobile";
  const featuredCount = Math.min(Number(highlights.featuredCount) || 4, 8);

  const { data: productsRes } = useQuery({
    queryKey: ["cms-editor-products"],
    queryFn: async () => (await api.get("/merchant/products?per_page=12")).data,
  });
  const previewProducts: any[] = (productsRes?.data || []).slice(0, featuredCount);

  const toggleSection = (key: SectionKey) =>
    setOpenSection((cur) => (cur === key ? ("" as SectionKey) : key));

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] text-slate-800">
      {/* ─── Top Bar ─── */}
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/cms"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-full px-3 py-1.5 hover:bg-[#FAFAF8] transition-all shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kembali ke Dashboard</span>
          </Link>
          <div className="min-w-0 hidden sm:flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800 truncate">
              Alurelab Modern Theme v1.0
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Tema Aktif
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Viewport switch */}
          <div className="flex items-center gap-1 bg-[#FAFAF8] border border-slate-200 rounded-full p-1">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                viewport === "desktop"
                  ? "bg-[#111111] text-[#FAFAF8] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Tampilan desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                viewport === "mobile"
                  ? "bg-[#111111] text-[#FAFAF8] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Tampilan mobile"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mobile</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#EE4D2D] hover:bg-[#d73f20] text-white rounded-full text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </header>

      {/* ─── Split Layout ─── */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Section Controls */}
        <aside className="w-full sm:w-[360px] shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-[#EE4D2D] mr-2" />
              Memuat pengaturan tema...
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {SECTIONS.map((section) => {
                const open = openSection === section.key;
                return (
                  <div
                    key={section.key}
                    className="border border-slate-200 rounded-2xl overflow-hidden bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(section.key)}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-xs font-semibold text-left transition-colors ${
                        open ? "bg-[#FAFAF8] text-slate-900" : "text-slate-700 hover:bg-[#FAFAF8]"
                      }`}
                    >
                      <span>{section.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {open && (
                      <div className="px-4 py-4 space-y-3 border-t border-slate-100">
                        {/* 1. Announcement */}
                        {section.key === "announcement" && (
                          <>
                            <label className={labelClass}>Teks Pengumuman</label>
                            <textarea
                              rows={3}
                              value={highlights.announcementText || ""}
                              onChange={(e) => patchHighlights("announcementText", e.target.value)}
                              className={inputClass}
                              placeholder="Promo, garansi, atau info penting toko"
                            />
                            <p className="text-[10px] text-slate-400">
                              Tampil di paling atas halaman toko, bisa berjalan (marquee).
                            </p>
                          </>
                        )}

                        {/* 2. Header & Logo */}
                        {section.key === "header" && (
                          <>
                            <div>
                              <label className={labelClass}>Nama Toko / Logo Teks</label>
                              <input
                                type="text"
                                value={branding.storeName || ""}
                                onChange={(e) => patchBranding("storeName", e.target.value)}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Tagline</label>
                              <input
                                type="text"
                                value={branding.tagline || ""}
                                onChange={(e) => patchBranding("tagline", e.target.value)}
                                className={inputClass}
                              />
                            </div>
                          </>
                        )}

                        {/* 3. Hero Banner */}
                        {section.key === "hero" && (
                          <>
                            <div>
                              <label className={labelClass}>Headline</label>
                              <input
                                type="text"
                                value={hero.headline || ""}
                                onChange={(e) => patchHero("headline", e.target.value)}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Subheadline / Deskripsi</label>
                              <textarea
                                rows={3}
                                value={hero.description || ""}
                                onChange={(e) => patchHero("description", e.target.value)}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Teks Tombol (CTA)</label>
                              <input
                                type="text"
                                value={hero.ctaText || ""}
                                onChange={(e) => patchHero("ctaText", e.target.value)}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Gambar Banner</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={hero.bannerImage || ""}
                                  onChange={(e) => patchHero("bannerImage", e.target.value)}
                                  className={inputClass}
                                  placeholder="https://..."
                                />
                                <label className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-400 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer transition-all">
                                  {uploading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5" />
                                  )}
                                  <span className="hidden sm:inline">Unggah</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleUploadBanner}
                                  />
                                </label>
                              </div>
                            </div>
                          </>
                        )}

                        {/* 4. Featured Products */}
                        {section.key === "featured" && (
                          <>
                            <div>
                              <label className={labelClass}>Kategori Unggulan</label>
                              <input
                                type="text"
                                value={highlights.featuredCategory || ""}
                                onChange={(e) => patchHighlights("featuredCategory", e.target.value)}
                                className={inputClass}
                                placeholder="Semua"
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Jumlah Item</label>
                              <input
                                type="number"
                                min={1}
                                max={8}
                                value={Number(highlights.featuredCount) || 4}
                                onChange={(e) => patchHighlights("featuredCount", Number(e.target.value))}
                                className={inputClass}
                              />
                            </div>
                          </>
                        )}

                        {/* 5. About */}
                        {section.key === "about" && (
                          <>
                            <div>
                              <label className={labelClass}>Judul Bagian Tentang</label>
                              <input
                                type="text"
                                value={highlights.aboutHeading || ""}
                                onChange={(e) => patchHighlights("aboutHeading", e.target.value)}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Cerita Toko</label>
                              <textarea
                                rows={5}
                                value={highlights.aboutStory || ""}
                                onChange={(e) => patchHighlights("aboutStory", e.target.value)}
                                className={inputClass}
                              />
                            </div>
                          </>
                        )}

                        {/* 6. Footer & Social */}
                        {section.key === "footer" && (
                          <>
                            <div>
                              <label className={labelClass}>Instagram</label>
                              <input
                                type="text"
                                value={social.instagram || ""}
                                onChange={(e) => patchSocial("instagram", e.target.value)}
                                className={inputClass}
                                placeholder="https://instagram.com/..."
                              />
                            </div>
                            <div>
                              <label className={labelClass}>WhatsApp (62...)</label>
                              <input
                                type="text"
                                value={social.whatsapp || ""}
                                onChange={(e) => patchSocial("whatsapp", e.target.value)}
                                className={inputClass}
                                placeholder="6281234567890"
                              />
                            </div>
                            <div>
                              <label className={labelClass}>TikTok</label>
                              <input
                                type="text"
                                value={social.tiktok || ""}
                                onChange={(e) => patchSocial("tiktok", e.target.value)}
                                className={inputClass}
                                placeholder="https://tiktok.com/@..."
                              />
                            </div>
                          </>
                        )}

                        {/* 7. Style & Colors */}
                        {section.key === "style" && (
                          <>
                            <div>
                              <label className={labelClass}>Template</label>
                              <select
                                value={cms.template || "editorial"}
                                onChange={(e) => setCms((p) => ({ ...p, template: e.target.value as any }))}
                                className={inputClass}
                              >
                                {TEMPLATE_OPTIONS.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={labelClass}>Font Judul</label>
                              <select
                                value={branding.fontHeading || "bebas"}
                                onChange={(e) => patchBranding("fontHeading", e.target.value)}
                                className={inputClass}
                              >
                                {FONT_OPTIONS.map((f) => (
                                  <option key={f.value} value={f.value}>
                                    {f.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {(
                                [
                                  ["primaryColor", "Warna Utama"],
                                  ["backgroundColor", "Warna Latar"],
                                  ["textColor", "Warna Teks"],
                                  ["accentColor", "Warna Aksen"],
                                ] as const
                              ).map(([key, label]) => (
                                <div key={key}>
                                  <label className={labelClass}>{label}</label>
                                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-2">
                                    <input
                                      type="color"
                                      value={(branding[key] as string) || "#111111"}
                                      onChange={(e) => patchBranding(key, e.target.value)}
                                      className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer p-0"
                                    />
                                    <input
                                      type="text"
                                      value={(branding[key] as string) || ""}
                                      onChange={(e) => patchBranding(key, e.target.value)}
                                      className="w-full min-w-0 text-[11px] font-mono text-slate-600 outline-none bg-transparent"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Right: Live Preview Canvas */}
        <section className="flex-1 min-w-0 overflow-auto bg-slate-100 p-4 sm:p-6">
          <div className={`mx-auto ${isMobile ? "max-w-[390px]" : "max-w-[1200px]"}`}>
            {/* Device label */}
            <div className="flex items-center justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
                {isMobile ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                Preview {isMobile ? "Mobile" : "Desktop"} • Realtime
              </span>
            </div>

            <div
              className={`mx-auto bg-white overflow-hidden ${
                isMobile
                  ? "w-[375px] rounded-[2.5rem] border-[10px] border-[#111111] shadow-2xl min-h-[720px]"
                  : "w-full rounded-2xl border border-slate-200 shadow-sm min-h-[560px]"
              }`}
            >
              <div
                className="min-h-full"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                {/* Announcement bar */}
                {cms.sections?.showAnnouncementBar !== false && (
                  <div
                    className={`overflow-hidden whitespace-nowrap ${
                      isMobile ? "py-1.5 px-3 text-[9px]" : "py-2 px-4 text-[11px]"
                    }`}
                    style={{ backgroundColor: primaryColor, color: "#FAFAF8" }}
                  >
                    <span className="inline-block">
                      {highlights.announcementText || "Pengumuman toko Anda"}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div
                  className={`flex items-center justify-between border-b ${
                    isMobile ? "px-3 py-2.5" : "px-6 py-4"
                  }`}
                  style={{ borderColor: `${textColor}15` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`grid place-items-center rounded-xl font-black shrink-0 ${
                        isMobile ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
                      }`}
                      style={{ backgroundColor: primaryColor, color: accentColor }}
                    >
                      {(branding.storeName || "A").charAt(0).toUpperCase()}
                    </span>
                    <span
                      className={`font-bold truncate ${fontHeadingClass} ${
                        isMobile ? "text-xs" : "text-sm"
                      }`}
                    >
                      {branding.storeName || "Toko Anda"}
                    </span>
                  </div>
                  <div
                    className={`flex items-center ${
                      isMobile ? "gap-2 text-[8px]" : "gap-4 text-[11px]"
                    }`}
                  >
                    {(cms.navigation?.menuItems || []).filter((m) => m.enabled).map((m) => (
                      <span key={m.id} className="opacity-70 font-semibold uppercase">
                        {m.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hero */}
                {cms.sections?.showHero !== false && (
                  <div className={`relative ${isMobile ? "min-h-[240px]" : "min-h-[340px]"}`}>
                    {hero.bannerImage && (
                      <img
                        src={hero.bannerImage}
                        alt="Banner"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40" />
                    <div
                      className={`relative flex flex-col justify-center h-full ${
                        isMobile ? "px-4 py-10" : "px-10 py-16"
                      }`}
                    >
                      <h1
                        className={`${fontHeadingClass} text-white leading-none ${
                          isMobile ? "text-4xl" : "text-7xl"
                        }`}
                      >
                        {hero.headline || branding.storeName}
                      </h1>
                      <p
                        className={`text-white/80 mt-3 ${
                          isMobile ? "text-[11px] max-w-[240px]" : "text-sm max-w-md"
                        }`}
                      >
                        {hero.description}
                      </p>
                      <span
                        className={`mt-5 inline-flex items-center justify-center self-start font-bold rounded-full ${
                          isMobile ? "px-4 py-2 text-[10px]" : "px-6 py-3 text-xs"
                        }`}
                        style={{ backgroundColor: accentColor, color: primaryColor }}
                      >
                        {hero.ctaText || "BELANJA"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Featured products */}
                {cms.sections?.showFeaturedProducts !== false && (
                  <div className={isMobile ? "px-4 py-6" : "px-8 py-10"}>
                    <div className="flex items-center justify-between mb-4">
                      <h2
                        className={`${fontHeadingClass} ${isMobile ? "text-lg" : "text-3xl"}`}
                      >
                        PRODUK UNGGULAN
                      </h2>
                      <span
                        className="text-[10px] font-bold rounded-full px-2.5 py-1"
                        style={{ backgroundColor: `${accentColor}33`, color: textColor }}
                      >
                        {highlights.featuredCategory || "Semua"}
                      </span>
                    </div>
                    <div
                      className={`grid gap-3 ${
                        isMobile ? "grid-cols-2" : "grid-cols-4"
                      }`}
                    >
                      {(previewProducts.length
                        ? previewProducts
                        : Array.from({ length: featuredCount })
                      ).map((p: any, i: number) => (
                        <div
                          key={p?.id || i}
                          className="rounded-xl overflow-hidden border"
                          style={{ borderColor: `${textColor}15`, backgroundColor: "#ffffff" }}
                        >
                          <div
                            className={`bg-slate-100 flex items-center justify-center ${
                              isMobile ? "h-20" : "h-32"
                            }`}
                          >
                            {p?.images?.[0] ? (
                              <img
                                src={p.images[0]}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className={isMobile ? "p-2" : "p-3"}>
                            <p
                              className="font-semibold truncate"
                              style={{ fontSize: isMobile ? 9 : 12 }}
                            >
                              {p?.title || `Produk Unggulan ${i + 1}`}
                            </p>
                            <p
                              className="font-bold mt-0.5"
                              style={{ fontSize: isMobile ? 9 : 12, color: primaryColor }}
                            >
                              {p?.price
                                ? `Rp${Number(p.price).toLocaleString("id-ID")}`
                                : "Rp0"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* About */}
                {cms.sections?.showAbout !== false && (
                  <div
                    className={isMobile ? "px-4 py-6" : "px-8 py-12"}
                    style={{ backgroundColor: `${textColor}08` }}
                  >
                    <h2
                      className={`${fontHeadingClass} ${isMobile ? "text-lg" : "text-4xl"}`}
                    >
                      {highlights.aboutHeading || "TENTANG TOKO KAMI"}
                    </h2>
                    <p
                      className={`mt-3 whitespace-pre-line opacity-75 leading-relaxed ${
                        isMobile ? "text-[10px]" : "text-sm"
                      }`}
                    >
                      {highlights.aboutStory}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div
                  className={`flex flex-col gap-3 ${
                    isMobile ? "px-4 py-5" : "px-8 py-8"
                  }`}
                  style={{ backgroundColor: primaryColor, color: "#FAFAF8" }}
                >
                  <span className={`${fontHeadingClass} ${isMobile ? "text-base" : "text-xl"}`}>
                    {branding.storeName || "Toko Anda"}
                  </span>
                  <p className="text-[10px] opacity-60">{branding.tagline}</p>
                  <div className={`flex ${isMobile ? "gap-3" : "gap-4"} text-[10px] opacity-80`}>
                    {social.instagram && <span>Instagram</span>}
                    {social.whatsapp && <span>WhatsApp</span>}
                    {social.tiktok && <span>TikTok</span>}
                  </div>
                  <p className="text-[9px] opacity-40">
                    © {new Date().getFullYear()} {branding.storeName} • Ditenagai ALURELAB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
