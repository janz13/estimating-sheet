/**
 * src/utils/autoEstimateEngine.ts
 * Calculation Engine for Automated Parametric Estimating based on Philippine Construction Benchmarks.
 */

import {
  AutoEstimateParams,
  AutoEstimateResult,
  TradeEstimateBreakdown,
} from '../types/autoEstimate';
import { ProjectEstimateState, Trade, EstimateItem } from '../types/estimate';
import { ProjectMarkups } from '../types/metadata';
import {
  PHILIPPINE_CONSTRUCTION_TIERS,
  getTradePercentages,
} from '../constants/philippineRates';
import { TECHNICAL_TRADES } from '../constants/trades';
import { round2, calculateItemCosts } from './calculations';

export const DEFAULT_AUTO_PARAMS: AutoEstimateParams = {
  storeys: 2,
  storeyHeight: 3.0,
  groundFloorArea: 100,
  secondFloorArea: 80,
  thirdFloorArea: 0,
  tier: 'mid',
  bedroomsFloor1: 1,
  bedroomsFloor2: 3,
  bathroomsFloor1: 1,
  bathroomsFloor2: 2,
  doorsFloor1: 5,
  doorsFloor2: 5,
  doorsCount: 10,
  windowsFloor1: 6,
  windowsFloor2: 6,
  windowsCount: 12,
  wallType: 'all_chb',
};

/**
 * Calculates a parametric estimate from high-level architectural parameters.
 */
