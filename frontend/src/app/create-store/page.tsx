'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Store } from 'lucide-react';
import api, { STORE_SLUG_KEY } from '@/lib/api';

const CATEGORIES = [
  'Makanan & Minuman',
  'Fashion & Apparel',
  'Kecantikan & Perawatan',
  'Elektronik & Gadget',
  'Rumah & Living',
  'Kesehatan & Suplemen',
  'Olahraga & Outdoor',
  'Jasa & Digital',
  'Lainnya',
];

export default function CreateStorePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/create-store');
      return;
    }
    if (status === 'authenticated' && (session as any)?.store?.slug) {
      localStorage.setItem(STORE_SLUG_KEY, (session as any).store.slug);
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  const handleSlugChange = (val: string) => {
    setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await api.post('/stores', { name, slug, category });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Gagal membuat toko.');
      }

      const createdSlug = res.data.store.slug as string;
      localStorage.setItem(STORE_SLUG_KEY, createdSlug);

      toast.success('Toko berhasil dibuat! Mengalihkan ke dashboard...');

      // Perbarui sesi NextAuth agar session.store terisi sebelum masuk dashboard
      try {
        await updateSession();
      } catch {
        // fallback: dashboard layout akan memuat ulang sesi dari backend
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.response?.data?.errors?.slug?.[0] ??
        error?.response?.data?.errors?.name?.[0] ??
        error?.message ??
        'Gagal membuat toko. Coba lagi.';
      toast.error(msg);
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F6F6F6] flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-[#EE4D2D] mr-2" />
        <span className="text-xs">Memuat sesi...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F6] text-[#333333] font-sans px-4 py-10">
      <div className="max-w-lg mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> KEMBALI KE DASHBOARD
        </Link>

        <div className="bg-white border border-slate-200 rounded-xs shadow-2xs p-6 sm:p-8">
          <div className="text-center mb-7">
            <div className="w-12 h-12 bg-orange-50 text-[#EE4D2D] rounded-xs flex items-center justify-center mx-auto mb-4">
              <Store className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#EE4D2D] bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-xs mb-3">
              Buat Toko Baru
            </span>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Selamat datang, {session?.user?.name?.split(' ')[0] || 'Seller'}!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Akun Anda sudah siap. Buat toko pertama Anda untuk mulai berjualan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Nama Toko</label>
              <input
                type="text"
                required
                minLength={3}
                placeholder="Contoh: Kopi Senja"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) handleSlugChange(e.target.value);
                }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D] transition-colors"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Slug Toko (opsional)</label>
              <div className="flex items-stretch">
                <input
                  type="text"
                  placeholder="kopi-senja"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    handleSlugChange(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-l-xs outline-none focus:border-[#EE4D2D] font-mono"
                />
                <span className="inline-flex items-center bg-slate-50 border border-l-0 border-slate-300 text-[11px] text-slate-500 px-3 rounded-r-xs select-none font-mono whitespace-nowrap">
                  .alurelab.com
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Kosongkan saja untuk otomatis dibuatkan dari nama toko Anda.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Kategori Bisnis / Industri</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-2.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !name}
              className="w-full py-3 bg-[#EE4D2D] hover:bg-[#d73f20] text-white font-bold rounded-xs transition-colors disabled:opacity-50 shadow-2xs flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Membuat Toko...
                </>
              ) : (
                <>Buat Toko</>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center mt-5">
            Sudah punya toko lain? Toko baru akan ditambahkan ke akun Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
