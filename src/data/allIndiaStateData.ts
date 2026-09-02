import { LubricantCategory } from '../types';

export interface StateMacroData {
  stateCode: string;
  stateName: string;
  region: 'North' | 'South' | 'West' | 'East' | 'Central' | 'North-East';
  isUnionTerritory: boolean;
  totalDemandKL: number; // Annual demand in KL (sums to 5,700,000 KL nationally)
  nationalSharePct: number; // % of 5.70M KL
  marketValueINR: number; // in ₹ Crores (at ~₹160/L avg realization)
  
  // Sector Breakdown in KL
  automotiveDemandKL: number; // ~60% national
  industrialDemandKL: number; // ~35% national
  agriculturalDemandKL: number; // ~5% national
  miningOffHighwayKL: number;
  
  // Supply & Opportunity
  accessibleSupplyKL: number;
  supplyGapKL: number;
  coverageRatioPct: number;
  unmetOpportunityINR: number; // ₹ Crores
  whiteSpotScore: number; // 0-100
  priorityTier: 'Tier 1 — High Demand Core' | 'Tier 2 — Industrial Growth' | 'Tier 3 — Expanding Market' | 'Tier 4 — Regional Frontier';
  
  // Infrastructure & Macro Metrics
  registeredVehiclesCount: number;
  registeredTrucksCVCount: number;
  manufacturingUnitsCount: number;
  industrialPowerLoadMW: number;
  primaryDepotsCount: number;
  blendingPlantsCount: number;
  dealerOutletsCount: number;
  
  // Top Consuming Industrial & Transport Districts
  topDistricts: {
    districtName: string;
    demandKL: number;
    shareOfStatePct: number;
    primarySector: string;
    whiteSpotGapKL: number;
  }[];
  
  // Qualitative Insights
  growthDrivers: string[];
  keyIndustries: string[];
  majorLubricantSuppliers: string[];
}

export interface StateWhiteSpotVectors {
  ruralAgriGapKL: number;
  unorganizedLubeGapKL: number;
  msmeIndustrialPailGapKL: number;
  highwayLogisticsGapKL: number;
  dominantGapVector: 'Rural Agri-Mandis' | 'Unorganized Lube Displacement' | 'MSME Industrial Pails' | 'Highway Freight Logistics';
}

export interface StateStrategicRoadmap {
  primaryAction: string;
  recommendedDepotLocations: string[];
  targetStockistCount: number;
  priorityTargetSKUs: string[];
  estimatedAddressableRevenueINR: number;
  fastTrackEBITDAPct: number;
  timeToDeployMonths: number;
}

export function getStateWhiteSpotVectors(state: StateMacroData): StateWhiteSpotVectors {
  const gap = state.supplyGapKL;
  const indShare = state.industrialDemandKL / state.totalDemandKL;
  const agriShare = state.agriculturalDemandKL / state.totalDemandKL;
  const autoShare = state.automotiveDemandKL / state.totalDemandKL;

  let ruralWeight = 0.344;
  let unorgWeight = 0.272;
  let msmeWeight = 0.219;
  let logWeight = 0.165;

  if (agriShare > 0.06) {
    ruralWeight = 0.42;
    msmeWeight = 0.18;
    logWeight = 0.16;
    unorgWeight = 0.24;
  } else if (indShare > 0.40) {
    msmeWeight = 0.38;
    ruralWeight = 0.18;
    logWeight = 0.20;
    unorgWeight = 0.24;
  } else if (state.registeredTrucksCVCount > 1500000) {
    logWeight = 0.25;
    unorgWeight = 0.30;
    ruralWeight = 0.25;
    msmeWeight = 0.20;
  }

  const totalWeight = ruralWeight + unorgWeight + msmeWeight + logWeight;
  const ruralAgriGapKL = Math.round(gap * (ruralWeight / totalWeight));
  const msmeIndustrialPailGapKL = Math.round(gap * (msmeWeight / totalWeight));
  const highwayLogisticsGapKL = Math.round(gap * (logWeight / totalWeight));
  const unorganizedLubeGapKL = gap - (ruralAgriGapKL + msmeIndustrialPailGapKL + highwayLogisticsGapKL);

  let dominant: StateWhiteSpotVectors['dominantGapVector'] = 'Rural Agri-Mandis';
  const maxVal = Math.max(ruralAgriGapKL, unorganizedLubeGapKL, msmeIndustrialPailGapKL, highwayLogisticsGapKL);
  if (maxVal === msmeIndustrialPailGapKL) dominant = 'MSME Industrial Pails';
  else if (maxVal === highwayLogisticsGapKL) dominant = 'Highway Freight Logistics';
  else if (maxVal === unorganizedLubeGapKL) dominant = 'Unorganized Lube Displacement';

  return {
    ruralAgriGapKL,
    unorganizedLubeGapKL,
    msmeIndustrialPailGapKL,
    highwayLogisticsGapKL,
    dominantGapVector: dominant
  };
}

export function getStateStrategicRoadmap(state: StateMacroData): StateStrategicRoadmap {
  const vectors = getStateWhiteSpotVectors(state);
  const stockistCount = Math.max(4, Math.round(state.supplyGapKL / 4500));
  
  let recommendedDepots: string[] = [];
  let prioritySKUs: string[] = [];
  let primaryAction = '';

  if (state.stateCode === 'MH') {
    recommendedDepots = ['Nashik Ambad Hub', 'Nagpur Butibori C&F', 'Kolhapur Shiroli Node'];
    prioritySKUs = ['Slideway 68 & ISO VG 46', '15W-40 CK-4 Truck Fleet', 'Water-Soluble Metal Coolants'];
    primaryAction = 'Deploy 2 Secondary C&F Depots in Nashik and Nagpur to service semi-urban MIDC zones';
  } else if (state.stateCode === 'GJ') {
    recommendedDepots = ['Bharuch-Ankleshwar PCPIR Buffer', 'Rajkot Shapar-Veraval Hub', 'Morbi Ceramic Cluster'];
    prioritySKUs = ['Compressor Oils ISO 68', 'Synthetic Industrial Gear EP-320', 'Ceramic Hydraulic AW-68'];
    primaryAction = 'Establish direct B2B bulk & tote packaging supply in Bharuch PCPIR & Rajkot pump clusters';
  } else if (state.stateCode === 'TN') {
    recommendedDepots = ['Coimbatore Peelamedu Node', 'Hosur Sipcot Hub', 'Madurai South Buffer'];
    prioritySKUs = ['Neat Cutting Oils & Soluble Fluids', 'High-Speed Spindle Oils', 'Semi-Synthetic 4T 10W-30'];
    primaryAction = 'Launch 20L/50L MSME Pail series targeting 5,800 machine tooling & textile units';
  } else if (state.stateCode === 'UP') {
    recommendedDepots = ['Kanpur Panki Hub', 'Varanasi-Mughalsarai Node', 'Gorakhpur Agri Staging'];
    prioritySKUs = ['UTTO Universal Tractor Fluid', 'Heavy Multi-Grade 20W-50', '20W-40 4T Motorcycle Oil'];
    primaryAction = 'Appoint 38 Tier-3 Sub-Stockists across eastern agricultural mandis & NH corridors';
  } else if (state.stateCode === 'RJ') {
    recommendedDepots = ['Neemrana Japanese Zone Hub', 'Bhilwara Textile Buffer', 'Jodhpur Heavy Stone Staging'];
    prioritySKUs = ['Slideway 68 & Soluble Coolants', 'Heavy Truck 15W-40 CI-4+', 'Hydraulic AW-68'];
    primaryAction = 'Deploy express 24-hr C&F buffer in Neemrana for DMIC Japanese corridor machine shops';
  } else if (state.stateCode === 'OR') {
    recommendedDepots = ['Jharsuguda Core Hub', 'Angul-Jajpur Metals Buffer', 'Rayagada Staging'];
    prioritySKUs = ['ISO VG 68 Heavy Hydraulic', 'Synthetic Gear EP-460', 'Extreme Pressure Lithium Grease'];
    primaryAction = 'Set up dedicated bulk barrel & tote dispensing depot near Kalinganagar steel plants';
  } else if (state.stateCode === 'CG') {
    recommendedDepots = ['Raipur Urla-Siltara Hub', 'Korba Power & Coal Node'];
    prioritySKUs = ['Heavy Earthmover 15W-40', 'ISO VG 68 Hydraulic', 'High-Temp Synthetic Greases'];
    primaryAction = 'Launch mobile lubricant testing and direct fleet dispensing for coal and sponge iron fleets';
  } else if (state.stateCode === 'PB' || state.stateCode === 'HR') {
    recommendedDepots = ['Ludhiana Focal Point Hub', 'Jalandhar Auto Buffer', 'Panipat Industrial Node'];
    prioritySKUs = ['UTTO Agri Wet Brake Fluid', 'Neat Cutting Oils & Soluble Coolants', 'Multi-Grade 15W-40'];
    primaryAction = 'Launch direct-to-mechanic loyalty app and seasonal UTTO harvesting bulk discounts';
  } else {
    recommendedDepots = [`${state.stateName} Central Logistics Node`, `${state.stateName} Secondary Transit Hub`];
    prioritySKUs = ['15W-40 Commercial Fleet Lube', 'Hydraulic AW-68 / AW-46', '20W-40 4T Premium Motorcycle Oil'];
    primaryAction = `Appoint ${stockistCount} exclusive stockists and establish direct garage supply network`;
  }

  return {
    primaryAction,
    recommendedDepotLocations: recommendedDepots,
    targetStockistCount: stockistCount,
    priorityTargetSKUs: prioritySKUs,
    estimatedAddressableRevenueINR: Math.round(state.supplyGapKL * 0.16 * 10) / 10,
    fastTrackEBITDAPct: 21.5,
    timeToDeployMonths: state.priorityTier.includes('Tier 1') ? 6 : state.priorityTier.includes('Tier 2') ? 9 : 12
  };
}

export interface ZoneMacroData {
  zoneName: 'West' | 'North' | 'South' | 'East' | 'Central' | 'North-East';
  statesCount: number;
  totalDemandKL: number;
  shareOfNationalPct: number;
  totalValueINR: number; // ₹ Crores
  accessibleSupplyKL: number;
  supplyGapKL: number;
  coverageRatioPct: number;
  automotiveDemandKL: number;
  industrialDemandKL: number;
  agriMiningDemandKL: number;
  leadStates: string[];
  keyHubs: string[];
}

