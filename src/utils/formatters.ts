/**
 * Currency, Date & Time formatting utilities for Zaid Trading ERP
 * Configured with Sri Lankan Rupee (LKR / Rs.) and Asia/Colombo (+05:30) by default
 */

export interface CurrencyFormatOptions {
  symbol?: string;
  precision?: number;
}

/**
 * Formats a monetary number cleanly with symbol and thousands separators
 * Prevents floating-point display artifacts (e.g. 0.00000000001)
 */
export function formatCurrency(
  amount: number | null | undefined,
  symbol: string = 'Rs.',
  precision: number = 2
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${symbol} 0.00`;
  }

  // Round safely using integer minor units to prevent floating point inaccuracy
  const factor = Math.pow(10, precision);
  const rounded = Math.round(amount * factor) / factor;

  const parts = rounded.toFixed(precision).split('.');
  // Add comma separators to integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const formattedNum = precision > 0 ? parts.join('.') : parts[0];
  return `${symbol} ${formattedNum}`;
}

/**
 * Formats an ISO string or Date into company time zone (default: Asia/Colombo)
 */
export function formatDateTime(
  isoDateStr: string | Date | undefined,
  timeZone: string = 'Asia/Colombo'
): string {
  if (!isoDateStr) return '—';

  try {
    const date = typeof isoDateStr === 'string' ? new Date(isoDateStr) : isoDateStr;
    if (isNaN(date.getTime())) return String(isoDateStr);

    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return String(isoDateStr);
  }
}

/**
 * Formats calendar dates without shifting the date due to time zone conversions
 */
export function formatDateOnly(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  // If in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}
