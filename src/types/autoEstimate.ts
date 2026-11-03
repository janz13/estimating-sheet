/**
 * src/types/autoEstimate.ts
 * Domain types for Automated Parametric Estimating (Philippine Construction Cost Standards).
 */

export type ConstructionTier = 'low' | 'mid' | 'high';
export type WallConstructionType = 'all_chb' | 'part_chb_part_drywall';

export interface AutoEstimateParams {
  storeys: number;             // 1, 2, or 3 storeys
  storeyHeight: number;        // Height per storey in meters (default: 3.0m)
  groundFloorArea: number;     // Floor 1 area (m²)
  secondFloorArea: number;     // Floor 2 area (m²)
  thirdFloorArea: number;      // Floor 3 area (m²)
  tier: ConstructionTier;      // 'low' | 'mid' | 'high'
  customRatePerSqM?: number;   // Override rate in PHP/m²
  bedroomsFloor1: number;      // Bed count Floor 1
  bedroomsFloor2: number;      // Bed count Floor 2
  bathroomsFloor1: number;     // Bath count Floor 1
  bathroomsFloor2: number;     // Bath count Floor 2
  doorsCount: number;          // Total doors
  windowsCount: number;        // Total windows
  wallType: WallConstructionType; // 'all_chb' | 'part_chb_part_drywall'
}

export interface TradeEstimateBreakdown {
  tradeId: string;
  tradeCode: string;
  tradeName: string;
  percentageShare: number;
  directCost: number;
  description: string;
}

export interface AutoEstimateResult {
  totalFloorArea: number;
  baseRatePerSqM: number;
  effectiveRatePerSqM: number;
  totalDirectCost: number;
  lowRangeTotal: number;
  highRangeTotal: number;
  estimatedGrandTotal: number; // Includes estimated markups (OCM, Profit, VAT)
  tradeBreakdowns: TradeEstimateBreakdown[];
  summaryNotes: string[];
}
