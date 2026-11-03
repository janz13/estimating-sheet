/**
 * src/components/Header.tsx
 * Application header with project metadata fields and global actions.
 */

import React, { useRef } from 'react';
import {
  Building2,
  FileSpreadsheet,
  Download,
  Upload,
  Printer,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ProjectEstimateState, EstimateAction } from '../types/estimate';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';
import { ProjectStatus } from '../types/metadata';
import { exportToExcel } from '../utils/excelExport';

interface HeaderProps {
  state: ProjectEstimateState;
  dispatch: React.Dispatch<EstimateAction>;
  exportJSON: () => void;
  importJSON: (file: File) => void;
}

const STATUS_OPTIONS: ProjectStatus[] = ['Draft', 'Under Review', 'Approved', 'Final Proposal'];

export const Header: React.FC<HeaderProps> = ({ state, dispatch, exportJSON, importJSON }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { metadata } = state;

  const updateMeta = (field: string, value: string | number) => {
    dispatch({ type: 'UPDATE_METADATA', payload: { [field]: value } });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importJSON(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Reset all data to default sample project? This cannot be undone.')) {
      dispatch({ type: 'RESET_PROJECT' });
    }
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg border-b border-slate-700 no-print">
      {/* Top bar */}
      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-600 rounded-lg shadow">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
              Construction Estimator
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                v1.0
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'auto_estimator' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition shadow-sm ${
              state.activeTab === 'auto_estimator'
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Auto Estimator</span>
          </button>
          <button
            onClick={() => exportToExcel(state)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Save JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            Load
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-red-700 text-slate-400 hover:text-white rounded-md transition shadow-sm"
            title="Reset to default sample project"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Project metadata bar */}
      <div className="bg-slate-800/70 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs border-t border-slate-700/50">
        <label className="flex items-center gap-1.5">
          <span className="text-slate-400 whitespace-nowrap">Project:</span>
          <input
            type="text"
            value={metadata.projectName}
            onChange={(e) => updateMeta('projectName', e.target.value)}
            className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white w-48 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-slate-400">Client:</span>
          <input
            type="text"
            value={metadata.clientName}
            onChange={(e) => updateMeta('clientName', e.target.value)}
            className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white w-40 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-slate-400">Area:</span>
          <input
            type="number"
            value={metadata.totalFloorArea}
            onChange={(e) => updateMeta('totalFloorArea', parseFloat(e.target.value) || 0)}
            className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white w-20 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <select
            value={metadata.floorAreaUnit}
            onChange={(e) => updateMeta('floorAreaUnit', e.target.value)}
            className="bg-slate-700/50 border border-slate-600 rounded px-1 py-1 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="m²">m²</option>
            <option value="sq.ft">sq.ft</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-slate-400">Currency:</span>
          <select
            value={metadata.currency}
            onChange={(e) => updateMeta('currency', e.target.value)}
            className="bg-slate-700/50 border border-slate-600 rounded px-1 py-1 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.symbol}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-slate-400">Status:</span>
          <select
            value={metadata.status}
            onChange={(e) => updateMeta('status', e.target.value)}
            className="bg-slate-700/50 border border-slate-600 rounded px-1 py-1 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
};

export default Header;