// 6 MACRO GEOGRAPHICAL ZONES (Sum = 5,700,000 KL / 5.70 Million KL / ₹91,200 Cr)
export const ALL_INDIA_ZONES_DATA: ZoneMacroData[] = [
  {
    zoneName: 'West',
    statesCount: 4,
    totalDemandKL: 1710000, // 30.0% of India
    shareOfNationalPct: 30.0,
    totalValueINR: 27360,
    accessibleSupplyKL: 1282500,
    supplyGapKL: 427500,
    coverageRatioPct: 75.0,
    automotiveDemandKL: 940500,
    industrialDemandKL: 684000,
    agriMiningDemandKL: 85500,
    leadStates: ['Maharashtra (940.5k KL)', 'Gujarat (712.5k KL)', 'Goa (34.2k KL)', 'DNH & Daman (22.8k KL)'],
    keyHubs: ['Mumbai-MMR', 'Pune-Chakan', 'Nashik', 'Bharuch-Dahej', 'Ahmedabad-Sanand', 'Surat-Hazira']
  },
  {
    zoneName: 'North',
    statesCount: 9,
    totalDemandKL: 1482000, // 26.0% of India
    shareOfNationalPct: 26.0,
    totalValueINR: 23712,
    accessibleSupplyKL: 1067040,
    supplyGapKL: 414960,
    coverageRatioPct: 72.0,
    automotiveDemandKL: 963300,
    industrialDemandKL: 414960,
    agriMiningDemandKL: 103740,
    leadStates: ['Uttar Pradesh (541.5k KL)', 'Rajasthan (342.0k KL)', 'Haryana (285.0k KL)', 'Punjab (171.0k KL)', 'Delhi NCR (85.5k KL)'],
    keyHubs: ['Gurugram-Manesar', 'Faridabad', 'Noida-Greater Noida', 'Kanpur-Lucknow', 'Neemrana DMIC', 'Ludhiana', 'Jaipur']
  },
  {
    zoneName: 'South',
    statesCount: 6,
    totalDemandKL: 1425000, // 25.0% of India
    shareOfNationalPct: 25.0,
    totalValueINR: 22800,
    accessibleSupplyKL: 1097250,
    supplyGapKL: 327750,
    coverageRatioPct: 77.0,
    automotiveDemandKL: 883500,
    industrialDemandKL: 484500,
    agriMiningDemandKL: 57000,
    leadStates: ['Tamil Nadu (570.0k KL)', 'Karnataka (427.5k KL)', 'Telangana (228.0k KL)', 'Andhra Pradesh (171.0k KL)', 'Kerala (28.5k KL)'],
    keyHubs: ['Chennai-Sriperumbudur', 'Coimbatore-Tirupur', 'Bengaluru-Peenya-Hosur', 'Hyderabad-Medchal', 'Visakhapatnam-PCPIR']
  },
  {
    zoneName: 'East',
    statesCount: 4,
    totalDemandKL: 684000, // 12.0% of India
    shareOfNationalPct: 12.0,
    totalValueINR: 10944,
    accessibleSupplyKL: 444600,
    supplyGapKL: 239400,
    coverageRatioPct: 65.0,
    automotiveDemandKL: 342000,
    industrialDemandKL: 273600,
    agriMiningDemandKL: 68400,
    leadStates: ['West Bengal (285.0k KL)', 'Odisha (199.5k KL)', 'Bihar (114.0k KL)', 'Jharkhand (85.5k KL)'],
    keyHubs: ['Kolkata-Howrah-Haldia', 'Angul-Kalinganagar Steel', 'Jamshedpur Auto & Steel', 'Dhanbad-Bokaro Coal Belt', 'Patna-Barauni']
  },
  {
    zoneName: 'Central',
    statesCount: 2,
    totalDemandKL: 313500, // 5.5% of India
    shareOfNationalPct: 5.5,
    totalValueINR: 5016,
    accessibleSupplyKL: 194370,
    supplyGapKL: 119130,
    coverageRatioPct: 62.0,
    automotiveDemandKL: 188100,
    industrialDemandKL: 94050,
    agriMiningDemandKL: 31350,
    leadStates: ['Madhya Pradesh (228.0k KL)', 'Chhattisgarh (85.5k KL)'],
    keyHubs: ['Indore-Pithampur', 'Bhopal-Mandideep', 'Raipur-Bhilai-Durg Steel', 'Jabalpur-Katni', 'Korba Energy Belt']
  },
  {
    zoneName: 'North-East',
    statesCount: 8,
    totalDemandKL: 85500, // 1.5% of India
    shareOfNationalPct: 1.5,
    totalValueINR: 1368,
    accessibleSupplyKL: 47025,
    supplyGapKL: 38475,
    coverageRatioPct: 55.0,
    automotiveDemandKL: 61560,
    industrialDemandKL: 17100,
    agriMiningDemandKL: 6840,
    leadStates: ['Assam (57.0k KL)', 'Meghalaya (8.55k KL)', 'Tripura (5.70k KL)', 'Remaining 5 States (14.25k KL)'],
    keyHubs: ['Guwahati-Amingaon', 'Digboi-Dibrugarh Tea & Oil', 'Byrnihat-Shillong', 'Agartala Freight Node']
  }
];

