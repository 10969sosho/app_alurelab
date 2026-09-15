'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  ArrowDownLeft,
} from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';

export default function FinancePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'payouts' | 'transactions'>('payouts');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Withdraw form states
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankCode, setBankCode] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Fetch finance overview
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-finance'],
    queryFn: async () => {
      const res = await api.get('/merchant/finance');
      return res.data;
    },
  });

  const wallet = data?.wallet || {
    available_balance: 0,
    escrow_held_balance: 0,
    total_balance: 0,
  };

  const bankAccount = data?.bank_account || {
    bank_name: 'BCA',
    account_number: '8830192831',
    account_holder: 'Toko Alurelab',
  };

  const payouts = data?.payouts || [];
  const transactions = data?.transactions || [];

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/merchant/finance/withdraw', payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Penarikan dana berhasil diproses!');
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      queryClient.invalidateQueries({ queryKey: ['merchant-finance'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengajukan penarikan dana');
    },
  });

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt < 50000) {
      toast.error('Nominal penarikan minimal Rp 50.000');
      return;
    }
    if (amt > wallet.available_balance) {
      toast.error('Saldo siap ditarik tidak mencukupi');
      return;
    }

    withdrawMutation.mutate({
      amount: amt,
      bank_code: bankCode,
      account_number: accountNumber || bankAccount.account_number,
      account_holder_name: accountHolder || bankAccount.account_holder,
    });
  };

  return (
    <div className="space-y-3 select-none font-sans pb-10">
      {/* ─── 1. Header Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            Saldo Escrow & Kas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola pencairan dana penjualan dan transparansi escrow terproteksi
          </p>
        </div>

        <button
          type="button"
          disabled={wallet.available_balance < 50000}
          onClick={() => {
            setAccountNumber(bankAccount.account_number);
            setAccountHolder(bankAccount.account_holder);
            setIsWithdrawOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EE4D2D] hover:bg-[#d73f20] text-white text-xs font-semibold rounded-xs transition-colors shadow-2xs disabled:opacity-40 self-start sm:self-auto"
        >
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Tarik Dana ke Rekening</span>
        </button>
      </div>

      {/* ─── 2. Wallet Balance & Bank Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Available Balance */}
        <div className="bg-white border border-slate-200 rounded-xs p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Saldo Siap Ditarik</span>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-xs font-semibold">
              Bebas Dicairkan
            </span>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {formatRupiah(Number(wallet.available_balance))}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Penjualan dari pesanan yang sudah diterima pembeli
          </p>
        </div>

        {/* Escrow Held Balance */}
        <div className="bg-white border border-slate-200 rounded-xs p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Saldo Escrow Tertahan</span>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-xs font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Rekening Bersama
            </span>
          </div>
          <p className="text-xl font-bold text-blue-700">
            {formatRupiah(Number(wallet.escrow_held_balance))}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Otomatis dicairkan begitu kurir mengonfirmasi pesanan terkirim
          </p>
        </div>

        {/* Bank Account Info Card */}
        <div className="bg-white border border-slate-200 rounded-xs p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs mb-1">
              <Building2 className="w-3.5 h-3.5 text-[#EE4D2D]" />
              <span>Rekening Penarikan Utama</span>
            </div>
            <p className="text-xs font-semibold text-slate-900">
              {bankAccount.bank_name} — {bankAccount.account_number}
            </p>
            <p className="text-[10px] text-slate-500">a/n {bankAccount.account_holder}</p>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">
            Diproses instan via Xendit Disbursement
          </span>
        </div>
      </div>

      {/* ─── 3. History Tabs & Table ─── */}
      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
        {/* Tab Headers */}
        <div className="border-b border-slate-200 px-3 flex items-center gap-6 text-xs bg-[#FAFAFA]">
          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'payouts'
                ? 'border-[#EE4D2D] text-[#EE4D2D] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat Penarikan Dana ({payouts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'transactions'
                ? 'border-[#EE4D2D] text-[#EE4D2D] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Mutasi Transaksi Escrow ({transactions.length})
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#EE4D2D] mr-2" />
            <span className="text-xs">Memuat riwayat keuangan...</span>
          </div>
        ) : activeTab === 'payouts' ? (
          payouts.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-xs">
              <Clock className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-slate-700">Belum ada riwayat penarikan dana</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tarik saldo hasil penjualanmu kapan saja ke rekening bank lokal pilihan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAFA] border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 min-w-[140px]">Waktu Penarikan</th>
                    <th className="px-3 py-2.5 min-w-[150px]">Rekening Tujuan</th>
                    <th className="px-3 py-2.5 min-w-[120px]">Nominal Ditarik</th>
                    <th className="px-3 py-2.5 min-w-[90px]">Biaya Transfer</th>
                    <th className="px-3 py-2.5 min-w-[110px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                        {formatDateTime(item.created_at)}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-slate-800">
                          {item.bank_code} • {item.account_number}
                        </p>
                        <span className="text-[10px] text-slate-400">{item.account_holder_name}</span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {formatRupiah(Number(item.amount))}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 font-mono">
                        {formatRupiah(Number(item.fee_amount || 3000))}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Berhasil (Sukses)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          transactions.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-xs">
              <Wallet className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-slate-700">Belum ada mutasi saldo tercatat</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAFA] border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 min-w-[140px]">Waktu</th>
                    <th className="px-3 py-2.5 min-w-[180px]">Deskripsi</th>
                    <th className="px-3 py-2.5 min-w-[100px]">Tipe Mutasi</th>
                    <th className="px-3 py-2.5 min-w-[120px]">Nominal</th>
                    <th className="px-3 py-2.5 min-w-[130px]">Saldo Setelah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                        {formatDateTime(tx.created_at)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-800 font-medium">
                        {tx.description}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[10px] font-mono uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-xs">
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {formatRupiah(Number(tx.amount))}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">
                        {formatRupiah(Number(tx.balance_after))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ─── 4. Modal Tarik Dana ─── */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xs border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs">Penarikan Dana ke Rekening</h3>
              <button
                type="button"
                onClick={() => setIsWithdrawOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="p-4 space-y-3 text-xs">
              <div className="bg-orange-50/70 border border-orange-200 rounded-xs p-2.5">
                <p className="text-[11px] text-slate-600">
                  Saldo yang dapat ditarik: <strong className="text-slate-900">{formatRupiah(Number(wallet.available_balance))}</strong>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Minimal penarikan Rp 50.000 (Biaya kliring flat Rp 3.000)</p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Nominal Penarikan (Rp)</label>
                <input
                  type="number"
                  min={50000}
                  max={wallet.available_balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Contoh: 150000"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D] font-mono text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bank Tujuan</label>
                  <select
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                  >
                    <option value="BCA">BCA</option>
                    <option value="MANDIRI">Bank Mandiri</option>
                    <option value="BRI">BRI</option>
                    <option value="BNI">BNI</option>
                    <option value="BSI">BSI</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="8830192831"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D] font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Nama sesuai buku tabungan"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={withdrawMutation.isPending}
                  className="px-4 py-1.5 bg-[#EE4D2D] hover:bg-[#d73f20] text-white font-semibold rounded-xs transition-colors disabled:opacity-50"
                >
                  {withdrawMutation.isPending ? 'Memproses...' : 'Konfirmasi Tarik Dana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
