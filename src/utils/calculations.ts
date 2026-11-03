/**
 * src/utils/calculations.ts
 * Mathematical Calculation Engine for Building Completion Estimating.
 * Pure, deterministic functions with robust floating-point precision guards.
 */

import { ProjectMarkups } from '../types/metadata';
import { ConsolidatedSummary, TradeRollup, CategoryBreakdown } from '../types/summary';

export interface ItemCostsResult {
  directUnitCost: number;     // materialRate + laborRate + equipmentRate
  directTotalCost: number;    // quantity * directUnitCost
  materialTotal: number;      // quantity * materialRate
  laborTotal: number;         // quantity * laborRate
  equipmentTotal: number;     // quantity * equipmentRate
}

export interface SubScopeTotalsResult {
  directTotal: number;
  materialTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  itemCount: number;
}

export interface TradeTotalsResult {
  directTotal: number;
  materialTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  itemCount: number;
}

/**
 * Standard symmetric 2-decimal financial rounding using exponential shifting.
 * Avoids IEEE-754 epsilon representation bugs on numbers like 35.855.
 * Safely handles micro-floats (< 0.005) and large numbers formatted in scientific notation without returning NaN.
 */
export function round2(val: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val) || Number.isNaN(val)) return 0;
  const abs = Math.abs(val);
  if (abs < 0.005) return 0;
  if (abs >= 1e14) return val;
  const str = abs.toString();
  if (str.includes('e')) return val;
  const sign = val < 0 ? -1 : 1;
  const shifted = Math.round(Number(abs + 'e2'));
  const shiftedStr = shifted.toString();
  if (shiftedStr.includes('e')) return val;
  const result = sign * Number(shiftedStr + 'e-2');
  return Number.isFinite(result) ? result : val;
}

/**
 * Clamps numeric value to >= 0, guarding against NaN and non-finite numbers.
 */
export function clampNonNegative(val: unknown): number {
  if (typeof val !== 'number' || !Number.isFinite(val) || Number.isNaN(val) || val < 0) return 0;
  return val;
}

/**
 * Calculates direct unit cost, item totals, and component breakdowns for a line item.
 */
export function calculateItemCosts(
  quantity: unknown,
  materialRate: unknown,
  laborRate: unknown,
  equipmentRate: unknown
): ItemCostsResult {
  const q = clampNonNegative(quantity);
  const m = clampNonNegative(materialRate);
  const l = clampNonNegative(laborRate);
  const e = clampNonNegative(equipmentRate);

  const directUnitCost = round2(m + l + e);
  const materialTotal = round2(q * m);
  const laborTotal = round2(q * l);
  const equipmentTotal = round2(q * e);
  // Guarantee directTotalCost === round2(materialTotal + laborTotal + equipmentTotal) down to the cent:
  const directTotalCost = round2(materialTotal + laborTotal + equipmentTotal);

  return { directUnitCost, directTotalCost, materialTotal, laborTotal, equipmentTotal };
}

/**
 * Aggregates all line items within a sub-scope.
 */
export function calculateSubScopeTotal(items?: Array<{
  quantity?: number;
  materialRate?: number;
  laborRate?: number;
  equipmentRate?: number;
}>): SubScopeTotalsResult {
  if (!Array.isArray(items) || items.length === 0) {
    return { directTotal: 0, materialTotal: 0, laborTotal: 0, equipmentTotal: 0, itemCount: 0 };
  }

  let directTotal = 0;
  let materialTotal = 0;
  let laborTotal = 0;
  let equipmentTotal = 0;
  let itemCount = 0;

  for (const item of items) {
    if (!item) continue;
    itemCount++;
    const costs = calculateItemCosts(
      item.quantity ?? 0,
      item.materialRate ?? 0,
      item.laborRate ?? 0,
      item.equipmentRate ?? 0
    );
    directTotal += costs.directTotalCost;
    materialTotal += costs.materialTotal;
    laborTotal += costs.laborTotal;
    equipmentTotal += costs.equipmentTotal;
  }

  materialTotal = round2(materialTotal);
  laborTotal = round2(laborTotal);
  equipmentTotal = round2(equipmentTotal);
  directTotal = round2(materialTotal + laborTotal + equipmentTotal);

  return {
    directTotal,
    materialTotal,
    laborTotal,
    equipmentTotal,
    itemCount,
  };
}

/**
 * Aggregates all sub-scopes within a trade.
 */
export function calculateTradeTotal(trade?: {
  subScopes?: Array<{
    items?: Array<{
      quantity?: number;
      materialRate?: number;
      laborRate?: number;
      equipmentRate?: number;
    }>;
  }>;
}): TradeTotalsResult {
  if (!trade || !Array.isArray(trade.subScopes)) {
    return { directTotal: 0, materialTotal: 0, laborTotal: 0, equipmentTotal: 0, itemCount: 0 };
  }

  let directTotal = 0;
  let materialTotal = 0;
  let laborTotal = 0;
  let equipmentTotal = 0;
  let itemCount = 0;

  for (const scope of trade.subScopes) {
    if (!scope) continue;
    const s = calculateSubScopeTotal(scope.items);
    directTotal += s.directTotal;
    materialTotal += s.materialTotal;
    laborTotal += s.laborTotal;
    equipmentTotal += s.equipmentTotal;
    itemCount += s.itemCount;
  }

  materialTotal = round2(materialTotal);
  laborTotal = round2(laborTotal);
  equipmentTotal = round2(equipmentTotal);
  directTotal = round2(materialTotal + laborTotal + equipmentTotal);

  return {
    directTotal,
    materialTotal,
    laborTotal,
    equipmentTotal,
    itemCount,
  };
}

