import { test, expect } from '@playwright/test';
import { captureDiagnostics, loginSeller, startDiagnostics } from './support';

test.beforeEach(async ({ page }) => startDiagnostics(page));
test.afterEach(async ({ page }, testInfo) => captureDiagnostics(page, testInfo));

test('seller can login and navigate core dashboard areas', async ({ page }) => {
  await loginSeller(page);
  await expect(page.getByText(/Dashboard|Ringkasan/i).first()).toBeVisible();

  await page.goto('/dashboard/products');
  await expect(page).toHaveURL(/\/dashboard\/products/);
  await expect(page.getByText(/Produk|Tambah Produk/i).first()).toBeVisible();

  await page.goto('/dashboard/orders');
  await expect(page).toHaveURL(/\/dashboard\/orders/);
  await expect(page.getByText(/Pesanan/i).first()).toBeVisible();
});

test('seller product form exposes required fields before mutation', async ({ page }) => {
  await loginSeller(page);
  await page.goto('/dashboard/products/new');
  await expect(page.locator('input[name="title"]')).toBeVisible();
  await expect(page.locator('input[name="price"]')).toBeVisible();
  await expect(page.locator('input[name="weight_grams"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /Simpan.*Publikasikan/i })).toBeVisible();
});

test('seller logout returns to login', async ({ page }) => {
  await loginSeller(page);
  const logout = page.getByRole('button', { name: /Logout|Keluar/i });
  await expect(logout).toBeVisible();
  await logout.click();
  await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
});

test('seller finance page loads', async ({ page }) => {
  await loginSeller(page);
  await page.goto('/dashboard/finance');
  await expect(page.getByText(/Saldo Escrow|Keuangan/i).first()).toBeVisible();
});
