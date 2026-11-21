/**
 * src/components/Header.tsx
 * Application header with executive live valuation ribbon, expandable project metadata, and global actions.
 */

import React, { useRef, useState, useMemo } from 'react';
import {
  Building2,
  FileSpreadsheet,
  Download,
  Upload,
  Printer,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  MapPin,
  UserCheck,
  Calendar,
  FileText,
} from 'lucide-react';
import { ProjectEstimateState, EstimateAction } from '../types/estimate';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';
import { ProjectStatus } from '../types/metadata';
import { exportToExcel } from '../utils/excelExport';
import { calculateConsolidatedSummary } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

interface HeaderProps {
  state: ProjectEstimateState;
  dispatch: React.Dispatch<EstimateAction>;
  exportJSON: () => void;
  importJSON: (file: File) => void;
}

const STATUS_OPTIONS: ProjectStatus[] = ['Draft', 'Under Review', 'Approved', 'Final Proposal'];

const STATUS_DOT_COLORS: Record<ProjectStatus, string> = {
  Draft: 'bg-slate-400',
  'Under Review': 'bg-amber-400',
  Approved: 'bg-emerald-400',
  'Final Proposal': 'bg-sky-400',
};

export const Header: React.FC<HeaderProps> = ({ state, dispatch, exportJSON, importJSON }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const { metadata, trades, markups } = state;
  const currency = metadata.currency || '₱';

  const summary = useMemo(
    () => calculateConsolidatedSummary(trades, markups, metadata.totalFloorArea),
    [trades, markups, metadata.totalFloorArea]
  );

  const updateMeta = (field: string, value: string | number) => {
    dispatch({ type: 'UPDATE_METADATA', payload: { [field]: value } });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importJSON(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Reset all data to default 2026 Philippine benchmark project? This cannot be undone.')) {
      dispatch({ type: 'RESET_PROJECT' });
    }
  };

  return (
    <header className="bg-slate-950 text-white shadow-lg border-b border-slate-800 no-print">
      {/* Top command & live valuation bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl shadow-md shadow-sky-900/40 ring-1 ring-white/15">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Construction Estimator
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                v2.0 PH Rates
              </span>
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25"
                title="Changes are automatically persisted in browser storage"
              >
                <CheckCircle2 className="w-3 h-3" />
                Auto-Saved
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              10-Trade Bill of Quantities &bull; Automated Parametric Sizing
            </p>
          </div>
        </div>

        {/* Live Executive Valuation Ribbon (always visible across tabs) */}
        <div className="hidden xl:flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-1.5 shadow-inner">
          <div className="text-right pr-3 border-r border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Direct Cost</div>
            <div className="text-xs font-bold text-slate-200 tabular-nums">
              {formatCurrency(summary.directCost, currency, 0)}
            </div>
          </div>
          <div className="text-right pr-3 border-r border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
              Contract Valuation
            </div>
            <div className="text-sm font-black text-white tabular-nums">
              {formatCurrency(summary.grandTotal, currency, 0)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              All-In / {metadata.floorAreaUnit}
            </div>
            <div className="text-xs font-bold text-sky-300 tabular-nums">
              {formatCurrency(summary.costPerFloorArea, currency, 0)}
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'auto_estimator' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shadow-sm ${
              state.activeTab === 'auto_estimator'
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Auto Estimator</span>
          </button>
          <button
            type="button"
            onClick={() => exportToExcel(state)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-sm"
            title="Download formatted multi-sheet Excel BOQ workbook"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition shadow-sm"
            title="Download full estimate backup (.json)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save JSON</span>
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition shadow-sm"
            title="Load saved estimate (.json)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Load</span>
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} aria-label="Import project JSON file" />
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition shadow-sm"
            title="Print proposal or save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset project to default benchmark"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-900 hover:bg-red-600 text-slate-400 hover:text-white border border-slate-800 hover:border-red-500 rounded-lg transition shadow-sm"
            title="Reset to default sample project"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Project Metadata Bar */}
      <div className="bg-slate-900/85 border-t border-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <label className="flex items-center gap-1.5">
            <span className="text-slate-400 whitespace-nowrap font-medium">Project:</span>
            <input
              type="text"
              value={metadata.projectName}
              onChange={(e) => updateMeta('projectName', e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-md px-2.5 py-1 text-white w-48 sm:w-56 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Client:</span>
            <input
              type="text"
              value={metadata.clientName}
              onChange={(e) => updateMeta('clientName', e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-md px-2.5 py-1 text-white w-36 sm:w-44 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
          </label>
          <div className="flex items-center gap-1.5">
            <label htmlFor="header-floor-area" className="text-slate-400 font-medium">Area:</label>
            <input
              id="header-floor-area"
              type="number"
              min="1"
              value={metadata.totalFloorArea}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                updateMeta('totalFloorArea', !Number.isFinite(n) ? 0 : Math.max(0, n));
              }}
              className="bg-slate-800/80 border border-slate-700 rounded-md px-2 py-1 text-white w-20 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <select
              aria-label="Floor area unit"
              value={metadata.floorAreaUnit}
              onChange={(e) => updateMeta('floorAreaUnit', e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-md px-1.5 py-1 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="m²">m²</option>
              <option value="sq.ft">sq.ft</option>
            </select>
          </div>
          <label className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Currency:</span>
            <select
              value={metadata.currency}
              onChange={(e) => updateMeta('currency', e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-md px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.symbol}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Status:</span>
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[metadata.status] || 'bg-slate-400'}`} />
            <select
              value={metadata.status}
              onChange={(e) => updateMeta('status', e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-md px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          {/* Toggle Extra Project Proposal Fields */}
          <button
            type="button"
            aria-expanded={showMoreDetails}
            onClick={() => setShowMoreDetails((prev) => !prev)}
            className="ml-auto flex items-center gap-1 text-[11px] font-medium text-sky-300 hover:text-sky-200 px-2.5 py-1 rounded-md bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 transition"
          >
            <span>{showMoreDetails ? 'Hide Details' : 'Project Details & Notes'}</span>
            {showMoreDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Secondary Metadata Row */}
        {showMoreDetails && (
          <div className="border-t border-slate-800/80 bg-slate-900/95 animate-fadeIn">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-400 whitespace-nowrap">Location:</span>
                <input
                  type="text"
                  value={metadata.location || ''}
                  onChange={(e) => updateMeta('location', e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-white w-full focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Project site address..."
                />
              </label>
              <label className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-400 whitespace-nowrap">Estimator:</span>
                <input
                  type="text"
                  value={metadata.estimator || ''}
                  onChange={(e) => updateMeta('estimator', e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-white w-full focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Engr. / QS Name..."
                />
              </label>
              <label className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-400 whitespace-nowrap">Date:</span>
                <input
                  type="date"
                  value={metadata.date || ''}
                  onChange={(e) => updateMeta('date', e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-white w-full focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </label>
              <label className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-400 whitespace-nowrap">Notes:</span>
                <input
                  type="text"
                  value={metadata.notes || ''}
                  onChange={(e) => updateMeta('notes', e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-white w-full focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Scope assumptions / notes..."
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
