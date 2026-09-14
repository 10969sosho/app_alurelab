# 🗓️ 09: IMPLEMENTATION PRIORITY & SPRINT BREAKDOWN
### *Urutan pengerjaan dari mock → production-ready*

---

## CURRENT STATE (Audit Result)

### Yang Sudah Ada (Frontend Mock):
- ✅ Landing page marketing (`/`)
- ✅ Onboarding 3-step merchant (dengan fallback mock)
- ✅ Dashboard seller (1174 baris — ALL MOCK DATA)
- ✅ Storefront buyer (`/[store_slug]/`)
- ✅ Checkout 4-step (dengan fallback mock)

### Yang Sudah Ada (Backend):
- ✅ Tenant identification middleware
- ✅ Storefront API (store info, products, checkout)
- ✅ Merchant onboarding API
- ✅ Xendit webhook receiver
- ✅ Biteship webhook receiver
- ✅ Logistics proxy (area search + rates)
- ✅ DB schema (9 tabel, RLS ready)

### Yang BELUM Ada (Gap):
- ❌ Auth sistem (frontend: NextAuth, backend: Sanctum middleware)
- ❌ Dashboard seller API (semua endpoint CRUD produk, orders, dll)
- ❌ File upload ke Cloudflare R2
- ❌ Product detail page buyer
- ❌ Order tracking page buyer
- ❌ Halaman promo/voucher
- ❌ Finance/wallet dashboard
- ❌ Customer management
- ❌ Analytics
- ❌ Settings (domain, notif, tim)
- ❌ Subscription billing

---

## SPRINT PLAN — MENUJU PUBLIC READY

### SPRINT A: Auth Foundation (1 minggu)
**Priority: CRITICAL — Semua fitur lain blocker ini**

Backend:
- [ ] Implement auth routes (login, register, logout, me)
- [ ] Sanctum middleware untuk protected dashboard routes
- [ ] Role-based access (owner, manager, staff)

Frontend:
- [ ] Install NextAuth v5
- [ ] Login page + Register page
- [ ] Auth middleware (Next.js middleware.ts)
- [ ] Token storage + refresh logic

### SPRINT B: Dashboard API — Produk & Pesanan (2 minggu)
**Priority: CRITICAL — Core seller workflow**

Backend:
- [ ] ProductController: CRUD lengkap (list, create, update, delete, toggle status)
- [ ] Product image upload → Cloudflare R2 presigned URL
- [ ] ProductVariantController: CRUD varian
- [ ] OrderController: list, detail, update status (state machine)
- [ ] ShipmentController: create shipment via Biteship, get label PDF

Frontend:
- [ ] Connect dashboard produk ke API real (hapus mock data)
- [ ] Form tambah/edit produk (React Hook Form + Zod)
- [ ] File upload component (drag & drop + R2)
- [ ] Varian management UI
- [ ] Connect orders ke API
- [ ] Order detail + status update + cetak label

### SPRINT C: Buyer Storefront — Halaman yang Hilang (1 minggu)

Frontend:
- [ ] Product detail page (`/[store_slug]/products/[slug]/`)
- [ ] Cart page (`/[store_slug]/cart/`)
- [ ] Order tracking page (+ OTP WA access)
- [ ] Invoice page

### SPRINT D: Finance & Wallet (1 minggu)

Backend:
- [ ] WalletController: saldo, mutasi, withdraw request
- [ ] PayoutController: disbursement via Xendit

Frontend:
- [ ] Finance dashboard (saldo, mutasi)
- [ ] Withdraw form
- [ ] Riwayat payout

### SPRINT E: Promotions & Voucher (1 minggu)

Backend:
- [ ] VoucherController: CRUD, validate voucher di checkout
- [ ] FlashSaleController: CRUD flash sale + product slots

Frontend:
- [ ] Voucher management UI
- [ ] Flash sale setup UI
- [ ] Apply voucher di checkout

### SPRINT F: Analytics & Settings (1 minggu)

Backend:
- [ ] Analytics API: revenue, orders, traffic stats
- [ ] Settings API: store profile, payment settings, team management
- [ ] Cloudflare for SaaS custom domain API

Frontend:
- [ ] Analytics dashboard + charts (Recharts)
- [ ] Settings pages (profil, domain, notif, tim)
- [ ] Subscription page

### SPRINT G: Hardening & Performance (1 minggu)

- [ ] Error handling global (Sentry)
- [ ] Loading states & skeleton UI semua halaman
- [ ] Optimistic updates
- [ ] Lighthouse audit & optimisasi
- [ ] Rate limiting API
- [ ] CSRF protection audit

---

## ESTIMASI TOTAL

| Sprint | Durasi | Output |
|--------|--------|--------|
| Sprint A | 1 minggu | Auth system jalan |
| Sprint B | 2 minggu | Core seller workflow (produk + pesanan) |
| Sprint C | 1 minggu | Storefront buyer lengkap |
| Sprint D | 1 minggu | Finance & wallet |
| Sprint E | 1 minggu | Promo & voucher |
| Sprint F | 1 minggu | Analytics & settings |
| Sprint G | 1 minggu | Polish & hardening |
| **TOTAL** | **~8 minggu** | **Public ready MVP** |

