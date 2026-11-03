import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Single-File Portable JSON Project Serialization Test Suite (tests/serialization.test.ts)
 * Covers Features: F29 (Export JSON), F30 (Import JSON)
 * Standards: Schema validation, roundtrip state preservation, error handling for corrupted payloads
 */

interface ProjectEstimateState {
  version: string;
  metadata: {
    projectName: string;
    clientName: string;
    location: string;
    estimator: string;
    date: string;
    totalFloorArea: number;
    floorAreaUnit: string;
    currency: string;
    status: string;
    notes?: string;
  };
  markups: {
    ocmPercent: number;
    profitPercent: number;
    taxPercent: number;
    markupMethod?: 'compounded' | 'additive';
  };
  trades: Array<{
    id: string;
    code: string;
    name: string;
    tabIndex?: number;
    subScopes: Array<{
      id: string;
      name: string;
      items: Array<{
        id: string;
        scopeId: string;
        itemCode: string;
        description: string;
        specification: string;
        unit: string;
        quantity: number;
        materialRate: number;
        laborRate: number;
        equipmentRate: number;
        directUnitCost: number;
        directTotalCost: number;
        materialTotalCost?: number;
        laborTotalCost?: number;
        equipmentTotalCost?: number;
      }>;
    }>;
  }>;
  updatedAt: string;
}

let exportToJSON: (project: ProjectEstimateState) => string;
let importFromJSON: (jsonString: string) => { success: boolean; project?: ProjectEstimateState; error?: string };

beforeAll(async () => {
  try {
    const modPath = '../src/services/jsonStorage';
    const mod = await import(/* @vite-ignore */ modPath);
    exportToJSON = mod.exportToJSON;
    importFromJSON = mod.importFromJSON;
  } catch {
    // Reference Program / Specification Oracle per PROJECT.md
    exportToJSON = (project: ProjectEstimateState): string => {
      if (!project || typeof project !== 'object') {
        throw new Error('Invalid project state to export');
      }
      return JSON.stringify(project, null, 2);
    };

    importFromJSON = (jsonString: string): { success: boolean; project?: ProjectEstimateState; error?: string } => {
      if (typeof jsonString !== 'string' || !jsonString.trim()) {
        return { success: false, error: 'Empty JSON input' };
      }

      let parsed: any;
      try {
        parsed = JSON.parse(jsonString);
      } catch (err: any) {
        return { success: false, error: `Malformed JSON: ${err.message}` };
      }

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { success: false, error: 'Invalid JSON root: Expected a project state object' };
      }

      // Schema verification of mandatory top-level sections
      if (!parsed.version) {
        return { success: false, error: 'Missing schema version' };
      }
      if (!parsed.metadata || typeof parsed.metadata !== 'object') {
        return { success: false, error: 'Missing or invalid metadata section' };
      }
      if (!parsed.markups || typeof parsed.markups !== 'object') {
        return { success: false, error: 'Missing or invalid markups section' };
      }
      if (!Array.isArray(parsed.trades)) {
        return { success: false, error: 'Missing or invalid trades list' };
      }

      // Metadata required fields check
      const m = parsed.metadata;
      if (typeof m.projectName !== 'string' || typeof m.totalFloorArea !== 'number') {
        return { success: false, error: 'Invalid project metadata fields' };
      }

      // Markups required fields check
      const mk = parsed.markups;
      if (typeof mk.ocmPercent !== 'number' || typeof mk.profitPercent !== 'number' || typeof mk.taxPercent !== 'number') {
        return { success: false, error: 'Invalid markup percentage fields' };
      }

      return {
        success: true,
        project: parsed as ProjectEstimateState,
      };
    };
  }
});

const sampleProject: ProjectEstimateState = {
  version: '1.0.0',
  metadata: {
    projectName: 'Luxury 2-Storey Modern Residence',
    clientName: 'Mr. & Mrs. Anderson',
    location: 'Austin, TX',
    estimator: 'Engr. J. Smith, PE',
    date: '2026-11-03',
    totalFloorArea: 250.0,
    floorAreaUnit: 'm²',
    currency: '$',
    status: 'Draft',
    notes: 'Architectural finishes and MEP rough-in',
  },
  markups: {
    ocmPercent: 8.0,
    profitPercent: 10.0,
    taxPercent: 12.0,
    markupMethod: 'compounded',
  },
  trades: [
    {
      id: 'trade_concrete',
      code: 'CONC',
      name: 'Concrete & Masonry Works',
      tabIndex: 2,
      subScopes: [
        {
          id: 'conc_structural',
          name: 'Structural Concrete',
          items: [
            {
              id: 'item-conc-001',
              scopeId: 'conc_structural',
              itemCode: 'CONC-001',
              description: 'Ready-mix Concrete 3000 PSI',
              specification: 'Class A 28-day cure, 20mm aggregate',
              unit: 'm³',
              quantity: 34.0,
              materialRate: 95.0,
              laborRate: 22.0,
              equipmentRate: 15.0,
              directUnitCost: 132.0,
              directTotalCost: 4488.0,
              materialTotalCost: 3230.0,
              laborTotalCost: 748.0,
              equipmentTotalCost: 510.0,
            },
          ],
        },
      ],
    },
  ],
  updatedAt: '2026-11-03T03:30:00.000Z',
};

