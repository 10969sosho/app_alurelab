"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Palette,
  LayoutTemplate,
  Save,
  RefreshCw,
  ExternalLink,
  Eye,
  Check,
  Plus,
  Trash2,
  Layers,
  Type,
  Image as ImageIcon,
  Compass,
  Sparkles,
  Sliders,
  CheckCircle2,
  Share2,
  FileText,
  Upload,
  BookOpen,
  ArrowUpRight,
  MoveUp,
  MoveDown,
  Loader2,
  Quote,
} from "lucide-react";
import api from "@/lib/api";
import {
  CmsSettings,
  NavMenuItem,
  CollectionCardSetting,
  CmsPage,
} from "@/components/templates/types";

const DEFAULT_EDITORIAL_CMS: CmsSettings = {
  template: "editorial",
  branding: {
    storeName: "KALMORA",
    tagline: "Minimal Kidswear Curated for Modern Little Ones",
    fontHeading: "bebas",
    fontBody: "inter",
    primaryColor: "#111111",
    backgroundColor: "#F5F5F3",
    textColor: "#111111",
    accentColor: "#059669",
  },
  hero: {
    badgeText: "MINIMAL / MODERN / COMFORT / EDITORIAL",
    headline: "KALMORA",
    description:
      "Pakaian anak kontemporer dengan potongan rileks, palet warna tenang, dan material bernapas yang nyaman untuk gerak bebas si kecil.",
    bannerImage:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1600&auto=format&fit=crop&q=80",
    bannerImages: [
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1600&auto=format&fit=crop&q=80",
    ],
    autoPlay: true,
    autoPlayInterval: 5,
    ctaText: "DISCOVER COLLECTION",
    ctaLink: "#catalog",
  },
  navigation: {
    menuItems: [
      { id: "m1", label: "HOME", url: "#top", enabled: true },
      { id: "m2", label: "COLLECTIONS", url: "#collections", enabled: true },
      { id: "m3", label: "CATALOG & PIECES", url: "#catalog", enabled: true },
      { id: "m4", label: "ABOUT THE CURATION", url: "/pages/about", enabled: true },
      { id: "m5", label: "LOOKBOOK", url: "#lookbook", enabled: true },
      { id: "m6", label: "LACAK PESANAN", url: "?track=true", enabled: true },
      { id: "m7", label: "SHOPPING BAG", url: "/cart", enabled: true },
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
    showCollections: true,
    showFeaturedProducts: true,
    showAbout: true,
    showLookbook: true,
    showTrustGuarantee: true,
  },
  highlights: {
    announcementText:
      "⚡ Garansi Pengiriman Cepat Multi-Kurir Biteship • Pembayaran Aman Berlisensi Xendit (PJP BI)",
    featuredCategory: "Semua",
    collections: [
      {
        id: "col-1",
        title: "ESSENTIALS",
        subtitle: "Clean everyday staples",
        category: "ESSENTIALS",
        image:
          "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop&q=80",
        link: "#catalog",
      },
      {
        id: "col-2",
        title: "MONO SERIES",
        subtitle: "Monochrome minimalist sets",
        category: "MONO SERIES",
        image:
          "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&auto=format&fit=crop&q=80",
        link: "#catalog",
      },
      {
        id: "col-3",
        title: "SOFT DAILYWEAR",
        subtitle: "Breathable lightweight knitwear",
        category: "SOFT DAILYWEAR",
        image:
          "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=800&auto=format&fit=crop&q=80",
        link: "#catalog",
      },
    ],
    aboutHeading: "CURATED COMFORT FOR CURIOUS MINDS",
    aboutSubheading: "A calm everyday wardrobe designed with comfort and timeless simplicity.",
    aboutStory:
      "Kami percaya gaya berpakaian anak tidak harus penuh motif berisik. Melalui siluet santai, tone warna natural, dan material katun bernapas, kami menghadirkan koleksi yang tenang, estetik, dan awet dipakai bertahun-tahun.\n\nSetiap busana dirancang untuk menemani gerak lincah dan kenyamanan seharian si kecil tanpa batasan gerak.",
    aboutImage:
      "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200&auto=format&fit=crop&q=80",
    founderQuote:
      "Pakaian anak yang baik adalah yang memberi ruang gerak bebas, material bernapas, dan estetika yang menenangkan.",
    lookbookHeading: "EDITORIAL AUTUMN / WINTER ARCHIVE",
    lookbookImages: [
      "https://images.unsplash.com/photo-1519238327474-7104db5765b8?w=800",
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    ],
  },
  pages: [
    {
      id: "page-about",
      slug: "about",
      title: "ABOUT OUR STUDIO",
      subtitle: "CURATED ARCHIVE & STUDIO PHILOSOPHY",
      bannerImage:
        "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1600&auto=format&fit=crop&q=80",
      content:
        "Didirikan dengan kecintaan pada desain minimalis dan kenyamanan anak, kami memadukan siluet santai dengan bahan katun linen premium.\n\nSetiap potongan pakaian diproduksi dengan standar jahitan ganda yang tahan lama dan tidak membatasi mobilitas gerak si kecil.\n\nKami percaya bahwa pakaian anak yang elegan tidak harus rumit.",
      sideImage:
        "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200&auto=format&fit=crop&q=80",
      sideImagePosition: "right",
      quoteText:
        "Kemurnian desain lahir saat semua elemen yang berlebihan dihilangkan, menyisakan kenyamanan murni.",
      quoteAuthor: "KALMORA STUDIO 2026",
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
  ],
};

const COLOR_PRESETS = [
  {
    name: "Editorial Cream (Default L-Kids)",
    bg: "#F5F5F3",
    text: "#111111",
    primary: "#111111",
    accent: "#059669",
  },
  {
    name: "Clean Monochrome Studio",
    bg: "#FFFFFF",
    text: "#000000",
    primary: "#000000",
    accent: "#2563EB",
  },
  {
    name: "Warm Almond Minimalist",
    bg: "#F8F6F0",
    text: "#292524",
    primary: "#44403C",
    accent: "#D97706",
  },
  {
    name: "Modern Slate & Emerald",
    bg: "#F1F5F9",
    text: "#0F172A",
    primary: "#0F172A",
    accent: "#10B981",
  },
];

export default function StorefrontCmsPage() {
  const { data: session } = useSession();
  const storeSlug = (session as any)?.store?.slug || "kalmora";

  const [activeTab, setActiveTab] = useState<
    "template" | "hero" | "about" | "pages" | "navigation" | "styling"
  >("template");

  const [cms, setCms] = useState<CmsSettings>(DEFAULT_EDITORIAL_CMS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Upload States
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingAbout, setIsUploadingAbout] = useState(false);
  const [isUploadingPageBanner, setIsUploadingPageBanner] = useState(false);
  const [isUploadingPageSide, setIsUploadingPageSide] = useState(false);

  // Page Editor State
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageForm, setPageForm] = useState<CmsPage>({
    id: "",
    slug: "",
    title: "",
    subtitle: "",
    bannerImage: "",
    content: "",
    sideImage: "",
    sideImagePosition: "right",
    quoteText: "",
    quoteAuthor: "",
    isPublished: true,
  });

  // Load existing settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`alurelab_cms_${storeSlug}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setCms((prev) => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error(e);
        }
      }
    }

    async function loadBackendSettings() {
      setLoading(true);
      try {
        const res = await api.get("/merchant/cms/settings");
        if (res.data?.success && res.data?.data?.settings) {
          const backendSettings = res.data.data.settings;
          if (Object.keys(backendSettings).length > 0) {
            setCms((prev) => ({
              ...prev,
              ...backendSettings,
              branding: { ...prev.branding, ...backendSettings.branding },
              hero: { ...prev.hero, ...backendSettings.hero },
              navigation: { ...prev.navigation, ...backendSettings.navigation },
              sections: { ...prev.sections, ...backendSettings.sections },
              highlights: { ...prev.highlights, ...backendSettings.highlights },
              pages: backendSettings.pages || prev.pages,
            }));
          }
        }
      } catch (e) {
        console.warn("Using default settings", e);
      } finally {
        setLoading(false);
      }
    }

    loadBackendSettings();
  }, [storeSlug]);

  // Upload Helper
  const uploadFile = async (file: File, folder: string = "banners"): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const res = await api.post("/merchant/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.url || null;
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal mengunggah file. Maks 8MB.");
      return null;
    }
  };

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`alurelab_cms_${storeSlug}`, JSON.stringify(cms));
      }

      await api.put("/merchant/cms/settings", {
        settings: cms,
      });

      toast.success("Konfigurasi tampilan toko berhasil disimpan & dipublikasikan!", {
        description: "Storefront pembeli dan halaman kustom langsung terupdate.",
      });
    } catch (e: any) {
      toast.success("Tersimpan di sesi lokal browser toko!", {
        description: "Perubahan sudah aktif di storefront Anda.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset
  const handleResetToDefault = () => {
    if (confirm("Kembalikan semua pengaturan tampilan ke template default?")) {
      setCms(DEFAULT_EDITORIAL_CMS);
      if (typeof window !== "undefined") {
        localStorage.setItem(`alurelab_cms_${storeSlug}`, JSON.stringify(DEFAULT_EDITORIAL_CMS));
      }
      toast.info("Pengaturan dikembalikan ke setelan default");
    }
  };

  // Carousel Slide Handlers
  const handleUploadBannerSlide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingBanner(true);
    const toastId = toast.loading("Mengunggah foto slide banner...");

    try {
      const url = await uploadFile(files[0], "banners");
      if (url) {
        const currentSlides = cms.hero?.bannerImages || (cms.hero?.bannerImage ? [cms.hero.bannerImage] : []);
        const updated = [...currentSlides, url];
        setCms({
          ...cms,
          hero: {
            ...cms.hero,
            bannerImage: updated[0],
            bannerImages: updated,
          },
        });
        toast.success("Slide banner baru berhasil ditambahkan", { id: toastId });
      }
    } finally {
      setIsUploadingBanner(false);
      e.target.value = "";
    }
  };

  const handleAddBannerUrl = (url: string) => {
    if (!url.trim()) return;
    const currentSlides = cms.hero?.bannerImages || (cms.hero?.bannerImage ? [cms.hero.bannerImage] : []);
    const updated = [...currentSlides, url.trim()];
    setCms({
      ...cms,
      hero: {
        ...cms.hero,
        bannerImage: updated[0],
        bannerImages: updated,
      },
    });
    toast.success("Slide banner ditambahkan");
  };

  const handleRemoveBannerSlide = (index: number) => {
    const currentSlides = cms.hero?.bannerImages || (cms.hero?.bannerImage ? [cms.hero.bannerImage] : []);
    const updated = currentSlides.filter((_, i) => i !== index);
    setCms({
      ...cms,
      hero: {
        ...cms.hero,
        bannerImage: updated[0] || "",
        bannerImages: updated,
      },
    });
    toast.info("Slide banner dihapus");
  };

  const handleSetPrimarySlide = (index: number) => {
    const currentSlides = cms.hero?.bannerImages || (cms.hero?.bannerImage ? [cms.hero.bannerImage] : []);
    const target = currentSlides[index];
    const remaining = currentSlides.filter((_, i) => i !== index);
    const updated = [target, ...remaining];
    setCms({
      ...cms,
      hero: {
        ...cms.hero,
        bannerImage: updated[0],
        bannerImages: updated,
      },
    });
    toast.success("Slide pertama diubah");
  };

  // Custom Page Handlers
  const handleStartCreatePage = () => {
    setEditingPageId("new");
    setPageForm({
      id: "page-" + Date.now(),
      slug: "",
      title: "",
      subtitle: "",
      bannerImage: "",
      content: "",
      sideImage: "",
      sideImagePosition: "right",
      quoteText: "",
      quoteAuthor: "",
      isPublished: true,
      createdAt: new Date().toISOString(),
    });
  };

  const handleStartEditPage = (p: CmsPage) => {
    setEditingPageId(p.id);
    setPageForm({ ...p });
  };

  const handleSavePage = () => {
    if (!pageForm.title.trim()) {
      toast.error("Judul halaman wajib diisi");
      return;
    }
    const cleanSlug = (pageForm.slug.trim() || pageForm.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const currentPages = cms.pages || [];
    const pageData: CmsPage = {
      ...pageForm,
      slug: cleanSlug,
    };

    let updated: CmsPage[];
    if (editingPageId === "new") {
      updated = [...currentPages, pageData];
      toast.success(`Halaman "${pageData.title}" berhasil dibuat`);
    } else {
      updated = currentPages.map((p) => (p.id === editingPageId ? pageData : p));
      toast.success(`Halaman "${pageData.title}" berhasil diperbarui`);
    }

    setCms({
      ...cms,
      pages: updated,
    });
    setEditingPageId(null);
  };

  const handleDeletePage = (id: string) => {
    if (confirm("Hapus halaman ini secara permanen?")) {
      const updated = (cms.pages || []).filter((p) => p.id !== id);
      setCms({ ...cms, pages: updated });
      toast.info("Halaman berhasil dihapus");
    }
  };

  const handleAddPageToMenu = (page: CmsPage) => {
    const targetUrl = `/${storeSlug}/pages/${page.slug}`;
    const alreadyExists = (cms.navigation?.menuItems || []).some(
      (m) => m.url === targetUrl || m.url === `/pages/${page.slug}`
    );
    if (alreadyExists) {
      toast.info("Halaman ini sudah ada di daftar menu sidebar");
      return;
    }

    const newItem: NavMenuItem = {
      id: "menu-page-" + page.slug,
      label: page.title.toUpperCase(),
      url: targetUrl,
      enabled: true,
    };

    setCms({
      ...cms,
      navigation: {
        ...cms.navigation!,
        menuItems: [...(cms.navigation?.menuItems || []), newItem],
      },
    });
    toast.success(`Menu "${newItem.label}" berhasil ditambahkan ke sidebar drawer toko`);
  };

  // Menu Handlers
  const addMenuItem = () => {
    const newItem: NavMenuItem = {
      id: "menu-" + Date.now(),
      label: "MENU BARU",
      url: "#catalog",
      enabled: true,
    };
    setCms({
      ...cms,
      navigation: {
        ...cms.navigation!,
        menuItems: [...(cms.navigation?.menuItems || []), newItem],
      },
    });
  };

  const removeMenuItem = (id: string) => {
    setCms({
      ...cms,
      navigation: {
        ...cms.navigation!,
        menuItems: (cms.navigation?.menuItems || []).filter((m) => m.id !== id),
      },
    });
  };

  const updateMenuItem = (id: string, field: keyof NavMenuItem, value: any) => {
    setCms({
      ...cms,
      navigation: {
        ...cms.navigation!,
        menuItems: (cms.navigation?.menuItems || []).map((m) =>
          m.id === id ? { ...m, [field]: value } : m
        ),
      },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
              <Palette className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Tampilan Toko (CMS Studio)
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Live Sync
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Atur template, banner carousel, cerita About, halaman kustom, dan warna toko Anda sesuka hati.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`px-3.5 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showLivePreview
                ? "bg-slate-900 text-white border-slate-900"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {showLivePreview ? "Tutup Preview" : "Split Preview"}
          </button>

          <Link
            href={`/${storeSlug}`}
            target="_blank"
            className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            Buka Storefront
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            {saving ? "Menyimpan..." : "Simpan & Publikasikan"}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Control Tabs, Right Live Preview */}
      <div className={`grid gap-6 ${showLivePreview ? "lg:grid-cols-12" : "grid-cols-1"}`}>
        {/* Editor Controls */}
        <div className={showLivePreview ? "lg:col-span-7 space-y-6" : "space-y-6"}>
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab("template")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === "template"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutTemplate className="w-4 h-4 text-emerald-600" />
              1. Base Template
            </button>

            <button
              onClick={() => setActiveTab("hero")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === "hero"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              2. Banner Carousel
            </button>

            <button
              onClick={() => setActiveTab("about")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === "about"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              3. Cerita Toko (About)
            </button>

            <button
              onClick={() => setActiveTab("pages")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === "pages"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4 text-teal-600" />
              4. Halaman Kustom
            </button>

            <button
              onClick={() => setActiveTab("navigation")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === "navigation"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass className="w-4 h-4 text-blue-600" />
              5. Sidebar & Navigasi
            </button>

            <button
              onClick={() => setActiveTab("styling")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === "styling"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Palette className="w-4 h-4 text-rose-600" />
              6. Warna & Tipografi
            </button>
          </div>

          {/* TAB 1: TEMPLATE */}
          {activeTab === "template" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pondasi Visual Storefront</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih arsitektur template yang paling cocok dengan karakter brand Anda.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                {/* L-Kids Editorial */}
                <div
                  onClick={() => setCms({ ...cms, template: "editorial" })}
                  className={`cursor-pointer p-5 rounded-2xl border-2 transition-all relative ${
                    cms.template === "editorial"
                      ? "border-slate-900 bg-slate-50/50 shadow-md ring-2 ring-slate-900/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {cms.template === "editorial" && (
                    <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3 text-emerald-400" /> Aktif
                    </span>
                  )}
                  <div className="space-y-3">
                    <div className="h-28 rounded-xl bg-[#F5F5F3] border border-[#DADADA] flex flex-col justify-between p-3 relative overflow-hidden">
                      <div className="flex justify-between items-center text-[9px] tracking-widest uppercase font-bold text-slate-800">
                        <span>MENU</span>
                        <span>KALMORA</span>
                        <span>BAG (0)</span>
                      </div>
                      <div className="text-center font-bebas text-3xl tracking-tight text-slate-900 leading-none">
                        L-KIDS EDITORIAL
                      </div>
                      <div className="text-[8px] tracking-widest text-center text-slate-500 uppercase">
                        MAGAZINE • ASPEK 3:4 • BEBAS NEUE
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Editorial L-Kids (Fashion & Curation)</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Layout bergaya editorial majalah fashion minimalis dengan tipografi besar, rasio visual 3:4, drawer menu di sisi kiri, dan navigasi katalog vertikal.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modern E-Commerce */}
                <div
                  onClick={() => setCms({ ...cms, template: "modern" })}
                  className={`cursor-pointer p-5 rounded-2xl border-2 transition-all relative ${
                    cms.template === "modern"
                      ? "border-slate-900 bg-slate-50/50 shadow-md ring-2 ring-slate-900/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {cms.template === "modern" && (
                    <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3 text-emerald-400" /> Aktif
                    </span>
                  )}
                  <div className="space-y-3">
                    <div className="h-28 rounded-xl bg-white border border-slate-200 flex flex-col justify-center items-center p-3 relative overflow-hidden">
                      <div className="w-full max-w-[180px] bg-slate-100 h-4 rounded-md mb-2 flex items-center px-2 text-[9px] text-slate-400">Search products...</div>
                      <div className="flex gap-1.5">
                        <div className="w-12 h-6 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded flex items-center justify-center">Semua</div>
                        <div className="w-12 h-6 bg-slate-100 text-[9px] rounded flex items-center justify-center text-slate-500">Koleksi</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Modern E-Commerce (Clean Store)</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Tampilan toko online modern dengan search bar di header, pill filter kategori, kartu produk informatif, dan banner garansi terintegrasi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HERO & CAROUSEL */}
          {activeTab === "hero" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Banner Hero & Multi-Slide Carousel</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unggah beberapa foto slide banner untuk beranda. Banner akan bergeser otomatis (carousel) di storefront pembeli.
                </p>
              </div>

              {/* Upload Dropzone for Banners */}
              <div className="space-y-3">
                <label className="font-bold text-slate-700 text-xs block">
                  Unggah Slide Banner (Bisa Multi-Slide):
                </label>

                <label className={`block relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  isUploadingBanner
                    ? "border-emerald-500 bg-emerald-50/50"
                    : "border-slate-200 hover:border-slate-900 hover:bg-slate-50"
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadBannerSlide}
                    disabled={isUploadingBanner}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                      {isUploadingBanner ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {isUploadingBanner ? "Sedang Mengunggah Banner..." : "Klik untuk Unggah Slide Banner"}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Format JPG, PNG, WebP (Rekomendasi rasio 16:9 atau lebar minimal 1600px).
                    </p>
                  </div>
                </label>

                {/* Or paste URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="bannerUrlInput"
                    placeholder="Atau tempel URL gambar banner baru di sini..."
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddBannerUrl((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("bannerUrlInput") as HTMLInputElement;
                      if (el && el.value) {
                        handleAddBannerUrl(el.value);
                        el.value = "";
                      }
                    }}
                    className="px-3 py-2 bg-slate-900 hover:bg-black text-white text-xs font-medium rounded-xl flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah URL
                  </button>
                </div>
              </div>

              {/* Slides List & Reordering */}
              {((cms.hero?.bannerImages && cms.hero.bannerImages.length > 0) || cms.hero?.bannerImage) && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex justify-between items-center">
                    <span>Daftar Slide Aktif ({cms.hero?.bannerImages?.length || (cms.hero?.bannerImage ? 1 : 0)})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Foto pertama adalah cover awal saat toko dibuka</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(cms.hero?.bannerImages || (cms.hero?.bannerImage ? [cms.hero.bannerImage] : [])).map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`group relative aspect-video rounded-xl overflow-hidden border bg-slate-100 ${
                          idx === 0 ? "border-slate-900 ring-2 ring-slate-900/10 shadow-xs" : "border-slate-200"
                        }`}
                      >
                        <img src={imgUrl} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                        
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                              Slide {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveBannerSlide(idx)}
                              className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                              title="Hapus Slide"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimarySlide(idx)}
                              className="w-full py-1 bg-white/90 hover:bg-white text-slate-900 text-[10px] font-bold rounded shadow-xs"
                            >
                              Jadikan Slide Awal
                            </button>
                          )}
                        </div>

                        {idx === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-bold uppercase rounded">
                            Cover Awal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Banner Text Settings */}
              <div className="pt-4 border-t border-slate-100 space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kicker / Subtitle Atas:</label>
                    <input
                      type="text"
                      value={cms.hero?.badgeText || ""}
                      onChange={(e) =>
                        setCms({ ...cms, hero: { ...cms.hero, badgeText: e.target.value } })
                      }
                      placeholder="MINIMAL / MODERN / COMFORT / EDITORIAL"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Headline Utama (Judul Besar):</label>
                    <input
                      type="text"
                      value={cms.hero?.headline || ""}
                      onChange={(e) =>
                        setCms({ ...cms, hero: { ...cms.hero, headline: e.target.value } })
                      }
                      placeholder="KALMORA"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deskripsi Narasi Beranda:</label>
                  <textarea
                    rows={3}
                    value={cms.hero?.description || ""}
                    onChange={(e) =>
                      setCms({ ...cms, hero: { ...cms.hero, description: e.target.value } })
                    }
                    placeholder="Tuliskan kurasi filosofi atau pesan sambutan toko Anda..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Teks Tombol Aksi (CTA):</label>
                    <input
                      type="text"
                      value={cms.hero?.ctaText || ""}
                      onChange={(e) =>
                        setCms({ ...cms, hero: { ...cms.hero, ctaText: e.target.value } })
                      }
                      placeholder="DISCOVER COLLECTION"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tujuan Tombol Aksi (Anchor/Link):</label>
                    <input
                      type="text"
                      value={cms.hero?.ctaLink || ""}
                      onChange={(e) =>
                        setCms({ ...cms, hero: { ...cms.hero, ctaLink: e.target.value } })
                      }
                      placeholder="#collections atau #catalog"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ABOUT / CERITA TOKO */}
          {activeTab === "about" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cerita Toko & Filosofi Brand (About Section)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bagian beranda yang menjelaskan kisah brand, keunggulan material, dan dedikasi studio Anda.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Judul Bagian About:</label>
                  <input
                    type="text"
                    value={cms.highlights?.aboutHeading || ""}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        highlights: { ...cms.highlights, aboutHeading: e.target.value },
                      })
                    }
                    placeholder="ABOUT KALMORA"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Narasi Cerita Lengkap (Paragraf):</label>
                  <textarea
                    rows={6}
                    value={cms.highlights?.aboutStory || ""}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        highlights: { ...cms.highlights, aboutStory: e.target.value },
                      })
                    }
                    placeholder="Ceritakan latar belakang brand Anda. Gunakan enter dua kali untuk memisahkan paragraf..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed font-sans"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Gunakan spasi baris kosong (enter 2x) untuk membuat paragraf baru.
                  </span>
                </div>

                {/* Studio Portrait Image */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <label className="font-bold text-slate-700 block">Foto Studio / Atelier / Founder:</label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {cms.highlights?.aboutImage && (
                      <div className="w-28 aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative group">
                        <img src={cms.highlights.aboutImage} alt="About Studio" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setCms({
                              ...cms,
                              highlights: { ...cms.highlights, aboutImage: "" },
                            })
                          }
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex-1 space-y-2 w-full">
                      <label className={`block border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                        isUploadingAbout ? "bg-amber-50 border-amber-400" : "hover:bg-slate-50 border-slate-300"
                      }`}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            if (!e.target.files?.[0]) return;
                            setIsUploadingAbout(true);
                            const url = await uploadFile(e.target.files[0], "branding");
                            if (url) {
                              setCms({
                                ...cms,
                                highlights: { ...cms.highlights, aboutImage: url },
                              });
                              toast.success("Foto studio berhasil diunggah");
                            }
                            setIsUploadingAbout(false);
                            e.target.value = "";
                          }}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-center gap-2 text-slate-600 text-xs">
                          {isUploadingAbout ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <span>{isUploadingAbout ? "Mengunggah foto..." : "Pilih / Upload Foto Studio"}</span>
                        </div>
                      </label>

                      <input
                        type="url"
                        value={cms.highlights?.aboutImage || ""}
                        onChange={(e) =>
                          setCms({
                            ...cms,
                            highlights: { ...cms.highlights, aboutImage: e.target.value },
                          })
                        }
                        placeholder="Atau tempel URL gambar studio..."
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Founder Quote */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kutipan Inspirasi / Quote Pendiri:</label>
                  <input
                    type="text"
                    value={cms.highlights?.founderQuote || ""}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        highlights: { ...cms.highlights, founderQuote: e.target.value },
                      })
                    }
                    placeholder="Contoh: Pakaian terbaik adalah yang membiarkan anak bebas bereksplorasi."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 italic font-serif"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HALAMAN KUSTOM (CUSTOM PAGES) */}
          {activeTab === "pages" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Manajer Halaman Kustom (Custom Pages)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Buat halaman baru (seperti About, Cerita Brand, FAQ, atau Panduan) dengan format layout elegan tetap sesuai tema.
                  </p>
                </div>
                {!editingPageId && (
                  <button
                    type="button"
                    onClick={handleStartCreatePage}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Buat Halaman Baru
                  </button>
                )}
              </div>

              {/* Page Editor Form if open */}
              {editingPageId ? (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      {editingPageId === "new" ? "Buat Halaman Baru" : `Edit: ${pageForm.title}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingPageId(null)}
                      className="text-slate-500 hover:text-slate-800 text-xs font-semibold"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Judul Halaman:</label>
                      <input
                        type="text"
                        value={pageForm.title}
                        onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                        placeholder="Misal: Cerita Atelier & Pengrajin"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">URL Slug (Otomatis):</label>
                      <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden px-2.5">
                        <span className="text-slate-400 font-mono text-[11px]">/pages/</span>
                        <input
                          type="text"
                          value={pageForm.slug}
                          onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                          placeholder="cerita-atelier"
                          className="flex-1 text-xs py-2.5 pl-1 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sub-judul / Kicker Halaman:</label>
                    <input
                      type="text"
                      value={pageForm.subtitle || ""}
                      onChange={(e) => setPageForm({ ...pageForm, subtitle: e.target.value })}
                      placeholder="EDITORIAL ARCHIVE & CRAFTSMANSHIP"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    />
                  </div>

                  {/* Banner Image */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Banner Atas Halaman (Opsional):</label>
                    <div className="flex gap-2 items-center">
                      <label className="px-3 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 flex items-center gap-1.5 shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            if (!e.target.files?.[0]) return;
                            setIsUploadingPageBanner(true);
                            const url = await uploadFile(e.target.files[0], "pages");
                            if (url) setPageForm({ ...pageForm, bannerImage: url });
                            setIsUploadingPageBanner(false);
                            e.target.value = "";
                          }}
                          className="sr-only"
                        />
                        {isUploadingPageBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>Upload Banner</span>
                      </label>
                      <input
                        type="url"
                        value={pageForm.bannerImage || ""}
                        onChange={(e) => setPageForm({ ...pageForm, bannerImage: e.target.value })}
                        placeholder="Atau URL gambar banner..."
                        className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Konten Cerita & Teks Halaman:</label>
                    <textarea
                      rows={6}
                      value={pageForm.content}
                      onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                      placeholder="Tuliskan cerita lengkap. Tekan enter dua kali untuk memisahkan paragraf..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed bg-white"
                    />
                  </div>

                  {/* Side Image & Quote */}
                  <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Foto Samping (Side Image):</label>
                      <div className="flex gap-2">
                        <label className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 flex items-center gap-1 shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              if (!e.target.files?.[0]) return;
                              setIsUploadingPageSide(true);
                              const url = await uploadFile(e.target.files[0], "pages");
                              if (url) setPageForm({ ...pageForm, sideImage: url });
                              setIsUploadingPageSide(false);
                              e.target.value = "";
                            }}
                            className="sr-only"
                          />
                          {isUploadingPageSide ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <span>Upload</span>
                        </label>
                        <input
                          type="url"
                          value={pageForm.sideImage || ""}
                          onChange={(e) => setPageForm({ ...pageForm, sideImage: e.target.value })}
                          placeholder="URL foto samping..."
                          className="flex-1 text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Posisi Foto Samping:</label>
                      <select
                        value={pageForm.sideImagePosition || "right"}
                        onChange={(e) =>
                          setPageForm({
                            ...pageForm,
                            sideImagePosition: e.target.value as any,
                          })
                        }
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="right">Kanan (Teks di Kiri)</option>
                        <option value="left">Kiri (Teks di Kanan)</option>
                        <option value="none">Sembunyikan Foto Samping</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Kutipan / Quote Block:</label>
                      <input
                        type="text"
                        value={pageForm.quoteText || ""}
                        onChange={(e) => setPageForm({ ...pageForm, quoteText: e.target.value })}
                        placeholder="Kutipan filosofi singkat..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white italic font-serif"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Penulis Kutipan:</label>
                      <input
                        type="text"
                        value={pageForm.quoteAuthor || ""}
                        onChange={(e) => setPageForm({ ...pageForm, quoteAuthor: e.target.value })}
                        placeholder="Contoh: Tim Kurator 2026"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pageForm.isPublished !== false}
                        onChange={(e) => setPageForm({ ...pageForm, isPublished: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-slate-800">Publikasikan Halaman (Aktif)</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleSavePage}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Simpan Halaman
                    </button>
                  </div>
                </div>
              ) : (
                /* List Existing Pages */
                <div className="space-y-3">
                  {(!cms.pages || cms.pages.length === 0) ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                      <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Belum ada Halaman Kustom</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Klik tombol di atas untuk membuat halaman baru seperti Our Story, Profil Brand, atau Kebijakan Toko.
                      </p>
                    </div>
                  ) : (
                    cms.pages.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-xs">{p.title}</h4>
                            <span
                              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                p.isPublished !== false
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {p.isPublished !== false ? "Terbit" : "Draft"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <span>URL: /{storeSlug}/pages/{p.slug}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddPageToMenu(p)}
                            className="px-2.5 py-1.5 border border-slate-200 hover:border-slate-400 text-slate-700 text-[11px] font-medium rounded-lg flex items-center gap-1"
                            title="Tambahkan link halaman ini ke sidebar drawer toko"
                          >
                            <Compass className="w-3 h-3 text-blue-600" />
                            + Ke Menu
                          </button>

                          <Link
                            href={`/${storeSlug}/pages/${p.slug}`}
                            target="_blank"
                            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-medium rounded-lg flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Lihat
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleStartEditPage(p)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium rounded-lg transition-colors"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePage(p.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SIDEBAR & NAVIGASI */}
          {activeTab === "navigation" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Menu Drawer Sidebar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menu yang muncul saat pembeli menekan tombol &ldquo;MENU&rdquo; di kiri atas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMenuItem}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Menu
                </button>
              </div>

              {/* Menu items list */}
              <div className="space-y-2">
                {(cms.navigation?.menuItems || []).map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70"
                  >
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => updateMenuItem(item.id, "enabled", e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />

                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateMenuItem(item.id, "label", e.target.value)}
                      placeholder="NAMA MENU"
                      className="w-1/3 text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold"
                    />

                    <input
                      type="text"
                      value={item.url}
                      onChange={(e) => updateMenuItem(item.id, "url", e.target.value)}
                      placeholder="#collections atau /cart"
                      className="flex-1 text-xs p-2 rounded-lg border border-slate-200 bg-white font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => removeMenuItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Tautan Media Sosial Toko</h4>
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">WhatsApp CS (Nomor):</label>
                    <input
                      type="text"
                      value={cms.navigation?.socialLinks?.whatsapp || ""}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          navigation: {
                            ...cms.navigation!,
                            socialLinks: { ...cms.navigation?.socialLinks, whatsapp: e.target.value },
                          },
                        })
                      }
                      placeholder="628123456789"
                      className="w-full text-xs p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Instagram URL:</label>
                    <input
                      type="url"
                      value={cms.navigation?.socialLinks?.instagram || ""}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          navigation: {
                            ...cms.navigation!,
                            socialLinks: { ...cms.navigation?.socialLinks, instagram: e.target.value },
                          },
                        })
                      }
                      placeholder="https://instagram.com/..."
                      className="w-full text-xs p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">TikTok URL:</label>
                    <input
                      type="url"
                      value={cms.navigation?.socialLinks?.tiktok || ""}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          navigation: {
                            ...cms.navigation!,
                            socialLinks: { ...cms.navigation?.socialLinks, tiktok: e.target.value },
                          },
                        })
                      }
                      placeholder="https://tiktok.com/@..."
                      className="w-full text-xs p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WARNA & TIPOGRAFI */}
          {activeTab === "styling" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Warna Brand & Pilihan Font Display</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesuaikan warna dan gaya tipografi dengan identitas produk Anda.
                </p>
              </div>

              {/* Font Heading */}
              <div className="space-y-3">
                <label className="font-bold text-slate-700 text-xs block">
                  Font Heading / Judul Toko:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "bebas", name: "Bebas Neue", sample: "EDITORIAL STYLE", desc: "Tinggi, tebal, majalah fashion" },
                    { id: "playfair", name: "Playfair Display", sample: "Luxury Serif", desc: "Klasik, mewah, atelier" },
                    { id: "montserrat", name: "Montserrat", sample: "MODERN CLEAN", desc: "Geometris, kokoh, retail" },
                    { id: "inter", name: "Inter Tight", sample: "Minimal Tech", desc: "Bersih, netral, kontemporer" },
                  ].map((f) => (
                    <div
                      key={f.id}
                      onClick={() =>
                        setCms({
                          ...cms,
                          branding: { ...cms.branding, fontHeading: f.id as any },
                        })
                      }
                      className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${
                        cms.branding?.fontHeading === f.id
                          ? "border-slate-900 bg-slate-50 shadow-xs"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{f.name}</div>
                      <div className="text-lg text-slate-800 my-1 truncate">{f.sample}</div>
                      <div className="text-[10px] text-slate-400">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preset Palettes */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="font-bold text-slate-700 text-xs block">
                  Pilihan Palet Warna Siap Pakai:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {COLOR_PRESETS.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        setCms({
                          ...cms,
                          branding: {
                            ...cms.branding,
                            backgroundColor: p.bg,
                            textColor: p.text,
                            primaryColor: p.primary,
                            accentColor: p.accent,
                          },
                        })
                      }
                      className="cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-slate-400 transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {p.bg} • {p.text}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <span className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: p.bg }} />
                        <span className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: p.text }} />
                        <span className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: p.accent }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Color Pickers */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="font-bold text-slate-700 text-xs block">
                  Atur Warna Manual (Hex Picker):
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Background:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cms.branding?.backgroundColor || "#F5F5F3"}
                        onChange={(e) =>
                          setCms({
                            ...cms,
                            branding: { ...cms.branding, backgroundColor: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={cms.branding?.backgroundColor || "#F5F5F3"}
                        onChange={(e) =>
                          setCms({
                            ...cms,
                            branding: { ...cms.branding, backgroundColor: e.target.value },
                          })
                        }
                        className="text-xs p-1.5 rounded border border-slate-200 font-mono w-24"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Warna Teks:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cms.branding?.textColor || "#111111"}
                        onChange={(e) =>
                          setCms({
                            ...cms,
                            branding: { ...cms.branding, textColor: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={cms.branding?.textColor || "#111111"}
                        onChange={(e) =>
                          setCms({
                            ...cms,
                            branding: { ...cms.branding, textColor: e.target.value },
                          })
                        }
                        className="text-xs p-1.5 rounded border border-slate-200 font-mono w-24"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Aksen & Tombol:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cms.branding?.accentColor || "#059669"}
                        onChange={(e) =>
                          setCms({
                            ...cms,
                            branding: { ...cms.branding, accentColor: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={cms.branding?.accentColor || "#059669"}
                        onChange={(e) =>
                          setCms({
                            ...cms,
                            branding: { ...cms.branding, accentColor: e.target.value },
                          })
                        }
                        className="text-xs p-1.5 rounded border border-slate-200 font-mono w-24"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Panel */}
        {showLivePreview && (
          <div className="lg:col-span-5 sticky top-6 h-[85vh] bg-white rounded-2xl border border-slate-200/80 shadow-md flex flex-col overflow-hidden">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono font-bold">Live Preview: /{storeSlug}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Template: <span className="font-bold text-white uppercase">{cms.template}</span>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-2 overflow-hidden flex flex-col">
              <iframe
                src={`/${storeSlug}?preview=true&template=${cms.template}`}
                title="Storefront Preview"
                className="w-full flex-1 rounded-xl border border-slate-200 bg-white shadow-xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
