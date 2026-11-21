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
  Home,
  Package,
  Minus,
  Plus,
} from 'lucide-react';
import { AutoEstimateParams, ConstructionTier, WallConstructionType } from '../types/autoEstimate';
import { ProjectEstimateState, EstimateAction } from '../types/estimate';
import { PHILIPPINE_CONSTRUCTION_TIERS } from '../constants/philippineRates';
import { TECHNICAL_TRADES } from '../constants/trades';
import {
  DEFAULT_AUTO_PARAMS,
  calculateBaselineBedrooms,
  calculateParametricEstimate,
  applyParametricToProject,
} from '../utils/autoEstimateEngine';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface AutoEstimatorViewProps {
  state: ProjectEstimateState;
  dispatch: React.Dispatch<EstimateAction>;
}

interface HouseTemplate {
  id: string;
  name: string;
  subtitle: string;
  params: AutoEstimateParams;
}

const HOUSE_TEMPLATES: HouseTemplate[] = [
  {
    id: 'bungalow_60',
    name: 'Bungalow (60 m²)',
    subtitle: '1 Storey • Economic',
    params: {
      storeys: 1,
      storeyHeight: 2.8,
      groundFloorArea: 60,
      secondFloorArea: 0,
      thirdFloorArea: 0,
      tier: 'low',
      bedroomsFloor1: 2,
      bedroomsFloor2: 0,
      bathroomsFloor1: 1,
      bathroomsFloor2: 0,
      doorsFloor1: 4,
      doorsFloor2: 0,
      doorsCount: 4,
      windowsFloor1: 5,
      windowsFloor2: 0,
      windowsCount: 5,
      wallType: 'all_chb',
    },
  },
  {
    id: 'townhouse_120',
    name: 'Townhouse (120 m²)',
    subtitle: '2 Storeys • Standard',
    params: {
      storeys: 2,
      storeyHeight: 3.0,
      groundFloorArea: 65,
      secondFloorArea: 55,
      thirdFloorArea: 0,
      tier: 'mid',
      bedroomsFloor1: 1,
      bedroomsFloor2: 2,
      bathroomsFloor1: 1,
      bathroomsFloor2: 2,
      doorsFloor1: 4,
      doorsFloor2: 4,
      doorsCount: 8,
      windowsFloor1: 5,
      windowsFloor2: 5,
      windowsCount: 10,
      wallType: 'all_chb',
    },
  },
  {
    id: 'family_180',
    name: 'Family Home (180 m²)',
    subtitle: '2 Storeys • Standard',
    params: { ...DEFAULT_AUTO_PARAMS },
  },
  {
    id: 'luxury_300',
    name: 'Luxury Villa (300 m²)',
    subtitle: '3 Storeys • High-End',
    params: {
      storeys: 3,
      storeyHeight: 3.4,
      groundFloorArea: 120,
      secondFloorArea: 100,
      thirdFloorArea: 80,
      tier: 'high',
      bedroomsFloor1: 1,
      bedroomsFloor2: 4,
      bathroomsFloor1: 2,
      bathroomsFloor2: 3,
      doorsFloor1: 6,
      doorsFloor2: 8,
      doorsCount: 14,
      windowsFloor1: 8,
      windowsFloor2: 10,
      windowsCount: 18,
      wallType: 'all_chb',
    },
  },
];

const TRADE_COLOR_MAP: Record<string, string> = TECHNICAL_TRADES.reduce(
  (acc, t) => ({ ...acc, [t.id]: t.accentColor }),
  {}
);

