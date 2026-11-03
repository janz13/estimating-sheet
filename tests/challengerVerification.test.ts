import { describe, it, expect } from 'vitest';
import {
  round2,
  calculateItemCosts,
  calculateSubScopeTotal,
  calculateTradeTotal,
  calculateConsolidatedSummary,
} from '../src/utils/calculations';
import { DEFAULT_PROJECT_ESTIMATE } from '../src/data/defaultProject';

describe('teamwork_challenger_m1_3 Empirical Verification Battery', () => {
  describe('Task 1.1: Scientific notation & extreme floats in round2', () => {
    it('round2(1e-7) NEVER returns NaN and evaluates to 0', () => {
      const res = round2(1e-7);
      expect(Number.isNaN(res)).toBe(false);
      expect(res).toBe(0);
    });

    it('round2(1e21) NEVER returns NaN and preserves value', () => {
      const res = round2(1e21);
      expect(Number.isNaN(res)).toBe(false);
      expect(res).toBe(1e21);
    });

    it('handles comprehensive range of exponents', () => {
      const smallExponents = [-20, -15, -10, -8, -7, -6, -5, -4, -3];
      for (const exp of smallExponents) {
        const val = Math.pow(10, exp);
        const res = round2(val);
        expect(Number.isNaN(res)).toBe(false);
        if (val < 0.005) {
          expect(res).toBe(0);
        }
      }

      const largeExponents = [14, 15, 16, 18, 20, 21, 22, 25, 30];
      for (const exp of largeExponents) {
        const val = Math.pow(10, exp);
        const res = round2(val);
        expect(Number.isNaN(res)).toBe(false);
        expect(res).toBe(val);
      }
    });

    it('handles negative scientific notation safely', () => {
      expect(round2(-1e-7)).toBe(0);
      expect(round2(-1e21)).toBe(-1e21);
      expect(Number.isNaN(round2(-1e-7))).toBe(false);
      expect(Number.isNaN(round2(-1e21))).toBe(false);
    });

    it('handles non-finite values safely', () => {
      expect(round2(NaN)).toBe(0);
      expect(round2(Infinity)).toBe(0);
      expect(round2(-Infinity)).toBe(0);
      expect(round2(null as any)).toBe(0);
      expect(round2(undefined as any)).toBe(0);
      expect(round2('foo' as any)).toBe(0);
    });
  });

  describe('Task 1.2: Category Totals Invariant on decimal quantities ($0.00 discrepancy)', () => {
    const testCases = [
      { q: 1.5, m: 10.33, l: 10.33, e: 10.34 },
      { q: 2.37, m: 45.67, l: 23.45, e: 12.89 },
      { q: 12.345, m: 123.45, l: 67.89, e: 34.56 },
      { q: 0.3333, m: 99.99, l: 55.55, e: 22.22 },
      { q: 0.125, m: 8.88, l: 4.44, e: 2.22 },
      { q: 100.005, m: 15.155, l: 25.255, e: 35.355 },
      { q: 7.77, m: 11.11, l: 22.22, e: 33.33 },
      { q: 999.999, m: 50.05, l: 25.02, e: 12.01 },
    ];

    for (const tc of testCases) {
      it(`verifies directTotalCost === round2(materialTotal + laborTotal + equipmentTotal) for q=${tc.q}`, () => {
        const item = calculateItemCosts(tc.q, tc.m, tc.l, tc.e);
        const sumOfCategories = round2(item.materialTotal + item.laborTotal + item.equipmentTotal);
        const diff = Math.abs(item.directTotalCost - sumOfCategories);
        expect(diff).toBe(0);
        expect(item.directTotalCost).toBe(sumOfCategories);
      });
    }

    it('fuzzes 10,000 random decimal quantities and rates for exact $0.00 discrepancy', () => {
      let maxDiscrepancy = 0;
      for (let i = 0; i < 10000; i++) {
        const q = Math.random() * 1000;
        const m = Math.random() * 500;
        const l = Math.random() * 300;
        const e = Math.random() * 200;
        const item = calculateItemCosts(q, m, l, e);
        const sum = round2(item.materialTotal + item.laborTotal + item.equipmentTotal);
        const diff = Math.abs(item.directTotalCost - sum);
        if (diff > maxDiscrepancy) {
          maxDiscrepancy = diff;
        }
      }
      expect(maxDiscrepancy).toBe(0);
    });
  });

  describe('Task 1.3: Reconciliation in calculateTradeTotal and calculateConsolidatedSummary', () => {
    it('verifies calculateTradeTotal directTotal === materialTotal + laborTotal + equipmentTotal with exact $0.00 discrepancy', () => {
      const trade = {
        id: 't_recon',
        name: 'Reconciliation Trade',
        subScopes: [
          {
            id: 's1',
            items: [
              { quantity: 1.5, materialRate: 10.33, laborRate: 10.33, equipmentRate: 10.34 },
              { quantity: 2.37, materialRate: 45.67, laborRate: 23.45, equipmentRate: 12.89 },
              { quantity: 12.345, materialRate: 123.45, laborRate: 67.89, equipmentRate: 34.56 },
            ],
          },
          {
            id: 's2',
            items: [
              { quantity: 0.3333, materialRate: 99.99, laborRate: 55.55, equipmentRate: 22.22 },
              { quantity: 7.77, materialRate: 11.11, laborRate: 22.22, equipmentRate: 33.33 },
            ],
          },
        ],
      };

      const res = calculateTradeTotal(trade);
      const catSum = round2(res.materialTotal + res.laborTotal + res.equipmentTotal);
      expect(Math.abs(res.directTotal - catSum)).toBe(0);
      expect(res.directTotal).toBe(catSum);
    });

    it('verifies calculateConsolidatedSummary directCost === materialTotal + laborTotal + equipmentTotal with exact $0.00 discrepancy', () => {
      const summary = calculateConsolidatedSummary(
        DEFAULT_PROJECT_ESTIMATE.trades,
        DEFAULT_PROJECT_ESTIMATE.markups,
        DEFAULT_PROJECT_ESTIMATE.metadata.totalFloorArea
      );

      const catSum = round2(summary.materialTotal + summary.laborTotal + summary.equipmentTotal);
      expect(summary.directCost).toBe(catSum);
      expect(Math.abs(summary.directCost - catSum)).toBe(0);

      // Verify categoryBreakdown also matches
      expect(summary.categoryBreakdown!.directTotal).toBe(summary.directCost);
      expect(summary.categoryBreakdown!.materialTotal).toBe(summary.materialTotal);
      expect(summary.categoryBreakdown!.laborTotal).toBe(summary.laborTotal);
      expect(summary.categoryBreakdown!.equipmentTotal).toBe(summary.equipmentTotal);

      // Check sum of trade rollups directTotal equals summary directCost
      const sumOfTradeDirectTotals = round2(
        summary.tradeRollups.reduce((acc, t) => acc + t.directTotal, 0)
      );
      expect(summary.directCost).toBe(sumOfTradeDirectTotals);
    });

    it('verifies multi-trade random decimal stress reconciliation in calculateConsolidatedSummary', () => {
      const dummyTrades = Array.from({ length: 10 }, (_, tradeIdx) => ({
        id: `t_${tradeIdx}`,
        code: `TR-${tradeIdx + 1}`,
        name: `Trade ${tradeIdx + 1}`,
        subScopes: Array.from({ length: 3 }, (_, scopeIdx) => ({
          id: `s_${tradeIdx}_${scopeIdx}`,
          name: `Scope ${scopeIdx}`,
          items: Array.from({ length: 5 }, (_, itemIdx) => ({
            quantity: 1.23 + itemIdx * 0.45,
            materialRate: 10.55 + tradeIdx * 2.15,
            laborRate: 8.35 + itemIdx * 1.05,
            equipmentRate: 4.15 + scopeIdx * 0.75,
          })),
        })),
      }));

      const summary = calculateConsolidatedSummary(dummyTrades, { ocmPercent: 8, profitPercent: 10, taxPercent: 12 }, 250);
      const catSum = round2(summary.materialTotal + summary.laborTotal + summary.equipmentTotal);
      expect(summary.directCost).toBe(catSum);
      expect(Math.abs(summary.directCost - catSum)).toBe(0);

      const sumOfTradeDirectTotals = round2(
        summary.tradeRollups.reduce((acc, t) => acc + t.directTotal, 0)
      );
      expect(summary.directCost).toBe(sumOfTradeDirectTotals);
    });
  });

  describe('Task 1.4: Defensive iteration on null and undefined elements', () => {
    it('calculateSubScopeTotal([null, undefined]) does not throw and returns clean zero totals', () => {
      expect(() => {
        const res = calculateSubScopeTotal([null as any, undefined as any]);
        expect(res.directTotal).toBe(0);
        expect(res.materialTotal).toBe(0);
        expect(res.laborTotal).toBe(0);
        expect(res.equipmentTotal).toBe(0);
        expect(res.itemCount).toBe(0);
      }).not.toThrow();
    });

    it('calculateSubScopeTotal with mixed null, undefined, and valid items', () => {
      const mixedItems = [
        null as any,
        { quantity: 2, materialRate: 10, laborRate: 5, equipmentRate: 0 },
        undefined as any,
        { quantity: 3, materialRate: 20, laborRate: 10, equipmentRate: 5 },
      ];
      const res = calculateSubScopeTotal(mixedItems);
      // Valid item 1: 2 * (10 + 5) = 30 (mat: 20, lab: 10, eq: 0)
      // Valid item 2: 3 * (20 + 10 + 5) = 105 (mat: 60, lab: 30, eq: 15)
      // Total: 135 (mat: 80, lab: 40, eq: 15)
      expect(res.directTotal).toBe(135);
      expect(res.materialTotal).toBe(80);
      expect(res.laborTotal).toBe(40);
      expect(res.equipmentTotal).toBe(15);
      expect(res.itemCount).toBe(2);
    });

    it('calculateTradeTotal({ subScopes: [null, undefined] }) does not throw and returns clean zero totals', () => {
      expect(() => {
        const res = calculateTradeTotal({ subScopes: [null as any, undefined as any] });
        expect(res.directTotal).toBe(0);
        expect(res.materialTotal).toBe(0);
        expect(res.laborTotal).toBe(0);
        expect(res.equipmentTotal).toBe(0);
        expect(res.itemCount).toBe(0);
      }).not.toThrow();
    });

    it('calculateTradeTotal with mixed null, undefined, and valid scopes', () => {
      const trade = {
        subScopes: [
          null as any,
          {
            items: [
              null as any,
              { quantity: 2, materialRate: 50, laborRate: 25, equipmentRate: 10 },
            ],
          },
          undefined as any,
        ],
      };
      const res = calculateTradeTotal(trade);
      // Item: 2 * 85 = 170 (mat: 100, lab: 50, eq: 20)
      expect(res.directTotal).toBe(170);
      expect(res.materialTotal).toBe(100);
      expect(res.laborTotal).toBe(50);
      expect(res.equipmentTotal).toBe(20);
      expect(res.itemCount).toBe(1);
    });

    it('empirically observes calculateConsolidatedSummary behavior when trades array contains null element', () => {
      // safeTrades.map dereferences trade.id directly at line 219.
      // We empirically verify that it throws a TypeError when a null trade is passed.
      expect(() => {
        calculateConsolidatedSummary([null as any], undefined, undefined);
      }).toThrow(TypeError);
    });
  });
});
