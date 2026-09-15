'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Percent,
  Truck,
  Zap,
  Loader2,
  X,
} from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'voucher' | 'shipping'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minSpend, setMinSpend] = useState(50000);
  const [quota, setQuota] = useState(100);

  // Fetch promotions
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-promotions'],
    queryFn: async () => {
      const res = await api.get('/merchant/promotions');
      return res.data?.data || [];
    },
  });

  // Create promotion mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/merchant/promotions', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Promosi berhasil disimpan!');
      setIsCreateOpen(false);
      setName('');
      setCode('');
      setDiscountValue(10);
      setMinSpend(50000);
      setQuota(100);
      queryClient.invalidateQueries({ queryKey: ['merchant-promotions'] });
    },
    onError: () => {
      toast.error('Gagal menyimpan promosi');
    },
  });

  // Delete promotion mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/merchant/promotions/${id}`);
    },
    onSuccess: () => {
      toast.success('Promosi berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['merchant-promotions'] });
    },
    onError: () => {
      toast.error('Gagal menghapus promosi');
    },
  });

  const promotions = data || [];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Nama dan kode voucher wajib diisi');
      return;
    }
    saveMutation.mutate({
      name,
      code: code.toUpperCase().trim(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_spend: Number(minSpend),
      quota: Number(quota),
      is_active: true,
    });
  };

  return (
    <div className="space-y-3 select-none font-sans pb-10">
      {/* ─── 1. Header Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            Pusat Promosi
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tingkatkan omset toko dengan voucher diskon, gratis ongkir, dan promosi tematik
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#EE4D2D] hover:bg-[#d73f20] text-white text-xs font-semibold rounded-xs transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Buat Promo Baru</span>
        </button>
      </div>

      {/* ─── 2. Feature Cards (Promo Hub) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-slate-200 rounded-xs p-3.5 shadow-2xs hover:border-[#EE4D2D]/50 transition-colors cursor-pointer"
             onClick={() => setIsCreateOpen(true)}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-orange-50 text-[#EE4D2D] rounded-xs flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-xs">Voucher Toko</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Berikan potongan nominal atau persentase belanja untuk meningkatkan keranjang belanja pembeli.
          </p>
          <span className="text-[11px] font-semibold text-[#EE4D2D] mt-2.5 inline-block">
            + Buat Voucher &gt;
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xs p-3.5 shadow-2xs hover:border-emerald-500/50 transition-colors cursor-pointer"
             onClick={() => setIsCreateOpen(true)}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-xs flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-xs">Diskon Ongkos Kirim</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Tarik pembeli dari berbagai pulau dengan subsidi ongkir minimum belanja tertentu.
          </p>
          <span className="text-[11px] font-semibold text-emerald-600 mt-2.5 inline-block">
            + Buat Promo Ongkir &gt;
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xs p-3.5 shadow-2xs hover:border-purple-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-xs flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-xs">Flash Sale Toko</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Diskon kilat berbatas waktu untuk menghabiskan stok produk musiman dengan cepat.
          </p>
          <span className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-xs mt-2.5 inline-block">
            Tersedia di Storefront
          </span>
        </div>
      </div>

      {/* ─── 3. Promotions Table ─── */}
      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800">Daftar Promosi Aktif</h2>
          <span className="text-[11px] text-slate-400">Total {promotions.length} promosi</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#EE4D2D] mr-2" />
            <span className="text-xs">Memuat promosi...</span>
          </div>
        ) : promotions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <Tag className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-semibold text-slate-800">Belum ada promosi dibuat</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Buat voucher pertamamu untuk memikat pembeli di etalase toko.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAFAFA] border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 min-w-[180px]">Nama Promo & Kode</th>
                  <th className="px-3 py-2.5 min-w-[120px]">Potongan</th>
                  <th className="px-3 py-2.5 min-w-[120px]">Min. Belanja</th>
                  <th className="px-3 py-2.5 min-w-[110px]">Kuota / Dipakai</th>
                  <th className="px-3 py-2.5 min-w-[130px]">Periode</th>
                  <th className="px-3 py-2.5 min-w-[90px]">Status</th>
                  <th className="px-3 py-2.5 w-[80px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promotions.map((promo: any) => (
                  <tr key={promo.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-slate-800">{promo.name}</p>
                      <span className="inline-block px-2 py-0.5 bg-orange-50 text-[#EE4D2D] font-mono font-bold text-[10px] rounded-xs border border-orange-200 mt-0.5">
                        {promo.code}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 font-bold text-slate-900">
                      {promo.discount_type === 'percentage'
                        ? `${promo.discount_value}%`
                        : formatRupiah(Number(promo.discount_value))}
                    </td>

                    <td className="px-3 py-2.5 text-slate-600">
                      {formatRupiah(Number(promo.min_spend || 0))}
                    </td>

                    <td className="px-3 py-2.5 text-slate-700 font-mono">
                      {promo.used_count || 0} / {promo.quota || '∞'}
                    </td>

                    <td className="px-3 py-2.5 text-[11px] text-slate-500 font-mono">
                      {promo.start_date || 'Aktif'} s/d {promo.end_date || 'Seterusnya'}
                    </td>

                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        ● Aktif
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus voucher "${promo.name}"?`)) {
                            deleteMutation.mutate(promo.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-xs hover:bg-red-50 transition-colors"
                        title="Hapus Voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── 4. Modal Buat Voucher Baru ─── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xs border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs">Buat Voucher Toko Baru</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nama Promosi</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Diskon Gajian September"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kode Voucher</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="GAJIAN10"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xs uppercase font-mono outline-none focus:border-[#EE4D2D]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tipe Diskon</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Rupiah (Rp)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Nilai Diskon {discountType === 'percentage' ? '(%)' : '(Rp)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Min. Belanja (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={minSpend}
                    onChange={(e) => setMinSpend(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Kuota Pemakaian</label>
                <input
                  type="number"
                  min={1}
                  value={quota}
                  onChange={(e) => setQuota(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-1.5 bg-[#EE4D2D] hover:bg-[#d73f20] text-white font-semibold rounded-xs transition-colors disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
