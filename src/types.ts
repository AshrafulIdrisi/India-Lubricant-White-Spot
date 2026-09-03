export type GeographicLevel = 'national' | 'state' | 'district' | 'city' | 'pincode' | 'grid';
export type GridResolution = '1km' | '2km' | '5km' | '10km';
export type WhiteSpotType = 
  | 'Type A — Demand White Spot'
  | 'Type B — Accessibility White Spot'
  | 'Type C — Distributor White Spot'
  | 'Type D — Industrial White Spot'
  | 'Type E — Automotive White Spot'
  | 'Type F — Agricultural White Spot'
  | 'Type G — Logistics White Spot'
  | 'Type H — Future White Spot';

export type OpportunityCategory = 'Critical White Spot' | 'High Opportunity' | 'Moderate Opportunity' | 'Low Opportunity' | 'Saturated';

export type DataSourceType = 'actual' | 'estimated' | 'modeled' | 'proxy';

export interface DataConfidenceMeta {
  source: string;
  sourceOwner: string;
  updateFrequency: string;
  lastUpdated: string;
  confidenceScore: number; // 0 - 100
  dataType: DataSourceType;
  methodology: string;
}

export type LubricantCategory = 
  | 'Automotive — Personal Mobility'
  | 'Commercial Vehicles & Fleets'
  | 'Industrial Lubricants'
  | 'Agricultural Machinery'
  | 'Mining & Off-Highway'
  | 'Electric Vehicle & Thermal Fluids';

export interface LubricantProduct {
  id: string;
  sku: string;
  name: string;
  category: LubricantCategory | string;
  subCategory: string;
  viscosityGrade: string;
  packSizes: string[];
  baseOilGroup: string;
  specifications: string[];
  applications: string[];
  avgSellingPricePerLiterINR: number; // in INR
  grossMarginPct: number; // e.g. 28%
  demandMultiplier: number;
  evVulnerability: string;
  description: string;
}

export interface VehicleBreakdown {
  twoWheelers: number;
  passengerCars: number;
  suvs: number;
  threeWheelers: number;
  lightCommercialVehicles: number;
  mediumHeavyTrucks: number;
  buses: number;
  tractorsAndAgri: number;
  miningOffHighway: number;
  avgFleetAgeYears: number;
  annualVehicleGrowthRatePct: number;
}

export interface IndustrialBreakdown {
  manufacturingUnits: number;
  steelAndMetalPlants: number;
  cementPlants: number;
  powerPlantsMW: number;
  textileAndPharmaUnits: number;
  chemicalsAndFoodProcessing: number;
  machineToolsCount: number;
  miningQuarriesCount: number;
  industrialPowerLoadMW: number;
  annualIndustrialGrowthRatePct: number;
}

export interface LogisticsBreakdown {
  nationalHighwayLengthKm: number;
  freightCorridorPassing: boolean;
  logisticsParksCount: number;
  truckTerminalsCount: number;
  containerDepotsCount: number;
  portProximityKm: number;
  dailyTruckTransitCount: number;
}

export interface AgriBreakdown {
  grossCroppedAreaHectares: number;
  tractorDensityPer1000Ha: number;
  tubewellDieselPumpsCount: number;
  combineHarvestersCount: number;
  croppingIntensityPct: number;
}

export interface ExistingSupplyData {
  primaryDepotsCount: number;
  masterDistributorsCount: number;
  retailLubricantOutletsCount: number;
  authorizedWorkshopsCount: number;
  industrialSuppliersCount: number;
  totalCompetitorPoints: number;
  estimatedAccessibleSupplyKL: number; // KiloLiters per year
  topBrandsPresent: string[];
  avgAccessibilityDistanceKm: number;
  accessibilityCategory: string;
}

export interface LocationRecord {
  id: string;
  name: string;
  stateCode: string;
  stateName: string;
  region: 'North' | 'South' | 'West' | 'East' | 'Central' | 'North-East';
  level: GeographicLevel;
  parentDistrict?: string;
  latitude: number;
  longitude: number;
  areaSqKm: number;
  population: number;
  whiteSpotRank?: number;
  
  // Sector breakdowns
  vehicles: VehicleBreakdown;
  industry: IndustrialBreakdown;
  logistics: LogisticsBreakdown;
  agriculture: AgriBreakdown;
  supply: ExistingSupplyData;
  
  // Calculated Demand Metrics (in KL / Year)
  automotiveDemandKL: number;
  commercialVehicleDemandKL: number;
  industrialDemandKL: number;
  agriculturalDemandKL: number;
  miningDemandKL: number;
  logisticsDemandKL: number;
  totalEstimatedDemandKL: number;
  
