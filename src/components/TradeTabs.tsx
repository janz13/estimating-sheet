/**
 * src/components/TradeTabs.tsx
 * Navigation tab bar with color-coded trade pills, concise subtotals, horizontal scroll safety, and visual budget composition strip.
 */

import React from 'react';
import {
  HardHat, Building2, ShieldCheck, Warehouse, Grid3x3,
  DoorOpen, Paintbrush, Wrench, Zap, Flame, BarChart3,
  Sparkles,
} from 'lucide-react';
import { Trade, EstimateAction } from '../types/estimate';
import { TECHNICAL_TRADES } from '../constants/trades';
import { calculateTradeTotal } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  HardHat, Building2, ShieldCheck, Warehouse, Grid: Grid3x3,
  DoorOpen, Paintbrush, Wrench, Zap, Flame,
};

const COLOR_MAP: Record<string, string> = TECHNICAL_TRADES.reduce(
  (acc, def) => ({ ...acc, [def.id]: def.accentColor }),
  {}
);

/**
 * Formats large totals compactly inside trade tabs (e.g. ₱2.02M, ₱486k) when unselected,
 * keeping full readable trade labels visible on single-row desktop & scrollable mobile bars.
 */
function formatCompactTabAmount(amount: number, currency: string): string {
  if (amount >= 1_000_000) {
    return `${currency}${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `${currency}${Math.round(amount / 1_000)}k`;
  }
  return formatCurrency(amount, currency, 0);
}

interface TradeTabsProps {
  trades: Trade[];
  activeTab: string;
  currency: string;
  dispatch: React.Dispatch<EstimateAction>;
}

export const TradeTabs: React.FC<TradeTabsProps> = ({ trades, activeTab, currency, dispatch }) => {
  const setTab = (id: string) => dispatch({ type: 'SET_ACTIVE_TAB', payload: id });

  const tradeTotals = trades.map((t) => ({
    trade: t,
    totals: calculateTradeTotal(t),
    color: COLOR_MAP[t.id] || '#64748B',
  }));
  const projectDirectTotal = tradeTotals.reduce((sum, entry) => sum + entry.totals.directTotal, 0);

  return (
    <div className="no-print bg-white rounded-t-xl border border-b-0 border-slate-200 shadow-sm overflow-hidden">
      {/* Upper Navigation Bar: Scrollable Summary & 10 Trade Tabs + Pinned Upper-Right Automated Mode */}
      <div className="flex items-stretch border-b border-slate-200" role="tablist">
        <div className="flex-1 min-w-0 flex items-stretch overflow-x-auto flex-nowrap gap-1 px-2 pt-2">
          {/* Summary tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'summary'}
            onClick={() => setTab('summary')}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-t-lg text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'summary'
                ? 'border-sky-600 bg-sky-50/90 text-sky-800'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Summary</span>
          </button>

          {tradeTotals.map(({ trade, totals, color }) => {
            const isActive = activeTab === trade.id;
            const Icon = ICON_MAP[trade.iconName] || Building2;

            return (
              <button
                key={trade.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(trade.id)}
                title={`${trade.code} — ${trade.name}: ${formatCurrency(totals.directTotal, currency)} (${totals.itemCount} items)`}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-2.5 rounded-t-lg text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-sky-600 bg-sky-50/90 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <Icon className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                <span className="whitespace-nowrap">{trade.shortName}</span>
                {totals.directTotal > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isActive
                      ? formatCurrency(totals.directTotal, currency, 0)
                      : formatCompactTabAmount(totals.directTotal, currency)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pinned Automated Estimator Mode Tab at Upper Right */}
        <div className="flex-shrink-0 flex items-end px-2 pt-2 border-l border-slate-200 bg-gradient-to-l from-amber-50/60 to-white">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'auto_estimator'}
            onClick={() => setTab('auto_estimator')}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-t-lg text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'auto_estimator'
                ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-sm'
                : 'border-transparent text-amber-800 bg-amber-50/70 hover:bg-amber-100/90 hover:text-amber-950'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>⚡ Automated Mode</span>
          </button>
        </div>
      </div>

      {/* Interactive Budget Proportion Strip across all 10 trades (aria-hidden decorative shortcut) */}
      {projectDirectTotal > 0 && (
        <div
          className="h-1.5 w-full flex bg-slate-100"
          aria-hidden="true"
          title="Click any colored trade segment to inspect its Bill of Quantities"
        >
          {tradeTotals.map(({ trade, totals, color }) => {
            const sharePct = (totals.directTotal / projectDirectTotal) * 100;
            if (sharePct <= 0) return null;
            const isActive = activeTab === trade.id;
            return (
              <div
                key={trade.id}
                onClick={() => setTab(trade.id)}
                style={{ width: `${sharePct}%`, backgroundColor: color }}
                className={`h-full cursor-pointer transition-opacity ${
                  activeTab === 'summary' || activeTab === 'auto_estimator' || isActive
                    ? 'opacity-90 hover:opacity-100'
                    : 'opacity-40 hover:opacity-85'
                }`}
                title={`${trade.shortName}: ${formatCurrency(totals.directTotal, currency, 0)} (${sharePct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TradeTabs;
