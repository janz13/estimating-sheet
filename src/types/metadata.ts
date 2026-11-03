/**
 * src/types/metadata.ts
 * Types for project-level metadata, client info, indirect markups, and currency configuration.
 */

export type FloorAreaUnit = 'm²' | 'sq.ft';

export type ProjectStatus = 'Draft' | 'Under Review' | 'Approved' | 'Final Proposal';

export type MarkupMethod = 'compounded' | 'additive';

/**
 * Currency configuration profile.
 */
export interface Currency {
  code: string;             // ISO 4217 code: e.g. "USD", "PHP", "EUR"
  symbol: string;           // Display symbol: e.g. "$", "₱", "€"
  name: string;             // Display name: e.g. "US Dollar"
  locale: string;           // Intl locale string: e.g. "en-US", "en-PH"
  precision: number;        // Decimal digits: e.g. 2
}

/**
 * Top-level project identifying information.
 */
export interface ProjectMetadata {
  projectName: string;      // e.g. "Luxury 2-Storey Modern Residence"
  clientName: string;       // e.g. "Mr. & Mrs. Anderson"
  location: string;         // e.g. "Austin, TX / Metro Manila"
  estimator: string;        // e.g. "Engr. J. Smith, PE"
  date: string;             // ISO Date: e.g. "2026-11-03"
  totalFloorArea: number;   // Gross Floor Area: e.g. 250.00
  floorAreaUnit: FloorAreaUnit; // 'm²' | 'sq.ft' (default 'm²')
  currency: string;         // Currency symbol or code (default "$")
  status: ProjectStatus;    // Current lifecycle status
  notes?: string;           // General estimator remarks
}

/**
 * Project-level indirect costs & markups.
 */
export interface ProjectMarkups {
  ocmPercent: number;       // Overhead, Contingencies & Misc % (default 8.0%)
  profitPercent: number;    // Contractor's Profit Margin % (default 10.0%)
  taxPercent: number;       // Value Added Tax / Sales Tax % (default 12.0%)
  markupMethod?: MarkupMethod; // 'compounded' | 'additive' (default 'compounded')
}
