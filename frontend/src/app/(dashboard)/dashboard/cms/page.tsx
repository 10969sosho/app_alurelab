'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
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
} from 'lucide-react';
import api from '@/lib/api';
import { CmsSettings, NavMenuItem, CollectionCardSetting } from '@/components/templates/types';

const DEFAULT_EDITORIAL_CMS: CmsSettings = {
  template: 'editorial',
  branding: {
    storeName: 'KALMORA',
    tagline: 'Minimal Kidswear Curated for Modern Little Ones',
    fontHeading: 'bebas',
    fontBody: 'inter',
    primaryColor: '#111111',
    backgroundColor: '#F5F5F3',
    textColor: '#111111',
    accentColor: '#059669',
  },
  hero: {
    badgeText: 'MINIMAL / MODERN / COMFORT / EDITORIAL',
    headline: 'KALMORA',
    description: 'Pakaian anak kontemporer dengan potongan rileks, palet warna tenang, dan material bernapas yang nyaman untuk gerak bebas si kecil.',
    bannerImage: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1600&auto=format&fit=crop&q=80',
    ctaText: 'DISCOVER COLLECTION',
    ctaLink: '#catalog',
  },
  navigation: {
    menuItems: [
      { id: 'm1', label: 'HOME', url: '#top', enabled: true },
      { id: 'm2', label: 'COLLECTIONS', url: '#collections', enabled: true },
      { id: 'm3', label: 'CATALOG & PIECES', url: '#catalog', enabled: true },
      { id: 'm4', label: 'LOOKBOOK', url: '#lookbook', enabled: true },
      { id: 'm5', label: 'ABOUT THE CURATION', url: '#about', enabled: true },
      { id: 'm6', label: 'LACAK PESANAN', url: '?track=true', enabled: true },
      { id: 'm7', label: 'SHOPPING BAG', url: '/cart', enabled: true },
    ],
    socialLinks: {
      instagram: 'https://instagram.com/alurelab',
      whatsapp: '6281234567890',
      tiktok: 'https://tiktok.com/@alurelab',
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
    announcementText: '⚡ Garansi Pengiriman Cepat Multi-Kurir Biteship • Pembayaran Aman Berlisensi Xendit (PJP BI)',
    featuredCategory: 'Semua',
    collections: [
      {
        id: 'col-1',
        title: 'ESSENTIALS',
        subtitle: 'Clean everyday staples',
        category: 'ESSENTIALS',
        image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop&q=80',
        link: '#catalog',
      },
      {
        id: 'col-2',
        title: 'MONO SERIES',
        subtitle: 'Monochrome minimalist sets',
        category: 'MONO SERIES',
        image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&auto=format&fit=crop&q=80',
        link: '#catalog',
      },
      {
        id: 'col-3',
        title: 'SOFT DAILYWEAR',
        subtitle: 'Breathable lightweight knitwear',
        category: 'SOFT DAILYWEAR',
        image: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=800&auto=format&fit=crop&q=80',
        link: '#catalog',
      },
    ],
    aboutHeading: 'CURATED COMFORT FOR CURIOUS MINDS',
    aboutStory: 'Kami percaya gaya berpakaian anak tidak harus penuh motif berisik. Melalui siluet santai, tone warna natural, dan material katun bernapas, kami menghadirkan koleksi yang tenang, estetik, dan awet dipakai bertahun-tahun.',
    lookbookHeading: 'EDITORIAL AUTUMN / WINTER ARCHIVE',
    lookbookImages: [
      'https://images.unsplash.com/photo-1519238327474-7104db5765b8?w=800',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    ],
  },
};

const COLOR_PRESETS = [
  {
    name: 'Editorial Cream (Default L-Kids)',
    bg: '#F5F5F3',
    text: '#111111',
    primary: '#111111',
    accent: '#059669',
  },
  {
    name: 'Clean Monochrome Studio',
    bg: '#FFFFFF',
    text: '#000000',
    primary: '#000000',
    accent: '#2563EB',
  },
  {
    name: 'Warm Almond Minimalist',
    bg: '#F8F6F0',
    text: '#292524',
    primary: '#44403C',
    accent: '#D97706',
  },
  {
    name: 'Modern Slate & Emerald',
    bg: '#F1F5F9',
    text: '#0F172A',
    primary: '#0F172A',
    accent: '#10B981',
  },
];

export default function StorefrontCmsPage() {
  const { data: session } = useSession();
  const storeSlug = (session as any)?.store?.slug || 'kalmora';

  const [activeTab, setActiveTab] = useState<'template' | 'hero' | 'navigation' | 'sections' | 'styling'>('template');
  const [cms, setCms] = useState<CmsSettings>(DEFAULT_EDITORIAL_CMS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Load existing settings
  useEffect(() => {
    // 1. Check localStorage first for instant local persistence
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`alurelab_cms_${storeSlug}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setCms((prev) => ({ ...prev, ...parsed }));
        } catch (e) {
          // fallback
        }
      }
    }

    // 2. Fetch from backend API
    async function loadBackendSettings() {
      setLoading(true);
      try {
        const res = await api.get('/merchant/cms/settings');
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
            }));
          }
        }
      } catch (e) {
        // demo / local fallback
      } finally {
        setLoading(false);
      }
    }

    loadBackendSettings();
  }, [storeSlug]);

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save to local storage for instant sync across buyer storefront tabs
      if (typeof window !== 'undefined') {
        localStorage.setItem(`alurelab_cms_${storeSlug}`, JSON.stringify(cms));
      }

      // 2. Save to backend Laravel API
      await api.put('/merchant/cms/settings', {
        settings: cms,
      });

      toast.success('Konfigurasi tampilan toko berhasil disimpan & dipublikasikan!', {
        description: 'Storefront pembeli langsung terupdate.',
      });
    } catch (e: any) {
      // Even if API fails (e.g. offline/mock auth), local storage was saved
      toast.success('Tersimpan di sesi lokal toko!', {
        description: 'Perubahan sudah aktif di preview browser storefront Anda.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Kembalikan semua konfigurasi visual toko ke default bawaan?')) {
      setCms(DEFAULT_EDITORIAL_CMS);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`alurelab_cms_${storeSlug}`);
      }
      toast.info('Konfigurasi dikembalikan ke default editorial.');
    }
  };

  // Helper menu navigation
  const addMenuItem = () => {
    const newItem: NavMenuItem = {
      id: `menu-${Date.now()}`,
      label: 'MENU BARU',
      url: '#catalog',
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

  // Helper collection highlight card
  const updateCollectionCard = (index: number, field: keyof CollectionCardSetting, value: string) => {
    const currentCols = [...(cms.highlights?.collections || [])];
    if (currentCols[index]) {
      currentCols[index] = { ...currentCols[index], [field]: value };
      setCms({
        ...cms,
        highlights: {
          ...cms.highlights!,
          collections: currentCols,
        },
      });
    }
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
                Atur template, banner, susunan menu, highlight beranda, font, dan warna storefront toko Anda sesuka hati.
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
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              showLivePreview
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {showLivePreview ? 'Tutup Preview' : 'Split Preview'}
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
            {saving ? 'Menyimpan...' : 'Simpan & Publikasikan'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Control Tabs, Right Live Preview */}
      <div className={`grid gap-6 ${showLivePreview ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Editor Controls */}
        <div className={showLivePreview ? 'lg:col-span-7 space-y-6' : 'space-y-6'}>
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('template')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === 'template' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutTemplate className="w-4 h-4 text-emerald-600" />
              1. Pilih Template Base
            </button>

            <button
              onClick={() => setActiveTab('hero')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === 'hero' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              2. Banner & Hero
            </button>

            <button
              onClick={() => setActiveTab('navigation')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === 'navigation' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-600" />
              3. Sidebar & Navigasi
            </button>

            <button
              onClick={() => setActiveTab('sections')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === 'sections' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4 text-rose-600" />
              4. Highlight & Section
            </button>

            <button
              onClick={() => setActiveTab('styling')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === 'styling' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palette className="w-4 h-4 text-teal-600" />
              5. Warna & Font
            </button>
          </div>

          {/* TAB 1: BASE TEMPLATE SELECTION */}
          {activeTab === 'template' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pilih Desain Base Template</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan gaya visual pondasi toko Anda. Setelah memilih, seluruh teks, warna, gambar, dan navigasi tetap bisa dikustomisasi secara menyeluruh.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Template 1: L-Kids Editorial */}
                <div
                  onClick={() => setCms({ ...cms, template: 'editorial' })}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                    cms.template === 'editorial'
                      ? 'border-slate-900 bg-slate-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cms.template === 'editorial' && (
                    <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  )}
                  <div className="space-y-3">
                    <div className="h-28 rounded-xl bg-[#F5F5F3] border border-slate-200 flex flex-col justify-center items-center p-3 relative overflow-hidden">
                      <div className="text-2xl font-black text-slate-900 tracking-wider font-mono">KALMORA</div>
                      <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">EDITORIAL MINIMAL / BEBAS NEUE</div>
                      <div className="absolute bottom-2 right-2 text-[9px] bg-black text-white px-2 py-0.5 rounded font-mono">90px NAV</div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">L-Kids Editorial (Minimal Mag)</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Terinspirasi dari portofolio majalah mode anak kontemporer. Menggunakan tipografi display besar, header 90px minimal, side nav vertikal, foto berasio 3:4, dan palet off-white hangat.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                    <span>Rekomendasi: Fashion, Kidswear, Studio</span>
                    <span className="text-slate-900 font-bold">{cms.template === 'editorial' ? 'Terpilih' : 'Pilih'}</span>
                  </div>
                </div>

                {/* Template 2: Modern E-Commerce */}
                <div
                  onClick={() => setCms({ ...cms, template: 'modern' })}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                    cms.template === 'modern'
                      ? 'border-slate-900 bg-slate-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cms.template === 'modern' && (
                    <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
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
                        Tampilan toko online modern dengan search bar di header, pill filter kategori, kartu produk informatif dengan rating bintang, dan banner garansi terintegrasi.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                    <span>Rekomendasi: Gadget, Hijab, Sepatu, Retail</span>
                    <span className="text-slate-900 font-bold">{cms.template === 'modern' ? 'Terpilih' : 'Pilih'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HERO & BANNER */}
          {activeTab === 'hero' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hero Section & Banner Utama</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bagian pertama yang dilihat calon pembeli saat membuka beranda toko Anda.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gambar Banner / Foto Hero (URL):</label>
                  <input
                    type="url"
                    value={cms.hero?.bannerImage || ''}
                    onChange={(e) =>
                      setCms({ ...cms, hero: { ...cms.hero, bannerImage: e.target.value } })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                  {cms.hero?.bannerImage && (
                    <div className="mt-2 relative h-36 rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={cms.hero.bannerImage}
                        alt="Hero Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 text-white font-medium text-[11px]">
                        Pratinjau Foto Banner
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kicker / Subtitle Atas:</label>
                    <input
                      type="text"
                      value={cms.hero?.badgeText || ''}
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
                      value={cms.hero?.headline || ''}
                      onChange={(e) =>
                        setCms({ ...cms, hero: { ...cms.hero, headline: e.target.value } })
                      }
                      placeholder="KALMORA"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deskripsi Narasi Hero:</label>
                  <textarea
                    rows={3}
                    value={cms.hero?.description || ''}
                    onChange={(e) =>
                      setCms({ ...cms, hero: { ...cms.hero, description: e.target.value } })
                    }
                    placeholder="Tuliskan cerita kurasi produk dan daya tarik toko Anda..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Teks Tombol Aksi (CTA):</label>
                    <input
                      type="text"
                      value={cms.hero?.ctaText || ''}
                      onChange={(e) =>
                        setCms({ ...cms, hero: { ...cms.hero, ctaText: e.target.value } })
                      }
                      placeholder="DISCOVER COLLECTION"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tautan Tujuan CTA:</label>
                    <input
                      type="text"
                      value={cms.hero?.ctaLink || ''}
                      onChange={(e) =>
                        setCms({ ...cms, hero: { ...cms.hero, ctaLink: e.target.value } })
                      }
                      placeholder="#catalog atau /products/slug"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIDEBAR & NAVIGASI */}
          {activeTab === 'navigation' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sidebar & Menu Navigasi Drawer</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atur teks label, link tujuan (anchor atau halaman), dan toggle aktif/tidak untuk tiap menu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMenuItem}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-black"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Menu
                </button>
              </div>

              {/* Menu List Builder */}
              <div className="space-y-2.5">
                {(cms.navigation?.menuItems || []).map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3 text-xs"
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-200 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    <div className="flex-1 w-full sm:w-auto">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateMenuItem(item.id, 'label', e.target.value)}
                        placeholder="Label Menu"
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold"
                      />
                    </div>

                    <div className="flex-1 w-full sm:w-auto">
                      <input
                        type="text"
                        value={item.url}
                        onChange={(e) => updateMenuItem(item.id, 'url', e.target.value)}
                        placeholder="Link (#catalog, /cart, dll)"
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) => updateMenuItem(item.id, 'enabled', e.target.checked)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-0"
                        />
                        Aktif
                      </label>

                      <button
                        type="button"
                        onClick={() => removeMenuItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Media Links */}
              <div className="pt-4 border-t border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Tautan Media Sosial Toko:
                </h4>
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">WhatsApp CS:</label>
                    <input
                      type="text"
                      value={cms.navigation?.socialLinks?.whatsapp || ''}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          navigation: {
                            ...cms.navigation!,
                            socialLinks: { ...cms.navigation?.socialLinks, whatsapp: e.target.value },
                          },
                        })
                      }
                      placeholder="6281234567890"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Instagram URL:</label>
                    <input
                      type="text"
                      value={cms.navigation?.socialLinks?.instagram || ''}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          navigation: {
                            ...cms.navigation!,
                            socialLinks: { ...cms.navigation?.socialLinks, instagram: e.target.value },
                          },
                        })
                      }
                      placeholder="https://instagram.com/toko"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">TikTok URL:</label>
                    <input
                      type="text"
                      value={cms.navigation?.socialLinks?.tiktok || ''}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          navigation: {
                            ...cms.navigation!,
                            socialLinks: { ...cms.navigation?.socialLinks, tiktok: e.target.value },
                          },
                        })
                      }
                      placeholder="https://tiktok.com/@toko"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HIGHLIGHT & SECTION VISIBILITY */}
          {activeTab === 'sections' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Highlight Beranda & Kontrol Section</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan bagian mana saja yang ingin dimunculkan di halaman utama, serta edit kartu koleksi unggulan.
                </p>
              </div>

              {/* Announcement Bar */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Announcement Bar Atas (Pemberitahuan):</span>
                  <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cms.sections?.showAnnouncementBar ?? true}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          sections: { ...cms.sections, showAnnouncementBar: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-slate-900"
                    />
                    Tampilkan
                  </label>
                </div>
                <input
                  type="text"
                  value={cms.highlights?.announcementText || ''}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      highlights: { ...cms.highlights, announcementText: e.target.value },
                    })
                  }
                  placeholder="Tuliskan promo atau garansi toko..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              {/* Section Toggles */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-900">Toggle Section Beranda:</h4>
                <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
                  {[
                    { key: 'showHero', label: 'Hero Banner Utama' },
                    { key: 'showCollections', label: 'Grid Koleksi Unggulan (3 Kolom)' },
                    { key: 'showFeaturedProducts', label: 'Katalog & Daftar Produk' },
                    { key: 'showAbout', label: 'Kisah Filosofi / About Us' },
                    { key: 'showLookbook', label: 'Galeri Foto Lookbook' },
                    { key: 'showTrustGuarantee', label: 'Informasi Keamanan Escrow & Kontak' },
                  ].map((sec) => (
                    <label
                      key={sec.key}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-medium text-slate-800">{sec.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(cms.sections?.[sec.key as keyof typeof cms.sections] ?? true)}
                        onChange={(e) =>
                          setCms({
                            ...cms,
                            sections: { ...cms.sections, [sec.key]: e.target.checked },
                          })
                        }
                        className="rounded border-slate-300 text-slate-900 focus:ring-0"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 3 Featured Collection Cards */}
              <div className="space-y-3 pt-3 border-t border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-900">Koleksi Unggulan Beranda (3 Kolom):</h4>
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  {(cms.highlights?.collections || []).map((col, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-mono text-[10px] text-slate-500 font-bold block">
                        KARTU KOLEKSI {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={col.title}
                        onChange={(e) => updateCollectionCard(idx, 'title', e.target.value)}
                        placeholder="Judul Koleksi"
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                      />
                      <input
                        type="text"
                        value={col.subtitle}
                        onChange={(e) => updateCollectionCard(idx, 'subtitle', e.target.value)}
                        placeholder="Sub-judul"
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="url"
                        value={col.image}
                        onChange={(e) => updateCollectionCard(idx, 'image', e.target.value)}
                        placeholder="Foto URL (Unsplash)"
                        className="w-full text-[11px] p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WARNA & FONT */}
          {activeTab === 'styling' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tipografi & Palet Warna</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur font display karakter toko serta kombinasi warna background dan teks.
                </p>
              </div>

              {/* Font Selection */}
              <div className="space-y-3 text-xs">
                <label className="font-bold text-slate-700 block">Pilihan Font Display / Heading:</label>
                <div className="grid sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'bebas', name: 'Bebas Neue', desc: 'Rapat, Bold, Editorial L-Kids' },
                    { id: 'playfair', name: 'Playfair Display', desc: 'Klasik, Anggun, Luxury' },
                    { id: 'montserrat', name: 'Montserrat', desc: 'Modern, Geometris, Bersih' },
                    { id: 'inter', name: 'Inter Tight', desc: 'Minimalis, Tech, Modern' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        setCms({
                          ...cms,
                          branding: { ...cms.branding, fontHeading: f.id as any },
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        cms.branding?.fontHeading === f.id
                          ? 'border-slate-900 bg-slate-50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold text-slate-900 block text-sm">{f.name}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Palettes */}
              <div className="space-y-3 pt-3 border-t border-slate-200/80 text-xs">
                <label className="font-bold text-slate-700 block">Preset Palet Warna Instan:</label>
                <div className="grid sm:grid-cols-2 gap-2.5">
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
                      className="p-3 rounded-xl border border-slate-200 hover:border-slate-400 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Bg: {p.bg} • Teks: {p.text}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: p.bg }} />
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: p.text }} />
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: p.accent }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Manual Colors */}
              <div className="space-y-3 pt-3 border-t border-slate-200/80 text-xs">
                <label className="font-bold text-slate-700 block">Kustomisasi Warna Manual:</label>
                <div className="grid sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Background:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cms.branding?.backgroundColor || '#F5F5F3'}
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
                        value={cms.branding?.backgroundColor || '#F5F5F3'}
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
                        value={cms.branding?.textColor || '#111111'}
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
                        value={cms.branding?.textColor || '#111111'}
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
                    <label className="text-[11px] text-slate-600 block mb-1">Tombol & Aksen:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cms.branding?.accentColor || '#059669'}
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
                        value={cms.branding?.accentColor || '#059669'}
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
