'use client';

import { Suspense, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Check,
  Clock,
  Crown,
  Loader2,
  Rocket,
  Sparkles,
  Wallet,
} from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime, formatRupiah } from '@/lib/utils';

interface Plan {
  tier: string;
  name: string;
  amount: number;
  popular: boolean;
  features: string[];
}

interface ActivePlan {
  tier: string;
  name: string;
  amount: number;
  expires_at: string | null;
}

const PLAN_ICONS: Record<string, typeof Crown> = {
  starter: Crown,
  pro: Sparkles,
  business: Rocket,
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  pending: { label: 'Menunggu Bayar', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid: { label: 'Lunas', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: 'Gagal', color: 'bg-red-50 text-red-700 border-red-200' },
  expired: { label: 'Kedaluwarsa', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function SubscriptionContent() {
  const queryClient = useQueryClient();

  const { data: plansData, isLoading: isLoadingPlans, isError: isErrorPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => (await api.get('/merchant/subscription/plans')).data,
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['subscription-history'],
    queryFn: async () => (await api.get('/merchant/subscription/history')).data,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (plan: string) => (await api.post('/merchant/subscription/checkout', { plan })).data,
    onSuccess: (res) => {
      if (res?.payment_url) {
        window.location.assign(res.payment_url);
        return;
      }
      toast.error('Respons pembayaran tidak valid. Coba lagi.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal membuat tagihan langganan.');
    },
  });

  // Balikan dari DOKU Checkout: ?status=success | ?status=cancel
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('status');
    if (!status) return;

    if (status === 'success') {
      toast.success('Pembayaran langganan diterima. Paket toko Anda sedang diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history'] });
    } else {
      toast.info('Pembayaran langganan dibatalkan.');
    }
    window.history.replaceState(null, '', window.location.pathname);
  }, [queryClient]);

  const plans: Plan[] = plansData?.plans ?? [];
  const activePlan: ActivePlan | undefined = plansData?.active_plan;
  const subscriptions = historyData?.subscriptions ?? [];

  const rankOf = (tier: string) => plans.findIndex((plan) => plan.tier === tier);
  const activeRank = rankOf(activePlan?.tier ?? 'free');

  if (isLoadingPlans) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-[#111111] mr-2" />
        <span className="text-xs">Memuat paket langganan...</span>
      </div>
    );
  }

  if (isErrorPlans) {
    return <div className="p-6 text-sm text-slate-600">Data paket langganan belum tersedia.</div>;
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Paket Langganan</h1>
          <p className="text-xs text-slate-400 mt-1">Pilih paket yang sesuai dengan pertumbuhan toko Anda.</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-[#C8FF3D]/40 bg-[#C8FF3D]/15 px-3.5 py-1.5 text-xs font-semibold text-slate-900 shadow-sm">
          <Crown className="w-3.5 h-3.5 text-lime-700" />
          <span className="font-semibold text-slate-800">Paket Aktif: {activePlan?.name ?? 'Free'}</span>
          {activePlan?.expires_at && (
            <span className="text-[11px] text-slate-500">berlaku s/d {formatDateTime(activePlan.expires_at)}</span>
          )}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.tier] ?? Crown;
          const rank = rankOf(plan.tier);
          const isCurrent = plan.tier === activePlan?.tier;
          const isUpgrade = rank > activeRank;
          const label = isCurrent ? 'Paket Aktif' : isUpgrade ? 'Upgrade Paket' : 'Turunkan Paket';

          return (
            <article
              key={plan.tier}
              className={`relative bg-white border rounded-3xl p-6 shadow-sm transition-all hover:shadow-md ${
                plan.popular
                  ? 'border-[#C8FF3D] ring-2 ring-[#C8FF3D]/40'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-6 bg-[#C8FF3D] text-[#111111] text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  PALING POPULER
                </span>
              )}
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-lime-700" />
                {isCurrent && (
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    PAKET AKTIF
                  </span>
                )}
              </div>
              <h2 className="mt-3 font-bold text-slate-800">{plan.name}</h2>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatRupiah(plan.amount)}
                <span className="text-xs font-normal text-slate-400"> / bulan</span>
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={!isUpgrade || checkoutMutation.isPending}
                onClick={() => checkoutMutation.mutate(plan.tier)}
                className="mt-6 w-full rounded-full bg-[#C8FF3D] px-4 py-2.5 text-xs font-bold text-[#111111] hover:bg-[#b8f02e] transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:border disabled:border-slate-200 disabled:cursor-not-allowed"
              >
                {checkoutMutation.isPending && checkoutMutation.variables === plan.tier
                  ? 'Membuat tagihan...'
                  : label}
              </button>
            </article>
          );
        })}
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800">Riwayat Pembayaran</h2>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-[#111111] mr-2" />
            <span className="text-xs">Memuat riwayat langganan...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            <Wallet className="w-7 h-7 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-slate-700">Belum ada pembayaran langganan</p>
            <p className="mt-0.5 text-[11px]">Tagihan langganan yang dibayar akan tampil di sini.</p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAFAFA] border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 min-w-[160px]">Invoice</th>
                  <th className="px-3 py-2.5 min-w-[100px]">Paket</th>
                  <th className="px-3 py-2.5 min-w-[110px]">Nominal</th>
                  <th className="px-3 py-2.5 min-w-[110px]">Status</th>
                  <th className="px-3 py-2.5 min-w-[140px]">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub: any) => {
                  const badge = STATUS_BADGES[sub.status] ?? STATUS_BADGES.pending;
                  const Icon = sub.status === 'pending' ? Clock : sub.status === 'paid' ? Check : Clock;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">{sub.invoice_number}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800 capitalize">{sub.plan_tier}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">{formatRupiah(Number(sub.amount))}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${badge.color}`}>
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                        {formatDateTime(sub.paid_at || sub.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#111111] mr-2" />
          <span className="text-xs">Memuat langganan...</span>
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