// COMPLETE ALL 36 STATES & UNION TERRITORIES (Sum = Exactly 5,700,000 KL / 5.70M KL)
export const ALL_INDIA_STATES_DATA: StateMacroData[] = [
  // 1. MAHARASHTRA
  {
    stateCode: 'MH',
    stateName: 'Maharashtra',
    region: 'West',
    isUnionTerritory: false,
    totalDemandKL: 940500, // 16.50% of India
    nationalSharePct: 16.50,
    marketValueINR: 15048,
    automotiveDemandKL: 517275,
    industrialDemandKL: 376200,
    agriculturalDemandKL: 32917,
    miningOffHighwayKL: 14108,
    accessibleSupplyKL: 724185,
    supplyGapKL: 216315,
    coverageRatioPct: 77.0,
    unmetOpportunityINR: 3461.0,
    whiteSpotScore: 92.4,
    priorityTier: 'Tier 1 — High Demand Core',
    registeredVehiclesCount: 39500000,
    registeredTrucksCVCount: 2450000,
    manufacturingUnitsCount: 42000,
    industrialPowerLoadMW: 26500,
    primaryDepotsCount: 28,
    blendingPlantsCount: 16,
    dealerOutletsCount: 8400,
    topDistricts: [
      { districtName: 'Pune (Chakan, Bhosari, Talegaon, Ranjangaon)', demandKL: 188100, shareOfStatePct: 20.0, primarySector: 'Automotive & Heavy Engineering', whiteSpotGapKL: 32000 },
      { districtName: 'Mumbai & MMR (Thane, Navi Mumbai, Raigad)', demandKL: 235125, shareOfStatePct: 25.0, primarySector: 'Logistics, Fleets, Chemical & Marine', whiteSpotGapKL: 38000 },
      { districtName: 'Nashik (Satpur, Ambad, Sinnar, Igatpuri)', demandKL: 75240, shareOfStatePct: 8.0, primarySector: 'Auto Ancillaries, Defense & Agri', whiteSpotGapKL: 18500 },
      { districtName: 'Nagpur & Vidarbha (Butibori, Hingna)', demandKL: 84645, shareOfStatePct: 9.0, primarySector: 'Multi-Modal Logistics, Mining & Power', whiteSpotGapKL: 22000 },
      { districtName: 'Aurangabad / Chhatrapati Sambhajinagar', demandKL: 65835, shareOfStatePct: 7.0, primarySector: 'Automotive, Brewery & Heavy Forging', whiteSpotGapKL: 16000 }
    ],
    growthDrivers: ['Auto hub of India with Tata, Bajaj, Mahindra, Bharat Forge', 'PCPIR chemical belt across JNPT & Raigad', 'Samruddhi Mahamarg expressway transport corridor'],
    keyIndustries: ['Automotive & Auto Components', 'Specialty Chemicals & Pharmaceuticals', 'Heavy Engineering & Forgings', 'Port & Marine Freight'],
    majorLubricantSuppliers: ['SERVO (IOCL Trombay)', 'Castrol (Patalganga)', 'MAK (BPCL Mahilpur/Sewree)', 'HPCL (Mazgaon)', 'Gulf Oil (Silvassa)']
  },

  // 2. GUJARAT
  {
    stateCode: 'GJ',
    stateName: 'Gujarat',
    region: 'West',
    isUnionTerritory: false,
    totalDemandKL: 712500, // 12.50% of India
    nationalSharePct: 12.50,
    marketValueINR: 11400,
    automotiveDemandKL: 356250,
    industrialDemandKL: 320625,
    agriculturalDemandKL: 24937,
    miningOffHighwayKL: 10688,
    accessibleSupplyKL: 520125,
    supplyGapKL: 192375,
    coverageRatioPct: 73.0,
    unmetOpportunityINR: 3078.0,
    whiteSpotScore: 91.8,
    priorityTier: 'Tier 1 — High Demand Core',
    registeredVehiclesCount: 29800000,
    registeredTrucksCVCount: 1980000,
    manufacturingUnitsCount: 38500,
    industrialPowerLoadMW: 24800,
    primaryDepotsCount: 22,
    blendingPlantsCount: 14,
    dealerOutletsCount: 6800,
    topDistricts: [
      { districtName: 'Bharuch & Dahej (PCPIR, GIDC Ankleshwar)', demandKL: 142500, shareOfStatePct: 20.0, primarySector: 'Petrochemicals, Polymers, Caustic Soda & Dyes', whiteSpotGapKL: 38500 },
      { districtName: 'Ahmedabad & Sanand (Auto Cluster, Vatva GIDC)', demandKL: 156750, shareOfStatePct: 22.0, primarySector: 'Passenger Cars (Maruti, Tata, MG), Textiles & Pharma', whiteSpotGapKL: 32000 },
      { districtName: 'Surat & Hazira (Steel, Ports, Textiles, LNG)', demandKL: 128250, shareOfStatePct: 18.0, primarySector: 'Heavy Steel (AM/NS), Petrochemicals, Ports', whiteSpotGapKL: 28000 },
      { districtName: 'Vadodara & Savli (Power Equipment & Chemicals)', demandKL: 85500, shareOfStatePct: 12.0, primarySector: 'Heavy Electricals (ABB, Alstom), Refineries', whiteSpotGapKL: 18000 },
      { districtName: 'Rajkot & Morbi (Ceramics, Casting & Diesel Engines)', demandKL: 99750, shareOfStatePct: 14.0, primarySector: 'Ceramics Hub, Foundry & Submersible Pumps', whiteSpotGapKL: 24000 }
    ],
    growthDrivers: ['Petrochemical capital of India with Reliance Jamnagar & ONGC Dahej', 'Rapidly expanding auto corridor in Sanand-Mandal-Becharaji', 'India’s largest coastline with Mundra, Kandla, Hazira ports'],
    keyIndustries: ['Petrochemicals & Plastics', 'Automotive OEM Manufacturing', 'Heavy Steel & Pipe Rolling', 'Ceramic Tiles & Machine Tools'],
    majorLubricantSuppliers: ['SERVO (Koyali Refinery)', 'Castrol India', 'Shell (Hazira LNG & Terminal)', 'Mobil', 'Savsol']
  },

  // 3. TAMIL NADU
  {
    stateCode: 'TN',
    stateName: 'Tamil Nadu',
    region: 'South',
    isUnionTerritory: false,
    totalDemandKL: 570000, // 10.00% of India
    nationalSharePct: 10.00,
    marketValueINR: 9120,
    automotiveDemandKL: 342000,
    industrialDemandKL: 199500,
    agriculturalDemandKL: 19950,
    miningOffHighwayKL: 8550,
    accessibleSupplyKL: 444600,
    supplyGapKL: 125400,
    coverageRatioPct: 78.0,
    unmetOpportunityINR: 2006.4,
    whiteSpotScore: 89.5,
    priorityTier: 'Tier 1 — High Demand Core',
    registeredVehiclesCount: 34200000,
    registeredTrucksCVCount: 1820000,
    manufacturingUnitsCount: 39000,
    industrialPowerLoadMW: 21500,
    primaryDepotsCount: 20,
    blendingPlantsCount: 10,
    dealerOutletsCount: 7100,
    topDistricts: [
      { districtName: 'Chennai & Sriperumbudur (Auto, Ports, Electronics)', demandKL: 171000, shareOfStatePct: 30.0, primarySector: 'Automotive OEMs (Hyundai, Renault-Nissan, Royal Enfield, Ashok Leyland)', whiteSpotGapKL: 28000 },
      { districtName: 'Coimbatore & Tirupur (Motors, Pumps, Textiles)', demandKL: 114000, shareOfStatePct: 20.0, primarySector: 'Wet Grinders, Precision Engineering, Pumps, Textile Machinery', whiteSpotGapKL: 24500 },
      { districtName: 'Hosur (Auto Hub & Heavy Machinery)', demandKL: 68400, shareOfStatePct: 12.0, primarySector: 'Two-Wheelers (TVS, Ather), Commercial Vehicles (Ashok Leyland, Titan)', whiteSpotGapKL: 14000 },
      { districtName: 'Salem & Erode (Steel, Sago & Powerloom)', demandKL: 57000, shareOfStatePct: 10.0, primarySector: 'Steel Rolling Mills, Sago Processing, Dyeing Machinery', whiteSpotGapKL: 12000 },
      { districtName: 'Tiruchirappalli (BHEL, Heavy Fabrication)', demandKL: 45600, shareOfStatePct: 8.0, primarySector: 'High-Pressure Boiler Fabrication & Thermal Power Ancillaries', whiteSpotGapKL: 9500 }
    ],
    growthDrivers: ['"Detroit of South Asia" with largest automotive cluster', 'Largest textile spinning and garment hub in Tirupur-Coimbatore', 'Extensive port-led connectivity via Ennore, Chennai, and Tuticorin'],
    keyIndustries: ['Automotive & Commercial Vehicles', 'Precision Engineering & Pumps', 'Textiles & Technical Fabrics', 'Heavy Power Equipment'],
    majorLubricantSuppliers: ['SERVO (Chennai Blending Plant)', 'Castrol', 'MAK (BPCL Tondiarpet)', 'Gulf Oil', 'TotalEnergies']
  },

  // 4. UTTAR PRADESH
  {
    stateCode: 'UP',
    stateName: 'Uttar Pradesh',
    region: 'North',
    isUnionTerritory: false,
    totalDemandKL: 541500, // 9.50% of India
    nationalSharePct: 9.50,
    marketValueINR: 8664,
    automotiveDemandKL: 351975,
    industrialDemandKL: 135375,
    agriculturalDemandKL: 43320,
    miningOffHighwayKL: 10830,
    accessibleSupplyKL: 379050,
    supplyGapKL: 162450,
    coverageRatioPct: 70.0,
    unmetOpportunityINR: 2599.2,
    whiteSpotScore: 88.0,
    priorityTier: 'Tier 1 — High Demand Core',
    registeredVehiclesCount: 42000000,
    registeredTrucksCVCount: 2200000,
    manufacturingUnitsCount: 28000,
    industrialPowerLoadMW: 18200,
    primaryDepotsCount: 18,
    blendingPlantsCount: 6,
    dealerOutletsCount: 9200,
    topDistricts: [
      { districtName: 'Gautam Buddha Nagar (Noida, Greater Noida, Yamuna Exp.)', demandKL: 97470, shareOfStatePct: 18.0, primarySector: 'Electronics, Auto Ancillaries, Data Centers, Construction Fleets', whiteSpotGapKL: 22000 },
      { districtName: 'Kanpur Nagar (Transport Nagar, Leather, Chemical, Defense)', demandKL: 81225, shareOfStatePct: 15.0, primarySector: 'North India Largest Truck Freight Hub, Ordnance & Leather Machinery', whiteSpotGapKL: 24000 },
      { districtName: 'Ghaziabad & Sahibabad (Heavy Engineering, Forging)', demandKL: 64980, shareOfStatePct: 12.0, primarySector: 'Steel Re-rolling, Wire Drawing, Heavy Machinery', whiteSpotGapKL: 16000 },
      { districtName: 'Lucknow (Transport, Agro-processing, Auto)', demandKL: 54150, shareOfStatePct: 10.0, primarySector: 'Tata Motors Commercial Plant, Scooter India, Agri Logistics', whiteSpotGapKL: 13000 },
      { districtName: 'Agra & Aligarh (Foundry, Hardware, Transport)', demandKL: 43320, shareOfStatePct: 8.0, primarySector: 'Lock Hardware, Brass Castings, Tourist & Freight Fleets', whiteSpotGapKL: 11000 }
    ],
    growthDrivers: ['Highest vehicle population state in India with surging 2W/Tractor fleet', 'Massive network of 6 operational expressways (Yamuna, Purvanchal, Bundelkhand, Agra-Lucknow)', 'Defence Industrial Corridor across Kanpur, Aligarh, Lucknow, Jhansi'],
    keyIndustries: ['Agricultural Fleets & Tractors', 'Heavy Transport & Interstate Freight', 'Leather & Footwear Processing', 'Electronics & Defense Manufacturing'],
    majorLubricantSuppliers: ['SERVO (Mathura & Kanpur Depots)', 'Castrol India', 'HPCL', 'Valvoline Cummins', 'Gulf Oil']
  },

  // 5. KARNATAKA
  {
    stateCode: 'KA',
    stateName: 'Karnataka',
    region: 'South',
    isUnionTerritory: false,
    totalDemandKL: 427500, // 7.50% of India
    nationalSharePct: 7.50,
    marketValueINR: 6840,
    automotiveDemandKL: 265050,
    industrialDemandKL: 141075,
    agriculturalDemandKL: 14963,
    miningOffHighwayKL: 6412,
    accessibleSupplyKL: 337725,
    supplyGapKL: 89775,
    coverageRatioPct: 79.0,
    unmetOpportunityINR: 1436.4,
    whiteSpotScore: 86.4,
    priorityTier: 'Tier 1 — High Demand Core',
    registeredVehiclesCount: 26500000,
    registeredTrucksCVCount: 1420000,
    manufacturingUnitsCount: 26000,
    industrialPowerLoadMW: 16800,
    primaryDepotsCount: 16,
    blendingPlantsCount: 7,
    dealerOutletsCount: 5600,
    topDistricts: [
      { districtName: 'Bengaluru Urban & Rural (Peenya, Bidadi, Whitefield)', demandKL: 153900, shareOfStatePct: 36.0, primarySector: 'Toyota Auto Corridor, Machine Tools, Precision Electronics', whiteSpotGapKL: 24000 },
      { districtName: 'Belagavi (Foundry, Hydraulics, Machining)', demandKL: 47025, shareOfStatePct: 11.0, primarySector: 'Hydraulic Valves, Crankshafts, Sugar Mill Machinery', whiteSpotGapKL: 11500 },
      { districtName: 'Ballari & Vijayanagar (Toranagallu Steel & Mining)', demandKL: 55575, shareOfStatePct: 13.0, primarySector: 'JSW Steel (India Largest Steel Plant), Iron Ore Mining Fleets', whiteSpotGapKL: 16000 },
      { districtName: 'Hubballi-Dharwad (Commercial Vehicles, Agri)', demandKL: 38475, shareOfStatePct: 9.0, primarySector: 'Tata Hitachi Earthmovers, Commercial Bus/Truck Fleets', whiteSpotGapKL: 8500 },
      { districtName: 'Mysuru (Auto Components, Food, Engineering)', demandKL: 34200, shareOfStatePct: 8.0, primarySector: 'TVS Motor, JK Tyre, Heavy Machine Tools', whiteSpotGapKL: 7000 }
    ],
    growthDrivers: ['Peenya Industrial Estate is South Asia’s largest SME manufacturing hub', 'Ballari iron & steel corridor with JSW Steel mega expansion', 'High-end PCMO synthetic adoption in Bengaluru urban mobility'],
    keyIndustries: ['Automotive & Off-Highway Earthmoving', 'Steel & Heavy Metallurgy', 'Aerospace & Precision Machining', 'Electronics & IT Logistics'],
    majorLubricantSuppliers: ['SERVO (Devangonthi Depot)', 'Castrol', 'Shell India (Bengaluru Tech Hub)', 'MAK (BPCL)', 'Mobil']
  },

  // 6. RAJASTHAN
  {
    stateCode: 'RJ',
    stateName: 'Rajasthan',
    region: 'North',
    isUnionTerritory: false,
    totalDemandKL: 342000, // 6.00% of India
    nationalSharePct: 6.00,
    marketValueINR: 5472,
    automotiveDemandKL: 198360,
    industrialDemandKL: 102600,
    agriculturalDemandKL: 27360,
    miningOffHighwayKL: 13680,
    accessibleSupplyKL: 246240,
    supplyGapKL: 95760,
    coverageRatioPct: 72.0,
    unmetOpportunityINR: 1532.2,
    whiteSpotScore: 87.5,
    priorityTier: 'Tier 2 — Industrial Growth',
    registeredVehiclesCount: 19500000,
    registeredTrucksCVCount: 1250000,
    manufacturingUnitsCount: 19500,
    industrialPowerLoadMW: 14200,
    primaryDepotsCount: 14,
    blendingPlantsCount: 4,
    dealerOutletsCount: 4800,
    topDistricts: [
      { districtName: 'Alwar & Neemrana (Japanese Zone, DMIC Corridor)', demandKL: 75240, shareOfStatePct: 22.0, primarySector: 'Japanese OEM Auto Ancillaries, Hero MotoCorp, Daikin, Havells', whiteSpotGapKL: 21500 },
      { districtName: 'Jaipur (Transport, Gems, Engineering, Agri)', demandKL: 68400, shareOfStatePct: 20.0, primarySector: 'Commercial Fleets, Heavy Equipment, Ceramic Grinding', whiteSpotGapKL: 15000 },
      { districtName: 'Bhilwara (Textile Capital, Stone Quarrying)', demandKL: 41040, shareOfStatePct: 12.0, primarySector: 'Synthetic Suiting Weaving, Granite & Marble Saws', whiteSpotGapKL: 11000 },
      { districtName: 'Udaipur & Rajsamand (Zinc, Mining, Marble Processing)', demandKL: 47880, shareOfStatePct: 14.0, primarySector: 'Hindustan Zinc Mining, Marble Gangsaws, Dumpers', whiteSpotGapKL: 14000 },
      { districtName: 'Jodhpur (Handicrafts, Freight, Limestone)', demandKL: 34200, shareOfStatePct: 10.0, primarySector: 'Heavy Transport Fleets, Limestone Kilns, Solar Park Construction', whiteSpotGapKL: 8000 }
    ],
    growthDrivers: ['Neemrana Japanese Industrial Zone along the Delhi-Mumbai Freight Corridor', 'World capital of marble, granite, and zinc mining with heavy off-highway equipment demand', 'Massive agricultural tractor and diesel pump market in canal zones'],
    keyIndustries: ['Mining & Heavy Off-Highway Equipment', 'Automotive Ancillaries & White Goods', 'Textiles & Synthetic Weaving', 'Cement Manufacturing & Stone Processing'],
    majorLubricantSuppliers: ['SERVO (Jaipur & Jodhpur)', 'Castrol', 'HPCL', 'Gulf Oil', 'Valvoline']
  },

  // 7. WEST BENGAL
  {
    stateCode: 'WB',
    stateName: 'West Bengal',
    region: 'East',
    isUnionTerritory: false,
    totalDemandKL: 285000, // 5.00% of India
    nationalSharePct: 5.00,
    marketValueINR: 4560,
    automotiveDemandKL: 148200,
    industrialDemandKL: 114000,
    agriculturalDemandKL: 14250,
    miningOffHighwayKL: 8550,
    accessibleSupplyKL: 193800,
    supplyGapKL: 91200,
    coverageRatioPct: 68.0,
    unmetOpportunityINR: 1459.2,
    whiteSpotScore: 84.2,
    priorityTier: 'Tier 2 — Industrial Growth',
    registeredVehiclesCount: 16200000,
    registeredTrucksCVCount: 980000,
    manufacturingUnitsCount: 21000,
    industrialPowerLoadMW: 12500,
    primaryDepotsCount: 12,
    blendingPlantsCount: 6,
    dealerOutletsCount: 4200,
    topDistricts: [
      { districtName: 'Kolkata & Howrah (Foundry, Engineering, Marine)', demandKL: 94050, shareOfStatePct: 33.0, primarySector: 'Castings, Port Bunker, Inland Barges, Fleet Logistics', whiteSpotGapKL: 22000 },
      { districtName: 'Purba Medinipur (Haldia Port, Petrochemicals)', demandKL: 51300, shareOfStatePct: 18.0, primarySector: 'Haldia Petrochemicals, Indian Oil Refinery, Edible Oil Rolling', whiteSpotGapKL: 14000 },
      { districtName: 'Paschim Bardhaman (Durgapur-Asansol Steel Belt)', demandKL: 57000, shareOfStatePct: 20.0, primarySector: 'SAIL Durgapur Steel Plant, IISCO Burnpur, Coal Mining Fleets', whiteSpotGapKL: 17500 },
      { districtName: 'North 24 Parganas (Jute, Paper, Light Engg)', demandKL: 28500, shareOfStatePct: 10.0, primarySector: 'Jute Batching Oils, Light Commercial Transport', whiteSpotGapKL: 7000 }
    ],
    growthDrivers: ['Gateway to Eastern India and Northeast trade corridors', 'Haldia industrial port zone and petrochemical complex', 'Heavy steel and engineering cluster in Durgapur-Asansol'],
    keyIndustries: ['Steel, Iron & Heavy Foundry', 'Petrochemicals & Plastics', 'Port Bunkering & Marine Inland Logistics', 'Jute & Food Processing'],
    majorLubricantSuppliers: ['SERVO (IOCL Kolkata Blending Plant)', 'Castrol (Paharapur)', 'MAK (BPCL Rajbandh)', 'Tide Water (Veedol HO)']
  },

  // 8. HARYANA
  {
    stateCode: 'HR',
    stateName: 'Haryana',
    region: 'North',
    isUnionTerritory: false,
    totalDemandKL: 285000, // 5.00% of India
    nationalSharePct: 5.00,
    marketValueINR: 4560,
    automotiveDemandKL: 185250,
    industrialDemandKL: 85500,
    agriculturalDemandKL: 14250,
    miningOffHighwayKL: 0,
    accessibleSupplyKL: 219450,
    supplyGapKL: 65550,
    coverageRatioPct: 77.0,
    unmetOpportunityINR: 1048.8,
    whiteSpotScore: 85.0,
    priorityTier: 'Tier 2 — Industrial Growth',
    registeredVehiclesCount: 15400000,
    registeredTrucksCVCount: 920000,
    manufacturingUnitsCount: 17500,
    industrialPowerLoadMW: 11800,
    primaryDepotsCount: 12,
    blendingPlantsCount: 5,
    dealerOutletsCount: 3900,
    topDistricts: [
      { districtName: 'Gurugram & Manesar (Maruti Suzuki, Honda 2W, Hero)', demandKL: 108300, shareOfStatePct: 38.0, primarySector: 'Auto OEMs, First-Tier Ancillaries, Premium PCMO/MCO', whiteSpotGapKL: 18000 },
      { districtName: 'Faridabad (Heavy Machinery, Escorts Tractors, JCB)', demandKL: 62700, shareOfStatePct: 22.0, primarySector: 'Earthmoving (JCB), Tractors (Escorts/Kubota), Metal Stamping', whiteSpotGapKL: 13500 },
      { districtName: 'Panipat (IOCL Refinery, Petrochemicals, Blankets)', demandKL: 37050, shareOfStatePct: 13.0, primarySector: 'Textile Machinery, Chemical Refining, Fleet Transport', whiteSpotGapKL: 8000 },
      { districtName: 'Sonipat & Kundli (Industrial Estates, KMP Corridor)', demandKL: 31350, shareOfStatePct: 11.0, primarySector: 'KMP Expressway Freight, Cold Chains, Food Processing', whiteSpotGapKL: 7500 }
    ],
    growthDrivers: ['Auto heartland producing 50% of India’s passenger cars and 60% of motorcycles', 'KMP Expressway logistics hubs with high-throughput freight corridors', 'IOCL Panipat mega refinery and synthetic base oil plants'],
    keyIndustries: ['Automotive & Two-Wheelers', 'Off-Highway Earthmoving (JCB)', 'Tractors & Farm Implements', 'Petrochemicals & Textile Dyeing'],
    majorLubricantSuppliers: ['SERVO (Panipat & Faridabad R&D)', 'Castrol', 'Valvoline Cummins', 'Shell', 'Mobil']
  },

  // 9. MADHYA PRADESH
  {
    stateCode: 'MP',
    stateName: 'Madhya Pradesh',
    region: 'Central',
    isUnionTerritory: false,
    totalDemandKL: 228000, // 4.00% of India
    nationalSharePct: 4.00,
    marketValueINR: 3648,
    automotiveDemandKL: 136800,
    industrialDemandKL: 68400,
    agriculturalDemandKL: 18240,
    miningOffHighwayKL: 4560,
    accessibleSupplyKL: 145920,
    supplyGapKL: 82080,
    coverageRatioPct: 64.0,
    unmetOpportunityINR: 1313.3,
    whiteSpotScore: 83.0,
    priorityTier: 'Tier 2 — Industrial Growth',
    registeredVehiclesCount: 16800000,
    registeredTrucksCVCount: 960000,
    manufacturingUnitsCount: 14500,
    industrialPowerLoadMW: 9800,
    primaryDepotsCount: 10,
    blendingPlantsCount: 3,
    dealerOutletsCount: 3800,
    topDistricts: [
      { districtName: 'Indore & Pithampur (Auto & Pharma SEZ)', demandKL: 75240, shareOfStatePct: 33.0, primarySector: 'Commercial Vehicles (VE Commercial/Volvo Eicher), Pharma', whiteSpotGapKL: 21000 },
      { districtName: 'Bhopal & Mandideep (BHEL, HEG Graphite, Tractors)', demandKL: 45600, shareOfStatePct: 20.0, primarySector: 'Tractors (Tafe), Heavy Electricals, Graphite Electrodes', whiteSpotGapKL: 14000 },
      { districtName: 'Jabalpur & Katni (Defense Ordnance, Limestone)', demandKL: 34200, shareOfStatePct: 15.0, primarySector: 'Vehicle Factory Jabalpur (VFJ), Mineral Processing', whiteSpotGapKL: 11000 },
      { districtName: 'Gwalior & Malanpur (Chemicals, Confectionery, Transport)', demandKL: 27360, shareOfStatePct: 12.0, primarySector: 'Dairy Processing, Steel Tubes, Fleet Corridors', whiteSpotGapKL: 8500 }
    ],
    growthDrivers: ['Central logistics hub connecting North, South, East, and West freight', 'Pithampur auto corridor with Volvo-Eicher and Force Motors', 'Top soybean and wheat producer driving high agricultural tractor lubricant sales'],
    keyIndustries: ['Commercial Vehicles & Buses', 'Heavy Electrical Engineering', 'Agriculture & Tractor Implements', 'Cement & Mineral Mining'],
    majorLubricantSuppliers: ['SERVO (Bhopal & Indore)', 'Castrol', 'Gulf Oil', 'HPCL', 'Savsol']
  },

  // 10. TELANGANA
  {
    stateCode: 'TS',
    stateName: 'Telangana',
    region: 'South',
    isUnionTerritory: false,
    totalDemandKL: 228000, // 4.00% of India
    nationalSharePct: 4.00,
    marketValueINR: 3648,
    automotiveDemandKL: 148200,
    industrialDemandKL: 68400,
    agriculturalDemandKL: 8550,
    miningOffHighwayKL: 2850,
    accessibleSupplyKL: 177840,
    supplyGapKL: 50160,
    coverageRatioPct: 78.0,
    unmetOpportunityINR: 802.6,
    whiteSpotScore: 85.8,
    priorityTier: 'Tier 2 — Industrial Growth',
    registeredVehiclesCount: 15200000,
    registeredTrucksCVCount: 820000,
    manufacturingUnitsCount: 16000,
    industrialPowerLoadMW: 11200,
    primaryDepotsCount: 10,
    blendingPlantsCount: 3,
    dealerOutletsCount: 3600,
    topDistricts: [
      { districtName: 'Hyderabad & Medchal-Malkajgiri (Pharma, Aerospace)', demandKL: 114000, shareOfStatePct: 50.0, primarySector: 'Bulk Drugs (Pharma City), Aerospace Ancillaries, Urban Fleets', whiteSpotGapKL: 19000 },
      { districtName: 'Rangareddy & Patancheru (Heavy Fabrication, Chemicals)', demandKL: 45600, shareOfStatePct: 20.0, primarySector: 'Paints, Heavy Metal Extrusion, Commercial Transport', whiteSpotGapKL: 9500 },
      { districtName: 'Karimnagar & Ramagundam (NTPC Power, Singareni Coal)', demandKL: 34200, shareOfStatePct: 15.0, primarySector: 'Thermal Turbines, Open Cast Coal Mining Equipment', whiteSpotGapKL: 9000 },
      { districtName: 'Warangal (Textiles, Agro-Processing, Transport)', demandKL: 18240, shareOfStatePct: 8.0, primarySector: 'Kakatiya Mega Textile Park, Cotton Ginning Fleets', whiteSpotGapKL: 4500 }
    ],
    growthDrivers: ['"Genome Valley" and bulk drug pharma capital requiring high-grade synthetic and process oils', 'Singareni Collieries and NTPC power complexes consuming heavy industrial gear & turbine oils', 'Rapid urban vehicle growth along Hyderabad Outer Ring Road'],
    keyIndustries: ['Pharmaceuticals & Process Chemistry', 'Aerospace & Defense Precision Tooling', 'Coal Mining Fleets (SCCL)', 'Textiles & Mega Infrastructure'],
    majorLubricantSuppliers: ['SERVO (Sanathnagar Depot)', 'Castrol', 'MAK (BPCL)', 'Shell', 'HPCL']
  },

  // 11. ODISHA
  {
    stateCode: 'OD',
    stateName: 'Odisha',
    region: 'East',
    isUnionTerritory: false,
    totalDemandKL: 199500, // 3.50% of India
    nationalSharePct: 3.50,
    marketValueINR: 3192,
    automotiveDemandKL: 79800,
    industrialDemandKL: 99750,
    agriculturalDemandKL: 9975,
    miningOffHighwayKL: 9975,
    accessibleSupplyKL: 119700,
    supplyGapKL: 79800,
    coverageRatioPct: 60.0,
    unmetOpportunityINR: 1276.8,
    whiteSpotScore: 88.6,
    priorityTier: 'Tier 2 — Industrial Growth',
    registeredVehiclesCount: 9800000,
    registeredTrucksCVCount: 780000,
    manufacturingUnitsCount: 11000,
    industrialPowerLoadMW: 13500,
    primaryDepotsCount: 8,
    blendingPlantsCount: 2,
    dealerOutletsCount: 2600,
    topDistricts: [
      { districtName: 'Angul & Talcher (Jindal Steel, NALCO Aluminium, Coal)', demandKL: 55860, shareOfStatePct: 28.0, primarySector: 'JSPL Steel, NALCO Smelter, Heavy Open-cast Coal Mining Fleets', whiteSpotGapKL: 24000 },
      { districtName: 'Jajpur & Kalinganagar (Tata Steel, Stainless Steel Hub)', demandKL: 49875, shareOfStatePct: 25.0, primarySector: 'Tata Steel Kalinganagar, Jindal Stainless, Ferro Alloys', whiteSpotGapKL: 21000 },
      { districtName: 'Jharsuguda & Sambalpur (Vedanta Aluminium, Hindalco)', demandKL: 39900, shareOfStatePct: 20.0, primarySector: 'Mega Aluminium Smelters, Captive Power Turbines', whiteSpotGapKL: 15500 },
      { districtName: 'Sundargarh & Rourkela (SAIL Rourkela Steel Plant)', demandKL: 29925, shareOfStatePct: 15.0, primarySector: 'Primary Steel Making, Iron Ore Mines, Heavy Forgings', whiteSpotGapKL: 11000 }
    ],
    growthDrivers: ['Steel and aluminium capital of India with massive heavy industrial gear and hydraulic oil consumption', 'Talcher and Ib Valley coalfields driving high heavy-duty diesel engine oil (HDEO) and mining grease volume', 'Deepwater ports at Paradip and Dhamra with high bulk liquid chemical traffic'],
    keyIndustries: ['Integrated Steel Making', 'Aluminium Smelting & Rolling', 'Coal & Iron Ore Mining Fleets', 'Thermal Power Turbines'],
    majorLubricantSuppliers: ['SERVO (Paradip & Sambalpur)', 'Castrol', 'MAK (BPCL)', 'Mobil Industrial', 'Gulf Oil']
  },

  // 12. ANDHRA PRADESH
  {
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    region: 'South',
    isUnionTerritory: false,
    totalDemandKL: 171000, // 3.00% of India
    nationalSharePct: 3.00,
    marketValueINR: 2736,
    automotiveDemandKL: 94050,
    industrialDemandKL: 59850,
    agriculturalDemandKL: 11970,
    miningOffHighwayKL: 5130,
    accessibleSupplyKL: 123120,
    supplyGapKL: 47880,
    coverageRatioPct: 72.0,
    unmetOpportunityINR: 766.1,
    whiteSpotScore: 82.5,
    priorityTier: 'Tier 2 — Industrial Growth',
    registeredVehiclesCount: 14200000,
    registeredTrucksCVCount: 840000,
    manufacturingUnitsCount: 13500,
    industrialPowerLoadMW: 10400,
    primaryDepotsCount: 9,
    blendingPlantsCount: 3,
    dealerOutletsCount: 3200,
    topDistricts: [
      { districtName: 'Visakhapatnam & Anakapalli (RINL Steel, HPCL Refinery, Port)', demandKL: 59850, shareOfStatePct: 35.0, primarySector: 'RINL Vizag Steel, Marine Bunker, Heavy Machinery, Pharma City', whiteSpotGapKL: 16000 },
      { districtName: 'Sri City & Tirupati (Isuzu Auto, Foxconn, Consumer Fleets)', demandKL: 34200, shareOfStatePct: 20.0, primarySector: 'Automotive (Isuzu), Heavy Machinery (Kobelco), Electronics', whiteSpotGapKL: 9500 },
      { districtName: 'Krishna & NTR (Vijayawada Transport Hub, Auto Nagar)', demandKL: 29070, shareOfStatePct: 17.0, primarySector: 'South India Largest Auto Nagar Spare & Transport Workshop Cluster', whiteSpotGapKL: 8000 },
      { districtName: 'Guntur & Palnadu (Cement Cluster, Tobacco, Agri Fleets)', demandKL: 23940, shareOfStatePct: 14.0, primarySector: 'Limestone & Cement Plants, Chilli & Tobacco Processing Mills', whiteSpotGapKL: 6500 }
    ],
    growthDrivers: ['974 km coastline with major ports at Visakhapatnam, Krishnapatnam, and Kakinada', 'Sri City mega industrial zone housing global automotive and machinery OEMs', 'Vijayawada Auto Nagar with dense aftermarket lubricant consumption'],
    keyIndustries: ['Port Logistics & Marine Bunkering', 'Primary Steel & Heavy Refining', 'Automotive OEM & Components', 'Cement & Mineral Calcining'],
    majorLubricantSuppliers: ['SERVO (Visakhapatnam)', 'HPCL (Vizag Refinery)', 'Castrol', 'MAK (BPCL)', 'Gulf Oil']
  },

  // 13. PUNJAB
  {
    stateCode: 'PB',
    stateName: 'Punjab',
    region: 'North',
    isUnionTerritory: false,
    totalDemandKL: 171000, // 3.00% of India
    nationalSharePct: 3.00,
    marketValueINR: 2736,
    automotiveDemandKL: 102600,
    industrialDemandKL: 42750,
    agriculturalDemandKL: 22230,
    miningOffHighwayKL: 3420,
    accessibleSupplyKL: 128250,
    supplyGapKL: 42750,
    coverageRatioPct: 75.0,
    unmetOpportunityINR: 684.0,
    whiteSpotScore: 81.0,
    priorityTier: 'Tier 2 — Industrial Growth',
    registeredVehiclesCount: 12800000,
    registeredTrucksCVCount: 720000,
    manufacturingUnitsCount: 15200,
    industrialPowerLoadMW: 8900,
    primaryDepotsCount: 8,
    blendingPlantsCount: 2,
    dealerOutletsCount: 3100,
    topDistricts: [
      { districtName: 'Ludhiana (Bicycle, Auto Parts, Hosiery, Machine Tools)', demandKL: 68400, shareOfStatePct: 40.0, primarySector: 'Hero Cycles, Auto Fasteners, Knitting Machine Lubricants, Forgings', whiteSpotGapKL: 16500 },
      { districtName: 'Jalandhar (Auto Parts, Hand Tools, Sports Machinery)', demandKL: 29070, shareOfStatePct: 17.0, primarySector: 'Drop Forged Hand Tools, Pipe Fittings, Commercial Transport', whiteSpotGapKL: 7000 },
      { districtName: 'Bathinda (HMEL Mittal Refinery, Agro-Fertilizers)', demandKL: 25650, shareOfStatePct: 15.0, primarySector: 'Guru Gobind Singh Refinery, Tractor Transport Hubs', whiteSpotGapKL: 6000 },
      { districtName: 'Amritsar & Mandi Gobindgarh (Steel Re-rolling & Trade)', demandKL: 23940, shareOfStatePct: 14.0, primarySector: '"Iron City" Induction Furnaces, Heavy Structural Re-rolling', whiteSpotGapKL: 6500 }
    ],
    growthDrivers: ['Highest tractor and harvester density per hectare in South Asia driving high agri UTTO & engine oil sales', 'Ludhiana light engineering, fasteners, and machine tools manufacturing hub', 'Mandi Gobindgarh induction furnace and steel re-rolling cluster'],
    keyIndustries: ['Agricultural Tractors & Harvesters', 'Hand Tools & Forgings', 'Textiles, Hosiery & Sewing Machines', 'Steel Re-Rolling Mills'],
    majorLubricantSuppliers: ['SERVO (Ludhiana & Jalandhar)', 'Castrol India', 'Valvoline', 'HPCL', 'Savsol']
  },

  // 14. BIHAR
  {
    stateCode: 'BR',
    stateName: 'Bihar',
    region: 'East',
    isUnionTerritory: false,
    totalDemandKL: 114000, // 2.00% of India
    nationalSharePct: 2.00,
    marketValueINR: 1824,
    automotiveDemandKL: 79800,
    industrialDemandKL: 17100,
    agriculturalDemandKL: 14820,
    miningOffHighwayKL: 2280,
    accessibleSupplyKL: 68400,
    supplyGapKL: 45600,
    coverageRatioPct: 60.0,
    unmetOpportunityINR: 729.6,
    whiteSpotScore: 78.5,
    priorityTier: 'Tier 3 — Expanding Market',
    registeredVehiclesCount: 11500000,
    registeredTrucksCVCount: 520000,
    manufacturingUnitsCount: 5200,
    industrialPowerLoadMW: 5800,
    primaryDepotsCount: 6,
    blendingPlantsCount: 1,
    dealerOutletsCount: 2400,
    topDistricts: [
      { districtName: 'Patna (State Logistics, Fleet Transport, Construction)', demandKL: 39900, shareOfStatePct: 35.0, primarySector: 'Interstate Truck Fleets, Urban Personal Mobility, Diesel Pumps', whiteSpotGapKL: 14000 },
      { districtName: 'Begusarai & Barauni (IOCL Refinery, Fertilizers, Power)', demandKL: 22800, shareOfStatePct: 20.0, primarySector: 'Barauni Refinery, Chemical Fertilizers, River Barges', whiteSpotGapKL: 8500 },
      { districtName: 'Muzaffarpur & Vaishali (Transport & Food Processing)', demandKL: 17100, shareOfStatePct: 15.0, primarySector: 'Agri Logistics, North Bihar Commercial Goods Distribution', whiteSpotGapKL: 6500 },
      { districtName: 'Bhagalpur & Gaya (Silk, Light Manufacturing, Cement)', demandKL: 14820, shareOfStatePct: 13.0, primarySector: 'Silk Handlooms, Stone Crushers, Railway Freight', whiteSpotGapKL: 5500 }
    ],
    growthDrivers: ['Rapidly expanding 2-wheeler and tractor population with rising rural purchasing power', 'Major railway and national highway freight transit hub linking East and Northeast India', 'IOCL Barauni refinery expanding petrochemical production'],
    keyIndustries: ['Agricultural Implements & Diesel Pumps', 'Interstate Commercial Fleets', 'Refining & Petrochemicals', 'Food Processing & Sugar Mills'],
    majorLubricantSuppliers: ['SERVO (Barauni & Patna)', 'Castrol', 'HPCL', 'Gulf Oil', 'MAK (BPCL)']
  },

  // 15. JHARKHAND
  {
    stateCode: 'JH',
    stateName: 'Jharkhand',
    region: 'East',
    isUnionTerritory: false,
    totalDemandKL: 85500, // 1.50% of India
    nationalSharePct: 1.50,
    marketValueINR: 1368,
    automotiveDemandKL: 34200,
    industrialDemandKL: 42750,
    agriculturalDemandKL: 3420,
    miningOffHighwayKL: 5130,
    accessibleSupplyKL: 55575,
    supplyGapKL: 29925,
    coverageRatioPct: 65.0,
    unmetOpportunityINR: 478.8,
    whiteSpotScore: 84.0,
    priorityTier: 'Tier 2 — Industrial Growth',
    registeredVehiclesCount: 6800000,
    registeredTrucksCVCount: 480000,
    manufacturingUnitsCount: 6800,
    industrialPowerLoadMW: 7400,
    primaryDepotsCount: 5,
    blendingPlantsCount: 2,
    dealerOutletsCount: 1600,
    topDistricts: [
      { districtName: 'East Singhbhum & Jamshedpur (Tata Steel, Tata Motors Auto)', demandKL: 34200, shareOfStatePct: 40.0, primarySector: 'Tata Motors Commercial Vehicles, Tata Steel, Timken Bearings', whiteSpotGapKL: 9500 },
      { districtName: 'Dhanbad & Bokaro (Coal India BCCL, SAIL Bokaro Steel)', demandKL: 27360, shareOfStatePct: 32.0, primarySector: 'Coal Mining Dumpers, Draglines, Primary Blast Furnaces', whiteSpotGapKL: 11000 },
      { districtName: 'Ranchi & Ramgarh (HEC Heavy Engineering, Wire Ropes)', demandKL: 14535, shareOfStatePct: 17.0, primarySector: 'Heavy Machine Building (HEC), Coal Transport Fleets', whiteSpotGapKL: 5500 }
    ],
    growthDrivers: ['Mining and heavy steel epicentre with high heavy industrial grease and gear oil intensity', 'Tata Motors commercial vehicle factory in Jamshedpur requiring factory-fill and OEM lubes', 'Massive Coal India (BCCL & CCL) heavy earthmoving fleet operations'],
    keyIndustries: ['Heavy Commercial Vehicles (Tata Motors)', 'Integrated Steel & Wire Ropes', 'Coal & Mineral Mining Fleets', 'Heavy Engineering & Foundry'],
    majorLubricantSuppliers: ['SERVO (Jamshedpur & Dhanbad)', 'Castrol', 'Mobil Industrial', 'MAK (BPCL)', 'Gulf Oil']
  },

  // 16. CHHATTISGARH
  {
    stateCode: 'CT',
    stateName: 'Chhattisgarh',
    region: 'Central',
    isUnionTerritory: false,
    totalDemandKL: 85500, // 1.50% of India
    nationalSharePct: 1.50,
    marketValueINR: 1368,
    automotiveDemandKL: 34200,
    industrialDemandKL: 42750,
    agriculturalDemandKL: 4275,
    miningOffHighwayKL: 4275,
    accessibleSupplyKL: 48450,
    supplyGapKL: 37050,
    coverageRatioPct: 57.0,
    unmetOpportunityINR: 592.8,
    whiteSpotScore: 86.0,
    priorityTier: 'Tier 2 — Industrial Growth',
    registeredVehiclesCount: 6200000,
    registeredTrucksCVCount: 460000,
    manufacturingUnitsCount: 5800,
    industrialPowerLoadMW: 8200,
    primaryDepotsCount: 5,
    blendingPlantsCount: 1,
    dealerOutletsCount: 1400,
    topDistricts: [
      { districtName: 'Raipur & Durg-Bhilai (SAIL Bhilai Steel Plant, Sponge Iron)', demandKL: 38475, shareOfStatePct: 45.0, primarySector: 'SAIL Bhilai Steel, Sponge Iron Kilns, Re-rolling Mills', whiteSpotGapKL: 15500 },
      { districtName: 'Korba (NTPC Thermal Power, BALCO Aluminium Smelter)', demandKL: 23940, shareOfStatePct: 28.0, primarySector: 'Aluminium Smelting, Thermal Power Turbines, SECL Coal Fleets', whiteSpotGapKL: 11000 },
      { districtName: 'Raigarh (Jindal Steel & Power, Iron Ore Logistics)', demandKL: 14535, shareOfStatePct: 17.0, primarySector: 'JSPL Integrated Steel, Heavy Minerals Road Transport', whiteSpotGapKL: 6500 }
    ],
    growthDrivers: ['"Power & Steel Hub" of Central India consuming high volumes of turbine, gear, and hydraulic fluids', 'SAIL Bhilai Steel Plant rail mill expansion and private sponge iron kilns', 'SECL coal operations with high open-cast mining dumper and excavator fluid demand'],
    keyIndustries: ['Steel & Sponge Iron', 'Aluminium Smelting (BALCO)', 'Thermal Power Generation', 'Coal Mining & Off-Highway Fleets'],
    majorLubricantSuppliers: ['SERVO (Raipur & Bhilai)', 'Castrol', 'Gulf Oil (Raipur Hub)', 'MAK (BPCL)', 'HPCL']
  },

  // 17. DELHI NCR
  {
    stateCode: 'DL',
    stateName: 'Delhi NCR',
    region: 'North',
    isUnionTerritory: true,
    totalDemandKL: 85500, // 1.50% of India
    nationalSharePct: 1.50,
    marketValueINR: 1368,
    automotiveDemandKL: 68400,
    industrialDemandKL: 14535,
    agriculturalDemandKL: 0,
    miningOffHighwayKL: 2565,
    accessibleSupplyKL: 72675,
    supplyGapKL: 12825,
    coverageRatioPct: 85.0,
    unmetOpportunityINR: 205.2,
    whiteSpotScore: 76.0,
    priorityTier: 'Tier 3 — Expanding Market',
    registeredVehiclesCount: 13500000,
    registeredTrucksCVCount: 420000,
    manufacturingUnitsCount: 8500,
    industrialPowerLoadMW: 6200,
    primaryDepotsCount: 6,
    blendingPlantsCount: 2,
    dealerOutletsCount: 2800,
    topDistricts: [
      { districtName: 'Mayapuri & Okhla Industrial Areas', demandKL: 34200, shareOfStatePct: 40.0, primarySector: 'Automotive Aftermarket Repair, Printing Machinery, Light Fabrication', whiteSpotGapKL: 4500 },
      { districtName: 'Sanjay Gandhi Transport Nagar & GT Karnal Rd', demandKL: 29925, shareOfStatePct: 35.0, primarySector: 'North India Largest Truck Freight Hub, Heavy Interstate Fleets', whiteSpotGapKL: 5000 },
      { districtName: 'Naraina & Wazirpur Industrial Areas', demandKL: 14535, shareOfStatePct: 17.0, primarySector: 'Stainless Steel Utensil Rolling, Light Engineering', whiteSpotGapKL: 2000 }
    ],
    growthDrivers: ['Highest passenger car density and premium synthetic (0W-20, 5W-30) lubricant adoption', 'Sanjay Gandhi Transport Nagar is India’s highest-density commercial truck transit terminal', 'Rapid transition to EV thermal fluids and hybrid lubricants'],
    keyIndustries: ['Interstate Commercial Fleet Logistics', 'Automotive Aftermarket Workshops', 'Printing & Packaging Machinery', 'Urban Mobility & Fleet Cabs'],
    majorLubricantSuppliers: ['SERVO (Bijwasan & Shakurbasti)', 'Castrol', 'Shell India', 'Mobil', 'TotalEnergies']
  },

  // 18. ASSAM
  {
    stateCode: 'AS',
    stateName: 'Assam',
    region: 'North-East',
    isUnionTerritory: false,
    totalDemandKL: 57000, // 1.00% of India
    nationalSharePct: 1.00,
    marketValueINR: 912,
    automotiveDemandKL: 37050,
    industrialDemandKL: 14250,
    agriculturalDemandKL: 3990,
    miningOffHighwayKL: 1710,
    accessibleSupplyKL: 34200,
    supplyGapKL: 22800,
    coverageRatioPct: 60.0,
    unmetOpportunityINR: 364.8,
    whiteSpotScore: 82.0,
    priorityTier: 'Tier 3 — Expanding Market',
    registeredVehiclesCount: 4500000,
    registeredTrucksCVCount: 280000,
    manufacturingUnitsCount: 3800,
    industrialPowerLoadMW: 2400,
    primaryDepotsCount: 4,
    blendingPlantsCount: 1,
    dealerOutletsCount: 1100,
    topDistricts: [
      { districtName: 'Kamrup & Guwahati (Amingaon Inland Depot, Transport)', demandKL: 25650, shareOfStatePct: 45.0, primarySector: 'Northeast Master Logistics Gateway, FMCG Manufacturing', whiteSpotGapKL: 9500 },
      { districtName: 'Dibrugarh & Tinsukia (Tea Machinery, Oil Fields)', demandKL: 14250, shareOfStatePct: 25.0, primarySector: 'Oil India Duliajan, Tea CTC Processing Mills, Plywood', whiteSpotGapKL: 6000 },
      { districtName: 'Bongaigaon & Chirang (IOCL Refinery, Petrochemicals)', demandKL: 9690, shareOfStatePct: 17.0, primarySector: 'Bongaigaon Refinery, Thermal Power Generation', whiteSpotGapKL: 4000 }
    ],
    growthDrivers: ['Logistics and economic hub serving all 8 Northeastern states', 'Tea processing industry consuming food-grade and CTC gear lubricants', 'Crude oil exploration and refining at Digboi, Guwahati, Numaligarh, and Bongaigaon'],
    keyIndustries: ['Petroleum Refining & Exploration (OIL / ONGC)', 'Tea Processing Machinery', 'Interstate Mountain Freight Logistics', 'Cement & Paper Manufacturing'],
    majorLubricantSuppliers: ['SERVO (Guwahati & Digboi)', 'Castrol', 'MAK (BPCL Numaligarh)', 'HPCL']
  },

  // 19. UTTARAKHAND
  {
    stateCode: 'UK',
    stateName: 'Uttarakhand',
    region: 'North',
    isUnionTerritory: false,
    totalDemandKL: 45600, // 0.80% of India
    nationalSharePct: 0.80,
    marketValueINR: 729.6,
    automotiveDemandKL: 27360,
    industrialDemandKL: 15960,
    agriculturalDemandKL: 1824,
    miningOffHighwayKL: 456,
    accessibleSupplyKL: 31920,
    supplyGapKL: 13680,
    coverageRatioPct: 70.0,
    unmetOpportunityINR: 218.9,
    whiteSpotScore: 80.0,
    priorityTier: 'Tier 3 — Expanding Market',
    registeredVehiclesCount: 3800000,
    registeredTrucksCVCount: 220000,
    manufacturingUnitsCount: 4200,
    industrialPowerLoadMW: 3100,
    primaryDepotsCount: 3,
    blendingPlantsCount: 1,
    dealerOutletsCount: 950,
    topDistricts: [
      { districtName: 'Haridwar (SIDCUL Auto Hub: Hero MotoCorp, Mahindra)', demandKL: 22800, shareOfStatePct: 50.0, primarySector: 'Hero MotoCorp Mega Plant, Mahindra Packaging, FMCG', whiteSpotGapKL: 6500 },
      { districtName: 'Udham Singh Nagar & Pantnagar (Tata Motors CV, Bajaj)', demandKL: 15960, shareOfStatePct: 35.0, primarySector: 'Tata Motors Commercial Factory, Bajaj Auto, Voltas, Nestle', whiteSpotGapKL: 4800 }
    ],
    growthDrivers: ['SIDCUL industrial clusters in Haridwar and Pantnagar with major automotive OEM factories', 'Hill transport vehicle fleet requiring high-shear mountain engine and gear oils', 'FMCG and pharmaceutical manufacturing in tax-exempt zones'],
    keyIndustries: ['Two-Wheelers & Commercial Vehicles', 'Pharmaceutical Formulations', 'FMCG & Packaging', 'Hydropower Turbines'],
    majorLubricantSuppliers: ['SERVO (Haridwar)', 'Castrol', 'Valvoline', 'HPCL', 'Gulf Oil']
  },

  // 20. HIMACHAL PRADESH
  {
    stateCode: 'HP',
    stateName: 'Himachal Pradesh',
    region: 'North',
    isUnionTerritory: false,
    totalDemandKL: 39900, // 0.70% of India
    nationalSharePct: 0.70,
    marketValueINR: 638.4,
    automotiveDemandKL: 23940,
    industrialDemandKL: 13965,
    agriculturalDemandKL: 1596,
    miningOffHighwayKL: 399,
    accessibleSupplyKL: 27930,
    supplyGapKL: 11970,
    coverageRatioPct: 70.0,
    unmetOpportunityINR: 191.5,
    whiteSpotScore: 79.0,
    priorityTier: 'Tier 3 — Expanding Market',
    registeredVehiclesCount: 2200000,
    registeredTrucksCVCount: 180000,
    manufacturingUnitsCount: 3600,
    industrialPowerLoadMW: 2600,
    primaryDepotsCount: 3,
    blendingPlantsCount: 0,
    dealerOutletsCount: 750,
    topDistricts: [
      { districtName: 'Solan & Baddi-Barotiwala-Nalagarh (Pharma Hub)', demandKL: 23940, shareOfStatePct: 60.0, primarySector: 'Asia Largest Pharma Formulation Cluster, Textile Weaving', whiteSpotGapKL: 7200 },
      { districtName: 'Sirmaur & Paonta Sahib (Pharma, Mining, Cement)', demandKL: 7980, shareOfStatePct: 20.0, primarySector: 'Pharma Chemicals, Cement Plants, Limestone', whiteSpotGapKL: 2400 }
    ],
    growthDrivers: ['Baddi-Barotiwala-Nalagarh (BBN) is Asia’s largest pharmaceutical manufacturing hub', 'High commercial truck and bus operating gradient in mountainous terrain', 'Hydroelectric power turbines across Satluj and Beas rivers'],
    keyIndustries: ['Pharmaceutical Formulations', 'Cement & Limestone Processing', 'Hydroelectric Power Generation', 'Apple Packaging & Orchard Equipment'],
    majorLubricantSuppliers: ['SERVO (Baddi)', 'Castrol', 'HPCL', 'MAK (BPCL)']
  },

  // 21. GOA
  {
    stateCode: 'GA',
    stateName: 'Goa',
    region: 'West',
    isUnionTerritory: false,
    totalDemandKL: 34200, // 0.60% of India
    nationalSharePct: 0.60,
    marketValueINR: 547.2,
    automotiveDemandKL: 20520,
    industrialDemandKL: 9234,
    agriculturalDemandKL: 1026,
    miningOffHighwayKL: 3420,
    accessibleSupplyKL: 26334,
    supplyGapKL: 7866,
    coverageRatioPct: 77.0,
    unmetOpportunityINR: 125.9,
    whiteSpotScore: 78.0,
    priorityTier: 'Tier 3 — Expanding Market',
    registeredVehiclesCount: 1650000,
    registeredTrucksCVCount: 95000,
    manufacturingUnitsCount: 1800,
    industrialPowerLoadMW: 1200,
    primaryDepotsCount: 2,
    blendingPlantsCount: 1,
    dealerOutletsCount: 420,
    topDistricts: [
      { districtName: 'South Goa & Mormugao (Port Bunkering, Iron Ore Mining, Pharma)', demandKL: 19494, shareOfStatePct: 57.0, primarySector: 'Marine Ship Bunkering, Iron Ore Barges, Verna Pharma SEZ', whiteSpotGapKL: 4200 },
      { districtName: 'North Goa (Kundaim, Thivim Industrial Estates, Tourism)', demandKL: 14706, shareOfStatePct: 43.0, primarySector: 'Light Engineering, Distilleries, Rental Cabs & Two-Wheelers', whiteSpotGapKL: 3600 }
    ],
    growthDrivers: ['Mormugao Port marine bunkering and coastal vessel lubrication', 'Verna Industrial Estate pharma and precision engineering units', 'High per-capita two-wheeler and rental vehicle fleet turnover'],
    keyIndustries: ['Marine Bunkering & Inland Barges', 'Pharmaceuticals & Formulations', 'Tourist Vehicle Fleets', 'Iron Ore Processing'],
    majorLubricantSuppliers: ['SERVO (Mormugao & Vasco)', 'Castrol', 'Shell Marine', 'HPCL']
  },

  // 22. JAMMU & KASHMIR & LADAKH
  {
    stateCode: 'JK',
    stateName: 'Jammu & Kashmir & Ladakh',
    region: 'North',
    isUnionTerritory: true,
    totalDemandKL: 34200, // 0.60% of India
    nationalSharePct: 0.60,
    marketValueINR: 547.2,
    automotiveDemandKL: 25650,
    industrialDemandKL: 5130,
    agriculturalDemandKL: 2052,
    miningOffHighwayKL: 1368,
    accessibleSupplyKL: 22230,
    supplyGapKL: 11970,
    coverageRatioPct: 65.0,
    unmetOpportunityINR: 191.5,
    whiteSpotScore: 77.0,
    priorityTier: 'Tier 3 — Expanding Market',
    registeredVehiclesCount: 2100000,
    registeredTrucksCVCount: 160000,
    manufacturingUnitsCount: 1600,
    industrialPowerLoadMW: 1400,
    primaryDepotsCount: 3,
    blendingPlantsCount: 0,
    dealerOutletsCount: 650,
    topDistricts: [
      { districtName: 'Jammu & Samba-Kathua (Bari Brahmana Industrial Hub)', demandKL: 20520, shareOfStatePct: 60.0, primarySector: 'Bari Brahmana & Samba Industrial Corridor, Heavy Transport', whiteSpotGapKL: 6800 },
      { districtName: 'Srinagar & Pulwama (Lassipora Agro-Ind. Hub, Apple Fleet)', demandKL: 10260, shareOfStatePct: 30.0, primarySector: 'Cold Storage, Apple Orchard Transport, Mountain Fleets', whiteSpotGapKL: 3800 }
    ],
    growthDrivers: ['Extreme low-temperature sub-zero synthetic lubricant requirement for Himalayan passes', 'Samba and Kathua industrial corridor expansion along Delhi-Amritsar-Katra expressway', 'Heavy military and defense logistics convoy maintenance'],
    keyIndustries: ['Military Convoy Transport', 'Cold Chain & Agro-Packaging', 'Sub-Zero Specialized Lubrication', 'Cement & Highway Construction'],
    majorLubricantSuppliers: ['SERVO (IOCL Jammu Depot)', 'Castrol', 'HPCL', 'MAK (BPCL)']
  },

  // 23. KERALA
  {
    stateCode: 'KL',
    stateName: 'Kerala',
    region: 'South',
    isUnionTerritory: false,
    totalDemandKL: 28500, // 0.50% of India
    nationalSharePct: 0.50,
    marketValueINR: 456,
    automotiveDemandKL: 22800,
    industrialDemandKL: 4275,
    agriculturalDemandKL: 855,
    miningOffHighwayKL: 570,
    accessibleSupplyKL: 23940,
    supplyGapKL: 4560,
    coverageRatioPct: 84.0,
    unmetOpportunityINR: 72.9,
    whiteSpotScore: 74.0,
    priorityTier: 'Tier 3 — Expanding Market',
    registeredVehiclesCount: 15800000,
    registeredTrucksCVCount: 520000,
    manufacturingUnitsCount: 4200,
    industrialPowerLoadMW: 2800,
    primaryDepotsCount: 4,
    blendingPlantsCount: 1,
    dealerOutletsCount: 2200,
    topDistricts: [
      { districtName: 'Ernakulam & Kochi (Cochin Shipyard, BPCL Kochi Refinery, Port)', demandKL: 14250, shareOfStatePct: 50.0, primarySector: 'BPCL Kochi Refinery, Marine Bunkering, Commercial Fleets', whiteSpotGapKL: 2000 },
      { districtName: 'Kozhikode & Malappuram (Transport & Trade)', demandKL: 7125, shareOfStatePct: 25.0, primarySector: 'Interstate Freight Fleets, Personal Mobility 2W/PCMO', whiteSpotGapKL: 1200 }
    ],
    growthDrivers: ['High passenger car per-capita density with demand for high-tier full-synthetic engine oils', 'BPCL Kochi Refinery base oil manufacturing and Cochin Shipyard marine bunker demand', 'Dense network of authorized OEM workshops and fuel retail stations'],
    keyIndustries: ['Marine Bunkering & Ship Repair', 'Petroleum Refining & Base Oils', 'Commercial Bus Transport Fleets', 'Rubber & Coir Processing'],
    majorLubricantSuppliers: ['MAK (BPCL Kochi)', 'SERVO (IOCL Irumpanam)', 'Castrol', 'Shell', 'HPCL']
  },

  // 24. DADRA & NAGAR HAVELI AND DAMAN & DIU
  {
    stateCode: 'DN',
    stateName: 'Dadra & Nagar Haveli and Daman & Diu',
    region: 'West',
    isUnionTerritory: true,
    totalDemandKL: 22800, // 0.40% of India
    nationalSharePct: 0.40,
    marketValueINR: 364.8,
    automotiveDemandKL: 7980,
    industrialDemandKL: 14250,
    agriculturalDemandKL: 285,
    miningOffHighwayKL: 285,
    accessibleSupplyKL: 17784,
    supplyGapKL: 5016,
    coverageRatioPct: 78.0,
    unmetOpportunityINR: 80.3,
    whiteSpotScore: 82.0,
    priorityTier: 'Tier 3 — Expanding Market',
    registeredVehiclesCount: 480000,
    registeredTrucksCVCount: 95000,
    manufacturingUnitsCount: 3400,
    industrialPowerLoadMW: 2100,
    primaryDepotsCount: 2,
    blendingPlantsCount: 4,
    dealerOutletsCount: 220,
    topDistricts: [
      { districtName: 'Silvassa (Gulf Oil Mega Blending Plant, Textiles, Plastics)', demandKL: 14820, shareOfStatePct: 65.0, primarySector: 'Gulf Oil Blending Plant, Synthetic Yarn, Flexible Packaging', whiteSpotGapKL: 3200 },
      { districtName: 'Daman (Kachigam, Somnath Plastics & Light Engg)', demandKL: 7980, shareOfStatePct: 35.0, primarySector: 'Plastic Injection Moulding, Paper Packaging, Pharmaceuticals', whiteSpotGapKL: 1800 }
    ],
    growthDrivers: ['Home to Gulf Oil’s premier modern blending and R&D plant in Silvassa', 'Dense concentration of plastic extrusion, synthetic textiles, and packaging mills', 'Proximity to Vapi and Mumbai industrial corridors'],
    keyIndustries: ['Lubricant Blending & Packaging', 'Plastic Injection Moulding', 'Synthetic Polyester Yarn', 'Paper Corrugation & Packaging'],
    majorLubricantSuppliers: ['Gulf Oil Lubricants (Silvassa Facility)', 'Castrol', 'SERVO', 'Savsol']
  },

  // 25. MEGHALAYA
  {
    stateCode: 'ML',
    stateName: 'Meghalaya',
    region: 'North-East',
    isUnionTerritory: false,
    totalDemandKL: 8550, // 0.15% of India
    nationalSharePct: 0.15,
    marketValueINR: 136.8,
    automotiveDemandKL: 5130,
    industrialDemandKL: 2565,
    agriculturalDemandKL: 428,
    miningOffHighwayKL: 428,
    accessibleSupplyKL: 4703,
    supplyGapKL: 3848,
    coverageRatioPct: 55.0,
    unmetOpportunityINR: 61.6,
    whiteSpotScore: 79.5,
    priorityTier: 'Tier 4 — Regional Frontier',
    registeredVehiclesCount: 450000,
    registeredTrucksCVCount: 48000,
    manufacturingUnitsCount: 450,
    industrialPowerLoadMW: 380,
    primaryDepotsCount: 1,
    blendingPlantsCount: 0,
    dealerOutletsCount: 140,
    topDistricts: [
      { districtName: 'Ri-Bhoi (Byrnihat Industrial Area)', demandKL: 5130, shareOfStatePct: 60.0, primarySector: 'Ferro Alloys, Steel Ingot Melting, Export Fleets', whiteSpotGapKL: 2200 },
      { districtName: 'East Khasi Hills (Shillong Transport Hub)', demandKL: 2565, shareOfStatePct: 30.0, primarySector: 'Hill Fleet Logistics, Personal Mobility', whiteSpotGapKL: 1200 }
    ],
    growthDrivers: ['Byrnihat ferro-alloy and iron smelting export manufacturing zone', 'Hill truck fleet operating on heavy torque mountain roads'],
    keyIndustries: ['Ferro Alloys & Iron Smelting', 'Cement & Limestone Processing', 'Hill Road Transport'],
    majorLubricantSuppliers: ['SERVO (IOCL Byrnihat)', 'Castrol', 'HPCL']
  },

  // 26. TRIPURA
  {
    stateCode: 'TR',
    stateName: 'Tripura',
    region: 'North-East',
    isUnionTerritory: false,
    totalDemandKL: 5700, // 0.10% of India
    nationalSharePct: 0.10,
    marketValueINR: 91.2,
    automotiveDemandKL: 4275,
    industrialDemandKL: 855,
    agriculturalDemandKL: 285,
    miningOffHighwayKL: 285,
    accessibleSupplyKL: 3420,
    supplyGapKL: 2280,
    coverageRatioPct: 60.0,
    unmetOpportunityINR: 36.5,
    whiteSpotScore: 76.0,
    priorityTier: 'Tier 4 — Regional Frontier',
    registeredVehiclesCount: 520000,
    registeredTrucksCVCount: 38000,
    manufacturingUnitsCount: 320,
    industrialPowerLoadMW: 240,
    primaryDepotsCount: 1,
    blendingPlantsCount: 0,
    dealerOutletsCount: 120,
    topDistricts: [
      { districtName: 'West Tripura & Agartala (Bodhjungnagar Growth Centre)', demandKL: 3990, shareOfStatePct: 70.0, primarySector: 'Rubber Processing, Natural Gas Power, Border Trade Fleets', whiteSpotGapKL: 1500 }
    ],
    growthDrivers: ['Natural gas turbine power plants and ONGC exploration units', 'Rubber sheet and latex processing mills along Agartala corridor'],
    keyIndustries: ['Natural Gas Turbines', 'Natural Rubber Processing', 'Cross-Border Bangladesh Trade Logistics'],
    majorLubricantSuppliers: ['SERVO (IOCL Agartala)', 'Castrol', 'HPCL']
  },

  // 27. PUDUCHERRY
  {
    stateCode: 'PY',
    stateName: 'Puducherry',
    region: 'South',
    isUnionTerritory: true,
    totalDemandKL: 5700, // 0.10% of India
    nationalSharePct: 0.10,
    marketValueINR: 91.2,
    automotiveDemandKL: 3705,
    industrialDemandKL: 1710,
    agriculturalDemandKL: 143,
    miningOffHighwayKL: 143,
    accessibleSupplyKL: 4560,
    supplyGapKL: 1140,
    coverageRatioPct: 80.0,
    unmetOpportunityINR: 18.2,
    whiteSpotScore: 75.0,
    priorityTier: 'Tier 4 — Regional Frontier',
    registeredVehiclesCount: 1100000,
    registeredTrucksCVCount: 42000,
    manufacturingUnitsCount: 650,
    industrialPowerLoadMW: 420,
    primaryDepotsCount: 1,
    blendingPlantsCount: 0,
    dealerOutletsCount: 180,
    topDistricts: [
      { districtName: 'Puducherry & Sedarapet Industrial Estate', demandKL: 4560, shareOfStatePct: 80.0, primarySector: 'Precision Engineering, Chemical Formulations, Tourism Fleets', whiteSpotGapKL: 900 }
    ],
    growthDrivers: ['Light engineering and chemical manufacturing in Sedarapet and Mettupalayam', 'High tourist vehicle and two-wheeler density'],
    keyIndustries: ['Precision Machine Tools', 'Chemicals & Cosmetics', 'Urban & Tourist Vehicle Mobility'],
    majorLubricantSuppliers: ['SERVO', 'Castrol', 'MAK (BPCL)']
  },

  // 28. CHANDIGARH
  {
    stateCode: 'CH',
    stateName: 'Chandigarh',
    region: 'North',
    isUnionTerritory: true,
    totalDemandKL: 5700, // 0.10% of India
    nationalSharePct: 0.10,
    marketValueINR: 91.2,
    automotiveDemandKL: 4845,
    industrialDemandKL: 855,
    agriculturalDemandKL: 0,
    miningOffHighwayKL: 0,
    accessibleSupplyKL: 4845,
    supplyGapKL: 855,
    coverageRatioPct: 85.0,
    unmetOpportunityINR: 13.7,
    whiteSpotScore: 73.0,
    priorityTier: 'Tier 4 — Regional Frontier',
    registeredVehiclesCount: 1250000,
    registeredTrucksCVCount: 35000,
    manufacturingUnitsCount: 420,
    industrialPowerLoadMW: 320,
    primaryDepotsCount: 1,
    blendingPlantsCount: 0,
    dealerOutletsCount: 150,
    topDistricts: [
      { districtName: 'Chandigarh Industrial Area Phase 1 & 2', demandKL: 5700, shareOfStatePct: 100.0, primarySector: 'Automotive Dealerships, Precision Light Tooling, Government Fleets', whiteSpotGapKL: 855 }
    ],
    growthDrivers: ['Highest passenger car density per capita in India', 'Hub for Punjab and Haryana government fleets and corporate transport'],
    keyIndustries: ['Premium Automotive Workshops', 'Light Electrical Engineering', 'Corporate Fleets'],
    majorLubricantSuppliers: ['SERVO', 'Castrol', 'Shell', 'Mobil']
  },

  // 29-36. REMAINING STATES & UTS (Sikkim, Arunachal, Nagaland, Manipur, Mizoram, A&N Islands, Ladakh, Lakshadweep)
  {
    stateCode: 'OTHER_NE_UT',
    stateName: 'Other NE States & Island UTs (Sikkim, Arunachal, Nagaland, Manipur, Mizoram, A&N, Lakshadweep)',
    region: 'North-East',
    isUnionTerritory: true,
    totalDemandKL: 14250, // 0.25% of India
    nationalSharePct: 0.25,
    marketValueINR: 228.0,
    automotiveDemandKL: 10260,
    industrialDemandKL: 2565,
    agriculturalDemandKL: 713,
    miningOffHighwayKL: 713,
    accessibleSupplyKL: 7410,
    supplyGapKL: 6840,
    coverageRatioPct: 52.0,
    unmetOpportunityINR: 109.4,
    whiteSpotScore: 78.0,
    priorityTier: 'Tier 4 — Regional Frontier',
    registeredVehiclesCount: 1200000,
    registeredTrucksCVCount: 92000,
    manufacturingUnitsCount: 850,
    industrialPowerLoadMW: 650,
    primaryDepotsCount: 2,
    blendingPlantsCount: 0,
    dealerOutletsCount: 320,
    topDistricts: [
      { districtName: 'Sikkim (Rangpo Pharma Hub)', demandKL: 4560, shareOfStatePct: 32.0, primarySector: 'Pharma Formulation Packaging, Hydro Turbines', whiteSpotGapKL: 1800 },
      { districtName: 'Arunachal Pradesh (Itanagar - Hydropower & Border Roads)', demandKL: 3420, shareOfStatePct: 24.0, primarySector: 'Heavy Dam Construction, BRO Mountain Fleets', whiteSpotGapKL: 1900 },
      { districtName: 'Nagaland & Manipur (Kohima & Imphal Transport Corridors)', demandKL: 3420, shareOfStatePct: 24.0, primarySector: 'Mountain Interstate Logistics, Timber & Agro', whiteSpotGapKL: 1800 },
      { districtName: 'Andaman & Nicobar Islands (Port Blair Marine & Power)', demandKL: 2850, shareOfStatePct: 20.0, primarySector: 'Island Diesel GenSets, Inter-Island Ferries & Bunkering', whiteSpotGapKL: 1340 }
    ],
    growthDrivers: ['Pharma manufacturing boom in tax-incentivized Sikkim', 'Mega hydroelectric power dam construction across Arunachal Pradesh', 'Inter-island ferry and coastal shipping in Andaman & Nicobar'],
    keyIndustries: ['Pharmaceuticals (Sikkim)', 'Hydroelectric Power Dam Turbines', 'BRO Border Road Fleet Operations', 'Island Marine Ferries & Diesel Generators'],
    majorLubricantSuppliers: ['SERVO (IOCL Depots)', 'Castrol', 'HPCL']
  }
];

// MACRO SUMMARY TOTALS VERIFICATION
export const ALL_INDIA_MACRO_SUMMARY = {
  totalNationalDemandKL: 5700000, // Exactly 5.70 Million KL
  totalNationalValueINR: 91200, // ₹91,200 Crores
  totalStatesAndUTsCount: 36,
  automotiveDemandKL: 3420000, // 60.0%
  industrialDemandKL: 1995000, // 35.0%
  agriSpecialtyDemandKL: 285000, // 5.0%
  totalAccessibleSupplyKL: 4192665, // ~73.55% All-India coverage
  totalNationalSupplyGapKL: 1507335 // ~26.45% All-India Gap (₹24,117 Cr unmet/sub-optimal pool)
};
