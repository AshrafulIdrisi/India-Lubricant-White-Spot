import { LocationRecord, ScoringWeights, FinancialAssumptions, FinancialBusinessCase, OpportunityCategory } from '../types';

export const DEFAULT_WEIGHTS: ScoringWeights = {
  demandPotential: 35,
  supplyGap: 20,
  competitorGap: 15,
  accessibilityGap: 10,
  industrialGrowth: 10,
  vehicleGrowth: 5,
  logisticsGrowth: 5
};

export const DEFAULT_FINANCIAL_ASSUMPTIONS: FinancialAssumptions = {
  scenario: 'Base',
  targetMarketSharePct: 15.0,
  avgSellingPricePerLiterINR: 285.0,
  grossMarginPct: 26.5,
  warehouseRentPerSqFtINR: 28.0,
  transportCostPerKLKmINR: 3.2,
  staffingCostMonthlyINR: 250000,
  initialCapexINR: 3.5, // 3.5 Crores
  discountRatePct: 12.0
};

export function recalculateWhiteSpotScore(location: LocationRecord, weights: ScoringWeights): number {
  const totalWeight = Object.values(weights).reduce((acc, w) => acc + w, 0) || 100;
  
  const rawScore = 
    (location.demandPotentialScore * weights.demandPotential) +
    (location.supplyGapScore * weights.supplyGap) +
    (location.competitorGapScore * weights.competitorGap) +
    (location.accessibilityGapScore * weights.accessibilityGap) +
    (location.industrialGrowthScore * weights.industrialGrowth) +
    (location.vehicleGrowthScore * weights.vehicleGrowth) +
    (location.logisticsGrowthScore * weights.logisticsGrowth);
    
  return parseFloat((rawScore / totalWeight).toFixed(1));
}

export function classifyOpportunityTier(score: number): OpportunityCategory {
  if (score >= 80) return 'Critical White Spot';
  if (score >= 60) return 'High Opportunity';
  if (score >= 40) return 'Moderate Opportunity';
  if (score >= 20) return 'Low Opportunity';
  return 'Saturated';
}

export function calculateBusinessCase(
  location: LocationRecord,
  assumptions: FinancialAssumptions
): FinancialBusinessCase {
  // Captured volume based on supply gap and target market share
  const targetShare = assumptions.targetMarketSharePct / 100;
  const capturedVolumeKL = location.supplyGapKL * targetShare;
  
  // Gross Revenue in INR Crores (Volume in Liters * ASP / 10,000,000)
  const capturedVolumeLiters = capturedVolumeKL * 1000;
  const annualRevenueINR = (capturedVolumeLiters * assumptions.avgSellingPricePerLiterINR) / 10000000;
  
  // Gross Margin in Crores
  const grossMarginINR = annualRevenueINR * (assumptions.grossMarginPct / 100);
  
  // Annual OPEX (Warehouse rent + Transport freight + Staffing + Overheads)
  // Assume 12,000 sq ft warehouse
  const annualRentCrores = (12000 * assumptions.warehouseRentPerSqFtINR * 12) / 10000000;
  const avgDistance = location.supply.avgAccessibilityDistanceKm || 15;
  const annualFreightCrores = (capturedVolumeKL * avgDistance * assumptions.transportCostPerKLKmINR) / 10000000;
  const annualStaffingCrores = (assumptions.staffingCostMonthlyINR * 12) / 10000000;
  const annualUtilitiesAndInsuranceCrores = 0.25; // 25 Lakhs
  
  const annualOpexINR = annualRentCrores + annualFreightCrores + annualStaffingCrores + annualUtilitiesAndInsuranceCrores;
  
  // EBITDA in Crores
  const annualEbitdaINR = Math.max(0.01, grossMarginINR - annualOpexINR);
  
  // CAPEX & Payback
  const capexInvestmentINR = assumptions.initialCapexINR;
  const paybackPeriodYears = parseFloat((capexInvestmentINR / annualEbitdaINR).toFixed(2));
  
  // 5-Year Cumulative ROI (%)
  const fiveYearEbitda = annualEbitdaINR * 5;
  const fiveYearRoiPct = parseFloat((((fiveYearEbitda - capexInvestmentINR) / capexInvestmentINR) * 100).toFixed(1));
  const netMarginPct = parseFloat(((annualEbitdaINR / annualRevenueINR) * 100).toFixed(1));
  
  return {
    capturedVolumeKL: Math.round(capturedVolumeKL),
    annualRevenueINR: parseFloat(annualRevenueINR.toFixed(2)),
    grossMarginINR: parseFloat(grossMarginINR.toFixed(2)),
    annualOpexINR: parseFloat(annualOpexINR.toFixed(2)),
    annualEbitdaINR: parseFloat(annualEbitdaINR.toFixed(2)),
    capexInvestmentINR,
    paybackPeriodYears,
    fiveYearRoiPct,
    netMarginPct
  };
}

export function formatINR(valCrores: number): string {
  return `₹${valCrores.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Cr`;
}

export function formatKL(valKL: number): string {
  return `${valKL.toLocaleString('en-IN')} KL/yr`;
}
