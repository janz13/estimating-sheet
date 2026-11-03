/**
 * src/constants/trades.ts
 * Master catalog of the 10 technical construction trades, sub-scope templates, and visualization metadata.
 */

export interface TradeDefinition {
  id: string;
  code: string;
  tradeNumber: number;
  name: string;
  shortName: string;
  sheetName: string;        // Clamped to <= 31 chars for SheetJS Excel export
  iconName: string;         // Guaranteed Lucide React icon name
  accentColor: string;      // Tailwind / Hex color for charts and badges
  subScopeTemplates: {
    id: string;
    code: string;
    name: string;
    description: string;
  }[];
}

export const TECHNICAL_TRADES: TradeDefinition[] = [
  {
    id: 'trade_earthworks',
    code: 'EW',
    tradeNumber: 1,
    name: 'Earthworks & Temporary Works',
    shortName: 'Earthworks',
    sheetName: '01-Earthworks',
    iconName: 'HardHat',
    accentColor: '#D97706', // amber-600
    subScopeTemplates: [
      { id: 'sub_ew_site_prep', code: '01.1', name: 'Site Preparation & Temporary Facilities', description: 'Enclosure, field office, utility connections, clearing, batterboards' },
      { id: 'sub_ew_excavation', code: '01.2', name: 'Earthworks & Excavation', description: 'Footing excavation, trenching, backfill compaction, gravel bedding' },
    ],
  },
  {
    id: 'trade_concrete',
    code: 'CONC',
    tradeNumber: 2,
    name: 'Concrete & Masonry Works',
    shortName: 'Concrete',
    sheetName: '02-Concrete & Masonry',
    iconName: 'Building2',
    accentColor: '#6B7280', // gray-500
    subScopeTemplates: [
      { id: 'sub_conc_structural', code: '02.1', name: 'Structural Concrete', description: 'Ready-mix concrete for footings, tie beams, columns, girders, slabs' },
      { id: 'sub_conc_rebar', code: '02.2', name: 'Reinforcing Steel Bars', description: 'Deformed bars Grade 40/60, stirrups, column ties, tie wire' },
      { id: 'sub_conc_formworks', code: '02.3', name: 'Formworks & Falsework', description: 'Phenolic plywood, shoring jacks, modular scaffolding frames' },
      { id: 'sub_conc_masonry', code: '02.4', name: 'Masonry Works (CHB & Plaster)', description: '150mm/100mm CHB walls, mortar filling, 16mm cement plaster' },
    ],
  },
  {
    id: 'trade_waterproofing',
    code: 'WP',
    tradeNumber: 3,
    name: 'Waterproofing & Moisture Protection',
    shortName: 'Waterproofing',
    sheetName: '03-Waterproofing',
    iconName: 'ShieldCheck',
    accentColor: '#0EA5E9', // sky-500
    subScopeTemplates: [
      { id: 'sub_wp_substructure', code: '03.1', name: 'Substructure & Slab Protection', description: '6-mil polyethylene vapor barrier, chemical termiticide barrier' },
      { id: 'sub_wp_wet_areas', code: '03.2', name: 'Wet Area & Balcony Waterproofing', description: 'Flexible 2-component cementitious membrane, polyurethane liquid membrane' },
      { id: 'sub_wp_roof_deck', code: '03.3', name: 'Roof Deck & Specialty Waterproofing', description: '4mm torch-applied SBS membrane, crystalline slurry & admixtures' },
    ],
  },
  {
    id: 'trade_steel_roofing',
    code: 'STL',
    tradeNumber: 4,
    name: 'Structural Steel and Roofing Works',
    shortName: 'Steel & Roof',
    sheetName: '04-Steel & Roofing',
    iconName: 'Warehouse',
    accentColor: '#475569', // slate-600
    subScopeTemplates: [
      { id: 'sub_stl_framing', code: '04.1', name: 'Structural Steel Framing & Trusses', description: 'Trusses, rafters, cold-formed C-purlins, sag rods, anchor bolts' },
      { id: 'sub_stl_roofing', code: '04.2', name: 'Roof Sheeting & Thermal Insulation', description: 'Pre-painted long-span roofing, ridge rolls, SS box gutters, PE foam insulation' },
    ],
  },
  {
    id: 'trade_carpentry_drywall',
    code: 'CRP',
    tradeNumber: 5,
    name: 'Carpentry and Drywall Works',
    shortName: 'Carpentry',
    sheetName: '05-Carpentry & Drywall',
    iconName: 'Grid',
    accentColor: '#854D0E', // yellow-800
    subScopeTemplates: [
      { id: 'sub_crp_ceilings', code: '05.1', name: 'Ceiling Systems', description: 'Moisture-resistant gypsum board, fiber cement eaves, acoustic grid, shadowlines' },
      { id: 'sub_crp_drywall', code: '05.2', name: 'Drywall Partitions & Acoustic Walls', description: 'Double-sided gypsum partitions, rockwool acoustic insulation, wet partitions' },
      { id: 'sub_crp_millwork', code: '05.3', name: 'Architectural Carpentry & Millwork', description: 'Custom kitchen base/wall cabinets, built-in bedroom wardrobe closets' },
    ],
  },
  {
    id: 'trade_doors_windows',
    code: 'DW',
    tradeNumber: 6,
    name: 'Doors, Windows & Architectural Metals',
    shortName: 'Doors & Windows',
    sheetName: '06-Doors & Windows',
    iconName: 'DoorOpen',
    accentColor: '#10B981', // emerald-500
    subScopeTemplates: [
      { id: 'sub_dw_doors', code: '06.1', name: 'Doors & Hardware Sets', description: 'Hardwood entrance pivot door, timber bedroom doors, PVC bath doors, fire-exit doors' },
      { id: 'sub_dw_windows', code: '06.2', name: 'Windows & Glazing Systems', description: 'Powder-coated sliding windows, awning windows, frameless shower enclosures' },
      { id: 'sub_dw_metals', code: '06.3', name: 'Architectural Metals & Railings', description: 'Stainless steel 304 stair railing, decorative powder-coated balcony grilles' },
    ],
  },
  {
    id: 'trade_finishes_painting',
    code: 'FIN',
    tradeNumber: 7,
    name: 'Finishes and Painting Works',
    shortName: 'Finishes',
    sheetName: '07-Finishes & Painting',
    iconName: 'Paintbrush',
    accentColor: '#EC4899', // pink-500
    subScopeTemplates: [
      { id: 'sub_fin_tiles', code: '07.1', name: 'Floor & Wall Tile Finishes', description: '600x600 porcelain tiles, anti-slip bathroom tiles, ceramic wall tiles, SPC vinyl flooring' },
      { id: 'sub_fin_painting', code: '07.2', name: 'Painting Works', description: 'Interior semi-gloss emulsion, flat ceiling paint, exterior elastomeric paint, skim coat render' },
    ],
  },
  {
    id: 'trade_plumbing',
    code: 'PLB',
    tradeNumber: 8,
    name: 'Plumbing Rough-In Works',
    shortName: 'Plumbing',
    sheetName: '08-Plumbing',
    iconName: 'Wrench',
    accentColor: '#06B6D4', // cyan-500
    subScopeTemplates: [
      { id: 'sub_plb_water_supply', code: '08.1', name: 'Water Supply Piping & Valves', description: 'PPR PN-20 pipes, brass gate/ball valves, water meter intake assembly, water heaters' },
      { id: 'sub_plb_sanitary', code: '08.2', name: 'Sanitary Drainage & Vent Piping', description: 'uPVC Series 1000 soil pipes 100mm/50mm, stainless floor drains, roof vent stacks' },
      { id: 'sub_plb_storm', code: '08.3', name: 'Storm Drainage & Site Plumbing', description: 'Downspout piping, precast catch basins with grates, 3-chamber concrete septic vault' },
    ],
  },
  {
    id: 'trade_electrical',
    code: 'ELEC',
    tradeNumber: 9,
    name: 'Electrical Rough-In Works',
    shortName: 'Electrical',
    sheetName: '09-Electrical',
    iconName: 'Zap',
    accentColor: '#EAB308', // yellow-500
    subScopeTemplates: [
      { id: 'sub_elec_conduits', code: '09.1', name: 'Conduits, Raceways & Enclosures', description: 'uPVC electrical conduits 20mm/25mm, stamped steel utility boxes, distribution panelboards' },
      { id: 'sub_elec_wiring', code: '09.2', name: 'Wires, Cables & Grounding System', description: 'THHN/THWN copper building wires #12/#10 AWG, service feeder cables, grounding electrode' },
      { id: 'sub_elec_auxiliary', code: '09.3', name: 'Auxiliary Rough-In & Communications', description: 'Cat6 UTP network cabling, RG-6 coaxial and CCTV security conduit rough-ins' },
    ],
  },
  {
    id: 'trade_mechanical_fire',
    code: 'MECH',
    tradeNumber: 10,
    name: 'Mechanical & Fire Protection Works',
    shortName: 'Mech & Fire',
    sheetName: '10-Mech & Fire Safety',
    iconName: 'Flame',
    accentColor: '#EF4444', // red-500
    subScopeTemplates: [
      { id: 'sub_mech_hvac', code: '10.1', name: 'HVAC Rough-In & Ventilation', description: 'Inverter AC copper refrigerant piping, insulated drain lines, exhaust fans, range hood ducting' },
      { id: 'sub_mech_fire', code: '10.2', name: 'Fire Suppression & Fire Alarm', description: 'Black iron Sch 40 piping, quick response sprinkler heads, fire hose stations, 4-zone FACP' },
    ],
  },
];
