import { describe, it, expect } from 'vitest';
import {
  round2,
  calculateItemCosts,
  calculateSubScopeTotal,
  calculateTradeTotal,
  calculateConsolidatedSummary,
} from '../src/utils/calculations';

describe('Adversarial Stress Test Suite: src/utils/calculations.ts', () => {
  describe('Dimension 1: Extreme Quantities Stress Testing', () => {
    it('handles very large quantity (1e9, 1 billion units)', () => {
      const res = calculateItemCosts(1e9, 100, 50, 25);
      expect(res.directUnitCost).toBe(175);
      expect(res.directTotalCost).toBe(1.75e11);
      expect(res.materialTotal).toBe(1e11);
      expect(res.laborTotal).toBe(5e10);
      expect(res.equipmentTotal).toBe(2.5e10);
      expect(Number.isFinite(res.directTotalCost)).toBe(true);
      expect(Number.isNaN(res.directTotalCost)).toBe(false);
    });

    it('handles fractional quantity (0.0001, e.g. chemical additive / micro-units)', () => {
      const res = calculateItemCosts(0.0001, 10000, 5000, 2500);
      expect(res.directUnitCost).toBe(17500);
      expect(res.directTotalCost).toBe(1.75);
      expect(res.materialTotal).toBe(1.0);
      expect(res.laborTotal).toBe(0.5);
      expect(res.equipmentTotal).toBe(0.25);
    });

    it('handles zero quantity', () => {
      const res = calculateItemCosts(0, 50, 30, 20);
      expect(res.directUnitCost).toBe(100);
      expect(res.directTotalCost).toBe(0);
      expect(res.materialTotal).toBe(0);
      expect(res.laborTotal).toBe(0);
      expect(res.equipmentTotal).toBe(0);
    });

    it('clamps negative quantity to 0', () => {
      const res = calculateItemCosts(-100, 50, 30, 20);
      expect(res.directUnitCost).toBe(100);
      expect(res.directTotalCost).toBe(0);
      expect(res.materialTotal).toBe(0);
      expect(res.laborTotal).toBe(0);
      expect(res.equipmentTotal).toBe(0);
    });

    it('handles non-numeric or non-finite quantity safely (NaN, Infinity, string)', () => {
      expect(calculateItemCosts(NaN, 10, 10, 10).directTotalCost).toBe(0);
      expect(calculateItemCosts(Infinity, 10, 10, 10).directTotalCost).toBe(0);
      expect(calculateItemCosts(-Infinity, 10, 10, 10).directTotalCost).toBe(0);
      expect(calculateItemCosts('100' as any, 10, 10, 10).directTotalCost).toBe(0);
      expect(calculateItemCosts(null as any, 10, 10, 10).directTotalCost).toBe(0);
      expect(calculateItemCosts(undefined as any, 10, 10, 10).directTotalCost).toBe(0);
    });
  });

  describe('Dimension 2: Extreme Rates Stress Testing', () => {
    it('handles very large unit rates (1e8, $100M/unit)', () => {
      const res = calculateItemCosts(10, 1e8, 5e7, 2.5e7);
      expect(res.directUnitCost).toBe(1.75e8);
      expect(res.directTotalCost).toBe(1.75e9);
      expect(res.materialTotal).toBe(1e9);
      expect(res.laborTotal).toBe(5e8);
      expect(res.equipmentTotal).toBe(2.5e8);
    });

    it('handles zero rates across all components', () => {
      const res = calculateItemCosts(500, 0, 0, 0);
      expect(res.directUnitCost).toBe(0);
      expect(res.directTotalCost).toBe(0);
      expect(res.materialTotal).toBe(0);
      expect(res.laborTotal).toBe(0);
      expect(res.equipmentTotal).toBe(0);
    });

    it('clamps negative rates to 0', () => {
      const res = calculateItemCosts(10, -50, -30, 20);
      expect(res.directUnitCost).toBe(20);
      expect(res.directTotalCost).toBe(200);
      expect(res.materialTotal).toBe(0);
      expect(res.laborTotal).toBe(0);
      expect(res.equipmentTotal).toBe(200);
    });

    it('handles fractional cent rates (3+ decimal places)', () => {
      const res = calculateItemCosts(100, 1.004, 2.006, 3.005);
      expect(res.directUnitCost).toBe(6.02); // 1.004 + 2.006 + 3.005 = 6.015 -> 6.02
      expect(res.materialTotal).toBe(100.4); // 100 * 1.004
      expect(res.laborTotal).toBe(200.6); // 100 * 2.006
      expect(res.equipmentTotal).toBe(300.5); // 100 * 3.005
      expect(res.directTotalCost).toBe(601.5); // Reconciled category invariant: 100.4 + 200.6 + 300.5 = 601.5
    });
  });

  describe('Dimension 3: Rounding Edge Cases (.xx5 midpoints & scientific notation)', () => {
    it('rounds exact .xx5 midpoints correctly upwards (round-half-up)', () => {
      expect(round2(35.855)).toBe(35.86);
      expect(round2(1.005)).toBe(1.01);
      expect(round2(0.005)).toBe(0.01);
      expect(round2(2.675)).toBe(2.68);
      expect(round2(1.055)).toBe(1.06);
      expect(round2(10.125)).toBe(10.13);
    });

    it('rounds negative midpoints symmetrically away from zero', () => {
      expect(round2(-35.855)).toBe(-35.86);
      expect(round2(-1.005)).toBe(-1.01);
      expect(round2(-0.005)).toBe(-0.01);
    });

    it('handles boundary values around 0.005', () => {
      expect(round2(0.0049999)).toBe(0);
      expect(round2(0.005)).toBe(0.01);
      expect(round2(0.0050001)).toBe(0.01);
    });

    it('handles numbers in scientific notation safely without returning NaN', () => {
      const resSmall = round2(1e-7);
      const resBig = round2(1e21);
      expect(resSmall).toBe(0);
      expect(resBig).toBe(1e21);
      expect(Number.isNaN(resSmall)).toBe(false);
      expect(Number.isNaN(resBig)).toBe(false);
    });
  });

  describe('Dimension 4: Empty, Null, and Degenerate Trade/Scope Arrays', () => {
    it('handles empty trades array', () => {
      const summary = calculateConsolidatedSummary([], { ocmPercent: 8, profitPercent: 10, taxPercent: 12 }, 100);
      expect(summary.directCost).toBe(0);
      expect(summary.materialTotal).toBe(0);
      expect(summary.laborTotal).toBe(0);
      expect(summary.equipmentTotal).toBe(0);
      expect(summary.tradeRollups).toEqual([]);
      expect(summary.grandTotal).toBe(0);
      expect(summary.costPerFloorArea).toBe(0);
    });

    it('handles undefined trades parameter', () => {
      const summary = calculateConsolidatedSummary(undefined, undefined, undefined);
      expect(summary.directCost).toBe(0);
      expect(summary.grandTotal).toBe(0);
      expect(summary.costPerFloorArea).toBe(0);
    });

    it('handles trade with empty subScopes array', () => {
      const trades = [{ id: 'trade_empty', name: 'Empty Trade', subScopes: [] }];
      const summary = calculateConsolidatedSummary(trades, { ocmPercent: 10, profitPercent: 10, taxPercent: 10 }, 200);
      expect(summary.directCost).toBe(0);
      expect(summary.tradeRollups.length).toBe(1);
      expect(summary.tradeRollups[0].directTotal).toBe(0);
      expect(summary.tradeRollups[0].percentageShare).toBe(0);
    });

    it('handles subScope with empty items array', () => {
      const trade = {
        id: 't1',
        name: 'Trade 1',
        subScopes: [{ id: 's1', name: 'Scope 1', items: [] }],
      };
      const res = calculateTradeTotal(trade);
      expect(res.directTotal).toBe(0);
      expect(res.itemCount).toBe(0);
    });

    it('handles items with undefined or missing rate/qty properties', () => {
      const trade = {
        id: 't1',
        name: 'Trade 1',
        subScopes: [{ id: 's1', name: 'Scope 1', items: [{} as any, { quantity: 10 } as any] }],
      };
      const res = calculateTradeTotal(trade);
      expect(res.directTotal).toBe(0);
      expect(res.itemCount).toBe(2);
    });

    it('checks resilience when subScope contains null or undefined item entries', () => {
      const res = calculateSubScopeTotal([null as any]);
      expect(res.directTotal).toBe(0);
      expect(res.materialTotal).toBe(0);
      expect(res.laborTotal).toBe(0);
      expect(res.equipmentTotal).toBe(0);
      expect(res.itemCount).toBe(0);
    });

    it('checks resilience when trade subScopes contains null or undefined scope entries', () => {
      const res = calculateTradeTotal({ subScopes: [null as any] });
      expect(res.directTotal).toBe(0);
      expect(res.materialTotal).toBe(0);
      expect(res.laborTotal).toBe(0);
      expect(res.equipmentTotal).toBe(0);
      expect(res.itemCount).toBe(0);
    });
  });

  describe('Dimension 5: Markups Boundary Values and Clamping', () => {
    it('handles 0% markups (Grand Total == Direct Cost)', () => {
      const trades = [
        {
          id: 't1',
          name: 'Trade 1',
          subScopes: [{ items: [{ quantity: 10, materialRate: 100, laborRate: 50, equipmentRate: 20 }] }],
        },
      ];
      const summary = calculateConsolidatedSummary(trades, { ocmPercent: 0, profitPercent: 0, taxPercent: 0 }, 100);
      expect(summary.directCost).toBe(1700);
      expect(summary.ocmAmount).toBe(0);
      expect(summary.subtotalAfterOCM).toBe(1700);
      expect(summary.profitAmount).toBe(0);
      expect(summary.subtotalBeforeTax).toBe(1700);
      expect(summary.taxAmount).toBe(0);
      expect(summary.grandTotal).toBe(1700);
    });

    it('handles 100% markups (compounded)', () => {
      const trades = [
        {
          id: 't1',
          name: 'Trade 1',
          subScopes: [{ items: [{ quantity: 10, materialRate: 100, laborRate: 0, equipmentRate: 0 }] }],
        },
      ];
      const summary = calculateConsolidatedSummary(trades, { ocmPercent: 100, profitPercent: 100, taxPercent: 100 }, 10);
      expect(summary.directCost).toBe(1000);
      expect(summary.ocmAmount).toBe(1000);
      expect(summary.subtotalAfterOCM).toBe(2000);
      expect(summary.profitAmount).toBe(2000);
      expect(summary.subtotalBeforeTax).toBe(4000);
      expect(summary.taxAmount).toBe(4000);
      expect(summary.grandTotal).toBe(8000);
    });

    it('handles 500% extreme markups without overflow or NaN', () => {
      const trades = [
        {
          id: 't1',
          name: 'Trade 1',
          subScopes: [{ items: [{ quantity: 1, materialRate: 100, laborRate: 0, equipmentRate: 0 }] }],
        },
      ];
      const summary = calculateConsolidatedSummary(trades, { ocmPercent: 500, profitPercent: 500, taxPercent: 500 }, 10);
      expect(summary.directCost).toBe(100);
      expect(summary.ocmAmount).toBe(500);
      expect(summary.subtotalAfterOCM).toBe(600);
      expect(summary.profitAmount).toBe(3000);
      expect(summary.subtotalBeforeTax).toBe(3600);
      expect(summary.taxAmount).toBe(18000);
      expect(summary.grandTotal).toBe(21600);
    });

    it('clamps negative markups to 0% (prevents price deflation or negative bids)', () => {
      const trades = [
        {
          id: 't1',
          name: 'Trade 1',
          subScopes: [{ items: [{ quantity: 1, materialRate: 1000, laborRate: 0, equipmentRate: 0 }] }],
        },
      ];
      const summary = calculateConsolidatedSummary(
        trades,
        { ocmPercent: -20, profitPercent: -15, taxPercent: -12 },
        100
      );
      expect(summary.ocmPercent).toBe(0);
      expect(summary.profitPercent).toBe(0);
      expect(summary.taxPercent).toBe(0);
      expect(summary.ocmAmount).toBe(0);
      expect(summary.profitAmount).toBe(0);
      expect(summary.taxAmount).toBe(0);
      expect(summary.grandTotal).toBe(1000);
    });
  });

  describe('Dimension 6: Category Totals Invariant Verification', () => {
    it('verifies Category Invariant on integer quantities and 2-decimal rates', () => {
      const testCases = [
        { q: 10, m: 15.5, l: 8.25, e: 1.25 },
        { q: 34, m: 95.0, l: 22.0, e: 15.0 },
        { q: 100, m: 50.0, l: 30.0, e: 20.0 },
      ];

      for (const tc of testCases) {
        const item = calculateItemCosts(tc.q, tc.m, tc.l, tc.e);
        expect(round2(item.materialTotal + item.laborTotal + item.equipmentTotal)).toBe(item.directTotalCost);
      }
    });

    it('guarantees Category Invariant holds when quantity has decimals (e.g. 1.5 units)', () => {
      // When q is 1.5:
      // materialTotal = round2(1.5 * 10.33) = 15.50
      // laborTotal = round2(1.5 * 10.33) = 15.50
      // equipmentTotal = round2(1.5 * 10.34) = 15.51
      // directTotalCost = round2(15.50 + 15.50 + 15.51) = 46.51 === catSum
      const item = calculateItemCosts(1.5, 10.33, 10.33, 10.34);
      const catSum = round2(item.materialTotal + item.laborTotal + item.equipmentTotal);
      
      expect(item.directTotalCost).toBe(46.51);
      expect(catSum).toBe(46.51);
      expect(round2(Math.abs(item.directTotalCost - catSum))).toBe(0);
    });

    it('guarantees Category Invariant holds at Trade level for decimal quantities', () => {
      const trade = {
        id: 't_stress',
        name: 'Stress Trade',
        subScopes: [
          {
            id: 's1',
            name: 'Scope 1',
            items: [
              { quantity: 1.5, materialRate: 10.33, laborRate: 10.33, equipmentRate: 10.34 },
              { quantity: 2.5, materialRate: 5.67, laborRate: 3.33, equipmentRate: 1.0 },
              { quantity: 0.75, materialRate: 100.25, laborRate: 50.15, equipmentRate: 20.1 },
            ],
          },
        ],
      };

      const tradeTotals = calculateTradeTotal(trade);
      const catSum = round2(tradeTotals.materialTotal + tradeTotals.laborTotal + tradeTotals.equipmentTotal);
      
      expect(tradeTotals.directTotal).toBe(199.40);
      expect(catSum).toBe(199.40);
      expect(round2(tradeTotals.directTotal - catSum)).toBe(0);
    });
  });

  describe('Dimension 7: Floor Area Metric Edge Cases', () => {
    it('safely handles zero floor area', () => {
      const summary = calculateConsolidatedSummary(
        [{ id: 't1', subScopes: [{ items: [{ quantity: 1, materialRate: 100, laborRate: 0, equipmentRate: 0 }] }] }],
        { ocmPercent: 0, profitPercent: 0, taxPercent: 0 },
        0
      );
      expect(summary.costPerFloorArea).toBe(0);
      expect(summary.directCostPerFloorArea).toBe(0);
      expect(Number.isFinite(summary.costPerFloorArea)).toBe(true);
    });

    it('safely handles negative floor area', () => {
      const summary = calculateConsolidatedSummary(
        [{ id: 't1', subScopes: [{ items: [{ quantity: 1, materialRate: 100, laborRate: 0, equipmentRate: 0 }] }] }],
        { ocmPercent: 0, profitPercent: 0, taxPercent: 0 },
        -250
      );
      expect(summary.costPerFloorArea).toBe(0);
      expect(summary.directCostPerFloorArea).toBe(0);
    });

    it('safely handles non-numeric floor area values', () => {
      const summary = calculateConsolidatedSummary(
        [{ id: 't1', subScopes: [{ items: [{ quantity: 1, materialRate: 100, laborRate: 0, equipmentRate: 0 }] }] }],
        { ocmPercent: 0, profitPercent: 0, taxPercent: 0 },
        '250' as any
      );
      expect(summary.costPerFloorArea).toBe(0);
      expect(summary.directCostPerFloorArea).toBe(0);
    });
  });
});
