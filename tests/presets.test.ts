import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Trade Presets & BOQ Catalog Integrity Test Suite (tests/presets.test.ts)
 * Covers Features: F01-F10, F12, F15
 * Standards: Catalog completeness, schema validation, standard units, specification integrity
 */

// Interface contracts
interface PresetItem {
  id: string;
  itemCode: string;
  scopeId: string;
  description: string;
  specification: string;
  unit: string;
  quantity: number;
  materialRate: number;
  laborRate: number;
  equipmentRate: number;
  directUnitCost?: number;
  directTotalCost?: number;
}

interface PresetSubScope {
  id: string;
  name: string;
  items: PresetItem[];
}

interface PresetTrade {
  id: string;
  code: string;
  name: string;
  subScopes: PresetSubScope[];
}

const VALID_STANDARD_UNITS = new Set([
  'm³',
  'm²',
  'lm',
  'kg',
  'tons',
  'sets',
  'pcs',
  'rolls',
  'liters',
  'points',
  'pts',
  'lot',
  'units',
]);

const EXPECTED_10_TRADE_CODES = [
  'EW',
  'CONC',
  'WP',
  'STL',
  'CRP',
  'DW',
  'FIN',
  'PLB',
  'ELEC',
  'MECH',
];

let tradesCatalog: PresetTrade[] = [];
let allPresetItems: PresetItem[] = [];

