import React from 'react';
import { useEstimateReducer } from './hooks/useEstimateReducer';
import Header from './components/Header';
import TradeTabs from './components/TradeTabs';
import TradeSheet from './components/TradeSheet';
import ConsolidatedView from './components/ConsolidatedView';
import { calculateConsolidatedSummary, round2 } from './utils/calculations';
import { formatCurrency, formatPercent } from './utils/formatters';

export const App: React.FC = () => {
  const { state, dispatch, exportJSON, importJSON } = useEstimateReducer();
  const { trades, activeTab, metadata, markups } = state;
  const currency = metadata.currency || '$';

  const currentTrade = trades.find((t) => t.id === activeTab);
  const summary = calculateConsolidatedSummary(trades, markups, metadata.totalFloorArea);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 font-sans antialiased">
      {/* Top Application Header */}
      <Header
        state={state}
        dispatch={dispatch}
        exportJSON={exportJSON}
        importJSON={importJSON}
      />

      {/* Main Workspace (Web View) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-4 no-print">
        {/* Navigation Tabs (Summary + 10 Technical Trades) */}
        <TradeTabs
          trades={trades}
          activeTab={activeTab}
          currency={currency}
          dispatch={dispatch}
        />

        {/* Tab View Container */}
        <div className="transition-all">
          {activeTab === 'summary' || !currentTrade ? (
            <ConsolidatedView state={state} dispatch={dispatch} />
          ) : (
            <TradeSheet
              key={currentTrade.id}
              trade={currentTrade}
              currency={currency}
              dispatch={dispatch}
            />
          )}
        </div>
      </main>

      {/* Print-Only Proposal / Bill of Quantities View */}
      <div className="hidden print-only p-8 bg-white text-slate-900">
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">
                Bill of Quantities (BOQ) Estimate
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Physical Assembly & Architectural Finishes Specification
              </p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div className="font-semibold">{metadata.projectName}</div>
              <div>Status: {metadata.status}</div>
              <div>Date: {metadata.date}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs mt-4 pt-3 border-t border-slate-200">
            <div><span className="font-semibold text-slate-600">Client:</span> {metadata.clientName}</div>
            <div><span className="font-semibold text-slate-600">Location:</span> {metadata.location}</div>
            <div><span className="font-semibold text-slate-600">Floor Area:</span> {metadata.totalFloorArea} {metadata.floorAreaUnit}</div>
          </div>
        </div>

        {/* Master Summary Table for Print */}
        <div className="mb-8 break-inside-avoid">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
            Executive Trade Summary
          </h2>
          <table className="w-full text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                <th className="p-1.5 text-left w-8">#</th>
                <th className="p-1.5 text-left">Technical Trade</th>
                <th className="p-1.5 text-right w-24">Material</th>
                <th className="p-1.5 text-right w-24">Labor</th>
                <th className="p-1.5 text-right w-24">Equipment</th>
                <th className="p-1.5 text-right w-28">Direct Total</th>
                <th className="p-1.5 text-right w-16">% Share</th>
              </tr>
            </thead>
            <tbody>
              {summary.tradeRollups.map((r, i) => (
                <tr key={r.tradeId} className="border-b border-slate-200">
                  <td className="p-1.5 text-center font-mono">{i + 1}</td>
                  <td className="p-1.5 font-medium">{r.name || r.tradeName}</td>
                  <td className="p-1.5 text-right tabular-nums">{formatCurrency(r.materialTotal, currency)}</td>
                  <td className="p-1.5 text-right tabular-nums">{formatCurrency(r.laborTotal, currency)}</td>
                  <td className="p-1.5 text-right tabular-nums">{formatCurrency(r.equipmentTotal, currency)}</td>
                  <td className="p-1.5 text-right font-semibold tabular-nums">{formatCurrency(r.directTotal, currency)}</td>
                  <td className="p-1.5 text-right tabular-nums">{formatPercent(r.percentageShare)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                <td colSpan={2} className="p-2">TOTAL DIRECT COST</td>
                <td className="p-2 text-right">{formatCurrency(summary.materialTotal, currency)}</td>
                <td className="p-2 text-right">{formatCurrency(summary.laborTotal, currency)}</td>
                <td className="p-2 text-right">{formatCurrency(summary.equipmentTotal, currency)}</td>
                <td className="p-2 text-right">{formatCurrency(summary.directCost, currency)}</td>
                <td className="p-2 text-right">100%</td>
              </tr>
            </tfoot>
          </table>

          {/* Markups & Grand Total */}
          <div className="mt-4 flex justify-end">
            <div className="w-80 border border-slate-300 rounded p-3 text-xs space-y-1.5 bg-slate-50">
              <div className="flex justify-between">
                <span>Overhead / OCM ({markups.ocmPercent}%):</span>
                <span className="font-medium">{formatCurrency(summary.ocmAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Subtotal after OCM:</span>
                <span>{formatCurrency(summary.subtotalAfterOCM, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Contractor's Profit ({markups.profitPercent}%):</span>
                <span className="font-medium">{formatCurrency(summary.profitAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Subtotal before Tax:</span>
                <span>{formatCurrency(summary.subtotalBeforeTax, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax / VAT ({markups.taxPercent}%):</span>
                <span className="font-medium">{formatCurrency(summary.taxAmount, currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm border-t border-slate-300 pt-1.5 text-slate-900">
                <span>GRAND TOTAL:</span>
                <span>{formatCurrency(summary.grandTotal, currency)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <span>Cost / {metadata.floorAreaUnit}:</span>
                <span>{formatCurrency(summary.costPerFloorArea, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Details for Print */}
        {trades.map((trade, tIdx) => (
          <div key={trade.id} className="break-before-page pt-4">
            <div className="flex justify-between items-center border-b border-slate-300 pb-1 mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Trade {tIdx + 1}: {trade.name}
              </h3>
              <div className="text-xs text-slate-600">
                Subtotal: {formatCurrency(summary.tradeRollups[tIdx]?.directTotal || 0, currency)}
              </div>
            </div>

            {trade.subScopes.map((scope) => (
              <div key={scope.id} className="mb-4">
                <div className="text-xs font-bold text-slate-700 bg-slate-100 p-1 mb-1">
                  {scope.code} {scope.name}
                </div>
                <table className="w-full text-[11px] border border-slate-200 mb-2">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="p-1 text-left w-16">Code</th>
                      <th className="p-1 text-left">Description</th>
                      <th className="p-1 text-left w-12">Unit</th>
                      <th className="p-1 text-right w-14">Qty</th>
                      <th className="p-1 text-right w-16">Unit Cost</th>
                      <th className="p-1 text-right w-20">Direct Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scope.items.map((item) => {
                      const uc = round2((item.materialRate || 0) + (item.laborRate || 0) + (item.equipmentRate || 0));
                      const dt = round2((item.quantity || 0) * uc);
                      return (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="p-1 font-mono">{item.itemCode}</td>
                          <td className="p-1">
                            <div className="font-medium">{item.description}</div>
                            {item.specification && (
                              <div className="text-[10px] text-slate-500">{item.specification}</div>
                            )}
                          </td>
                          <td className="p-1">{item.unit}</td>
                          <td className="p-1 text-right tabular-nums">{item.quantity}</td>
                          <td className="p-1 text-right tabular-nums">{formatCurrency(uc, currency)}</td>
                          <td className="p-1 text-right tabular-nums font-semibold">{formatCurrency(dt, currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-400 no-print flex flex-wrap justify-between items-center max-w-7xl mx-auto w-full">
        <div>
          Building Completion Estimating App &bull; Physical Assembly & Finishes
        </div>
        <div className="text-slate-400">
          Last Updated: {new Date(state.updatedAt).toLocaleTimeString()}
        </div>
      </footer>
    </div>
  );
};

export default App;
