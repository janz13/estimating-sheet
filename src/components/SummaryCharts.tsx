/**
 * src/components/SummaryCharts.tsx
 * Interactive React/SVG charts for trade cost breakdown and cost type allocation.
 */

import React, { useState } from 'react';
import { TradeRollup } from '../types/summary';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { TECHNICAL_TRADES } from '../constants/trades';

const TRADE_COLORS = TECHNICAL_TRADES.map((t) => t.accentColor);
const CATEGORY_COLORS = {
  material: '#3B82F6', // blue-500
  labor: '#F59E0B',    // amber-500
  equipment: '#8B5CF6', // violet-500
};

interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  currency: string;
  size?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  centerLabel,
  centerValue,
  currency,
  size = 190,
}) => {
  const [hovered, setHovered] = useState<DonutSlice | null>(null);
  const safeData = data.filter((d) => Number.isFinite(d.value) && d.value > 0);
  const total = safeData.reduce((s, d) => s + d.value, 0);

  if (!Number.isFinite(total) || total <= 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xs text-slate-400">No cost data</span>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.4;
  const innerRadius = size * 0.27;
  let cumAngle = -Math.PI / 2;

  const paths = safeData.map((d) => {
    const angle = (d.value / total) * Math.PI * 2;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const safeEnd = angle >= Math.PI * 2 - 0.0001 ? startAngle + Math.PI * 1.9999 : endAngle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(safeEnd);
    const y2 = cy + radius * Math.sin(safeEnd);
    const ix1 = cx + innerRadius * Math.cos(startAngle);
    const iy1 = cy + innerRadius * Math.sin(startAngle);
    const ix2 = cx + innerRadius * Math.cos(safeEnd);
    const iy2 = cy + innerRadius * Math.sin(safeEnd);
    const largeArc = safeEnd - startAngle > Math.PI ? 1 : 0;

    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
    const isHovered = hovered?.id === d.id;

    return (
      <path
        key={d.id}
        d={path}
        fill={d.color}
        onMouseEnter={() => setHovered(d)}
        onMouseLeave={() => setHovered(null)}
        className="cursor-pointer transition-all duration-150"
        style={{
          opacity: hovered && !isHovered ? 0.45 : 1,
          transform: isHovered ? 'scale(1.03)' : 'scale(1)',
          transformOrigin: `${cx}px ${cy}px`,
        }}
      >
        <title>{`${d.label}: ${formatCurrency(d.value, currency, 0)} (${formatPercent((d.value / total) * 100)})`}</title>
      </path>
    );
  });

  const displayLabel = hovered ? hovered.label : centerLabel;
  const displayValue = hovered ? formatCurrency(hovered.value, currency, 0) : centerValue;
  const displayPct = hovered ? formatPercent((hovered.value / total) * 100) : null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {paths}
      <text x={cx} y={cy - (displayPct ? 10 : 5)} textAnchor="middle" className="fill-slate-500 text-[10px] font-medium">
        {displayLabel.length > 16 ? `${displayLabel.slice(0, 15)}…` : displayLabel}
      </text>
      <text x={cx} y={cy + (displayPct ? 5 : 11)} textAnchor="middle" className="fill-slate-900 text-xs font-bold tabular-nums">
        {displayValue}
      </text>
      {displayPct && (
        <text x={cx} y={cy + 19} textAnchor="middle" className="fill-sky-600 text-[10px] font-bold">
          {displayPct}
        </text>
      )}
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
  const tradeData: DonutSlice[] = tradeRollups.map((r, i) => ({
    id: r.tradeId || `trade_${i}`,
    label: r.shortName || r.name || r.tradeName || `Trade ${i + 1}`,
    value: r.directTotal,
    color: TRADE_COLORS[i % TRADE_COLORS.length],
  }));

  const categoryData: DonutSlice[] = [
    { id: 'cat_material', label: 'Material', value: materialTotal, color: CATEGORY_COLORS.material },
    { id: 'cat_labor', label: 'Labor', value: laborTotal, color: CATEGORY_COLORS.labor },
    { id: 'cat_equipment', label: 'Equipment', value: equipmentTotal, color: CATEGORY_COLORS.equipment },
  ];

  const maxTradeVal = Math.max(...tradeRollups.map((r) => r.directTotal), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trade Cost Breakdown - Interactive Donut */}
      <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Trade Cost Distribution
          </h3>
          <span className="text-[10px] text-slate-400">Hover slice to inspect</span>
        </div>
        <div className="flex items-center justify-center gap-5 flex-wrap">
          <DonutChart
            data={tradeData}
            centerLabel="Direct Cost"
            centerValue={formatCurrency(directCost, currency, 0)}
            currency={currency}
            size={185}
          />
          <div className="flex flex-col gap-1.5 text-[11px] flex-1 min-w-[190px]">
            {tradeData.filter((d) => d.value > 0).map((d) => (
              <div key={d.id} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-slate-700 font-medium truncate max-w-[130px]">{d.label}</span>
                <span className="text-slate-500 ml-auto tabular-nums">
                  {formatCurrency(d.value, currency, 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Type Allocation - Interactive Donut */}
      <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Cost Type Allocation
          </h3>
          <span className="text-[10px] text-slate-400">Mat / Lab / Equip</span>
        </div>
        <div className="flex items-center justify-center gap-5 flex-wrap">
          <DonutChart
            data={categoryData}
            centerLabel="Direct Cost"
            centerValue={formatCurrency(directCost, currency, 0)}
            currency={currency}
            size={185}
          />
          <div className="flex flex-col gap-2.5 text-xs flex-1 min-w-[190px]">
            {categoryData.map((d) => (
              <div key={d.id} className="bg-white px-3 py-2 rounded-lg border border-slate-200/80 flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="font-semibold text-slate-700">{d.label}</span>
                <span className="text-slate-800 font-bold ml-auto tabular-nums">
                  {formatCurrency(d.value, currency, 0)}
                </span>
                <span className="text-slate-400 tabular-nums text-[11px] w-12 text-right">
                  ({directCost > 0 ? formatPercent((d.value / directCost) * 100) : '0%'})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal Stacked Comparison Chart */}
      <div className="lg:col-span-2 bg-slate-50/50 rounded-xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Trade Comparison (Stacked Resource Breakdown)
          </h3>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Material
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Labor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-500" /> Equipment
            </span>
          </div>
        </div>
        <div className="space-y-2.5">
          {tradeRollups.map((r, i) => {
            const pct = maxTradeVal > 0 ? (r.directTotal / maxTradeVal) * 100 : 0;
            const mPct = r.directTotal > 0 ? (r.materialTotal / r.directTotal) * 100 : 0;
            const lPct = r.directTotal > 0 ? (r.laborTotal / r.directTotal) * 100 : 0;
            const ePct = r.directTotal > 0 ? (r.equipmentTotal / r.directTotal) * 100 : 0;

            return (
              <div key={r.tradeId} className="flex items-center gap-2 sm:gap-3">
                <span className="text-[11px] font-medium text-slate-600 w-20 sm:w-32 truncate text-right">
                  {r.shortName || r.name || r.tradeName || `Trade ${i + 1}`}
                </span>
                <div className="flex-1 h-5 bg-slate-200/70 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${pct * (mPct / 100)}%`,
                      backgroundColor: CATEGORY_COLORS.material,
                    }}
                    title={`Material: ${formatCurrency(r.materialTotal, currency, 0)}`}
                  />
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${pct * (lPct / 100)}%`,
                      backgroundColor: CATEGORY_COLORS.labor,
                    }}
                    title={`Labor: ${formatCurrency(r.laborTotal, currency, 0)}`}
                  />
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${pct * (ePct / 100)}%`,
                      backgroundColor: CATEGORY_COLORS.equipment,
                    }}
                    title={`Equipment: ${formatCurrency(r.equipmentTotal, currency, 0)}`}
                  />
                </div>
                <span className="text-[11px] text-slate-700 w-20 sm:w-28 text-right tabular-nums font-bold">
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
