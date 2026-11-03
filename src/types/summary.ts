/**
 * src/types/summary.ts
 * Types for consolidated master summaries, trade roll-ups, category distributions, and analytics charts.
 */

import { FloorAreaUnit } from './metadata';

/**
 * Direct cost roll-up summary for a single technical trade.
 */
export interface TradeRollup {
  tradeId: string;
  tradeNumber?: number;
  code?: string;
  tradeCode?: string;
  name?: string;
  tradeName?: string;
  shortName?: string;
  materialTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  directTotal: number;
  itemCount?: number;
  percentageOfDirectCost: number; // Share of overall project direct cost (0 - 100%)
  percentageShare: number;        // Alias for compatibility
}

/**
 * Category-level breakdown across Material, Labor, and Equipment.
 */
export interface CategoryBreakdown {
  materialTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  directTotal: number;
  materialPercentage: number;     // e.g. 58.17%
  laborPercentage: number;        // e.g. 33.87%
  equipmentPercentage: number;    // e.g. 7.96%
}

/**
 * Comprehensive master summary output consolidating all 10 technical trades and indirect markups.
 */
export interface ConsolidatedSummary {
  directCost: number;             // Total direct cost sum of all 10 trades
  materialTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  categoryBreakdown?: CategoryBreakdown;
  tradeRollups: TradeRollup[];

  // Compounded / Additive Indirect Markups Breakdown
  ocmPercent: number;
  ocmAmount: number;
  subtotalAfterOCM: number;
  profitPercent: number;
  profitAmount: number;
  subtotalBeforeTax: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;

  // Floor Area KPI Benchmark
  totalFloorArea?: number;
  floorArea?: number;
  floorAreaUnit?: FloorAreaUnit;
  costPerFloorArea: number;       // grandTotal / totalFloorArea ($/m² or $/sq.ft)
  directCostPerFloorArea?: number;// directCost / totalFloorArea

  // Cost type allocation shares
  materialSharePercent?: number;
  laborSharePercent?: number;
  equipmentSharePercent?: number;
}

/**
 * Data point for Pure React SVG Donut Chart.
 */
export interface DonutChartSlice {
  id: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

/**
 * Category bar item for Pure React SVG Stacked Bar Chart.
 */
export interface StackedBarCategory {
  label: string;
  material: number;
  labor: number;
  equipment: number;
  total: number;
}