export function calculateParametricEstimate(
  params: AutoEstimateParams,
  markups?: Partial<ProjectMarkups>
): AutoEstimateResult {
  // 1. Calculate Gross Floor Area
  let totalFloorArea = Math.max(1, params.groundFloorArea || 0);
  if (params.storeys >= 2) {
    totalFloorArea += Math.max(0, params.secondFloorArea || 0);
  }
  if (params.storeys >= 3) {
    totalFloorArea += Math.max(0, params.thirdFloorArea || 0);
  }

  // 2. Base Rate from Tier or Custom Override
  const tierConfig = PHILIPPINE_CONSTRUCTION_TIERS[params.tier];
  const baseRatePerSqM = params.customRatePerSqM && params.customRatePerSqM > 0
    ? params.customRatePerSqM
    : tierConfig.defaultRatePHP;

  // 3. Parametric Modifiers
  let modifierMultiplier = 1.0;
  const summaryNotes: string[] = [];

  // Storey Height modifier (benchmark is 3.0m)
  const heightDelta = (params.storeyHeight || 3.0) - 3.0;
  if (Math.abs(heightDelta) >= 0.1) {
    const heightFactor = (heightDelta / 0.2) * 0.025; // 2.5% per 20cm
    modifierMultiplier += heightFactor;
    summaryNotes.push(
      `Storey height of ${params.storeyHeight}m adjusted structure cost by ${(heightFactor * 100).toFixed(1)}%`
    );
  }

  // Storey Complexity modifier (stairs, suspended slabs, hoisting)
  if (params.storeys === 2) {
    modifierMultiplier += 0.03; // +3% for suspended slab & stairs
    summaryNotes.push('2-Storey suspended slab & staircase structural factor (+3%)');
  } else if (params.storeys >= 3) {
    modifierMultiplier += 0.06; // +6% for multi-level suspended slabs & hoisting
    summaryNotes.push('3-Storey suspended slabs, vertical hoisting & column reinforcement (+6%)');
  }

  // Wall Type sensitivity:
  // In Philippine construction, lightweight metal stud drywall partitions are ~15-25% cheaper
  // than wet-laid, plastered, and cured 100mm CHB walls.
  // This yields an overall ~4.0% direct structure cost savings when part-drywall is selected.
  let wallTypeMultiplier = 1.0;
  if (params.wallType === 'part_chb_part_drywall') {
    wallTypeMultiplier = 0.96; // 4% total direct savings
    summaryNotes.push('Light-gauge steel stud & drywall interior partitions (-4% savings vs. full CHB)');
  } else {
    summaryNotes.push('Full Concrete Hollow Block (CHB) exterior and interior masonry partitions');
  }

  // Bathrooms modifier
  const totalBaths = (params.bathroomsFloor1 || 0) + (params.storeys >= 2 ? (params.bathroomsFloor2 || 0) : 0);
  const standardBaths = params.storeys;
  const extraBaths = Math.max(0, totalBaths - standardBaths);
  const bathExtraCostPerUnit = params.tier === 'low' ? 35000 : params.tier === 'mid' ? 55000 : 90000;
  const totalBathAdjustment = extraBaths * bathExtraCostPerUnit;
  if (extraBaths > 0) {
    summaryNotes.push(
      `${extraBaths} additional bathroom(s) added ₱${totalBathAdjustment.toLocaleString()} for wet waterproofing and piping`
    );
  }

  // Doors & Windows sensitivity:
  // Baseline ratio in residential construction:
  // ~1 door per 18 m² (min 4 doors)
  // ~1 window per 14 m² (min 4 windows)
  const totalDoors = params.doorsFloor1 !== undefined || params.doorsFloor2 !== undefined
    ? (params.doorsFloor1 || 0) + (params.storeys >= 2 ? (params.doorsFloor2 || 0) : 0)
    : (params.doorsCount || 10);

  const totalWindows = params.windowsFloor1 !== undefined || params.windowsFloor2 !== undefined
    ? (params.windowsFloor1 || 0) + (params.storeys >= 2 ? (params.windowsFloor2 || 0) : 0)
    : (params.windowsCount || 12);

  const baselineDoors = Math.max(3, Math.round(totalFloorArea / 18));
  const baselineWindows = Math.max(4, Math.round(totalFloorArea / 14));

  const doorRate = params.tier === 'low' ? 4500 : params.tier === 'mid' ? 8500 : 18000;
  const windowRate = params.tier === 'low' ? 4000 : params.tier === 'mid' ? 8000 : 16000;

  const doorDelta = totalDoors - baselineDoors;
  const doorAdjustment = doorDelta * doorRate;

  const windowDelta = totalWindows - baselineWindows;
  const windowAdjustment = windowDelta * windowRate;

  if (doorDelta !== 0) {
    summaryNotes.push(
      `${totalDoors} door(s) (${doorDelta > 0 ? '+' : ''}${doorDelta} vs baseline of ${baselineDoors}): ${doorAdjustment >= 0 ? '+' : ''}₱${doorAdjustment.toLocaleString()}`
    );
  }

  if (windowDelta !== 0) {
    summaryNotes.push(
      `${totalWindows} window(s) (${windowDelta > 0 ? '+' : ''}${windowDelta} vs baseline of ${baselineWindows}): ${windowAdjustment >= 0 ? '+' : ''}₱${windowAdjustment.toLocaleString()}`
    );
  }

  // 4. Compute Direct Cost
  const adjustedBaseRate = round2(baseRatePerSqM * modifierMultiplier * wallTypeMultiplier);
  const baseDirectCost = round2(totalFloorArea * adjustedBaseRate);
  const totalDirectCost = round2(
    Math.max(1000, baseDirectCost + totalBathAdjustment + doorAdjustment + windowAdjustment)
  );
  const effectiveRatePerSqM = round2(totalDirectCost / totalFloorArea);

  // 5. Compute Trade Breakdown
  const tradePcts = getTradePercentages(params.wallType);

  // Allocate trade amounts ensuring exact sum matching totalDirectCost
  let accumulatedCost = 0;
  const tradeBreakdowns: TradeEstimateBreakdown[] = TECHNICAL_TRADES.map((trade, idx) => {
    const isLast = idx === TECHNICAL_TRADES.length - 1;
    const pct = tradePcts[trade.id] || 10.0;
    let directCost: number;

    if (isLast) {
      directCost = round2(totalDirectCost - accumulatedCost);
    } else {
      directCost = round2(totalDirectCost * (pct / 100));
      accumulatedCost += directCost;
    }

    return {
      tradeId: trade.id,
      tradeCode: trade.code,
      tradeName: trade.name,
      percentageShare: pct,
      directCost,
      description: trade.subScopeTemplates.map((s) => s.name).join(' • '),
    };
  });

  // 6. Range Band (±7.5%)
  const lowRangeTotal = round2(totalDirectCost * 0.925);
  const highRangeTotal = round2(totalDirectCost * 1.075);

  // 7. Markups
  const ocm = markups?.ocmPercent ?? 8.0;
  const profit = markups?.profitPercent ?? 10.0;
  const tax = markups?.taxPercent ?? 12.0;

  const afterOcm = totalDirectCost * (1 + ocm / 100);
  const beforeTax = afterOcm * (1 + profit / 100);
  const estimatedGrandTotal = round2(beforeTax * (1 + tax / 100));

  return {
    totalFloorArea,
    baseRatePerSqM,
    effectiveRatePerSqM,
    totalDirectCost,
    lowRangeTotal,
    highRangeTotal,
    estimatedGrandTotal,
    tradeBreakdowns,
    summaryNotes,
  };
}