export const AutoEstimatorView: React.FC<AutoEstimatorViewProps> = ({ state, dispatch }) => {
  const safeGfa =
    typeof state.metadata.totalFloorArea === 'number' &&
    Number.isFinite(state.metadata.totalFloorArea) &&
    state.metadata.totalFloorArea > 0
      ? state.metadata.totalFloorArea
      : 180;

  const [params, setParams] = useState<AutoEstimateParams>(() => ({
    ...DEFAULT_AUTO_PARAMS,
    groundFloorArea: Math.max(50, Math.round(safeGfa * 0.6)),
    secondFloorArea: Math.max(40, Math.round(safeGfa * 0.4)),
  }));

  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Live calculation using preserved engine mechanics
  const estimate = useMemo(
    () => calculateParametricEstimate(params, state.markups),
    [params, state.markups]
  );

  const baselineBedrooms = calculateBaselineBedrooms(estimate.totalFloorArea);
  const baselineDoors = Math.max(3, Math.round(estimate.totalFloorArea / 18));
  const baselineWindows = Math.max(4, Math.round(estimate.totalFloorArea / 14));

  // Rule-of-thumb Philippine material take-off preview based on GFA and wall type
  const materialPreview = useMemo(() => {
    const gfa = estimate.totalFloorArea;
    const chbFactor = params.wallType === 'all_chb' ? 24 : 15;
    const rebarFactor = params.storeys === 1 ? 26 : params.storeys === 2 ? 36 : 44;
    return {
      cementBags: Math.round(gfa * (params.wallType === 'all_chb' ? 7.2 : 6.0)),
      chbPieces: Math.round(gfa * chbFactor),
      rebarKg: Math.round(gfa * rebarFactor),
      tileAreaSqm: Math.round(gfa * 0.92),
    };
  }, [estimate.totalFloorArea, params.wallType, params.storeys]);

  const updateParam = <K extends keyof AutoEstimateParams>(key: K, value: AutoEstimateParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setAppliedSuccess(false);
  };

  const handleDoorChange = (floor: 1 | 2, val: number) => {
    const v = Math.max(0, val);
    setParams((prev) => {
      const f1 = floor === 1 ? v : (prev.doorsFloor1 || 0);
      const f2 = floor === 2 ? v : (prev.storeys >= 2 ? (prev.doorsFloor2 || 0) : 0);
      return {
        ...prev,
        doorsFloor1: f1,
        doorsFloor2: f2,
        doorsCount: f1 + f2,
      };
    });
    setAppliedSuccess(false);
  };

  const handleWindowChange = (floor: 1 | 2, val: number) => {
    const v = Math.max(0, val);
    setParams((prev) => {
      const f1 = floor === 1 ? v : (prev.windowsFloor1 || 0);
      const f2 = floor === 2 ? v : (prev.storeys >= 2 ? (prev.windowsFloor2 || 0) : 0);
      return {
        ...prev,
        windowsFloor1: f1,
        windowsFloor2: f2,
        windowsCount: f1 + f2,
      };
    });
    setAppliedSuccess(false);
  };

  const handleApplyToBOQ = () => {
    const updatedState = applyParametricToProject(state, params);
    dispatch({ type: 'LOAD_PROJECT', payload: updatedState });
    setAppliedSuccess(true);
  };

  const renderStepperInput = (
    label: string,
    value: number,
    min: number,
    disabled: boolean,
    onChange: (val: number) => void
  ) => {
    const inputId = `auto-step-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return (
      <div className={`bg-white p-2.5 rounded-lg border ${disabled ? 'border-slate-200 bg-slate-50/70' : 'border-slate-200'}`}>
        <label htmlFor={inputId} className="text-[11px] font-semibold text-slate-600 block mb-1.5">{label}</label>
        <div className="flex items-center">
          <input
            id={inputId}
            type="number"
            min={min}
            disabled={disabled}
            value={value}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              onChange(!Number.isFinite(parsed) ? min : Math.max(min, parsed));
            }}
            className="no-spinner w-full px-2 py-1 border border-slate-300 rounded-l-md text-slate-900 font-bold text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
          />
          <button
            type="button"
            disabled={disabled || value <= min}
            onClick={() => onChange(Math.max(min, value - 1))}
            aria-label={`Decrease ${label}`}
            className="px-2 py-1.5 border-y border-r border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-40 transition"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(value + 1)}
            aria-label={`Increase ${label}`}
            className="px-2 py-1.5 border-y border-r border-slate-300 rounded-r-md bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-40 transition"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200 overflow-hidden">
      {/* Header Banner */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-sky-950 text-white border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
                Automated Estimator Mode
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Philippine Cost Benchmarks
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Start with a house preset or configure storeys, room counts, openings, and finish tier to size all 10 trades in seconds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setParams(DEFAULT_AUTO_PARAMS);
                setAppliedSuccess(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Form
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'summary' })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition shadow"
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

      {/* Main Grid: Form Left (7 cols), Sticky Preview Right (5 cols) */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Guided Form Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Quick House Archetype Templates */}
          <div className="bg-gradient-to-r from-sky-50/90 to-indigo-50/70 rounded-xl border border-sky-200/80 p-4">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-sky-600" />
                Quick Philippine House Templates
              </h3>
              <span className="text-[11px] text-sky-700 font-medium">1-click prefill</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HOUSE_TEMPLATES.map((tpl) => {
                const isMatching =
                  params.storeys === tpl.params.storeys &&
                  params.groundFloorArea === tpl.params.groundFloorArea &&
                  params.secondFloorArea === tpl.params.secondFloorArea &&
                  params.thirdFloorArea === tpl.params.thirdFloorArea &&
                  params.tier === tpl.params.tier &&
                  params.wallType === tpl.params.wallType &&
                  !params.customRatePerSqM &&
                  params.bedroomsFloor1 === tpl.params.bedroomsFloor1 &&
                  params.bedroomsFloor2 === tpl.params.bedroomsFloor2 &&
                  params.bathroomsFloor1 === tpl.params.bathroomsFloor1 &&
                  params.bathroomsFloor2 === tpl.params.bathroomsFloor2 &&
                  params.doorsFloor1 === tpl.params.doorsFloor1 &&
                  params.doorsFloor2 === tpl.params.doorsFloor2 &&
                  params.windowsFloor1 === tpl.params.windowsFloor1 &&
                  params.windowsFloor2 === tpl.params.windowsFloor2;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setParams(tpl.params);
                      setAppliedSuccess(false);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      isMatching
                        ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                        : 'bg-white border-sky-200 text-slate-800 hover:border-sky-400 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{tpl.name}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        isMatching ? 'text-sky-100' : 'text-slate-500'
                      }`}
                    >
                      {tpl.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: Storeys & Dimensions */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-sky-600" />
                1. Storeys &amp; Structure Dimensions
              </h3>
              <span className="text-xs font-bold text-sky-700 bg-sky-100 border border-sky-200 px-3 py-0.5 rounded-full tabular-nums">
                Total GFA: {estimate.totalFloorArea} m²
              </span>
            </div>

            {/* Storey Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateParam('storeys', num)}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition ${
                    params.storeys === num
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-200'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-sky-400'
                  }`}
                >
                  {num} Storey{num > 1 ? 's' : ''}
                </button>
              ))}
            </div>

            {/* Storey Height & Floor Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label htmlFor="auto-storey-height" className="text-slate-600 font-semibold block mb-1">
                  Floor-to-Floor Height
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="auto-storey-height"
                    type="number"
                    step="0.1"
                    min="2.4"
                    max="4.5"
                    value={params.storeyHeight}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      updateParam('storeyHeight', !Number.isFinite(n) || n <= 0 ? 3.0 : Math.min(6.0, n));
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <span className="text-slate-500 font-semibold">m</span>
                </div>
              </div>

              <div>
                <label htmlFor="auto-ground-area" className="text-slate-600 font-semibold block mb-1">
                  Ground Floor Area
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="auto-ground-area"
                    type="number"
                    min="10"
                    value={params.groundFloorArea}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      updateParam('groundFloorArea', !Number.isFinite(n) ? 0 : Math.max(0, n));
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <span className="text-slate-500 font-semibold">m²</span>
                </div>
              </div>

              {params.storeys >= 2 && (
                <div>
                  <label htmlFor="auto-second-area" className="text-slate-600 font-semibold block mb-1">
                    2nd Floor Area
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="auto-second-area"
                      type="number"
                      min="0"
                      value={params.secondFloorArea}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        updateParam('secondFloorArea', !Number.isFinite(n) ? 0 : Math.max(0, n));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <span className="text-slate-500 font-semibold">m²</span>
                  </div>
                </div>
              )}

              {params.storeys >= 3 && (
                <div>
                  <label htmlFor="auto-third-area" className="text-slate-600 font-semibold block mb-1">
                    3rd Floor Area
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="auto-third-area"
                      type="number"
                      min="0"
                      value={params.thirdFloorArea}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        updateParam('thirdFloorArea', !Number.isFinite(n) ? 0 : Math.max(0, n));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <span className="text-slate-500 font-semibold">m²</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Construction Quality Tier */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-sky-600" />
              2. Construction Finish &amp; Standard Cost Tier (Philippines)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(PHILIPPINE_CONSTRUCTION_TIERS) as ConstructionTier[]).map((tKey) => {
                const config = PHILIPPINE_CONSTRUCTION_TIERS[tKey];
                const isSelected = params.tier === tKey;
                return (
                  <div
                    key={tKey}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => {
                      updateParam('tier', tKey);
                      updateParam('customRatePerSqM', undefined);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updateParam('tier', tKey);
                        updateParam('customRatePerSqM', undefined);
                      }
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/90 shadow-sm ring-2 ring-sky-500/25'
                        : 'border-slate-300 bg-white hover:border-sky-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900">{config.label}</span>
                        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-sky-600 flex-shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{config.subLabel}</div>
                      <div className="text-base font-black text-sky-700 mt-2 tabular-nums">
                        ₱{config.defaultRatePHP.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">/ m²</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                        {config.specification}
                      </p>
                      <ul className="mt-2.5 pt-2 border-t border-slate-200/70 space-y-1">
                        {config.typicalFinishes.slice(0, 3).map((fin) => (
                          <li key={fin} className="text-[10px] text-slate-500 flex items-start gap-1">
                            <span className="text-sky-500 font-bold">&bull;</span>
                            <span>{fin}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Rate Override */}
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <label htmlFor="auto-custom-rate" className="text-slate-600 font-medium">
                Custom Benchmark Rate Override (Optional):
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold">₱</span>
                <input
                  id="auto-custom-rate"
                  type="number"
                  min="0"
                  placeholder={PHILIPPINE_CONSTRUCTION_TIERS[params.tier].defaultRatePHP.toString()}
                  value={params.customRatePerSqM || ''}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value);
                    updateParam('customRatePerSqM', !Number.isFinite(n) || n <= 0 ? undefined : n);
                  }}
                  className="w-28 px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-800 font-semibold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-slate-500">/ m²</span>
              </div>
            </div>
          </div>

          {/* Section 3: Room Counts & Openings */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <DoorOpen className="w-4 h-4 text-sky-600" />
                3. Rooms, Openings &amp; Wall System
              </h3>
              <span className="text-[11px] text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                Baseline for {estimate.totalFloorArea} m²: {baselineBedrooms} beds &bull; {baselineDoors} doors &bull; {baselineWindows} windows
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {renderStepperInput(
                'Bedrooms (F1)',
                params.bedroomsFloor1,
                0,
                false,
                (v) => updateParam('bedroomsFloor1', v)
              )}

              {renderStepperInput(
                params.storeys >= 3 ? 'Bedrooms (F2/F3)' : 'Bedrooms (F2)',
                params.bedroomsFloor2,
                0,
                params.storeys < 2,
                (v) => updateParam('bedroomsFloor2', v)
              )}

              {renderStepperInput(
                'Bathrooms (F1)',
                params.bathroomsFloor1,
                1,
                false,
                (v) => updateParam('bathroomsFloor1', Math.max(1, v))
              )}

              {renderStepperInput(
                params.storeys >= 3 ? 'Bathrooms (F2/F3)' : 'Bathrooms (F2)',
                params.bathroomsFloor2,
                0,
                params.storeys < 2,
                (v) => updateParam('bathroomsFloor2', v)
              )}

              {renderStepperInput(
                'Doors (F1)',
                params.doorsFloor1 ?? 5,
                0,
                false,
                (v) => handleDoorChange(1, v)
              )}

              {renderStepperInput(
                'Doors (F2)',
                params.doorsFloor2 ?? (params.storeys >= 2 ? 5 : 0),
                0,
                params.storeys < 2,
                (v) => handleDoorChange(2, v)
              )}

              {renderStepperInput(
                'Windows (F1)',
                params.windowsFloor1 ?? 6,
                0,
                false,
                (v) => handleWindowChange(1, v)
              )}

              {renderStepperInput(
                'Windows (F2)',
                params.windowsFloor2 ?? (params.storeys >= 2 ? 6 : 0),
                0,
                params.storeys < 2,
                (v) => handleWindowChange(2, v)
              )}

              <div className="col-span-2 sm:col-span-4 bg-white p-3 rounded-lg border border-slate-200">
                <label className="text-slate-700 font-semibold block mb-1.5 flex items-center justify-between">
                  <span>Wall Construction System</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    CHB vs Drywall partition sensitivity
                  </span>
                </label>
                <select
                  value={params.wallType}
                  onChange={(e) => updateParam('wallType', e.target.value as WallConstructionType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white font-medium"
                >
                  <option value="all_chb">All CHB (150mm exterior, 100mm interior full plastered masonry)</option>
                  <option value="part_chb_part_drywall">Part CHB exterior / Part Drywall interior (-4% structure cost savings)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Live Results & Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          {/* Main Valuation Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-indigo-900/40 relative overflow-hidden">
            <div>
              <div className="text-xs uppercase tracking-widest text-sky-400 font-semibold mb-1">
                Estimated Structure Valuation
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
                {formatCurrency(estimate.totalDirectCost, '₱', 0)}
              </div>
            </div>

            <div className="text-xs text-slate-300 mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span>Effective:</span>
              <span className="font-semibold text-sky-300 tabular-nums">
                ₱{estimate.effectiveRatePerSqM.toLocaleString()} / m²
              </span>
              <span>&bull;</span>
              <span>{estimate.totalFloorArea} m² GFA</span>
              <span>&bull;</span>
              <span className="text-emerald-300 font-medium">
                {params.wallType === 'all_chb' ? 'All CHB' : 'Part Drywall'}
              </span>
            </div>

            {/* Range Band & All-In Contract Preview */}
            <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Range (Low – High)</span>
                <span className="font-semibold text-slate-200 tabular-nums">
                  {formatCurrency(estimate.lowRangeTotal, '₱', 0)} – {formatCurrency(estimate.highRangeTotal, '₱', 0)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 text-[10px] block uppercase font-semibold">
                  Est. Contract Total (incl. Markups/VAT)
                </span>
                <span className="font-bold text-emerald-300 tabular-nums">
                  {formatCurrency(estimate.estimatedGrandTotal, '₱', 0)}
                </span>
              </div>
            </div>

            {/* Action Button: Apply to BOQ */}
            <button
              type="button"
              onClick={handleApplyToBOQ}
              className="mt-5 w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-sky-900/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply &amp; Auto-Populate Project BOQ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Rule-of-Thumb Philippine Hardware Material Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-sky-600" />
                Est. Key Materials Preview
              </h4>
              <span className="text-[10px] text-slate-400">Rule-of-Thumb Take-Off</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <div className="text-[10px] text-slate-500">40kg Portland Cement</div>
                <div className="text-sm font-bold text-slate-800 tabular-nums">
                  ~{materialPreview.cementBags.toLocaleString()} bags
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <div className="text-[10px] text-slate-500">Hollow Blocks (4&quot; &amp; 6&quot;)</div>
                <div className="text-sm font-bold text-slate-800 tabular-nums">
                  ~{materialPreview.chbPieces.toLocaleString()} pcs
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <div className="text-[10px] text-slate-500">Deformed Steel Rebar</div>
                <div className="text-sm font-bold text-slate-800 tabular-nums">
                  ~{materialPreview.rebarKg.toLocaleString()} kg
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <div className="text-[10px] text-slate-500">Tile &amp; Finish Coverage</div>
                <div className="text-sm font-bold text-slate-800 tabular-nums">
                  ~{materialPreview.tileAreaSqm.toLocaleString()} m²
                </div>
              </div>
            </div>
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

            <div className="space-y-2 text-xs max-h-[340px] overflow-y-auto pr-1">
              {estimate.tradeBreakdowns.map((b) => {
                const accent = TRADE_COLOR_MAP[b.tradeId] || '#0EA5E9';
                return (
                  <div
                    key={b.tradeId}
                    className="bg-white p-2.5 rounded-lg border border-slate-200/80 hover:border-sky-300 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: accent }}
                        />
                        <span className="font-mono text-[10px] font-bold text-slate-400">{b.tradeCode}</span>
                        <span className="font-semibold text-slate-800 truncate">{b.tradeName}</span>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-baseline gap-2">
                        <span className="font-bold text-slate-900 tabular-nums">
                          {formatCurrency(b.directCost, '₱', 0)}
                        </span>
                        <span className="text-[10px] font-semibold text-sky-600 tabular-nums w-10 text-right">
                          {formatPercent(b.percentageShare)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, b.percentageShare * 2.5)}%`,
                          backgroundColor: accent,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Parametric Modifiers Summary */}
          {estimate.summaryNotes.length > 0 && (
            <div className="bg-sky-50/80 rounded-xl border border-sky-200/80 p-3.5 text-xs text-sky-900">
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
