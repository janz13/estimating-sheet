/**
 * src/components/TradeSheet.tsx
 * Full estimating grid for a single trade, with sub-scope collapse controls, in-trade filtering, and sequential navigation.
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  ChevronsDownUp,
  ChevronsUpDown,
  ArrowLeft,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { Trade, EstimateAction } from '../types/estimate';
import { TECHNICAL_TRADES } from '../constants/trades';
import { calculateSubScopeTotal, calculateTradeTotal } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import LineItemRow from './LineItemRow';

interface TradeSheetProps {
  trade: Trade;
  prevTrade?: Trade;
  nextTrade?: Trade;
  currency: string;
  dispatch: React.Dispatch<EstimateAction>;
}

const COLOR_MAP: Record<string, string> = TECHNICAL_TRADES.reduce(
  (acc, def) => ({ ...acc, [def.id]: def.accentColor }),
  {}
);

export const TradeSheet: React.FC<TradeSheetProps> = ({
  trade,
  prevTrade,
  nextTrade,
  currency,
  dispatch,
}) => {
  const tradeTotal = calculateTradeTotal(trade);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const accentColor = COLOR_MAP[trade.id] || '#0EA5E9';

  const matPct = tradeTotal.directTotal > 0 ? (tradeTotal.materialTotal / tradeTotal.directTotal) * 100 : 0;
  const labPct = tradeTotal.directTotal > 0 ? (tradeTotal.laborTotal / tradeTotal.directTotal) * 100 : 0;
  const eqpPct = tradeTotal.directTotal > 0 ? (tradeTotal.equipmentTotal / tradeTotal.directTotal) * 100 : 0;

  const toggleCollapse = (scopeId: string) => {
    setCollapsed((prev) => ({ ...prev, [scopeId]: !prev[scopeId] }));
  };

  const setAllCollapsed = (isCollapsed: boolean) => {
    const next: Record<string, boolean> = {};
    trade.subScopes.forEach((s) => {
      next[s.id] = isCollapsed;
    });
    setCollapsed(next);
  };

  const allCollapsed = useMemo(
    () => trade.subScopes.length > 0 && trade.subScopes.every((s) => collapsed[s.id]),
    [trade.subScopes, collapsed]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  return (
    <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200 overflow-hidden">
      {/* Rich Trade Header Bar */}
      <div
        className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 border-l-4"
        style={{ borderLeftColor: accentColor }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: accentColor }}
              >
                TRADE {String(trade.tradeNumber).padStart(2, '0')} &bull; {trade.code}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">{trade.name}</h2>
              <span className="text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                {tradeTotal.itemCount} item{tradeTotal.itemCount !== 1 ? 's' : ''}
              </span>
            </div>
            {trade.description && (
              <p className="text-xs text-slate-500 mt-1">{trade.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80">
              <span>
                <span className="text-slate-400">Mat:</span>{' '}
                <span className="font-bold text-blue-600 tabular-nums">{formatCurrency(tradeTotal.materialTotal, currency)}</span>
              </span>
              <span>
                <span className="text-slate-400">Lab:</span>{' '}
                <span className="font-bold text-amber-600 tabular-nums">{formatCurrency(tradeTotal.laborTotal, currency)}</span>
              </span>
              <span>
                <span className="text-slate-400">Eqp:</span>{' '}
                <span className="font-bold text-purple-600 tabular-nums">{formatCurrency(tradeTotal.equipmentTotal, currency)}</span>
              </span>
            </div>
            <div className="font-black text-slate-900 bg-sky-100 border border-sky-200 text-sky-950 px-3.5 py-1.5 rounded-full tabular-nums">
              Total: {formatCurrency(tradeTotal.directTotal, currency)}
            </div>
          </div>
        </div>

        {/* Proportion bar + In-trade toolbar */}
        <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          {/* Search inside this trade */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              aria-label={`Filter items in ${trade.shortName}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Filter items in ${trade.shortName}...`}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Material / Labor / Equip proportion strip */}
            {tradeTotal.directTotal > 0 && (
              <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500">
                <span>Resource Split:</span>
                <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden flex">
                  <div style={{ width: `${matPct}%` }} className="bg-blue-500" title={`Material: ${matPct.toFixed(1)}%`} />
                  <div style={{ width: `${labPct}%` }} className="bg-amber-500" title={`Labor: ${labPct.toFixed(1)}%`} />
                  <div style={{ width: `${eqpPct}%` }} className="bg-purple-500" title={`Equipment: ${eqpPct.toFixed(1)}%`} />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setAllCollapsed(!allCollapsed)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition"
            >
              {allCollapsed ? (
                <>
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  <span>Expand All</span>
                </>
              ) : (
                <>
                  <ChevronsDownUp className="w-3.5 h-3.5" />
                  <span>Collapse All</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-scopes */}
      {trade.subScopes.map((scope) => {
        const scopeTotal = calculateSubScopeTotal(scope.items);
        const isCollapsed = !!collapsed[scope.id];

        const filteredItems = normalizedQuery
          ? scope.items.filter((item) =>
              `${item.itemCode} ${item.description} ${item.specification || ''} ${item.unit}`
                .toLowerCase()
                .includes(normalizedQuery)
            )
          : scope.items;

        return (
          <div key={scope.id} className="border-b border-slate-200 last:border-b-0">
            {/* Sub-scope header */}
            <div
              role="button"
              tabIndex={0}
              aria-expanded={!isCollapsed}
              className="px-4 sm:px-6 py-2.5 bg-slate-50/70 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition"
              onClick={() => toggleCollapse(scope.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCollapse(scope.id);
                }
              }}
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
                  {scope.code}
                </span>
                <span className="text-xs font-bold text-slate-800">{scope.name}</span>
                <span className="text-[11px] text-slate-400">
                  ({filteredItems.length}
                  {normalizedQuery ? ` of ${scope.items.length}` : ''} item{scope.items.length !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="text-xs font-bold text-slate-700 tabular-nums">
                {formatCurrency(scopeTotal.directTotal, currency)}
              </div>
            </div>

            {/* Items table */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-y border-slate-200 text-slate-600 text-[10px] uppercase tracking-wider">
                      <th className="px-2 py-2 text-center w-8">#</th>
                      <th className="px-2 py-2 text-left w-24">Code</th>
                      <th className="px-2 py-2 text-left min-w-[230px]">Description &amp; Technical Spec</th>
                      <th className="px-2 py-2 text-left w-20">Unit</th>
                      <th className="px-2 py-2 text-right w-20">Qty</th>
                      <th className="px-2 py-2 text-right w-24 text-blue-700">Mat/U</th>
                      <th className="px-2 py-2 text-right w-24 text-amber-700">Lab/U</th>
                      <th className="px-2 py-2 text-right w-24 text-purple-700">Eqp/U</th>
                      <th className="px-2 py-2 text-right w-28">Unit Cost</th>
                      <th className="px-2 py-2 text-right w-32">Direct Total</th>
                      <th className="px-2 py-2 text-center w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => (
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
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-4 py-6 text-center text-slate-400 text-xs italic">
                          {normalizedQuery
                            ? `No items match "${searchQuery}" in this sub-scope.`
                            : 'No items yet. Click "+ Add Item" below to start estimating.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {scope.items.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={9} className="px-4 py-2 text-right text-xs font-semibold text-slate-500">
                          Sub-Scope Subtotal:
                        </td>
                        <td className="px-2 py-2 text-right text-xs font-black text-slate-900 tabular-nums">
                          {formatCurrency(scopeTotal.directTotal, currency)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                {/* Add item button */}
                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: 'ADD_ITEM',
                        payload: { tradeId: trade.id, scopeId: scope.id },
                      })
                    }
                    className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Tip: Click any quantity, rate, or unit cell to edit inline &bull; Unit Cost = Mat + Lab + Eqp
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom Sequential Trade Navigator */}
      <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        {prevTrade ? (
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: prevTrade.id })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-sky-400 text-slate-700 font-semibold transition shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Prev: {prevTrade.shortName}</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'summary' })}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition shadow-sm"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Master Summary</span>
        </button>

        {nextTrade ? (
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: nextTrade.id })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition shadow-sm"
          >
            <span>Next: {nextTrade.shortName}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};

export default TradeSheet;