  // White Spot & Gap Metrics
  supplyGapKL: number; // Demand - Supply
  supplyCoverageRatioPct: number; // (Supply / Demand) * 100
  competitorDensityIndex: number; // Outlets per 1000 KL
  unmetOpportunityValueINR: number; // in INR Crores
  
  // Scores (0 - 100)
  demandPotentialScore: number;
  supplyGapScore: number;
  competitorGapScore: number;
  accessibilityGapScore: number;
  industrialGrowthScore: number;
  vehicleGrowthScore: number;
  logisticsGrowthScore: number;
  whiteSpotScore: number; // Composite weighted score
  
  whiteSpotType: WhiteSpotType | string;
  opportunityTier: OpportunityCategory;
  confidenceMeta: DataConfidenceMeta;
  
  // Forecasts (KL / Year)
  demand2027KL: number;
  demand2029KL: number;
  demand2031KL: number;
  demand2036KL: number;
  cagrForecastPct: number;
  evShiftRiskPct: number;
  evOpportunityScore: number;
  
  // Facility Recommendation
  recommendedFacility: string;
  recommendedStorageCapacityKL: number;
  recommendedSafetyStockKL: number;
  
  // Strategic drivers for explainability
  explainabilityDrivers: string[];
  keyIndustries: string[];
  upcomingProjects: string[];
}

export interface ScoringWeights {
  demandPotential: number;     // e.g. 35
  supplyGap: number;           // e.g. 20
  competitorGap: number;       // e.g. 15
  accessibilityGap: number;    // e.g. 10
  industrialGrowth: number;    // e.g. 10
  vehicleGrowth: number;       // e.g. 5
  logisticsGrowth: number;     // e.g. 5
}

export interface FinancialAssumptions {
  scenario: 'Conservative' | 'Base' | 'Aggressive';
  targetMarketSharePct: number;
  avgSellingPricePerLiterINR: number;
  grossMarginPct: number;
  warehouseRentPerSqFtINR: number;
  transportCostPerKLKmINR: number;
  staffingCostMonthlyINR: number;
  initialCapexINR: number; // In Crores
  discountRatePct: number;
}

export interface FinancialBusinessCase {
  capturedVolumeKL: number;
  annualRevenueINR: number; // in Crores
  grossMarginINR: number;   // in Crores
  annualOpexINR: number;    // in Crores
  annualEbitdaINR: number;  // in Crores
  capexInvestmentINR: number; // in Crores
  paybackPeriodYears: number;
  fiveYearRoiPct: number;
  netMarginPct: number;
}

export interface WarehouseOptimizationNode {
  id: string;
  clusterName: string;
  latitude: number;
  longitude: number;
  servedDistricts: string[];
  servingDistricts?: string[];
  totalServedDemandKL: number;
  aggregatedDemandKL?: number;
  recommendedCapacityKL: number;
  monthlyPeakDemandKL?: number;
  safetyStockKL?: number;
  avgDeliveryDistanceKm?: number;
  annualFreightCostINR?: number;
  depotType?: string;
  facilityTier?: string;
  serviceRadiusKm?: number;
  avgDeliveryLeadTimeHours?: number;
  estimatedCapexINR?: number;
  freightCostSavingsINR?: number;
  highwayProximity?: string;
  portProximity?: string;
}

export interface ForecastHorizon {
  year: number;
  totalDemandKL: number;
  automotiveDemandKL: number;
  industrialDemandKL: number;
  agriDemandKL: number;
  miningDemandKL: number;
  evFluidsDemandKL: number;
  evPenetrationPct: number;
}

export interface UpcomingMegaProject {
  id: string;
  name: string;
  location: string;
  category: string;
  commissioningYear: number;
  investmentSizeINR: number; // Crores
  expectedLubeDemandBoostKL: number;
  impactDescription: string;
}

export type DistributorPerformanceTier = 
  | 'Dominant Leader' 
  | 'High Performer' 
  | 'Capacity Constrained' 
  | 'Moderate' 
  | 'Vulnerable / Stagnant';

export interface OsmMetadata {
  osmId?: string;
  osmType?: 'node' | 'way' | 'relation';
  osmTags?: Record<string, string>;
  source: 
    | 'OpenStreetMap Ground Verified' 
    | 'Audited OMC Depot' 
    | 'Live Overpass Fetch' 
    | 'OSM GeoJSON Import'
    | 'PACS / Primary Agricultural Credit Society'
    | 'Cooperative Marketing Federation (Agro)'
    | 'Transport Nagar Siding'
    | 'State Industrial Estate Registry'
    | string;
  amenity?: string;
  shop?: string;
  operator?: string;
  openingHours?: string;
  website?: string;
  osmUrl?: string;
  confidenceScore?: number;
}

