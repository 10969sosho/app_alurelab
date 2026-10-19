"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Palette,
  Megaphone,
  Image as ImageIcon,
  Sparkles,
  BookOpen,
  Share2,
  Type,
  ExternalLink,
  SlidersHorizontal,
  ArrowUpRight,
} from "lucide-react";
import api from "@/lib/api";

const GUIDE_ITEMS = [
  {
    icon: Megaphone,
    title: "Header & Announcement Bar",
    desc: "Ubah teks pengumuman berjalan dan menu navigasi toko Anda.",
  },
  {
    icon: ImageIcon,
    title: "Hero Banner & Call-to-Action",
    desc: "Ganti foto banner, headline, subheadline, dan teks tombol belanja.",
  },
  {
    icon: Sparkles,
    title: "Featured Collection / Produk Unggulan",
    desc: "Pilih kategori produk yang tampil di bagian unggulan beranda.",
  },
  {
    icon: BookOpen,
    title: "Brand Story / Tentang Kami",
    desc: "Tulis cerita merek: judul bagian Tentang dan narasi toko Anda.",
  },
  {
    icon: Share2,
    title: "Footer & Social Media Links",
    desc: "Atur tautan Instagram, WhatsApp, dan TikTok di footer toko.",
  },
  {
    icon: Palette,
    title: "Palet Warna & Tipografi",
    desc: "Sesuaikan warna utama toko dan gaya font judul agar sesuai brand.",
  },
];

export default function StorefrontCmsPage() {
  const { data: session } = useSession();
  const storeSlug = (session as any)?.store?.slug || "";
  const storeName = (session as any)?.store?.name || "Toko Anda";

  const [banner, setBanner] = useState<string>("");
  const [storefrontName, setStorefrontName] = useState<string>("");

  useEffect(() => {
    api
      .get("/merchant/cms/settings")
      .then((res) => {
        const s = res.data?.data?.settings;
        if (!s) return;
        setBanner(s.hero?.bannerImage || s.hero?.bannerImages?.[0] || "");
        setStorefrontName(s.branding?.storeName || "");
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-5 pb-10 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            Tampilan Toko
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola tema storefront Anda seperti Shopify Online Store &gt; Themes.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
          <Palette className="w-3.5 h-3.5 text-lime-700" />
          1 Tema Terpasang
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        {/* ─── Current Theme Card ─── */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">Tema Aktif</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Tema Aktif
            </span>
          </div>

          {/* Theme thumbnail / preview banner */}
          <div className="p-5">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-[#111111] via-[#1c1c1c] to-[#2a2a2a] aspect-[16/7]">
              {banner ? (
                <img
                  src={banner}
                  alt="Preview tema toko"
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center px-6">
                  <span className="text-[#C8FF3D] text-2xl font-black tracking-tight">
                    {storefrontName || storeName || "ALURELAB"}
                  </span>
                  <span className="text-white/60 text-[11px] uppercase tracking-[0.25em]">
                    Modern storefront
                  </span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 rounded-full bg-black/50 backdrop-blur px-3 py-1 text-[10px] font-semibold text-white">
                Preview beranda toko
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">Alurelab Modern Theme v1.0</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Terakhir diperbarui otomatis • Default theme untuk semua toko ALURELAB
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/dashboard/cms/editor"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#111111] hover:bg-black text-[#FAFAF8] rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Sesuaikan Tema
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={storeSlug ? `/${storeSlug}` : "/"}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-400 hover:bg-[#FAFAF8] text-slate-700 rounded-xl text-xs font-semibold transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  Lihat Toko Publik
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Configuration Guide Card ─── */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-lime-700" />
            <p className="text-xs font-bold text-slate-700">
              Panduan Konfigurasi (Standar Shopify)
            </p>
          </div>

          <div className="p-3">
            <p className="px-2 text-[11px] text-slate-400 leading-relaxed mb-2">
              Buka <span className="font-semibold text-slate-600">Sesuaikan Tema</span> untuk
              mengubah bagian-bagian berikut secara langsung:
            </p>
            <ul className="space-y-1">
              {GUIDE_ITEMS.map((item) => (
                <li
                  key={item.title}
                  className="flex gap-3 rounded-xl px-2.5 py-2.5 hover:bg-[#FAFAF8] transition-colors"
                >
                  <span className="w-8 h-8 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-slate-500" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-800">
                      {item.title}
                    </span>
                    <span className="block text-[11px] text-slate-400 leading-snug mt-0.5">
                      {item.desc}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
