import { expect, Page, TestInfo } from '@playwright/test';

export const storeSlug = process.env.QA_STORE_SLUG || 'kalmora';
export const buyerPhone = process.env.QA_BUYER_PHONE || '';
export const buyerName = process.env.QA_BUYER_NAME || 'QA Buyer';
export const sellerEmail = process.env.QA_SELLER_EMAIL || '';
export const sellerPassword = process.env.QA_SELLER_PASSWORD || '';
const diagnostics = new WeakMap<Page, { consoleErrors: string[]; failedRequests: string[]; badResponses: string[] }>();

export function requireEnv(name: string, value: string) {
  expect(value, `${name} wajib diisi; jangan taruh credential di source code`).not.toBe('');
}

export function startDiagnostics(page: Page) {
  const state = { consoleErrors: [] as string[], failedRequests: [] as string[], badResponses: [] as string[] };
  diagnostics.set(page, state);
  page.on('console', (message) => {
    if (message.type() === 'error') state.consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    state.failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText || 'failed'}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) state.badResponses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
  });
}

export async function captureDiagnostics(page: Page, testInfo: TestInfo) {
  const state = diagnostics.get(page) || { consoleErrors: [], failedRequests: [], badResponses: [] };
  await testInfo.attach('page-url', { body: page.url(), contentType: 'text/plain' });
  await testInfo.attach('console-errors', {
    body: state.consoleErrors.join('\n') || 'none',
    contentType: 'text/plain',
  });
  await testInfo.attach('failed-requests', {
    body: state.failedRequests.join('\n') || 'none',
    contentType: 'text/plain',
  });
  await testInfo.attach('bad-responses', {
    body: state.badResponses.join('\n') || 'none',
    contentType: 'text/plain',
  });
}

export async function loginBuyer(page: Page) {
  requireEnv('QA_BUYER_PHONE', buyerPhone);
  await page.goto(`/${storeSlug}`);
  await page.getByRole('button', { name: /^(LOGIN|Masuk)$/i }).first().click();
  await expect(page.getByRole('heading', { name: /MASUK \/ DAFTAR CEPAT/i })).toBeVisible();
  await page.getByPlaceholder('Contoh: 081234567890').fill(buyerPhone);
  await page.getByPlaceholder('Untuk nama penerima paket').fill(buyerName);
  await page.getByRole('button', { name: /Masuk Sekarang/i }).click();
  await expect(page.locator(`a[href="/${storeSlug}/account"]`)).toBeVisible();
}

export async function loginSeller(page: Page) {
  requireEnv('QA_SELLER_EMAIL', sellerEmail);
  requireEnv('QA_SELLER_PASSWORD', sellerPassword);
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(sellerEmail);
  await page.locator('input[type="password"]').fill(sellerPassword);
  await page.getByRole('button', { name: 'Masuk' }).click();
  if (await page.getByText(/verifikasi email/i).isVisible().catch(() => false)) {
    throw new Error('Akun seller QA belum diverifikasi email. Gunakan akun production yang sudah verified.');
  }
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
}
