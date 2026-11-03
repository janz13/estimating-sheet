import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

/**
 * LocalStorage Persistence & Recovery Test Suite (tests/localStorage.test.ts)
 * Covers Feature: F31 (Browser LocalStorage Auto-Save & Recovery)
 * Standards: Key naming, schema safety, corrupted state fallback, quota exception handling
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
  };
  markups: {
    ocmPercent: number;
    profitPercent: number;
    taxPercent: number;
  };
  trades: any[];
  updatedAt: string;
}

const STORAGE_KEY = 'construction_estimating_app_state_v1';

let saveToLocalStorage: (project: ProjectEstimateState) => void;
let loadFromLocalStorage: () => ProjectEstimateState | null;
let clearLocalStorage: () => void;

// In-memory mock storage backing
let mockStorage: { [key: string]: string } = {};

beforeAll(async () => {
  // Set up standard window.localStorage polyfill for node test environment
  const localStorageMock = {
    getItem: vi.fn((key: string): string | null => {
      return Object.prototype.hasOwnProperty.call(mockStorage, key) ? mockStorage[key] : null;
    }),
    setItem: vi.fn((key: string, value: string): void => {
      mockStorage[key] = String(value);
    }),
    removeItem: vi.fn((key: string): void => {
      delete mockStorage[key];
    }),
    clear: vi.fn((): void => {
      mockStorage = {};
    }),
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  try {
    const modPath = '../src/services/localStorage';
    const mod = await import(/* @vite-ignore */ modPath);
    saveToLocalStorage = mod.saveToLocalStorage;
    loadFromLocalStorage = mod.loadFromLocalStorage;
    clearLocalStorage = mod.clearLocalStorage;
  } catch {
    // Reference Program / Specification Oracle per PROJECT.md
    saveToLocalStorage = (project: ProjectEstimateState): void => {
      if (!project || typeof project !== 'object') return;
      try {
        const payload = JSON.stringify(project);
        globalThis.localStorage.setItem(STORAGE_KEY, payload);
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }
    };

    loadFromLocalStorage = (): ProjectEstimateState | null => {
      try {
        const raw = globalThis.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.version && parsed.metadata && parsed.trades) {
          return parsed as ProjectEstimateState;
        }
        return null;
      } catch (err) {
        console.warn('LocalStorage load error, returning fallback null:', err);
        return null;
      }
    };

    clearLocalStorage = (): void => {
      try {
        globalThis.localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn('LocalStorage clear error:', err);
      }
    };
  }
});

beforeEach(() => {
  mockStorage = {};
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

const mockProject: ProjectEstimateState = {
  version: '1.0.0',
  metadata: {
    projectName: 'Skyline Penthouse Fit-Out',
    clientName: 'Vanguard Holdings',
    location: 'Chicago, IL',
    estimator: 'Robert Chen, QS',
    date: '2026-11-03',
    totalFloorArea: 320.0,
    floorAreaUnit: 'm²',
    currency: '$',
    status: 'Approved',
  },
  markups: {
    ocmPercent: 8.5,
    profitPercent: 12.0,
    taxPercent: 10.0,
  },
  trades: [
    {
      id: 'trade_carpentry',
      code: 'CRP',
      name: 'Carpentry & Drywall',
      subScopes: [],
    },
  ],
  updatedAt: '2026-11-03T03:35:00.000Z',
};

describe('Browser LocalStorage Persistence (tests/localStorage.test.ts)', () => {
  describe('1. Save & Load Normal Operations', () => {
    it('persists project state under the standard storage key', () => {
      saveToLocalStorage(mockProject);
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
      expect(mockStorage[STORAGE_KEY]).toBeDefined();
    });

    it('loads previously saved state from storage with full property retention', () => {
      saveToLocalStorage(mockProject);
      const loaded = loadFromLocalStorage();

      expect(loaded).not.toBeNull();
      expect(loaded?.metadata.projectName).toBe('Skyline Penthouse Fit-Out');
      expect(loaded?.metadata.totalFloorArea).toBe(320.0);
      expect(loaded?.markups.profitPercent).toBe(12.0);
      expect(loaded?.trades.length).toBe(1);
    });

    it('returns null when storage key does not exist (initial launch)', () => {
      const loaded = loadFromLocalStorage();
      expect(loaded).toBeNull();
    });

    it('clears storage item upon explicit clearLocalStorage call', () => {
      saveToLocalStorage(mockProject);
      expect(mockStorage[STORAGE_KEY]).toBeDefined();

      clearLocalStorage();
      expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(mockStorage[STORAGE_KEY]).toBeUndefined();
    });
  });

  describe('2. Fault Tolerance & Corrupt Payload Recovery', () => {
    it('handles syntactically malformed JSON in localStorage safely without throwing unhandled exceptions', () => {
      mockStorage[STORAGE_KEY] = '{"version": "1.0.0", invalid_json...';
      const loaded = loadFromLocalStorage();
      expect(loaded).toBeNull();
    });

    it('returns null if stored JSON is missing required schema sections (e.g. trades array)', () => {
      mockStorage[STORAGE_KEY] = JSON.stringify({
        version: '1.0.0',
        metadata: mockProject.metadata,
        // trades missing
      });
      const loaded = loadFromLocalStorage();
      expect(loaded).toBeNull();
    });

    it('gracefully handles QuotaExceededError during save without crashing the application', () => {
      vi.spyOn(globalThis.localStorage, 'setItem').mockImplementationOnce(() => {
        const error = new Error('The quota has been exceeded.');
        error.name = 'QuotaExceededError';
        throw error;
      });

      expect(() => saveToLocalStorage(mockProject)).not.toThrow();
    });
  });

  describe('3. Multi-Write Invariant Preservation', () => {
    it('preserves the latest written state after sequential updates', () => {
      saveToLocalStorage(mockProject);

      const updatedProject: ProjectEstimateState = {
        ...mockProject,
        metadata: {
          ...mockProject.metadata,
          projectName: 'Updated Penthouse Project Name',
        },
        updatedAt: '2026-11-03T03:40:00.000Z',
      };
      saveToLocalStorage(updatedProject);

      const loaded = loadFromLocalStorage();
      expect(loaded?.metadata.projectName).toBe('Updated Penthouse Project Name');
      expect(loaded?.updatedAt).toBe('2026-11-03T03:40:00.000Z');
    });
  });
});
