import { test, expect } from '@playwright/test';
import { captureDiagnostics, loginBuyer, loginSeller, startDiagnostics, storeSlug } from './support';

test.describe('semi-production seller to buyer loop', () => {
  test.skip(process.env.QA_MUTATIONS !== '1', 'Set QA_MUTATIONS=1 untuk mengizinkan data QA dibuat.');
  test.setTimeout(180_000);
  test.beforeEach(async ({ page }) => startDiagnostics(page));
  test.afterEach(async ({ page }, testInfo) => captureDiagnostics(page, testInfo));

  test('creates category and variant product, then receives a COD order', async ({ page }) => {
    const suffix = Date.now().toString();
    const category = `QA Category ${suffix}`;
    const product = `QA Product ${suffix}`;

    await loginSeller(page);

    await page.goto('/dashboard/categories');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByPlaceholder(/Contoh: Kopi/i)).toBeVisible();
    const categoryInput = page.getByPlaceholder(/Contoh: Kopi/i);
    await categoryInput.fill(category);
    await expect(categoryInput).toHaveValue(category);
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText(category, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Simpan Master Kategori/i }).click();
    await expect(page.getByText(/Master kategori tersimpan/i)).toBeVisible();

    await page.goto('/dashboard/products/new');
    await page.locator('input[name="title"]').fill(product);
    await page.locator('input[name="category_name"]').fill(category);
    await page.locator('textarea[name="description"]').fill('Produk QA untuk verifikasi alur toko sampai pengiriman.');
    await page.locator('input[name="price"]').fill('99000');
    await page.locator('input[name="weight_grams"]').fill('250');

    await page.getByText('Aktifkan Varian', { exact: true }).locator('..').locator('input').check({ force: true });
    await page.getByPlaceholder(/Merah \/ XL/i).fill('QA Variant Red');
    await page.locator('input[name="variants.0.price"]').fill('99000');
    await page.locator('input[name="variants.0.weight_grams"]').fill('250');
    await page.locator('input[name="variants.0.stock"]').fill('10');
    await page.locator('input[name="variants.0.sku"]').fill(`QA-${suffix}`);
    await page.getByRole('button', { name: /Simpan & Publikasikan/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/products/, { timeout: 30_000 });
    await expect(page.getByText(product, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /Keluar Akun/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });

    await loginBuyer(page);
    await page.goto(`/${storeSlug}/products/${product.toLowerCase().replaceAll(' ', '-')}`);
    const addToBag = page.locator('button.w-full').filter({ hasText: /Tambah ke keranjang|ADD TO BAG/i }).first();
    await expect(addToBag).toBeEnabled();
    await addToBag.click();
    await page.getByRole('link', { name: /Checkout/i }).click();

    await page.getByPlaceholder(/Contoh: Amanda Putri/i).fill('QA Buyer Loop');
    await page.getByPlaceholder('081234567890').fill(process.env.QA_BUYER_PHONE || '081299992026');
    await page.getByPlaceholder(/Nama jalan/i).fill('Jalan QA Loop No. 1, Jakarta');

    const regions = page.locator('select');
    await regions.nth(0).selectOption({ index: 1 });
    await expect.poll(() => regions.nth(1).locator('option').count(), { timeout: 15_000 }).toBeGreaterThan(1);
    await regions.nth(1).selectOption({ index: 1 });
    await expect.poll(() => regions.nth(2).locator('option').count(), { timeout: 15_000 }).toBeGreaterThan(1);
    await regions.nth(2).selectOption({ index: 1 });
    if (process.env.QA_PAYMENT_METHOD === 'ONLINE') {
      await page.getByRole('button', { name: /QRIS \/ VA/i }).click();
    } else {
      await page.getByRole('button', { name: /Bayar di Tempat/i }).click();
    }
    await expect(page.locator('input[type="radio"][name="courier"]').first()).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: /Buat pesanan|Place order/i }).click();
    await expect(page.getByText(/Pesanan Diterima/i)).toBeVisible({ timeout: 30_000 });
    const orderNumber = await page.locator('.font-mono').first().textContent();
    expect(orderNumber).toMatch(/ORD-/);
    await page.goto(`/${storeSlug}/account`);
    await expect(page.getByText(orderNumber || /ORD-/).first()).toBeVisible({ timeout: 30_000 });

    await loginSeller(page);
    await page.goto('/dashboard/orders');
    await page.getByRole('link', { name: orderNumber || /ORD-/ }).click();
    await page.getByRole('button', { name: /Proses Pesanan/i }).click();
    await expect(page.getByText(/Sedang Diproses/i)).toBeVisible({ timeout: 30_000 });

    if (process.env.QA_SKIP_SHIPPING === '1') {
      await page.goto('/dashboard/finance');
      await expect(page.getByText(/Saldo Escrow|Keuangan/i).first()).toBeVisible();
      return;
    }

    await page.getByRole('button', { name: /Buat Resi Pengiriman/i }).click();
    await expect(page.getByText(/Pengiriman berhasil|Gagal membuat pengiriman/i)).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText(/Dalam Pengiriman/i)).toBeVisible({ timeout: 30_000 });
    await page.goto('/dashboard/finance');
    await expect(page.getByText(/Saldo Escrow|Keuangan/i).first()).toBeVisible();
  });
});
