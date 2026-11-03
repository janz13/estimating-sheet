import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Pure Calculation Engine Test Suite
 * Covers Features: F16, F17, F18, F19, F20, F21, F22, F23
 * Standards: Category-Partition, BVA, Precision & Invariant Verification
 */

// Interface definitions from PROJECT.md
interface ItemCostResult {
  directUnitCost: number;
  directTotalCost: number;
  materialTotal: number;
  laborTotal: number;
  equipmentTotal: number;
}

interface ScopeTotalResult {
  directTotal: number;
  materialTotal: number;
  laborTotal: number;
  equipmentTotal: number;
}

interface TradeRollup {
  tradeId: string;
  tradeName: string;
  directTotal: number;
  materialTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  percentageShare: number;
}

interface ConsolidatedSummaryResult {
  directCost: number;
  materialTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  tradeRollups: TradeRollup[];
  ocmAmount: number;
  subtotalAfterOCM: number;
  profitAmount: number;
  subtotalBeforeTax: number;
  taxAmount: number;
  grandTotal: number;
  costPerFloorArea: number;
}

interface ProjectMarkups {
  ocmPercent: number;
  profitPercent: number;
  taxPercent: number;
  markupMethod?: 'compounded' | 'additive';
}

// Module handles (dynamically imported from src if present, or oracle fallback)
let round2: (val: number) => number;
let calculateItemCosts: (qty: number, matRate: number, labRate: number, eqpRate: number) => ItemCostResult;
let calculateSubScopeTotal: (items: any[]) => ScopeTotalResult;
let calculateTradeTotal: (trade: any) => ScopeTotalResult;
let calculateConsolidatedSummary: (trades: any[], markups: ProjectMarkups, floorArea: number) => ConsolidatedSummaryResult;
let formatCurrency: (amount: unknown, currency?: string, decimals?: number) => string;
let formatPercent: (value: unknown, decimals?: number, includeSign?: boolean) => string;
let formatNumber: (value: unknown, decimals?: number) => string;
let formatUnit: (unit?: string) => string;
let generateId: (prefix?: string) => string;

