import React, { useState, useMemo } from 'react';
import { 
  Fuel, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck,
  Factory, 
  Car, 
  Wheat, 
  Truck, 
  Sparkles, 
  ArrowUpRight, 
  ChevronRight, 
  CheckCircle2,
  MapPin,
  Flame,
  Building2,
  Activity,
  Layers,
  BarChart3,
  Globe2,
  PieChart as PieChartIcon,
  BadgeCheck,
  Zap,
  Info,
  Search
} from 'lucide-react';
import { LocationRecord, WarehouseOptimizationNode, GridResolution, ScoringWeights, DistributorRecord } from '../../types';
import { CURRENT_DISTRIBUTORS } from '../../data/indiaGeoData';
import { ALL_INDIA_ZONES_DATA, ALL_INDIA_MACRO_SUMMARY, ALL_INDIA_STATES_DATA, StateMacroData } from '../../data/allIndiaStateData';
import { IndiaGisMap } from '../IndiaGisMap';
import { formatKL, formatINR } from '../../utils/demandEngine';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LabelList
} from 'recharts';

interface IndiaOverviewDashboardProps {
  locations: LocationRecord[];
  warehouseNodes: WarehouseOptimizationNode[];
  distributors?: DistributorRecord[];
  selectedLocation: LocationRecord | null;
  onSelectLocation: (loc: LocationRecord) => void;
  gridResolution: GridResolution;
  onResolutionChange: (res: GridResolution) => void;
  scoringWeights: ScoringWeights;
  onWeightsChange: (weights: ScoringWeights) => void;
  onNavigateToDistrict: (loc: LocationRecord) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const IndiaOverviewDashboard: React.FC<IndiaOverviewDashboardProps> = ({
  locations,
  warehouseNodes,
  distributors = CURRENT_DISTRIBUTORS,
  selectedLocation,
  onSelectLocation,
  gridResolution,
  onResolutionChange,
  scoringWeights,
  onWeightsChange,
  onNavigateToDistrict,
  onNavigateToTab
}) => {
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [stateSearchTerm, setStateSearchTerm] = useState<string>('');

  // All-India Macro Aggregations (5.70M KL)
  const nationalTotalDemandKL = ALL_INDIA_MACRO_SUMMARY.totalNationalDemandKL; // 5,700,000 KL
  const nationalAccessibleSupplyKL = ALL_INDIA_MACRO_SUMMARY.totalAccessibleSupplyKL; // 4,192,665 KL
  const nationalSupplyGapKL = ALL_INDIA_MACRO_SUMMARY.totalNationalSupplyGapKL; // 1,507,335 KL
  const nationalValueINR = ALL_INDIA_MACRO_SUMMARY.totalNationalValueINR; // 91,200 Cr
  const nationalUnmetOpportunityINR = nationalSupplyGapKL * 0.016; // ₹24,117.4 Cr
  const nationalCoverageRatio = parseFloat(((nationalAccessibleSupplyKL / nationalTotalDemandKL) * 100).toFixed(1));

  // Sectoral Data (All-India Macro Level)
  const nationalSectorData = [
    { sector: 'Automotive (PCMO, 2W, Fleets, HDEO)', volumeKL: 3420000, pct: 60.0, fill: '#3b82f6' },
    { sector: 'Industrial (Hydraulics, Gears, Turbines, Metalworking)', volumeKL: 1995000, pct: 35.0, fill: '#F27D26' },
    { sector: 'Agri, Marine & Specialty Fluids (UTTO, Transformer Oils)', volumeKL: 285000, pct: 5.0, fill: '#10B981' }
  ];

  // Filtered All-India States
  const filteredStates = useMemo(() => {
    return ALL_INDIA_STATES_DATA.filter(st => {
      const matchesZone = selectedZoneFilter === 'all' || st.region === selectedZoneFilter;
      const q = stateSearchTerm.toLowerCase();
      const matchesSearch = 
        st.stateName.toLowerCase().includes(q) ||
        st.stateCode.toLowerCase().includes(q) ||
        st.region.toLowerCase().includes(q) ||
        st.keyIndustries.some(ind => ind.toLowerCase().includes(q)) ||
        st.topDistricts.some(d => d.districtName.toLowerCase().includes(q));
      return matchesZone && matchesSearch;
    }).sort((a, b) => b.totalDemandKL - a.totalDemandKL);
  }, [selectedZoneFilter, stateSearchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Overall India Macro Scope & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              India Lubricants Intelligence
            </h1>
            <span className="tag-purple text-[10px] font-bold uppercase tracking-wider">
              5.70M KL Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Nationwide Demand Model • 5.70M KL Capacity • 780 Districts • VAHAN 4.0 &amp; PPAC Grounded
          </p>
        </div>

        {/* Quick Action to State Matrix & Competitor Dashboard */}
        <div className="flex items-center gap-2.5">
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('state')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Globe2 className="w-4 h-4 text-[#7C3AED]" />
              <span>36 States Matrix</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('brandValidation')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white text-xs font-bold hover:shadow-md hover:shadow-purple-500/20 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-purple-200" />
              <span>50 Competitors</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row (Matching Variation 18) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Demand */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Annual Demand</span>
            <div className="p-2 rounded-xl bg-purple-50 text-[#7C3AED]">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              5.70 M <span className="text-base text-slate-500 font-normal">KL</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+4.2% YoY Growth Trend</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Auto: <strong>60% (3.42M)</strong></span>
            <span>Ind: <strong>35% (1.99M)</strong></span>
          </div>
        </div>

        {/* Card 2: Market Valuation */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Market Valuation</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              ₹91.2 K <span className="text-base text-slate-500 font-normal">Cr</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1">
              <span>Average ₹160/L realization</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Leader Share: <strong>16.5% (Servo)</strong></span>
            <span className="text-purple-600 font-semibold">50+ Brands</span>
          </div>
        </div>

        {/* Card 3: Unmet Supply Gap */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unmet Supply Gap</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight font-sans">
              1.51 M <span className="text-base text-slate-500 font-normal">KL</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold mt-1">
              <span>26.5% Net National Deficit</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Coverage: <strong>{nationalCoverageRatio}%</strong></span>
            <span className="text-rose-600 font-semibold">₹24,160 Cr White-Spot</span>
          </div>
        </div>

        {/* Card 4: Geographic Reach */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Geographic Footprint</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Globe2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              36 <span className="text-base text-slate-500 font-normal">States / UTs</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Pan-India Audited</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Zones: <strong>6 Macro Regions</strong></span>
            <span>Districts: <strong>780+</strong></span>
          </div>
        </div>
      </div>

      {/* Strategic Insights Panel (Variation 18 Design Feature) */}
      <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-lg bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                Strategic Market Directive
              </span>
              <span className="text-purple-200 text-xs font-medium">Q3 Commercial Assessment</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Primary White-Spot Opportunities: Western &amp; Southern Industrial Belts
            </h2>
            <p className="text-xs sm:text-sm text-purple-100 mt-1 leading-relaxed">
              Maharashtra (826k KL) and Gujarat (655k KL) account for 26% of national volume. Supply deficit exceeds 380,000 KL in Tier-2/3 logistics clusters (Pune-Chakan, Surat-Vapi, Hosur-Bengaluru).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
              <div className="text-[10px] text-purple-200 font-bold uppercase">West Share</div>
              <div className="text-base font-extrabold text-white mt-0.5">30.8%</div>
              <div className="text-[10px] text-purple-200">1.75M KL / yr</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
              <div className="text-[10px] text-purple-200 font-bold uppercase">South Share</div>
              <div className="text-base font-extrabold text-white mt-0.5">27.5%</div>
              <div className="text-[10px] text-purple-200">1.57M KL / yr</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
              <div className="text-[10px] text-purple-200 font-bold uppercase">North Share</div>
              <div className="text-base font-extrabold text-white mt-0.5">23.6%</div>
              <div className="text-[10px] text-purple-200">1.35M KL / yr</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
              <div className="text-[10px] text-purple-200 font-bold uppercase">East + NE</div>
              <div className="text-base font-extrabold text-white mt-0.5">18.1%</div>
              <div className="text-[10px] text-purple-200">1.03M KL / yr</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Macro Zones Quick Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              6 Macro Zones Consumption &amp; Deficit
            </h3>
            <span className="text-[11px] text-slate-400">Click to filter state matrix</span>
          </div>
          {selectedZoneFilter !== 'all' && (
            <button
              onClick={() => setSelectedZoneFilter('all')}
              className="text-xs font-bold text-[#7C3AED] hover:underline"
            >
              Reset Filter ({selectedZoneFilter})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ALL_INDIA_ZONES_DATA.map((z) => {
            const isSelected = selectedZoneFilter === z.zoneName;
            return (
              <div 
                key={z.zoneName} 
                onClick={() => setSelectedZoneFilter(isSelected ? 'all' : z.zoneName)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-purple-50/80 border-[#7C3AED] shadow-sm'
                    : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>{z.zoneName}</span>
                    <span className="text-[#7C3AED] text-[11px] font-extrabold">{z.shareOfNationalPct}%</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 mt-1">
                    {(z.totalDemandKL / 1000).toFixed(0)}k <span className="text-[10px] text-slate-400 font-normal">KL</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    ₹{z.totalValueINR.toLocaleString()} Cr
                  </div>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-500">
                  <span>Gap: <strong className="text-rose-600">{(z.supplyGapKL / 1000).toFixed(0)}k KL</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Interactive GIS Map & All-India States Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left GIS Map View (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <span className="text-xs text-slate-800 uppercase font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#7C3AED]" />
              Spatial GIS View: All-India Demand Mesh
            </span>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <span className="text-[10px] uppercase text-slate-600 font-semibold">Critical Gap</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-[10px] uppercase text-slate-600 font-semibold">High Demand</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-[10px] uppercase text-slate-600 font-semibold">Moderate</span>
              </div>
            </div>
          </div>

          <IndiaGisMap
            locations={locations}
            warehouseNodes={warehouseNodes}
            distributors={distributors}
            selectedLocation={selectedLocation}
            onSelectLocation={onSelectLocation}
            gridResolution={gridResolution}
            onResolutionChange={onResolutionChange}
          />
        </div>

        {/* Right All-India States Ranking & Sectoral Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* All-India States Demand & Gap Ranking Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h3 className="font-bold text-xs text-slate-900 uppercase flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#7C3AED]" />
                  State Demand Matrix ({filteredStates.length} States)
                </h3>
                <p className="text-[11px] text-slate-500">Ranked by annual lubricant consumption</p>
              </div>
              <span className="tag-purple text-[10px] font-bold">
                36 States
              </span>
            </div>

            {/* Quick Search and Filter Bar */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter states or industries..."
                  value={stateSearchTerm}
                  onChange={(e) => setStateSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>

              {selectedZoneFilter !== 'all' && (
                <button
                  onClick={() => setSelectedZoneFilter('all')}
                  className="px-2.5 py-1.5 text-[10px] bg-slate-100 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-200 font-bold"
                >
                  Clear ({selectedZoneFilter})
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {filteredStates.map((st, idx) => {
                const borderAccent = st.whiteSpotScore >= 80 
                  ? 'border-rose-500' 
                  : st.whiteSpotScore >= 65 
                    ? 'border-amber-500' 
                    : 'border-blue-500';
                
                const scoreColor = st.whiteSpotScore >= 80 
                  ? 'text-rose-600' 
                  : st.whiteSpotScore >= 65 
                    ? 'text-amber-600' 
                    : 'text-blue-600';

                const matchingLocation = locations.find(l => l.stateCode === st.stateCode) || locations[0];
                const isSelected = selectedLocation?.stateCode === st.stateCode;

                return (
                  <div
                    key={st.stateCode}
                    onClick={() => {
                      if (matchingLocation) onSelectLocation(matchingLocation);
                    }}
                    className={`p-3 rounded-xl border-l-4 ${borderAccent} text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50/70 border-t border-r border-b border-purple-200 text-slate-900 shadow-sm'
                        : 'bg-slate-50/60 border-t border-r border-b border-slate-200/80 text-slate-700 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">#{idx + 1}</span>
                        <span className="font-bold text-slate-900 text-xs">{st.stateName}</span>
                        <span className="text-[10px] font-bold text-[#7C3AED]">({st.nationalSharePct}%)</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-semibold">
                          {st.region}
                        </span>
                      </div>
                      <span className={`font-bold ${scoreColor} text-[10px]`}>
                        SCORE: {st.whiteSpotScore}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 mt-1.5">
                      <div>
                        <span>Demand:</span> <strong className="text-slate-800">{st.totalDemandKL.toLocaleString()} KL</strong>
                      </div>
                      <div>
                        <span>Gap:</span> <strong className="text-rose-600">{st.supplyGapKL.toLocaleString()} KL</strong>
                      </div>
                      <div>
                        <span>Value:</span> <strong className="text-emerald-700">₹{st.marketValueINR.toLocaleString()} Cr</strong>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/70">
                      <span className="truncate max-w-[200px]">
                        Hubs: {st.topDistricts.slice(0, 2).map(d => d.districtName.split(' ')[0]).join(', ')}
                      </span>
                      {onNavigateToTab && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToTab('state');
                          }}
                          className="text-[#7C3AED] hover:text-[#5B21B6] text-[10px] flex items-center gap-0.5 font-bold shrink-0"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All-India Sectoral & Zonal Demand Opportunity Chart */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
                Sector Breakdown (5.70M KL)
              </h3>
              <span className="text-[11px] text-emerald-700 font-bold">₹91,200 Cr Value</span>
            </div>

            {/* Recharts Mini Sector Bar Chart */}
            <div className="h-36 w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nationalSectorData} layout="vertical" margin={{ top: 10, right: 60, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M KL`} tick={{ fontSize: 9, fill: '#64748B' }} />
                  <YAxis type="category" dataKey="sector" hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '11px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} KL (${((Number(val)/5700000)*100).toFixed(1)}%)`, 'Demand']}
                  />
                  <Bar dataKey="volumeKL" radius={[0, 6, 6, 0]}>
                    <LabelList 
                      dataKey="volumeKL" 
                      position="right" 
                      formatter={(val: any) => `${(Number(val)/1000000).toFixed(2)}M KL`} 
                      style={{ fill: '#334155', fontSize: 10, fontWeight: 700 }} 
                    />
                    {nationalSectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sector Details Strip */}
            <div className="space-y-1.5 text-xs">
              {nationalSectorData.map((sec, idx) => (
                <div key={idx} className="bg-slate-50 p-2 border border-slate-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sec.fill }} />
                    <div>
                      <span className="text-slate-800 font-bold text-xs block">{sec.sector}</span>
                      <span className="text-[10px] text-slate-500">{sec.pct.toFixed(1)}% of national consumption</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className="text-slate-900 text-xs">{(sec.volumeKL / 1000000).toFixed(2)}M KL</strong>
                    <div className="text-[10px] text-emerald-700 font-bold">₹{(sec.volumeKL * 0.016).toLocaleString()} Cr</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
