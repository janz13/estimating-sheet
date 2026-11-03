import { describe, it, expect } from 'vitest';
import {
  calculateParametricEstimate,
  applyParametricToProject,
  DEFAULT_AUTO_PARAMS,
} from '../src/utils/autoEstimateEngine';
import { DEFAULT_PROJECT_ESTIMATE } from '../src/data/defaultProject';
import { PHILIPPINE_CONSTRUCTION_TIERS } from '../src/constants/philippineRates';

describe('Automated Parametric Estimating Engine (Philippine Standards)', () => {
  it('calculates total floor area correctly for 2-storey house', () => {
    const params = {
      ...DEFAULT_AUTO_PARAMS,
      storeys: 2,
      groundFloorArea: 120,
      secondFloorArea: 80,
    };
    const res = calculateParametricEstimate(params);
    expect(res.totalFloorArea).toBe(200);
  });

  it('calculates baseline direct cost for mid-tier construction (₱32,000/m²)', () => {
    const params = {
      ...DEFAULT_AUTO_PARAMS,
      storeys: 1,
      storeyHeight: 3.0,
      groundFloorArea: 100,
      tier: 'mid' as const,
      bathroomsFloor1: 1,
      bathroomsFloor2: 0,
      doorsFloor1: 6,
      doorsCount: 6,
      windowsFloor1: 7,
      windowsCount: 7,
    };
    const res = calculateParametricEstimate(params);
    expect(res.baseRatePerSqM).toBe(PHILIPPINE_CONSTRUCTION_TIERS.mid.defaultRatePHP);
    expect(res.totalDirectCost).toBe(100 * 32000);
  });

  it('adjusts cost for high-ceiling storey height (3.4m > 3.0m standard)', () => {
    const standard = calculateParametricEstimate({
      ...DEFAULT_AUTO_PARAMS,
      storeys: 1,
      storeyHeight: 3.0,
      groundFloorArea: 100,
      bathroomsFloor1: 1,
    });
    const highCeiling = calculateParametricEstimate({
      ...DEFAULT_AUTO_PARAMS,
      storeys: 1,
      storeyHeight: 3.4,
      groundFloorArea: 100,
      bathroomsFloor1: 1,
    });
    // +5% for 40cm height increase
    expect(highCeiling.totalDirectCost).toBeGreaterThan(standard.totalDirectCost);
  });

  it('shifts budget allocation when using drywall partitions instead of all CHB', () => {
    const allChb = calculateParametricEstimate({
      ...DEFAULT_AUTO_PARAMS,
      wallType: 'all_chb',
    });
    const partDrywall = calculateParametricEstimate({
      ...DEFAULT_AUTO_PARAMS,
      wallType: 'part_chb_part_drywall',
    });

    const concChb = allChb.tradeBreakdowns.find((b) => b.tradeId === 'trade_concrete')!;
    const concDrywall = partDrywall.tradeBreakdowns.find((b) => b.tradeId === 'trade_concrete')!;

    const carpChb = allChb.tradeBreakdowns.find((b) => b.tradeId === 'trade_carpentry_drywall')!;
    const carpDrywall = partDrywall.tradeBreakdowns.find((b) => b.tradeId === 'trade_carpentry_drywall')!;

    // Concrete & Masonry decreases from 33% to 27%
    expect(concChb.percentageShare).toBe(33.0);
    expect(concDrywall.percentageShare).toBe(27.0);

    // Carpentry & Drywall increases from 7.5% to 13.5%
    expect(carpChb.percentageShare).toBe(7.5);
    expect(carpDrywall.percentageShare).toBe(13.5);
  });

  it('guarantees all 10 trade breakdown percentages sum to exactly 100%', () => {
    const res = calculateParametricEstimate(DEFAULT_AUTO_PARAMS);
    expect(res.tradeBreakdowns.length).toBe(10);
    const sumPcts = res.tradeBreakdowns.reduce((acc, b) => acc + b.percentageShare, 0);
    expect(Math.round(sumPcts)).toBe(100);
  });

  it('supports custom rate override (e.g. ₱26,500/m²)', () => {
    const res = calculateParametricEstimate({
      ...DEFAULT_AUTO_PARAMS,
      storeys: 1,
      storeyHeight: 3.0,
      groundFloorArea: 100,
      customRatePerSqM: 26500,
      bathroomsFloor1: 1,
      doorsFloor1: 6,
      doorsCount: 6,
      windowsFloor1: 7,
      windowsCount: 7,
    });
    expect(res.baseRatePerSqM).toBe(26500);
    expect(res.totalDirectCost).toBe(2650000);
  });

  it('dynamically increases cost when doors count increases', () => {
    const base = calculateParametricEstimate({
      ...DEFAULT_AUTO_PARAMS,
      doorsFloor1: 4,
      doorsFloor2: 4,
      doorsCount: 8,
    });
    const extraDoors = calculateParametricEstimate({
      ...DEFAULT_AUTO_PARAMS,
      doorsFloor1: 8,
      doorsFloor2: 6,
      doorsCount: 14,
    });
    // Increasing doors by 6 should add 6 * ₱8,500 = ₱51,000 for mid tier
    expect(extraDoors.totalDirectCost).toBeGreaterThan(base.totalDirectCost);
    expect(extraDoors.totalDirectCost - base.totalDirectCost).toBe(6 * 8500);
  });

  it('dynamically increases cost when windows count increases', () => {
    const base = calculateParametricEstimate({
      ...DEFAULT_AUTO_PARAMS,
      windowsFloor1: 5,
      windowsFloor2: 5,
      windowsCount: 10,
    });
    const extraWindows = calculateParametricEstimate({
      ...DEFAULT_AUTO_PARAMS,
      windowsFloor1: 9,
      windowsFloor2: 9,
      windowsCount: 18,
    });
    // Increasing windows by 8 should add 8 * ₱8,000 = ₱64,000 for mid tier
    expect(extraWindows.totalDirectCost).toBeGreaterThan(base.totalDirectCost);
    expect(extraWindows.totalDirectCost - base.totalDirectCost).toBe(8 * 8000);
  });

  it('dynamically reduces cost when wall type is switched to part drywall', () => {
    const allChb = calculateParametricEstimate({
      ...DEFAULT_AUTO_PARAMS,
      wallType: 'all_chb',
    });
    const partDrywall = calculateParametricEstimate({
      ...DEFAULT_AUTO_PARAMS,
      wallType: 'part_chb_part_drywall',
    });
    // Part drywall should provide ~4% structure cost savings
    expect(partDrywall.totalDirectCost).toBeLessThan(allChb.totalDirectCost);
  });

  it('applies parametric estimate to project state and scales items without NaN', () => {
    const updated = applyParametricToProject(DEFAULT_PROJECT_ESTIMATE, DEFAULT_AUTO_PARAMS);
    expect(updated.metadata.totalFloorArea).toBe(180);
    expect(updated.metadata.currency).toBe('₱');
    expect(updated.activeTab).toBe('summary');

    // Ensure all items have valid numbers
    updated.trades.forEach((trade) => {
      trade.subScopes.forEach((scope) => {
        scope.items.forEach((item) => {
          expect(Number.isFinite(item.quantity)).toBe(true);
          expect(Number.isFinite(item.directTotalCost)).toBe(true);
          expect(item.quantity).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });
});
