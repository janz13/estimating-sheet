/**
 * src/constants/philippineRates.ts
 * Philippine Construction Benchmark Rates (2024–2026 Standards) and Trade Scope Percentages.
 */

import { ConstructionTier, WallConstructionType } from '../types/autoEstimate';

export interface TierConfig {
  tier: ConstructionTier;
  label: string;
  subLabel: string;
  defaultRatePHP: number;
  minRatePHP: number;
  maxRatePHP: number;
  specification: string;
  typicalFinishes: string[];
}

export const PHILIPPINE_CONSTRUCTION_TIERS: Record<ConstructionTier, TierConfig> = {
  low: {
    tier: 'low',
    label: 'Low-Cost / Economic',
    subLabel: 'Basic / Socialized Finish',
    defaultRatePHP: 20000,
    minRatePHP: 18000,
    maxRatePHP: 24000,
    specification: 'Bare to standard basic finishes, plain cement or 300x300 ceramic tiles, corrugated G.I. roof, hollow-core doors, standard aluminum/jalousie windows, basic sanitary fixtures.',
    typicalFinishes: [
      'Plain cement plaster with flat latex paint',
      'Ceramic floor tiles (300x300mm) or vinyl tiles',
      'Corrugated G.I. roofing on light steel trusses',
      'Flush hollow-core timber doors',
      'Standard aluminum framed sliding windows',
      'PVC electrical conduits & standard sanitary PVC lines',
    ],
  },
  mid: {
    tier: 'mid',
    label: 'Mid-Cost / Standard',
    subLabel: 'Semi-Elegant Finish',
    defaultRatePHP: 32000,
    minRatePHP: 28000,
    maxRatePHP: 38000,
    specification: '600x600 porcelain tiles, custom modular kitchen cabinets, powder-coated aluminum sliding/casement windows, moulded panel doors, pre-painted rib-type long-span roof, PPR water distribution lines.',
    typicalFinishes: [
      'Skim-coated plaster with semi-gloss elastomeric paint',
      'Homogeneous porcelain floor & wall tiles (600x600mm)',
      'Pre-painted long-span rib roofing with PE foam insulation',
      'Solid wood panel entrance door & moulded interior doors',
      'Powder-coated aluminum analoc sliding/awning windows',
      'PPR PN-20 hot & cold water lines, stainless steel stair railing',
    ],
  },
  high: {
    tier: 'high',
    label: 'High-Cost / Luxury',
    subLabel: 'High-End / Executive Finish',
    defaultRatePHP: 52000,
    minRatePHP: 45000,
    maxRatePHP: 65000,
    specification: 'Imported large-format tiles, solid hardwood flooring, uPVC or thermal-break glass windows, solid hardwood pivot doors, multi-point water heaters, inverter AC ducting rough-ins, tempered glass balustrades.',
    typicalFinishes: [
      'Multi-coat skim coat render with anti-fungal premium paint',
      'Large format Italian/Spanish porcelain or engineered hardwood',
      'Standing-seam or asphalt shingle roofing with acoustic rockwool',
      'Solid Narra/Mahogany pivot entrance door with smart lockset',
      'European uPVC double-glazed thermal break windows',
      'Inverter AC copper line layout, central fire sprinkler system',
    ],
  },
};

/**
 * Baseline percentage distribution of total direct costs across the 10 technical trades in the Philippines.
 */
export const TRADE_PERCENTAGES_ALL_CHB: Record<string, number> = {
  trade_earthworks: 5.0,         // Earthworks, Scaffolding, Site Prep
  trade_concrete: 33.0,          // Footings, Columns, Beams, CHB Walls, Plaster
  trade_waterproofing: 2.5,      // Toilets, Balconies, Roof Deck
  trade_steel_roofing: 10.0,     // Steel Trusses, Purlins, Roof Sheets
  trade_carpentry_drywall: 7.5,  // Ceilings, Cabinets
  trade_doors_windows: 8.0,      // Doors, Windows, Railings
  trade_finishes_painting: 14.0, // Tiles, Paint
  trade_plumbing: 6.0,           // Water & Sanitary lines
  trade_electrical: 8.0,         // Conduits, Wiring, Panels
  trade_mechanical_fire: 6.0,    // HVAC lines, Fire Safety
};

export const TRADE_PERCENTAGES_PART_DRYWALL: Record<string, number> = {
  trade_earthworks: 5.0,
  trade_concrete: 27.0,          // Reduced CHB/plaster volume
  trade_waterproofing: 2.5,
  trade_steel_roofing: 10.0,
  trade_carpentry_drywall: 13.5, // Increased drywall framing & boards
  trade_doors_windows: 8.0,
  trade_finishes_painting: 14.0,
  trade_plumbing: 6.0,
  trade_electrical: 8.0,
  trade_mechanical_fire: 6.0,
};

export function getTradePercentages(wallType: WallConstructionType): Record<string, number> {
  return wallType === 'part_chb_part_drywall'
    ? TRADE_PERCENTAGES_PART_DRYWALL
    : TRADE_PERCENTAGES_ALL_CHB;
}
