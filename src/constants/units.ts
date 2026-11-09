/**
 * src/constants/units.ts
 * Construction units of measure definitions, descriptions, and category groupings.
 */

import { StandardUnit } from '../types/estimate';

export interface UnitDefinition {
  unit: StandardUnit;
  label: string;
  description: string;
  category: 'Volume' | 'Area' | 'Length' | 'Weight' | 'Count' | 'Lump Sum';
}

export const CONSTRUCTION_UNITS: UnitDefinition[] = [
  { unit: 'm³', label: 'Cubic Meters (m³)', description: 'Volume measurement for excavation, concrete, gravel bedding', category: 'Volume' },
  { unit: 'm²', label: 'Square Meters (m²)', description: 'Surface area for masonry, drywall, tiling, painting, waterproofing, roofing', category: 'Area' },
  { unit: 'lm', label: 'Linear Meters (lm)', description: 'Length measurement for pipes, conduits, wires, gutters, railings, moldings', category: 'Length' },
  { unit: 'kg', label: 'Kilograms (kg)', description: 'Mass measurement for reinforcing steel rebar, structural steel shapes', category: 'Weight' },
  { unit: 'tons', label: 'Metric Tons (tons)', description: 'Heavy structural steel framing', category: 'Weight' },
  { unit: 'sets', label: 'Sets (sets)', description: 'Complete assemblies (doors, windows, panelboards, equipment)', category: 'Count' },
  { unit: 'pcs', label: 'Pieces (pcs)', description: 'Discrete items (junction boxes, floor drains, sprinkler heads, locksets)', category: 'Count' },
  { unit: 'bags', label: 'Bags (bags)', description: 'Bagged materials (40kg Portland cement, 25kg tile adhesive, skim coat)', category: 'Count' },
  { unit: 'sheets', label: 'Sheets (sheets)', description: '4\'x8\' boards & sheets (phenolic plywood, gypsum, HardieFlex, G.I. sheets)', category: 'Count' },
  { unit: 'rolls', label: 'Rolls (rolls)', description: 'Rolled materials (THHN wire boxes/coils, PE foam, vapor barriers, mesh)', category: 'Count' },
  { unit: 'gals', label: 'Gallons / 4L (gals)', description: '4-Liter paint cans, primers, waterproofing & elastomeric coatings', category: 'Volume' },
  { unit: 'liters', label: 'Liters (liters)', description: 'Liquid coatings, chemical sealers, termiticides, admixtures', category: 'Volume' },
  { unit: 'points', label: 'Points (points)', description: 'Electrical outlet drops, data drops, smoke detector drops', category: 'Count' },
  { unit: 'lot', label: 'Lump Sum (lot)', description: 'Project-wide allowance (temporary facilities, septic vault, mobilization)', category: 'Lump Sum' },
];

export const VALID_UNIT_VALUES: StandardUnit[] = CONSTRUCTION_UNITS.map(u => u.unit);