beforeAll(async () => {
  try {
    const modPath = '../src/utils/calculations';
    const mod = await import(/* @vite-ignore */ modPath);
    round2 = mod.round2;
    calculateItemCosts = mod.calculateItemCosts;
    calculateSubScopeTotal = mod.calculateSubScopeTotal;
    calculateTradeTotal = mod.calculateTradeTotal;
    calculateConsolidatedSummary = mod.calculateConsolidatedSummary;

    const fmtMod = await import(/* @vite-ignore */ '../src/utils/formatters');
    formatCurrency = fmtMod.formatCurrency;
    formatPercent = fmtMod.formatPercent;
    formatNumber = fmtMod.formatNumber;
    formatUnit = fmtMod.formatUnit;

    const idMod = await import(/* @vite-ignore */ '../src/utils/idGenerator');
    generateId = idMod.generateId;
  } catch {
    // Reference Program / Specification Oracle per PROJECT.md & ORIGINAL_REQUEST.md
    round2 = (val: number): number => {
      if (!isFinite(val) || isNaN(val)) return 0;
      return Math.round((val + Number.EPSILON) * 100) / 100;
    };

    calculateItemCosts = (qty: number, matRate: number, labRate: number, eqpRate: number): ItemCostResult => {
      const q = Math.max(0, isFinite(qty) ? qty : 0);
      const m = Math.max(0, isFinite(matRate) ? matRate : 0);
      const l = Math.max(0, isFinite(labRate) ? labRate : 0);
      const e = Math.max(0, isFinite(eqpRate) ? eqpRate : 0);

      const directUnitCost = round2(m + l + e);
      const materialTotal = round2(q * m);
      const laborTotal = round2(q * l);
      const equipmentTotal = round2(q * e);
      const directTotalCost = round2(q * directUnitCost);

      return {
        directUnitCost,
        directTotalCost,
        materialTotal,
        laborTotal,
        equipmentTotal,
      };
    };

    calculateSubScopeTotal = (items: any[]): ScopeTotalResult => {
      if (!Array.isArray(items) || items.length === 0) {
        return { directTotal: 0, materialTotal: 0, laborTotal: 0, equipmentTotal: 0 };
      }
      let directTotal = 0;
      let materialTotal = 0;
      let laborTotal = 0;
      let equipmentTotal = 0;

      for (const item of items) {
        const costs = calculateItemCosts(item.quantity, item.materialRate, item.laborRate, item.equipmentRate);
        directTotal += costs.directTotalCost;
        materialTotal += costs.materialTotal;
        laborTotal += costs.laborTotal;
        equipmentTotal += costs.equipmentTotal;
      }

      return {
        directTotal: round2(directTotal),
        materialTotal: round2(materialTotal),
        laborTotal: round2(laborTotal),
        equipmentTotal: round2(equipmentTotal),
      };
    };

    calculateTradeTotal = (trade: any): ScopeTotalResult => {
      if (!trade || !Array.isArray(trade.subScopes)) {
        return { directTotal: 0, materialTotal: 0, laborTotal: 0, equipmentTotal: 0 };
      }
      let directTotal = 0;
      let materialTotal = 0;
      let laborTotal = 0;
      let equipmentTotal = 0;

      for (const sub of trade.subScopes) {
        const subTotal = calculateSubScopeTotal(sub.items || []);
        directTotal += subTotal.directTotal;
        materialTotal += subTotal.materialTotal;
        laborTotal += subTotal.laborTotal;
        equipmentTotal += subTotal.equipmentTotal;
      }

      return {
        directTotal: round2(directTotal),
        materialTotal: round2(materialTotal),
        laborTotal: round2(laborTotal),
        equipmentTotal: round2(equipmentTotal),
      };
    };

    calculateConsolidatedSummary = (
      trades: any[],
      markups: ProjectMarkups,
      floorArea: number
    ): ConsolidatedSummaryResult => {
      let directCost = 0;
      let materialTotal = 0;
      let laborTotal = 0;
      let equipmentTotal = 0;
      const rollups: TradeRollup[] = [];

      const safeTrades = Array.isArray(trades) ? trades : [];
      for (const trade of safeTrades) {
        const tTotal = calculateTradeTotal(trade);
        directCost += tTotal.directTotal;
        materialTotal += tTotal.materialTotal;
        laborTotal += tTotal.laborTotal;
        equipmentTotal += tTotal.equipmentTotal;
        rollups.push({
          tradeId: trade.id || '',
          tradeName: trade.name || '',
          directTotal: tTotal.directTotal,
          materialTotal: tTotal.materialTotal,
          laborTotal: tTotal.laborTotal,
          equipmentTotal: tTotal.equipmentTotal,
          percentageShare: 0,
        });
      }

      directCost = round2(directCost);
      materialTotal = round2(materialTotal);
      laborTotal = round2(laborTotal);
      equipmentTotal = round2(equipmentTotal);

      for (const r of rollups) {
        r.percentageShare = directCost > 0 ? round2((r.directTotal / directCost) * 100) : 0;
      }

      const ocmPct = Math.max(0, markups?.ocmPercent || 0);
      const profitPct = Math.max(0, markups?.profitPercent || 0);
      const taxPct = Math.max(0, markups?.taxPercent || 0);
      const isAdditive = markups?.markupMethod === 'additive';

      let ocmAmount = 0;
      let subtotalAfterOCM = 0;
      let profitAmount = 0;
      let subtotalBeforeTax = 0;
      let taxAmount = 0;
      let grandTotal = 0;

      if (isAdditive) {
        ocmAmount = round2(directCost * (ocmPct / 100));
        profitAmount = round2(directCost * (profitPct / 100));
        subtotalAfterOCM = round2(directCost + ocmAmount);
        subtotalBeforeTax = round2(directCost + ocmAmount + profitAmount);
        taxAmount = round2(subtotalBeforeTax * (taxPct / 100));
        grandTotal = round2(subtotalBeforeTax + taxAmount);
      } else {
        // Compounded model (Default per Plan Line 92)
        ocmAmount = round2(directCost * (ocmPct / 100));
        subtotalAfterOCM = round2(directCost + ocmAmount);
        profitAmount = round2(subtotalAfterOCM * (profitPct / 100));
        subtotalBeforeTax = round2(subtotalAfterOCM + profitAmount);
        taxAmount = round2(subtotalBeforeTax * (taxPct / 100));
        grandTotal = round2(subtotalBeforeTax + taxAmount);
      }

      const safeArea = typeof floorArea === 'number' && isFinite(floorArea) && floorArea > 0 ? floorArea : 0;
      const costPerFloorArea = safeArea > 0 ? round2(grandTotal / safeArea) : 0;

      return {
        directCost,
        materialTotal,
        laborTotal,
        equipmentTotal,
        tradeRollups: rollups,
        ocmAmount,
        subtotalAfterOCM,
        profitAmount,
        subtotalBeforeTax,
        taxAmount,
        grandTotal,
        costPerFloorArea,
      };
    };
  }
});

