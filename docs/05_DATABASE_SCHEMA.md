# 🗄️ 05: DATABASE SCHEMA & DDL SPECIFICATION
### *Skema Basis Data PostgreSQL 16 Multi-Tenant dengan Row-Level Security (RLS)*

Dokumen ini memuat skema relasi basis data lengkap (*Data Definition Language*) yang siap diimplementasikan langsung ke Laravel Migrations dan PostgreSQL 16.

---

## 1. Diagram Relasi Entitas (Entity Relationship Overview)

```
┌───────────┐       1:N       ┌───────────────┐
│   USERS   │ ──────────────< │  STORE_USERS  │
└───────────┘                 └───────┬───────┘
                                      │ N:1
                                      ▼
┌───────────────┐       1:N   ┌───────────────┐       1:N   ┌───────────────┐
│ WALLET_TXS    │ >────────── │    STORES     │ ──────────< │   PRODUCTS    │
└───────────────┘             │  (Tenants)    │             └───────┬───────┘
                              └───────┬───────┘                     │ 1:N
                                      │                             ▼
                                      │ 1:N                 ┌───────────────┐
                                      ▼                     │   VARIANTS    │
                              ┌───────────────┐             └───────────────┘
                              │    ORDERS     │
                              └───────┬───────┘
                  ┌───────────────────┼───────────────────┐
                  │ 1:N               │ 1:1               │ 1:1
                  ▼                   ▼                   ▼
          ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
          │  ORDER_ITEMS  │   │   PAYMENTS    │   │   SHIPMENTS   │
          └───────────────┘   └───────────────┘   └───────────────┘
```

---

## 2. Definisi DDL Tabel Inti (PostgreSQL 16)

