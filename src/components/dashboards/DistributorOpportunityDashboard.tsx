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
  LabelList,
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
    <div className="space-y-5">
      {/* Header & Sub-Navigation Bar */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Distributor Intelligence &amp; White-Spot Comparative Analysis
            </h2>
            <span className="text-[10px] font-bold bg-purple-50 text-[#7C3AED] border border-purple-200 px-2 py-0.5 rounded-full uppercase">
              {totalTrackedDistributors} Incumbent Hubs Audited
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-benchmarking active OMC stockists vs. unmet regional white-spot opportunities
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveView('maxClusters')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 uppercase ${
              activeView === 'maxClusters'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>36 MAX WHITE-SPOT CLUSTERS (1.51M KL DEFICIT)</span>
          </button>

          <button
            onClick={() => setActiveView('distributors')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 uppercase ${
              activeView === 'distributors'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>CURRENT DISTRIBUTORS ({filteredDistributors.length})</span>
          </button>

          <button
            onClick={() => setActiveView('whiteSpots')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 uppercase ${
              activeView === 'whiteSpots'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>WHITE SPOTS ({filteredLocations.length})</span>
          </button>

          <button
            onClick={() => setActiveView('comparison')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 uppercase ${
              activeView === 'comparison'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>HEAD-TO-HEAD COMPARISON</span>
          </button>

          <button
            onClick={() => setActiveView('charts')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 uppercase ${
              activeView === 'charts'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>MARKET SHARE CHARTS</span>
          </button>
        </div>
      </div>

      {/* VIEW 0: ALL-INDIA 36 MAX WHITE-SPOT CLUSTERS & 100% DEFICIT COVERAGE ENGINE */}
      {activeView === 'maxClusters' && (
        <div className="space-y-4">
          {/* Master Strategic Reconciliation Banner */}
          <div className="bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-white border border-purple-200/80 p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="bg-[#7C3AED] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    100% Deficit Reconciliation
                  </span>
                  <span className="text-slate-500 text-xs font-semibold uppercase">
                    36 Regional Clusters Covering Full National Deficit
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  MAX WHITE-SPOT INFRASTRUCTURE NETWORK — 1,510,500 KL/YR UNMET MARKET RECOVERY
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Engineered 36 master regional hub clusters across 6 geographic zones to bridge India’s entire unserved lubricant deficit ({formatKL(SUMMARY_36_MAX_CLUSTERS.totalDeficitCoveredKL)} / ₹24,168 Cr). Each cluster features calibrated depot sizing, safety stock buffering, multi-district reach, and freight savings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadWhiteSpotExcel(locations)}
                  className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 uppercase shadow-2xs"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>EXPORT 36 CLUSTERS (EXCEL)</span>
                </button>
              </div>
            </div>

            {/* Strategic KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-3.5 border-t border-purple-100">
              <div className="bg-white p-3 border border-slate-200/90 rounded-xl shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-medium block">Total Deficit Covered</span>
                <span className="text-sm font-extrabold text-[#7C3AED] block mt-0.5">
                  {formatKL(SUMMARY_36_MAX_CLUSTERS.totalDeficitCoveredKL)}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">100% of National Gap</span>
              </div>

              <div className="bg-white p-3 border border-slate-200/90 rounded-xl shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-medium block">Unmet Market Value</span>
                <span className="text-sm font-extrabold text-emerald-700 block mt-0.5">
                  ₹{SUMMARY_36_MAX_CLUSTERS.totalDeficitMarketValueCr.toLocaleString()} Cr
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">@ ₹160/L Realization</span>
              </div>

              <div className="bg-white p-3 border border-slate-200/90 rounded-xl shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-medium block">Recommended Depot Net</span>
                <span className="text-sm font-extrabold text-indigo-700 block mt-0.5">
                  {SUMMARY_36_MAX_CLUSTERS.totalRecommendedStorageCapacityKL.toLocaleString()} KL
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">Across 36 Regional Hubs</span>
              </div>

              <div className="bg-white p-3 border border-slate-200/90 rounded-xl shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-medium block">Total Network Capex</span>
                <span className="text-sm font-extrabold text-amber-600 block mt-0.5">
                  ₹{SUMMARY_36_MAX_CLUSTERS.totalNetworkCapexCr.toFixed(1)} Cr
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">Hub Infrastructure &amp; Racks</span>
              </div>

              <div className="bg-white p-3 border border-slate-200/90 rounded-xl shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-medium block">Annual Freight Savings</span>
                <span className="text-sm font-extrabold text-emerald-700 block mt-0.5">
                  ₹{SUMMARY_36_MAX_CLUSTERS.totalAnnualFreightSavingsCr.toFixed(1)} Cr/yr
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">Lead Time &lt;18 hrs</span>
              </div>

              <div className="bg-white p-3 border border-slate-200/90 rounded-xl shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-medium block">Year-1 Target Capture</span>
                <span className="text-sm font-extrabold text-[#7C3AED] block mt-0.5">
                  {formatKL(SUMMARY_36_MAX_CLUSTERS.targetAnnualCaptureYear1KL)}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">Phase 1 Rollout</span>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search hub, city, state, industries, districts..."
                value={search36}
                onChange={(e) => setSearch36(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 text-xs font-medium"
              />
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-xs uppercase font-medium">Zone:</span>
              <select
                value={regionFilter36}
                onChange={(e) => setRegionFilter36(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-purple-500 font-medium"
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
              <span className="text-slate-500 text-xs uppercase font-medium">Phase:</span>
              <select
                value={phaseFilter36}
                onChange={(e) => setPhaseFilter36(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="all">ALL PHASES (36)</option>
                <option value="Phase 1">PHASE 1: 0-12 MO (14 HUBS)</option>
                <option value="Phase 2">PHASE 2: 12-24 MO (13 HUBS)</option>
                <option value="Phase 3">PHASE 3: 24-36 MO (9 HUBS)</option>
              </select>
            </div>

            {/* Dominant Sector Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-xs uppercase font-medium">Sector:</span>
              <select
                value={sectorFilter36}
                onChange={(e) => setSectorFilter36(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-purple-500 font-medium max-w-[200px]"
              >
                <option value="all">ALL SECTORS</option>
                <option value="Automotive & Fleet (HDEO/PCMO)">Automotive &amp; Fleet (HDEO/PCMO)</option>
                <option value="Heavy Industrial & Metals">Heavy Industrial &amp; Metals</option>
                <option value="Mining & Heavy Off-Highway">Mining &amp; Heavy Off-Highway</option>
                <option value="PCPIR Chemical & Process">PCPIR Chemical &amp; Process</option>
                <option value="Agri-Machinery & UTTO">Agri-Machinery &amp; UTTO</option>
                <option value="Port Marine & Heavy Logistics">Port Marine &amp; Heavy Logistics</option>
              </select>
            </div>

            <span className="text-slate-500 text-xs font-semibold">
              Showing <span className="text-[#7C3AED] font-bold">{filteredClusters36.length}</span> / 36 Clusters
            </span>
          </div>

          {/* Master Table of 36 Max White-Spot Clusters */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#7C3AED]" />
                  Strategic 36 White-Spot Master Coverage Grid
                </span>
                <span className="text-[10px] bg-purple-100 text-[#7C3AED] border border-purple-200 px-2 py-0.5 rounded-full uppercase font-bold">
                  Total Deficit in Selection: {formatKL(filteredClusters36.reduce((s, c) => s + c.unservedDeficitKL, 0))}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">
                Click any row to view full hub specs
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Cluster Name &amp; Hub City</th>
                    <th className="py-3 px-3">State &amp; Zone</th>
                    <th className="py-3 px-3 text-right">Cluster Demand</th>
                    <th className="py-3 px-3 text-right">Supply</th>
                    <th className="py-3 px-3 text-right text-[#7C3AED]">Deficit (KL/yr)</th>
                    <th className="py-3 px-3 text-right text-emerald-700">Unmet Value</th>
                    <th className="py-3 px-3 text-right text-indigo-700">Depot (KL)</th>
                    <th className="py-3 px-3 text-right">Capex</th>
                    <th className="py-3 px-3 text-right text-purple-700">Yr-1 Target</th>
                    <th className="py-3 px-3">Dominant Sector</th>
                    <th className="py-3 px-3">Phase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {filteredClusters36.map((c) => {
                    const isSelected = selectedClusterId36 === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedClusterId36(c.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-purple-50/90 border-l-4 border-l-[#7C3AED] text-slate-900 font-medium'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-400">{c.clusterRank}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{c.clusterName}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#7C3AED]" />
                            {c.targetHubCity}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{c.stateName}</div>
                          <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md uppercase font-medium">
                            {c.region}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{c.totalClusterDemandKL.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{c.accessibleSupplyKL.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#7C3AED]">
                          {c.unservedDeficitKL.toLocaleString()} KL
                          <div className="text-[10px] text-slate-400 font-normal">({c.deficitCoveragePct}%)</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          ₹{c.unmetMarketValueCr.toLocaleString()} Cr
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-700">
                          {c.recommendedDepotSizeKL.toLocaleString()} KL
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-700 font-semibold">
                          ₹{c.estimatedCapexCr.toFixed(1)} Cr
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-purple-700">
                          {c.targetAnnualCaptureVolKL.toLocaleString()} KL
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md block whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px] font-medium border border-slate-200/60">
                            {c.dominantSector}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                            c.rolloutPhase.startsWith('Phase 1')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : c.rolloutPhase.startsWith('Phase 2')
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
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
            <div className="bg-white border border-purple-200 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#7C3AED] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                      RANK #{selectedCluster36.clusterRank}
                    </span>
                    <span className="text-slate-500 text-xs uppercase font-semibold">
                      {selectedCluster36.region} Zone • {selectedCluster36.stateName}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase font-bold">
                      {selectedCluster36.rolloutPhase}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 mt-1 uppercase flex items-center gap-2">
                    <Building className="w-5 h-5 text-[#7C3AED]" />
                    {selectedCluster36.clusterName} ({selectedCluster36.targetHubCity} Hub)
                  </h4>
                  <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                    Dominant Demand: {selectedCluster36.dominantSector}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">Unserved Deficit Volume</span>
                    <span className="text-lg font-extrabold text-[#7C3AED]">
                      {selectedCluster36.unservedDeficitKL.toLocaleString()} KL/YR
                    </span>
                    <span className="text-xs text-emerald-700 block font-bold">
                      ₹{selectedCluster36.unmetMarketValueCr.toLocaleString()} Cr Potential
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Depot Sizing &amp; Stocking</span>
                  <div className="mt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Storage Capacity:</span>
                      <span className="font-bold text-indigo-700">{selectedCluster36.recommendedDepotSizeKL.toLocaleString()} KL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Safety Buffer:</span>
                      <span className="font-bold text-amber-700">{selectedCluster36.recommendedSafetyStockKL.toLocaleString()} KL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Demand Deficit Rate:</span>
                      <span className="font-bold text-[#7C3AED]">{selectedCluster36.deficitCoveragePct}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Financials &amp; Savings</span>
                  <div className="mt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Setup Capex:</span>
                      <span className="font-bold text-amber-700">₹{selectedCluster36.estimatedCapexCr.toFixed(2)} Cr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Freight Savings:</span>
                      <span className="font-bold text-emerald-700">₹{selectedCluster36.annualFreightSavingsCr.toFixed(2)} Cr/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Year-1 Target Vol:</span>
                      <span className="font-bold text-purple-700">{selectedCluster36.targetAnnualCaptureVolKL.toLocaleString()} KL</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Anchor Industry Clients</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedCluster36.keyAnchorIndustries.map((ind, i) => (
                      <span key={i} className="text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Serviced Ring Districts</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {selectedCluster36.servicedDistricts.map((dist, i) => (
                        <span key={i} className="text-[10px] bg-purple-50 text-[#7C3AED] px-2 py-0.5 rounded-md border border-purple-200 font-medium">
                          {dist}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm border-l-4 border-l-indigo-600">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Tracked Distributors</span>
          <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
            {totalTrackedDistributors} Hubs
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
            Across {uniqueStates.length} industrial states
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm border-l-4 border-l-emerald-600">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Incumbent Annual Volume</span>
          <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">
            {formatKL(totalIncumbentVolumeKL)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
            Avg Throughput: {Math.round(totalIncumbentVolumeKL / totalTrackedDistributors).toLocaleString()} KL/Hub
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm border-l-4 border-l-amber-500">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Aggregated Storage Capacity</span>
          <span className="text-xl font-extrabold text-amber-700 mt-0.5 block">
            {totalStorageCapacityKL.toLocaleString()} KL
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
            Turnover: {(totalIncumbentVolumeKL / totalStorageCapacityKL).toFixed(1)}x /year
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm border-l-4 border-l-[#7C3AED]">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Tied Retail &amp; Garages</span>
          <span className="text-xl font-extrabold text-[#7C3AED] mt-0.5 block">
            {totalDealersTied.toLocaleString()} Outlets
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
            Avg Servicing Radius: 45.8 km
          </span>
        </div>
      </div>

      {/* VIEW 1: CURRENT DISTRIBUTOR DIRECTORY & FILTERING */}
      {activeView === 'distributors' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search agency, brand, city, district or SKU..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Brand Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-xs uppercase font-medium">Brand:</span>
                <select
                  value={brandFilter}
                  onChange={e => setBrandFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-500 font-medium"
                >
                  <option value="all">ALL BRANDS ({uniqueBrands.length})</option>
                  {uniqueBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* State Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-xs uppercase font-medium">State:</span>
                <select
                  value={stateFilter}
                  onChange={e => setStateFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-500 font-medium"
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl transition-colors text-xs font-bold uppercase shadow-2xs"
                title="Download White-Spot & Distributor Validation Excel (.CSV)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>EXCEL EXPORT (.CSV)</span>
              </button>

              <button
                onClick={handleExportDistributorData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl transition-colors text-xs font-bold uppercase"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Distributor Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-[#7C3AED]" />
                Current Lubricant Distributors &amp; Stockists ({filteredDistributors.length} Locations)
              </h3>
              <span className="text-[10px] text-slate-400 uppercase font-medium">
                Geospatial coordinates &amp; capacity audited
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase font-semibold bg-slate-50/50">
                    <th className="py-2.5 pl-3">DISTRIBUTOR &amp; LOCATION</th>
                    <th className="py-2.5">BRAND / PARENT</th>
                    <th className="py-2.5">CHANNEL TYPE</th>
                    <th className="py-2.5 text-right">ANNUAL VOLUME</th>
                    <th className="py-2.5 text-right">STORAGE CAP</th>
                    <th className="py-2.5 text-right">RETAILERS TIED</th>
                    <th className="py-2.5 text-right">COVERAGE RADIUS</th>
                    <th className="py-2.5 text-center">PERFORMANCE</th>
                    <th className="py-2.5 text-right pr-3">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDistributors.map((dist) => {
                    const brandColor = BRAND_COLORS[dist.brand] || '#7C3AED';
                    return (
                      <tr key={dist.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pl-3">
                          <span className="font-bold text-slate-900 block">{dist.name}</span>
                          <span className="text-[10px] text-slate-500 block">{dist.city}, {dist.district} ({dist.stateName})</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs">{dist.address}</span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold inline-block border" style={{
                            color: brandColor,
                            borderColor: `${brandColor}40`,
                            backgroundColor: `${brandColor}15`
                          }}>
                            {dist.brand}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{dist.parentCompany}</span>
                        </td>
                        <td className="py-3">
                          <span className="text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                            {dist.distributorType}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{dist.primarySector}</span>
                        </td>
                        <td className="py-3 text-right font-bold text-[#7C3AED]">
                          {formatKL(dist.annualVolumeKL)}
                          <span className="text-[10px] text-slate-400 block font-normal">{dist.monthlyThroughputKL} KL/mo</span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-800">
                          {dist.warehouseCapacityKL} KL
                          <span className="text-[10px] text-amber-600 block font-medium">
                            {((dist.annualVolumeKL / (dist.warehouseCapacityKL * 12)) * 100).toFixed(0)}% util
                          </span>
                        </td>
                        <td className="py-3 text-right text-emerald-700 font-bold">
                          {dist.dealerNetworkCount}
                          <span className="text-[10px] text-slate-400 block font-normal">+{dist.industrialAccountsCount} B2B</span>
                        </td>
                        <td className="py-3 text-right text-slate-700">
                          {dist.coverageRadiusKm} km
                          <span className="text-[10px] text-slate-400 block font-normal">{dist.avgLeadTimeDays}d lead</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            dist.performanceTier === 'Dominant Leader'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : dist.performanceTier === 'Capacity Constrained'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : dist.performanceTier === 'High Performer'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {dist.performanceTier}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">{dist.marketShareInDistrictPct}% share</span>
                        </td>
                        <td className="py-3 text-right pr-3">
                          <button
                            onClick={() => {
                              setSelectedDistributorId(dist.id);
                              if (dist.targetWhiteSpotId) {
                                setSelectedWhiteSpotId(dist.targetWhiteSpotId);
                              }
                              setActiveView('comparison');
                            }}
                            className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 text-[10px] font-bold transition-all inline-flex items-center gap-1 uppercase shadow-2xs"
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
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Dynamic Multi-Criteria Weight Calibration
                </h3>
              </div>
              <button
                onClick={handleResetWeights}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#7C3AED] transition-colors font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET BENCHMARKS</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-slate-500 font-medium">DEMAND POTENTIAL:</span>
                  <span className="font-bold text-[#7C3AED]">{scoringWeights.demandPotential}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={scoringWeights.demandPotential}
                  onChange={e => handleWeightChange('demandPotential', Number(e.target.value))}
                  className="w-full accent-purple-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-slate-500 font-medium">SUPPLY GAP WEIGHT:</span>
                  <span className="font-bold text-rose-600">{scoringWeights.supplyGap}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={scoringWeights.supplyGap}
                  onChange={e => handleWeightChange('supplyGap', Number(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-slate-500 font-medium">COMPETITOR DEFICIT:</span>
                  <span className="font-bold text-amber-600">{scoringWeights.competitorGap}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={scoringWeights.competitorGap}
                  onChange={e => handleWeightChange('competitorGap', Number(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-slate-500 font-medium">ACCESSIBILITY DISTANCE:</span>
                  <span className="font-bold text-indigo-600">{scoringWeights.accessibilityGap}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={scoringWeights.accessibilityGap}
                  onChange={e => handleWeightChange('accessibilityGap', Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Archetype Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-xs">
            {whiteSpotTypes.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all uppercase ${
                  selectedTypeFilter === t.id
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Ranked Candidate White Spots Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#7C3AED]" />
                Ranked Distributor Opportunities ({filteredLocations.length} Matching Districts)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadWhiteSpotExcel(locations, 'Base')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl transition-colors text-[10px] font-bold uppercase shadow-2xs"
                  title="Download full candidate white spots excel dataset"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span>EXPORT EXCEL (.CSV)</span>
                </button>
                <span className="text-[10px] text-slate-400 uppercase font-medium">
                  Dynamic score applied
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase font-semibold bg-slate-50/50">
                    <th className="py-2.5 pl-3">RANK</th>
                    <th className="py-2.5">DISTRICT / STATE</th>
                    <th className="py-2.5">STRATEGIC ARCHETYPE</th>
                    <th className="py-2.5 text-right">TOTAL DEMAND</th>
                    <th className="py-2.5 text-right">SUPPLY GAP</th>
                    <th className="py-2.5 text-right">COVERAGE</th>
                    <th className="py-2.5 text-right">DYNAMIC SCORE</th>
                    <th className="py-2.5 text-right pr-3">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLocations.map((loc, idx) => {
                    const isCritical = loc.dynamicScore >= 80;
                    return (
                      <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pl-3 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-3">
                          <span className="font-bold text-slate-900 block">{loc.name}</span>
                          <span className="text-[10px] text-slate-400">{loc.stateName}</span>
                        </td>
                        <td className="py-3">
                          <span className="text-[10px] font-semibold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            {loc.whiteSpotType.split('—')[0]}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-800">
                          {formatKL(loc.totalEstimatedDemandKL)}
                        </td>
                        <td className="py-3 text-right font-bold text-rose-600">
                          {formatKL(loc.supplyGapKL)}
                        </td>
                        <td className="py-3 text-right text-amber-600 font-semibold">
                          {loc.supplyCoverageRatioPct}%
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCritical
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-purple-50 text-[#7C3AED] border border-purple-200'
                          }`}>
                            {loc.dynamicScore.toFixed(1)} / 100
                          </span>
                        </td>
                        <td className="py-3 text-right pr-3 flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedWhiteSpotId(loc.id);
                              setActiveView('comparison');
                            }}
                            className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 text-[10px] font-bold transition-all inline-flex items-center gap-1 uppercase shadow-2xs"
                            title="Compare with incumbent distributors"
                          >
                            <Scale className="w-3 h-3" />
                            <span>COMPARE</span>
                          </button>
                          <button
                            onClick={() => onSelectDistrict(loc)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-bold transition-all inline-flex items-center gap-1 uppercase"
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
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left: Choose White Spot District */}
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#7C3AED]" />
                Select Target White-Spot District:
              </label>
              <select
                value={selectedWhiteSpotId}
                onChange={e => setSelectedWhiteSpotId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-500"
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
              <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-indigo-600" />
                Select Incumbent Competitor Distributor:
              </label>
              <select
                value={selectedDistributorId}
                onChange={e => setSelectedDistributorId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-500"
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
            <div className="bg-white border-2 border-purple-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#7C3AED]" />
                    <span className="text-xs font-bold text-slate-900 uppercase">Proposed White-Spot Expansion</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#7C3AED] border border-purple-200">
                    SCORE: {compareWhiteSpot.whiteSpotScore}/100
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{compareWhiteSpot.name}</h3>
                <div className="text-xs text-slate-500 mb-3">{compareWhiteSpot.stateName} • {compareWhiteSpot.region} Zone</div>

                {/* Key Metric Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Total Regional Demand:</span>
                    <span className="text-base font-bold text-[#7C3AED]">{formatKL(compareWhiteSpot.totalEstimatedDemandKL)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Unmet Supply Gap:</span>
                    <span className="text-base font-bold text-rose-600">{formatKL(compareWhiteSpot.supplyGapKL)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Proposed Depot Capacity:</span>
                    <span className="text-sm font-bold text-slate-800">{compareWhiteSpot.recommendedStorageCapacityKL} KL</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Unmet Revenue Opportunity:</span>
                    <span className="text-sm font-bold text-emerald-700">₹{compareWhiteSpot.unmetOpportunityValueINR} Cr</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Current Local Supply Coverage:</span>
                    <strong className="text-amber-600">{compareWhiteSpot.supplyCoverageRatioPct}%</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Incumbents in District:</span>
                    <strong className="text-slate-900">{compareWhiteSpot.supply.masterDistributorsCount} Master Dist. ({compareWhiteSpot.supply.retailLubricantOutletsCount} Outlets)</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Recommended Facility:</span>
                    <strong className="text-indigo-700">{compareWhiteSpot.recommendedFacility}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Primary Demand Drivers:</span>
                    <strong className="text-[#7C3AED]">{compareWhiteSpot.keyIndustries.slice(0, 2).join(', ')}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectDistrict(compareWhiteSpot)}
                  className="px-3.5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 uppercase shadow-2xs"
                >
                  <span>Open Full District Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Incumbent Distributor Profile */}
            <div className="bg-white border-2 border-indigo-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase">Incumbent Distributor Benchmark</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                    {compareDistributor.brand}
                  </span>
                </div>

                <h3 className="text-base font-bold text-indigo-700">{compareDistributor.name}</h3>
                <div className="text-xs text-slate-500 mb-3">{compareDistributor.city}, {compareDistributor.district} ({compareDistributor.stateName})</div>

                {/* Key Metric Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Annual Throughput:</span>
                    <span className="text-base font-bold text-indigo-700">{formatKL(compareDistributor.annualVolumeKL)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Warehouse Capacity:</span>
                    <span className="text-base font-bold text-slate-800">{compareDistributor.warehouseCapacityKL} KL</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Tied Dealer Network:</span>
                    <span className="text-sm font-bold text-emerald-700">{compareDistributor.dealerNetworkCount} Outlets</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Delivery Radius &amp; Lead:</span>
                    <span className="text-sm font-bold text-amber-600">{compareDistributor.coverageRadiusKm} KM ({compareDistributor.avgLeadTimeDays}d)</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Parent OMC / Entity:</span>
                    <strong className="text-slate-900">{compareDistributor.parentCompany}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Channel Type:</span>
                    <strong className="text-indigo-700">{compareDistributor.distributorType}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Performance Status:</span>
                    <strong className="text-slate-900">{compareDistributor.performanceTier} ({compareDistributor.marketShareInDistrictPct}% Share)</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Top Selling SKUs:</span>
                    <strong className="text-slate-700 truncate max-w-xs">{compareDistributor.topSellingSKUs.slice(0, 2).join(', ')}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Contact: <strong className="text-slate-800">{compareDistributor.contactPerson}</strong></span>
                <span>Established: <strong className="text-slate-800">{compareDistributor.establishedYear}</strong></span>
              </div>
            </div>
          </div>

          {/* Strategic Head-to-Head Headroom Evaluation */}
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
            <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2 mb-3.5">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              Strategic Market Entry Headroom &amp; Competitor Gap Assessment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">Throughput Headroom</span>
                <div className="text-lg font-bold text-emerald-700 mt-1">
                  {compareWhiteSpot.supplyGapKL > compareDistributor.annualVolumeKL ? (
                    <span>+{(compareWhiteSpot.supplyGapKL - compareDistributor.annualVolumeKL).toLocaleString()} KL Overhang</span>
                  ) : (
                    <span>{(compareWhiteSpot.supplyGapKL / compareDistributor.annualVolumeKL * 100).toFixed(0)}% of Incumbent Vol</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Unmet demand in {compareWhiteSpot.name} represents {((compareWhiteSpot.supplyGapKL / compareDistributor.annualVolumeKL) * 100).toFixed(0)}% of {compareDistributor.name}&apos;s total yearly volume.
                </p>
              </div>

              <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">Service Lead Time Advantage</span>
                <div className="text-lg font-bold text-indigo-700 mt-1">
                  {compareDistributor.avgLeadTimeDays > 2.0 ? (
                    <span>Vulnerable Lead ({compareDistributor.avgLeadTimeDays} Days)</span>
                  ) : (
                    <span>Competitive Lead ({compareDistributor.avgLeadTimeDays} Days)</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  A local Tier-2 micro-depot in {compareWhiteSpot.name} can deliver same-day (0.5 day) lead time, cutting {compareDistributor.avgLeadTimeDays - 0.5} days off incumbent delivery.
                </p>
              </div>

              <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">Incumbent Capacity Stress</span>
                <div className="text-lg font-bold text-amber-700 mt-1">
                  {compareDistributor.performanceTier === 'Capacity Constrained' ? (
                    <span>High Constraint (Bottlenecked)</span>
                  ) : (
                    <span>{compareDistributor.performanceTier}</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Market Benchmark</span>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">5.70M KL</div>
              <span className="text-[10px] text-emerald-700 font-bold">₹91,200 Cr Value</span>
            </div>
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase block font-medium">PSU OMC Dominance</span>
              <div className="text-base font-extrabold text-rose-600 mt-0.5">46.5% Share</div>
              <span className="text-[10px] text-slate-500">2.65M KL (Servo/MAK/HP)</span>
            </div>
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase block font-medium">Global MNC Footprint</span>
              <div className="text-base font-extrabold text-emerald-700 mt-0.5">23.5% Share</div>
              <span className="text-[10px] text-slate-500">1.34M KL (Castrol/Shell)</span>
            </div>
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase block font-medium">Domestic &amp; Regional</span>
              <div className="text-base font-extrabold text-amber-700 mt-0.5">30.0% Share</div>
              <span className="text-[10px] text-slate-500">1.71M KL (Gulf/Veedol/JVs)</span>
            </div>
            <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-2xl shadow-sm col-span-2 md:col-span-1">
              <span className="text-[10px] text-[#7C3AED] uppercase block font-bold">Unmet Deficit Pool</span>
              <div className="text-base font-extrabold text-[#7C3AED] mt-0.5">1.51M KL (26.5%)</div>
              <span className="text-[10px] text-purple-700 font-bold">₹24,117 Cr Opportunity</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 1: Brand Market Share & Volume Breakdown */}
            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex flex-col">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 mb-3 gap-2">
                <div>
                  <span className="font-bold text-xs text-slate-900 uppercase flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
                    Incumbent Brand Market Share &amp; Throughput
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {brandViewMode === 'national' ? 'ALL-INDIA AUDITED BRAND ALLOCATIONS (5.70M KL TOTAL)' : 'TRACKED CHANNEL DISTRIBUTOR FOOTPRINT'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Scope Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 border border-slate-200 rounded-xl text-xs">
                    <button
                      onClick={() => setBrandViewMode('national')}
                      className={`px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors rounded-lg ${
                        brandViewMode === 'national'
                          ? 'bg-white text-[#7C3AED] shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      5.7M Macro
                    </button>
                    <button
                      onClick={() => setBrandViewMode('tracked')}
                      className={`px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors rounded-lg ${
                        brandViewMode === 'tracked'
                          ? 'bg-white text-[#7C3AED] shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Nodes
                    </button>
                  </div>

                  {/* Chart Style Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 border border-slate-200 rounded-xl text-xs">
                    <button
                      onClick={() => setBrandChartType('bar')}
                      className={`px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors rounded-lg ${
                        brandChartType === 'bar'
                          ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bar
                    </button>
                    <button
                      onClick={() => setBrandChartType('donut')}
                      className={`px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors rounded-lg ${
                        brandChartType === 'donut'
                          ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Donut (%)
                    </button>
                  </div>
                </div>
              </div>

              {brandChartType === 'bar' ? (
                <div className="h-72 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={brandShareChartData} margin={{ top: 20, right: 15, left: 10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="brand" 
                        stroke="#94a3b8" 
                        angle={-30} 
                        textAnchor="end" 
                        height={50} 
                        interval={0}
                        tick={{ fontSize: 10, fill: '#334155', fontWeight: 500 }} 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(2)}M KL` : `${(v/1000).toFixed(0)}k KL`} 
                        tick={{ fontSize: 10, fill: '#64748b' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                        formatter={(val: any, name: any, item: any) => [
                          `${Number(val).toLocaleString()} KL/YR (${item.payload.sharePct?.toFixed(1)}% Share • ₹${(item.payload.revenueINR || 0).toLocaleString()} Cr)`,
                          'Supply Volume'
                        ]}
                        labelFormatter={(label) => `Brand: ${label}`}
                      />
                      <Bar dataKey="volumeKL" radius={[4, 4, 0, 0]}>
                        <LabelList 
                          dataKey="sharePct" 
                          position="top" 
                          formatter={(val: any) => `${Number(val).toFixed(1)}%`} 
                          style={{ fill: '#334155', fontSize: 9, fontWeight: 700 }} 
                        />
                        {brandShareChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <Pie
                        data={brandShareChartData}
                        dataKey="sharePct"
                        nameKey="brand"
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {brandShareChartData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                        formatter={(val: any, name: any, item: any) => [
                          `${Number(val).toFixed(1)}% (${Number(item.payload.volumeKL).toLocaleString()} KL/YR)`,
                          name
                        ]}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        formatter={(val, entry: any) => (
                          <span className="text-slate-700 font-medium text-[10px]">
                            {val} <span className="text-slate-400">({entry.payload.sharePct?.toFixed(1)}%)</span>
                          </span>
                        )}
                        wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chart 2: State-wise Market Volume & Supply Capture */}
            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex flex-col">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 mb-3 gap-2">
                <div>
                  <span className="font-bold text-xs text-slate-900 uppercase flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-600" />
                    State-wise Market Distribution &amp; Demand
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {stateViewMode === 'allIndia' ? 'TOP 10 STATES CONSUMPTION (ALL-INDIA BENCHMARK)' : 'VOLUME TRACKED ACROSS CHANNEL DISTRIBUTORS'}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 border border-slate-200 rounded-xl">
                  <button
                    onClick={() => setStateViewMode('allIndia')}
                    className={`px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors rounded-lg ${
                      stateViewMode === 'allIndia'
                        ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Top States (5.7M)
                  </button>
                  <button
                    onClick={() => setStateViewMode('channel')}
                    className={`px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors rounded-lg ${
                      stateViewMode === 'channel'
                        ? 'bg-white text-[#7C3AED] shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Channel Nodes
                  </button>
                </div>
              </div>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateDistributionData} margin={{ top: 20, right: 15, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="state" 
                      stroke="#94a3b8" 
                      angle={-30} 
                      textAnchor="end" 
                      height={50} 
                      interval={0}
                      tick={{ fontSize: 10, fill: '#334155', fontWeight: 500 }} 
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      tickFormatter={(v) => `${(v/1000).toFixed(0)}k KL`} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                      formatter={(val: any, name: any, item: any) => [
                        `${Number(val).toLocaleString()} KL/YR (${item.payload.sharePct?.toFixed(1)}% Share • Gap: ${Number(item.payload.gapKL || 0).toLocaleString()} KL)`,
                        stateViewMode === 'allIndia' ? 'Total State Demand' : 'Tracked Channel Volume'
                      ]}
                      labelFormatter={(label, items: any) => items?.[0]?.payload?.fullName || label}
                    />
                    <Bar dataKey="volumeKL" radius={[4, 4, 0, 0]}>
                      <LabelList 
                        dataKey="volumeKL" 
                        position="top" 
                        formatter={(val: any) => `${(Number(val)/1000).toFixed(0)}k`} 
                        style={{ fill: '#334155', fontSize: 9, fontWeight: 700 }} 
                      />
                      {stateDistributionData.map((entry, index) => (
                        <Cell key={`state-cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#06b6d4' : index === 2 ? '#3b82f6' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Corporate Category & Channel Structure */}
            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div>
                  <span className="font-bold text-xs text-slate-900 uppercase flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-[#7C3AED]" />
                    Corporate Sector Market Share (5.70M KL)
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Public sector OMCs vs. Global MNCs vs. Domestic listed
                  </p>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">₹91,200 Cr Total</span>
              </div>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={corporateSegmentData} layout="vertical" margin={{ top: 10, right: 80, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M KL`} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="shortName" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} width={95} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                      formatter={(val: any, name: any, item: any) => [
                        `${(Number(val)/1000000).toFixed(2)}M KL (${item.payload.sharePct}% • ₹${item.payload.revenueINR.toLocaleString()} Cr) — ${item.payload.description}`,
                        'Sector Volume'
                      ]}
                      labelFormatter={(label, items: any) => items?.[0]?.payload?.name || label}
                    />
                    <Bar dataKey="volumeKL" radius={[0, 4, 4, 0]}>
                      <LabelList 
                        dataKey="volumeKL" 
                        position="right" 
                        formatter={(val: any) => `${(Number(val)/1000000).toFixed(2)}M KL`} 
                        style={{ fill: '#334155', fontSize: 9, fontWeight: 700 }} 
                      />
                      {corporateSegmentData.map((entry, index) => (
                        <Cell key={`corp-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Unmet White-Spot Demand vs Incumbent Distributor Volume */}
            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div>
                  <span className="font-bold text-xs text-slate-900 uppercase flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    White-Spot Deficit vs. Incumbent Distribution Volume
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Unmet supply gap vs. current logistics coverage (Top 8 Hubs)
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 uppercase font-medium">High Contest Hubs</span>
              </div>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtVersusData} margin={{ top: 15, right: 15, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      tick={{ fontSize: 10, fill: '#334155', fontWeight: 500 }} 
                      angle={-30} 
                      textAnchor="end" 
                      height={50} 
                      interval={0}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      tickFormatter={(v) => `${(v/1000).toFixed(0)}k KL`} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                      formatter={(val: any, name: any, item: any) => [
                        `${Number(val).toLocaleString()} KL (${item.payload.gapPct}% Deficit Rate)`,
                        name === 'unmetGapKL' ? 'Unserved Market Gap' : 'Incumbent Tracked Volume'
                      ]}
                      labelFormatter={(label, items: any) => items?.[0]?.payload?.fullName || label}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} 
                      formatter={(val) => <span className="text-slate-700 font-medium">{val}</span>}
                    />
                    <Bar name="Unmet Market Gap (KL)" dataKey="unmetGapKL" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar name="Incumbent Volume (KL)" dataKey="incumbentVolumeKL" fill="#7c3aed" radius={[4, 4, 0, 0]} />
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