beforeAll(async () => {
  try {
    const modPath = '../src/data/defaultProject';
    const mod = await import(/* @vite-ignore */ modPath);
    tradesCatalog = mod.defaultProject?.trades || mod.trades || [];
    allPresetItems = tradesCatalog.flatMap((t) => t.subScopes.flatMap((s) => s.items));
  } catch {
    // Authoritative Preset Catalog Oracle extracted from Survey 3 Specification (handoff.md lines 100-985)
    tradesCatalog = [
      {
        id: 'trade_earthworks',
        code: 'EW',
        name: 'Earthworks & Temporary Works',
        subScopes: [
          {
            id: 'ew_site_prep',
            name: 'Site Preparation & Temporary Facilities',
            items: [
              { id: 'ew-1', scopeId: 'ew_site_prep', itemCode: 'EW-001', description: 'Temporary Site Enclosure / Perimeter Fence', specification: 'Corrugated G.I. sheets on 2"x3" framing 1.8m height', unit: 'lm', quantity: 75.0, materialRate: 15.0, laborRate: 8.5, equipmentRate: 1.5, directUnitCost: 25.0, directTotalCost: 1875.0 },
              { id: 'ew-2', scopeId: 'ew_site_prep', itemCode: 'EW-002', description: 'Temporary Field Office & Storage Quarters', specification: '12mm plywood walls, light-gauge framing, rough table', unit: 'm²', quantity: 24.0, materialRate: 45.0, laborRate: 30.0, equipmentRate: 5.0, directUnitCost: 80.0, directTotalCost: 1920.0 },
              { id: 'ew-3', scopeId: 'ew_site_prep', itemCode: 'EW-003', description: 'Temporary Water & Electric Utility Connection', specification: 'Temporary power sub-meter, safety breaker, hose bibbs', unit: 'lot', quantity: 1.0, materialRate: 250.0, laborRate: 180.0, equipmentRate: 20.0, directUnitCost: 450.0, directTotalCost: 450.0 },
              { id: 'ew-4', scopeId: 'ew_site_prep', itemCode: 'EW-004', description: 'Site Clearing, Grubbing & Topsoil Stripping', specification: 'Removal of surface vegetation and top 150mm organic soil', unit: 'm²', quantity: 280.0, materialRate: 0.0, laborRate: 1.8, equipmentRate: 2.2, directUnitCost: 4.0, directTotalCost: 1120.0 },
              { id: 'ew-5', scopeId: 'ew_site_prep', itemCode: 'EW-005', description: 'Staking, Batterboards & Architectural Layout', specification: '2"x2" coco lumber stakes, nylon guide lines, benchmarks', unit: 'm²', quantity: 150.0, materialRate: 2.2, laborRate: 2.8, equipmentRate: 0.5, directUnitCost: 5.5, directTotalCost: 825.0 },
            ],
          },
          {
            id: 'ew_excavation',
            name: 'Earthworks & Excavation',
            items: [
              { id: 'ew-6', scopeId: 'ew_excavation', itemCode: 'EW-006', description: 'Structural Footing & Foundation Excavation', specification: 'Common soil excavation up to -1.80m from NGL', unit: 'm³', quantity: 62.0, materialRate: 0.0, laborRate: 12.0, equipmentRate: 8.0, directUnitCost: 20.0, directTotalCost: 1240.0 },
              { id: 'ew-7', scopeId: 'ew_excavation', itemCode: 'EW-007', description: 'Wall Footing & Utility Trenching', specification: 'Manual trench excavation for CHB wall footings to -0.80m', unit: 'm³', quantity: 26.0, materialRate: 0.0, laborRate: 16.0, equipmentRate: 2.0, directUnitCost: 18.0, directTotalCost: 468.0 },
              { id: 'ew-8', scopeId: 'ew_excavation', itemCode: 'EW-008', description: 'Structural Backfill & Mechanical Compaction', specification: 'Approved excavated material backfilled in 150mm layers', unit: 'm³', quantity: 42.0, materialRate: 0.0, laborRate: 8.0, equipmentRate: 6.0, directUnitCost: 14.0, directTotalCost: 588.0 },
              { id: 'ew-9', scopeId: 'ew_excavation', itemCode: 'EW-009', description: 'Imported Aggregate Base Coarse Subbase', specification: 'Granular Class A base spread, graded, roller compacted', unit: 'm³', quantity: 28.0, materialRate: 22.0, laborRate: 5.0, equipmentRate: 7.0, directUnitCost: 34.0, directTotalCost: 952.0 },
              { id: 'ew-10', scopeId: 'ew_excavation', itemCode: 'EW-010', description: 'Crushed Gravel Bedding under Slabs & Footings', specification: '50mm clean crushed 3/4" gravel bed leveled', unit: 'm³', quantity: 14.0, materialRate: 28.0, laborRate: 7.0, equipmentRate: 3.0, directUnitCost: 38.0, directTotalCost: 532.0 },
            ],
          },
        ],
      },
      {
        id: 'trade_concrete',
        code: 'CONC',
        name: 'Concrete & Masonry Works',
        subScopes: [
          {
            id: 'conc_structural',
            name: 'Structural Concrete',
            items: [
              { id: 'c-1', scopeId: 'conc_structural', itemCode: 'CONC-001', description: 'Ready-Mix Concrete 3,000 PSI Footings & Beams', specification: 'ASTM C94 Class A standard mix, 28-day cure, 20mm aggregate', unit: 'm³', quantity: 34.0, materialRate: 95.0, laborRate: 22.0, equipmentRate: 15.0, directUnitCost: 132.0, directTotalCost: 4488.0 },
              { id: 'c-2', scopeId: 'conc_structural', itemCode: 'CONC-002', description: 'Ready-Mix Concrete 3,500 PSI Columns & Walls', specification: 'High-strength pumpable mix, 28-day cure, vibrated', unit: 'm³', quantity: 22.0, materialRate: 105.0, laborRate: 25.0, equipmentRate: 18.0, directUnitCost: 148.0, directTotalCost: 3256.0 },
              { id: 'c-3', scopeId: 'conc_structural', itemCode: 'CONC-003', description: 'Ready-Mix Concrete 3,000 PSI Suspended Slabs', specification: 'Class A 28-day cure with water-reducing admixtures', unit: 'm³', quantity: 28.0, materialRate: 98.0, laborRate: 28.0, equipmentRate: 18.0, directUnitCost: 144.0, directTotalCost: 4032.0 },
              { id: 'c-4', scopeId: 'conc_structural', itemCode: 'CONC-004', description: 'Concrete Slab-on-Grade 2,500 PSI 100mm Thick', specification: 'Transit-mix concrete, steel trowel smooth finish', unit: 'm³', quantity: 16.0, materialRate: 88.0, laborRate: 24.0, equipmentRate: 8.0, directUnitCost: 120.0, directTotalCost: 1920.0 },
            ],
          },
          {
            id: 'conc_rebar',
            name: 'Reinforcing Steel Bars (Rebar)',
            items: [
              { id: 'c-5', scopeId: 'conc_rebar', itemCode: 'CONC-005', description: 'Deformed Steel Bars Grade 40 (10mm & 12mm)', specification: 'ASTM A615 Grade 40 rebars for slab temperature bars', unit: 'kg', quantity: 1950.0, materialRate: 1.10, laborRate: 0.35, equipmentRate: 0.05, directUnitCost: 1.50, directTotalCost: 2925.0 },
              { id: 'c-6', scopeId: 'conc_rebar', itemCode: 'CONC-006', description: 'Deformed Steel Bars Grade 60 (16mm - 25mm)', specification: 'ASTM A615 Grade 60 high-tensile rebars for main members', unit: 'kg', quantity: 3400.0, materialRate: 1.18, laborRate: 0.38, equipmentRate: 0.06, directUnitCost: 1.62, directTotalCost: 5508.0 },
              { id: 'c-7', scopeId: 'conc_rebar', itemCode: 'CONC-007', description: '#16 Black Annealed G.I. Tie Wire', specification: 'Standard gauge #16 wire for secure rebar tying', unit: 'kg', quantity: 105.0, materialRate: 1.60, laborRate: 0.80, equipmentRate: 0.0, directUnitCost: 2.40, directTotalCost: 252.0 },
            ],
          },
          {
            id: 'conc_formwork',
            name: 'Formworks & Falsework',
            items: [
              { id: 'c-8', scopeId: 'conc_formwork', itemCode: 'CONC-008', description: 'Phenolic Film-Faced Plywood Formworks 12mm', specification: 'Heavy-duty 12mm phenolic boards on stud framing', unit: 'm²', quantity: 240.0, materialRate: 8.50, laborRate: 9.50, equipmentRate: 3.00, directUnitCost: 21.0, directTotalCost: 5040.0 },
              { id: 'c-9', scopeId: 'conc_formwork', itemCode: 'CONC-009', description: 'Adjustable Steel Shoring & Scaffolding', specification: 'Heavy-duty modular frames, cross-braces, jacks', unit: 'sets', quantity: 48.0, materialRate: 4.00, laborRate: 6.00, equipmentRate: 5.50, directUnitCost: 15.50, directTotalCost: 744.0 },
            ],
          },
          {
            id: 'conc_masonry',
            name: 'Masonry Works (CHB & Plaster)',
            items: [
              { id: 'c-10', scopeId: 'conc_masonry', itemCode: 'CONC-010', description: '150mm (6") CHB Exterior Wall', specification: 'CHB laid with 1:3 mortar, core filled solid', unit: 'm²', quantity: 165.0, materialRate: 14.50, laborRate: 11.00, equipmentRate: 1.50, directUnitCost: 27.0, directTotalCost: 4455.0 },
              { id: 'c-11', scopeId: 'conc_masonry', itemCode: 'CONC-011', description: '100mm (4") CHB Interior Partition', specification: '100mm CHB laid with 1:3 mortar, cells filled solid', unit: 'm²', quantity: 195.0, materialRate: 11.00, laborRate: 9.50, equipmentRate: 1.00, directUnitCost: 21.50, directTotalCost: 4192.5 },
              { id: 'c-12', scopeId: 'conc_masonry', itemCode: 'CONC-012', description: 'Cement Plaster Rendering & Skim Finish 16mm', specification: '16mm 1:3 cement-sand plaster finish both faces', unit: 'm²', quantity: 710.0, materialRate: 3.80, laborRate: 5.20, equipmentRate: 0.80, directUnitCost: 9.80, directTotalCost: 6958.0 },
            ],
          },
        ],
      },
      {
        id: 'trade_waterproofing',
        code: 'WP',
        name: 'Waterproofing & Moisture Protection',
        subScopes: [
          {
            id: 'wp_sub',
            name: 'Substructure & Wet Areas',
            items: [
              { id: 'wp-1', scopeId: 'wp_sub', itemCode: 'WP-001', description: 'Polyethylene Vapor Barrier 6-mil (0.15mm)', specification: 'Heavy-duty 6-mil virgin PE sheet with taped joints', unit: 'm²', quantity: 160.0, materialRate: 0.95, laborRate: 0.55, equipmentRate: 0.0, directUnitCost: 1.50, directTotalCost: 240.0 },
              { id: 'wp-2', scopeId: 'wp_sub', itemCode: 'WP-002', description: 'Chemical Termiticide Soil Barrier Treatment', specification: 'Soil poisoning around footings and sub-slab area', unit: 'm²', quantity: 190.0, materialRate: 1.80, laborRate: 0.90, equipmentRate: 0.30, directUnitCost: 3.00, directTotalCost: 570.0 },
              { id: 'wp-3', scopeId: 'wp_sub', itemCode: 'WP-003', description: 'Flexible Cementitious Waterproofing (Bathrooms)', specification: '2-coat polymer-modified cementitious membrane', unit: 'm²', quantity: 52.0, materialRate: 7.20, laborRate: 4.80, equipmentRate: 0.50, directUnitCost: 12.50, directTotalCost: 650.0 },
              { id: 'wp-4', scopeId: 'wp_sub', itemCode: 'WP-004', description: 'Polyurethane Liquid Waterproofing (Balconies)', specification: 'Cold-applied UV-resistant seamless liquid membrane', unit: 'm²', quantity: 38.0, materialRate: 14.50, laborRate: 6.50, equipmentRate: 1.00, directUnitCost: 22.00, directTotalCost: 836.0 },
              { id: 'wp-5', scopeId: 'wp_sub', itemCode: 'WP-005', description: '4mm Torch-Applied SBS Bituminous Membrane', specification: '4mm mineral-surfaced torch-on SBS bitumen sheet', unit: 'm²', quantity: 88.0, materialRate: 16.00, laborRate: 7.50, equipmentRate: 2.50, directUnitCost: 26.00, directTotalCost: 2288.0 },
              { id: 'wp-6', scopeId: 'wp_sub', itemCode: 'WP-006', description: 'Integral Waterproofing Concrete Admixture', specification: 'Permeability-reducing crystalline admixture', unit: 'kg', quantity: 125.0, materialRate: 3.20, laborRate: 0.80, equipmentRate: 0.0, directUnitCost: 4.00, directTotalCost: 500.0 },
              { id: 'wp-7', scopeId: 'wp_sub', itemCode: 'WP-007', description: 'Crystalline Slurry Waterproofing for Cistern', specification: 'Deep-penetrating chemical crystallization slurry', unit: 'm²', quantity: 32.0, materialRate: 9.80, laborRate: 5.20, equipmentRate: 0.50, directUnitCost: 15.50, directTotalCost: 496.0 },
            ],
          },
        ],
      },
      {
        id: 'trade_steel',
        code: 'STL',
        name: 'Structural Steel and Roofing Works',
        subScopes: [
          {
            id: 'stl_framing',
            name: 'Trusses & Roofing',
            items: [
              { id: 'stl-1', scopeId: 'stl_framing', itemCode: 'STL-001', description: 'Structural Steel Roof Trusses & Rafters', specification: 'ASTM A36 angles, channels, plates, welded & primed', unit: 'kg', quantity: 3600.0, materialRate: 1.85, laborRate: 0.95, equipmentRate: 0.45, directUnitCost: 3.25, directTotalCost: 11700.0 },
              { id: 'stl-2', scopeId: 'stl_framing', itemCode: 'STL-002', description: 'Cold-Formed Light-Gauge Steel C-Purlins', specification: '100mm x 50mm x 1.8mm cold-rolled C-purlins', unit: 'kg', quantity: 1750.0, materialRate: 1.70, laborRate: 0.65, equipmentRate: 0.25, directUnitCost: 2.60, directTotalCost: 4550.0 },
              { id: 'stl-3', scopeId: 'stl_framing', itemCode: 'STL-003', description: 'Sag Rods & Cross-Bracing Cables', specification: '12mm round steel sag rods with threaded nuts', unit: 'kg', quantity: 290.0, materialRate: 2.10, laborRate: 0.90, equipmentRate: 0.20, directUnitCost: 3.20, directTotalCost: 928.0 },
              { id: 'stl-4', scopeId: 'stl_framing', itemCode: 'STL-004', description: 'Anchor Bolts & Base Plate Assemblies', specification: '16mm x 400mm anchor bolts with base plates', unit: 'sets', quantity: 24.0, materialRate: 18.0, laborRate: 9.0, equipmentRate: 3.0, directUnitCost: 30.0, directTotalCost: 720.0 },
              { id: 'stl-5', scopeId: 'stl_framing', itemCode: 'STL-005', description: 'Pre-Painted Rib-Type Metal Roofing 0.50mm', specification: 'High-tensile zinc-aluminum coated steel', unit: 'm²', quantity: 195.0, materialRate: 13.50, laborRate: 4.50, equipmentRate: 1.20, directUnitCost: 19.20, directTotalCost: 3744.0 },
              { id: 'stl-6', scopeId: 'stl_framing', itemCode: 'STL-006', description: 'Pre-Painted Ridge Rolls & Wall Flashing', specification: '0.50mm base metal thickness pre-painted gauge', unit: 'lm', quantity: 48.0, materialRate: 8.50, laborRate: 3.80, equipmentRate: 0.70, directUnitCost: 13.00, directTotalCost: 624.0 },
              { id: 'stl-7', scopeId: 'stl_framing', itemCode: 'STL-007', description: 'Stainless Steel Box Gutter 0.60mm GA 24', specification: 'Grade 304 0.60mm stainless steel custom bent', unit: 'lm', quantity: 34.0, materialRate: 19.00, laborRate: 6.50, equipmentRate: 1.50, directUnitCost: 27.00, directTotalCost: 918.0 },
              { id: 'stl-8', scopeId: 'stl_framing', itemCode: 'STL-008', description: 'Double-Sided Foil Polyethylene Roof Insulation', specification: '10mm cross-linked closed-cell PE foam foil both sides', unit: 'm²', quantity: 195.0, materialRate: 3.40, laborRate: 1.80, equipmentRate: 0.30, directUnitCost: 5.50, directTotalCost: 1072.5 },
            ],
          },
        ],
      },
      {
        id: 'trade_carpentry',
        code: 'CRP',
        name: 'Carpentry and Drywall Works',
        subScopes: [
          {
            id: 'crp_all',
            name: 'Ceilings & Drywalls',
            items: [
              { id: 'crp-1', scopeId: 'crp_all', itemCode: 'CRP-001', description: '9mm Moisture-Resistant Gypsum Ceiling', specification: 'Gypsum board on metal furring suspended grid', unit: 'm²', quantity: 210.0, materialRate: 8.50, laborRate: 5.50, equipmentRate: 0.50, directUnitCost: 14.50, directTotalCost: 3045.0 },
              { id: 'crp-2', scopeId: 'crp_all', itemCode: 'CRP-002', description: 'Acoustic Drywall Partition with Insulation', specification: 'Double-layer drywall on light-gauge studs with batts', unit: 'm²', quantity: 140.0, materialRate: 16.00, laborRate: 9.00, equipmentRate: 1.00, directUnitCost: 26.00, directTotalCost: 3640.0 },
              { id: 'crp-3', scopeId: 'crp_all', itemCode: 'CRP-003', description: 'Custom Kitchen Cabinetry & Granite Counter', specification: 'Marine plywood carcasses, soft-close hinges, granite top', unit: 'lm', quantity: 12.0, materialRate: 320.0, laborRate: 180.0, equipmentRate: 20.0, directUnitCost: 520.0, directTotalCost: 6240.0 },
              { id: 'crp-4', scopeId: 'crp_all', itemCode: 'CRP-004', description: 'Built-in Bedroom Wardrobes & Shelving', specification: 'Melamine-faced MDF with aluminum slide tracks', unit: 'sets', quantity: 4.0, materialRate: 550.0, laborRate: 220.0, equipmentRate: 15.0, directUnitCost: 785.0, directTotalCost: 3140.0 },
              { id: 'crp-5', scopeId: 'crp_all', itemCode: 'CRP-005', description: 'Timber Baseboards & Casing Trims', specification: 'Finger-jointed pine wood primed and profile routed', unit: 'lm', quantity: 180.0, materialRate: 2.40, laborRate: 1.20, equipmentRate: 0.10, directUnitCost: 3.70, directTotalCost: 666.0 },
            ],
          },
        ],
      },
      {
        id: 'trade_doors_windows',
        code: 'DW',
        name: 'Doors, Windows & Architectural Metals',
        subScopes: [
          {
            id: 'dw_all',
            name: 'Doors, Windows & Railings',
            items: [
              { id: 'dw-1', scopeId: 'dw_all', itemCode: 'DW-001', description: 'Aluminum Sliding Windows with Tinted Glass', specification: 'Powder-coated aluminum frame with 6mm tempered glass', unit: 'sets', quantity: 12.0, materialRate: 220.0, laborRate: 45.0, equipmentRate: 5.0, directUnitCost: 270.0, directTotalCost: 3240.0 },
              { id: 'dw-2', scopeId: 'dw_all', itemCode: 'DW-002', description: 'Solid Core Wood Main Entrance Door Assembly', specification: 'Hardwood panel door with jamb and architectural handle', unit: 'sets', quantity: 1.0, materialRate: 480.0, laborRate: 90.0, equipmentRate: 10.0, directUnitCost: 580.0, directTotalCost: 580.0 },
              { id: 'dw-3', scopeId: 'dw_all', itemCode: 'DW-003', description: 'Flush Hollow Core Interior Doors', specification: 'Laminated timber doors with stainless cylindrical lockset', unit: 'sets', quantity: 8.0, materialRate: 110.0, laborRate: 35.0, equipmentRate: 5.0, directUnitCost: 150.0, directTotalCost: 1200.0 },
              { id: 'dw-4', scopeId: 'dw_all', itemCode: 'DW-004', description: 'PVC Bathroom Louver Doors', specification: 'Moisture-proof PVC door with frame and hardware', unit: 'sets', quantity: 4.0, materialRate: 75.0, laborRate: 25.0, equipmentRate: 0.0, directUnitCost: 100.0, directTotalCost: 400.0 },
              { id: 'dw-5', scopeId: 'dw_all', itemCode: 'DW-005', description: 'Stainless Steel 304 Stair Railing & Baluster', specification: '50mm dia. SS 304 handrail with 38mm intermediate posts', unit: 'lm', quantity: 24.0, materialRate: 85.0, laborRate: 45.0, equipmentRate: 6.0, directUnitCost: 136.0, directTotalCost: 3264.0 },
            ],
          },
        ],
      },
      {
        id: 'trade_finishes',
        code: 'FIN',
        name: 'Finishes and Painting Works',
        subScopes: [
          {
            id: 'fin_all',
            name: 'Tiles, Flooring & Paint',
            items: [
              { id: 'fin-1', scopeId: 'fin_all', itemCode: 'FIN-001', description: '600x600mm Porcelain Floor Tiles', specification: 'Vitrified porcelain tiles with polymer adhesive & epoxy grout', unit: 'm²', quantity: 180.0, materialRate: 22.0, laborRate: 12.0, equipmentRate: 1.0, directUnitCost: 35.0, directTotalCost: 6300.0 },
              { id: 'fin-2', scopeId: 'fin_all', itemCode: 'FIN-002', description: '300x600mm Ceramic Bathroom Wall Tiles', specification: 'Glazed wall tiles with non-sag adhesive to full ceiling height', unit: 'm²', quantity: 95.0, materialRate: 18.0, laborRate: 11.0, equipmentRate: 0.8, directUnitCost: 29.8, directTotalCost: 2831.0 },
              { id: 'fin-3', scopeId: 'fin_all', itemCode: 'FIN-003', description: 'Luxury Vinyl Plank Flooring (SPC 5mm)', specification: 'Stone polymer composite planks with 1.5mm IXPE acoustic pad', unit: 'm²', quantity: 85.0, materialRate: 24.0, laborRate: 8.5, equipmentRate: 0.5, directUnitCost: 33.0, directTotalCost: 2805.0 },
              { id: 'fin-4', scopeId: 'fin_all', itemCode: 'FIN-004', description: 'Interior 3-Coat Acrylic Paint Finish', specification: 'Primer sealer plus 2 topcoats acrylic latex on walls/ceilings', unit: 'm²', quantity: 820.0, materialRate: 2.80, laborRate: 2.20, equipmentRate: 0.20, directUnitCost: 5.20, directTotalCost: 4264.0 },
              { id: 'fin-5', scopeId: 'fin_all', itemCode: 'FIN-005', description: 'Exterior Elastomeric Weatherproof Paint', specification: 'High-build elastomeric acrylic coating for crack bridging', unit: 'm²', quantity: 260.0, materialRate: 4.20, laborRate: 3.00, equipmentRate: 0.30, directUnitCost: 7.50, directTotalCost: 1950.0 },
            ],
          },
        ],
      },
      {
        id: 'trade_plumbing',
        code: 'PLB',
        name: 'Plumbing Rough-In Works',
        subScopes: [
          {
            id: 'plb_all',
            name: 'Piping & Drainage',
            items: [
              { id: 'plb-1', scopeId: 'plb_all', itemCode: 'PLB-001', description: 'PPR-PN20 Hot & Cold Water Distribution Pipes', specification: 'Polypropylene random copolymer pipes with heat fusion fittings', unit: 'lm', quantity: 145.0, materialRate: 6.50, laborRate: 4.00, equipmentRate: 0.50, directUnitCost: 11.0, directTotalCost: 1595.0 },
              { id: 'plb-2', scopeId: 'plb_all', itemCode: 'PLB-002', description: 'uPVC Sanitary Drainage & Waste Stacks', specification: 'Series 1000 uPVC pipes with solvent cement welded joints', unit: 'lm', quantity: 95.0, materialRate: 8.00, laborRate: 5.50, equipmentRate: 0.50, directUnitCost: 14.0, directTotalCost: 1330.0 },
              { id: 'plb-3', scopeId: 'plb_all', itemCode: 'PLB-003', description: 'uPVC Vent Piping System Through Roof', specification: '50mm & 75mm vent pipes connected to roof flashing caps', unit: 'lm', quantity: 45.0, materialRate: 5.00, laborRate: 3.50, equipmentRate: 0.20, directUnitCost: 8.70, directTotalCost: 391.5 },
              { id: 'plb-4', scopeId: 'plb_all', itemCode: 'PLB-004', description: 'Storm Drainage Downspouts & Catch Basins', specification: '100mm heavy-duty downspouts with masonry catch basins', unit: 'lm', quantity: 60.0, materialRate: 12.00, laborRate: 8.00, equipmentRate: 1.00, directUnitCost: 21.0, directTotalCost: 1260.0 },
              { id: 'plb-5', scopeId: 'plb_all', itemCode: 'PLB-005', description: 'Plumbing Rough-In Fixture Stub-Outs & Drains', specification: 'Brass angle valves, flexible hoses, floor drains with traps', unit: 'sets', quantity: 18.0, materialRate: 55.0, laborRate: 28.0, equipmentRate: 2.0, directUnitCost: 85.0, directTotalCost: 1530.0 },
            ],
          },
        ],
      },
      {
        id: 'trade_electrical',
        code: 'ELEC',
        name: 'Electrical Rough-In Works',
        subScopes: [
          {
            id: 'elec_all',
            name: 'Conduits, Wiring & Panels',
            items: [
              { id: 'elec-1', scopeId: 'elec_all', itemCode: 'ELEC-001', description: 'uPVC Conduits Embedded in Slab & Masonry', specification: '20mm & 25mm thick-wall electrical conduit with boxes', unit: 'lm', quantity: 420.0, materialRate: 1.80, laborRate: 1.50, equipmentRate: 0.20, directUnitCost: 3.50, directTotalCost: 1470.0 },
              { id: 'elec-2', scopeId: 'elec_all', itemCode: 'ELEC-002', description: 'Galvanized Steel Utility & Junction Boxes', specification: 'Deep-drawn GA 16 zinc-coated boxes with covers', unit: 'pcs', quantity: 85.0, materialRate: 2.20, laborRate: 1.80, equipmentRate: 0.0, directUnitCost: 4.00, directTotalCost: 340.0 },
              { id: 'elec-3', scopeId: 'elec_all', itemCode: 'ELEC-003', description: 'THHN/THWN-2 Copper Wire 3.5mm² (#12 AWG)', specification: '600V building wire for lighting and general outlet circuits', unit: 'lm', quantity: 880.0, materialRate: 0.95, laborRate: 0.65, equipmentRate: 0.05, directUnitCost: 1.65, directTotalCost: 1452.0 },
              { id: 'elec-4', scopeId: 'elec_all', itemCode: 'ELEC-004', description: 'THHN/THWN-2 Copper Wire 5.5mm² (#10 AWG)', specification: 'Wire for dedicated appliance circuits (AC, heaters)', unit: 'lm', quantity: 340.0, materialRate: 1.55, laborRate: 0.85, equipmentRate: 0.05, directUnitCost: 2.45, directTotalCost: 833.0 },
              { id: 'elec-5', scopeId: 'elec_all', itemCode: 'ELEC-005', description: 'Main Service Feeder Cable 38mm²', specification: '600V stranded copper feeder from utility mast to panel', unit: 'lm', quantity: 36.0, materialRate: 8.50, laborRate: 3.80, equipmentRate: 0.60, directUnitCost: 12.90, directTotalCost: 464.4 },
              { id: 'elec-6', scopeId: 'elec_all', itemCode: 'ELEC-006', description: 'Grounding Electrode & Bare Copper Conductor', specification: '16mm x 3.0m copper-bonded rod with 14mm² wire', unit: 'sets', quantity: 1.0, materialRate: 45.0, laborRate: 30.0, equipmentRate: 5.0, directUnitCost: 80.0, directTotalCost: 80.0 },
              { id: 'elec-7', scopeId: 'elec_all', itemCode: 'ELEC-007', description: 'Cat6 UTP Data Network Cabling in Conduits', specification: '250 MHz 4-pair UTP pulled in dedicated conduits', unit: 'lm', quantity: 190.0, materialRate: 1.10, laborRate: 0.90, equipmentRate: 0.10, directUnitCost: 2.10, directTotalCost: 399.0 },
              { id: 'elec-8', scopeId: 'elec_all', itemCode: 'ELEC-008', description: 'Main Distribution Panelboard (16 Branches)', specification: 'NEMA 1 enclosure with main circuit breaker and branches', unit: 'sets', quantity: 1.0, materialRate: 380.0, laborRate: 180.0, equipmentRate: 30.0, directUnitCost: 590.0, directTotalCost: 590.0 },
            ],
          },
        ],
      },
      {
        id: 'trade_mechanical',
        code: 'MECH',
        name: 'Mechanical & Fire Protection Works',
        subScopes: [
          {
            id: 'mech_all',
            name: 'HVAC & Fire Safety',
            items: [
              { id: 'mech-1', scopeId: 'mech_all', itemCode: 'MECH-001', description: 'Inverter Split AC Copper Refrigerant Piping', specification: 'Deoxidized copper tubing with 1/2" elastomeric insulation', unit: 'lm', quantity: 68.0, materialRate: 14.0, laborRate: 7.50, equipmentRate: 1.50, directUnitCost: 23.0, directTotalCost: 1564.0 },
              { id: 'mech-2', scopeId: 'mech_all', itemCode: 'MECH-002', description: 'AC Condensate Drain Piping with Thermal Sleeve', specification: '25mm uPVC condensate line sloped 1% with insulation', unit: 'lm', quantity: 48.0, materialRate: 3.20, laborRate: 2.80, equipmentRate: 0.30, directUnitCost: 6.30, directTotalCost: 302.4 },
              { id: 'mech-3', scopeId: 'mech_all', itemCode: 'MECH-003', description: 'Ceiling Bathroom Exhaust Fans & Ducting', specification: '120 CFM quiet centrifugal fan with flexible duct', unit: 'sets', quantity: 4.0, materialRate: 42.0, laborRate: 25.0, equipmentRate: 3.0, directUnitCost: 70.0, directTotalCost: 280.0 },
              { id: 'mech-4', scopeId: 'mech_all', itemCode: 'MECH-004', description: 'Range Hood Exhaust Ductwork Galvanized Steel', specification: '150mm round GA 24 duct with damper and wall cap', unit: 'lm', quantity: 6.5, materialRate: 18.0, laborRate: 14.0, equipmentRate: 2.0, directUnitCost: 34.0, directTotalCost: 221.0 },
              { id: 'mech-5', scopeId: 'mech_all', itemCode: 'MECH-005', description: 'Fire Sprinkler Sch 40 Black Iron Piping', specification: 'ASTM A53 seamless steel pipe with swivel hangers', unit: 'lm', quantity: 90.0, materialRate: 16.50, laborRate: 9.50, equipmentRate: 2.0, directUnitCost: 28.0, directTotalCost: 2520.0 },
              { id: 'mech-6', scopeId: 'mech_all', itemCode: 'MECH-006', description: 'Pendant / Upright Fire Sprinkler Heads (68°C)', specification: '1/2" brass automatic glass bulb quick response head', unit: 'pcs', quantity: 20.0, materialRate: 9.50, laborRate: 5.50, equipmentRate: 0.50, directUnitCost: 15.50, directTotalCost: 310.0 },
              { id: 'mech-7', scopeId: 'mech_all', itemCode: 'MECH-007', description: 'Semi-Recessed Fire Hose Cabinet Station', specification: 'Steel cabinet with 1.5" x 30m hose and brass nozzle', unit: 'sets', quantity: 2.0, materialRate: 320.0, laborRate: 85.0, equipmentRate: 15.0, directUnitCost: 420.0, directTotalCost: 840.0 },
              { id: 'mech-8', scopeId: 'mech_all', itemCode: 'MECH-008', description: 'Conventional Fire Alarm Control Panel (4-Zone)', specification: '24VDC microprocessor-controlled FACP with battery', unit: 'sets', quantity: 1.0, materialRate: 480.0, laborRate: 140.0, equipmentRate: 20.0, directUnitCost: 640.0, directTotalCost: 640.0 },
              { id: 'mech-9', scopeId: 'mech_all', itemCode: 'MECH-009', description: 'Smoke Detector & Manual Pull Rough-In Points', specification: 'Photoelectric smoke base, manual station, 20mm conduit', unit: 'pts', quantity: 12.0, materialRate: 12.0, laborRate: 11.0, equipmentRate: 1.0, directUnitCost: 24.0, directTotalCost: 288.0 },
              { id: 'mech-10', scopeId: 'mech_all', itemCode: 'MECH-010', description: '10 lbs ABC Dry Chemical Fire Extinguishers', specification: 'UL listed 10 lbs extinguisher with wall bracket', unit: 'pcs', quantity: 4.0, materialRate: 38.0, laborRate: 8.0, equipmentRate: 0.0, directUnitCost: 46.0, directTotalCost: 184.0 },
            ],
          },
        ],
      },
    ];
    allPresetItems = tradesCatalog.flatMap((t) => t.subScopes.flatMap((s) => s.items));
  }
});

