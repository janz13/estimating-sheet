/**
 * src/components/TradeTabs.tsx
 * Navigation tab bar with trade badges showing live subtotals.
 */

import React from 'react';
import {
  HardHat, Building2, ShieldCheck, Warehouse, Grid3x3,
  DoorOpen, Paintbrush, Wrench, Zap, Flame, BarChart3,
} from 'lucide-react';
import { Trade, EstimateAction } from '../types/estimate';
import { calculateTradeTotal } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  HardHat, Building2, ShieldCheck, Warehouse, Grid: Grid3x3,
  DoorOpen, Paintbrush, Wrench, Zap, Flame,
};

interface TradeTabsProps {
  trades: Trade[];
  activeTab: string;
  currency: string;
  dispatch: React.Dispatch<EstimateAction>;
}

export const TradeTabs: React.FC<TradeTabsProps> = ({ trades, activeTab, currency, dispatch }) => {
  const setTab = (id: string) => dispatch({ type: 'SET_ACTIVE_TAB', payload: id });

  return (
    <div className="no-print">
      {/* Scrollable tab bar */}
      <div className="flex overflow-x-auto gap-1 pb-1 border-b border-slate-200 bg-white px-2 pt-2 rounded-t-xl shadow-sm">
        {/* Summary tab */}
        <button
          onClick={() => setTab('summary')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'summary'
              ? 'border-sky-500 bg-sky-50 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Summary</span>
        </button>

        {trades.map((trade) => {
          const totals = calculateTradeTotal(trade);
          const isActive = activeTab === trade.id;
          const Icon = ICON_MAP[trade.iconName] || Building2;

          return (
            <button
              key={trade.id}
              onClick={() => setTab(trade.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap border-b-2 transition-all min-w-0 ${
                isActive
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{trade.shortName}</span>
              {totals.directTotal > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {formatCurrency(totals.directTotal, currency, 0)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TradeTabs;
