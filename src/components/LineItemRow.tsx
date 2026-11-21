/**
 * src/components/LineItemRow.tsx
 * User-friendly inline-editable BOQ table row for a single estimate line item.
 */

import React from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { EstimateItem, EstimateAction } from '../types/estimate';
import { calculateItemCosts } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { CONSTRUCTION_UNITS } from '../constants/units';

interface LineItemRowProps {
  item: EstimateItem;
  index: number;
  tradeId: string;
  scopeId: string;
  currency: string;
  dispatch: React.Dispatch<EstimateAction>;
}

const UNIT_DESCRIPTION_MAP: Record<string, string> = CONSTRUCTION_UNITS.reduce(
  (acc, u) => ({ ...acc, [u.unit]: `${u.label} — ${u.description}` }),
  {}
);

export const LineItemRow: React.FC<LineItemRowProps> = ({
  item,
  index,
  tradeId,
  scopeId,
  currency,
  dispatch,
}) => {
  const costs = calculateItemCosts(item.quantity, item.materialRate, item.laborRate, item.equipmentRate);

  const update = (field: keyof EstimateItem, value: string | number) => {
    dispatch({
      type: 'UPDATE_ITEM',
      payload: { tradeId, scopeId, itemId: item.id, field, value },
    });
  };

  const parseNum = (v: string) => {
    const n = parseFloat(v);
    return !Number.isFinite(n) ? 0 : Math.max(0, n);
  };

  const inputBaseClass =
    'w-full text-xs px-2 py-1 border border-slate-200/80 rounded-md bg-white/80 hover:border-sky-400 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition';

  return (
    <tr className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors group">
      {/* # */}
      <td className="px-2 py-2 text-center text-[11px] text-slate-400 font-mono">
        {index + 1}
      </td>
      {/* Item Code */}
      <td className="px-1.5 py-1.5">
        <input
          type="text"
          aria-label={`Item code for row ${index + 1}`}
          value={item.itemCode}
          onChange={(e) => update('itemCode', e.target.value)}
          className={`${inputBaseClass} font-mono font-semibold text-slate-700`}
          placeholder="Code"
        />
      </td>
      {/* Description & Specification */}
      <td className="px-1.5 py-1.5 space-y-1">
        <input
          type="text"
          aria-label={`Description for ${item.itemCode || `row ${index + 1}`}`}
          value={item.description}
          onChange={(e) => update('description', e.target.value)}
          className={`${inputBaseClass} font-semibold text-slate-800`}
          placeholder="Item description..."
        />
        <input
          type="text"
          aria-label={`Specification for ${item.itemCode || `row ${index + 1}`}`}
          value={item.specification || ''}
          onChange={(e) => update('specification', e.target.value)}
          className="w-full text-[11px] text-slate-500 px-2 py-0.5 border border-transparent rounded hover:border-slate-200 focus:border-sky-400 focus:bg-white focus:outline-none bg-transparent placeholder:italic placeholder:text-slate-400 transition"
          placeholder="Specification / Brand / Notes..."
        />
      </td>
      {/* Unit */}
      <td className="px-1.5 py-1.5">
        <select
          aria-label={`Unit for ${item.itemCode || `row ${index + 1}`}`}
          value={item.unit}
          onChange={(e) => update('unit', e.target.value)}
          title={UNIT_DESCRIPTION_MAP[item.unit] || item.unit}
          className={`${inputBaseClass} cursor-pointer font-medium text-slate-700`}
        >
          {CONSTRUCTION_UNITS.map((u) => (
            <option key={u.unit} value={u.unit} title={u.description}>
              {u.unit}
            </option>
          ))}
        </select>
      </td>
      {/* Quantity */}
      <td className="px-1.5 py-1.5">
        <input
          type="number"
          aria-label={`Quantity for ${item.itemCode || `row ${index + 1}`}`}
          value={item.quantity || ''}
          onChange={(e) => update('quantity', parseNum(e.target.value))}
          className={`${inputBaseClass} no-spinner text-right tabular-nums font-semibold text-slate-900`}
          placeholder="0"
          min="0"
          step="any"
        />
      </td>
      {/* Material Rate */}
      <td className="px-1.5 py-1.5">
        <input
          type="number"
          aria-label={`Material rate for ${item.itemCode || `row ${index + 1}`}`}
          value={item.materialRate || ''}
          onChange={(e) => update('materialRate', parseNum(e.target.value))}
          className={`${inputBaseClass} no-spinner text-right tabular-nums text-blue-700`}
          placeholder="0"
          min="0"
          step="any"
        />
      </td>
      {/* Labor Rate */}
      <td className="px-1.5 py-1.5">
        <input
          type="number"
          aria-label={`Labor rate for ${item.itemCode || `row ${index + 1}`}`}
          value={item.laborRate || ''}
          onChange={(e) => update('laborRate', parseNum(e.target.value))}
          className={`${inputBaseClass} no-spinner text-right tabular-nums text-amber-700`}
          placeholder="0"
          min="0"
          step="any"
        />
      </td>
      {/* Equipment Rate */}
      <td className="px-1.5 py-1.5">
        <input
          type="number"
          aria-label={`Equipment rate for ${item.itemCode || `row ${index + 1}`}`}
          value={item.equipmentRate || ''}
          onChange={(e) => update('equipmentRate', parseNum(e.target.value))}
          className={`${inputBaseClass} no-spinner text-right tabular-nums text-purple-700`}
          placeholder="0"
          min="0"
          step="any"
        />
      </td>
      {/* Unit Cost (computed) */}
      <td
        className="px-2 py-2 text-xs text-right font-semibold text-slate-700 tabular-nums whitespace-nowrap bg-slate-50/50"
        title={`Mat (${item.materialRate}) + Lab (${item.laborRate}) + Eqp (${item.equipmentRate})`}
      >
        {formatCurrency(costs.directUnitCost, currency)}
      </td>
      {/* Direct Total (computed) */}
      <td className="px-2 py-2 text-xs text-right font-bold text-slate-900 tabular-nums whitespace-nowrap bg-slate-50/80">
        {formatCurrency(costs.directTotalCost, currency)}
      </td>
      {/* Actions */}
      <td className="px-1.5 py-1.5 text-center">
        <div className="flex items-center justify-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            aria-label={`Duplicate ${item.itemCode || `row ${index + 1}`}`}
            onClick={() =>
              dispatch({ type: 'DUPLICATE_ITEM', payload: { tradeId, scopeId, itemId: item.id } })
            }
            className="p-1.5 rounded-md hover:bg-sky-100 text-slate-500 hover:text-sky-700 transition"
            title="Duplicate item"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${item.itemCode || `row ${index + 1}`}`}
            onClick={() =>
              dispatch({ type: 'DELETE_ITEM', payload: { tradeId, scopeId, itemId: item.id } })
            }
            className="p-1.5 rounded-md hover:bg-red-100 text-slate-500 hover:text-red-600 transition"
            title="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default LineItemRow;
