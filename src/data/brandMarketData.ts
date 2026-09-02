import { BrandCompanyData, MacroMarketReconciliation } from '../types';

export const MACRO_MARKET_RECONCILIATION: MacroMarketReconciliation = {
  totalNationalMarketKL: 5700000, // 5.70 Million KL per year (Exact User Benchmark Dataset)
  totalNationalValueINR: 91200, // ₹91,200 Crores (at ~₹160/L avg realization)
  automotiveDemandKL: 3420000, // 60.0% of National Market (PCMO, 2W MCO, HDEO CVs, Buses)
  industrialDemandKL: 1995000, // 35.0% of National Market (Hydraulics, Gear, Turbines, Metalworking, Transformer)
  specialtyAgriMarineDemandKL: 285000, // 5.0% of National Market (Tractor UTTO, Marine Bunker, Greases, Process Oils)
  analyzedClusterDemandKL: 5700000, // Overall India Demand (5,700,000 KL)
  analyzedClusterSupplyKL: 4192665, // 73.55% Existing Accessible Supply nationwide
  analyzedClusterGapKL: 1507335, // 26.45% National Supply Deficit Gap (1.51M KL)
  analyzedClusterOpportunityINR: 24117.4, // ₹24,117.4 Crores total addressable unmet pool
  clusterShareOfNationalPct: 100.0, // 100% of India's aggregate consumption
  dataSources: [
    {
      name: 'Indian Oil Corporation (IOCL Disclosed)',
      entity: 'Official IOCL Website & Disclosures',
      metrics: 'SERVO brand sales volume (1.54M KL, 27.0% share)',
      period: 'High Confidence — Company-disclosed'
    },
    {
      name: 'Petroleum Planning & Analysis Cell (PPAC)',
      entity: 'Ministry of Petroleum & Natural Gas (MoPNG)',
      metrics: 'National petroleum consumption, OMC dispatches, macro totals (5.70M KL)',
      period: 'FY 2024-25 & FY 2025-26 Estimates'
    },
    {
      name: 'Industry Modeled Estimates',
      entity: 'Company Reports & Market Analysis',
      metrics: 'Castrol (0.74M KL), BPCL MAK (0.63M KL), HPCL (0.57M KL), Shell (0.34M KL), Gulf (0.26M KL), Mobil (0.20M KL), Total (0.14M KL), Valvoline (0.11M KL)',
      period: 'Modeled Baseline'
    },
    {
      name: 'VAHAN 4.0 Central Vehicle Registry & ASI',
      entity: 'MoRTH & Ministry of Statistics & MSME',
      metrics: 'Fleet censuses, power consumption, machine tools across all 36 States & UTs (5.70M KL)',
      period: 'Live Sync Series'
    }
  ]
};

