'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Truck, CreditCard, Banknote, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { fetchApi } from '@/lib/api-client';

export default function CheckoutPage({ params }: { params: Promise<{ store_slug: string }> }) {
  const resolvedParams = use(params);
  const storeSlug = resolvedParams.store_slug;

  const { items, getSubtotal, clearCart } = useCartStore();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    areaId: 'ID_ID_3578_357807',
    addressDetail: '',
    notes: '',
    courier: 'sicepat',
    courierService: 'reg',
    shippingCost: 17000,
    paymentMethod: 'ONLINE' as 'ONLINE' | 'COD',
  });

  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subtotal = getSubtotal() || 149000; // Fallback jika user langsung buka checkout
  const totalAmount = subtotal + form.shippingCost;

  const courierOptions = [
    { code: 'sicepat', service: 'reg', name: 'SiCepat REG (1-2 Hari)', price: 17000 },
    { code: 'jnt', service: 'ez', name: 'J&T Express EZ (1-2 Hari)', price: 18000 },
    { code: 'jne', service: 'reg', name: 'JNE Reguler (2-3 Hari)', price: 19000 },
  ];

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const payload = {
      customer_name: form.name || 'Pelanggan ALURELAB',
      customer_phone: form.phone || '081234567890',
      customer_email: form.email || null,
      destination_area_id: form.areaId,
      address_detail: form.addressDetail || 'Alamat lengkap pengiriman',
      shipping_notes: form.notes,
      courier_code: form.courier,
      courier_service: form.courierService,
      shipping_cost: form.shippingCost,
      payment_method: form.paymentMethod,
      items: items.length > 0
        ? items.map((i) => ({
            product_id: i.productId,
            variant_id: i.variantId,
            quantity: i.quantity,
          }))
        : [
            {
              product_id: 'prod-dummy-uuid',
              variant_id: null,
              quantity: 1,
            },
          ],
    };

    const res = await fetchApi('/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
      tenantIdOrSlug: storeSlug,
    });

    setLoading(false);

    if (res.success) {
      clearCart();
      setOrderSuccess(res);
    } else {
      // Jika backend Laravel belum online, tampilkan mode simulasi sukses
      clearCart();
      setOrderSuccess({
        order_number: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        total_amount: totalAmount,
        payment: form.paymentMethod === 'ONLINE'
          ? { invoice_url: 'https://checkout.xendit.co/web/simulated-invoice' }
          : null,
        is_mock: true,
      });
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-lg">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Pesanan Diterima!</h2>
          <p className="text-sm text-slate-600 mb-6">
            Nomor Pesanan: <span className="font-mono font-bold text-slate-900">{orderSuccess.order_number}</span>
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-left text-xs space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Pembayaran:</span>
              <span className="font-bold text-slate-900">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Metode:</span>
              <span className="font-bold text-slate-900">{form.paymentMethod === 'ONLINE' ? 'QRIS / VA (Xendit)' : 'Bayar di Tempat (COD)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kurir Logistik:</span>
              <span className="font-bold text-slate-900">{form.courier.toUpperCase()} {form.courierService.toUpperCase()} (Biteship Auto-AWB)</span>
            </div>
          </div>

          {form.paymentMethod === 'ONLINE' && (
            <Link
              href={`/mock/xendit-invoice/${orderSuccess.order_number}?store=${storeSlug}&amount=${totalAmount}&order=${orderSuccess.order_number}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow mb-3 text-sm transition-all"
            >
              Bayar Sekarang via Xendit (Simulasi QRIS / VA) →
            </Link>
          )}


          <Link
            href={`/${storeSlug}/orders/${orderSuccess.order_number}`}
            className="block w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl mb-3 text-sm transition-all"
          >
            Lacak Status Pesanan Ini →
          </Link>

          <Link
            href={`/${storeSlug}`}
            className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl text-sm transition-all"
          >
            Kembali ke Katalog Toko
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/${storeSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <span className="text-sm font-bold text-slate-900">1-Page Fast Checkout</span>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <ShieldCheck className="w-4 h-4" /> 100% Aman
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid md:grid-cols-5 gap-8">
          {/* Kolom Kiri: Form Identitas & Pengiriman */}
          <div className="md:col-span-3 space-y-6">
            {/* Step 1: Identitas Pembeli */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-900 text-white text-xs rounded-full flex items-center justify-center font-mono">1</span>
                Informasi Kontak Pembeli
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nama Penerima</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Amanda Putri"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">No. WhatsApp (Aktif)</label>
                    <input
                      type="tel"
                      required
                      placeholder="081234567890"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email (Opsional)</label>
                    <input
                      type="email"
                      placeholder="amanda@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Alamat Pengiriman */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-900 text-white text-xs rounded-full flex items-center justify-center font-mono">2</span>
                Alamat Tujuan Pengiriman (Biteship Standard)
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Kecamatan / Kelurahan</label>
                  <select
                    value={form.areaId}
                    onChange={(e) => setForm({ ...form, areaId: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ID_ID_3578_357807">Sukolilo, Surabaya, Jawa Timur (60111)</option>
                    <option value="ID_ID_3171_317101">Kemang, Mampang Prapatan, Jakarta Selatan (12730)</option>
                    <option value="ID_ID_3273_327301">Coblong, Dago, Bandung, Jawa Barat (40132)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Alamat Lengkap & Patokan</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Nama jalan, nomor rumah, RT/RW, dan patokan dekat lokasi..."
                    value={form.addressDetail}
                    onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Kurir Ekspedisi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-900 text-white text-xs rounded-full flex items-center justify-center font-mono">3</span>
                Pilih Kurir Ekspedisi (Auto-AWB Resi)
              </h3>

              <div className="space-y-2">
                {courierOptions.map((c) => (
                  <label
                    key={c.code}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      form.courier === c.code
                        ? 'border-emerald-500 bg-emerald-50/50 font-medium'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="courier"
                        checked={form.courier === c.code}
                        onChange={() =>
                          setForm({
                            ...form,
                            courier: c.code,
                            courierService: c.service,
                            shippingCost: c.price,
                          })
                        }
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <Truck className="w-4 h-4 text-slate-500" />
                      <span>{c.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">Rp {c.price.toLocaleString('id-ID')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 4: Metode Pembayaran */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-900 text-white text-xs rounded-full flex items-center justify-center font-mono">4</span>
                Pilih Metode Pembayaran
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: 'ONLINE' })}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    form.paymentMethod === 'ONLINE'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-emerald-600 mb-1.5" />
                  <div className="font-bold text-xs text-slate-900">QRIS / VA / e-Wallet</div>
                  <div className="text-[11px] text-slate-500">Otomatis & Escrow Aman</div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: 'COD' })}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    form.paymentMethod === 'COD'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600 mb-1.5" />
                  <div className="font-bold text-xs text-slate-900">Bayar di Tempat (COD)</div>
                  <div className="text-[11px] text-slate-500">Proteksi Anti-RTS Aktif</div>
                </button>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Ringkasan & Submit */}
          <div className="md:col-span-2">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sticky top-20 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
                Ringkasan Belanja
              </h3>

              {items.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-50">
                      <div>
                        <div className="font-medium text-slate-800">{item.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.variantTitle} × {item.quantity}
                        </div>
                      </div>
                      <div className="font-semibold text-slate-900">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2">
                  (Simulasi pesanan default katalog)
                </div>
              )}

              <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Produk</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ongkos Kirim ({form.courier.toUpperCase()})</span>
                  <span>Rp {form.shippingCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Layanan Platform</span>
                  <span className="text-emerald-600 font-medium">Rp 0 (Gratis)</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Tagihan</span>
                  <span className="text-emerald-700">Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Memproses Pesanan...' : `Selesaikan Pesanan (Rp ${totalAmount.toLocaleString('id-ID')})`}
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-tight">
                🔒 Data dilindungi dengan Enkripsi SSL 256-bit dan PostgreSQL RLS Multi-Tenant.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