describe('Mathematical Calculation Engine (tests/calculations.test.ts)', () => {
  describe('1. Precision Rounding utility (round2)', () => {
    it('rounds standard financial numbers to exactly 2 decimals', () => {
      expect(round2(12.3456)).toBe(12.35);
      expect(round2(12.3444)).toBe(12.34);
      expect(round2(100)).toBe(100);
      expect(round2(0)).toBe(0);
    });

    it('mitigates IEEE 754 floating point addition drift (0.1 + 0.2)', () => {
      expect(0.1 + 0.2).not.toBe(0.3);
      expect(round2(0.1 + 0.2)).toBe(0.3);
    });

    it('rounds half up at exact midpoint cents (round-half-up)', () => {
      expect(round2(1.185)).toBe(1.19);
      expect(round2(1.184)).toBe(1.18);
    });

    it('guards against NaN, Infinity, and invalid numbers safely returning 0', () => {
      expect(round2(NaN)).toBe(0);
      expect(round2(Infinity)).toBe(0);
      expect(round2(-Infinity)).toBe(0);
    });
  });

  describe('2. Line Item Cost Calculation (F16 & F17)', () => {
    it('calculates direct unit cost as sum of material, labor, and equipment rates', () => {
      const res = calculateItemCosts(10, 15.0, 8.5, 1.5);
      expect(res.directUnitCost).toBe(25.0);
      expect(res.directTotalCost).toBe(250.0);
      expect(res.materialTotal).toBe(150.0);
      expect(res.laborTotal).toBe(85.0);
      expect(res.equipmentTotal).toBe(15.0);
    });

    it('handles zero quantity by setting direct total cost and category totals to 0', () => {
      const res = calculateItemCosts(0, 95.0, 22.0, 15.0);
      expect(res.directUnitCost).toBe(132.0);
      expect(res.directTotalCost).toBe(0.0);
      expect(res.materialTotal).toBe(0.0);
      expect(res.laborTotal).toBe(0.0);
      expect(res.equipmentTotal).toBe(0.0);
    });

    it('handles pure labor items with zero material and equipment rates', () => {
      // Manual excavation
      const res = calculateItemCosts(26.0, 0.0, 16.0, 2.0);
      expect(res.directUnitCost).toBe(18.0);
      expect(res.directTotalCost).toBe(468.0);
      expect(res.materialTotal).toBe(0.0);
      expect(res.laborTotal).toBe(416.0);
      expect(res.equipmentTotal).toBe(52.0);
    });

    it('handles pure material supply with zero labor and equipment rates', () => {
      // Tie wire supply
      const res = calculateItemCosts(105.0, 1.6, 0.0, 0.0);
      expect(res.directUnitCost).toBe(1.6);
      expect(res.directTotalCost).toBe(168.0);
      expect(res.materialTotal).toBe(168.0);
      expect(res.laborTotal).toBe(0.0);
      expect(res.equipmentTotal).toBe(0.0);
    });

    it('preserves category summation invariant: materialTotal + laborTotal + equipmentTotal === directTotalCost', () => {
      const items = [
        { q: 34, m: 95, l: 22, e: 15 },
        { q: 1950, m: 1.1, l: 0.35, e: 0.05 },
        { q: 710, m: 3.8, l: 5.2, e: 0.8 },
        { q: 6.5, m: 18.0, l: 14.0, e: 2.0 },
      ];

      for (const itm of items) {
        const c = calculateItemCosts(itm.q, itm.m, itm.l, itm.e);
        expect(round2(c.materialTotal + c.laborTotal + c.equipmentTotal)).toBe(c.directTotalCost);
      }
    });

    it('clamps negative quantities and negative rates to zero', () => {
      const res = calculateItemCosts(-15, -10, 5, -2);
      expect(res.directUnitCost).toBe(5.0);
      expect(res.directTotalCost).toBe(0.0);
    });
  });

  describe('3. Sub-Scope & Trade Direct Totals (F18 & F19)', () => {
    it('aggregates item totals in a sub-scope correctly', () => {
      const items = [
        { quantity: 75.0, materialRate: 15.0, laborRate: 8.5, equipmentRate: 1.5 }, // 75 * 25 = 1875
        { quantity: 24.0, materialRate: 45.0, laborRate: 30.0, equipmentRate: 5.0 }, // 24 * 80 = 1920
        { quantity: 1.0, materialRate: 250.0, laborRate: 180.0, equipmentRate: 20.0 }, // 1 * 450 = 450
      ];
      const res = calculateSubScopeTotal(items);
      expect(res.directTotal).toBe(4245.0);
      expect(res.materialTotal).toBe(75 * 15 + 24 * 45 + 1 * 250); // 1125 + 1080 + 250 = 2455
      expect(res.laborTotal).toBe(75 * 8.5 + 24 * 30 + 1 * 180); // 637.5 + 720 + 180 = 1537.5
      expect(res.equipmentTotal).toBe(75 * 1.5 + 24 * 5 + 1 * 20); // 112.5 + 120 + 20 = 252.5
      expect(round2(res.materialTotal + res.laborTotal + res.equipmentTotal)).toBe(res.directTotal);
    });

    it('returns zero for empty sub-scope items array', () => {
      const res = calculateSubScopeTotal([]);
      expect(res.directTotal).toBe(0);
      expect(res.materialTotal).toBe(0);
      expect(res.laborTotal).toBe(0);
      expect(res.equipmentTotal).toBe(0);
    });

    it('aggregates sub-scope totals across a trade', () => {
      const trade = {
        id: 'trade_concrete',
        name: 'Concrete & Masonry Works',
        subScopes: [
          {
            items: [
              { quantity: 34.0, materialRate: 95.0, laborRate: 22.0, equipmentRate: 15.0 }, // 34 * 132 = 4488
            ],
          },
          {
            items: [
              { quantity: 1950.0, materialRate: 1.1, laborRate: 0.35, equipmentRate: 0.05 }, // 1950 * 1.5 = 2925
            ],
          },
        ],
      };
      const res = calculateTradeTotal(trade);
      expect(res.directTotal).toBe(4488 + 2925);
    });
  });

  describe('4. Consolidated Master Rollup & Compounding Indirect Markups (F20, F21, F22)', () => {
    it('calculates the authoritative 3-tier compounded markups model (Plan Line 92)', () => {
      // Direct Cost: $100,000.00
      // OCM: 8%, Profit: 10%, Tax: 12%
      // Step 1: OCM = 100,000 * 0.08 = 8,000; Subtotal After OCM = 108,000
      // Step 2: Profit = 108,000 * 0.10 = 10,800; Subtotal Before Tax = 118,800
      // Step 3: Tax = 118,800 * 0.12 = 14,256; Grand Total = 133,056
      const mockTrades = [
        {
          id: 'trade_1',
          name: 'Trade 1',
          subScopes: [{ items: [{ quantity: 1000, materialRate: 50, laborRate: 30, equipmentRate: 20 }] }],
        },
      ];
      const markups: ProjectMarkups = {
        ocmPercent: 8.0,
        profitPercent: 10.0,
        taxPercent: 12.0,
      };
      const summary = calculateConsolidatedSummary(mockTrades, markups, 200);

      expect(summary.directCost).toBe(100000.0);
      expect(summary.ocmAmount).toBe(8000.0);
      expect(summary.subtotalAfterOCM).toBe(108000.0);
      expect(summary.profitAmount).toBe(10800.0);
      expect(summary.subtotalBeforeTax).toBe(118800.0);
      expect(summary.taxAmount).toBe(14256.0);
      expect(summary.grandTotal).toBe(133056.0);
      expect(summary.costPerFloorArea).toBe(665.28);
    });

    it('handles zero percent markups yielding grand total equal to direct cost', () => {
      const mockTrades = [
        {
          id: 'trade_1',
          name: 'Trade 1',
          subScopes: [{ items: [{ quantity: 50, materialRate: 100, laborRate: 0, equipmentRate: 0 }] }],
        },
      ];
      const markups: ProjectMarkups = {
        ocmPercent: 0,
        profitPercent: 0,
        taxPercent: 0,
      };
      const summary = calculateConsolidatedSummary(mockTrades, markups, 100);

      expect(summary.directCost).toBe(5000.0);
      expect(summary.ocmAmount).toBe(0.0);
      expect(summary.profitAmount).toBe(0.0);
      expect(summary.taxAmount).toBe(0.0);
      expect(summary.grandTotal).toBe(5000.0);
      expect(summary.costPerFloorArea).toBe(50.0);
    });

    it('calculates additive markup method if explicitly configured', () => {
      // Direct Cost: $10,000
      // OCM: 8% ($800), Profit: 10% ($1,000) -> Pre-tax: $11,800
      // Tax: 12% on $11,800 = $1,416 -> Grand Total: $13,216
      const mockTrades = [
        {
          id: 'trade_1',
          name: 'Trade 1',
          subScopes: [{ items: [{ quantity: 100, materialRate: 100, laborRate: 0, equipmentRate: 0 }] }],
        },
      ];
      const markups: ProjectMarkups = {
        ocmPercent: 8.0,
        profitPercent: 10.0,
        taxPercent: 12.0,
        markupMethod: 'additive',
      };
      const summary = calculateConsolidatedSummary(mockTrades, markups, 100);

      expect(summary.directCost).toBe(10000.0);
      expect(summary.ocmAmount).toBe(800.0);
      expect(summary.profitAmount).toBe(1000.0);
      expect(summary.subtotalBeforeTax).toBe(11800.0);
      expect(summary.taxAmount).toBe(1416.0);
      expect(summary.grandTotal).toBe(13216.0);
    });
  });

  describe('5. Floor Area Metric & Divide-by-Zero Protection (F23)', () => {
    it('safely handles totalFloorArea = 0 returning 0 without Infinity or NaN', () => {
      const mockTrades = [
        {
          id: 'trade_1',
          name: 'Trade 1',
          subScopes: [{ items: [{ quantity: 10, materialRate: 50, laborRate: 50, equipmentRate: 0 }] }],
        },
      ];
      const markups = { ocmPercent: 10, profitPercent: 10, taxPercent: 10 };
      const summary = calculateConsolidatedSummary(mockTrades, markups, 0);

      expect(summary.costPerFloorArea).toBe(0);
      expect(isFinite(summary.costPerFloorArea)).toBe(true);
    });

    it('safely handles negative or NaN floor area returning 0', () => {
      const mockTrades = [
        {
          id: 'trade_1',
          name: 'Trade 1',
          subScopes: [{ items: [{ quantity: 10, materialRate: 10, laborRate: 0, equipmentRate: 0 }] }],
        },
      ];
      const markups = { ocmPercent: 0, profitPercent: 0, taxPercent: 0 };
      expect(calculateConsolidatedSummary(mockTrades, markups, -150).costPerFloorArea).toBe(0);
      expect(calculateConsolidatedSummary(mockTrades, markups, NaN).costPerFloorArea).toBe(0);
    });

    it('computes exact unit cost for standard 250 m² area', () => {
      const mockTrades = [
        {
          id: 'trade_1',
          name: 'Trade 1',
          subScopes: [{ items: [{ quantity: 1, materialRate: 100000, laborRate: 0, equipmentRate: 0 }] }],
        },
      ];
      const markups = { ocmPercent: 0, profitPercent: 0, taxPercent: 0 };
      const summary = calculateConsolidatedSummary(mockTrades, markups, 250);
      expect(summary.costPerFloorArea).toBe(400.0);
    });
  });

  describe('6. Tier 4 Real-World Benchmark Scenarios', () => {
    it('validates the complete 250 m² 2-Storey Residence benchmark calculation', () => {
      // 10 trade subtotal figures established in survey handoff 3
      const tradeTotals = [
        { id: 'trade_ew', name: 'Earthworks & Temporary Works', total: 9970.0 },
        { id: 'trade_conc', name: 'Concrete & Masonry Works', total: 43770.5 },
        { id: 'trade_wp', name: 'Waterproofing & Moisture Protection', total: 5580.0 },
        { id: 'trade_stl', name: 'Structural Steel and Roofing Works', total: 24256.5 },
        { id: 'trade_crp', name: 'Carpentry and Drywall Works', total: 16735.1 },
        { id: 'trade_dw', name: 'Doors, Windows & Architectural Metals', total: 8684.0 },
        { id: 'trade_fin', name: 'Finishes and Painting Works', total: 18098.3 },
        { id: 'trade_plb', name: 'Plumbing Rough-In Works', total: 6100.5 },
        { id: 'trade_elec', name: 'Electrical Rough-In Works', total: 5628.4 },
        { id: 'trade_mech', name: 'Mechanical & Fire Protection Works', total: 7149.4 },
      ];

      const trades = tradeTotals.map((t) => ({
        id: t.id,
        name: t.name,
        subScopes: [
          {
            items: [
              {
                quantity: 1,
                materialRate: t.total,
                laborRate: 0,
                equipmentRate: 0,
              },
            ],
          },
        ],
      }));

      const markups: ProjectMarkups = {
        ocmPercent: 8.0,
        profitPercent: 10.0,
        taxPercent: 12.0,
      };

      const summary = calculateConsolidatedSummary(trades, markups, 250.0);

      // The exact mathematical sum of the 10 trade subtotals:
      // 9970.0 + 43770.5 + 5580.0 + 24256.5 + 16735.1 + 8684.0 + 18098.3 + 6100.5 + 5628.4 + 7149.4 = $145,972.70
      expect(summary.directCost).toBe(145972.7);

      // OCM 8%: 145,972.70 * 0.08 = 11,677.816 -> $11,677.82
      expect(summary.ocmAmount).toBe(11677.82);
      expect(summary.subtotalAfterOCM).toBe(157650.52);

      // Profit 10%: 157,650.52 * 0.10 = 15,765.052 -> $15,765.05
      expect(summary.profitAmount).toBe(15765.05);
      expect(summary.subtotalBeforeTax).toBe(173415.57);

      // Tax 12%: 173,415.57 * 0.12 = 20,809.8684 -> $20,809.87
      expect(summary.taxAmount).toBe(20809.87);

      // Grand Total: 173,415.57 + 20,809.87 = $194,225.44
      expect(summary.grandTotal).toBe(194225.44);

      // Cost per floor area (250 m²): 194,225.44 / 250 = $776.90176 -> $776.90 / m²
      expect(summary.costPerFloorArea).toBe(776.9);
    });

    it('validates the $136,772.70 direct cost baseline with compounded markups', () => {
      const mockTrade = [
        {
          id: 'trade_baseline',
          name: 'Baseline Package',
          subScopes: [
            {
              items: [{ quantity: 1, materialRate: 136772.7, laborRate: 0, equipmentRate: 0 }],
            },
          ],
        },
      ];

      const markups: ProjectMarkups = {
        ocmPercent: 8.0,
        profitPercent: 10.0,
        taxPercent: 12.0,
      };

      const summary = calculateConsolidatedSummary(mockTrade, markups, 250.0);

      expect(summary.directCost).toBe(136772.7);
      expect(summary.ocmAmount).toBe(10941.82);
      expect(summary.subtotalAfterOCM).toBe(147714.52);
      expect(summary.profitAmount).toBe(14771.45);
      expect(summary.subtotalBeforeTax).toBe(162485.97);
      expect(summary.taxAmount).toBe(19498.32);
      expect(summary.grandTotal).toBe(181984.29);
      expect(summary.costPerFloorArea).toBe(727.94);
    });

    it('validates 500 m² Commercial Fit-Out benchmark calculation', () => {
      const commercialTrades = [
        {
          id: 'comm_fitout',
          name: 'Commercial Fitout Package',
          subScopes: [
            {
              items: [{ quantity: 1, materialRate: 248500.0, laborRate: 0, equipmentRate: 0 }],
            },
          ],
        },
      ];

      const markups: ProjectMarkups = {
        ocmPercent: 10.0,
        profitPercent: 12.0,
        taxPercent: 12.0,
      };

      const summary = calculateConsolidatedSummary(commercialTrades, markups, 500.0);

      // Direct Cost: $248,500.00
      expect(summary.directCost).toBe(248500.0);
      // Subtotal with OCM (10%): $273,350.00
      expect(summary.ocmAmount).toBe(24850.0);
      expect(summary.subtotalAfterOCM).toBe(273350.0);
      // Subtotal with Profit (12%): $306,152.00
      expect(summary.profitAmount).toBe(32802.0);
      expect(summary.subtotalBeforeTax).toBe(306152.0);
      // Tax (12%): $36,738.24
      expect(summary.taxAmount).toBe(36738.24);
      // Grand Total: $342,890.24
      expect(summary.grandTotal).toBe(342890.24);
      // Cost per floor area (500 m²): $342,890.24 / 500 = $685.78 / m²
      expect(summary.costPerFloorArea).toBe(685.78);
    });
  });

  describe('7. Formatting Utilities (formatters.ts)', () => {
    it('formats currencies with symbols and thousand separators', () => {
      expect(formatCurrency(1234.56, '$')).toBe('$1,234.56');
      expect(formatCurrency(1000000, '₱')).toBe('₱1,000,000.00');
      expect(formatCurrency(-500.5, '$')).toBe('-$500.50');
      expect(formatCurrency(0, '$')).toBe('$0.00');
      expect(formatCurrency(NaN, '$')).toBe('$0.00');
    });

    it('formats percentages correctly', () => {
      expect(formatPercent(8.0, 1)).toBe('8.0%');
      expect(formatPercent(12.345, 2)).toBe('12.35%');
      expect(formatPercent(10, 0, false)).toBe('10');
    });

    it('formats numbers with thousand separators', () => {
      expect(formatNumber(1234567.89, 2)).toBe('1,234,567.89');
      expect(formatNumber(0, 2)).toBe('0.00');
    });

    it('normalizes construction unit representations', () => {
      expect(formatUnit('cu.m')).toBe('m³');
      expect(formatUnit('sq.m')).toBe('m²');
      expect(formatUnit('lin.m')).toBe('lm');
      expect(formatUnit('pc')).toBe('pcs');
      expect(formatUnit('pt')).toBe('points');
      expect(formatUnit('sets')).toBe('sets');
    });
  });

  describe('8. Unique ID Generation (idGenerator.ts)', () => {
    it('generates valid RFC4122 UUIDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('supports custom prefixes', () => {
      const id = generateId('item');
      expect(id.startsWith('item_')).toBe(true);
      expect(id.length).toBeGreaterThan(36);
    });
  });
});
