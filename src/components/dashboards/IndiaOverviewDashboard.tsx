import React, { useState, useMemo } from 'react';
import { 
  Fuel, 
  TrendingUp, 
  ShieldAlert, 
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
  CartesianGrid
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
    <div className="space-y-4">
      {/* Top Banner: Overall India Macro Scope */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 rounded shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#F27D26]/10 border border-[#F27D26]/30 flex items-center justify-center text-[#F27D26] shrink-0">
            <Globe2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold uppercase text-sm">OVERALL INDIA LUBRICANTS INTELLIGENCE:</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold uppercase">
                100% NATIONWIDE COVERAGE (5.70M KL / ₹91,200 CR)
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Comprehensive market model synthesized across all 36 States &amp; Union Territories, 6 Macro Zones, and 780+ consuming districts.
            </p>
          </div>
        </div>

        {/* Quick Action to State Matrix */}
        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('state')}
            className="px-3 py-1.5 rounded bg-[#1F2937] hover:bg-[#374151] text-[#F27D26] border border-[#374151] font-bold transition-all uppercase text-[11px] flex items-center gap-1.5 shadow"
          >
            <span>View All 36 States Matrix</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Top Telemetry KPI Metric Cards (Overall India Level) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* Card 1: Total Demand */}
        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-col justify-between shadow-md border-t-2 border-t-[#F27D26]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase font-bold">ALL-INDIA ANNUAL DEMAND</span>
            <div className="p-1 rounded bg-[#1F2937] text-[#F27D26]">
              <Fuel className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#F27D26] tracking-tight">
              5.70 Million KL
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
              <span>5,700,000 KL / YR (₹91,200 CR MARKET)</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#1F2937] flex items-center justify-between text-[10px] text-gray-400">
            <span>AUTO: 60% (3.42M KL)</span>
            <span>IND: 35% (1.99M KL)</span>
          </div>
        </div>

        {/* Card 2: Supply Deficit Gap */}
        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-col justify-between shadow-md border-t-2 border-t-red-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase font-bold">NATIONAL SUPPLY DEFICIT GAP</span>
            <div className="p-1 rounded bg-[#1F2937] text-red-500">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-red-400 tracking-tight">
              1.51 Million KL
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
              <span>SUPPLY COVERAGE: <strong className="text-white">{nationalCoverageRatio}%</strong> (4.19M KL)</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#1F2937] flex items-center justify-between text-[10px] text-gray-400">
            <span>UNMET RATIO: 26.5%</span>
            <span className="text-red-400 font-bold">DEFICIT POOL</span>
          </div>
        </div>

        {/* Card 3: Geographic Coverage Range */}
        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-col justify-between shadow-md border-t-2 border-t-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase font-bold">GEOGRAPHIC REACH</span>
            <div className="p-1 rounded bg-[#1F2937] text-blue-400">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white tracking-tight">
              36 States &amp; UTs
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-blue-400 mt-0.5">
              <span>6 MACRO REGIONAL ZONES (780+ DIST.)</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#1F2937] flex items-center justify-between text-[10px] text-gray-400">
            <span>100% NATIONWIDE FOOTPRINT</span>
          </div>
        </div>

        {/* Card 4: Addressable Value Pool */}
        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-col justify-between shadow-md border-t-2 border-t-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase font-bold">TOTAL MARKET VALUATION</span>
            <div className="p-1 rounded bg-[#1F2937] text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              ₹91,200 Crores
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
              <span>UNMET GAP VALUE: <strong className="text-emerald-300">₹24,117 CR</strong></span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#1F2937] flex items-center justify-between text-[10px] text-gray-400">
            <span>AVG REALIZATION: ~₹160/L</span>
            <span>MARGIN: ~28.5%</span>
          </div>
        </div>
      </div>

      {/* 6 Macro Zones Distribution Banner */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl font-mono">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#F27D26]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">
              All-India 6 Macro Zones Demand Spread (5.70 Million KL Total)
            </h3>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('state')}
              className="text-[10px] text-[#F27D26] hover:underline flex items-center gap-1 uppercase font-bold"
            >
              <span>Full 36 State Breakdown</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ALL_INDIA_ZONES_DATA.map((z) => (
            <div 
              key={z.zoneName} 
              onClick={() => setSelectedZoneFilter(selectedZoneFilter === z.zoneName ? 'all' : z.zoneName)}
              className={`p-2.5 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                selectedZoneFilter === z.zoneName
                  ? 'bg-[#1F2937] border-[#F27D26]'
                  : 'bg-[#05070B] border-[#1F2937] hover:border-[#374151]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{z.zoneName.toUpperCase()}</span>
                  <span className="text-[#F27D26] text-[11px]">{z.shareOfNationalPct}%</span>
                </div>
                <div className="text-base font-bold text-white mt-1">
                  {(z.totalDemandKL / 1000).toFixed(0)}k <span className="text-[10px] text-gray-400 font-normal">KL/yr</span>
                </div>
                <div className="text-[9.5px] text-emerald-400">
                  ₹{z.totalValueINR.toLocaleString()} Cr
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-[#1F2937] text-[9px] text-gray-400">
                <span>Gap: <strong className="text-red-400">{(z.supplyGapKL / 1000).toFixed(0)}k KL</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive GIS Map & All-India States Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left GIS Map View (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          <div className="h-10 bg-[#0E1117] border border-[#1F2937] flex items-center px-4 justify-between font-mono">
            <span className="text-[11px] text-[#F27D26] uppercase font-bold flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#F27D26]" />
              SPATIAL GIS VIEW: ALL-INDIA DEMAND &amp; WHITE-SPOT MESH
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[9px] uppercase text-gray-400">Critical Gap</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-[9px] uppercase text-gray-400">High Demand</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[9px] uppercase text-gray-400">Moderate</span>
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
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* All-India States Demand & Gap Ranking Table */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-col">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2.5 mb-2.5">
              <div>
                <h3 className="font-mono font-bold text-xs text-white uppercase flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#F27D26]" />
                  All-India State Demand Matrix ({filteredStates.length} States)
                </h3>
                <p className="text-[10px] font-mono text-gray-500">RANKED BY TOTAL ANNUAL CONSUMPTION (KL / YR)</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#F27D26] bg-[#1F2937] px-2 py-0.5 rounded border border-[#374151]">
                36 STATES AUDITED
              </span>
            </div>

            {/* Quick Search and Filter Bar */}
            <div className="flex items-center gap-2 mb-2.5 font-mono text-xs">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter states or industries..."
                  value={stateSearchTerm}
                  onChange={(e) => setStateSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-[#05070B] border border-[#1F2937] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#F27D26]"
                />
              </div>

              {selectedZoneFilter !== 'all' && (
                <button
                  onClick={() => setSelectedZoneFilter('all')}
                  className="px-2 py-1 text-[10px] bg-[#1F2937] text-gray-300 rounded border border-[#374151] hover:text-white"
                >
                  Clear Zone ({selectedZoneFilter})
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredStates.map((st, idx) => {
                const borderAccent = st.whiteSpotScore >= 80 
                  ? 'border-red-500' 
                  : st.whiteSpotScore >= 65 
                    ? 'border-yellow-500' 
                    : 'border-blue-500';
                
                const scoreColor = st.whiteSpotScore >= 80 
                  ? 'text-red-500' 
                  : st.whiteSpotScore >= 65 
                    ? 'text-yellow-500' 
                    : 'text-blue-500';

                // Find matching location if exists for district drilldown
                const matchingLocation = locations.find(l => l.stateCode === st.stateCode) || locations[0];

                return (
                  <div
                    key={st.stateCode}
                    onClick={() => {
                      if (matchingLocation) onSelectLocation(matchingLocation);
                    }}
                    className={`p-2.5 rounded-sm border-l-2 ${borderAccent} text-xs cursor-pointer transition-all ${
                      selectedLocation?.stateCode === st.stateCode
                        ? 'bg-[#1F2937] border-t border-r border-b border-[#F27D26]/40 text-white'
                        : 'bg-[#151921] border-t border-r border-b border-[#1F2937] text-gray-300 hover:bg-[#1F2937]/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-gray-500 font-bold">#{idx + 1}</span>
                        <span className="font-bold text-white text-xs">{st.stateName}</span>
                        <span className="text-[10px] font-mono text-[#F27D26] font-bold">({st.nationalSharePct}%)</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#0A0B0E] text-gray-400 border border-[#374151]">
                          {st.region}
                        </span>
                      </div>
                      <span className={`font-mono font-bold ${scoreColor} text-[10px]`}>
                        SCORE: {st.whiteSpotScore}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-gray-400 mt-1">
                      <div>
                        <span>DEMAND:</span> <strong className="text-gray-200">{st.totalDemandKL.toLocaleString()} KL</strong>
                      </div>
                      <div>
                        <span>GAP:</span> <strong className="text-red-400">{st.supplyGapKL.toLocaleString()} KL</strong>
                      </div>
                      <div>
                        <span>VALUE:</span> <strong className="text-emerald-400">₹{st.marketValueINR.toLocaleString()} Cr</strong>
                      </div>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400 pt-1.5 border-t border-[#1F2937]">
                      <span className="text-gray-400 font-mono truncate max-w-[200px]">
                        Hubs: {st.topDistricts.slice(0, 2).map(d => d.districtName.split(' ')[0]).join(', ')}
                      </span>
                      {onNavigateToTab && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToTab('state');
                          }}
                          className="text-gray-300 hover:text-[#F27D26] font-mono text-[10px] flex items-center gap-0.5 uppercase font-bold shrink-0"
                        >
                          <span>Inspect State</span>
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
          <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <h3 className="font-mono font-bold text-[11px] text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#F27D26]" />
                National Sector Demand Breakdown (5.70M KL Total)
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">₹91,200 CR VALUE</span>
            </div>

            {/* Recharts Mini Sector Bar Chart */}
            <div className="h-36 w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nationalSectorData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                  <XAxis type="number" stroke="#6B7280" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="sector" hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0E1117', borderColor: '#374151', fontSize: '11px', color: '#fff' }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} KL (${((Number(val)/5700000)*100).toFixed(1)}%)`, 'Demand']}
                  />
                  <Bar dataKey="volumeKL" radius={[0, 4, 4, 0]}>
                    {nationalSectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sector Details Strip */}
            <div className="space-y-1.5 font-mono text-xs">
              {nationalSectorData.map((sec, idx) => (
                <div key={idx} className="bg-[#151921] p-2 border border-[#1F2937] rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sec.fill }} />
                    <div>
                      <span className="text-gray-200 font-bold text-[11px] block">{sec.sector}</span>
                      <span className="text-[9.5px] text-gray-500">{sec.pct.toFixed(1)}% of national consumption</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className="text-white text-xs">{(sec.volumeKL / 1000000).toFixed(2)}M KL</strong>
                    <div className="text-[9px] text-emerald-400 font-bold">₹{(sec.volumeKL * 0.016).toLocaleString()} Cr</div>
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