export interface DistributorRecord {
  id: string;
  name: string;
  brand: string;
  parentCompany: string;
  distributorType: 
    | 'Master Distributor' 
    | 'Super Stockist' 
    | 'Industrial Channel Partner' 
    | 'Direct OMC Depot' 
    | 'Institutional C&F' 
    | 'Wholesale Hub'
    | 'PACS / Agri Cooperative Stockist'
    | 'Transport Nagar Hub'
    | 'OMC Retail Lubricant Outlet'
    | 'Multi-Brand Auto Retailer'
    | string;
  district: string;
  stateCode: string;
  stateName: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  monthlyThroughputKL: number;
  annualVolumeKL: number;
  warehouseCapacityKL: number;
  coverageRadiusKm: number;
  primarySector: 
    | 'Automotive Retail (PCMO/MCO)' 
    | 'Commercial Fleets (HDEO)' 
    | 'Industrial & Metalworking' 
    | 'Agri Machinery & UTTO' 
    | 'Multi-Segment Full-Line'
    | 'Port Marine & Bunkering'
    | 'Mining & Heavy Off-Highway'
    | string;
  dealerNetworkCount: number;
  industrialAccountsCount: number;
  avgLeadTimeDays: number;
  marketShareInDistrictPct: number;
  performanceTier: DistributorPerformanceTier;
  establishedYear: number;
  contactPerson: string;
  contactPhone: string;
  topSellingSKUs: string[];
  whiteSpotProximityKm: number;
  targetWhiteSpotId?: string;
  osmMeta?: OsmMetadata;
}

export interface AlertNotification {
  id: string;
  title: string;
  locationName: string;
  state: string;
  severity: 'critical' | 'high' | 'medium';
  type: 'Demand Surge' | 'Supply Gap Warning' | 'Upcoming Mega Project' | 'Competitor Entry' | 'EV Transition Notice';
  message: string;
  metricChange: string;
  timestamp: string;
}

export type CompanyCategory = 'OMC Public Sector' | 'MNC Major' | 'Indian Private Independent' | 'Specialty & Premium';

export interface SectorVolumeShare {
  sector: string;
  sharePct: number;
  volumeKL: number;
}

export interface BrandCompanyData {
  id: string;
  brandName: string;
  parentCompany: string;
  companyType: CompanyCategory;
  nationalMarketSharePct: number; // e.g. 27.0%
  volumeMillionKL: number; // e.g. 1.54 M KL
  nationalSupplyVolumeKL: number; // e.g. 1,540,000 KL
  basis: string; // e.g. 'Sourced (IOCL website)' or 'Estimated'
  confidence: 'High — company-disclosed' | 'Low — modeled' | 'Very low — residual';
  nationalRevenueINR: number; // in Crores
  blendingCapacityKL: number; // in KL / year
  capacityUtilizationPct: number; // e.g. 79.6%
  plantLocations: string[];
  headquarters: string;
  sectorStrengths: SectorVolumeShare[];
  // National Supply & Distribution Coverage Metrics
  clusterSupplyVolumeKL: number; // Volume supplied
  clusterMarketSharePct: number; // Share
  clusterDeficitExposureKL: number; // Deficit exposure
  // Distribution Infrastructure
  distributorCountNational?: number;
  avgDistributorThroughputKL?: number;
  depotCountNational: number;
  retailDealerNetworkCount: number;
  authorizedWorkshopsCount: number;
  directIndustrialAccounts: number;
  flagshipSKUs: string[];
  avgPriceRealizationPerLiterINR: number;
  pricingTier: 'Economy' | 'Mid-Tier' | 'Premium Synthetic' | 'OEM & Industrial' | 'Specialty & Premium';
  keyStrengths: string[];
  whiteSpotVulnerabilities: string[];
}

export interface MacroMarketReconciliation {
  totalNationalMarketKL: number; // 5,700,000 KL (₹91,200 Crores)
  totalNationalValueINR: number; // 91,200 Crores
  automotiveDemandKL: number; // 3,420,000 KL (60%)
  industrialDemandKL: number; // 1,995,000 KL (35%)
  specialtyAgriMarineDemandKL: number; // 285,000 KL (5%)
  analyzedClusterDemandKL: number; // 5,700,000 KL (100% of India Total)
  analyzedClusterSupplyKL: number; // 4,192,665 KL
  analyzedClusterGapKL: number; // 1,507,335 KL
  analyzedClusterOpportunityINR: number; // 24,117.4 Crores
  clusterShareOfNationalPct: number; // 100.0%
  dataSources: {
    name: string;
    entity: string;
    metrics: string;
    period: string;
  }[];
}

