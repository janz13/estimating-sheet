import { describe, it, expect } from 'vitest';
import { DEFAULT_PROJECT_ESTIMATE } from '../src/data/defaultProject';
import { TECHNICAL_TRADES } from '../src/constants/trades';
import { CONSTRUCTION_UNITS } from '../src/constants/units';
import {
  calculateConsolidatedSummary,
  calculateTradeTotal,
  calculateSubScopeTotal,
  calculateItemCosts,
  round2,
} from '../src/utils/calculations';

describe('Milestone 1 Benchmark Dataset Integrity Verification', () => {
  const project = DEFAULT_PROJECT_ESTIMATE;

  describe('Project Metadata Verification', () => {
    it('contains all required project metadata fields with non-empty valid values', () => {
      const meta = project.metadata;
      expect(meta).toBeDefined();

      // Project Name
      expect(typeof meta.projectName).toBe('string');
      expect(meta.projectName.trim().length).toBeGreaterThan(0);
      expect(meta.projectName).toBe('Luxury 2-Storey Modern Residence');

      // Client Name
      expect(typeof meta.clientName).toBe('string');
      expect(meta.clientName.trim().length).toBeGreaterThan(0);
      expect(meta.clientName).toBe('Mr. & Mrs. Anderson');

      // Location
      expect(typeof meta.location).toBe('string');
      expect(meta.location.trim().length).toBeGreaterThan(0);
      expect(meta.location).toBe('Emerald Heights Subdivision, Phase 2, Lot 14');

      // Estimator
      expect(typeof meta.estimator).toBe('string');
      expect(meta.estimator.trim().length).toBeGreaterThan(0);
      expect(meta.estimator).toBe('Engr. J. Smith, PE');

      // Date
      expect(typeof meta.date).toBe('string');
      expect(/^\d{4}-\d{2}-\d{2}$/.test(meta.date)).toBe(true);
      expect(meta.date).toBe('2026-11-03');

      // Floor Area & Unit
      expect(typeof meta.totalFloorArea).toBe('number');
      expect(meta.totalFloorArea).toBe(250.0);
      expect(meta.floorAreaUnit).toBe('m²');

      // Currency
      expect(typeof meta.currency).toBe('string');
      expect(meta.currency).toBe('$');

      // Status
      expect(['Draft', 'Under Review', 'Approved', 'Final Proposal']).toContain(meta.status);
    });

    it('contains valid project markups configuration', () => {
      const markups = project.markups;
      expect(markups).toBeDefined();
      expect(markups.ocmPercent).toBe(8.0);
      expect(markups.profitPercent).toBe(10.0);
      expect(markups.taxPercent).toBe(12.0);
      expect(markups.markupMethod).toBe('compounded');
    });
  });

  describe('Technical Trades and Sub-Scopes Structural Integrity', () => {
    it('contains exactly 10 technical trades in sequential order', () => {
      expect(project.trades).toBeDefined();
      expect(project.trades.length).toBe(10);
      expect(project.trades.length).toBe(TECHNICAL_TRADES.length);

      project.trades.forEach((trade, index) => {
        const expectedDef = TECHNICAL_TRADES[index];
        expect(trade.id).toBe(expectedDef.id);
        expect(trade.code).toBe(expectedDef.code);
        expect(trade.tradeNumber).toBe(expectedDef.tradeNumber);
        expect(trade.tradeNumber).toBe(index + 1);
        expect(trade.name).toBe(expectedDef.name);
        expect(trade.shortName).toBe(expectedDef.shortName);
        expect(trade.iconName).toBe(expectedDef.iconName);
      });
    });

    it('contains all 27 sub-scopes matching TECHNICAL_TRADES template definitions', () => {
      let totalSubScopes = 0;

      project.trades.forEach((trade, tIdx) => {
        const expectedTrade = TECHNICAL_TRADES[tIdx];
        expect(trade.subScopes).toBeDefined();
        expect(trade.subScopes.length).toBe(expectedTrade.subScopeTemplates.length);

        trade.subScopes.forEach((subScope, sIdx) => {
          totalSubScopes++;
          const expectedScope = expectedTrade.subScopeTemplates[sIdx];
          expect(subScope.id).toBe(expectedScope.id);
          expect(subScope.tradeId).toBe(trade.id);
          expect(subScope.code).toBe(expectedScope.code);
          expect(subScope.name).toBe(expectedScope.name);
          expect(Array.isArray(subScope.items)).toBe(true);
          expect(subScope.items.length).toBeGreaterThan(0);
        });
      });

      expect(totalSubScopes).toBe(27);
    });
  });

  describe('Item-Level Data Integrity Across All Trades', () => {
    const validUnitStrings = new Set(CONSTRUCTION_UNITS.map((u) => u.unit));

    it('verifies non-empty fields, foreign keys, positive quantities, and valid rate numbers across all items', () => {
      let totalItems = 0;

      for (const trade of project.trades) {
        for (const scope of trade.subScopes) {
          for (const item of scope.items) {
            totalItems++;

            // Scope & Trade foreign keys
            expect(item.scopeId).toBe(scope.id);
            expect(item.tradeId).toBe(trade.id);

            // Description & Specification
            expect(typeof item.description).toBe('string');
            expect(item.description.trim().length).toBeGreaterThan(0);
            expect(typeof item.specification).toBe('string');
            expect(item.specification.trim().length).toBeGreaterThan(0);

            // Quantity & Rates
            expect(typeof item.quantity).toBe('number');
            expect(Number.isFinite(item.quantity)).toBe(true);
            expect(item.quantity).toBeGreaterThan(0);

            expect(typeof item.materialRate).toBe('number');
            expect(Number.isFinite(item.materialRate)).toBe(true);
            expect(item.materialRate).toBeGreaterThanOrEqual(0);

            expect(typeof item.laborRate).toBe('number');
            expect(Number.isFinite(item.laborRate)).toBe(true);
            expect(item.laborRate).toBeGreaterThanOrEqual(0);

            expect(typeof item.equipmentRate).toBe('number');
            expect(Number.isFinite(item.equipmentRate)).toBe(true);
            expect(item.equipmentRate).toBeGreaterThanOrEqual(0);

            // Unit rate sum must be > 0 (item has realistic cost)
            const sumRates = item.materialRate + item.laborRate + item.equipmentRate;
            expect(sumRates).toBeGreaterThan(0);
          }
        }
      }

      expect(totalItems).toBe(97);
    });

    it('verifies mathematical consistency between rate inputs and calculated cost totals on each item', () => {
      for (const trade of project.trades) {
        for (const scope of trade.subScopes) {
          for (const item of scope.items) {
            const calculated = calculateItemCosts(
              item.quantity,
              item.materialRate,
              item.laborRate,
              item.equipmentRate
            );

            expect(item.directUnitCost).toBe(calculated.directUnitCost);
            expect(item.directTotalCost).toBe(calculated.directTotalCost);
            expect(item.materialTotalCost).toBe(calculated.materialTotal);
            expect(item.laborTotalCost).toBe(calculated.laborTotal);
            expect(item.equipmentTotalCost).toBe(calculated.equipmentTotal);
          }
        }
      }
    });

    it('verifies item codes are non-empty and globally unique across all trades', () => {
      const itemCodes = new Set<string>();
      const duplicateCodes: string[] = [];

      for (const trade of project.trades) {
        for (const scope of trade.subScopes) {
          for (const item of scope.items) {
            expect(typeof item.itemCode).toBe('string');
            expect(item.itemCode.trim().length).toBeGreaterThan(0);

            if (itemCodes.has(item.itemCode)) {
              duplicateCodes.push(`${item.itemCode} (id: ${item.id}, scope: ${scope.id}, trade: ${trade.id})`);
            }
            itemCodes.add(item.itemCode);
          }
        }
      }

      expect(duplicateCodes, `Found duplicate item codes:\n${duplicateCodes.join('\n')}`).toEqual([]);
      expect(itemCodes.size).toBe(97);
    });

    it('verifies item units conform strictly to CONSTRUCTION_UNITS (flags "pts" defect on MECH-009)', () => {
      const invalidUnits: any[] = [];
      const allUnitsUsed = new Set<string>();

      for (const trade of project.trades) {
        for (const scope of trade.subScopes) {
          for (const item of scope.items) {
            expect(typeof item.unit).toBe('string');
            allUnitsUsed.add(item.unit);

            if (!validUnitStrings.has(item.unit as any)) {
              invalidUnits.push({
                unit: item.unit,
                itemCode: item.itemCode,
                scope: scope.id,
                trade: trade.id,
              });
            }
          }
        }
      }

      // Explicitly document the defect detected empirically
      if (invalidUnits.length > 0) {
        console.warn('CRITICAL DEFECT DETECTED: Invalid units present in defaultProject:', invalidUnits);
      }

      expect(
        invalidUnits,
        `Found invalid units not matching CONSTRUCTION_UNITS: ${JSON.stringify(invalidUnits)}`
      ).toEqual([]);
    });

    it('verifies item IDs are globally unique across all trades and sub-scopes (flags duplicate ID reuse)', () => {
      const itemIds = new Set<string>();
      const duplicateIds: string[] = [];

      for (const trade of project.trades) {
        for (const scope of trade.subScopes) {
          for (const item of scope.items) {
            expect(typeof item.id).toBe('string');
            expect(item.id.trim().length).toBeGreaterThan(0);

            if (itemIds.has(item.id)) {
              duplicateIds.push(`${item.id} (code: ${item.itemCode}, scope: ${scope.id}, trade: ${trade.id})`);
            }
            itemIds.add(item.id);
          }
        }
      }

      // Explicitly document the defect detected empirically
      if (duplicateIds.length > 0) {
        console.warn(`CRITICAL DEFECT DETECTED: ${duplicateIds.length} duplicate item IDs found in defaultProject:`, duplicateIds);
      }

      expect(
        duplicateIds,
        `Found ${duplicateIds.length} duplicate item IDs across defaultProject:\n${duplicateIds.join('\n')}`
      ).toEqual([]);
    });
  });

  describe('Direct Cost Sum Reconciliation with calculateConsolidatedSummary', () => {
    it('manually sums all items and matches calculateConsolidatedSummary exactly', () => {
      let manualDirectSum = 0;
      let manualMaterialSum = 0;
      let manualLaborSum = 0;
      let manualEquipmentSum = 0;
      let totalItemCount = 0;

      for (const trade of project.trades) {
        let tradeDirectSum = 0;
        let tradeMaterialSum = 0;
        let tradeLaborSum = 0;
        let tradeEquipmentSum = 0;
        let tradeItemCount = 0;

        for (const scope of trade.subScopes) {
          const scopeTotals = calculateSubScopeTotal(scope.items);
          let scopeDirectSum = 0;
          let scopeMaterialSum = 0;
          let scopeLaborSum = 0;
          let scopeEquipmentSum = 0;

          for (const item of scope.items) {
            totalItemCount++;
            tradeItemCount++;
            manualDirectSum += item.directTotalCost;
            manualMaterialSum += item.materialTotalCost;
            manualLaborSum += item.laborTotalCost;
            manualEquipmentSum += item.equipmentTotalCost;

            scopeDirectSum += item.directTotalCost;
            scopeMaterialSum += item.materialTotalCost;
            scopeLaborSum += item.laborTotalCost;
            scopeEquipmentSum += item.equipmentTotalCost;
          }

          expect(scopeTotals.directTotal).toBe(round2(scopeDirectSum));
          expect(scopeTotals.materialTotal).toBe(round2(scopeMaterialSum));
          expect(scopeTotals.laborTotal).toBe(round2(scopeLaborSum));
          expect(scopeTotals.equipmentTotal).toBe(round2(scopeEquipmentSum));

          tradeDirectSum += scopeDirectSum;
          tradeMaterialSum += scopeMaterialSum;
          tradeLaborSum += scopeLaborSum;
          tradeEquipmentSum += scopeEquipmentSum;
        }

        const tradeTotals = calculateTradeTotal(trade);
        expect(tradeTotals.directTotal).toBe(round2(tradeDirectSum));
        expect(tradeTotals.materialTotal).toBe(round2(tradeMaterialSum));
        expect(tradeTotals.laborTotal).toBe(round2(tradeLaborSum));
        expect(tradeTotals.equipmentTotal).toBe(round2(tradeEquipmentSum));
        expect(tradeTotals.itemCount).toBe(tradeItemCount);
      }

      const expectedDirectTotal = round2(manualDirectSum);
      const expectedMaterialTotal = round2(manualMaterialSum);
      const expectedLaborTotal = round2(manualLaborSum);
      const expectedEquipmentTotal = round2(manualEquipmentSum);

      const summary = calculateConsolidatedSummary(
        project.trades,
        project.markups,
        project.metadata.totalFloorArea
      );

      // Verify direct totals match exactly to 2 decimal places
      expect(summary.directCost).toBe(expectedDirectTotal);
      expect(summary.materialTotal).toBe(expectedMaterialTotal);
      expect(summary.laborTotal).toBe(expectedLaborTotal);
      expect(summary.equipmentTotal).toBe(expectedEquipmentTotal);

      // Exact numerical verification against worker reported values
      expect(summary.directCost).toBe(145974.7);
      expect(summary.materialTotal).toBe(84913.4);
      expect(summary.laborTotal).toBe(49436.2);
      expect(summary.equipmentTotal).toBe(11625.1);

      // Verify category component sum reconciliation
      expect(round2(summary.materialTotal + summary.laborTotal + summary.equipmentTotal)).toBe(
        summary.directCost
      );

      // Verify Compounding Markups
      // OCM: 8% of Direct Cost
      const expectedOCM = round2(summary.directCost * 0.08);
      expect(summary.ocmAmount).toBe(expectedOCM);
      expect(summary.ocmAmount).toBe(11677.98);

      const expectedSubtotalAfterOCM = round2(summary.directCost + expectedOCM);
      expect(summary.subtotalAfterOCM).toBe(expectedSubtotalAfterOCM);
      expect(summary.subtotalAfterOCM).toBe(157652.68);

      // Profit: 10% of subtotalAfterOCM
      const expectedProfit = round2(summary.subtotalAfterOCM * 0.1);
      expect(summary.profitAmount).toBe(expectedProfit);
      expect(summary.profitAmount).toBe(15765.27);

      const expectedSubtotalBeforeTax = round2(summary.subtotalAfterOCM + expectedProfit);
      expect(summary.subtotalBeforeTax).toBe(expectedSubtotalBeforeTax);
      expect(summary.subtotalBeforeTax).toBe(173417.95);

      // Tax: 12% of subtotalBeforeTax
      const expectedTax = round2(summary.subtotalBeforeTax * 0.12);
      expect(summary.taxAmount).toBe(expectedTax);
      expect(summary.taxAmount).toBe(20810.15);

      // Grand Total
      const expectedGrandTotal = round2(summary.subtotalBeforeTax + expectedTax);
      expect(summary.grandTotal).toBe(expectedGrandTotal);
      expect(summary.grandTotal).toBe(194228.1);

      // Cost per floor area (250 m²)
      const expectedCostPerArea = round2(summary.grandTotal / 250.0);
      expect(summary.costPerFloorArea).toBe(expectedCostPerArea);
      expect(summary.costPerFloorArea).toBe(776.91);
    });
  });

  describe('Adversarial Cleanliness & Serialization Integrity', () => {
    it('verifies dataset is free of NaN, undefined, and Infinity', () => {
      const checkClean = (obj: any, path = ''): void => {
        if (obj === null || obj === undefined) {
          // undefined or null check
          if (obj === undefined) {
            throw new Error(`Found undefined at path: ${path}`);
          }
          return;
        }
        if (typeof obj === 'number') {
          expect(Number.isFinite(obj), `Non-finite number at ${path}`).toBe(true);
          expect(Number.isNaN(obj), `NaN detected at ${path}`).toBe(false);
          return;
        }
        if (Array.isArray(obj)) {
          obj.forEach((item, idx) => checkClean(item, `${path}[${idx}]`));
          return;
        }
        if (typeof obj === 'object') {
          for (const key of Object.keys(obj)) {
            checkClean(obj[key], `${path}.${key}`);
          }
        }
      };

      checkClean(project, 'DEFAULT_PROJECT_ESTIMATE');
    });

    it('verifies JSON serialization and deserialization preserves all 97 items and values without corruption', () => {
      const serialized = JSON.stringify(project);
      expect(typeof serialized).toBe('string');
      expect(serialized.length).toBeGreaterThan(50000);

      const parsed = JSON.parse(serialized);
      expect(parsed.trades.length).toBe(10);
      const totalItems = parsed.trades.reduce(
        (sum: number, t: any) =>
          sum + t.subScopes.reduce((sSum: number, s: any) => sSum + s.items.length, 0),
        0
      );
      expect(totalItems).toBe(97);

      const reserializedSummary = calculateConsolidatedSummary(
        parsed.trades,
        parsed.markups,
        parsed.metadata.totalFloorArea
      );
      expect(reserializedSummary.directCost).toBe(145974.7);
      expect(reserializedSummary.grandTotal).toBe(194228.1);
    });
  });

  describe('Static Production Build Output Verification (dist/)', () => {
    it('verifies dist/index.html exists and strictly uses relative ./ asset references', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const distDir = path.resolve(__dirname, '../dist');
      const indexHtmlPath = path.join(distDir, 'index.html');

      expect(fs.existsSync(indexHtmlPath), 'dist/index.html must exist').toBe(true);

      const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

      // Check relative script reference: src="./assets/...js"
      const scriptMatch = htmlContent.match(/<script[^>]+src="([^"]+)"/);
      expect(scriptMatch, 'Must contain a script tag').not.toBeNull();
      const scriptSrc = scriptMatch![1];
      expect(scriptSrc.startsWith('./assets/'), `Script src "${scriptSrc}" must start with "./assets/"`).toBe(true);
      expect(scriptSrc.startsWith('/assets/'), `Script src must NOT be absolute "/assets/"`).toBe(false);

      // Check relative css reference: href="./assets/...css"
      const cssMatch = htmlContent.match(/<link[^>]+href="([^"]+\.css)"/);
      expect(cssMatch, 'Must contain a css link tag').not.toBeNull();
      const cssHref = cssMatch![1];
      expect(cssHref.startsWith('./assets/'), `CSS href "${cssHref}" must start with "./assets/"`).toBe(true);
      expect(cssHref.startsWith('/assets/'), `CSS href must NOT be absolute "/assets/"`).toBe(false);

      // Check relative favicon reference: href="./favicon.svg"
      const iconMatch = htmlContent.match(/<link[^>]+rel="icon"[^>]+href="([^"]+)"/);
      expect(iconMatch, 'Must contain a favicon link tag').not.toBeNull();
      const iconHref = iconMatch![1];
      expect(iconHref.startsWith('./'), `Favicon href "${iconHref}" must start with "./"`).toBe(true);

      // Verify referenced asset files physically exist on disk and have non-zero size
      const scriptFilename = path.basename(scriptSrc);
      const cssFilename = path.basename(cssHref);
      const scriptFilePath = path.join(distDir, 'assets', scriptFilename);
      const cssFilePath = path.join(distDir, 'assets', cssFilename);

      expect(fs.existsSync(scriptFilePath), `Bundled script ${scriptFilename} must exist`).toBe(true);
      expect(fs.statSync(scriptFilePath).size).toBeGreaterThan(10000);

      expect(fs.existsSync(cssFilePath), `Bundled CSS ${cssFilename} must exist`).toBe(true);
      expect(fs.statSync(cssFilePath).size).toBeGreaterThan(1000);
    });
  });
});