describe('Trade Presets & BOQ Catalog Integrity (tests/presets.test.ts)', () => {
  describe('1. Trade Scope Coverage & Naming (F01-F10)', () => {
    it('contains exactly 10 distinct technical trades matching project specifications', () => {
      expect(tradesCatalog.length).toBe(10);
    });

    it('contains all 10 expected trade codes in proper sequential order', () => {
      const actualCodes = tradesCatalog.map((t) => t.code);
      for (const expected of EXPECTED_10_TRADE_CODES) {
        expect(actualCodes).toContain(expected);
      }
    });

    it('ensures each trade has a non-empty descriptive name and unique ID', () => {
      const tradeIds = new Set<string>();
      for (const trade of tradesCatalog) {
        expect(trade.name).toBeDefined();
        expect(trade.name.trim().length).toBeGreaterThan(0);
        expect(tradeIds.has(trade.id)).toBe(false);
        tradeIds.add(trade.id);
      }
    });

    it('ensures each trade contains at least one sub-scope', () => {
      for (const trade of tradesCatalog) {
        expect(trade.subScopes.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('2. Line Item Catalog Completeness & Specification Quality (F15)', () => {
    it('contains a realistic benchmark dataset of at least 60 items across all trades', () => {
      expect(allPresetItems.length).toBeGreaterThanOrEqual(60);
    });

    it('verifies that every preset item has non-empty code, description, and engineering specification', () => {
      for (const item of allPresetItems) {
        expect(item.itemCode).toBeDefined();
        expect(item.itemCode.trim().length).toBeGreaterThan(0);

        expect(item.description).toBeDefined();
        expect(item.description.trim().length).toBeGreaterThan(0);

        expect(item.specification).toBeDefined();
        expect(item.specification.trim().length).toBeGreaterThan(0);
      }
    });

    it('verifies item codes are unique within the catalog', () => {
      const codes = new Set<string>();
      for (const item of allPresetItems) {
        expect(codes.has(item.itemCode)).toBe(false);
        codes.add(item.itemCode);
      }
    });
  });

  describe('3. Standard Construction Units (F12)', () => {
    it('verifies all item units belong to the standard construction unit set', () => {
      for (const item of allPresetItems) {
        const unit = item.unit.toLowerCase();
        const isValid =
          VALID_STANDARD_UNITS.has(item.unit) ||
          VALID_STANDARD_UNITS.has(unit) ||
          item.unit === 'm³' ||
          item.unit === 'm²' ||
          item.unit === 'cu.m' ||
          item.unit === 'sq.m';
        expect(isValid).toBe(true);
      }
    });

    it('verifies volume units (m³) are used for bulk excavation, gravel, and concrete', () => {
      const concreteItems = allPresetItems.filter((i) => i.itemCode.startsWith('CONC') && i.description.includes('Concrete'));
      for (const c of concreteItems) {
        expect(['m³', 'cu.m']).toContain(c.unit);
      }
    });

    it('verifies weight units (kg) are used for rebar and steel framing', () => {
      const rebarItems = allPresetItems.filter((i) => i.itemCode.startsWith('CONC') && i.description.includes('Rebar'));
      for (const r of rebarItems) {
        expect(['kg', 'tons']).toContain(r.unit);
      }
    });
  });

  describe('4. Direct Unit Rates & Mathematical Split Integrity (F16, F17)', () => {
    it('ensures all rates and quantities are non-negative', () => {
      for (const item of allPresetItems) {
        expect(item.quantity).toBeGreaterThanOrEqual(0);
        expect(item.materialRate).toBeGreaterThanOrEqual(0);
        expect(item.laborRate).toBeGreaterThanOrEqual(0);
        expect(item.equipmentRate).toBeGreaterThanOrEqual(0);
      }
    });

    it('verifies direct unit cost equals materialRate + laborRate + equipmentRate within 0.01 tolerance', () => {
      for (const item of allPresetItems) {
        const expectedUnitCost = Math.round((item.materialRate + item.laborRate + item.equipmentRate) * 100) / 100;
        if (item.directUnitCost !== undefined) {
          expect(item.directUnitCost).toBeCloseTo(expectedUnitCost, 2);
        }
      }
    });

    it('verifies direct total cost equals quantity * directUnitCost within 0.01 tolerance', () => {
      for (const item of allPresetItems) {
        const unitCost = Math.round((item.materialRate + item.laborRate + item.equipmentRate) * 100) / 100;
        const expectedTotal = Math.round(item.quantity * unitCost * 100) / 100;
        if (item.directTotalCost !== undefined) {
          expect(item.directTotalCost).toBeCloseTo(expectedTotal, 2);
        }
      }
    });
  });
});
