import { test, expect } from '@playwright/test';
import { captureDiagnostics, loginBuyer, startDiagnostics, storeSlug } from './support';

test.beforeEach(async ({ page }) => startDiagnostics(page));
test.afterEach(async ({ page }, testInfo) => captureDiagnostics(page, testInfo));

test('buyer can browse, login, add an item, and reach checkout', async ({ page }) => {
  await page.goto(`/${storeSlug}`);
  await expect(page).toHaveTitle(/KALMORA|Toko Resmi|ALURELAB/i);

  const productLink = page.locator(`a[href^="/${storeSlug}/products/"]`).first();
  await expect(productLink, 'storefront harus menampilkan minimal satu produk').toBeVisible();
  await productLink.click();
  const addToBag = page.locator('button.w-full').filter({ hasText: /ADD TO BAG|Tambah ke Keranjang|Masuk Keranjang/i }).first();
  await expect(addToBag).toBeVisible();
  await expect(addToBag).toBeEnabled();
  await addToBag.click();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('alurelab_cart_storage'))).toMatch(/items/);

  await page.goto(`/${storeSlug}/cart`);
  await expect(page.getByRole('heading', { name: 'BAG', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Checkout/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${storeSlug}/checkout`));
  await expect(page.getByText('Checkout', { exact: true })).toBeVisible();
});

test('buyer login and logout are usable', async ({ page }) => {
  await loginBuyer(page);
  await page.goto(`/${storeSlug}/account`);
  await expect(page.getByText(/Siti|QA Buyer|Akun Saya|Profil/i).first()).toBeVisible();

  const logout = page.getByRole('button', { name: /Keluar|Logout/i });
  await expect(logout).toBeVisible();
  await logout.click();
  await expect(page.getByRole('button', { name: /Masuk|Login/i }).first()).toBeVisible();
});

test('empty checkout is blocked instead of creating an order', async ({ page }) => {
  await page.goto(`/${storeSlug}/checkout`);
  await expect(page.getByText(/Keranjang kosong/i)).toBeVisible();
});
