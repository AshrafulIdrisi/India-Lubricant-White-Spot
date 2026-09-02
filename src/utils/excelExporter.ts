import { LocationRecord } from '../types';
import { ALL_INDIA_STATES_DATA } from '../data/allIndiaStateData';
import { BRAND_COMPANIES_DATA } from '../data/brandMarketData';
import { ALL_50_COMPETITORS, SUMMARY_COMPETITORS } from '../data/competitors24Data';
import { ALL_36_MAX_WHITE_SPOT_CLUSTERS, SUMMARY_36_MAX_CLUSTERS } from '../data/maxWhiteSpotClustersData';
import { CURRENT_DISTRIBUTORS } from '../data/indiaGeoData';

// Generate clean Excel-compatible CSV formats with BOM for seamless Microsoft Excel and Google Sheets importing

export interface ExcelExportOptions {
  fileName?: string;
  locations: LocationRecord[];
  activeScenario?: string;
}

export function downloadWhiteSpotExcel(locations: LocationRecord[], scenario: string = 'Base') {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `India_Lubricants_WhiteSpot_Validation_${timestamp}.csv`;

  // Build CSV content with multi-section structure
  let csv = '\uFEFF'; // UTF-8 BOM for Excel to open seamlessly without character corruption

  // 1. Title and Metadata Banner
  csv += `"INDIA LUBRICANTS INDUSTRY // WHITE-SPOT OPPORTUNITY & DEMAND VALIDATION MODEL"\n`;
  csv += `"Macro Benchmark Total Demand:","5,700,000 KL / Year","Total Market Value:","INR 91,200 Crores","Audited Year:","FY24-25"\n`;
  csv += `"Accessible Incumbent Supply:","4,189,500 KL (73.55% Coverage)","Unmet National Supply Gap:","1,510,500 KL (26.45% Deficit)","Deficit Market Value:","INR 24,117.4 Crores"\n`;
  csv += `"Active Simulation Scenario:","${scenario}","Generated Date:","${new Date().toLocaleString('en-IN')}"\n\n`;

  // 2. Section 1: Top Strategic White-Spot Locations (Granular Field Validation)
  csv += `"SECTION 1: PRIORITY WHITE-SPOT CLUSTERS VALIDATION (FIELD AUDIT)"\n`;
  csv += [
    '"Cluster ID"',
    '"Cluster Name"',
    '"Parent District"',
    '"State"',
    '"Region"',
    '"Latitude"',
    '"Longitude"',
    '"Total Demand (KL/yr)"',
    '"Accessible Supply (KL/yr)"',
    '"Supply Gap Deficit (KL/yr)"',
    '"Coverage Ratio (%)"',
    '"White Spot Score (0-100)"',
    '"Opportunity Tier"',
    '"White Spot Typology"',
    '"Unmet Value (INR Cr)"',
    '"Recommended Facility"',
    '"Storage Cap (KL)"',
    '"2-Wheelers Count"',
    '"Passenger Cars"',
    '"M&HCV Trucks"',
    '"Tractors / Agri"',
    '"Mfg Units"',
    '"Power Consumption (MW)"',
    '"Incumbent Brands Present"',
    '"Data Confidence (%)"'
  ].join(',') + '\n';

  locations.forEach((loc, idx) => {
    const row = [
      `"WS-${String(idx + 1).padStart(2, '0')}"`,
      `"${loc.name.replace(/"/g, '""')}"`,
      `"${(loc.parentDistrict || loc.name).replace(/"/g, '""')}"`,
      `"${loc.stateName}"`,
      `"${loc.region}"`,
      loc.latitude,
      loc.longitude,
      loc.totalEstimatedDemandKL,
      loc.supply?.estimatedAccessibleSupplyKL || 0,
      loc.supplyGapKL,
      `${loc.supplyCoverageRatioPct}%`,
      loc.whiteSpotScore,
      `"${loc.opportunityTier}"`,
      `"${loc.whiteSpotType}"`,
      loc.unmetOpportunityValueINR,
      `"${loc.recommendedFacility}"`,
      loc.recommendedStorageCapacityKL,
      loc.vehicles.twoWheelers,
      loc.vehicles.passengerCars,
      loc.vehicles.mediumHeavyTrucks,
      loc.vehicles.tractorsAndAgri,
      loc.industry.manufacturingUnits,
      loc.industry.industrialPowerLoadMW || 0,
      `"${(loc.supply?.topBrandsPresent || []).join('; ')}"`,
      `${loc.confidenceMeta?.confidenceScore || 90}%`
    ];
    csv += row.join(',') + '\n';
  });

  csv += '\n';

  // 3. Section 2: All 36 States & UTs Macro Supply & Demand Reconciliation
  csv += `"SECTION 2: ALL-INDIA 36 STATES & UNION TERRITORIES ENHANCED WHITE-SPOT RECONCILIATION"\n`;
  csv += [
    '"State Code"',
    '"State / UT Name"',
    '"Geographic Zone"',
    '"Total Demand (KL/yr)"',
    '"National Share (%)"',
    '"Market Value (INR Cr)"',
    '"Accessible Supply (KL/yr)"',
    '"Supply Gap Deficit (KL/yr)"',
    '"Coverage Ratio (%)"',
    '"Unmet Value (INR Cr)"',
    '"Priority Tier"',
    '"Rural Agri Gap (KL)"',
    '"Unorganized Grey Gap (KL)"',
    '"MSME Pails Gap (KL)"',
    '"Highway Freight Gap (KL)"',
    '"Dominant Gap Vector"',
    '"Recommended Depot Action"',
    '"Target Stockist Count"',
    '"Priority Target SKUs"',
    '"Lead Growth Drivers & Key Hubs"'
  ].join(',') + '\n';

  ALL_INDIA_STATES_DATA.forEach(s => {
    // Dynamically calculate vectors & roadmap for each state
    const indShare = s.industrialDemandKL / s.totalDemandKL;
    const agriShare = s.agriculturalDemandKL / s.totalDemandKL;
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
    } else if (s.registeredTrucksCVCount > 1500000) {
      logWeight = 0.25;
      unorgWeight = 0.30;
      ruralWeight = 0.25;
      msmeWeight = 0.20;
    }

    const totalWeight = ruralWeight + unorgWeight + msmeWeight + logWeight;
    const ruralAgriGapKL = Math.round(s.supplyGapKL * (ruralWeight / totalWeight));
    const msmeIndustrialPailGapKL = Math.round(s.supplyGapKL * (msmeWeight / totalWeight));
    const highwayLogisticsGapKL = Math.round(s.supplyGapKL * (logWeight / totalWeight));
    const unorganizedLubeGapKL = s.supplyGapKL - (ruralAgriGapKL + msmeIndustrialPailGapKL + highwayLogisticsGapKL);

    let dominant = 'Rural Agri-Mandis';
    const maxVal = Math.max(ruralAgriGapKL, unorganizedLubeGapKL, msmeIndustrialPailGapKL, highwayLogisticsGapKL);
    if (maxVal === msmeIndustrialPailGapKL) dominant = 'MSME Industrial Pails';
    else if (maxVal === highwayLogisticsGapKL) dominant = 'Highway Freight Logistics';
    else if (maxVal === unorganizedLubeGapKL) dominant = 'Unorganized Lube Displacement';

    const stockistCount = Math.max(4, Math.round(s.supplyGapKL / 4500));

    const row = [
      `"${s.stateCode}"`,
      `"${s.stateName}"`,
      `"${s.region}"`,
      s.totalDemandKL,
      `${s.nationalSharePct}%`,
      s.marketValueINR,
      s.accessibleSupplyKL,
      s.supplyGapKL,
      `${s.coverageRatioPct}%`,
      s.unmetOpportunityINR,
      `"${s.priorityTier}"`,
      ruralAgriGapKL,
      unorganizedLubeGapKL,
      msmeIndustrialPailGapKL,
      highwayLogisticsGapKL,
      `"${dominant}"`,
      `"Deploy ${stockistCount} exclusive stockists & staging buffer in ${s.stateName}"`,
      stockistCount,
      `"15W-40 CK-4; ISO VG 68; UTTO Agri; 20W-40 4T"`,
      `"${(s.growthDrivers || []).join('; ').replace(/"/g, '""')}"`
    ];
    csv += row.join(',') + '\n';
  });

  csv += '\n';

  // 4. Section 3: National Brand Shares & Corporate Categorization
  csv += `"SECTION 3: INCUMBENT BRAND SHARES & CORPORATE THROUGHPUT BENCHMARK (5.70M KL)"\n`;
  csv += [
    '"Rank"',
    '"Brand Name"',
    '"Parent Company"',
    '"Ownership Classification"',
    '"National Volume (KL/yr)"',
    '"Market Share (%)"',
    '"Annual Revenue (INR Cr)"',
    '"Depot Count National"',
    '"Pricing Tier"',
    '"Key Strengths"'
  ].join(',') + '\n';

  BRAND_COMPANIES_DATA.forEach((b, idx) => {
    const row = [
      idx + 1,
      `"${b.brandName}"`,
      `"${b.parentCompany}"`,
      `"${b.companyType}"`,
      b.nationalSupplyVolumeKL,
      `${b.nationalMarketSharePct}%`,
      b.nationalRevenueINR,
      b.depotCountNational,
      `"${b.pricingTier}"`,
      `"${(b.keyStrengths || []).join('; ').replace(/"/g, '""')}"`
    ];
    csv += row.join(',') + '\n';
  });

  csv += '\n';

  // 4. Section 3: All-India 50 Competitors Capacity & Distributor Throughput Audit
  csv += `"SECTION 3: ALL-INDIA 50 MASTER COMPETITORS BLENDING CAPACITY & DISTRIBUTOR NETWORK RECONCILIATION"\n`;
  csv += [
    '"Rank"',
    '"Brand Name"',
    '"Parent Company"',
    '"Category Tier"',
    '"Installed Blending Capacity (KL/yr)"',
    '"Capacity Utilization (%)"',
    '"Annual Dispatched Volume (KL/yr)"',
    '"National Market Share (%)"',
    '"Authorized Primary Distributors"',
    '"Avg Annual Throughput per Distributor (KL/yr)"',
    '"Estimated Revenue (INR Cr)"',
    '"Mother Blending Plants"',
    '"Flagship Core SKU"',
    '"Strategic Focus & Market Channel"'
  ].join(',') + '\n';

  ALL_50_COMPETITORS.forEach(c => {
    const row = [
      c.rank,
      `"${c.brandName}"`,
      `"${c.parentCompany}"`,
      `"${c.category}"`,
      c.blendingCapacityKL,
      `${c.capacityUtilizationPct}%`,
      c.annualDispatchedVolumeKL,
      `${c.nationalMarketSharePct}%`,
      c.distributorCountNational,
      c.avgDistributorThroughputKL,
      c.estimatedRevenueCr,
      `"${c.motherPlants.join('; ').replace(/"/g, '""')}"`,
      `"${c.keyFlagshipSKU.replace(/"/g, '""')}"`,
      `"${c.primaryFocus.replace(/"/g, '""')}"`
    ];
    csv += row.join(',') + '\n';
  });

  csv += `"","TOTAL / BLENDED AVERAGE","","","${SUMMARY_COMPETITORS.totalInstalledCapacityKL}","${SUMMARY_COMPETITORS.blendedCapacityUtilizationPct}%","${SUMMARY_COMPETITORS.totalDispatchedVolumeKL}","${SUMMARY_COMPETITORS.totalOrganizedMarketSharePct}%","${SUMMARY_COMPETITORS.totalDistributorCount}","${SUMMARY_COMPETITORS.avgBlendedThroughputPerDistributorKL}","78450.0","Pan-India Blending Infrastructure","Top 50 Reconciled","Organized Supply Reconciled with PPAC & Disclosures"\n\n`;

  // 5. Section 4: Monitored Channel Distributors Footprint
  csv += `"SECTION 4: CURRENT MONITORED CHANNEL DISTRIBUTOR LOGISTICS FOOTPRINT"\n`;
  csv += [
    '"Distributor ID"',
    '"Firm Name"',
    '"Associated Brand"',
    '"Parent Company"',
    '"State"',
    '"District / City"',
    '"Annual Throughput (KL)"',
    '"Monthly Throughput (KL)"',
    '"Warehouse Capacity (KL)"',
    '"Dealer Network Count"',
    '"Industrial Accounts"',
    '"Coverage Radius (km)"',
    '"Performance Tier"'
  ].join(',') + '\n';

  CURRENT_DISTRIBUTORS.forEach(d => {
    const row = [
      `"${d.id}"`,
      `"${d.name.replace(/"/g, '""')}"`,
      `"${d.brand}"`,
      `"${d.parentCompany}"`,
      `"${d.stateName}"`,
      `"${d.district}"`,
      d.annualVolumeKL,
      d.monthlyThroughputKL,
      d.warehouseCapacityKL,
      d.dealerNetworkCount,
      d.industrialAccountsCount,
      d.coverageRadiusKm,
      `"${d.performanceTier}"`
    ];
    csv += row.join(',') + '\n';
  });

  csv += '\n';

  // 6. Section 5: Master 36 Max White-Spot Clusters Deficit Coverage Model
  csv += `"SECTION 5: MASTER ALL-INDIA 36 MAX WHITE-SPOT CLUSTERS & 100% DEFICIT COVERAGE NETWORK (1.51M KL)"\n`;
  csv += [
    '"Cluster Rank"',
    '"Cluster Name"',
    '"Target Hub City"',
    '"State"',
    '"Region"',
    '"Total Demand in Cluster (KL/yr)"',
    '"Current Accessible Supply (KL/yr)"',
    '"Unserved Deficit (KL/yr)"',
    '"Deficit Coverage (%)"',
    '"Unmet Market Value (INR Cr)"',
    '"Dominant Lubricant Sector"',
    '"Recommended Regional Depot Capacity (KL)"',
    '"Recommended Safety Stock (KL)"',
    '"Estimated Capex (INR Cr)"',
    '"Annual Freight Savings (INR Cr)"',
    '"Strategic Rollout Phase"',
    '"Target Year-1 Capture Volume (KL/yr)"',
    '"Key Anchor Industries"',
    '"Serviced Districts Ring"',
    '"Logistics & Freight Connectivity"'
  ].join(',') + '\n';

  ALL_36_MAX_WHITE_SPOT_CLUSTERS.forEach(ws => {
    const row = [
      ws.clusterRank,
      `"${ws.clusterName.replace(/"/g, '""')}"`,
      `"${ws.targetHubCity.replace(/"/g, '""')}"`,
      `"${ws.stateName}"`,
      `"${ws.region}"`,
      ws.totalClusterDemandKL,
      ws.accessibleSupplyKL,
      ws.unservedDeficitKL,
      `${ws.deficitCoveragePct}%`,
      ws.unmetMarketValueCr,
      `"${ws.dominantSector}"`,
      ws.recommendedDepotSizeKL,
      ws.recommendedSafetyStockKL,
      ws.estimatedCapexCr,
      ws.annualFreightSavingsCr,
      `"${ws.rolloutPhase}"`,
      ws.targetAnnualCaptureVolKL,
      `"${ws.keyAnchorIndustries.join('; ').replace(/"/g, '""')}"`,
      `"${ws.servicedDistricts.join('; ').replace(/"/g, '""')}"`,
      `"${ws.logisticsConnectivity.replace(/"/g, '""')}"`
    ];
    csv += row.join(',') + '\n';
  });

  csv += `"","TOTAL ALL-INDIA 36 MAX WHITE-SPOT CLUSTERS","","","","${SUMMARY_36_MAX_CLUSTERS.totalClusterDemandKL}","${SUMMARY_36_MAX_CLUSTERS.totalAccessibleSupplyKL}","${SUMMARY_36_MAX_CLUSTERS.totalDeficitCoveredKL}","50.3%","${SUMMARY_36_MAX_CLUSTERS.totalDeficitMarketValueCr}","Full-Line Pan-India Portfolio","${SUMMARY_36_MAX_CLUSTERS.totalRecommendedStorageCapacityKL}","${SUMMARY_36_MAX_CLUSTERS.totalRecommendedSafetyStockKL}","${SUMMARY_36_MAX_CLUSTERS.totalNetworkCapexCr}","${SUMMARY_36_MAX_CLUSTERS.totalAnnualFreightSavingsCr}","3-Year Phased Rollout Plan","${SUMMARY_36_MAX_CLUSTERS.targetAnnualCaptureYear1KL}","100% Pan-India Industrial, Mining, Agri & Logistics Sectors","36 Hub Rings (140+ Districts)","WDFC, EDFC, National Expressways & Golden Quadrilateral"\n\n`;

  // Trigger file download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
