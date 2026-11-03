/**
 * src/hooks/useEstimateReducer.ts
 * Central state management with useReducer + localStorage persistence.
 */

import { useReducer, useEffect, useCallback, useMemo } from 'react';
import {
  ProjectEstimateState,
  EstimateAction,
  EstimateItem,
} from '../types/estimate';
import { DEFAULT_PROJECT_ESTIMATE } from '../data/defaultProject';
import { generateId } from '../utils/idGenerator';
import { calculateItemCosts } from '../utils/calculations';

const STORAGE_KEY = 'building_estimating_app_state';

function recalcItem(item: EstimateItem): EstimateItem {
  const costs = calculateItemCosts(
    item.quantity,
    item.materialRate,
    item.laborRate,
    item.equipmentRate
  );
  return {
    ...item,
    directUnitCost: costs.directUnitCost,
    directTotalCost: costs.directTotalCost,
    materialTotalCost: costs.materialTotal,
    laborTotalCost: costs.laborTotal,
    equipmentTotalCost: costs.equipmentTotal,
    totalCost: costs.directTotalCost * (1 + (item.markupPercent || 0) / 100),
  };
}

function createBlankItem(tradeId: string, scopeId: string, tradeCode: string, itemIndex: number): EstimateItem {
  return recalcItem({
    id: generateId('item'),
    scopeId,
    tradeId,
    itemCode: `${tradeCode}-NEW-${String(itemIndex).padStart(3, '0')}`,
    description: '',
    specification: '',
    unit: 'pcs',
    quantity: 0,
    materialRate: 0,
    laborRate: 0,
    equipmentRate: 0,
    directUnitCost: 0,
    directTotalCost: 0,
    materialTotalCost: 0,
    laborTotalCost: 0,
    equipmentTotalCost: 0,
    markupPercent: 0,
    totalCost: 0,
  });
}

function estimateReducer(
  state: ProjectEstimateState,
  action: EstimateAction
): ProjectEstimateState {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload, updatedAt: now };

    case 'UPDATE_METADATA':
      return {
        ...state,
        metadata: { ...state.metadata, ...action.payload },
        updatedAt: now,
      };

    case 'UPDATE_MARKUPS':
      return {
        ...state,
        markups: { ...state.markups, ...action.payload },
        updatedAt: now,
      };

    case 'UPDATE_ITEM': {
      const { tradeId, scopeId, itemId, field, value } = action.payload;
      return {
        ...state,
        updatedAt: now,
        trades: state.trades.map((trade) => {
          if (trade.id !== tradeId) return trade;
          return {
            ...trade,
            subScopes: trade.subScopes.map((scope) => {
              if (scope.id !== scopeId) return scope;
              return {
                ...scope,
                items: scope.items.map((item) => {
                  if (item.id !== itemId) return item;
                  const updated = { ...item, [field]: value };
                  return recalcItem(updated);
                }),
              };
            }),
          };
        }),
      };
    }

    case 'SET_ITEM': {
      const { tradeId, scopeId, item } = action.payload;
      return {
        ...state,
        updatedAt: now,
        trades: state.trades.map((trade) => {
          if (trade.id !== tradeId) return trade;
          return {
            ...trade,
            subScopes: trade.subScopes.map((scope) => {
              if (scope.id !== scopeId) return scope;
              return {
                ...scope,
                items: scope.items.map((i) =>
                  i.id === item.id ? recalcItem(item) : i
                ),
              };
            }),
          };
        }),
      };
    }

    case 'ADD_ITEM': {
      const { tradeId, scopeId, item: partial } = action.payload;
      const trade = state.trades.find((t) => t.id === tradeId);
      const scope = trade?.subScopes.find((s) => s.id === scopeId);
      const idx = (scope?.items.length || 0) + 1;
      const newItem = recalcItem({
        ...createBlankItem(tradeId, scopeId, trade?.code || 'NEW', idx),
        ...partial,
      } as EstimateItem);
      return {
        ...state,
        updatedAt: now,
        trades: state.trades.map((t) => {
          if (t.id !== tradeId) return t;
          return {
            ...t,
            subScopes: t.subScopes.map((s) => {
              if (s.id !== scopeId) return s;
              return { ...s, items: [...s.items, newItem] };
            }),
          };
        }),
      };
    }

    case 'DUPLICATE_ITEM': {
      const { tradeId, scopeId, itemId } = action.payload;
      return {
        ...state,
        updatedAt: now,
        trades: state.trades.map((t) => {
          if (t.id !== tradeId) return t;
          return {
            ...t,
            subScopes: t.subScopes.map((s) => {
              if (s.id !== scopeId) return s;
              const idx = s.items.findIndex((i) => i.id === itemId);
              if (idx === -1) return s;
              const source = s.items[idx];
              const dup = recalcItem({
                ...source,
                id: generateId('item'),
                itemCode: source.itemCode + '-DUP',
                description: source.description + ' (Copy)',
              });
              const newItems = [...s.items];
              newItems.splice(idx + 1, 0, dup);
              return { ...s, items: newItems };
            }),
          };
        }),
      };
    }

    case 'DELETE_ITEM': {
      const { tradeId, scopeId, itemId } = action.payload;
      return {
        ...state,
        updatedAt: now,
        trades: state.trades.map((t) => {
          if (t.id !== tradeId) return t;
          return {
            ...t,
            subScopes: t.subScopes.map((s) => {
              if (s.id !== scopeId) return s;
              return { ...s, items: s.items.filter((i) => i.id !== itemId) };
            }),
          };
        }),
      };
    }

    case 'ADD_PRESET_ITEMS': {
      const { tradeId, scopeId, items } = action.payload;
      return {
        ...state,
        updatedAt: now,
        trades: state.trades.map((t) => {
          if (t.id !== tradeId) return t;
          return {
            ...t,
            subScopes: t.subScopes.map((s) => {
              if (s.id !== scopeId) return s;
              return { ...s, items: [...s.items, ...items.map(recalcItem)] };
            }),
          };
        }),
      };
    }

    case 'RESET_PROJECT':
      return action.payload || { ...DEFAULT_PROJECT_ESTIMATE, updatedAt: now };

    case 'LOAD_PROJECT':
      return { ...action.payload, updatedAt: now };

    case 'CLEAR_ALL_ITEMS':
      return {
        ...state,
        updatedAt: now,
        trades: state.trades.map((t) => ({
          ...t,
          subScopes: t.subScopes.map((s) => ({ ...s, items: [] })),
        })),
      };

    default:
      return state;
  }
}

function loadState(): ProjectEstimateState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProjectEstimateState;
      if (parsed && parsed.version && Array.isArray(parsed.trades)) {
        return parsed;
      }
    }
  } catch {
    // Corrupt or missing data
  }
  return DEFAULT_PROJECT_ESTIMATE;
}

export function useEstimateReducer() {
  const [state, dispatch] = useReducer(estimateReducer, null, loadState);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable
    }
  }, [state]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.metadata.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_estimate.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importJSON = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as ProjectEstimateState;
          if (data && data.version && Array.isArray(data.trades)) {
            dispatch({ type: 'LOAD_PROJECT', payload: data });
          } else {
            alert('Invalid project file format.');
          }
        } catch {
          alert('Failed to parse project file.');
        }
      };
      reader.readAsText(file);
    },
    [dispatch]
  );

  return useMemo(
    () => ({ state, dispatch, exportJSON, importJSON }),
    [state, dispatch, exportJSON, importJSON]
  );
}
