'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { ArrowLeft, Sparkles, Store, CheckCircle2, Rocket, ArrowRight } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    storeName: '',
    storeSlug: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: '',
    productName: '',
    productPrice: 150000,
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
      sample_products: formData.productName
        ? [
            {
              title: formData.productName,
              price: formData.productPrice,
            },
          ]
        : [],
    };

    try {
      const res = await fetchApi('/merchants/onboard', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setLoading(false);

      if (res?.success && res?.store) {
        const authResult = await signIn('credentials', {
          email: formData.ownerEmail,
          password: formData.password,
          redirect: false,
        });

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const storefrontUrl = res.store.storefront_url && !res.store.storefront_url.includes('localhost:3000')
          ? res.store.storefront_url
          : `${origin}/${res.store.slug}`;

        setCreatedStore({
          ...res.store,
          storefront_url: storefrontUrl,
          autoLoginFailed: Boolean(authResult?.error),
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <Rocket className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-extrabold mb-2">Toko Anda Siap Digunakan!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Selamat, toko online <span className="text-emerald-400 font-semibold">{createdStore.name}</span> berhasil dibangun dalam waktu kurang dari 60 detik.
          </p>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-left text-xs space-y-2 mb-8 font-mono">
            <div className="text-slate-500">Alamat Storefront Publik:</div>
            <a
              href={`/${createdStore.slug}`}
              className="text-emerald-400 font-bold break-all hover:underline block"
            >
              {createdStore.storefront_url}
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/${createdStore.slug}`}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              Lihat Toko Sekarang <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={createdStore.autoLoginFailed ? '/login' : '/dashboard'}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl text-sm transition-all"
            >
              {createdStore.autoLoginFailed ? 'Login ke Merchant Dashboard' : 'Buka Merchant Dashboard'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Utama
        </Link>

        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> 60-Second Onboarding Wizard
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Mulai Jualan dengan ALURELAB
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Isi formulir singkat ini dan toko multi-tenant bertenaga AI Anda akan aktif seketika.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-emerald-400">
              <Store className="w-4 h-4" /> 1. Identitas Toko
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Toko</label>
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
                  className="w-full bg-slate-950 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Subdomain Toko</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="kopi-senja"
                    value={formData.storeSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs px-3.5 py-2.5 rounded-l-xl text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                   <span className="bg-slate-800 border border-l-0 border-slate-800 text-[11px] text-slate-400 px-3 py-2.5 rounded-r-xl select-none font-mono">
                     app.alurelab.com/
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
              2. Akun Pemilik (Owner)
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Nama pemilik"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="email@bisnis.com"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Kata Sandi (Password)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimal 8 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
              3. Produk Pertama Anda (Opsional)
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Produk</label>
                <input
                  type="text"
                  placeholder="Contoh: Biji Kopi Arabika 250gr"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Harga Produk (Rp)</label>
                <input
                  type="number"
                  placeholder="150000"
                  value={formData.productPrice}
                  onChange={(e) => setFormData({ ...formData, productPrice: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Membangun Toko dalam 60 Detik...' : 'Buat & Luncurkan Toko Sekarang 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
