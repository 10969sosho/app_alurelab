import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format Rupiah
 * @example formatRupiah(150000) → "Rp 150.000"
 */
export function formatRupiah(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
    if (amount >= 1_000_000)     return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
    if (amount >= 1_000)         return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return new Intl.NumberFormat('id-ID', {
    style:                 'currency',
    currency:              'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ke lokal Indonesia
 * @example formatDate('2026-09-14') → "14 Sep 2026"
 */
export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('id-ID', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
    ...opts,
  }).format(new Date(date));
}

/**
 * Format tanggal + waktu
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Format nomor WA ke format +62
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return '+62' + cleaned.slice(1);
  if (cleaned.startsWith('62')) return '+' + cleaned;
  return '+62' + cleaned;
}

/**
 * Truncate string
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, ms = 300) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}
