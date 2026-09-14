'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Wallet,
  Settings,
  Plus,
  Search,
  ExternalLink,
  Printer,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Edit2,
  Trash2,
  Check,
  ChevronRight,
  Building2,
  Store as StoreIcon,
} from 'lucide-react';
import SlideOver from '@/components/SlideOver';

// Mock Data
interface ProductItem {
  id: string;
  title: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  weightGrams: number;
  isActive: boolean;
  imageUrl: string;
}

interface OrderItemData {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderNumber: string;
  itemsSummary: string;
  totalAmount: number;
  shippingCost: number;
  platformFee: number;
  courier: string;
  awb: string;
  status: 'PENDING' | 'READY_TO_SHIP' | 'SHIPPED' | 'COMPLETED' | 'RTS';
  date: string;
}

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    title: 'Hijab Silk Premium Emerald Glow',
    category: 'Hijab',
    price: 149000,
    compareAtPrice: 199000,
    stock: 75,
    sku: 'HM-SILK-EMR',
    weightGrams: 180,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=300',
  },
  {
    id: 'prod-2',
    title: 'Pashmina Plisket Ceruty Babydoll',
    category: 'Pashmina',
    price: 89000,
    compareAtPrice: 129000,
    stock: 180,
    sku: 'HM-PLIS-BLK',
    weightGrams: 200,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300',
  },
  {
    id: 'prod-3',
    title: 'Voal Miracle Plain Lasercut',
    category: 'Voal',
    price: 65000,
    compareAtPrice: 85000,
    stock: 40,
    sku: 'HM-VOAL-NUDE',
    weightGrams: 150,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=300',
  },
];

const INITIAL_ORDERS: OrderItemData[] = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-20260914-00192',
    customerName: 'Rina Wulandari',
    customerPhone: '081234567890',
    customerAddress: 'Jl. Kertajaya Indah No. 12, Sukolilo, Surabaya, Jawa Timur (60111)',
    itemsSummary: 'Hijab Silk Premium Emerald Glow (1x)',
    totalAmount: 166000,
    shippingCost: 17000,
    platformFee: 2235,
    courier: 'SiCepat REG',
    awb: '004289127819',
    status: 'READY_TO_SHIP',
    date: '14 Sep 2026, 14:15 WIB',
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-20260914-00188',
    customerName: 'Siti Nurhaliza',
    customerPhone: '081298765432',
    customerAddress: 'Jl. Kemang Raya No. 45, Mampang Prapatan, Jakarta Selatan (12730)',
    itemsSummary: 'Pashmina Plisket Ceruty (2x)',
    totalAmount: 196000,
    shippingCost: 18000,
    platformFee: 2670,
    courier: 'J&T Express EZ',
    awb: 'JT981249120',
    status: 'SHIPPED',
    date: '14 Sep 2026, 11:20 WIB',
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-20260913-00174',
    customerName: 'Dewi Lestari',
    customerPhone: '087712348899',
    customerAddress: 'Jl. Dago Asri No. 8, Coblong, Bandung, Jawa Barat (40132)',
    itemsSummary: 'Hijab Silk Dusty Rose (1x)',
    totalAmount: 166000,
    shippingCost: 17000,
    platformFee: 2235,
    courier: 'JNE Reguler',
    awb: 'JNE887162534',
    status: 'COMPLETED',
    date: '13 Sep 2026, 16:40 WIB',
  },
  {
    id: 'ord-4',
    orderNumber: 'ORD-20260913-00160',
    customerName: 'Budi Kurniawan (COD)',
    customerPhone: '085299887766',
    customerAddress: 'Jl. Pemuda No. 88, Semarang Tengah, Kota Semarang',
    itemsSummary: 'Voal Miracle Plain Lasercut (2x)',
    totalAmount: 148000,
    shippingCost: 18000,
    platformFee: 1950,
    courier: 'SiCepat COD',
    awb: '004289998123',
    status: 'RTS',
    date: '13 Sep 2026, 09:10 WIB',
  },
];

