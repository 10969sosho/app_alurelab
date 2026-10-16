'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Globe,
  Loader2,
  Package,
  Palette,
  Truck,
} from 'lucide-react';
import api from '@/lib/api';

const GUIDE_STORAGE_KEY = 'alurelab_setup_guide_dismissed';

interface SetupGuideData {
  completed: number;
  total: number;
  percent: number;
  steps: Record<string, boolean>;
}

interface GuideCard {
  key: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const GUIDE_CARDS: GuideCard[] = [
  {
    key: 'products_added',
    title: 'Add your first product',
    description: 'Start with a title, price, and a photo.',
    ctaLabel: 'Tambah Produk',
    href: '/dashboard/products/new',
    icon: Package,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    key: 'design_chosen',
    title: 'Choose your store design',
    description: 'Pick a theme that fits your brand, then customize from there.',
    ctaLabel: 'Pilih Desain',
    href: '/dashboard/cms',
    icon: Palette,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    key: 'payments_configured',
    title: 'Set up payments',
    description: 'Choose a payment provider to let customers pay by QRIS, Virtual Account, or COD (DOKU).',
    ctaLabel: 'Aktivasi Pembayaran',
    href: '/dashboard/settings?tab=payment',
    icon: CreditCard,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    key: 'shipping_configured',
    title: 'Review shipping rates',
    description: 'Look over the defaults set up for you based on your location (Biteship).',
    ctaLabel: 'Atur Pengiriman',
    href: '/dashboard/settings?tab=address',
    icon: Truck,
    iconBg: 'bg-orange-50',
    iconColor: 'text-[#EE4D2D]',
  },
  {
    key: 'domain_connected',
    title: 'Get a custom domain',
    description: "Give your store a branded URL that's easy to find, trust, and remember.",
    ctaLabel: 'Atur Domain',
    href: '/dashboard/settings?tab=domain',
    icon: Globe,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
];

export function SetupGuide() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(GUIDE_STORAGE_KEY) === '1';
  });

  const { data, isLoading } = useQuery<SetupGuideData>({
    queryKey: ['merchant-setup-guide'],
    queryFn: () => api.get('/merchant/setup-guide').then((r) => r.data),
    retry: false,
  });

  const completed = data?.completed ?? 0;
  const total = data?.total ?? 5;
  const percent = data?.percent ?? 0;
  const allDone = completed >= total;

  const toggleDismiss = () => {
    const next = !dismissed;
    setDismissed(next);
    localStorage.setItem(GUIDE_STORAGE_KEY, next ? '1' : '0');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xs shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-xs font-bold text-slate-800 whitespace-nowrap">Panduan Penyiapan Toko</h2>
          {!isLoading && (
            <span className="text-[11px] text-slate-500 whitespace-nowrap">
              {completed} dari {total} selesai
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleDismiss}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            {dismissed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Tampilkan panduan
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Tutup panduan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {!dismissed && (
        <div className="px-3.5 pb-2.5">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                allDone ? 'bg-emerald-500' : percent >= 40 ? 'bg-[#EE4D2D]' : 'bg-amber-400'
              }`}
              style={{ width: `${isLoading ? 0 : percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Cards */}
      {!dismissed && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#EE4D2D] mr-2" />
              <span className="text-xs">Memuat panduan penyiapan...</span>
            </div>
          ) : (
            GUIDE_CARDS.map((card) => {
              const isDone = Boolean(data?.steps?.[card.key]);
              const Icon = card.icon;

              return (
                <div
                  key={card.key}
                  className={`flex items-start gap-3 px-3.5 py-3 transition-colors ${
                    isDone ? 'bg-emerald-50/30' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xs flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-emerald-100 text-emerald-600' : `${card.iconBg} ${card.iconColor}`
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-bold ${isDone ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {card.title}
                      </p>
                      {isDone && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-xs whitespace-nowrap">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Done
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{card.description}</p>
                  </div>

                  {!isDone && (
                    <Link
                      href={card.href}
                      className="shrink-0 text-[11px] font-bold text-[#EE4D2D] hover:underline whitespace-nowrap mt-0.5"
                    >
                      {card.ctaLabel} &gt;
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {allDone && !dismissed && (
        <div className="px-3.5 py-2.5 border-t border-emerald-100 bg-emerald-50/60">
          <p className="text-[11px] font-semibold text-emerald-700">
            🎉 Hebat! Semua langkah penyiapan toko Anda sudah selesai.
          </p>
        </div>
      )}
    </div>
  );
}
