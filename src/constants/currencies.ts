/**
 * src/constants/currencies.ts
 * Currency profiles with symbols, ISO codes, and formatting rules.
 */

import { Currency, ProjectMarkups } from '../types/metadata';

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', precision: 2 },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH', precision: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', precision: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', precision: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', precision: 0 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', precision: 2 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA', precision: 2 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'en-AE', precision: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', precision: 2 },
];

export const DEFAULT_CURRENCY: Currency = SUPPORTED_CURRENCIES[1];

export const DEFAULT_PROJECT_MARKUPS: ProjectMarkups = {
  ocmPercent: 8.0,      // Overhead, Contingency & Misc %
  profitPercent: 10.0,   // Contractor's Profit Margin %
  taxPercent: 12.0,      // Value Added Tax / Sales Tax %
  markupMethod: 'compounded',
};
