/**
 * src/components/TradeSheet.tsx
 * Full estimating grid for a single trade, with collapsible sub-scope sections.
 */

import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Trade, EstimateAction } from '../types/estimate';
import { calculateSubScopeTotal, calculateTradeTotal } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import LineItemRow from './LineItemRow';

interface TradeSheetProps {
  trade: Trade;
  currency: string;
  dispatch: React.Dispatch<EstimateAction>;
}

export const TradeSheet: React.FC<TradeSheetProps> = ({ trade, currency, dispatch }) => {
  const tradeTotal = calculateTradeTotal(trade);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (scopeId: string) => {
    setCollapsed((prev) => ({ ...prev, [scopeId]: !prev[scopeId] }));
  };

  return (
    <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200">
      {/* Trade header bar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            {trade.code} — {trade.name}
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Material:</span>
            <span className="font-semibold text-blue-600">{formatCurrency(tradeTotal.materialTotal, currency)}</span>
            <span className="text-slate-400">Labor:</span>
            <span className="font-semibold text-amber-600">{formatCurrency(tradeTotal.laborTotal, currency)}</span>
            <span className="text-slate-400">Equip:</span>
            <span className="font-semibold text-purple-600">{formatCurrency(tradeTotal.equipmentTotal, currency)}</span>
          </div>
          <div className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">
            Total: {formatCurrency(tradeTotal.directTotal, currency)}
          </div>
        </div>
      </div>

      {/* Sub-scopes */}
      {trade.subScopes.map((scope) => {
        const scopeTotal = calculateSubScopeTotal(scope.items);
        const isCollapsed = collapsed[scope.id];

        return (
          <div key={scope.id} className="border-b border-slate-100 last:border-b-0">
            {/* Sub-scope header */}
            <div
              className="px-4 py-2.5 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition"
              onClick={() => toggleCollapse(scope.id)}
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-xs font-mono text-slate-400">{scope.code}</span>
                <span className="text-xs font-semibold text-slate-700">{scope.name}</span>
                <span className="text-[10px] text-slate-400">
                  ({scope.items.length} item{scope.items.length !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-600">
                {formatCurrency(scopeTotal.directTotal, currency)}
              </div>
            </div>

            {/* Items table */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <th className="px-2 py-2 text-center w-8">#</th>
                      <th className="px-2 py-2 text-left w-24">Code</th>
                      <th className="px-2 py-2 text-left min-w-[200px]">Description</th>
                      <th className="px-2 py-2 text-left w-16">Unit</th>
                      <th className="px-2 py-2 text-right w-20">Qty</th>
                      <th className="px-2 py-2 text-right w-20">Mat/U</th>
                      <th className="px-2 py-2 text-right w-20">Lab/U</th>
                      <th className="px-2 py-2 text-right w-20">Eqp/U</th>
                      <th className="px-2 py-2 text-right w-24">Unit Cost</th>
                      <th className="px-2 py-2 text-right w-28">Total</th>
                      <th className="px-2 py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {scope.items.map((item, idx) => (
                      <LineItemRow
                        key={item.id}
                        item={item}
                        index={idx}
                        tradeId={trade.id}
                        scopeId={scope.id}
                        currency={currency}
                        dispatch={dispatch}
                      />
                    ))}
                    {scope.items.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-4 py-6 text-center text-slate-400 text-xs italic">
                          No items yet. Click "+ Add Item" to start estimating.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {scope.items.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={9} className="px-4 py-2 text-right text-xs font-semibold text-slate-500">
                          Sub-Scope Total:
                        </td>
                        <td className="px-2 py-2 text-right text-xs font-bold text-slate-800 tabular-nums">
                          {formatCurrency(scopeTotal.directTotal, currency)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                {/* Add item button */}
                <div className="px-4 py-2 border-t border-slate-50">
                  <button
                    onClick={() =>
                      dispatch({
                        type: 'ADD_ITEM',
                        payload: { tradeId: trade.id, scopeId: scope.id },
                      })
                    }
                    className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-2 py-1 rounded transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TradeSheet;