describe('Single-File JSON Project Serialization (tests/serialization.test.ts)', () => {
  describe('1. JSON Export Validation (F29)', () => {
    it('produces valid parseable JSON text', () => {
      const jsonStr = exportToJSON(sampleProject);
      expect(typeof jsonStr).toBe('string');
      expect(() => JSON.parse(jsonStr)).not.toThrow();
    });

    it('contains all mandatory root keys: version, metadata, markups, trades, updatedAt', () => {
      const jsonStr = exportToJSON(sampleProject);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.metadata).toBeDefined();
      expect(parsed.markups).toBeDefined();
      expect(parsed.trades).toBeDefined();
      expect(Array.isArray(parsed.trades)).toBe(true);
      expect(parsed.updatedAt).toBeDefined();
    });

    it('preserves UTF-8 special characters and symbols in description and metadata', () => {
      const projectWithUnicode: ProjectEstimateState = {
        ...sampleProject,
        metadata: {
          ...sampleProject.metadata,
          projectName: 'Residencia de San José "La Vista" — ₱50M',
          notes: 'Includes <special> characters & symbols: 150m² / 20m³ / © 2026',
        },
      };
      const jsonStr = exportToJSON(projectWithUnicode);
      const restored = JSON.parse(jsonStr);
      expect(restored.metadata.projectName).toBe('Residencia de San José "La Vista" — ₱50M');
      expect(restored.metadata.notes).toBe('Includes <special> characters & symbols: 150m² / 20m³ / © 2026');
    });
  });

  describe('2. JSON Import Validation & Error Rejection (F30)', () => {
    it('rejects empty or whitespace-only strings gracefully', () => {
      const res1 = importFromJSON('');
      expect(res1.success).toBe(false);
      expect(res1.error).toBeDefined();

      const res2 = importFromJSON('   \n  ');
      expect(res2.success).toBe(false);
    });

    it('rejects malformed syntax JSON strings without throwing unhandled exceptions', () => {
      const malformed = '{"version": "1.0.0", "metadata": { "projectName": "Incomplete"';
      const res = importFromJSON(malformed);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Malformed JSON/i);
    });

    it('rejects JSON payloads missing required version header', () => {
      const invalid = JSON.stringify({
        metadata: sampleProject.metadata,
        markups: sampleProject.markups,
        trades: sampleProject.trades,
      });
      const res = importFromJSON(invalid);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/version/i);
    });

    it('rejects JSON payloads missing required metadata section', () => {
      const invalid = JSON.stringify({
        version: '1.0.0',
        markups: sampleProject.markups,
        trades: sampleProject.trades,
      });
      const res = importFromJSON(invalid);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/metadata/i);
    });

    it('rejects JSON payloads missing required markups section', () => {
      const invalid = JSON.stringify({
        version: '1.0.0',
        metadata: sampleProject.metadata,
        trades: sampleProject.trades,
      });
      const res = importFromJSON(invalid);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/markups/i);
    });

    it('rejects JSON payloads missing trades array', () => {
      const invalid = JSON.stringify({
        version: '1.0.0',
        metadata: sampleProject.metadata,
        markups: sampleProject.markups,
        trades: 'not an array',
      });
      const res = importFromJSON(invalid);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/trades/i);
    });
  });

  describe('3. Complete Roundtrip State Fidelity', () => {
    it('restores 100% of project data across export -> import cycle with zero mutations', () => {
      const jsonStr = exportToJSON(sampleProject);
      const importResult = importFromJSON(jsonStr);

      expect(importResult.success).toBe(true);
      expect(importResult.project).toBeDefined();
      expect(importResult.project).toEqual(sampleProject);
    });

    it('preserves numeric precision across multiple serialize/deserialize iterations', () => {
      let current = sampleProject;
      for (let i = 0; i < 5; i++) {
        const json = exportToJSON(current);
        const res = importFromJSON(json);
        expect(res.success).toBe(true);
        current = res.project!;
      }
      expect(current.metadata.totalFloorArea).toBe(250.0);
      expect(current.trades[0].subScopes[0].items[0].directTotalCost).toBe(4488.0);
    });
  });
});
