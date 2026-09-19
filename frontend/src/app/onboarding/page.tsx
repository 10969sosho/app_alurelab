'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Sparkles, Store, Rocket, ArrowRight } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    storeName: '',
    storeSlug: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [createdStore, setCreatedStore] = useState<any>(null);

  const handleSlugChange = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    setFormData((prev) => ({ ...prev, storeSlug: slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      store_name: formData.storeName,
      store_slug: formData.storeSlug,
      owner_name: formData.ownerName,
      owner_email: formData.ownerEmail,
      owner_phone: formData.ownerPhone,
      password: formData.password,
    };

    try {
      const res = await fetchApi('/merchants/onboard', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setLoading(false);

      if (res?.success && res?.store) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const storefrontUrl = res.store.storefront_url && !res.store.storefront_url.includes('localhost:3000')
          ? res.store.storefront_url
          : `${origin}/${res.store.slug}`;

        setCreatedStore({
          ...res.store,
          storefront_url: storefrontUrl,
          ownerEmail: formData.ownerEmail,
        });
      } else {
        alert(res?.message || 'Gagal membuat toko. Pastikan email dan slug toko belum pernah terdaftar.');
      }
    } catch (err: any) {
      setLoading(false);
      alert(err?.message || 'Gagal menghubungi server pendaftaran toko.');
    }
  };

  if (createdStore) {
    return (
      <div className="min-h-screen bg-offwhite text-charcoal-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none bg-grid-lines opacity-[0.3]" />
        
        <div className="max-w-lg w-full bg-white border border-cloud rounded-lg p-8 md:p-10 text-center shadow-soft relative z-10">
          <div className="w-16 h-16 bg-offwhite border border-cloud rounded-full flex items-center justify-center mx-auto mb-6 text-charcoal-900 shadow-lime-glow">
            <Rocket className="w-7 h-7 stroke-[1.5]" />
          </div>

          <h2 className="text-2xl font-semibold mb-2">Cek Email Anda</h2>
          <p className="body-text text-sm mb-6">
            Toko <span className="text-charcoal-900 font-semibold">{createdStore.name}</span> berhasil dibuat. Buka link verifikasi yang dikirim ke <span className="text-charcoal-900 font-semibold">{createdStore.ownerEmail}</span>, lalu login untuk masuk ke dashboard seller.
          </p>

          <div className="bg-offwhite border border-cloud p-4 rounded-sm text-left text-xs space-y-2 mb-8 font-mono">
            <div className="micro-label">Alamat Storefront Publik:</div>
            <a
              href={`/${createdStore.slug}`}
              className="text-charcoal-900 font-bold break-all hover:underline block text-sm"
            >
              {createdStore.storefront_url}
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/${createdStore.slug}`}
              className="btn-primary w-full py-3"
            >
              Lihat Toko Sekarang <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              href="/login"
              className="btn-secondary w-full py-3"
            >
              Login ke Dashboard Seller
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite text-charcoal-900 py-12 px-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none bg-grid-lines opacity-[0.3]" />
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lime-accent to-transparent opacity-30"></div>

      <div className="max-w-2xl mx-auto relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-darkgray hover:text-charcoal-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> KEMBALI KE BERANDA
        </Link>

        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 micro-label text-charcoal-900 bg-white px-3 py-1.5 rounded-sm border border-cloud mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> 60-Second Onboarding Wizard
          </span>
          <h1 className="h2-text text-charcoal-900 mb-2">
            Mulai Jualan dengan ALURELAB
          </h1>
          <p className="body-text text-sm">
            Isi formulir singkat ini dan toko multi-tenant bertenaga AI Anda akan aktif seketika.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-cloud rounded-lg p-6 md:p-10 space-y-8 shadow-soft">
          <div className="space-y-4">
            <h2 className="micro-label border-b border-cloud pb-2 flex items-center gap-2 text-charcoal-900 font-semibold">
              <Store className="w-4 h-4" /> 1. IDENTITAS TOKO
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="micro-label block mb-1.5">Nama Toko</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Senja Abadi"
                  value={formData.storeName}
                  onChange={(e) => {
                    setFormData({ ...formData, storeName: e.target.value });
                    if (!formData.storeSlug) {
                      handleSlugChange(e.target.value);
                    }
                  }}
                  className="w-full bg-offwhite border border-cloud text-sm px-3.5 py-2.5 rounded-sm text-charcoal-900 focus:border-charcoal-900 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="micro-label block mb-1.5">Subdomain Toko</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="kopi-senja"
                    value={formData.storeSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="w-full bg-offwhite border border-cloud text-sm px-3.5 py-2.5 rounded-l-sm text-charcoal-900 focus:border-charcoal-900 focus:outline-none font-mono"
                  />
                  <span className="bg-white border border-l-0 border-cloud text-[11px] text-mediumgray px-3 py-2.5 rounded-r-sm select-none font-mono">
                    .alurelab.com
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-cloud">
            <h2 className="micro-label border-b border-cloud pb-2 text-charcoal-900 font-semibold">
              2. AKUN PEMILIK (OWNER)
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="micro-label block mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Nama pemilik"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full bg-offwhite border border-cloud text-sm px-3.5 py-2.5 rounded-sm text-charcoal-900 focus:border-charcoal-900 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="micro-label block mb-1.5">Nomor WhatsApp</label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="w-full bg-offwhite border border-cloud text-sm px-3.5 py-2.5 rounded-sm text-charcoal-900 focus:border-charcoal-900 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="micro-label block mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  placeholder="email@bisnis.com"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  className="w-full bg-offwhite border border-cloud text-sm px-3.5 py-2.5 rounded-sm text-charcoal-900 focus:border-charcoal-900 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="micro-label block mb-1.5">Kata Sandi (Password)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimal 8 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-offwhite border border-cloud text-sm px-3.5 py-2.5 rounded-sm text-charcoal-900 focus:border-charcoal-900 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 text-sm"
          >
            {loading ? 'Membangun Toko dalam 60 Detik...' : 'Buat & Luncurkan Toko Sekarang 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
