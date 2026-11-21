/**
 * src/components/ConsolidatedView.tsx
 * Master summary tab with executive KPIs, cross-trade global search, trade roll-up, project markups, and charts.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  ArrowUpRight,
  Layers,
  TrendingUp,
  Calculator,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';
import { ProjectEstimateState, EstimateAction } from '../types/estimate';
import { TECHNICAL_TRADES } from '../constants/trades';
import { calculateConsolidatedSummary, calculateItemCosts } from '../utils/calculations';
import { formatCurrency, formatPercent } from '../utils/formatters';
import SummaryCharts from './SummaryCharts';

interface ConsolidatedViewProps {
  state: ProjectEstimateState;
  dispatch: React.Dispatch<EstimateAction>;
}

const TRADE_COLOR_MAP: Record<string, string> = TECHNICAL_TRADES.reduce(
  (acc, t) => ({ ...acc, [t.id]: t.accentColor }),
  {}
);

interface SearchMatch {
  tradeId: string;
  tradeShortName: string;
  tradeColor: string;
  subScopeName: string;
  itemCode: string;
  description: string;
  specification: string;
  unit: string;
  quantity: number;
  directUnitCost: number;
  directTotalCost: number;
}

export const ConsolidatedView: React.FC<ConsolidatedViewProps> = ({ state, dispatch }) => {
  const { metadata, markups, trades } = state;
  const currency = metadata.currency || '₱';
  const [searchQuery, setSearchQuery] = useState('');

  const summary = useMemo(
    () => calculateConsolidatedSummary(trades, markups, metadata.totalFloorArea),
    [trades, markups, metadata.totalFloorArea]
  );

  const totalItemsCount = useMemo(
    () => summary.tradeRollups.reduce((acc, r) => acc + (r.itemCount || 0), 0),
    [summary]
  );
  const totalSubScopesCount = useMemo(
    () => trades.reduce((acc, t) => acc + t.subScopes.length, 0),
    [trades]
  );

  const effectiveMarkupPercent =
    summary.directCost > 0
      ? ((summary.grandTotal - summary.directCost) / summary.directCost) * 100
      : 0;
  const markupMethodLabel = markups.markupMethod === 'additive' ? 'additive' : 'compounded';

  // Cross-trade global BOQ item search
  const searchResults = useMemo<SearchMatch[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matches: SearchMatch[] = [];
    for (const t of trades) {
      const tColor = TRADE_COLOR_MAP[t.id] || '#64748B';
      for (const s of t.subScopes) {
        for (const item of s.items) {
          const hay = `${item.itemCode} ${item.description} ${item.specification || ''} ${t.name}`.toLowerCase();
          if (hay.includes(q)) {
            const costs = calculateItemCosts(
              item.quantity,
              item.materialRate,
              item.laborRate,
              item.equipmentRate
            );
            matches.push({
              tradeId: t.id,
              tradeShortName: t.shortName,
              tradeColor: tColor,
              subScopeName: s.name,
              itemCode: item.itemCode,
              description: item.description,
              specification: item.specification,
              unit: item.unit,
              quantity: item.quantity,
              directUnitCost: costs.directUnitCost,
              directTotalCost: costs.directTotalCost,
            });
          }
        }
      }
    }
    return matches;
  }, [searchQuery, trades]);

  const updateMarkup = (field: string, value: number) => {
    dispatch({ type: 'UPDATE_MARKUPS', payload: { [field]: value } });
  };

  const applyMarkupPreset = (ocm: number, profit: number, tax: number) => {
    dispatch({
      type: 'UPDATE_MARKUPS',
      payload: { ocmPercent: ocm, profitPercent: profit, taxPercent: tax },
    });
  };

  return (
    <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200">
      {/* Page header */}
      <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Consolidated Master Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive roll-up across all {trades.length} technical trades with project markups, global BOQ lookup, and cost analytics.
          </p>
        </div>

        {/* Global Cross-Trade BOQ Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            aria-label="Search BOQ items across all trades"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trades/items (Rebar, CHB)..."
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Global Search Results Panel (when query is entered) */}
        {searchQuery.trim() && (
          <div className="bg-sky-50/70 rounded-xl border border-sky-200 p-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-sky-950">
                Search Results for &ldquo;{searchQuery}&rdquo; ({searchResults.length} match{searchResults.length === 1 ? '' : 'es'})
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] font-semibold text-sky-700 hover:text-sky-900"
              >
                Close Search
              </button>
            </div>
            {searchResults.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                No BOQ line items match &ldquo;{searchQuery}&rdquo;. Try keywords like <span className="font-mono">Rebar</span>, <span className="font-mono">PPR</span>, <span className="font-mono">Boysen</span>, or <span className="font-mono">CHB</span>.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {searchResults.map((m, idx) => (
                  <div
                    key={`${m.tradeId}-${m.itemCode}-${idx}`}
                    className="bg-white rounded-lg border border-sky-100 p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs hover:border-sky-300 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: m.tradeColor }}
                        />
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {m.tradeShortName}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-sky-700">{m.itemCode}</span>
                        <span className="font-semibold text-slate-800">{m.description}</span>
                      </div>
                      {m.specification && (
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">{m.specification}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right tabular-nums">
                        <div className="text-[11px] text-slate-500">
                          {m.quantity} {m.unit} &times; {formatCurrency(m.directUnitCost, currency)}
                        </div>
                        <div className="font-bold text-slate-900">
                          {formatCurrency(m.directTotalCost, currency)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: m.tradeId })}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold transition"
                      >
                        <span>Open</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Executive 4-Card KPI Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* KPI 1: Total Direct Cost */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Total Direct Cost
              </span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-slate-900 tabular-nums mt-1.5">
              {formatCurrency(summary.directCost, currency)}
            </div>
            <div className="mt-2.5 space-y-1">
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                <div style={{ width: `${summary.materialSharePercent}%` }} className="bg-blue-500" />
                <div style={{ width: `${summary.laborSharePercent}%` }} className="bg-amber-500" />
                <div style={{ width: `${summary.equipmentSharePercent}%` }} className="bg-violet-500" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 tabular-nums">
                <span>Mat {formatPercent(summary.materialSharePercent, 0)}</span>
                <span>Lab {formatPercent(summary.laborSharePercent, 0)}</span>
                <span>Eqp {formatPercent(summary.equipmentSharePercent, 0)}</span>
              </div>
            </div>
          </div>

          {/* KPI 2: All-In Contract Total */}
          <div className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-xl p-4 text-white flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-100">
                All-In Contract Cost
              </span>
              <TrendingUp className="w-4 h-4 text-sky-200" />
            </div>
            <div className="text-xl font-black text-white tabular-nums mt-1.5">
              {formatCurrency(summary.grandTotal, currency)}
            </div>
            <div className="text-[11px] text-sky-100 mt-2">
              Includes +{effectiveMarkupPercent.toFixed(1)}% {markupMethodLabel} OCM, Profit &amp; VAT
            </div>
          </div>

          {/* KPI 3: Efficiency per m² */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Unit Cost Efficiency
              </span>
              <Calculator className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900 tabular-nums mt-1.5">
              {formatCurrency(summary.costPerFloorArea, currency)}
              <span className="text-xs font-normal text-slate-500"> / {metadata.floorAreaUnit}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 tabular-nums">
              Direct Rate: <span className="font-semibold text-slate-700">{formatCurrency(summary.directCostPerFloorArea || 0, currency)}/{metadata.floorAreaUnit}</span>
            </div>
          </div>

          {/* KPI 4: BOQ Completeness & Shortcut */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                BOQ Scope Inventory
              </span>
              <ClipboardCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-slate-900 tabular-nums mt-1.5">
              {totalItemsCount} <span className="text-xs font-semibold text-slate-500">Line Items</span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-[11px] text-slate-500">{trades.length} Trades &bull; {totalSubScopesCount} Sub-Scopes</span>
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'auto_estimator' })}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full transition"
              >
                <Sparkles className="w-3 h-3" />
                Resize
              </button>
            </div>
          </div>
        </div>

        {/* Trade Roll-up Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="px-3 py-2.5 text-left w-10">#</th>
                <th className="px-3 py-2.5 text-left">Technical Trade (click to edit)</th>
                <th className="px-3 py-2.5 text-center w-20">Items</th>
                <th className="px-3 py-2.5 text-right">Material</th>
                <th className="px-3 py-2.5 text-right">Labor</th>
                <th className="px-3 py-2.5 text-right">Equipment</th>
                <th className="px-3 py-2.5 text-right">Direct Total</th>
                <th className="px-3 py-2.5 text-right w-32">% Share</th>
              </tr>
            </thead>
            <tbody>
              {summary.tradeRollups.map((r, i) => {
                const tradeColor = TRADE_COLOR_MAP[r.tradeId] || '#64748B';
                return (
                  <tr
                    key={r.tradeId}
                    className="border-b border-slate-100 hover:bg-sky-50/50 transition cursor-pointer group"
                    onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: r.tradeId })}
                  >
                    <td className="px-3 py-2.5 text-slate-400 font-mono">{i + 1}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tradeColor }}
                        />
                        <span>{r.name || r.tradeName}</span>
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-sky-600 font-semibold transition-opacity">
                          Edit &rarr;
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 tabular-nums">
                        {r.itemCount}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-blue-600 tabular-nums">
                      {formatCurrency(r.materialTotal, currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-amber-600 tabular-nums">
                      {formatCurrency(r.laborTotal, currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-purple-600 tabular-nums">
                      {formatCurrency(r.equipmentTotal, currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 tabular-nums">
                      {formatCurrency(r.directTotal, currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, r.percentageShare * 2.5)}%`,
                              backgroundColor: tradeColor,
                            }}
                          />
                        </div>
                        <span className="text-slate-600 font-medium w-11 text-right">
                          {formatPercent(r.percentageShare)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold">
                <td colSpan={2} className="px-3 py-3">TOTAL DIRECT COST</td>
                <td className="px-3 py-3 text-center text-slate-300 tabular-nums">{totalItemsCount}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatCurrency(summary.materialTotal, currency)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatCurrency(summary.laborTotal, currency)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatCurrency(summary.equipmentTotal, currency)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatCurrency(summary.directCost, currency)}
                </td>
                <td className="px-3 py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Project Markups & Grand Total */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Project Markups &amp; Indirect Costs
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyMarkupPreset(8, 10, 12)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-sky-400 text-slate-600 transition"
                >
                  Standard (8/10/12%)
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkupPreset(0, 0, 0)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-sky-400 text-slate-600 transition"
                >
                  Direct Cost Only (0%)
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkupPreset(10, 12, 12)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-sky-400 text-slate-600 transition"
                >
                  Turnkey (10/12/12%)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* OCM */}
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="markup-ocm" className="text-xs font-medium text-slate-700 flex-1">Overhead / Contingency / Misc (%)</label>
                <input
                  id="markup-ocm"
                  type="number"
                  value={markups.ocmPercent}
                  onChange={(e) => updateMarkup('ocmPercent', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 text-xs text-right px-2 py-1.5 bg-white border border-slate-300 rounded-md font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-400"
                  min="0"
                  step="0.5"
                />
                <span className="text-xs font-semibold text-slate-600 w-32 text-right tabular-nums">
                  {formatCurrency(summary.ocmAmount, currency)}
                </span>
              </div>
              <div className="text-xs text-slate-400 text-right border-b border-slate-200/70 pb-2">
                Subtotal after OCM: <span className="font-semibold text-slate-700 tabular-nums">{formatCurrency(summary.subtotalAfterOCM, currency)}</span>
              </div>

              {/* Profit */}
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="markup-profit" className="text-xs font-medium text-slate-700 flex-1">Contractor&apos;s Profit (%)</label>
                <input
                  id="markup-profit"
                  type="number"
                  value={markups.profitPercent}
                  onChange={(e) => updateMarkup('profitPercent', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 text-xs text-right px-2 py-1.5 bg-white border border-slate-300 rounded-md font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-400"
                  min="0"
                  step="0.5"
                />
                <span className="text-xs font-semibold text-slate-600 w-32 text-right tabular-nums">
                  {formatCurrency(summary.profitAmount, currency)}
                </span>
              </div>
              <div className="text-xs text-slate-400 text-right border-b border-slate-200/70 pb-2">
                Subtotal before Tax: <span className="font-semibold text-slate-700 tabular-nums">{formatCurrency(summary.subtotalBeforeTax, currency)}</span>
              </div>

              {/* Tax */}
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="markup-tax" className="text-xs font-medium text-slate-700 flex-1">Tax / VAT (%)</label>
                <input
                  id="markup-tax"
                  type="number"
                  value={markups.taxPercent}
                  onChange={(e) => updateMarkup('taxPercent', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 text-xs text-right px-2 py-1.5 bg-white border border-slate-300 rounded-md font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-400"
                  min="0"
                  step="0.5"
                />
                <span className="text-xs font-semibold text-slate-600 w-32 text-right tabular-nums">
                  {formatCurrency(summary.taxAmount, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Grand Total & KPIs */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 rounded-xl p-6 text-white text-center shadow-md">
              <div className="text-xs uppercase tracking-widest text-sky-200 font-semibold mb-1.5">
                Grand Total Project Cost
              </div>
              <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight">
                {formatCurrency(summary.grandTotal, currency)}
              </div>
              <div className="text-[11px] text-sky-100/90 mt-2">
                {markups.markupMethod === 'additive' ? 'Additive' : 'Compounded'} OCM ({summary.ocmPercent}%), Profit ({summary.profitPercent}%), and Tax/VAT ({summary.taxPercent}%)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 text-center">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
                  All-In Cost / {metadata.floorAreaUnit}
                </div>
                <div className="text-lg font-black text-slate-900 tabular-nums">
                  {formatCurrency(summary.costPerFloorArea, currency)}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 text-center">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
                  Direct Cost / {metadata.floorAreaUnit}
                </div>
                <div className="text-lg font-black text-slate-900 tabular-nums">
                  {formatCurrency(summary.directCostPerFloorArea || 0, currency)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Analytics Charts */}
        <SummaryCharts
          tradeRollups={summary.tradeRollups}
          materialTotal={summary.materialTotal}
          laborTotal={summary.laborTotal}
          equipmentTotal={summary.equipmentTotal}
          directCost={summary.directCost}
          currency={currency}
        />
      </div>
    </div>
  );
};

export default ConsolidatedView;
