/**
 * src/components/ConsolidatedView.tsx
 * Master summary tab with trade roll-up, project markups, KPIs, and visual analytics.
 */

import React from 'react';
import { ProjectEstimateState, EstimateAction } from '../types/estimate';
import { calculateConsolidatedSummary } from '../utils/calculations';
import { formatCurrency, formatPercent } from '../utils/formatters';
import SummaryCharts from './SummaryCharts';

interface ConsolidatedViewProps {
  state: ProjectEstimateState;
  dispatch: React.Dispatch<EstimateAction>;
}

export const ConsolidatedView: React.FC<ConsolidatedViewProps> = ({ state, dispatch }) => {
  const { metadata, markups, trades } = state;
  const currency = metadata.currency || '$';
  const summary = calculateConsolidatedSummary(trades, markups, metadata.totalFloorArea);

  const updateMarkup = (field: string, value: number) => {
    dispatch({ type: 'UPDATE_MARKUPS', payload: { [field]: value } });
  };

  return (
    <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200">
      {/* Page header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">Consolidated Master Summary</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Roll-up of all {trades.length} technical trades with project-level markups and analytics.
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Trade Roll-up Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Technical Trade</th>
                <th className="px-3 py-2 text-right">Material</th>
                <th className="px-3 py-2 text-right">Labor</th>
                <th className="px-3 py-2 text-right">Equipment</th>
                <th className="px-3 py-2 text-right">Direct Total</th>
                <th className="px-3 py-2 text-right">% Share</th>
              </tr>
            </thead>
            <tbody>
              {summary.tradeRollups.map((r, i) => (
                <tr
                  key={r.tradeId}
                  className="border-b border-slate-100 hover:bg-sky-50/30 transition cursor-pointer"
                  onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: r.tradeId })}
                >
                  <td className="px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-slate-700">
                    {r.name || r.tradeName}
                  </td>
                  <td className="px-3 py-2 text-right text-blue-600 tabular-nums">
                    {formatCurrency(r.materialTotal, currency)}
                  </td>
                  <td className="px-3 py-2 text-right text-amber-600 tabular-nums">
                    {formatCurrency(r.laborTotal, currency)}
                  </td>
                  <td className="px-3 py-2 text-right text-purple-600 tabular-nums">
                    {formatCurrency(r.equipmentTotal, currency)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-slate-800 tabular-nums">
                    {formatCurrency(r.directTotal, currency)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500 tabular-nums">
                    {formatPercent(r.percentageShare)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white font-bold">
                <td colSpan={2} className="px-3 py-2.5">TOTAL DIRECT COST</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {formatCurrency(summary.materialTotal, currency)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {formatCurrency(summary.laborTotal, currency)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {formatCurrency(summary.equipmentTotal, currency)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {formatCurrency(summary.directCost, currency)}
                </td>
                <td className="px-3 py-2.5 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Project Markups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Project Markups & Indirect Costs
            </h3>
            <div className="space-y-3">
              {/* OCM */}
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs text-slate-600 flex-1">Overhead / Contingency / Misc (%)</label>
                <input
                  type="number"
                  value={markups.ocmPercent}
                  onChange={(e) => updateMarkup('ocmPercent', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 text-xs text-right px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400"
                  min="0"
                  step="0.5"
                />
                <span className="text-xs text-slate-500 w-28 text-right tabular-nums">
                  {formatCurrency(summary.ocmAmount, currency)}
                </span>
              </div>
              <div className="text-xs text-slate-400 text-right">
                Subtotal after OCM: <span className="font-medium text-slate-600">{formatCurrency(summary.subtotalAfterOCM, currency)}</span>
              </div>

              {/* Profit */}
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs text-slate-600 flex-1">Contractor&apos;s Profit (%)</label>
                <input
                  type="number"
                  value={markups.profitPercent}
                  onChange={(e) => updateMarkup('profitPercent', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 text-xs text-right px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400"
                  min="0"
                  step="0.5"
                />
                <span className="text-xs text-slate-500 w-28 text-right tabular-nums">
                  {formatCurrency(summary.profitAmount, currency)}
                </span>
              </div>
              <div className="text-xs text-slate-400 text-right">
                Subtotal before Tax: <span className="font-medium text-slate-600">{formatCurrency(summary.subtotalBeforeTax, currency)}</span>
              </div>

              {/* Tax */}
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs text-slate-600 flex-1">Tax / VAT (%)</label>
                <input
                  type="number"
                  value={markups.taxPercent}
                  onChange={(e) => updateMarkup('taxPercent', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 text-xs text-right px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400"
                  min="0"
                  step="0.5"
                />
                <span className="text-xs text-slate-500 w-28 text-right tabular-nums">
                  {formatCurrency(summary.taxAmount, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Grand Total & KPIs */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-xl p-5 text-white text-center">
              <div className="text-xs uppercase tracking-widest text-sky-200 mb-1">Grand Total Project Cost</div>
              <div className="text-3xl font-black tabular-nums">
                {formatCurrency(summary.grandTotal, currency)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Cost / {metadata.floorAreaUnit}
                </div>
                <div className="text-lg font-bold text-slate-800 tabular-nums">
                  {formatCurrency(summary.costPerFloorArea, currency)}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Direct / {metadata.floorAreaUnit}
                </div>
                <div className="text-lg font-bold text-slate-800 tabular-nums">
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
