/**
 * src/components/AutoEstimatorView.tsx
 * Automated Parametric Estimating View based on Philippine Residential Construction Standards.
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Building,
  DoorOpen,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { AutoEstimateParams, ConstructionTier, WallConstructionType } from '../types/autoEstimate';
import { ProjectEstimateState, EstimateAction } from '../types/estimate';
import {
  PHILIPPINE_CONSTRUCTION_TIERS,
} from '../constants/philippineRates';
import {
  DEFAULT_AUTO_PARAMS,
  calculateParametricEstimate,
  applyParametricToProject,
} from '../utils/autoEstimateEngine';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface AutoEstimatorViewProps {
  state: ProjectEstimateState;
  dispatch: React.Dispatch<EstimateAction>;
}

export const AutoEstimatorView: React.FC<AutoEstimatorViewProps> = ({ state, dispatch }) => {
  const [params, setParams] = useState<AutoEstimateParams>(() => ({
    ...DEFAULT_AUTO_PARAMS,
    groundFloorArea: Math.max(50, Math.round(state.metadata.totalFloorArea * 0.6)),
    secondFloorArea: Math.max(40, Math.round(state.metadata.totalFloorArea * 0.4)),
  }));

  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Live calculation
  const estimate = useMemo(
    () => calculateParametricEstimate(params, state.markups),
    [params, state.markups]
  );

  const updateParam = <K extends keyof AutoEstimateParams>(key: K, value: AutoEstimateParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setAppliedSuccess(false);
  };

  const handleApplyToBOQ = () => {
    const updatedState = applyParametricToProject(state, params);
    dispatch({ type: 'LOAD_PROJECT', payload: updatedState });
    setAppliedSuccess(true);
  };

  return (
    <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200">
      {/* Header Banner */}
      <div className="px-6 py-4 bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white rounded-t-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-400/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Automated Estimator Mode
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Philippine Cost Benchmarks
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Instant structure valuation and 10-trade scope breakdown based on storeys, floor area, room counts, and construction finish.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setParams(DEFAULT_AUTO_PARAMS)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Form
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'summary' })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition shadow"
            >
              Back to Detailed BOQ
            </button>
          </div>
        </div>
      </div>

      {appliedSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Parametric estimate successfully applied! All 10 trade sheets have been scaled to match this structure profile.</span>
        </div>
      )}

      {/* Main Grid: Form Left, Preview Right */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Storeys & Dimensions */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-sky-600" />
                1. Storeys & Structure Dimensions
              </h3>
              <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                Total: {estimate.totalFloorArea} m²
              </span>
            </div>

            {/* Storey Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateParam('storeys', num)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition ${
                    params.storeys === num
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-sky-300'
                  }`}
                >
                  {num} Storey{num > 1 ? 's' : ''}
                </button>
              ))}
            </div>

            {/* Storey Height & Floor Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">
                  Floor-to-Floor Height
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="2.4"
                    max="4.5"
                    value={params.storeyHeight}
                    onChange={(e) => updateParam('storeyHeight', parseFloat(e.target.value) || 3.0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <span className="text-slate-500 font-semibold">m</span>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">
                  Ground Floor Area
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="10"
                    value={params.groundFloorArea}
                    onChange={(e) => updateParam('groundFloorArea', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <span className="text-slate-500 font-semibold">m²</span>
                </div>
              </div>

              {params.storeys >= 2 && (
                <div>
                  <label className="text-slate-600 font-medium block mb-1">
                    2nd Floor Area
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={params.secondFloorArea}
                      onChange={(e) => updateParam('secondFloorArea', Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <span className="text-slate-500 font-semibold">m²</span>
                  </div>
                </div>
              )}

              {params.storeys >= 3 && (
                <div>
                  <label className="text-slate-600 font-medium block mb-1">
                    3rd Floor Area
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={params.thirdFloorArea}
                      onChange={(e) => updateParam('thirdFloorArea', Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <span className="text-slate-500 font-semibold">m²</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Construction Quality Tier */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-sky-600" />
              2. Construction Finish & Standard Cost Tier (Philippines)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(PHILIPPINE_CONSTRUCTION_TIERS) as ConstructionTier[]).map((tKey) => {
                const config = PHILIPPINE_CONSTRUCTION_TIERS[tKey];
                const isSelected = params.tier === tKey;
                return (
                  <div
                    key={tKey}
                    onClick={() => {
                      updateParam('tier', tKey);
                      updateParam('customRatePerSqM', undefined);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 shadow-sm ring-1 ring-sky-500'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{config.label}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-sky-600"></span>}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{config.subLabel}</div>
                      <div className="text-sm font-black text-sky-700 mt-2">
                        ₱{config.defaultRatePHP.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">/ m²</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                        {config.specification}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Rate Override */}
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">
                Custom Benchmark Rate Override (Optional):
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold">₱</span>
                <input
                  type="number"
                  placeholder={PHILIPPINE_CONSTRUCTION_TIERS[params.tier].defaultRatePHP.toString()}
                  value={params.customRatePerSqM || ''}
                  onChange={(e) => updateParam('customRatePerSqM', parseFloat(e.target.value) || undefined)}
                  className="w-28 px-2 py-1 border border-slate-300 rounded text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-slate-500">/ m²</span>
              </div>
            </div>
          </div>

          {/* Section 3: Room Counts & Openings */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <DoorOpen className="w-4 h-4 text-sky-600" />
              3. Rooms, Openings & Wall System
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">Bedrooms (F1)</label>
                <input
                  type="number"
                  min="0"
                  value={params.bedroomsFloor1}
                  onChange={(e) => updateParam('bedroomsFloor1', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Bedrooms (F2)</label>
                <input
                  type="number"
                  min="0"
                  disabled={params.storeys < 2}
                  value={params.bedroomsFloor2}
                  onChange={(e) => updateParam('bedroomsFloor2', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Bathrooms (F1)</label>
                <input
                  type="number"
                  min="1"
                  value={params.bathroomsFloor1}
                  onChange={(e) => updateParam('bathroomsFloor1', Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Bathrooms (F2)</label>
                <input
                  type="number"
                  min="0"
                  disabled={params.storeys < 2}
                  value={params.bathroomsFloor2}
                  onChange={(e) => updateParam('bathroomsFloor2', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Total Doors</label>
                <input
                  type="number"
                  min="1"
                  value={params.doorsCount}
                  onChange={(e) => updateParam('doorsCount', Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Total Windows</label>
                <input
                  type="number"
                  min="1"
                  value={params.windowsCount}
                  onChange={(e) => updateParam('windowsCount', Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="col-span-2">
                <label className="text-slate-600 block mb-1">Wall Construction Type</label>
                <select
                  value={params.wallType}
                  onChange={(e) => updateParam('wallType', e.target.value as WallConstructionType)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                >
                  <option value="all_chb">All CHB (150mm exterior, 100mm interior)</option>
                  <option value="part_chb_part_drywall">Part CHB / Part Plywood or Drywall Partitions</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Results & Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Valuation Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-indigo-900/40 relative overflow-hidden">
            <div className="text-xs uppercase tracking-widest text-sky-400 font-semibold mb-1">
              Estimated Structure Valuation
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
              {formatCurrency(estimate.totalDirectCost, '₱', 0)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Effective:</span>
              <span className="font-semibold text-sky-300 tabular-nums">
                ₱{estimate.effectiveRatePerSqM.toLocaleString()} / m²
              </span>
              <span>•</span>
              <span>{estimate.totalFloorArea} m² GFA</span>
            </div>

            {/* Range Band */}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Conservative Range (Low)</span>
                <span className="font-bold text-slate-200 tabular-nums">
                  {formatCurrency(estimate.lowRangeTotal, '₱', 0)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block uppercase">Conservative Range (High)</span>
                <span className="font-bold text-slate-200 tabular-nums">
                  {formatCurrency(estimate.highRangeTotal, '₱', 0)}
                </span>
              </div>
            </div>

            {/* Action Button: Apply to BOQ */}
            <button
              onClick={handleApplyToBOQ}
              className="mt-5 w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-sky-900/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply & Auto-Populate Project BOQ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Trade Allocation Breakdown */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                Scope of Works Allocation
              </h4>
              <span className="text-[10px] text-slate-500">10 Trades</span>
            </div>

            <div className="space-y-2 text-xs max-h-[360px] overflow-y-auto pr-1">
              {estimate.tradeBreakdowns.map((b) => (
                <div
                  key={b.tradeId}
                  className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between gap-2 hover:border-sky-300 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-400">{b.tradeCode}</span>
                      <span className="font-semibold text-slate-800 truncate">{b.tradeName}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-slate-900 tabular-nums">
                      {formatCurrency(b.directCost, '₱', 0)}
                    </div>
                    <div className="text-[10px] font-semibold text-sky-600 tabular-nums">
                      {formatPercent(b.percentageShare)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parametric Modifiers Summary */}
          {estimate.summaryNotes.length > 0 && (
            <div className="bg-sky-50/70 rounded-xl border border-sky-200/70 p-3.5 text-xs text-sky-900">
              <div className="flex items-center gap-1.5 font-bold mb-1.5 text-sky-950">
                <Info className="w-3.5 h-3.5 text-sky-600" />
                Parametric Calibration Notes
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-sky-800">
                {estimate.summaryNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoEstimatorView;
