import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  MapPin, 
  Building,
  Building2, 
  Flame, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Store,
  Compass,
  Layers,
  Search,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Phone,
  User,
  ArrowUpDown,
  Download,
  AlertTriangle,
  Clock,
  Truck,
  Boxes,
  Scale,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { LocationRecord, ScoringWeights, DistributorRecord } from '../../types';
import { CURRENT_DISTRIBUTORS } from '../../data/indiaGeoData';
import { BRAND_COMPANIES_DATA } from '../../data/brandMarketData';
import { ALL_INDIA_STATES_DATA } from '../../data/allIndiaStateData';
import { ALL_36_MAX_WHITE_SPOT_CLUSTERS, SUMMARY_36_MAX_CLUSTERS, MaxWhiteSpotCluster } from '../../data/maxWhiteSpotClustersData';
import { recalculateWhiteSpotScore, classifyOpportunityTier, formatKL, formatINR } from '../../utils/demandEngine';
import { downloadWhiteSpotExcel } from '../../utils/excelExporter';

interface DistributorOpportunityDashboardProps {
  locations: LocationRecord[];
  distributors?: DistributorRecord[];
  scoringWeights: ScoringWeights;
  onWeightsChange: (weights: ScoringWeights) => void;
  onSelectDistrict: (loc: LocationRecord) => void;
}

type TabView = 'maxClusters' | 'distributors' | 'whiteSpots' | 'comparison' | 'charts';

const BRAND_COLORS: Record<string, string> = {
  'IOCL Servo': '#ef4444',
  'Castrol': '#10b981',
  'MAK (BPCL)': '#3b82f6',
  'HPCL Milcy': '#eab308',
  'Gulf Oil': '#F27D26',
  'Shell': '#f59e0b',
  'ExxonMobil': '#8b5cf6',
  'Valvoline': '#06b6d4',
  'Motul': '#ec4899',
  'Veedol': '#84cc16',
  'Fuchs': '#6366f1'
};