/**
 * Computes consolidated direct cost, trade rollups, compounding indirect markups,
 * and cost per floor area metrics.
 */
export function calculateConsolidatedSummary(
  trades?: Array<{
    id?: string;
    code?: string;
    name?: string;
    shortName?: string;
    tradeNumber?: number;
    tabIndex?: number;
    subScopes?: Array<{
      items?: Array<{
        quantity?: number;
        materialRate?: number;
        laborRate?: number;
        equipmentRate?: number;
      }>;
    }>;
  }>,
  markups?: Partial<ProjectMarkups>,
  floorArea?: unknown
): ConsolidatedSummary {
  const safeTrades = Array.isArray(trades) ? trades : [];

  let directCost = 0;
  let materialTotal = 0;
  let laborTotal = 0;
  let equipmentTotal = 0;

  const tradeRollups: TradeRollup[] = safeTrades.map((trade, idx) => {
    const totals = calculateTradeTotal(trade);
    directCost += totals.directTotal;
    materialTotal += totals.materialTotal;
    laborTotal += totals.laborTotal;
    equipmentTotal += totals.equipmentTotal;

    const tradeId = trade.id || `trade_${idx + 1}`;
    const tradeCode = trade.code || `TR-${idx + 1}`;
    const tradeName = trade.name || `Trade ${idx + 1}`;

    return {
      tradeId,
      tradeCode,
      code: tradeCode,
      tradeName,
      name: tradeName,
      shortName: trade.shortName || tradeName,
      tradeNumber: trade.tradeNumber ?? idx + 1,
      materialTotal: totals.materialTotal,
      laborTotal: totals.laborTotal,
      equipmentTotal: totals.equipmentTotal,
      directTotal: totals.directTotal,
      percentageOfDirectCost: 0,
      percentageShare: 0,
      itemCount: totals.itemCount,
    };
  });

  materialTotal = round2(materialTotal);
  laborTotal = round2(laborTotal);
  equipmentTotal = round2(equipmentTotal);
  directCost = round2(materialTotal + laborTotal + equipmentTotal);

  // Compute percentage shares per trade
  for (const rollup of tradeRollups) {
    const pct = directCost > 0 ? round2((rollup.directTotal / directCost) * 100) : 0;
    rollup.percentageOfDirectCost = pct;
    rollup.percentageShare = pct;
  }

  // Cost type allocation shares
  const materialSharePercent = directCost > 0 ? round2((materialTotal / directCost) * 100) : 0;
  const laborSharePercent = directCost > 0 ? round2((laborTotal / directCost) * 100) : 0;
  const equipmentSharePercent = directCost > 0 ? round2((equipmentTotal / directCost) * 100) : 0;

  const categoryBreakdown: CategoryBreakdown = {
    materialTotal,
    laborTotal,
    equipmentTotal,
    directTotal: directCost,
    materialPercentage: materialSharePercent,
    laborPercentage: laborSharePercent,
    equipmentPercentage: equipmentSharePercent,
  };

  // Markup percentages with clamping
  const ocmPercent = clampNonNegative(markups?.ocmPercent ?? 8);
  const profitPercent = clampNonNegative(markups?.profitPercent ?? 10);
  const taxPercent = clampNonNegative(markups?.taxPercent ?? 12);
  const isAdditive = markups?.markupMethod === 'additive';

  let ocmAmount = 0;
  let subtotalAfterOCM = 0;
  let profitAmount = 0;
  let subtotalBeforeTax = 0;
  let taxAmount = 0;
  let grandTotal = 0;

  if (isAdditive) {
    ocmAmount = round2(directCost * (ocmPercent / 100));
    profitAmount = round2(directCost * (profitPercent / 100));
    subtotalAfterOCM = round2(directCost + ocmAmount);
    subtotalBeforeTax = round2(directCost + ocmAmount + profitAmount);
    taxAmount = round2(subtotalBeforeTax * (taxPercent / 100));
    grandTotal = round2(subtotalBeforeTax + taxAmount);
  } else {
    // Default Compounding / Cascading model (Plan line 92)
    ocmAmount = round2(directCost * (ocmPercent / 100));
    subtotalAfterOCM = round2(directCost + ocmAmount);
    profitAmount = round2(subtotalAfterOCM * (profitPercent / 100));
    subtotalBeforeTax = round2(subtotalAfterOCM + profitAmount);
    taxAmount = round2(subtotalBeforeTax * (taxPercent / 100));
    grandTotal = round2(subtotalBeforeTax + taxAmount);
  }

  // Floor area benchmark KPI (guarding against 0, negative, NaN, and non-numeric)
  const validArea =
    typeof floorArea === 'number' && Number.isFinite(floorArea) && !Number.isNaN(floorArea) && floorArea > 0
      ? floorArea
      : 0;
  const costPerFloorArea = validArea > 0 ? round2(grandTotal / validArea) : 0;
  const directCostPerFloorArea = validArea > 0 ? round2(directCost / validArea) : 0;

  return {
    directCost,
    materialTotal,
    laborTotal,
    equipmentTotal,
    categoryBreakdown,
    tradeRollups,
    ocmPercent,
    ocmAmount,
    subtotalAfterOCM,
    profitPercent,
    profitAmount,
    subtotalBeforeTax,
    taxPercent,
    taxAmount,
    grandTotal,
    totalFloorArea: validArea,
    floorArea: validArea,
    costPerFloorArea,
    directCostPerFloorArea,
    materialSharePercent,
    laborSharePercent,
    equipmentSharePercent,
  };
}