export default function MerchantDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'wallet' | 'settings'>('overview');

  // State Produk
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    category: 'Hijab',
    price: 100000,
    compareAtPrice: 150000,
    stock: 50,
    sku: '',
    weightGrams: 200,
  });

  // State Pesanan
  const [orders, setOrders] = useState<OrderItemData[]>(INITIAL_ORDERS);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'READY_TO_SHIP' | 'SHIPPED' | 'COMPLETED' | 'RTS'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderItemData | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [printedThermalAwb, setPrintedThermalAwb] = useState<string | null>(null);

  // State Dompet & Withdraw
  const [isWithdrawDrawerOpen, setIsWithdrawDrawerOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(1000000);
  const [selectedBank, setSelectedBank] = useState('BCA');
  const [bankAccountNumber, setBankAccountNumber] = useState('8830192837');
  const [availableBalance, setAvailableBalance] = useState(3500000);
  const [escrowBalance, setEscrowBalance] = useState(1250000);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Handlers Produk
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      category: 'Hijab',
      price: 120000,
      compareAtPrice: 150000,
      stock: 50,
      sku: 'HM-' + Math.floor(1000 + Math.random() * 9000),
      weightGrams: 200,
    });
    setIsProductDrawerOpen(true);
  };

  const handleOpenEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    setProductForm({
      title: prod.title,
      category: prod.category,
      price: prod.price,
      compareAtPrice: prod.compareAtPrice || 0,
      stock: prod.stock,
      sku: prod.sku,
      weightGrams: prod.weightGrams,
    });
    setIsProductDrawerOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                title: productForm.title,
                category: productForm.category,
                price: Number(productForm.price),
                compareAtPrice: Number(productForm.compareAtPrice) || undefined,
                stock: Number(productForm.stock),
                sku: productForm.sku,
                weightGrams: Number(productForm.weightGrams),
              }
            : p
        )
      );
    } else {
      const newProduct: ProductItem = {
        id: 'prod-' + Date.now(),
        title: productForm.title,
        category: productForm.category,
        price: Number(productForm.price),
        compareAtPrice: Number(productForm.compareAtPrice) || undefined,
        stock: Number(productForm.stock),
        sku: productForm.sku || 'SKU-' + Date.now(),
        weightGrams: Number(productForm.weightGrams),
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300',
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
    setIsProductDrawerOpen(false);
  };

  // Handlers Pesanan
  const handleViewOrderDetail = (order: OrderItemData) => {
    setSelectedOrder(order);
    setIsOrderDetailOpen(true);
  };

  const handleSimulatePrintThermal = (awb: string) => {
    setPrintedThermalAwb(awb);
    setTimeout(() => {
      window.open(`https://api.biteship.com/v1/labels/${awb}.pdf`, '_blank');
      setPrintedThermalAwb(null);
    }, 600);
  };

  // Handler Withdraw
  const handleExecuteWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= availableBalance && withdrawAmount >= 100000) {
      setAvailableBalance((prev) => prev - withdrawAmount);
      setWithdrawSuccess(true);
      setTimeout(() => {
        setWithdrawSuccess(false);
        setIsWithdrawDrawerOpen(false);
      }, 1500);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (orderFilter === 'ALL') return true;
    return ord.status === orderFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white text-base">
              A
            </div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">ALURELAB</span>
          </Link>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 transition-colors cursor-pointer">
            <StoreIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hijab Mevvah Official</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">PRO</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/hijab-mevvah"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-3.5 py-2 rounded-xl transition-all"
          >
            Lihat Storefront Live <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
            AP
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 py-6 gap-6">
        {/* Left Sidebar */}
        <aside className="w-64 shrink-0 space-y-1">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-600" />
              <span>Ringkasan Bisnis</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'products'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Manajemen Produk</span>
              <span className="ml-auto bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-mono">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'orders'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Manajemen Pesanan</span>
              <span className="ml-auto bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                {orders.filter((o) => o.status === 'READY_TO_SHIP').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'customers'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Pelanggan & Anti-RTS</span>
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'wallet'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Dompet & Escrow</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Toko</span>
            </button>
          </div>

          {/* Quick Help Card */}
          <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl text-white shadow-sm space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" /> Biteship & Xendit Live
            </div>
            <p className="text-[11px] text-emerald-100 leading-relaxed">
              Auto-AWB kurir aktif. Setiap paket siap kirim langsung auto-pickup ekspedisi.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Total Penjualan (GMV)</span>
                  <div className="text-xl font-black text-slate-900">Rp 18.750.000</div>
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" /> +18.4% pekan ini
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Pesanan Masuk</span>
                  <div className="text-xl font-black text-slate-900">{orders.length} Pesanan</div>
                  <span className="text-[10px] font-semibold text-blue-600 mt-1 block">
                    1 Perlu Dipacking
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Saldo Siap Ditarik</span>
                  <div className="text-xl font-black text-emerald-600">
                    Rp {availableBalance.toLocaleString('id-ID')}
                  </div>
                  <button
                    onClick={() => setIsWithdrawDrawerOpen(true)}
                    className="text-[11px] font-bold text-slate-700 underline mt-1 block hover:text-emerald-600"
                  >
                    Tarik Dana Sekarang →
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Escrow Tertahan</span>
                  <div className="text-xl font-black text-slate-900">
                    Rp {escrowBalance.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Cair otomatis pasca kirim
                  </span>
                </div>
              </div>

              {/* Action Banners & Recent Orders */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Pesanan Masuk Terbaru</h3>
                    <p className="text-xs text-slate-500">Daftar transaksi yang baru saja dibayar oleh pelanggan.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Lihat Semua Pesanan →
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {orders.slice(0, 3).map((ord) => (
                    <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{ord.orderNumber}</div>
                        <div className="text-slate-500">{ord.customerName} • {ord.itemsSummary}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">Rp {ord.totalAmount.toLocaleString('id-ID')}</div>
                        <span className="text-[10px] font-semibold text-emerald-600">{ord.courier}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAJEMEN PRODUK */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Katalog Produk Toko</h3>
                  <p className="text-xs text-slate-500">Kelola inventaris, varian warna/ukuran, dan harga produk.</p>
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" /> Tambah Produk Baru
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-4">Produk</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Harga Jual</th>
                      <th className="p-4">Stok Fisik</th>
                      <th className="p-4">Berat</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{prod.title}</div>
                              <span className="text-[10px] text-emerald-600 font-medium">Aktif di Storefront</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{prod.category}</td>
                        <td className="p-4 font-mono text-slate-500">{prod.sku}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">Rp {prod.price.toLocaleString('id-ID')}</div>
                          {prod.compareAtPrice && (
                            <div className="text-[10px] text-slate-400 line-through">
                              Rp {prod.compareAtPrice.toLocaleString('id-ID')}
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-bold text-slate-800">{prod.stock} unit</td>
                        <td className="p-4 text-slate-500 font-mono">{prod.weightGrams}g</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg font-semibold transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MANAJEMEN PESANAN */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
              <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pesanan & Ekspedisi Biteship</h3>
                  <p className="text-xs text-slate-500">Kelola resi AWB, pesanan COD, dan cetak label thermal 100x150 mm.</p>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="px-5 flex gap-2 overflow-x-auto pb-2 border-b border-slate-100">
                {[
                  { key: 'ALL', label: 'Semua Pesanan', count: orders.length },
                  { key: 'READY_TO_SHIP', label: 'Perlu Dikirim', count: orders.filter((o) => o.status === 'READY_TO_SHIP').length },
                  { key: 'SHIPPED', label: 'Dalam Pengiriman', count: orders.filter((o) => o.status === 'SHIPPED').length },
                  { key: 'COMPLETED', label: 'Selesai', count: orders.filter((o) => o.status === 'COMPLETED').length },
                  { key: 'RTS', label: 'Gagal / Retur COD', count: orders.filter((o) => o.status === 'RTS').length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setOrderFilter(tab.key as any)}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                      orderFilter === tab.key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${orderFilter === tab.key ? 'bg-slate-700 text-white' : 'bg-white text-slate-700'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Order Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-4">No. Pesanan</th>
                      <th className="p-4">Pelanggan</th>
                      <th className="p-4">Barang</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Kurir & AWB</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{ord.customerName}</div>
                          <div className="text-[10px] text-slate-500">{ord.customerPhone}</div>
                        </td>
                        <td className="p-4 text-slate-700">{ord.itemsSummary}</td>
                        <td className="p-4 font-bold text-slate-900">
                          Rp {ord.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{ord.courier}</div>
                          <div className="text-[10px] font-mono text-slate-500">{ord.awb}</div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              ord.status === 'READY_TO_SHIP'
                                ? 'bg-amber-100 text-amber-800'
                                : ord.status === 'SHIPPED'
                                ? 'bg-blue-100 text-blue-800'
                                : ord.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {ord.status === 'READY_TO_SHIP'
                              ? 'Perlu Dipacking'
                              : ord.status === 'SHIPPED'
                              ? 'Sedang Dikirim'
                              : ord.status === 'COMPLETED'
                              ? 'Selesai (Dana Cair)'
                              : 'Retur COD (RTS)'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleViewOrderDetail(ord)}
                            className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-semibold transition-all"
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => handleSimulatePrintThermal(ord.awb)}
                            className="text-xs text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg font-semibold transition-all inline-flex items-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            {printedThermalAwb === ord.awb ? 'Membuka PDF...' : 'Label Thermal'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PELANGGAN & ANTI-RTS */}
          {activeTab === 'customers' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Database Pembeli & Fraud Anti-RTS</h3>
                <p className="text-xs text-slate-500">Skor risiko reputasi pembeli COD yang diakumulasi lintas toko ALURELAB.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-4">Nama Pelanggan</th>
                      <th className="p-4">No. WhatsApp</th>
                      <th className="p-4">Total Pesanan</th>
                      <th className="p-4">Sukses</th>
                      <th className="p-4">Retur (RTS)</th>
                      <th className="p-4">Skor Risiko Anti-RTS</th>
                      <th className="p-4">Status Proteksi COD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/70">
                      <td className="p-4 font-bold text-slate-900">Rina Wulandari</td>
                      <td className="p-4 font-mono text-slate-600">081234567890</td>
                      <td className="p-4 font-semibold">12 Order</td>
                      <td className="p-4 text-emerald-600 font-bold">12 Selesai</td>
                      <td className="p-4 text-slate-400">0 Retur</td>
                      <td className="p-4">
                        <span className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                          0.00% (Sangat Aman)
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> COD Bebas Tanpa DP
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="p-4 font-bold text-slate-900">Budi Kurniawan</td>
                      <td className="p-4 font-mono text-slate-600">085299887766</td>
                      <td className="p-4 font-semibold">4 Order</td>
                      <td className="p-4 text-slate-600">2 Selesai</td>
                      <td className="p-4 text-rose-600 font-bold">2 Retur (50%)</td>
                      <td className="p-4">
                        <span className="font-mono text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-bold">
                          50.00% (Bahaya)
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Wajib DP Ongkir Rp 20.000
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: DOMPET & ESCROW LEDGER */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Siap Ditarik</span>
                    <div className="text-3xl font-black text-slate-900 mt-1">
                      Rp {availableBalance.toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Hasil penjualan dari pesanan yang telah diterima pembeli.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsWithdrawDrawerOpen(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-xs"
                  >
                    Tarik Dana ke Rekening Bank (Withdraw)
                  </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Escrow Ditahan</span>
                    <div className="text-3xl font-black text-blue-600 mt-1">
                      Rp {escrowBalance.toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Uang pembeli aman tersimpan di Escrow Xendit (PJP BI) selama paket dikirim kurir Biteship.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                    💡 Rekonsiliasi otomatis 2x24 jam setelah kurir update status <span className="font-bold">DELIVERED</span>.
                  </div>
                </div>
              </div>

              {/* Append-Only Ledger History */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">Buku Kas Mutasi Escrow (Ledger Append-Only)</h3>
                  <p className="text-xs text-slate-500">Setiap mutasi dana tercatat kriptografis dan tidak dapat diubah.</p>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Dana Masuk Escrow #ORD-20260914-00192</div>
                        <div className="text-slate-500 text-[11px]">Pembeli bayar via QRIS Xendit • 14 Sep 2026, 14:15 WIB</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">+Rp 163.765</div>
                      <div className="text-[10px] text-slate-400">Potongan platform 1.5% (-Rp 2.235)</div>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Pelepasan Escrow #ORD-20260913-00174</div>
                        <div className="text-slate-500 text-[11px]">Paket diterima pembeli via JNE • 13 Sep 2026, 18:30 WIB</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">Rp 163.765 (Cair ke Saldo)</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Sukses Ditambahkan</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PENGATURAN TOKO */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pengaturan Toko & Integrasi</h3>
                <p className="text-xs text-slate-500">Konfigurasi alamat asal pickup Biteship dan custom domain.</p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Toko Resmi</label>
                  <input
                    type="text"
                    defaultValue="Hijab Mevvah Official"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subdomain Bawaan</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      defaultValue="hijab-mevvah"
                      readOnly
                      className="w-full text-xs px-3.5 py-2.5 rounded-l-xl border border-slate-300 bg-slate-50 font-mono"
                    />
                    <span className="bg-slate-100 border border-l-0 border-slate-300 text-xs px-3 py-2.5 rounded-r-xl text-slate-500 font-mono">
                      .alurelab.com
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Domain Pribadi</label>
                  <input
                    type="text"
                    defaultValue="hijabmevvah.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Arahkan CNAME domain Anda ke <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">cname.alurelab.com</code>. SSL Cloudflare diterbitkan otomatis.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Asal Pick-up Kurir (Biteship Origin Area)</label>
                  <select className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>Sukolilo, Surabaya, Jawa Timur (60111)</option>
                    <option>Kemang, Jakarta Selatan (12730)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rekening Bank Pencairan Dana (XenDisburse)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      defaultValue="BCA"
                      className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-bold"
                    />
                    <input
                      type="text"
                      defaultValue="8830192837"
                      className="col-span-2 text-xs px-3.5 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-xs">
                  Simpan Perubahan
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DRAWER 1: SLIDE-OVER TAMBAH / EDIT PRODUK */}
      <SlideOver
        isOpen={isProductDrawerOpen}
        onClose={() => setIsProductDrawerOpen(false)}
        title={editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
        subtitle="Kelola detail harga, berat ekspedisi Biteship, dan stok fisik."
        footer={
          <>
            <button
              onClick={() => setIsProductDrawerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              onClick={handleSaveProduct}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs"
            >
              Simpan Produk
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Produk</label>
            <input
              type="text"
              required
              value={productForm.title}
              onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
              placeholder="Contoh: Hijab Silk Premium Emerald Glow"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Hijab">Hijab</option>
                <option value="Pashmina">Pashmina</option>
                <option value="Voal">Voal</option>
                <option value="Aksesoris">Aksesoris</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kode SKU</label>
              <input
                type="text"
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                placeholder="HM-SKU-001"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Jual (Rp)</label>
              <input
                type="number"
                required
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Coret Promo (Rp)</label>
              <input
                type="number"
                value={productForm.compareAtPrice}
                onChange={(e) => setProductForm({ ...productForm, compareAtPrice: Number(e.target.value) })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Fisik Tersedia</label>
              <input
                type="number"
                required
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Berat Paket (Gram)</label>
              <input
                type="number"
                required
                value={productForm.weightGrams}
                onChange={(e) => setProductForm({ ...productForm, weightGrams: Number(e.target.value) })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-500">Wajib untuk kalkulasi ongkir Biteship</span>
            </div>
          </div>
        </form>
      </SlideOver>

      {/* DRAWER 2: SLIDE-OVER DETAIL PESANAN */}
      <SlideOver
        isOpen={isOrderDetailOpen}
        onClose={() => setIsOrderDetailOpen(false)}
        title={`Rincian Pesanan ${selectedOrder?.orderNumber || ''}`}
        subtitle={`Status: ${selectedOrder?.status || ''} • Waktu: ${selectedOrder?.date || ''}`}
        footer={
          <button
            onClick={() => handleSimulatePrintThermal(selectedOrder?.awb || 'AWB-TEST')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak Label Thermal PDF (100x150 mm)
          </button>
        }
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs">
            {/* Alamat Kirim */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Penerima & Destinasi
              </span>
              <div className="font-bold text-sm text-slate-900">{selectedOrder.customerName}</div>
              <div className="text-slate-600 font-mono">{selectedOrder.customerPhone}</div>
              <div className="text-slate-700 leading-relaxed">{selectedOrder.customerAddress}</div>
            </div>

            {/* Ekspedisi & AWB Resi */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Pengiriman (Biteship Logistics)
              </span>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800">{selectedOrder.courier}</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                  Resi: {selectedOrder.awb}
                </span>
              </div>
            </div>

            {/* Finansial Split Escrow */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Rincian Pembayaran Escrow
              </span>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Barang</span>
                <span>Rp {(selectedOrder.totalAmount - selectedOrder.shippingCost).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ongkos Kirim Kurir</span>
                <span>Rp {selectedOrder.shippingCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Potongan Platform ALURELAB (1.5%)</span>
                <span>-Rp {selectedOrder.platformFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-extrabold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                <span>Pendapatan Bersih Merchant</span>
                <span className="text-emerald-700">
                  Rp {(selectedOrder.totalAmount - selectedOrder.platformFee).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      {/* DRAWER 3: SLIDE-OVER TARIK DANA (WITHDRAW) */}
      <SlideOver
        isOpen={isWithdrawDrawerOpen}
        onClose={() => setIsWithdrawDrawerOpen(false)}
        title="Penarikan Saldo Toko (Payout)"
        subtitle="Transfer dana hasil jualan ke rekening bank pribadi via XenDisburse."
        footer={
          <button
            onClick={handleExecuteWithdraw}
            disabled={withdrawSuccess}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-xs"
          >
            {withdrawSuccess ? 'Penarikan Sedang Diproses...' : `Konfirmasi Tarik Rp ${withdrawAmount.toLocaleString('id-ID')}`}
          </button>
        }
      >
        <form onSubmit={handleExecuteWithdraw} className="space-y-4 text-xs">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/60">
            <span className="text-slate-500 block">Saldo Siap Ditarik:</span>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              Rp {availableBalance.toLocaleString('id-ID')}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nominal Penarikan (Rp)</label>
            <input
              type="number"
              min={100000}
              max={availableBalance}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Minimal penarikan Rp 100.000</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rekening Bank Tujuan</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
              >
                <option value="BCA">BCA</option>
                <option value="MANDIRI">MANDIRI</option>
                <option value="BRI">BRI</option>
                <option value="BNI">BNI</option>
              </select>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="col-span-2 text-xs px-3.5 py-2 rounded-xl border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Nominal Tarik:</span>
              <span className="font-bold text-slate-900">Rp {withdrawAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Transfer Antar-Bank (Flat):</span>
              <span className="text-slate-900 font-medium">Rp 3.000</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
              <span>Total Diterima di Rekening:</span>
              <span className="text-emerald-700">Rp {Math.max(0, withdrawAmount - 3000).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
