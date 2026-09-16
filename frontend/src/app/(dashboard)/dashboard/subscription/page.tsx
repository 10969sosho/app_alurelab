'use client';

import { useState } from 'react';
import { Check, Crown, Rocket, Sparkles } from 'lucide-react';

const plans = [
  { name: 'Starter', price: '99.000', icon: Crown, features: ['50 produk', '200 pesanan/bulan', 'Storefront standar'] },
  { name: 'Pro', price: '249.000', icon: Sparkles, popular: true, features: ['Produk unlimited', 'Pesanan unlimited', 'Fitur AI dan custom domain'] },
  { name: 'Business', price: '599.000', icon: Rocket, features: ['Semua fitur Pro', 'AI prioritas', 'Custom domain + multi-store'] },
];

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Paket Langganan</h1>
        <p className="text-xs text-slate-400 mt-1">Pilih paket yang sesuai dengan pertumbuhan toko Anda.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <article key={plan.name} className={`relative bg-white border rounded-xs p-5 shadow-2xs ${plan.popular ? 'border-[#EE4D2D] ring-1 ring-[#EE4D2D]' : 'border-slate-200'}`}>
              {plan.popular && <span className="absolute -top-2.5 right-4 bg-[#EE4D2D] text-white text-[10px] font-bold px-2 py-1 rounded-xs">PALING POPULER</span>}
              <Icon className="w-5 h-5 text-[#EE4D2D] mb-3" />
              <h2 className="font-bold text-slate-800">{plan.name}</h2>
              <p className="mt-2 text-2xl font-bold text-slate-900">Rp {plan.price}<span className="text-xs font-normal text-slate-400"> / bulan</span></p>
              <ul className="mt-5 space-y-2 text-xs text-slate-600">
                {plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{feature}</li>)}
              </ul>
              <button
                type="button"
                onClick={() => setSelectedPlan(plan.name)}
                className="mt-6 w-full rounded-xs bg-[#EE4D2D] px-3 py-2 text-xs font-semibold text-white hover:bg-[#d73f20]"
              >
                Upgrade Paket
              </button>
            </article>
          );
        })}
      </div>

      {selectedPlan && (
        <div className="border border-amber-200 bg-amber-50 rounded-xs p-3 text-xs text-amber-800">
          Checkout {selectedPlan} via QRIS/Virtual Account belum tersedia karena API billing backend belum diimplementasikan.
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-xs p-4 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-800">Riwayat Pembayaran</h2>
        <p className="mt-2 text-xs text-slate-400">Belum ada pembayaran langganan.</p>
      </section>
    </div>
  );
}
