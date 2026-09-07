import type { CurrencyCode, TargetCurrency } from '../types';

/**
 * Format currency according to TargetCurrency or original CurrencyCode.
 */
export function formatCurrency(amount: number, currency: CurrencyCode | TargetCurrency): string {
  if (currency === 'KRW') {
    return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
  }
  if (currency === 'CHF') {
    return `CHF ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'EUR') {
    return `€${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * Extract YYYY-MM-DD from an ISO string using the user's local timezone.
 * Prevents off-by-one-day shifts between KST, CEST, and UTC.
 */
export function toLocalDateString(isoStringOrDate: string | Date): string {
  const date = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
  if (isNaN(date.getTime())) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format an ISO string to a user-friendly local date/time string.
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Scale-up safe addition to prevent IEEE-754 floating point imprecision.
 */
export function safeAdd(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100;
}
