/**
 * src/components/LineItemRow.tsx
 * Inline-editable table row for a single estimate line item.
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
    return isNaN(n) ? 0 : Math.max(0, n);
  };

  return (
    <tr className="border-b border-slate-100 hover:bg-sky-50/30 transition-colors group">
      {/* # */}
      <td className="px-2 py-1.5 text-center text-[11px] text-slate-400 font-mono">
        {index + 1}
      </td>
      {/* Item Code */}
      <td className="px-1 py-1">
        <input
          type="text"
          value={item.itemCode}
          onChange={(e) => update('itemCode', e.target.value)}
          className="w-full text-xs px-1.5 py-1 border border-transparent rounded hover:border-slate-300 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300 bg-transparent"
          placeholder="Code"
        />
      </td>
      {/* Description & Specification */}
      <td className="px-1 py-1">
        <input
          type="text"
          value={item.description}
          onChange={(e) => update('description', e.target.value)}
          className="w-full text-xs font-medium px-1.5 py-0.5 border border-transparent rounded hover:border-slate-300 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300 bg-transparent text-slate-800"
          placeholder="Description"
        />
        <input
          type="text"
          value={item.specification || ''}
          onChange={(e) => update('specification', e.target.value)}
          className="w-full text-[10px] text-slate-500 px-1.5 py-0.5 border border-transparent rounded hover:border-slate-300 focus:border-sky-400 focus:outline-none bg-transparent placeholder:italic placeholder:text-slate-400"
          placeholder="Specification / Notes..."
        />
      </td>
      {/* Unit */}
      <td className="px-1 py-1">
        <select
          value={item.unit}
          onChange={(e) => update('unit', e.target.value)}
          className="w-full text-xs px-1 py-1 border border-transparent rounded hover:border-slate-300 focus:border-sky-400 focus:outline-none bg-transparent cursor-pointer"
        >
          {CONSTRUCTION_UNITS.map((u) => (
            <option key={u.unit} value={u.unit}>{u.unit}</option>
          ))}
        </select>
      </td>
      {/* Quantity */}
      <td className="px-1 py-1">
        <input
          type="number"
          value={item.quantity || ''}
          onChange={(e) => update('quantity', parseNum(e.target.value))}
          className="w-full text-xs px-1.5 py-1 border border-transparent rounded hover:border-slate-300 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300 bg-transparent text-right tabular-nums"
          placeholder="0"
          min="0"
          step="any"
        />
      </td>
      {/* Material Rate */}
      <td className="px-1 py-1">
        <input
          type="number"
          value={item.materialRate || ''}
          onChange={(e) => update('materialRate', parseNum(e.target.value))}
          className="w-full text-xs px-1.5 py-1 border border-transparent rounded hover:border-slate-300 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300 bg-transparent text-right tabular-nums"
          placeholder="0"
          min="0"
          step="any"
        />
      </td>
      {/* Labor Rate */}
      <td className="px-1 py-1">
        <input
          type="number"
          value={item.laborRate || ''}
          onChange={(e) => update('laborRate', parseNum(e.target.value))}
          className="w-full text-xs px-1.5 py-1 border border-transparent rounded hover:border-slate-300 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300 bg-transparent text-right tabular-nums"
          placeholder="0"
          min="0"
          step="any"
        />
      </td>
      {/* Equipment Rate */}
      <td className="px-1 py-1">
        <input
          type="number"
          value={item.equipmentRate || ''}
          onChange={(e) => update('equipmentRate', parseNum(e.target.value))}
          className="w-full text-xs px-1.5 py-1 border border-transparent rounded hover:border-slate-300 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300 bg-transparent text-right tabular-nums"
          placeholder="0"
          min="0"
          step="any"
        />
      </td>
      {/* Unit Cost (computed) */}
      <td className="px-2 py-1.5 text-xs text-right font-medium text-slate-600 tabular-nums whitespace-nowrap">
        {formatCurrency(costs.directUnitCost, currency)}
      </td>
      {/* Direct Total (computed) */}
      <td className="px-2 py-1.5 text-xs text-right font-bold text-slate-800 tabular-nums whitespace-nowrap">
        {formatCurrency(costs.directTotalCost, currency)}
      </td>
      {/* Actions */}
      <td className="px-1 py-1 text-center">
        <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() =>
              dispatch({ type: 'DUPLICATE_ITEM', payload: { tradeId, scopeId, itemId: item.id } })
            }
            className="p-1 rounded hover:bg-sky-100 text-slate-400 hover:text-sky-600 transition"
            title="Duplicate item"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              dispatch({ type: 'DELETE_ITEM', payload: { tradeId, scopeId, itemId: item.id } })
            }
            className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition"
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