```sql
-- Aktifkan Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABEL STORES (TENANTS INDUK)
-- =============================================================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- nama-toko.alurelab.shop
    custom_domain VARCHAR(255) UNIQUE NULL, -- tokosaya.com
    custom_domain_status VARCHAR(50) DEFAULT 'pending', -- pending, active, error
    
    -- Xendit XenPlatform Sub-Account
    xendit_sub_account_id VARCHAR(100) UNIQUE NULL,
    xendit_account_status VARCHAR(50) DEFAULT 'unregistered', -- active, suspended
    
    -- Paket Langganan (Billing)
    plan_tier VARCHAR(50) DEFAULT 'starter', -- starter, pro, business
    plan_expires_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Pengaturan Toko
    logo_url TEXT NULL,
    phone_number VARCHAR(30) NOT NULL,
    address_area_id VARCHAR(100) NULL, -- Biteship Area ID Origin Toko
    address_detail TEXT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_custom_domain ON stores(custom_domain);

-- =============================================================================
-- 2. TABEL USERS & STORE_USERS (AUTH & RBAC)
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(30) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_superadmin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE store_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'owner', -- owner, manager, staff_order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, user_id)
);

-- =============================================================================
-- 3. TABEL PRODUCTS & VARIANTS
-- =============================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category_name VARCHAR(100) NULL,
    price NUMERIC(15, 2) NOT NULL,
    compare_at_price NUMERIC(15, 2) NULL, -- Harga coret promo
    cost_price NUMERIC(15, 2) NULL, -- Modal produk (untuk laporan profit)
    weight_grams INTEGER DEFAULT 200,
    images JSONB DEFAULT '[]'::jsonb, -- Array URL gambar di Cloudflare R2
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, slug)
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NULL,
    title VARCHAR(150) NOT NULL, -- Contoh: "Merah / XL"
    price NUMERIC(15, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4. TABEL CUSTOMERS (PROFIL PEMBELI & ANTI-RTS TRACKING)
-- =============================================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(30) UNIQUE NOT NULL, -- Kunci cross-tenant
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    default_address JSONB DEFAULT '{}'::jsonb,
    
    -- Riwayat Anti-RTS (Diakumulasi lintas toko ALURELAB)
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    rts_rejected_orders INTEGER DEFAULT 0,
    risk_score NUMERIC(5, 2) DEFAULT 0.00, -- 0-100 (Skor tinggi = bahaya COD)
    is_blacklisted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 5. TABEL ORDERS & ORDER_ITEMS
-- =============================================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    order_number VARCHAR(60) UNIQUE NOT NULL, -- ORD-20260914-XXXX
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Status Pesanan
    status VARCHAR(50) DEFAULT 'pending_payment',
    -- pending_payment, paid_escrow, cod_verified, processing, shipped, delivered, completed, cancelled, rts_returned
    
    -- Rincian Nilai Finansial
    items_subtotal NUMERIC(15, 2) NOT NULL,
    shipping_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    insurance_cost NUMERIC(15, 2) DEFAULT 0,
    discount_amount NUMERIC(15, 2) DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL,
    
    -- Potongan Platform ALURELAB
    platform_fee_percent NUMERIC(5, 2) DEFAULT 1.50,
    platform_fee_amount NUMERIC(15, 2) NOT NULL,
    merchant_net_amount NUMERIC(15, 2) NOT NULL,
    
    -- Informasi Pengiriman
    shipping_recipient_name VARCHAR(255) NOT NULL,
    shipping_recipient_phone VARCHAR(30) NOT NULL,
    shipping_destination_area_id VARCHAR(100) NOT NULL,
    shipping_address_detail TEXT NOT NULL,
    shipping_notes TEXT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID NULL REFERENCES product_variants(id),
    product_title VARCHAR(255) NOT NULL,
    variant_title VARCHAR(150) NULL,
    price NUMERIC(15, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL
);

-- =============================================================================
-- 6. TABEL PAYMENTS (XENDIT GATEWAY)
-- =============================================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    xendit_invoice_id VARCHAR(100) UNIQUE NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- QRIS, VIRTUAL_ACCOUNT, EWALLET, COD
    payment_channel VARCHAR(50) NULL, -- BCA, MANDIRI, GOPAY, OVO
    amount NUMERIC(15, 2) NOT NULL,
    gateway_fee NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PAID, EXPIRED, REFUNDED
    paid_at TIMESTAMP WITH TIME ZONE NULL,
    raw_webhook_payload JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 7. TABEL SHIPMENTS (BITESHIP LOGISTICS)
-- =============================================================================
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    biteship_order_id VARCHAR(100) UNIQUE NULL,
    courier_code VARCHAR(50) NOT NULL, -- sicepat, jne, jnt
    courier_service VARCHAR(50) NOT NULL, -- reg, best, ez
    waybill_id VARCHAR(100) NULL, -- Nomor Resi Kurir
    tracking_status VARCHAR(50) DEFAULT 'allocated',
    shipping_label_url TEXT NULL, -- URL Cetak Thermal PDF
    is_cod BOOLEAN DEFAULT FALSE,
    cod_amount NUMERIC(15, 2) DEFAULT 0,
    shipped_at TIMESTAMP WITH TIME ZONE NULL,
    delivered_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 8. TABEL WALLETS & LEDGER (MUTASI DOMPET PENJUAL)
-- =============================================================================
CREATE TABLE merchant_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID UNIQUE NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    available_balance NUMERIC(15, 2) DEFAULT 0.00, -- Siap ditarik
    escrow_held_balance NUMERIC(15, 2) DEFAULT 0.00, -- Masih dalam proses kirim
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    wallet_id UUID NOT NULL REFERENCES merchant_wallets(id),
    order_id UUID NULL REFERENCES orders(id),
    type VARCHAR(50) NOT NULL, -- ORDER_ESCROW_CREDIT, ESCROW_RELEASED, WITHDRAWAL, REFUND_DEBIT
    amount NUMERIC(15, 2) NOT NULL,
    balance_before NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    description TEXT NOT NULL,
    idempotency_key VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 9. TABEL PAYOUTS (PENARIKAN DANA KE REKENING BANK PRIBADI)
-- =============================================================================
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    xendit_disbursement_id VARCHAR(100) UNIQUE NULL,
    bank_code VARCHAR(50) NOT NULL, -- BCA, MANDIRI, BRI, BNI
    account_number VARCHAR(50) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    fee_amount NUMERIC(15, 2) DEFAULT 3000.00,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    processed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Skrip Aktivasi PostgreSQL Row-Level Security (RLS)

Eksekusi perintah berikut di database produksi untuk mengunci akses antar-tenant:

```sql
-- Aktifkan RLS di seluruh tabel yang memiliki tenant_id
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants FORCE ROW LEVEL SECURITY;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments FORCE ROW LEVEL SECURITY;

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions FORCE ROW LEVEL SECURITY;

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts FORCE ROW LEVEL SECURITY;

-- Pasang Aturan Policy: HANYA IZINKAN AKSES JIKA tenant_id COCOK DENGAN app.current_tenant_id
CREATE POLICY tenant_isolation_products ON products
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_orders ON orders
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_payments ON payments
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_shipments ON shipments
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_wallet_txs ON wallet_transactions
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_payouts ON payouts
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```
