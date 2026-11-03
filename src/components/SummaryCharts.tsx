/**
 * src/components/SummaryCharts.tsx
 * Pure React/SVG charts for trade cost breakdown and cost type allocation.
 */

import React from 'react';
import { TradeRollup } from '../types/summary';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { TECHNICAL_TRADES } from '../constants/trades';

// Chart colors for trades
const TRADE_COLORS = TECHNICAL_TRADES.map((t) => t.accentColor);
const CATEGORY_COLORS = {
  material: '#3B82F6', // blue-500
  labor: '#F59E0B',    // amber-500
  equipment: '#8B5CF6', // violet-500
};

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
  size?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, centerLabel, centerValue, size = 200 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xs text-slate-400">No data</span>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const innerRadius = size * 0.26;
  let cumAngle = -Math.PI / 2;

  const paths = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const angle = (d.value / total) * Math.PI * 2;
      const startAngle = cumAngle;
      const endAngle = cumAngle + angle;
      cumAngle = endAngle;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);
      const ix1 = cx + innerRadius * Math.cos(startAngle);
      const iy1 = cy + innerRadius * Math.sin(startAngle);
      const ix2 = cx + innerRadius * Math.cos(endAngle);
      const iy2 = cy + innerRadius * Math.sin(endAngle);
      const largeArc = angle > Math.PI ? 1 : 0;

      const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;

      return (
        <path key={d.label} d={path} fill={d.color} className="transition-opacity hover:opacity-80">
          <title>{`${d.label}: ${formatPercent((d.value / total) * 100)}`}</title>
        </path>
      );
    });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-500 text-[10px]">
        {centerLabel}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-800 text-xs font-bold">
        {centerValue}
      </text>
    </svg>
  );
};

interface SummaryChartsProps {
  tradeRollups: TradeRollup[];
  materialTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  directCost: number;
  currency: string;
}

export const SummaryCharts: React.FC<SummaryChartsProps> = ({
  tradeRollups,
  materialTotal,
  laborTotal,
  equipmentTotal,
  directCost,
  currency,
}) => {
  const tradeData = tradeRollups.map((r, i) => ({
    label: r.shortName || r.name || r.tradeName || `Trade ${i + 1}`,
    value: r.directTotal,
    color: TRADE_COLORS[i % TRADE_COLORS.length],
  }));

  const categoryData = [
    { label: 'Material', value: materialTotal, color: CATEGORY_COLORS.material },
    { label: 'Labor', value: laborTotal, color: CATEGORY_COLORS.labor },
    { label: 'Equipment', value: equipmentTotal, color: CATEGORY_COLORS.equipment },
  ];

  // Horizontal stacked bar for trades
  const maxTradeVal = Math.max(...tradeRollups.map((r) => r.directTotal), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trade Cost Breakdown - Donut */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Trade Cost Distribution
        </h3>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <DonutChart
            data={tradeData}
            centerLabel="Direct Cost"
            centerValue={formatCurrency(directCost, currency, 0)}
            size={180}
          />
          <div className="flex flex-col gap-1 text-[11px]">
            {tradeData.filter((d) => d.value > 0).map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-slate-600 truncate max-w-[120px]">{d.label}</span>
                <span className="text-slate-400 ml-auto tabular-nums">
                  {formatCurrency(d.value, currency, 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Type Allocation - Donut */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Cost Type Allocation
        </h3>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <DonutChart
            data={categoryData}
            centerLabel="Direct Cost"
            centerValue={formatCurrency(directCost, currency, 0)}
            size={180}
          />
          <div className="flex flex-col gap-2 text-xs">
            {categoryData.map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="font-medium text-slate-700">{d.label}</span>
                <span className="text-slate-500 ml-2 tabular-nums">
                  {formatCurrency(d.value, currency, 0)}
                </span>
                <span className="text-slate-400 tabular-nums">
                  ({directCost > 0 ? formatPercent((d.value / directCost) * 100) : '0%'})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Trade Comparison
        </h3>
        <div className="space-y-2">
          {tradeRollups.map((r, i) => {
            const pct = maxTradeVal > 0 ? (r.directTotal / maxTradeVal) * 100 : 0;
            const mPct = r.directTotal > 0 ? (r.materialTotal / r.directTotal) * 100 : 0;
            const lPct = r.directTotal > 0 ? (r.laborTotal / r.directTotal) * 100 : 0;
            const ePct = r.directTotal > 0 ? (r.equipmentTotal / r.directTotal) * 100 : 0;

            return (
              <div key={r.tradeId} className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 w-28 truncate text-right">
                  {r.shortName || r.name || r.tradeName || `Trade ${i + 1}`}
                </span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${pct * (mPct / 100)}%`,
                      backgroundColor: CATEGORY_COLORS.material,
                    }}
                  />
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${pct * (lPct / 100)}%`,
                      backgroundColor: CATEGORY_COLORS.labor,
                    }}
                  />
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${pct * (ePct / 100)}%`,
                      backgroundColor: CATEGORY_COLORS.equipment,
                    }}
                  />
                </div>
                <span className="text-[11px] text-slate-600 w-24 text-right tabular-nums font-medium">
                  {formatCurrency(r.directTotal, currency, 0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SummaryCharts;