/**
 * Applies the automated parametric calculation back into the main project state,
 * updating metadata and scaling trade line items proportionally.
 */
export function applyParametricToProject(
  state: ProjectEstimateState,
  params: AutoEstimateParams
): ProjectEstimateState {
  const result = calculateParametricEstimate(params, state.markups);
  const now = new Date().toISOString();

  // Scale each trade's existing items so their sum matches the target trade cost
  const updatedTrades: Trade[] = state.trades.map((trade) => {
    const targetBreakdown = result.tradeBreakdowns.find((b) => b.tradeId === trade.id);
    const targetTradeCost = targetBreakdown ? targetBreakdown.directCost : 0;

    // Calculate current trade total
    let currentTradeTotal = 0;
    trade.subScopes.forEach((s) => {
      s.items.forEach((i) => {
        currentTradeTotal += i.directTotalCost || 0;
      });
    });

    const scaleFactor = currentTradeTotal > 0 && targetTradeCost > 0
      ? targetTradeCost / currentTradeTotal
      : 1;

    const updatedSubScopes = trade.subScopes.map((scope) => {
      const updatedItems: EstimateItem[] = scope.items.map((item) => {
        // Proportionally scale quantity
        const newQty = round2(item.quantity * scaleFactor);
        const costs = calculateItemCosts(
          newQty,
          item.materialRate,
          item.laborRate,
          item.equipmentRate
        );
        return {
          ...item,
          quantity: newQty,
          directUnitCost: costs.directUnitCost,
          directTotalCost: costs.directTotalCost,
          materialTotalCost: costs.materialTotal,
          laborTotalCost: costs.laborTotal,
          equipmentTotalCost: costs.equipmentTotal,
          totalCost: costs.directTotalCost * (1 + (item.markupPercent || 0) / 100),
        };
      });
      return { ...scope, items: updatedItems };
    });

    return { ...trade, subScopes: updatedSubScopes };
  });

  return {
    ...state,
    updatedAt: now,
    metadata: {
      ...state.metadata,
      totalFloorArea: result.totalFloorArea,
      floorAreaUnit: 'm²',
      currency: '₱',
      notes: `Parametric Estimate: ${params.storeys}-Storey (${params.tier.toUpperCase()} Finish) @ ₱${result.effectiveRatePerSqM.toLocaleString()}/m². Wall Type: ${params.wallType === 'all_chb' ? 'All CHB' : 'Part Drywall'}. Doors: ${params.doorsCount}, Windows: ${params.windowsCount}.`,
    },
    trades: updatedTrades,
    activeTab: 'summary', // Direct to summary to see the results
  };
}
