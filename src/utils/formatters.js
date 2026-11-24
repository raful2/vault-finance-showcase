/**
 * Currency, Date and Number Formatting Utilities
 */

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  CHF: 'CHF '
};

/**
 * Format currency amount with Privacy Blur masking support
 */
export function formatCurrency(amount, currency = 'USD', isPrivacyBlurred = false) {
  if (isPrivacyBlurred) {
    return '••••••';
  }

  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const symbol = CURRENCY_SYMBOLS[currency] || (currency + ' ');
  const formattedNumber = absNum.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2
  });

  return `${isNegative ? '-' : ''}${symbol}${formattedNumber}`;
}

/**
 * Format a percentage e.g. 52.4%
 */
export function formatPercent(value, decimals = 1) {
  const num = Number(value) || 0;
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format standard ISO date YYYY-MM-DD into human-friendly string
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get relative time (e.g., 'Today', 'Yesterday', '3 days ago')
 */
export function formatRelativeDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateString);
}
