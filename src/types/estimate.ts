/**
 * src/types/estimate.ts
 * Core domain types for Technical Trade Estimating, BOQ Line Items, and Reactive State Actions.
 */

import { ProjectMetadata, ProjectMarkups } from './metadata';

/**
 * Standard construction measurement units.
 */
export type StandardUnit =
  | 'm³'     // volume (excavation, structural concrete, gravel bedding)
  | 'm²'     // area (formwork, masonry, drywall, ceiling, tiles, paint, waterproofing, roofing)
  | 'lm'     // linear length (pipes, conduits, wires, gutters, moldings, railings)
  | 'kg'     // mass (reinforcing steel bars, structural steel trusses, tie wire)
  | 'tons'   // mass (heavy structural steel)
  | 'sets'   // assemblies (doors, windows, panelboards, equipment sets)
  | 'pcs'    // discrete items (junction boxes, floor drains, sprinkler heads, locksets)
  | 'rolls'  // rolled materials (wire rolls, vapor barriers, mesh)
  | 'liters' // liquid coatings, sealers, chemical treatments
  | 'gals'   // 4-liter / gallon paint & chemical containers
  | 'bags'   // 40kg Portland cement, 25kg tile adhesive, skim coat bags
  | 'sheets' // 4'x8' plywood, phenolic, gypsum, HardieFlex & GI sheets
  | 'points' // electrical/data/fire alarm drops
  | 'lot';   // lump sum allowances (temporary facilities, septic tank, testing)

export type UnitOfMeasure = StandardUnit | string;

/**
 * An individual estimating line item representing physical assembly or finish work.
 */
export interface EstimateItem {
  id: string;               // Unique RFC4122 UUID: e.g. "item-conc-001"
  scopeId: string;          // Foreign key to parent SubScope: e.g. "sub_conc_structural"
  tradeId: string;          // Foreign key to parent Trade: e.g. "trade_concrete"
  itemCode: string;         // Human-readable reference code: e.g. "CONC-001"
  description: string;      // Line item description: e.g. "Ready-mix Concrete 3,000 PSI"
  specification: string;    // Technical specification: e.g. "ASTM C94 Class A 28-day cure, 20mm aggregate"
  unit: StandardUnit | string;
  quantity: number;         // Take-off quantity (>= 0)

  // Direct Unit Rates
  materialRate: number;     // Direct material cost per unit (>= 0)
  laborRate: number;        // Direct labor cost per unit (>= 0)
  equipmentRate: number;    // Direct equipment/tools cost per unit (>= 0)

  // Computed Unit & Extended Direct Costs
  directUnitCost: number;   // materialRate + laborRate + equipmentRate
  directTotalCost: number;  // quantity * directUnitCost
  materialTotalCost: number;// quantity * materialRate
  laborTotalCost: number;   // quantity * laborRate
  equipmentTotalCost: number;// quantity * equipmentRate

  // Optional Item-Level Contingency/Markup
  markupPercent?: number;   // Optional item-level markup % (default 0)
  totalCost?: number;       // directTotalCost * (1 + markupPercent / 100)
}

/**
 * A sub-scope group within a technical trade.
 */
export interface SubScope {
  id: string;               // Unique ID: e.g. "sub_conc_structural"
  tradeId: string;          // Parent trade ID: e.g. "trade_concrete"
  code: string;             // Sub-scope reference code: e.g. "02.1"
  name: string;             // Display name: e.g. "Structural Concrete (Footings, Columns, Beams, Slabs)"
  description?: string;
  items: EstimateItem[];
}

/**
 * A technical trade scope tab containing structured sub-scopes.
 */
export interface Trade {
  id: string;               // Unique ID: e.g. "trade_concrete"
  code: string;             // Standard trade code: e.g. "CONC"
  tradeNumber: number;      // Sequence index: 1 to 10
  name: string;             // Full trade name: e.g. "Concrete & Masonry Works"
  shortName: string;        // Compact tab display name: e.g. "Concrete"
  iconName: string;         // Lucide icon identifier: e.g. "Building2"
  description?: string;
  subScopes: SubScope[];
}

/**
 * Root reactive application state for a project estimate.
 */
export interface ProjectEstimateState {
  version: string;          // Schema version: e.g. "1.0.0"
  metadata: ProjectMetadata;
  markups: ProjectMarkups;
  trades: Trade[];
  activeTab: string;        // 'summary' | tradeId
  updatedAt: string;        // ISO timestamp
  isSaved?: boolean;
}

/**
 * Discriminated union of actions supported by the central useReducer hook.
 */
export type EstimateAction =
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'UPDATE_METADATA'; payload: Partial<ProjectMetadata> }
  | { type: 'UPDATE_MARKUPS'; payload: Partial<ProjectMarkups> }
  | {
      type: 'UPDATE_ITEM';
      payload: {
        tradeId: string;
        scopeId: string;
        itemId: string;
        field: keyof EstimateItem;
        value: string | number;
      };
    }
  | {
      type: 'SET_ITEM';
      payload: {
        tradeId: string;
        scopeId: string;
        item: EstimateItem;
      };
    }
  | {
      type: 'ADD_ITEM';
      payload: {
        tradeId: string;
        scopeId: string;
        item?: Partial<EstimateItem>;
      };
    }
  | {
      type: 'DUPLICATE_ITEM';
      payload: {
        tradeId: string;
        scopeId: string;
        itemId: string;
      };
    }
  | {
      type: 'DELETE_ITEM';
      payload: {
        tradeId: string;
        scopeId: string;
        itemId: string;
      };
    }
  | {
      type: 'ADD_PRESET_ITEMS';
      payload: {
        tradeId: string;
        scopeId: string;
        items: EstimateItem[];
      };
    }
  | {
      type: 'REORDER_ITEMS';
      payload: {
        tradeId: string;
        scopeId: string;
        startIndex: number;
        endIndex: number;
      };
    }
  | {
      type: 'RESET_PROJECT';
      payload?: ProjectEstimateState;
    }
  | {
      type: 'LOAD_PROJECT';
      payload: ProjectEstimateState;
    }
  | {
      type: 'CLEAR_ALL_ITEMS';
    };