export const DistributorOpportunityDashboard: React.FC<DistributorOpportunityDashboardProps> = ({
  locations,
  distributors = CURRENT_DISTRIBUTORS,
  scoringWeights,
  onWeightsChange,
  onSelectDistrict
}) => {
  const [activeView, setActiveView] = useState<TabView>('maxClusters');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 36 Max White-Spot Clusters Filter States
  const [regionFilter36, setRegionFilter36] = useState<string>('all');
  const [phaseFilter36, setPhaseFilter36] = useState<string>('all');
  const [sectorFilter36, setSectorFilter36] = useState<string>('all');
  const [search36, setSearch36] = useState<string>('');
  const [selectedClusterId36, setSelectedClusterId36] = useState<string>('max-ws-01');
  
  // Head-to-Head selection states
  const [selectedWhiteSpotId, setSelectedWhiteSpotId] = useState<string>(locations[0]?.id || 'max-ws-01');
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>(distributors[0]?.id || 'dist-01');

  const whiteSpotTypes: { id: string; label: string; desc: string }[] = [
    { id: 'all', label: 'ALL 8 TYPES', desc: 'Display all strategic opportunity archetypes' },
    { id: 'Type A', label: 'TYPE A: HIGH DEMAND / LOW SUPPLY', desc: 'Core white-spot with massive unserved market gap' },
    { id: 'Type B', label: 'TYPE B: INDUSTRIAL GROWTH HUB', desc: 'MIDC/GIDC manufacturing clusters with high hydraulic & gear oil needs' },
    { id: 'Type C', label: 'TYPE C: HIGHWAY FREIGHT CORRIDOR', desc: 'High-volume HDEO fleet transit routes' },
    { id: 'Type D', label: 'TYPE D: AGRI MECHANIZATION HUB', desc: 'Tractor and farm equipment oil demand during harvesting cycles' },
    { id: 'Type E', label: 'TYPE E: MINING & HEAVY PLANT', desc: 'Heavy greases and high-temperature lubricants' },
    { id: 'Type F', label: 'TYPE F: LOW COMPETITOR DENSITY', desc: 'Markets where incumbent OMCs have low retail density' },
    { id: 'Type G', label: 'TYPE G: PORT & HINTERLAND', desc: 'Container depots, marine lubricants and coastal logistics' },
    { id: 'Type H', label: 'TYPE H: HIGH DISTANCE GAP', desc: 'Remote nodes experiencing >30km secondary freight lags' }
  ];

  // Dynamic recalculation for White Spots
  const scoredLocations = useMemo(() => {
    return locations.map(loc => {
      const dynamicScore = recalculateWhiteSpotScore(loc, scoringWeights);
      return {
        ...loc,
        dynamicScore,
        dynamicTier: classifyOpportunityTier(dynamicScore)
      };
    }).sort((a, b) => b.dynamicScore - a.dynamicScore);
  }, [locations, scoringWeights]);

  const filteredLocations = useMemo(() => {
    return scoredLocations.filter(loc => {
      if (selectedTypeFilter === 'all') return true;
      return loc.whiteSpotType.startsWith(selectedTypeFilter);
    });
  }, [scoredLocations, selectedTypeFilter]);

  // Unique Brands & States for dropdowns
  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(distributors.map(d => d.brand))).sort();
  }, [distributors]);

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(distributors.map(d => d.stateName))).sort();
  }, [distributors]);

  // Filtered Distributors
  const filteredDistributors = useMemo(() => {
    return distributors.filter(dist => {
      const matchesBrand = brandFilter === 'all' || dist.brand === brandFilter;
      const matchesState = stateFilter === 'all' || dist.stateName === stateFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        dist.name.toLowerCase().includes(q) ||
        dist.brand.toLowerCase().includes(q) ||
        dist.city.toLowerCase().includes(q) ||
        dist.district.toLowerCase().includes(q) ||
        dist.stateName.toLowerCase().includes(q) ||
        dist.topSellingSKUs.some(sku => sku.toLowerCase().includes(q));
      
      return matchesBrand && matchesState && matchesSearch;
    });
  }, [distributors, brandFilter, stateFilter, searchQuery]);

  // Comparison Selected Items
  const compareWhiteSpot = useMemo(() => {
    return locations.find(l => l.id === selectedWhiteSpotId) || locations[0];
  }, [locations, selectedWhiteSpotId]);

  const compareDistributor = useMemo(() => {
    return distributors.find(d => d.id === selectedDistributorId) || distributors[0];
  }, [distributors, selectedDistributorId]);

  // Nearby distributors for selected white spot
  const localDistributorsForWhiteSpot = useMemo(() => {
    if (!compareWhiteSpot) return [];
    return distributors.filter(d => 
      d.targetWhiteSpotId === compareWhiteSpot.id ||
      d.district.toLowerCase() === compareWhiteSpot.parentDistrict.toLowerCase() ||
      d.stateCode === compareWhiteSpot.stateCode
    );
  }, [distributors, compareWhiteSpot]);

  // 36 Max White-Spot Clusters Filtering
  const filteredClusters36 = useMemo(() => {
    return ALL_36_MAX_WHITE_SPOT_CLUSTERS.filter(c => {
      const matchRegion = regionFilter36 === 'all' || c.region === regionFilter36;
      const matchPhase = phaseFilter36 === 'all' || c.rolloutPhase.startsWith(phaseFilter36);
      const matchSector = sectorFilter36 === 'all' || c.dominantSector === sectorFilter36;
      const q = search36.toLowerCase().trim();
      const matchSearch = !q ||
        c.clusterName.toLowerCase().includes(q) ||
        c.targetHubCity.toLowerCase().includes(q) ||
        c.stateName.toLowerCase().includes(q) ||
        c.servicedDistricts.some(d => d.toLowerCase().includes(q)) ||
        c.keyAnchorIndustries.some(ind => ind.toLowerCase().includes(q));
      return matchRegion && matchPhase && matchSector && matchSearch;
    });
  }, [regionFilter36, phaseFilter36, sectorFilter36, search36]);

  const selectedCluster36 = useMemo(() => {
    return ALL_36_MAX_WHITE_SPOT_CLUSTERS.find(c => c.id === selectedClusterId36) || ALL_36_MAX_WHITE_SPOT_CLUSTERS[0];
  }, [selectedClusterId36]);

  // Aggregated Analytics
  const totalTrackedDistributors = distributors.length;
  const totalIncumbentVolumeKL = useMemo(() => {
    return distributors.reduce((sum, d) => sum + d.annualVolumeKL, 0);
  }, [distributors]);
  const totalStorageCapacityKL = useMemo(() => {
    return distributors.reduce((sum, d) => sum + d.warehouseCapacityKL, 0);
  }, [distributors]);
  const totalDealersTied = useMemo(() => {
    return distributors.reduce((sum, d) => sum + d.dealerNetworkCount, 0);
  }, [distributors]);

  // Brand View Mode & Metric states
  const [brandViewMode, setBrandViewMode] = useState<'national' | 'tracked'>('national');
  const [brandChartMetric, setBrandChartMetric] = useState<'volume' | 'share' | 'revenue'>('volume');
  const [brandChartType, setBrandChartType] = useState<'bar' | 'donut'>('bar');
  const [stateViewMode, setStateViewMode] = useState<'allIndia' | 'channel'>('allIndia');

  // Brand Share Chart Data (supporting both All-India National Market Volume and Tracked Local Channel Volume)
  const brandShareChartData = useMemo(() => {
    if (brandViewMode === 'national') {
      return BRAND_COMPANIES_DATA.map(b => ({
        brand: b.brandName,
        volumeKL: b.nationalSupplyVolumeKL,
        sharePct: b.nationalMarketSharePct,
        revenueINR: b.nationalRevenueINR,
        count: b.depotCountNational,
        fill: BRAND_COLORS[b.brandName] || BRAND_COLORS[b.parentCompany] || '#06b6d4'
      })).sort((a, b) => b.volumeKL - a.volumeKL);
    }

    const brandMap: Record<string, { count: number; volumeKL: number }> = {};
    distributors.forEach(d => {
      if (!brandMap[d.brand]) {
        brandMap[d.brand] = { count: 0, volumeKL: 0 };
      }
      brandMap[d.brand].count += 1;
      brandMap[d.brand].volumeKL += d.annualVolumeKL;
    });
    return Object.entries(brandMap).map(([brand, data]) => ({
      brand,
      volumeKL: data.volumeKL,
      sharePct: (data.volumeKL / (totalIncumbentVolumeKL || 1)) * 100,
      revenueINR: Math.round(data.volumeKL * 0.016),
      count: data.count,
      fill: BRAND_COLORS[brand] || '#F27D26'
    })).sort((a, b) => b.volumeKL - a.volumeKL);
  }, [distributors, brandViewMode, totalIncumbentVolumeKL]);

  // Corporate Segment Share Breakdown (OMCs vs MNCs vs Domestic Listed vs JVs/Regional)
  const corporateSegmentData = useMemo(() => {
    return [
      {
        name: 'Public Sector OMCs',
        shortName: 'PSU OMCs',
        sharePct: 46.5,
        volumeKL: 2650500,
        revenueINR: 42408,
        description: 'IOCL (Servo), BPCL (MAK), HPCL',
        fill: '#ef4444'
      },
      {
        name: 'Global MNCs',
        shortName: 'MNCs',
        sharePct: 23.5,
        volumeKL: 1339500,
        revenueINR: 21432,
        description: 'Castrol (bp), Shell, TotalEnergies, ExxonMobil',
        fill: '#10b981'
      },
      {
        name: 'Domestic Listed Leaders',
        shortName: 'Domestic Listed',
        sharePct: 17.0,
        volumeKL: 969000,
        revenueINR: 15504,
        description: 'Gulf Oil, Tide Water (Veedol), Savita, Apar',
        fill: '#F27D26'
      },
      {
        name: 'JVs & Regional Specialists',
        shortName: 'Regional / JVs',
        sharePct: 13.0,
        volumeKL: 741000,
        revenueINR: 11856,
        description: 'Valvoline Cummins, Motul, Repsol, Regional LBPs',
        fill: '#06b6d4'
      }
    ];
  }, []);

  // State Distribution Chart Data (All-India Top 10 States vs Tracked Distributor Channel States)
  const stateDistributionData = useMemo(() => {
    if (stateViewMode === 'allIndia') {
      return [...ALL_INDIA_STATES_DATA]
        .sort((a, b) => b.totalDemandKL - a.totalDemandKL)
        .slice(0, 10)
        .map(s => ({
          state: s.stateName.length > 11 ? s.stateName.substring(0, 9) + '..' : s.stateName,
          fullName: s.stateName,
          demandKL: s.totalDemandKL,
          supplyKL: s.accessibleSupplyKL,
          gapKL: s.supplyGapKL,
          sharePct: s.nationalSharePct,
          coveragePct: s.coverageRatioPct,
          volumeKL: s.totalDemandKL
        }));
    }

    const stateMap: Record<string, { count: number; volumeKL: number }> = {};
    distributors.forEach(d => {
      if (!stateMap[d.stateName]) {
        stateMap[d.stateName] = { count: 0, volumeKL: 0 };
      }
      stateMap[d.stateName].count += 1;
      stateMap[d.stateName].volumeKL += d.annualVolumeKL;
    });
    return Object.entries(stateMap).map(([state, data]) => ({
      state: state.length > 12 ? state.substring(0, 10) + '..' : state,
      fullName: state,
      demandKL: data.volumeKL * 1.35,
      supplyKL: data.volumeKL,
      gapKL: Math.round(data.volumeKL * 0.35),
      sharePct: (data.volumeKL / (totalIncumbentVolumeKL || 1)) * 100,
      coveragePct: 74.0,
      volumeKL: data.volumeKL,
      count: data.count
    })).sort((a, b) => b.volumeKL - a.volumeKL);
  }, [distributors, stateViewMode, totalIncumbentVolumeKL]);

  // District Comparison Data: Unmet Demand vs Incumbent Volume
  const districtVersusData = useMemo(() => {
    return locations.slice(0, 8).map(loc => {
      const parentDist = loc.parentDistrict || loc.name;
      const incVolume = distributors
        .filter(d => d.targetWhiteSpotId === loc.id || d.district.toLowerCase() === parentDist.toLowerCase())
        .reduce((sum, d) => sum + d.annualVolumeKL, 0);

      const totalDemand = loc.totalEstimatedDemandKL || (loc.supplyGapKL + (loc.supply?.estimatedAccessibleSupplyKL || 0));

      return {
        name: loc.name.split(' ')[0],
        fullName: loc.name,
        state: loc.stateName,
        totalDemandKL: totalDemand,
        unmetGapKL: loc.supplyGapKL,
        gapPct: totalDemand > 0 ? ((loc.supplyGapKL / totalDemand) * 100).toFixed(1) : '0',
        incumbentVolumeKL: incVolume || Math.round((loc.supply?.estimatedAccessibleSupplyKL || 0) * 0.45)
      };
    });
  }, [locations, distributors]);

  const handleWeightChange = (key: keyof ScoringWeights, val: number) => {
    onWeightsChange({
      ...scoringWeights,
      [key]: val
    });
  };

  const handleResetWeights = () => {
    onWeightsChange({
      demandPotential: 35,
      supplyGap: 20,
      competitorGap: 15,
      accessibilityGap: 10,
      industrialGrowth: 10,
      vehicleGrowth: 5,
      logisticsGrowth: 5
    });
  };

  const handleExportDistributorData = () => {
    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      platform: "LuboIntel Lubricant Supply & White-Spot Analysis Engine",
      totalTrackedDistributors: distributors.length,
      totalIncumbentVolumeKL,
      distributors: filteredDistributors
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LuboIntel_Current_Distributor_Network_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header & Sub-Navigation Bar */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
              <Store className="w-4 h-4 text-cyan-400" />
              Distributor Intelligence &amp; White-Spot Comparative Analysis
            </h2>
            <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50 px-2 py-0.5 rounded uppercase">
              {totalTrackedDistributors} INCUMBENT HUBS AUDITED
            </span>
          </div>
          <p className="text-[10px] font-mono text-gray-500 mt-0.5">
            CROSS-BENCHMARKING ACTIVE OMC STOCKISTS VS. UNMET REGIONAL WHITE-SPOT OPPORTUNITIES
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center flex-wrap gap-1 bg-[#0A0B0E] p-1 rounded border border-[#374151] font-mono text-[10px] font-bold">
          <button
            onClick={() => setActiveView('maxClusters')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 uppercase ${
              activeView === 'maxClusters'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg font-extrabold ring-1 ring-orange-400'
                : 'text-orange-400/90 hover:text-white bg-orange-950/30'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>36 MAX WHITE-SPOT CLUSTERS (1.51M KL DEFICIT)</span>
          </button>

          <button
            onClick={() => setActiveView('distributors')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 uppercase ${
              activeView === 'distributors'
                ? 'bg-cyan-500 text-black shadow font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Store className="w-3 h-3" />
            <span>CURRENT DISTRIBUTORS ({filteredDistributors.length})</span>
          </button>

          <button
            onClick={() => setActiveView('whiteSpots')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 uppercase ${
              activeView === 'whiteSpots'
                ? 'bg-[#F27D26] text-black shadow font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>WHITE SPOTS ({filteredLocations.length})</span>
          </button>

          <button
            onClick={() => setActiveView('comparison')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 uppercase ${
              activeView === 'comparison'
                ? 'bg-purple-500 text-white shadow font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Scale className="w-3 h-3" />
            <span>HEAD-TO-HEAD COMPARISON</span>
          </button>

          <button
            onClick={() => setActiveView('charts')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 uppercase ${
              activeView === 'charts'
                ? 'bg-blue-500 text-white shadow font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>MARKET SHARE CHARTS</span>
          </button>
        </div>
      </div>

      {/* VIEW 0: ALL-INDIA 36 MAX WHITE-SPOT CLUSTERS & 100% DEFICIT COVERAGE ENGINE */}
      {activeView === 'maxClusters' && (
        <div className="space-y-4 font-mono">
          {/* Master Strategic Reconciliation Banner */}
          <div className="bg-gradient-to-r from-[#12161F] via-[#1A120B] to-[#12161F] border border-orange-500/40 p-4 rounded relative overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                    100% DEFICIT RECONCILIATION
                  </span>
                  <span className="text-gray-400 text-xs font-bold uppercase">
                    36 Regional Clusters Covering Full National Deficit
                  </span>
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  MAX WHITE-SPOT INFRASTRUCTURE NETWORK — 1,510,500 KL/YR UNMET MARKET RECOVERY
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Engineered 36 master regional hub clusters across 6 geographic zones to bridge India’s entire unserved lubricant deficit ({formatKL(SUMMARY_36_MAX_CLUSTERS.totalDeficitCoveredKL)} / ₹24,168 Cr). Each cluster features calibrated depot sizing, safety stock buffering, multi-district reach, and freight savings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadWhiteSpotExcel(locations)}
                  className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/50 px-3.5 py-2 text-xs font-bold rounded transition-all flex items-center gap-1.5 uppercase"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT 36 CLUSTERS (EXCEL)</span>
                </button>
              </div>
            </div>

            {/* Strategic KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-3 border-t border-orange-500/20">
              <div className="bg-[#0A0D14] p-2.5 border border-[#1F2937] rounded">
                <span className="text-[9.5px] text-gray-400 uppercase block">Total Deficit Covered</span>
                <span className="text-sm font-extrabold text-orange-400 block mt-0.5">
                  {formatKL(SUMMARY_36_MAX_CLUSTERS.totalDeficitCoveredKL)}
                </span>
                <span className="text-[9px] text-gray-500 block">100% of National Gap</span>
              </div>

              <div className="bg-[#0A0D14] p-2.5 border border-[#1F2937] rounded">
                <span className="text-[9.5px] text-gray-400 uppercase block">Unmet Market Value</span>
                <span className="text-sm font-extrabold text-emerald-400 block mt-0.5">
                  ₹{SUMMARY_36_MAX_CLUSTERS.totalDeficitMarketValueCr.toLocaleString()} Cr
                </span>
                <span className="text-[9px] text-gray-500 block">@ ₹160/L Blended Realization</span>
              </div>

              <div className="bg-[#0A0D14] p-2.5 border border-[#1F2937] rounded">
                <span className="text-[9.5px] text-gray-400 uppercase block">Recommended Depot Net</span>
                <span className="text-sm font-extrabold text-cyan-400 block mt-0.5">
                  {SUMMARY_36_MAX_CLUSTERS.totalRecommendedStorageCapacityKL.toLocaleString()} KL
                </span>
                <span className="text-[9px] text-gray-500 block">Across 36 Regional Hubs</span>
              </div>

              <div className="bg-[#0A0D14] p-2.5 border border-[#1F2937] rounded">
                <span className="text-[9.5px] text-gray-400 uppercase block">Total Network Capex</span>
                <span className="text-sm font-extrabold text-yellow-400 block mt-0.5">
                  ₹{SUMMARY_36_MAX_CLUSTERS.totalNetworkCapexCr.toFixed(1)} Cr
                </span>
                <span className="text-[9px] text-gray-500 block">Hub Infrastructure & Racks</span>
              </div>

              <div className="bg-[#0A0D14] p-2.5 border border-[#1F2937] rounded">
                <span className="text-[9.5px] text-gray-400 uppercase block">Annual Freight Savings</span>
                <span className="text-sm font-extrabold text-green-400 block mt-0.5">
                  ₹{SUMMARY_36_MAX_CLUSTERS.totalAnnualFreightSavingsCr.toFixed(1)} Cr/yr
                </span>
                <span className="text-[9px] text-gray-500 block">Lead Time Reduced &lt;18 hrs</span>
              </div>

              <div className="bg-[#0A0D14] p-2.5 border border-[#1F2937] rounded">
                <span className="text-[9.5px] text-gray-400 uppercase block">Year-1 Target Capture</span>
                <span className="text-sm font-extrabold text-purple-400 block mt-0.5">
                  {formatKL(SUMMARY_36_MAX_CLUSTERS.targetAnnualCaptureYear1KL)}
                </span>
                <span className="text-[9px] text-gray-500 block">Phase 1 Immediate Rollout</span>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-3 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search hub, city, state, industries, districts..."
                value={search36}
                onChange={(e) => setSearch36(e.target.value)}
                className="w-full bg-[#151921] border border-[#374151] rounded pl-8 pr-3 py-1.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-xs"
              />
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[11px] uppercase">Zone:</span>
              <select
                value={regionFilter36}
                onChange={(e) => setRegionFilter36(e.target.value)}
                className="bg-[#151921] border border-[#374151] rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-orange-500 uppercase"
              >
                <option value="all">ALL REGIONS (36)</option>
                <option value="West">WEST ZONE (8)</option>
                <option value="East">EAST ZONE (6)</option>
                <option value="North">NORTH ZONE (7)</option>
                <option value="South">SOUTH ZONE (8)</option>
                <option value="Central">CENTRAL ZONE (5)</option>
                <option value="North-East">NORTH-EAST (2)</option>
              </select>
            </div>

            {/* Rollout Phase Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[11px] uppercase">Phase:</span>
              <select
                value={phaseFilter36}
                onChange={(e) => setPhaseFilter36(e.target.value)}
                className="bg-[#151921] border border-[#374151] rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-orange-500 uppercase"
              >
                <option value="all">ALL PHASES (36)</option>
                <option value="Phase 1">PHASE 1: 0-12 MO (14 HUBS)</option>
                <option value="Phase 2">PHASE 2: 12-24 MO (13 HUBS)</option>
                <option value="Phase 3">PHASE 3: 24-36 MO (9 HUBS)</option>
              </select>
            </div>

            {/* Dominant Sector Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[11px] uppercase">Sector:</span>
              <select
                value={sectorFilter36}
                onChange={(e) => setSectorFilter36(e.target.value)}
                className="bg-[#151921] border border-[#374151] rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-orange-500 uppercase max-w-[200px]"
              >
                <option value="all">ALL SECTORS</option>
                <option value="Automotive & Fleet (HDEO/PCMO)">Automotive & Fleet (HDEO/PCMO)</option>
                <option value="Heavy Industrial & Metals">Heavy Industrial & Metals</option>
                <option value="Mining & Heavy Off-Highway">Mining & Heavy Off-Highway</option>
                <option value="PCPIR Chemical & Process">PCPIR Chemical & Process</option>
                <option value="Agri-Machinery & UTTO">Agri-Machinery & UTTO</option>
                <option value="Port Marine & Heavy Logistics">Port Marine & Heavy Logistics</option>
              </select>
            </div>

            <span className="text-gray-400 text-xs font-bold">
              SHOWING <span className="text-orange-400">{filteredClusters36.length}</span> / 36 CLUSTERS
            </span>
          </div>

          {/* Master Table of 36 Max White-Spot Clusters */}
          <div className="bg-[#0E1117] border border-[#1F2937] rounded overflow-hidden">
            <div className="p-3 bg-[#131720] border-b border-[#1F2937] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs uppercase flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Strategic 36 White-Spot Master Coverage Grid
                </span>
                <span className="text-[10px] bg-orange-950 text-orange-300 border border-orange-800/50 px-2 py-0.5 rounded uppercase font-bold">
                  TOTAL DEFICIT IN SELECTION: {formatKL(filteredClusters36.reduce((s, c) => s + c.unservedDeficitKL, 0))}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 uppercase">
                CLICK ANY ROW TO VIEW FULL HUB SPECS
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-[#0A0D14] sticky top-0 z-10 border-b border-[#1F2937] text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Cluster Name & Hub City</th>
                    <th className="py-2.5 px-3">State & Zone</th>
                    <th className="py-2.5 px-3 text-right">Cluster Demand</th>
                    <th className="py-2.5 px-3 text-right">Supply</th>
                    <th className="py-2.5 px-3 text-right text-orange-400">Deficit (KL/yr)</th>
                    <th className="py-2.5 px-3 text-right text-emerald-400">Unmet Value</th>
                    <th className="py-2.5 px-3 text-right text-cyan-400">Depot (KL)</th>
                    <th className="py-2.5 px-3 text-right">Capex</th>
                    <th className="py-2.5 px-3 text-right text-purple-400">Yr-1 Target</th>
                    <th className="py-2.5 px-3">Dominant Sector</th>
                    <th className="py-2.5 px-3">Phase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/50 text-gray-300 text-xs">
                  {filteredClusters36.map((c) => {
                    const isSelected = selectedClusterId36 === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedClusterId36(c.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-orange-500/15 border-l-4 border-l-orange-500 text-white'
                            : 'hover:bg-[#151921]'
                        }`}
                      >
                        <td className="py-2 px-3 font-bold text-gray-400">{c.clusterRank}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-white">{c.clusterName}</div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-orange-400" />
                            {c.targetHubCity}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold">{c.stateName}</div>
                          <span className="text-[9px] px-1.5 py-0.2 bg-[#1A202C] text-gray-400 rounded uppercase">
                            {c.region}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-gray-400">{c.totalClusterDemandKL.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-gray-400">{c.accessibleSupplyKL.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-bold text-orange-400">
                          {c.unservedDeficitKL.toLocaleString()} KL
                          <div className="text-[9px] text-gray-500">({c.deficitCoveragePct}%)</div>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          ₹{c.unmetMarketValueCr.toLocaleString()} Cr
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-cyan-400">
                          {c.recommendedDepotSizeKL.toLocaleString()} KL
                        </td>
                        <td className="py-2 px-3 text-right text-yellow-400">
                          ₹{c.estimatedCapexCr.toFixed(1)} Cr
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-purple-400">
                          {c.targetAnnualCaptureVolKL.toLocaleString()} KL
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] bg-[#1E2430] text-cyan-300 px-2 py-0.5 rounded block whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                            {c.dominantSector}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[9.5px] px-2 py-0.5 rounded uppercase font-bold ${
                            c.rolloutPhase.startsWith('Phase 1')
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                              : c.rolloutPhase.startsWith('Phase 2')
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/40'
                              : 'bg-purple-950 text-purple-300 border border-purple-800/40'
                          }`}>
                            {c.rolloutPhase.split(' ')[0]} {c.rolloutPhase.split(' ')[1]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drill-Down Hub Specification Inspector Card */}
          {selectedCluster36 && (
            <div className="bg-[#0E1117] border-2 border-orange-500/60 p-4 rounded space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1F2937] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-orange-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                      RANK #{selectedCluster36.clusterRank}
                    </span>
                    <span className="text-gray-400 text-xs uppercase font-bold">
                      {selectedCluster36.region} Zone • {selectedCluster36.stateName}
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded uppercase font-bold">
                      {selectedCluster36.rolloutPhase}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-white mt-1 uppercase flex items-center gap-2">
                    <Building className="w-4 h-4 text-orange-400" />
                    {selectedCluster36.clusterName} ({selectedCluster36.targetHubCity} HUB)
                  </h4>
                  <p className="text-xs text-cyan-300 font-bold mt-0.5">
                    Dominant Demand: {selectedCluster36.dominantSector}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 uppercase block">Unserved Deficit Volume</span>
                    <span className="text-lg font-extrabold text-orange-400">
                      {selectedCluster36.unservedDeficitKL.toLocaleString()} KL/YR
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-bold">
                      ₹{selectedCluster36.unmetMarketValueCr.toLocaleString()} Cr Potential
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div className="bg-[#151921] p-3 rounded border border-[#1F2937]">
                  <span className="text-[10px] text-gray-400 uppercase block">Depot Sizing & Stocking</span>
                  <div className="mt-1 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Storage Capacity:</span>
                      <span className="font-bold text-cyan-400">{selectedCluster36.recommendedDepotSizeKL.toLocaleString()} KL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Safety Buffer:</span>
                      <span className="font-bold text-yellow-400">{selectedCluster36.recommendedSafetyStockKL.toLocaleString()} KL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Demand Deficit Rate:</span>
                      <span className="font-bold text-orange-400">{selectedCluster36.deficitCoveragePct}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#151921] p-3 rounded border border-[#1F2937]">
                  <span className="text-[10px] text-gray-400 uppercase block">Financials & Savings</span>
                  <div className="mt-1 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Setup Capex:</span>
                      <span className="font-bold text-yellow-400">₹{selectedCluster36.estimatedCapexCr.toFixed(2)} Cr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Freight Savings:</span>
                      <span className="font-bold text-green-400">₹{selectedCluster36.annualFreightSavingsCr.toFixed(2)} Cr/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Year-1 Target Vol:</span>
                      <span className="font-bold text-purple-400">{selectedCluster36.targetAnnualCaptureVolKL.toLocaleString()} KL</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#151921] p-3 rounded border border-[#1F2937]">
                  <span className="text-[10px] text-gray-400 uppercase block">Anchor Industry Clients</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedCluster36.keyAnchorIndustries.map((ind, i) => (
                      <span key={i} className="text-[9.5px] bg-[#1E2430] text-gray-300 px-1.5 py-0.5 rounded border border-[#374151]">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#151921] p-3 rounded border border-[#1F2937]">
                  <span className="text-[10px] text-gray-400 uppercase block">Serviced Ring Districts & Transport</span>
                  <div className="mt-1 space-y-1.5">
                    <div className="flex flex-wrap gap-1">
                      {selectedCluster36.servicedDistricts.map((dist, i) => (
                        <span key={i} className="text-[9.5px] bg-orange-950/60 text-orange-300 px-1.5 py-0.5 rounded border border-orange-800/40">
                          {dist}
                        </span>
                      ))}
                    </div>
                    <p className="text-[9.5px] text-gray-400 italic">
                      Corridor: {selectedCluster36.logisticsConnectivity}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Telemetry Strip: Active Incumbents Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0E1117] border border-[#1F2937] p-3 border-l-2 border-cyan-400">
          <span className="text-[10px] text-gray-500 font-mono block uppercase">Total Tracked Distributors</span>
          <span className="text-xl font-bold text-cyan-300 font-mono mt-0.5 block">
            {totalTrackedDistributors} Hubs
          </span>
          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
            ACROSS {uniqueStates.length} INDUSTRIAL STATES
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3 border-l-2 border-emerald-400">
          <span className="text-[10px] text-gray-500 font-mono block uppercase">Incumbent Annual Volume</span>
          <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
            {formatKL(totalIncumbentVolumeKL)}
          </span>
          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
            AVG THROUGHPUT: {Math.round(totalIncumbentVolumeKL / totalTrackedDistributors).toLocaleString()} KL/HUB
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3 border-l-2 border-yellow-400">
          <span className="text-[10px] text-gray-500 font-mono block uppercase">Aggregated Storage Capacity</span>
          <span className="text-xl font-bold text-yellow-300 font-mono mt-0.5 block">
            {totalStorageCapacityKL.toLocaleString()} KL
          </span>
          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
            CAPACITY TURNOVER: {(totalIncumbentVolumeKL / totalStorageCapacityKL).toFixed(1)}x /YEAR
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3 border-l-2 border-[#F27D26]">
          <span className="text-[10px] text-gray-500 font-mono block uppercase">Tied Retail &amp; Garages</span>
          <span className="text-xl font-bold text-[#F27D26] font-mono mt-0.5 block">
            {totalDealersTied.toLocaleString()} Outlets
          </span>
          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
            AVG SERVICING RADIUS: 45.8 KM
          </span>
        </div>
      </div>

      {/* VIEW 1: CURRENT DISTRIBUTOR DIRECTORY & FILTERING */}
      {activeView === 'distributors' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search agency, brand, city, district or SKU..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0A0B0E] border border-[#374151] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Brand Filter */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-[10px]">BRAND:</span>
                <select
                  value={brandFilter}
                  onChange={e => setBrandFilter(e.target.value)}
                  className="bg-[#0A0B0E] border border-[#374151] text-gray-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">ALL BRANDS ({uniqueBrands.length})</option>
                  {uniqueBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* State Filter */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-[10px]">STATE:</span>
                <select
                  value={stateFilter}
                  onChange={e => setStateFilter(e.target.value)}
                  className="bg-[#0A0B0E] border border-[#374151] text-gray-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">ALL STATES ({uniqueStates.length})</option>
                  {uniqueStates.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Export Buttons */}
              <button
                onClick={() => downloadWhiteSpotExcel(locations, 'Base')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded transition-colors text-[10px] font-bold uppercase shadow"
                title="Download White-Spot & Distributor Validation Excel (.CSV)"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                <span>EXCEL EXPORT (.CSV)</span>
              </button>

              <button
                onClick={handleExportDistributorData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F2937] hover:bg-[#374151] text-cyan-300 border border-[#374151] rounded transition-colors text-[10px] font-bold uppercase"
              >
                <Download className="w-3 h-3" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Distributor Table */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
              <h3 className="font-bold text-xs text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-cyan-400" />
                Current Lubricant Distributors &amp; Stockists ({filteredDistributors.length} Locations)
              </h3>
              <span className="text-[10px] font-mono text-gray-500 uppercase">
                GEOSPATIAL COORDINATES &amp; CAPACITY AUDITED
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1F2937] text-[10px] text-gray-500 uppercase">
                    <th className="pb-2 pl-2">DISTRIBUTOR &amp; LOCATION</th>
                    <th className="pb-2">BRAND / PARENT</th>
                    <th className="pb-2">CHANNEL TYPE</th>
                    <th className="pb-2 text-right">ANNUAL VOLUME</th>
                    <th className="pb-2 text-right">STORAGE CAP</th>
                    <th className="pb-2 text-right">RETAILERS TIED</th>
                    <th className="pb-2 text-right">COVERAGE RADIUS</th>
                    <th className="pb-2 text-center">PERFORMANCE</th>
                    <th className="pb-2 text-right pr-2">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]">
                  {filteredDistributors.map((dist) => {
                    const brandColor = BRAND_COLORS[dist.brand] || '#F27D26';
                    return (
                      <tr key={dist.id} className="hover:bg-[#151921] transition-colors">
                        <td className="py-2.5 pl-2">
                          <span className="font-bold text-white block">{dist.name}</span>
                          <span className="text-[10px] text-gray-400 block">{dist.city}, {dist.district} ({dist.stateName})</span>
                          <span className="text-[9px] text-gray-500 block truncate max-w-xs">{dist.address}</span>
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold inline-block border" style={{
                            color: brandColor,
                            borderColor: `${brandColor}40`,
                            backgroundColor: `${brandColor}15`
                          }}>
                            {dist.brand}
                          </span>
                          <span className="text-[9px] text-gray-500 block mt-0.5">{dist.parentCompany}</span>
                        </td>
                        <td className="py-2.5">
                          <span className="text-[10px] font-medium text-gray-300 bg-[#0A0B0E] px-1.5 py-0.5 rounded border border-[#374151]">
                            {dist.distributorType}
                          </span>
                          <span className="text-[9px] text-gray-500 block mt-0.5">{dist.primarySector}</span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-cyan-300">
                          {formatKL(dist.annualVolumeKL)}
                          <span className="text-[9px] text-gray-500 block">{dist.monthlyThroughputKL} KL/mo</span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-gray-200">
                          {dist.warehouseCapacityKL} KL
                          <span className="text-[9px] text-yellow-500/80 block">
                            {((dist.annualVolumeKL / (dist.warehouseCapacityKL * 12)) * 100).toFixed(0)}% util
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-emerald-400 font-bold">
                          {dist.dealerNetworkCount}
                          <span className="text-[9px] text-gray-500 block">+{dist.industrialAccountsCount} B2B accts</span>
                        </td>
                        <td className="py-2.5 text-right text-gray-300">
                          {dist.coverageRadiusKm} km
                          <span className="text-[9px] text-gray-500 block">{dist.avgLeadTimeDays}d lead</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            dist.performanceTier === 'Dominant Leader'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : dist.performanceTier === 'Capacity Constrained'
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                              : dist.performanceTier === 'High Performer'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {dist.performanceTier}
                          </span>
                          <span className="text-[9px] text-gray-500 block mt-0.5">{dist.marketShareInDistrictPct}% share</span>
                        </td>
                        <td className="py-2.5 text-right pr-2">
                          <button
                            onClick={() => {
                              setSelectedDistributorId(dist.id);
                              if (dist.targetWhiteSpotId) {
                                setSelectedWhiteSpotId(dist.targetWhiteSpotId);
                              }
                              setActiveView('comparison');
                            }}
                            className="px-2.5 py-1 rounded bg-[#1F2937] hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 text-[10px] font-bold transition-all inline-flex items-center gap-1 uppercase"
                            title="Compare head-to-head with white spot"
                          >
                            <Scale className="w-3 h-3" />
                            <span>COMPARE</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: WHITE SPOTS PRIORITIZATION & CALIBRATION */}
      {activeView === 'whiteSpots' && (
        <div className="space-y-4">
          {/* Dynamic Weight Tuning Panel */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#F27D26]" />
                <h3 className="font-bold text-xs text-white uppercase font-mono tracking-wider">
                  Dynamic Multi-Criteria Weight Calibration
                </h3>
              </div>
              <button
                onClick={handleResetWeights}
                className="flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-[#F27D26] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET BENCHMARKS</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <div className="flex justify-between mb-1 text-[10px]">
                  <span className="text-gray-400">DEMAND POTENTIAL:</span>
                  <span className="font-bold text-[#F27D26]">{scoringWeights.demandPotential}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={scoringWeights.demandPotential}
                  onChange={e => handleWeightChange('demandPotential', Number(e.target.value))}
                  className="w-full accent-[#F27D26] h-1 bg-[#1F2937] rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[10px]">
                  <span className="text-gray-400">SUPPLY GAP WEIGHT:</span>
                  <span className="font-bold text-red-400">{scoringWeights.supplyGap}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={scoringWeights.supplyGap}
                  onChange={e => handleWeightChange('supplyGap', Number(e.target.value))}
                  className="w-full accent-red-500 h-1 bg-[#1F2937] rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[10px]">
                  <span className="text-gray-400">COMPETITOR DEFICIT:</span>
                  <span className="font-bold text-yellow-400">{scoringWeights.competitorGap}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={scoringWeights.competitorGap}
                  onChange={e => handleWeightChange('competitorGap', Number(e.target.value))}
                  className="w-full accent-yellow-500 h-1 bg-[#1F2937] rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[10px]">
                  <span className="text-gray-400">ACCESSIBILITY DISTANCE:</span>
                  <span className="font-bold text-blue-400">{scoringWeights.accessibilityGap}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={scoringWeights.accessibilityGap}
                  onChange={e => handleWeightChange('accessibilityGap', Number(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-[#1F2937] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Archetype Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 font-mono text-[10px]">
            {whiteSpotTypes.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded text-[10px] font-bold whitespace-nowrap transition-all uppercase ${
                  selectedTypeFilter === t.id
                    ? 'bg-[#1F2937] text-[#F27D26] border border-[#F27D26]'
                    : 'bg-[#0E1117] border border-[#1F2937] text-gray-400 hover:text-white hover:bg-[#151921]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Ranked Candidate White Spots Table */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
              <h3 className="font-bold text-xs text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-[#F27D26]" />
                Ranked Distributor Opportunities ({filteredLocations.length} Matching Districts)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadWhiteSpotExcel(locations, 'Base')}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded transition-colors text-[10px] font-bold uppercase shadow"
                  title="Download full candidate white spots excel dataset"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  <span>EXPORT EXCEL (.CSV)</span>
                </button>
                <span className="text-[10px] font-mono text-gray-500 uppercase">
                  DYNAMIC SCORE APPLIED
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1F2937] text-[10px] text-gray-500 uppercase">
                    <th className="pb-2 pl-2">RANK</th>
                    <th className="pb-2">DISTRICT / STATE</th>
                    <th className="pb-2">STRATEGIC ARCHETYPE</th>
                    <th className="pb-2 text-right">TOTAL DEMAND</th>
                    <th className="pb-2 text-right">SUPPLY GAP</th>
                    <th className="pb-2 text-right">COVERAGE</th>
                    <th className="pb-2 text-right">DYNAMIC SCORE</th>
                    <th className="pb-2 text-right pr-2">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]">
                  {filteredLocations.map((loc, idx) => {
                    const isCritical = loc.dynamicScore >= 80;
                    return (
                      <tr key={loc.id} className="hover:bg-[#151921] transition-colors">
                        <td className="py-2.5 pl-2 font-bold text-gray-400">#{idx + 1}</td>
                        <td className="py-2.5">
                          <span className="font-bold text-white block">{loc.name}</span>
                          <span className="text-[10px] text-gray-500">{loc.stateName}</span>
                        </td>
                        <td className="py-2.5">
                          <span className="text-[10px] font-semibold text-[#F27D26] bg-[#0A0B0E] px-1.5 py-0.5 rounded border border-[#374151]">
                            {loc.whiteSpotType.split('—')[0]}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-gray-200">
                          {formatKL(loc.totalEstimatedDemandKL)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-red-400">
                          {formatKL(loc.supplyGapKL)}
                        </td>
                        <td className="py-2.5 text-right text-yellow-400">
                          {loc.supplyCoverageRatioPct}%
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCritical
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-[#1F2937] text-[#F27D26] border border-[#374151]'
                          }`}>
                            {loc.dynamicScore.toFixed(1)} / 100
                          </span>
                        </td>
                        <td className="py-2.5 text-right pr-2 flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedWhiteSpotId(loc.id);
                              setActiveView('comparison');
                            }}
                            className="px-2 py-1 rounded bg-[#1F2937] hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 text-[10px] font-bold transition-all inline-flex items-center gap-1 uppercase"
                            title="Compare with incumbent distributors"
                          >
                            <Scale className="w-3 h-3" />
                            <span>COMPARE</span>
                          </button>
                          <button
                            onClick={() => onSelectDistrict(loc)}
                            className="px-2.5 py-1 rounded bg-[#1F2937] hover:bg-[#374151] text-gray-200 hover:text-[#F27D26] border border-[#374151] text-[10px] font-bold transition-all inline-flex items-center gap-1 uppercase"
                          >
                            <span>INSPECT</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: HEAD-TO-HEAD COMPARATIVE ANALYZER */}
      {activeView === 'comparison' && (
        <div className="space-y-4">
          {/* Selectors Bar */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Left: Choose White Spot District */}
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-[#F27D26]" />
                SELECT TARGET WHITE-SPOT DISTRICT:
              </label>
              <select
                value={selectedWhiteSpotId}
                onChange={e => setSelectedWhiteSpotId(e.target.value)}
                className="w-full bg-[#0A0B0E] border border-[#374151] text-white rounded px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#F27D26]"
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.stateCode} — {l.name.toUpperCase()} (Score: {l.whiteSpotScore}, Unmet: {l.supplyGapKL} KL)
                  </option>
                ))}
              </select>
            </div>

            {/* Right: Choose Incumbent Distributor */}
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex items-center gap-1.5">
                <Store className="w-3 h-3 text-cyan-400" />
                SELECT INCUMBENT COMPETITOR DISTRIBUTOR:
              </label>
              <select
                value={selectedDistributorId}
                onChange={e => setSelectedDistributorId(e.target.value)}
                className="w-full bg-[#0A0B0E] border border-[#374151] text-white rounded px-3 py-2 text-xs font-bold focus:outline-none focus:border-cyan-400"
              >
                {distributors.map(d => (
                  <option key={d.id} value={d.id}>
                    [{d.brand}] {d.name} — {d.city}, {d.stateCode} ({d.annualVolumeKL} KL/yr)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Proposed White Spot Profile */}
            <div className="bg-[#0E1117] border-2 border-[#F27D26]/60 p-4 rounded shadow-xl flex flex-col justify-between font-mono">
              <div>
                <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#F27D26]" />
                    <span className="text-xs font-bold text-white uppercase">PROPOSED WHITE-SPOT EXPANSION</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F2937] text-[#F27D26] border border-[#F27D26]/40">
                    SCORE: {compareWhiteSpot.whiteSpotScore}/100
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{compareWhiteSpot.name}</h3>
                <div className="text-xs text-gray-400 mb-3">{compareWhiteSpot.stateName} • {compareWhiteSpot.region} Zone</div>

                {/* Key Metric Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-[#050608] p-3 rounded border border-[#1F2937]">
                  <div>
                    <span className="text-gray-500 text-[10px] block">TOTAL REGIONAL DEMAND:</span>
                    <span className="text-base font-bold text-[#F27D26]">{formatKL(compareWhiteSpot.totalEstimatedDemandKL)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">UNMET SUPPLY GAP:</span>
                    <span className="text-base font-bold text-red-400">{formatKL(compareWhiteSpot.supplyGapKL)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">PROPOSED DEPOT CAPACITY:</span>
                    <span className="text-sm font-bold text-white">{compareWhiteSpot.recommendedStorageCapacityKL} KL</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">UNMET REVENUE OPPORTUNITY:</span>
                    <span className="text-sm font-bold text-green-400">₹{compareWhiteSpot.unmetOpportunityValueINR} CR</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-300">
                  <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
                    <span className="text-gray-500">Current Local Supply Coverage:</span>
                    <strong className="text-yellow-400">{compareWhiteSpot.supplyCoverageRatioPct}%</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
                    <span className="text-gray-500">Incumbents in District:</span>
                    <strong className="text-white">{compareWhiteSpot.supply.masterDistributorsCount} Master Dist. ({compareWhiteSpot.supply.retailLubricantOutletsCount} Outlets)</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
                    <span className="text-gray-500">Recommended Facility:</span>
                    <strong className="text-cyan-300">{compareWhiteSpot.recommendedFacility}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
                    <span className="text-gray-500">Primary Demand Drivers:</span>
                    <strong className="text-[#F27D26]">{compareWhiteSpot.keyIndustries.slice(0, 2).join(', ')}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1F2937] flex items-center justify-between">
                <button
                  onClick={() => onSelectDistrict(compareWhiteSpot)}
                  className="px-3 py-1.5 bg-[#F27D26] hover:bg-[#d96a1a] text-black font-bold rounded text-xs transition-colors flex items-center gap-1 uppercase"
                >
                  <span>Open Full District Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Incumbent Distributor Profile */}
            <div className="bg-[#0E1117] border-2 border-cyan-500/60 p-4 rounded shadow-xl flex flex-col justify-between font-mono">
              <div>
                <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase">INCUMBENT DISTRIBUTOR BENCHMARK</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50 uppercase">
                    {compareDistributor.brand}
                  </span>
                </div>

                <h3 className="text-base font-bold text-cyan-300">{compareDistributor.name}</h3>
                <div className="text-xs text-gray-400 mb-3">{compareDistributor.city}, {compareDistributor.district} ({compareDistributor.stateName})</div>

                {/* Key Metric Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-[#050608] p-3 rounded border border-[#1F2937]">
                  <div>
                    <span className="text-gray-500 text-[10px] block">ANNUAL VOLUME THROUGHPUT:</span>
                    <span className="text-base font-bold text-cyan-300">{formatKL(compareDistributor.annualVolumeKL)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">WAREHOUSE CAPACITY:</span>
                    <span className="text-base font-bold text-white">{compareDistributor.warehouseCapacityKL} KL</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">TIED DEALER NETWORK:</span>
                    <span className="text-sm font-bold text-emerald-400">{compareDistributor.dealerNetworkCount} Retail Outlets</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">DELIVERY RADIUS &amp; LEAD:</span>
                    <span className="text-sm font-bold text-yellow-400">{compareDistributor.coverageRadiusKm} KM ({compareDistributor.avgLeadTimeDays}d)</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-300">
                  <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
                    <span className="text-gray-500">Parent OMC / Entity:</span>
                    <strong className="text-white">{compareDistributor.parentCompany}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
                    <span className="text-gray-500">Channel Type:</span>
                    <strong className="text-cyan-300">{compareDistributor.distributorType}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
                    <span className="text-gray-500">Performance Status:</span>
                    <strong className="text-white">{compareDistributor.performanceTier} ({compareDistributor.marketShareInDistrictPct}% District Share)</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
                    <span className="text-gray-500">Top Selling SKUs:</span>
                    <strong className="text-gray-200 truncate max-w-xs">{compareDistributor.topSellingSKUs.slice(0, 2).join(', ')}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1F2937] flex items-center justify-between text-[10px] text-gray-400">
                <span>CONTACT: <strong className="text-white">{compareDistributor.contactPerson}</strong> ({compareDistributor.contactPhone})</span>
                <span>ESTABLISHED: <strong className="text-white">{compareDistributor.establishedYear}</strong></span>
              </div>
            </div>
          </div>

          {/* Strategic Head-to-Head Headroom Evaluation */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-4 rounded font-mono">
            <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
              Strategic Market Entry Headroom &amp; Competitor Gap Assessment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#050608] p-3 rounded border border-[#1F2937]">
                <span className="text-gray-500 text-[10px] block uppercase">Throughput Headroom</span>
                <div className="text-lg font-bold text-emerald-400 mt-1">
                  {compareWhiteSpot.supplyGapKL > compareDistributor.annualVolumeKL ? (
                    <span>+{(compareWhiteSpot.supplyGapKL - compareDistributor.annualVolumeKL).toLocaleString()} KL Overhang</span>
                  ) : (
                    <span>{(compareWhiteSpot.supplyGapKL / compareDistributor.annualVolumeKL * 100).toFixed(0)}% of Incumbent Vol</span>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 mt-1">
                  Unmet demand in {compareWhiteSpot.name} represents {((compareWhiteSpot.supplyGapKL / compareDistributor.annualVolumeKL) * 100).toFixed(0)}% of {compareDistributor.name}&apos;s total yearly volume.
                </p>
              </div>

              <div className="bg-[#050608] p-3 rounded border border-[#1F2937]">
                <span className="text-gray-500 text-[10px] block uppercase">Service Lead Time Advantage</span>
                <div className="text-lg font-bold text-cyan-300 mt-1">
                  {compareDistributor.avgLeadTimeDays > 2.0 ? (
                    <span>Vulnerable Lead ({compareDistributor.avgLeadTimeDays} Days)</span>
                  ) : (
                    <span>Competitive Lead ({compareDistributor.avgLeadTimeDays} Days)</span>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 mt-1">
                  A local Tier-2 micro-depot in {compareWhiteSpot.name} can deliver same-day (0.5 day) lead time, cutting {compareDistributor.avgLeadTimeDays - 0.5} days off incumbent delivery.
                </p>
              </div>

              <div className="bg-[#050608] p-3 rounded border border-[#1F2937]">
                <span className="text-gray-500 text-[10px] block uppercase">Incumbent Capacity Stress</span>
                <div className="text-lg font-bold text-yellow-400 mt-1">
                  {compareDistributor.performanceTier === 'Capacity Constrained' ? (
                    <span>High Constraint (Bottlenecked)</span>
                  ) : (
                    <span>{compareDistributor.performanceTier}</span>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 mt-1">
                  Incumbent storage turnover is {(compareDistributor.annualVolumeKL / compareDistributor.warehouseCapacityKL).toFixed(1)}x/yr, indicating high warehouse load and strong retail willingness to switch.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: MARKET SHARE & ANALYTICAL CHARTS */}
      {activeView === 'charts' && (
        <div className="space-y-4">
          {/* Strategic Market Share Summary KPI Header */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 font-mono">
            <div className="bg-[#0E1117] border border-[#1F2937] p-3 rounded">
              <span className="text-[9.5px] text-gray-500 uppercase block">Total Market Benchmark</span>
              <div className="text-base font-bold text-white mt-0.5">5.70M KL</div>
              <span className="text-[9px] text-emerald-400 font-bold">₹91,200 Cr Value</span>
            </div>
            <div className="bg-[#0E1117] border border-[#1F2937] p-3 rounded">
              <span className="text-[9.5px] text-gray-500 uppercase block">PSU OMC Dominance</span>
              <div className="text-base font-bold text-red-400 mt-0.5">46.5% Share</div>
              <span className="text-[9px] text-gray-400">2.65M KL (Servo/MAK/HP)</span>
            </div>
            <div className="bg-[#0E1117] border border-[#1F2937] p-3 rounded">
              <span className="text-[9.5px] text-gray-500 uppercase block">Global MNC Footprint</span>
              <div className="text-base font-bold text-emerald-400 mt-0.5">23.5% Share</div>
              <span className="text-[9px] text-gray-400">1.34M KL (Castrol/Shell)</span>
            </div>
            <div className="bg-[#0E1117] border border-[#1F2937] p-3 rounded">
              <span className="text-[9.5px] text-gray-500 uppercase block">Domestic &amp; Regional</span>
              <div className="text-base font-bold text-[#F27D26] mt-0.5">30.0% Share</div>
              <span className="text-[9px] text-gray-400">1.71M KL (Gulf/Veedol/JVs)</span>
            </div>
            <div className="bg-[#0E1117] border border-cyan-500/30 p-3 rounded col-span-2 md:col-span-1 bg-cyan-950/20">
              <span className="text-[9.5px] text-cyan-400 uppercase block font-bold">Unmet Deficit Pool</span>
              <div className="text-base font-bold text-cyan-300 mt-0.5">1.51M KL (26.5%)</div>
              <span className="text-[9px] text-cyan-400 font-bold">₹24,117 Cr Opportunity</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 1: Brand Market Share & Volume Breakdown */}
            <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-col">
              <div className="flex flex-wrap items-center justify-between border-b border-[#1F2937] pb-2 mb-3 gap-2">
                <div>
                  <span className="font-mono font-bold text-xs text-white uppercase flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                    Incumbent Brand Market Share &amp; Throughput
                  </span>
                  <p className="text-[9.5px] font-mono text-gray-500 mt-0.5">
                    {brandViewMode === 'national' ? 'ALL-INDIA AUDITED BRAND ALLOCATIONS (5.70M KL TOTAL)' : 'TRACKED CHANNEL DISTRIBUTOR FOOTPRINT'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Scope Switcher */}
                  <div className="flex items-center gap-1 bg-[#151921] p-1 border border-[#1F2937] rounded">
                    <button
                      onClick={() => setBrandViewMode('national')}
                      className={`px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase transition-colors rounded ${
                        brandViewMode === 'national'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      5.7M Macro
                    </button>
                    <button
                      onClick={() => setBrandViewMode('tracked')}
                      className={`px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase transition-colors rounded ${
                        brandViewMode === 'tracked'
                          ? 'bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Channel Nodes
                    </button>
                  </div>

                  {/* Chart Style Switcher */}
                  <div className="flex items-center gap-1 bg-[#151921] p-1 border border-[#1F2937] rounded">
                    <button
                      onClick={() => setBrandChartType('bar')}
                      className={`px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase transition-colors rounded ${
                        brandChartType === 'bar'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Bar
                    </button>
                    <button
                      onClick={() => setBrandChartType('donut')}
                      className={`px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase transition-colors rounded ${
                        brandChartType === 'donut'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Donut (%)
                    </button>
                  </div>
                </div>
              </div>

              {brandChartType === 'bar' ? (
                <div className="h-64 w-full font-mono text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={brandShareChartData} margin={{ top: 10, right: 15, left: -5, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                      <XAxis 
                        dataKey="brand" 
                        stroke="#6B7280" 
                        angle={-25} 
                        textAnchor="end" 
                        height={45} 
                        tick={{ fontSize: 9.5 }} 
                      />
                      <YAxis 
                        stroke="#6B7280" 
                        tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(2)}M` : `${(v/1000).toFixed(0)}k`} 
                        tick={{ fontSize: 9.5 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0C1017', borderColor: '#374151', fontSize: '11px', color: '#fff', borderRadius: '4px' }}
                        formatter={(val: any, name: any, item: any) => [
                          `${Number(val).toLocaleString()} KL/YR (${item.payload.sharePct?.toFixed(1)}% Share • ₹${(item.payload.revenueINR || 0).toLocaleString()} Cr)`,
                          'Supply Volume'
                        ]}
                        labelFormatter={(label) => `Brand: ${label}`}
                      />
                      <Bar dataKey="volumeKL" radius={[4, 4, 0, 0]}>
                        {brandShareChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 w-full font-mono text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={brandShareChartData}
                        dataKey="sharePct"
                        nameKey="brand"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {brandShareChartData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0C1017', borderColor: '#374151', fontSize: '11px', color: '#fff', borderRadius: '4px' }}
                        formatter={(val: any, name: any, item: any) => [
                          `${Number(val).toFixed(1)}% (${Number(item.payload.volumeKL).toLocaleString()} KL/YR)`,
                          name
                        ]}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', paddingTop: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chart 2: State-wise Market Volume & Supply Capture */}
            <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-col">
              <div className="flex flex-wrap items-center justify-between border-b border-[#1F2937] pb-2 mb-3 gap-2">
                <div>
                  <span className="font-mono font-bold text-xs text-white uppercase flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    State-wise Market Distribution &amp; Demand
                  </span>
                  <p className="text-[9.5px] font-mono text-gray-500 mt-0.5">
                    {stateViewMode === 'allIndia' ? 'TOP 10 STATES CONSUMPTION (ALL-INDIA BENCHMARK)' : 'VOLUME TRACKED ACROSS CHANNEL DISTRIBUTORS'}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-[#151921] p-1 border border-[#1F2937] rounded">
                  <button
                    onClick={() => setStateViewMode('allIndia')}
                    className={`px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase transition-colors rounded ${
                      stateViewMode === 'allIndia'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Top States (5.7M)
                  </button>
                  <button
                    onClick={() => setStateViewMode('channel')}
                    className={`px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase transition-colors rounded ${
                      stateViewMode === 'channel'
                        ? 'bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Channel Nodes
                  </button>
                </div>
              </div>
              <div className="h-64 w-full font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateDistributionData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                    <XAxis dataKey="state" stroke="#6B7280" angle={-25} textAnchor="end" height={45} tick={{ fontSize: 9.5 }} />
                    <YAxis stroke="#6B7280" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0E1117', borderColor: '#374151', fontSize: '11px', color: '#fff' }}
                      formatter={(val: any, name: any, item: any) => [
                        `${Number(val).toLocaleString()} KL/YR (${item.payload.sharePct?.toFixed(1)}% Share • Gap: ${Number(item.payload.gapKL || 0).toLocaleString()} KL)`,
                        stateViewMode === 'allIndia' ? 'Total State Demand' : 'Tracked Channel Volume'
                      ]}
                      labelFormatter={(label, items: any) => items?.[0]?.payload?.fullName || label}
                    />
                    <Bar dataKey="volumeKL" radius={[4, 4, 0, 0]}>
                      {stateDistributionData.map((entry, index) => (
                        <Cell key={`state-cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#06b6d4' : index === 2 ? '#3b82f6' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Corporate Category & Channel Structure */}
            <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
                <div>
                  <span className="font-mono font-bold text-xs text-white uppercase flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-[#F27D26]" />
                    Corporate Sector Market Share (5.70M KL)
                  </span>
                  <p className="text-[9.5px] font-mono text-gray-500 mt-0.5">
                    PUBLIC SECTOR OMCS VS GLOBAL MNCS VS DOMESTIC LISTED
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">₹91,200 CR TOTAL</span>
              </div>
              <div className="h-64 w-full font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={corporateSegmentData} layout="vertical" margin={{ top: 5, right: 25, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                    <XAxis type="number" stroke="#6B7280" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                    <YAxis type="category" dataKey="shortName" stroke="#6B7280" tick={{ fontSize: 9.5 }} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0E1117', borderColor: '#374151', fontSize: '11px', color: '#fff' }}
                      formatter={(val: any, name: any, item: any) => [
                        `${(Number(val)/1000000).toFixed(2)}M KL (${item.payload.sharePct}% • ₹${item.payload.revenueINR.toLocaleString()} Cr) — ${item.payload.description}`,
                        'Sector Volume'
                      ]}
                      labelFormatter={(label, items: any) => items?.[0]?.payload?.name || label}
                    />
                    <Bar dataKey="volumeKL" radius={[0, 4, 4, 0]}>
                      {corporateSegmentData.map((entry, index) => (
                        <Cell key={`corp-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Unmet White-Spot Demand vs Incumbent Distributor Volume */}
            <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
                <div>
                  <span className="font-mono font-bold text-xs text-white uppercase flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-cyan-400" />
                    White-Spot Deficit vs. Incumbent Distribution Volume
                  </span>
                  <p className="text-[9.5px] font-mono text-gray-500 mt-0.5">
                    UNMET SUPPLY GAP VS CURRENT LOGISTICS COVERAGE (TOP 8 HUBS)
                  </p>
                </div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">HIGH CONTEST HUBS</span>
              </div>
              <div className="h-64 w-full font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtVersusData} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                    <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 9.5 }} angle={-25} textAnchor="end" height={40} />
                    <YAxis stroke="#6B7280" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0E1117', borderColor: '#374151', fontSize: '11px', color: '#fff' }}
                      formatter={(val: any, name: any, item: any) => [
                        `${Number(val).toLocaleString()} KL (${item.payload.gapPct}% Deficit Rate)`,
                        name === 'unmetGapKL' ? 'Unserved Market Gap' : 'Incumbent Tracked Volume'
                      ]}
                      labelFormatter={(label, items: any) => items?.[0]?.payload?.fullName || label}
                    />
                    <Legend wrapperStyle={{ fontSize: '9.5px', paddingTop: '5px' }} />
                    <Bar name="Unmet Market Gap (KL)" dataKey="unmetGapKL" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar name="Incumbent Volume (KL)" dataKey="incumbentVolumeKL" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