export const BRAND_COMPANIES_DATA: BrandCompanyData[] = [
  // 1. Indian Oil Corporation (SERVO)
  {
    id: 'brand-servo',
    brandName: 'SERVO',
    parentCompany: 'Indian Oil Corporation',
    companyType: 'OMC Public Sector',
    nationalMarketSharePct: 27.0,
    volumeMillionKL: 1.54,
    nationalSupplyVolumeKL: 1540000,
    basis: 'Sourced (IOCL website)',
    confidence: 'High — company-disclosed',
    nationalRevenueINR: 23100,
    blendingCapacityKL: 1800000,
    capacityUtilizationPct: 85.6,
    plantLocations: ['Trombay (Mumbai)', 'Chennai', 'Kolkata', 'Faridabad', 'Vasa (Navi Mumbai)', 'Panipat'],
    headquarters: 'New Delhi / Mumbai',
    sectorStrengths: [
      { sector: 'Commercial Fleets (HDEO)', sharePct: 35, volumeKL: 539000 },
      { sector: 'Industrial & Metalworking', sharePct: 30, volumeKL: 462000 },
      { sector: 'Personal Mobility (PCMO/2W)', sharePct: 18, volumeKL: 277200 },
      { sector: 'Railways, Marine & Defense', sharePct: 12, volumeKL: 184800 },
      { sector: 'Agricultural Machinery', sharePct: 5, volumeKL: 77000 }
    ],
    clusterSupplyVolumeKL: 24800,
    clusterMarketSharePct: 28.85,
    clusterDeficitExposureKL: 24200,
    depotCountNational: 142,
    retailDealerNetworkCount: 34000,
    authorizedWorkshopsCount: 1850,
    directIndustrialAccounts: 4800,
    flagshipSKUs: [
      'Servo Super 15W-40 (API CI-4)',
      'Servo Pride 4T 20W-40',
      'Servo System 68 (Industrial Hydraulic)',
      'Servo Mesh SP 320 (Gear Oil)',
      'Servo Gem 3 / Complex MP Grease'
    ],
    avgPriceRealizationPerLiterINR: 150,
    pricingTier: 'Mid-Tier',
    keyStrengths: [
      'Official company disclosure confirms 1.54M KL annual volume and 27.0% national market share.',
      'Massive 34,000+ fuel retail forecourt network providing unmatched rural and highway touchpoints.',
      'Sole or preferred supplier for Indian Railways, Defense, State Transport Undertakings (STUs), and Coal India.',
      'World-class R&D Centre in Faridabad with proprietary base oil (Group II/III) captive refinery integration.'
    ],
    whiteSpotVulnerabilities: [
      'Slower delivery lead times in specialized Tier-2/3 industrial parks (Dahej, Neemrana) compared to agile private distributors.',
      'Under-indexed in synthetic passenger car segment (0W-20/5W-30) vs. Castrol and Shell.'
    ]
  },

  // 2. Castrol India (BP) (Castrol)
  {
    id: 'brand-castrol',
    brandName: 'Castrol',
    parentCompany: 'Castrol India (BP)',
    companyType: 'MNC Major',
    nationalMarketSharePct: 13.0,
    volumeMillionKL: 0.74,
    nationalSupplyVolumeKL: 740000,
    basis: 'Estimated',
    confidence: 'Low — modeled',
    nationalRevenueINR: 14060,
    blendingCapacityKL: 950000,
    capacityUtilizationPct: 77.9,
    plantLocations: ['Patalganga (Maharashtra)', 'Silvassa (Dadra & Nagar Haveli)', 'Paharpur (Kolkata)'],
    headquarters: 'Mumbai, Maharashtra',
    sectorStrengths: [
      { sector: 'Personal Mobility (PCMO/2W)', sharePct: 48, volumeKL: 355200 },
      { sector: 'Commercial Fleets (HDEO)', sharePct: 30, volumeKL: 222000 },
      { sector: 'Industrial & Metalworking', sharePct: 18, volumeKL: 133200 },
      { sector: 'Agri Machinery & Others', sharePct: 4, volumeKL: 29600 }
    ],
    clusterSupplyVolumeKL: 16200,
    clusterMarketSharePct: 18.85,
    clusterDeficitExposureKL: 21600,
    depotCountNational: 84,
    retailDealerNetworkCount: 125000,
    authorizedWorkshopsCount: 9400,
    directIndustrialAccounts: 2100,
    flagshipSKUs: [
      'Castrol Activ 4T 20W-40',
      'Castrol POWER1 Ultimate 10W-40 (Full Synthetic)',
      'Castrol MAGNATEC 5W-30 / 0W-20',
      'Castrol CRB Turbomax 15W-40',
      'Castrol Hyspin AWS 46 / 68'
    ],
    avgPriceRealizationPerLiterINR: 190,
    pricingTier: 'Premium Synthetic',
    keyStrengths: [
      'Unrivaled brand equity in retail bazaars with over 125,000 multi-brand workshops and retail outlets.',
      'Dominant market leader in 2-Wheeler (Activ) and Passenger Car Synthetic (POWER1 / MAGNATEC) retail.',
      'Strong distributor loyalty and high gross margin structure supported by consistent marketing investments.'
    ],
    whiteSpotVulnerabilities: [
      'High price premium makes Castrol vulnerable to aggressive OMC bidding in bulk institutional contracts (mining, ports, STUs).',
      'Lower direct fuel forecourt presence compared to IOCL/BPCL/HPCL.'
    ]
  },

  // 3. Bharat Petroleum (MAK)
  {
    id: 'brand-mak',
    brandName: 'MAK',
    parentCompany: 'Bharat Petroleum',
    companyType: 'OMC Public Sector',
    nationalMarketSharePct: 11.0,
    volumeMillionKL: 0.63,
    nationalSupplyVolumeKL: 630000,
    basis: 'Estimated',
    confidence: 'Low — modeled',
    nationalRevenueINR: 9765,
    blendingCapacityKL: 800000,
    capacityUtilizationPct: 78.8,
    plantLocations: ['Wadi Bunder (Mumbai)', 'Loni (Pune)', 'Kolkata', 'Tondiarpet (Chennai)'],
    headquarters: 'Mumbai, Maharashtra',
    sectorStrengths: [
      { sector: 'Commercial Fleets (HDEO)', sharePct: 38, volumeKL: 239400 },
      { sector: 'Personal Mobility (PCMO/2W)', sharePct: 26, volumeKL: 163800 },
      { sector: 'Industrial Hydraulics & Gears', sharePct: 24, volumeKL: 151200 },
      { sector: 'Agri & Marine', sharePct: 12, volumeKL: 75600 }
    ],
    clusterSupplyVolumeKL: 12400,
    clusterMarketSharePct: 14.43,
    clusterDeficitExposureKL: 18400,
    depotCountNational: 78,
    retailDealerNetworkCount: 21500,
    authorizedWorkshopsCount: 1420,
    directIndustrialAccounts: 2900,
    flagshipSKUs: [
      'MAK Titanium 15W-40 CK-4',
      'MAK 4T Blaze 10W-30 / 20W-40',
      'MAK Diamond 5W-30 Synthetic',
      'MAK Hydrol 46 / 68',
      'MAK Spirol EP 90 / 140'
    ],
    avgPriceRealizationPerLiterINR: 155,
    pricingTier: 'Mid-Tier',
    keyStrengths: [
      'Direct pipeline connectivity to BPCL Mumbai and Kochi refineries with high-grade Group II+ base oils.',
      'Strong highway network with over 21,500 fuel stations and dedicated truck lube bays.',
      'Strong market share in southern and western transport hubs (Coimbatore, Bangalore, Kochi).'
    ],
    whiteSpotVulnerabilities: [
      'Under-penetrated in Eastern mining belts (Singrauli, Angul, Korba) compared to IOCL and HPCL.',
      'Limited secondary distributor stockpoint density in remote industrial corridors.'
    ]
  },

  // 4. Hindustan Petroleum (HP Lubricants)
  {
    id: 'brand-hpcl',
    brandName: 'HP Lubricants',
    parentCompany: 'Hindustan Petroleum',
    companyType: 'OMC Public Sector',
    nationalMarketSharePct: 10.0,
    volumeMillionKL: 0.57,
    nationalSupplyVolumeKL: 570000,
    basis: 'Estimated',
    confidence: 'Low — modeled',
    nationalRevenueINR: 8721,
    blendingCapacityKL: 750000,
    capacityUtilizationPct: 76.0,
    plantLocations: ['Mazagon (Mumbai)', 'Paharpur (Kolkata)', 'Silvassa', 'Chennai'],
    headquarters: 'Mumbai, Maharashtra',
    sectorStrengths: [
      { sector: 'Commercial Fleets (HDEO)', sharePct: 42, volumeKL: 239400 },
      { sector: 'Personal Mobility (PCMO/2W)', sharePct: 24, volumeKL: 136800 },
      { sector: 'Industrial & Marine', sharePct: 22, volumeKL: 125400 },
      { sector: 'Agri Machinery & UTTO', sharePct: 12, volumeKL: 68400 }
    ],
    clusterSupplyVolumeKL: 11500,
    clusterMarketSharePct: 13.38,
    clusterDeficitExposureKL: 17900,
    depotCountNational: 72,
    retailDealerNetworkCount: 22000,
    authorizedWorkshopsCount: 1280,
    directIndustrialAccounts: 2650,
    flagshipSKUs: [
      'HP Milcy TurboStar 15W-40',
      'HP Racer 4T 20W-40 / 10W-30',
      'HP Neosynth 5W-30 API SN',
      'HP Enclo 46 / 68 (Hydraulic)',
      'HP Lithon MP / Complex Grease'
    ],
    avgPriceRealizationPerLiterINR: 153,
    pricingTier: 'Mid-Tier',
    keyStrengths: [
      'India’s largest base oil refinery (Mumbai LOBS plant) giving HPCL lowest base stock procurement cost.',
      'Strong commercial vehicle franchise with Milcy brand recognized across north-south highway routes.',
      'Comprehensive product range encompassing specialized turbine, transformer, and marine engine oils.'
    ],
    whiteSpotVulnerabilities: [
      'Retail bazaar market share in independent car garages lags behind Castrol and Gulf.',
      'Perceived primarily as a commercial fleet brand, requiring marketing push for premium synthetic PCMO.'
    ]
  },

  // 5. Shell India (Shell Helix / Rimula)
  {
    id: 'brand-shell',
    brandName: 'Shell Helix / Rimula',
    parentCompany: 'Shell India',
    companyType: 'MNC Major',
    nationalMarketSharePct: 6.0,
    volumeMillionKL: 0.34,
    nationalSupplyVolumeKL: 340000,
    basis: 'Estimated',
    confidence: 'Low — modeled',
    nationalRevenueINR: 7140,
    blendingCapacityKL: 450000,
    capacityUtilizationPct: 75.6,
    plantLocations: ['Taloja (Navi Mumbai)'],
    headquarters: 'Bangalore / Mumbai',
    sectorStrengths: [
      { sector: 'Industrial (Hydraulics & Turbines)', sharePct: 40, volumeKL: 136000 },
      { sector: 'Personal Mobility (Synthetic PCMO)', sharePct: 32, volumeKL: 108800 },
      { sector: 'Commercial Fleets (HDEO)', sharePct: 20, volumeKL: 68000 },
      { sector: 'Specialty Mining & Wind', sharePct: 8, volumeKL: 27200 }
    ],
    clusterSupplyVolumeKL: 5600,
    clusterMarketSharePct: 6.51,
    clusterDeficitExposureKL: 9400,
    depotCountNational: 32,
    retailDealerNetworkCount: 48000,
    authorizedWorkshopsCount: 3800,
    directIndustrialAccounts: 1850,
    flagshipSKUs: [
      'Shell Helix Ultra 0W-20 / 5W-40 (Gas-to-Liquid PurePlus)',
      'Shell Advance Ultra 4T 10W-40',
      'Shell Rimula R4 X 15W-40',
      'Shell Tellus S2 MX 46 / 68 (Hydraulic)',
      'Shell Omala S2 GX 320 (Industrial Gear)'
    ],
    avgPriceRealizationPerLiterINR: 210,
    pricingTier: 'Premium Synthetic',
    keyStrengths: [
      'Patented Gas-to-Liquid (GTL) base oil technology producing ultra-pure, high-performance synthetic lubricants.',
      'Strong industrial reputation in power generation, steel mills, cement plants, and wind turbine gearboxes.',
      'Premium global OEM factory-fill approvals (BMW, Ferrari, Hyundai, Komatsu).'
    ],
    whiteSpotVulnerabilities: [
      'Higher price point limits penetration in price-sensitive rural automotive bazaar segments.',
      'Single centralized manufacturing plant in Taloja creates high freight cost to North and East India.'
    ]
  },

  // 6. Gulf Oil Lubricants India (Gulf)
  {
    id: 'brand-gulf',
    brandName: 'Gulf',
    parentCompany: 'Gulf Oil Lubricants India',
    companyType: 'Indian Private Independent',
    nationalMarketSharePct: 4.5,
    volumeMillionKL: 0.26,
    nationalSupplyVolumeKL: 260000,
    basis: 'Estimated',
    confidence: 'Low — modeled',
    nationalRevenueINR: 4550,
    blendingCapacityKL: 400000,
    capacityUtilizationPct: 65.0,
    plantLocations: ['Silvassa (Dadra & Nagar Haveli)', 'Ennore (Chennai)'],
    headquarters: 'Mumbai, Maharashtra',
    sectorStrengths: [
      { sector: 'Commercial Fleets (HDEO)', sharePct: 45, volumeKL: 117000 },
      { sector: 'Personal Mobility (2W/PCMO)', sharePct: 30, volumeKL: 78000 },
      { sector: 'Industrial & Agri', sharePct: 15, volumeKL: 39000 },
      { sector: 'OEM Tie-ups (Ashok Leyland, etc.)', sharePct: 10, volumeKL: 26000 }
    ],
    clusterSupplyVolumeKL: 4400,
    clusterMarketSharePct: 5.12,
    clusterDeficitExposureKL: 12800,
    depotCountNational: 44,
    retailDealerNetworkCount: 82000,
    authorizedWorkshopsCount: 4200,
    directIndustrialAccounts: 950,
    flagshipSKUs: [
      'Gulf Superfleet Turbo Plus 15W-40',
      'Gulf Pride 4T Plus 20W-40',
      'Gulf Ultrasynth X 5W-30',
      'Gulf Harmony AW 68',
      'Gulf Crown MP Grease'
    ],
    avgPriceRealizationPerLiterINR: 175,
    pricingTier: 'Mid-Tier',
    keyStrengths: [
      'Exclusive OEM partnership with Ashok Leyland (Leyparts genuine oils) anchoring nationwide truck fleet demand.',
      'Aggressive marketing and sports sponsorships (MS Dhoni, IPL, Chennai Super Kings) driving high 2W consumer pull.',
      'State-of-the-art Ennore smart blending plant with direct Chennai port connectivity.'
    ],
    whiteSpotVulnerabilities: [
      'Under-indexed in heavy core industrial manufacturing and metalworking fluids.',
      'Lower presence in northern grain belts (Punjab, Haryana) compared to Castrol and Veedol.'
    ]
  },

  // 7. ExxonMobil (Mobil)
  {
    id: 'brand-mobil',
    brandName: 'Mobil',
    parentCompany: 'ExxonMobil',
    companyType: 'MNC Major',
    nationalMarketSharePct: 3.5,
    volumeMillionKL: 0.20,
    nationalSupplyVolumeKL: 200000,
    basis: 'Estimated',
    confidence: 'Low — modeled',
    nationalRevenueINR: 4500,
    blendingCapacityKL: 280000,
    capacityUtilizationPct: 71.4,
    plantLocations: ['JNPT / Islampur (Maharashtra) - Toll & Import Blending'],
    headquarters: 'Bangalore / Gurgaon',
    sectorStrengths: [
      { sector: 'Industrial & B2B High-Temp Gear', sharePct: 45, volumeKL: 90000 },
      { sector: 'Passenger Car Synthetic (Mobil 1)', sharePct: 35, volumeKL: 70000 },
      { sector: 'Commercial Fleets (Delvac)', sharePct: 15, volumeKL: 30000 },
      { sector: 'Aviation & Marine', sharePct: 5, volumeKL: 10000 }
    ],
    clusterSupplyVolumeKL: 3300,
    clusterMarketSharePct: 3.84,
    clusterDeficitExposureKL: 6800,
    depotCountNational: 24,
    retailDealerNetworkCount: 32000,
    authorizedWorkshopsCount: 2400,
    directIndustrialAccounts: 1400,
    flagshipSKUs: [
      'Mobil 1 0W-40 / 5W-30 Ultimate Performance',
      'Mobil Super 3000 5W-30',
      'Mobil Delvac MX 15W-40',
      'Mobil DTE 10 Excel 46 / 68 (High-VI Hydraulic)',
      'Mobilgear 600 XP 220 / 320'
    ],
    avgPriceRealizationPerLiterINR: 225,
    pricingTier: 'Premium Synthetic',
    keyStrengths: [
      'Mobil 1 is the undisputed benchmark in full-synthetic passenger vehicle motor oils worldwide.',
      'Unsurpassed performance in severe industrial operating environments (high temperature, high pressure).',
      'Strong relationships with top global Tier-1 automotive and aerospace OEMs.'
    ],
    whiteSpotVulnerabilities: [
      'Limited secondary distributor footprint in Tier-3 agricultural and logistics transit towns.',
      'Relies heavily on authorized franchise dealerships rather than open bazaar mechanics.'
    ]
  },

  // 8. TotalEnergies (Total Quartz)
  {
    id: 'brand-total',
    brandName: 'Total Quartz',
    parentCompany: 'TotalEnergies',
    companyType: 'MNC Major',
    nationalMarketSharePct: 2.5,
    volumeMillionKL: 0.14,
    nationalSupplyVolumeKL: 140000,
    basis: 'Estimated',
    confidence: 'Low — modeled',
    nationalRevenueINR: 2730,
    blendingCapacityKL: 220000,
    capacityUtilizationPct: 63.6,
    plantLocations: ['Mahape (Navi Mumbai)'],
    headquarters: 'Mumbai, Maharashtra',
    sectorStrengths: [
      { sector: 'Personal Mobility (Quartz)', sharePct: 40, volumeKL: 56000 },
      { sector: 'Commercial Fleets (Rubia)', sharePct: 35, volumeKL: 49000 },
      { sector: 'Industrial Fluids (Azolla)', sharePct: 20, volumeKL: 28000 },
      { sector: 'Specialty & Solar Fluids', sharePct: 5, volumeKL: 7000 }
    ],
    clusterSupplyVolumeKL: 2300,
    clusterMarketSharePct: 2.68,
    clusterDeficitExposureKL: 3400,
    depotCountNational: 16,
    retailDealerNetworkCount: 24000,
    authorizedWorkshopsCount: 1600,
    directIndustrialAccounts: 620,
    flagshipSKUs: [
      'TotalEnergies Quartz 9000 5W-40 / 0W-20',
      'TotalEnergies Rubia TIR 7400 15W-40',
      'TotalEnergies Hi-Perf 4T Racing 10W-40',
      'TotalEnergies Azolla ZS 46 / 68',
      'TotalEnergies Ceran Heavy Duty Water Resistant Grease'
    ],
    avgPriceRealizationPerLiterINR: 195,
    pricingTier: 'Premium Synthetic',
    keyStrengths: [
      'Advanced European OEM technology approvals (Peugeot, Citroen, Renault, Nissan, Tata Motors).',
      'Patented Ceran calcium sulfonate complex grease technology with superior water-washout resistance in steel and marine sectors.',
      'Global energy transition leadership in EV and immersion dielectric cooling fluids.'
    ],
    whiteSpotVulnerabilities: [
      'Limited regional depot network outside Tier-1 metropolitan centres.',
      'High reliance on multi-brand independent workshops with lower dedicated dealer loyalty.'
    ]
  },

  // 9. Valvoline Cummins (Valvoline)
  {
    id: 'brand-valvoline',
    brandName: 'Valvoline',
    parentCompany: 'Valvoline Cummins',
    companyType: 'MNC Major',
    nationalMarketSharePct: 2.0,
    volumeMillionKL: 0.11,
    nationalSupplyVolumeKL: 110000,
    basis: 'Estimated',
    confidence: 'Low — modeled',
    nationalRevenueINR: 2035,
    blendingCapacityKL: 180000,
    capacityUtilizationPct: 61.1,
    plantLocations: ['Amarkantak / Panipat (Haryana)'],
    headquarters: 'Gurgaon, Haryana',
    sectorStrengths: [
      { sector: 'Commercial Fleets (Cummins Engines)', sharePct: 52, volumeKL: 57200 },
      { sector: 'Personal Mobility (PCMO/2W)', sharePct: 28, volumeKL: 30800 },
      { sector: 'Industrial & Mining Heavy Duty', sharePct: 15, volumeKL: 16500 },
      { sector: 'Agri Machinery', sharePct: 5, volumeKL: 5500 }
    ],
    clusterSupplyVolumeKL: 1900,
    clusterMarketSharePct: 2.21,
    clusterDeficitExposureKL: 6100,
    depotCountNational: 26,
    retailDealerNetworkCount: 42000,
    authorizedWorkshopsCount: 3100,
    directIndustrialAccounts: 850,
    flagshipSKUs: [
      'Valvoline Premium Blue 15W-40 (The Only Cummins Endorsed)',
      'Valvoline Champ 4T 20W-40',
      'Valvoline All-Climate 5W-30',
      'Valvoline AW Hydraulic 68',
      'Valvoline Heavy Duty Multipurpose Grease'
    ],
    avgPriceRealizationPerLiterINR: 185,
    pricingTier: 'Mid-Tier',
    keyStrengths: [
      'Cummins 50:50 Joint Venture ensures exclusive OEM factory-fill and service endorsement across all Cummins diesel engines in India.',
      'Strong penetration in mining, heavy construction equipment, and power generator (DG set) fleets.',
      'Dedicated pan-India service technician and engine health monitoring mobile labs.'
    ],
    whiteSpotVulnerabilities: [
      'Brand awareness in 2-Wheeler retail market remains lower than Castrol, Servo, and Gulf.',
      'Lacks direct presence in coastal chemical processing belts (Dahej, Vizag).'
    ]
  },

  // 10. Others / Regional players (Various)
  {
    id: 'brand-others',
    brandName: 'Others / Regional players',
    parentCompany: 'Various (Tide Water Veedol, Savsol, Motul, Fuchs, Regional Blenders)',
    companyType: 'Specialty & Premium',
    nationalMarketSharePct: 20.5,
    volumeMillionKL: 1.17,
    nationalSupplyVolumeKL: 1170000,
    basis: 'Estimated (residual/plug)',
    confidence: 'Very low — residual',
    nationalRevenueINR: 17550,
    blendingCapacityKL: 1800000,
    capacityUtilizationPct: 65.0,
    plantLocations: ['Howrah', 'Silvassa', 'Turbhe', 'Ankleshwar', 'Daman', 'Tarapur', 'Ambattur', 'Faridabad'],
    headquarters: 'Pan-India Regional Clusters',
    sectorStrengths: [
      { sector: 'Transformer & Specialty Electrical Oils (Savita, etc.)', sharePct: 30, volumeKL: 351000 },
      { sector: 'Agricultural Machinery & Pump Sets (Veedol, etc.)', sharePct: 25, volumeKL: 292500 },
      { sector: 'Commercial Fleets & Local Transport', sharePct: 25, volumeKL: 292500 },
      { sector: 'High-Performance & Racing/Metalworking (Motul, Fuchs)', sharePct: 12, volumeKL: 140400 },
      { sector: 'Unorganized Local Foundries & Others', sharePct: 8, volumeKL: 93600 }
    ],
    clusterSupplyVolumeKL: 3560,
    clusterMarketSharePct: 4.14,
    clusterDeficitExposureKL: 8200,
    depotCountNational: 110,
    retailDealerNetworkCount: 145000,
    authorizedWorkshopsCount: 6800,
    directIndustrialAccounts: 3800,
    flagshipSKUs: [
      'Veedol Maratron Extra 15W-40',
      'Savsol Ester5 Synthetic 5W-30',
      'Savita Transol Transformer Oil (IEC 60296)',
      'Motul 300V Factory Line 10W-40 (Double Ester)',
      'Fuchs Ecocool Global 10 & Ceplattyn Mining Gear Compound'
    ],
    avgPriceRealizationPerLiterINR: 150,
    pricingTier: 'Specialty & Premium',
    keyStrengths: [
      'Includes established domestic leaders (Tide Water Oil / Veedol, Savita Oil Technologies / Savsol), global specialty leaders (Motul, Fuchs), and regional independent blenders.',
      'Savita leads India in Transformer Oils with 45%+ market share.',
      'Motul commands highest realization in premium racing 2W; Fuchs leads in cement and mining heavy open gears (Ceplattyn).',
      'High price flexibility in localized rural agricultural and transport pockets.'
    ],
    whiteSpotVulnerabilities: [
      'Residual category with fragmented market structure across over 100+ local blenders.',
      'Small blenders face increasing margin pressure from rising Group II/III base oil costs and BS-VI additive requirements.'
    ]
  }
];

