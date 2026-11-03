/**
 * src/utils/formatters.ts
 * Formatting utilities for Currencies, Percentages, Numbers, and Units.
 */

/**
 * Formats a numeric value into a standard currency string (e.g. "$1,234.56" or "₱1,234.56").
 * Handles negative values with leading minus sign ("-$1,234.56").
 */
export function formatCurrency(
  amount: unknown,
  currency = '$',
  decimals = 2
): string {
  const val = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(val));

  const sign = val < 0 ? '-' : '';
  return `${sign}${currency}${formattedNumber}`;
}

/**
 * Formats a percentage value (e.g. 8.0 -> "8.0%" or 12.35 -> "12.4%").
 */
export function formatPercent(
  value: unknown,
  decimals = 1,
  includeSign = true
): string {
  const val = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `${val.toFixed(decimals)}${includeSign ? '%' : ''}`;
}

/**
 * Formats a general number with thousand separators (e.g. 1950.5 -> "1,950.50").
 */
export function formatNumber(value: unknown, decimals = 2): string {
  const val = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

/**
 * Normalizes construction units to standard SI / metric typography.
 * (e.g. "cu.m" -> "m³", "sq.m" -> "m²").
 */
export function formatUnit(unit?: string): string {
  if (!unit) return 'pcs';
  const u = unit.trim().toLowerCase();
  switch (u) {
    case 'cu.m':
    case 'cum':
    case 'm3':
      return 'm³';
    case 'sq.m':
    case 'sqm':
    case 'm2':
      return 'm²';
    case 'lin.m':
    case 'lm':
    case 'm':
      return 'lm';
    case 'set':
    case 'sets':
      return 'sets';
    case 'pc':
    case 'pcs':
    case 'piece':
      return 'pcs';
    case 'pt':
    case 'pts':
    case 'point':
    case 'points':
      return 'points';
    case 'kg':
    case 'kgs':
      return 'kg';
    case 'ton':
    case 'tons':
      return 'tons';
    case 'roll':
    case 'rolls':
      return 'rolls';
    case 'liter':
    case 'liters':
    case 'l':
      return 'liters';
    case 'lot':
    case 'ls':
      return 'lot';
    default:
      return unit;
  }
}