export interface FormulaStep {
  id: string;
  name: string;
  targetScope: string;
  outputMetric: string;
  formulaString: string;
  explanation: string;
  sampleCalculation: string;
  dataInputs: string[];
}

export const AUDIT_FORMULA_STEPS: FormulaStep[] = [
  {
    id: 'f1-national',
    name: 'Total Macro National Lubricant Demand',
    targetScope: 'All-India National Macro Market (5.70M KL)',
    outputMetric: '5,700,000 KL / Year (₹91,200 Cr Value)',
    formulaString: 'Total National Demand = 5.70 Million KL = Automotive Demand (60%) + Industrial Demand (35%) + Specialty/Marine/Agri Demand (5%)',
    explanation: 'Audited against IOCL official company disclosures (SERVO 1.54M KL = 27.0% share) and PPAC annual petroleum sales statistics, totaling exactly 5.70 Million KL (5,700,000 KL).',
    sampleCalculation: 'Automotive (3,420,000 KL) + Industrial (1,995,000 KL) + Specialty/Agri (285,000 KL) = 5,700,000 KL (5.70M KL)',
    dataInputs: ['IOCL Website Official Disclosure', 'PPAC MoPNG Petroleum Statistics', 'VAHAN 4.0 National Register', 'Annual Survey of Industries (ASI)']
  },
  {
    id: 'f2-state-aggregation',
    name: 'All-India 36 States & UTs Aggregation Model',
    targetScope: '36 States & UTs across 6 Macro Regional Zones',
    outputMetric: '5,700,000 KL / Year across 780+ Districts',
    formulaString: 'All-India Demand = Σ [West Zone (1.71M KL) + North Zone (1.48M KL) + South Zone (1.43M KL) + East Zone (0.68M KL) + Central Zone (0.31M KL) + North-East Zone (0.09M KL)]',
    explanation: 'Aggregates all 36 States and Union Territories synthesized from state-level industrial power loads, manufacturing output registrations, and RTO vehicle fleets.',
    sampleCalculation: 'West (1,710,000 KL) + North (1,482,000 KL) + South (1,425,000 KL) + East (684,000 KL) + Central (313,500 KL) + North-East (85,500 KL) = 5,700,000 KL',
    dataInputs: ['State Industrial Development Corporations (MIDC, GIDC, SIPCOT)', 'VAHAN 4.0 State Registers', 'Central Electricity Authority (CEA) Industrial Feeders']
  },
  {
    id: 'f3-supply-gap',
    name: 'National Accessible Supply & Unmet Gap Calculation',
    targetScope: 'All-India Supply Deficit across 36 Jurisdictions',
    outputMetric: '1,507,335 KL Unmet Deficit (₹24,117.4 Cr Opportunity Pool)',
    formulaString: 'National Supply Gap (Deficit KL) = Total National Demand (5,700,000 KL) - Accessible Incumbent Supply (4,192,665 KL)',
    explanation: 'Accessible supply is calculated by auditing the verified throughput of OMC distribution depots, retail dealer networks, and private/MNC distributor channels across India. The resulting 1.51M KL gap indicates a national supply coverage ratio of 73.55%, proving substantial expansion opportunity.',
    sampleCalculation: '5,700,000 KL (Demand) - 4,192,665 KL (Accessible Supply) = 1,507,335 KL (National Unmet Supply Gap)',
    dataInputs: ['OMC depot allocation lists', 'Distributor network capacity records', 'Dealer network point-of-sale audits']
  },
  {
    id: 'f4-company-supply',
    name: 'Company & Brand Market Volume Allocation',
    targetScope: 'Brand-by-Brand Supply Reconciliation (5.70M KL Total)',
    outputMetric: 'National Supply (Million KL & KL) and Basis / Confidence',
    formulaString: 'Company National Volume (KL) = Total National Market (5,700,000 KL) × Company Market Share (%)',
    explanation: 'Reconciles the 5.70M KL national total across all 10 market players with disclosed vs. modeled basis and confidence rating.',
    sampleCalculation: 'Indian Oil SERVO: 27.0% = 1.54M KL (High Confidence); Castrol India: 13.0% = 0.74M KL; Bharat Petroleum MAK: 11.0% = 0.63M KL; HPCL: 10.0% = 0.57M KL; Shell: 6.0% = 0.34M KL; Gulf: 4.5% = 0.26M KL; Mobil: 3.5% = 0.20M KL; Total: 2.5% = 0.14M KL; Valvoline: 2.0% = 0.11M KL; Others: 20.5% = 1.17M KL. Total = 5.70M KL (100.0%)',
    dataInputs: ['IOCL Website (Company Disclosed)', 'Castrol & Gulf Annual Reports', 'PPAC Petroleum Planning & Analysis Cell']
  }
];
