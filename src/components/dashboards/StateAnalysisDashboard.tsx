import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Flame, 
  Fuel, 
  Search, 
  ArrowUpDown, 
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Factory,
  Car,
  Truck,
  BarChart3,
  Globe2,
  MapPin,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  BadgeCheck,
  FileSpreadsheet,
  Download,
  Sliders,
  Target,
  Compass,
  Boxes,
  PackageCheck,
  Award,
  Wrench,
  Wheat,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Cpu
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { LocationRecord } from '../../types';
import { 
  ALL_INDIA_STATES_DATA, 
  ALL_INDIA_ZONES_DATA, 
  ALL_INDIA_MACRO_SUMMARY, 
  StateMacroData,
  getStateWhiteSpotVectors,
  getStateStrategicRoadmap,
  StateWhiteSpotVectors
} from '../../data/allIndiaStateData';
import { formatKL, formatINR } from '../../utils/demandEngine';
import { downloadWhiteSpotExcel } from '../../utils/excelExporter';

interface StateAnalysisDashboardProps {
  locations: LocationRecord[];
  onSelectDistrict: (loc: LocationRecord) => void;
}

type ViewMode = 'matrix' | 'vectors' | 'simulator' | 'roadmaps';

export const StateAnalysisDashboard: React.FC<StateAnalysisDashboardProps> = ({
  locations,
  onSelectDistrict
}) => {
  const [activeView, setActiveView] = useState<ViewMode>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'demand' | 'gap' | 'score' | 'share' | 'vehicles'>('demand');
  const [expandedStateCode, setExpandedStateCode] = useState<string | null>('MH');
  
  // Simulator state
  const [simStateCode, setSimStateCode] = useState<string>('MH');
  const [leverDepot, setLeverDepot] = useState<boolean>(true);
  const [leverStockists, setLeverStockists] = useState<boolean>(true);
  const [leverPails, setLeverPails] = useState<boolean>(true);
  const [leverGarage, setLeverGarage] = useState<boolean>(false);

  // Filtered and sorted all-India states
  const filteredStates = useMemo(() => {
    return ALL_INDIA_STATES_DATA.filter(st => {
      const matchesZone = selectedZone === 'all' || st.region === selectedZone;
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        st.stateName.toLowerCase().includes(q) ||
        st.stateCode.toLowerCase().includes(q) ||
        st.region.toLowerCase().includes(q) ||
        st.keyIndustries.some(ind => ind.toLowerCase().includes(q)) ||
        st.topDistricts.some(d => d.districtName.toLowerCase().includes(q));
      return matchesZone && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'demand') return b.totalDemandKL - a.totalDemandKL;
      if (sortBy === 'gap') return b.supplyGapKL - a.supplyGapKL;
      if (sortBy === 'score') return b.whiteSpotScore - a.whiteSpotScore;
      if (sortBy === 'share') return b.nationalSharePct - a.nationalSharePct;
      if (sortBy === 'vehicles') return b.registeredVehiclesCount - a.registeredVehiclesCount;
      return 0;
    });
  }, [selectedZone, searchTerm, sortBy]);

  // Aggregate totals of the currently displayed states
  const displayedDemandKL = filteredStates.reduce((acc, st) => acc + st.totalDemandKL, 0);
  const displayedSupplyGapKL = filteredStates.reduce((acc, st) => acc + st.supplyGapKL, 0);
  const displayedValueINR = filteredStates.reduce((acc, st) => acc + st.marketValueINR, 0);
  const displayedVehicles = filteredStates.reduce((acc, st) => acc + st.registeredVehiclesCount, 0);

  // Selected State for Simulator
  const simState = useMemo(() => {
    return ALL_INDIA_STATES_DATA.find(s => s.stateCode === simStateCode) || ALL_INDIA_STATES_DATA[0];
  }, [simStateCode]);

  const simRoadmap = useMemo(() => getStateStrategicRoadmap(simState), [simState]);
  const simVectors = useMemo(() => getStateWhiteSpotVectors(simState), [simState]);

  // Simulation calculations
  const simResults = useMemo(() => {
    let captureRate = 0;
    if (leverDepot) captureRate += 0.35; // Staging depot captures 35% of gap
    if (leverStockists) captureRate += 0.25; // Tier-2/3 stockists capture 25% of gap
    if (leverPails) captureRate += 0.20; // 20L/50L pails capture 20% of gap
    if (leverGarage) captureRate += 0.15; // Mechanic loyalty captures 15% of gap
    
    // Cap at 92% maximum addressable capture
    captureRate = Math.min(0.92, captureRate);

    const capturedKL = Math.round(simState.supplyGapKL * captureRate);
    const residualGapKL = simState.supplyGapKL - capturedKL;
    const grossRevenueINR = Math.round(capturedKL * 0.16 * 10) / 10; // at ₹160/L
    const ebitdaINR = Math.round(grossRevenueINR * 0.215 * 10) / 10; // 21.5% blended EBITDA
    const requiredCapexINR = Math.round((leverDepot ? 18 : 0) + (leverStockists ? 12 : 0) + (leverPails ? 6 : 0) + (leverGarage ? 4 : 0));
    const paybackMonths = grossRevenueINR > 0 ? Math.max(6, Math.round((requiredCapexINR / (ebitdaINR / 12)))) : 0;

    return {
      captureRate: Math.round(captureRate * 100),
      capturedKL,
      residualGapKL,
      grossRevenueINR,
      ebitdaINR,
      requiredCapexINR,
      paybackMonths
    };
  }, [simState, leverDepot, leverStockists, leverPails, leverGarage]);

  // Top 10 states for bar chart
  const topStatesChartData = useMemo(() => {
    return [...ALL_INDIA_STATES_DATA]
      .sort((a, b) => b.totalDemandKL - a.totalDemandKL)
      .slice(0, 10)
      .map(st => {
        const v = getStateWhiteSpotVectors(st);
        return {
          code: st.stateCode,
          name: st.stateName,
          totalDemand: st.totalDemandKL / 1000,
          accessibleSupply: st.accessibleSupplyKL / 1000,
          supplyGap: st.supplyGapKL / 1000,
          ruralGap: v.ruralAgriGapKL / 1000,
          msmeGap: v.msmeIndustrialPailGapKL / 1000,
          unorgGap: v.unorganizedLubeGapKL / 1000,
          logGap: v.highwayLogisticsGapKL / 1000
        };
      });
  }, []);

  const CustomStateTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const stateObj = ALL_INDIA_STATES_DATA.find(d => d.stateCode === label);
      return (
        <div className="bg-[#0E1117] border border-[#374151] p-3 rounded shadow-2xl font-mono text-xs text-gray-200 min-w-[210px] z-50">
          <div className="text-[11px] font-bold text-[#F27D26] border-b border-[#1F2937] pb-1 mb-2 uppercase">
            {stateObj?.stateName || label} ({stateObj?.nationalSharePct}% of India)
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`entry-${index}`} className="flex justify-between items-center text-[10px] gap-2 py-0.5">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <strong className="text-white">{(Number(entry.value) * 1000).toLocaleString()} KL</strong>
            </div>
          ))}
          <div className="mt-2 pt-1 border-t border-[#1F2937] text-[9px] text-gray-400">
            Market Value: <strong className="text-emerald-400">₹{stateObj?.marketValueINR.toLocaleString()} Cr</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Complete All-India 5.70M KL State & Regional Intelligence */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] pb-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-[#F27D26]" />
              <h2 className="text-base font-bold font-mono text-white uppercase tracking-tight">
                All-India 36 States &amp; UTs Enhanced White-Spot Analysis
              </h2>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold uppercase flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-emerald-400" />
                100% NATIONAL SCOPE (5.70M KL)
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              COMPLETE COVERAGE: 5,700,000 KL DEMAND // 4,189,500 KL ACCESSIBLE SUPPLY // 1,510,500 KL WHITE-SPOT POOL (₹24,117.4 CR)
            </p>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center gap-1 bg-[#05070B] p-1 rounded border border-[#2D3748] text-xs font-mono flex-wrap">
            <button
              onClick={() => setActiveView('matrix')}
              className={`px-3 py-1.5 rounded font-bold uppercase text-[10px] flex items-center gap-1.5 transition-all ${
                activeView === 'matrix' ? 'bg-[#F27D26] text-black shadow' : 'text-gray-400 hover:text-white hover:bg-[#151B26]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>36 States Matrix</span>
            </button>

            <button
              onClick={() => setActiveView('vectors')}
              className={`px-3 py-1.5 rounded font-bold uppercase text-[10px] flex items-center gap-1.5 transition-all ${
                activeView === 'vectors' ? 'bg-[#F27D26] text-black shadow' : 'text-gray-400 hover:text-white hover:bg-[#151B26]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>4-Vector Gap Anatomy</span>
            </button>

            <button
              onClick={() => setActiveView('simulator')}
              className={`px-3 py-1.5 rounded font-bold uppercase text-[10px] flex items-center gap-1.5 transition-all ${
                activeView === 'simulator' ? 'bg-[#F27D26] text-black shadow' : 'text-gray-400 hover:text-white hover:bg-[#151B26]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>State Gap Simulator</span>
            </button>

            <button
              onClick={() => setActiveView('roadmaps')}
              className={`px-3 py-1.5 rounded font-bold uppercase text-[10px] flex items-center gap-1.5 transition-all ${
                activeView === 'roadmaps' ? 'bg-[#F27D26] text-black shadow' : 'text-gray-400 hover:text-white hover:bg-[#151B26]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>State GTM Roadmaps</span>
            </button>
          </div>
        </div>

        {/* 4 Macro KPI Cards for All India / Selected Zone */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono">
          <div className="bg-[#05070B] p-3 rounded border border-blue-900/60">
            <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-bold">
              <span>TOTAL DEMAND (KL/YR)</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 text-[8.5px]">
                {selectedZone === 'all' ? '100% OF INDIA' : `${selectedZone.toUpperCase()} ZONE`}
              </span>
            </div>
            <div className="text-xl font-bold text-blue-400 mt-1">
              {(displayedDemandKL / 1000000).toFixed(2)} Million KL
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {displayedDemandKL.toLocaleString()} KL / YR (<strong className="text-white">₹{displayedValueINR.toLocaleString()} Cr</strong>)
            </div>
          </div>

          <div className="bg-[#05070B] p-3 rounded border border-cyan-900/60">
            <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-bold">
              <span>ACCESSIBLE SUPPLY</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[8.5px]">OMC + PVT DEPOTS</span>
            </div>
            <div className="text-xl font-bold text-cyan-400 mt-1">
              {((displayedDemandKL - displayedSupplyGapKL) / 1000000).toFixed(2)} Million KL
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Coverage: <strong className="text-white">{(((displayedDemandKL - displayedSupplyGapKL) / displayedDemandKL) * 100).toFixed(1)}% Satisfied</strong>
            </div>
          </div>

          <div className="bg-[#05070B] p-3 rounded border border-red-900/60">
            <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-bold">
              <span>SUPPLY GAP DEFICIT</span>
              <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[8.5px]">ADDRESSABLE POOL</span>
            </div>
            <div className="text-xl font-bold text-red-400 mt-1">
              {(displayedSupplyGapKL / 1000000).toFixed(2)} Million KL
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Unmet Opportunity: <strong className="text-emerald-400">₹{(displayedSupplyGapKL * 0.016).toFixed(1)} Crores</strong>
            </div>
          </div>

          <div className="bg-[#05070B] p-3 rounded border border-[#F27D26]/60">
            <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-bold">
              <span>REGISTERED FLEET</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950 text-[#F27D26] text-[8.5px]">VAHAN 4.0</span>
            </div>
            <div className="text-xl font-bold text-[#F27D26] mt-1">
              {(displayedVehicles / 1000000).toFixed(1)} Million Units
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Across <strong className="text-white">{filteredStates.length} State(s) / UTs</strong>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: 36 STATES MATRIX */}
      {activeView === 'matrix' && (
        <>
          {/* Top 10 States Benchmark Bar Chart */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3 mb-3 font-mono">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#F27D26]" />
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                  Top 10 Indian States: Lubricant Demand vs. Accessible Supply &amp; Unmet Deficit (Thousand KL / Year)
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">ALL-INDIA MACRO TOTAL: 5.70M KL</span>
            </div>

            <div className="h-[220px] w-full font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStatesChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="code" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} unit="k" />
                  <Tooltip content={<CustomStateTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                  <Bar dataKey="totalDemand" name="Total Demand (k KL)" fill="#F27D26" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="accessibleSupply" name="Accessible Supply (k KL)" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="supplyGap" name="Supply Gap Deficit (k KL)" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filter and Sort Controls Bar */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-3 rounded flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-md">
            {/* Quick Zone Filter */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-gray-500 uppercase text-[10px] font-bold mr-1">ZONE:</span>
              {[
                { id: 'all', label: 'ALL 36' },
                { id: 'West', label: 'WEST' },
                { id: 'North', label: 'NORTH' },
                { id: 'South', label: 'SOUTH' },
                { id: 'East', label: 'EAST' },
                { id: 'Central', label: 'CENTRAL' },
                { id: 'North-East', label: 'N-EAST' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedZone(tab.id)}
                  className={`px-2 py-0.5 rounded font-bold uppercase text-[9.5px] transition-all ${
                    selectedZone === tab.id
                      ? 'bg-[#F27D26] text-black shadow'
                      : 'text-gray-400 bg-[#151B26] hover:text-white border border-[#2D3748]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="SEARCH STATE, DISTRICT, INDUSTRY..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 bg-[#05070B] border border-[#374151] rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F27D26] w-56 uppercase"
              />
            </div>

            {/* Sort Selector and Excel Export */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-500 uppercase text-[10px] font-bold">SORT:</span>
              {[
                { id: 'demand', label: 'DEMAND' },
                { id: 'gap', label: 'GAP' },
                { id: 'score', label: 'SCORE' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id as any)}
                  className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase transition-colors ${
                    sortBy === s.id
                      ? 'bg-[#F27D26] text-black shadow'
                      : 'bg-[#151B26] text-gray-400 border border-[#2D3748] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}

              <button
                onClick={() => downloadWhiteSpotExcel(locations, 'Base')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold uppercase text-[9.5px] transition-colors ml-1 shadow"
                title="Download full 36 states validation excel dataset"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                <span>EXCEL (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Complete All 36 States Table with Drilldown Expansion */}
          <div className="bg-[#0E1117] border border-[#1F2937] rounded overflow-hidden shadow-2xl font-mono text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#05070B] border-b border-[#1F2937] text-gray-400 text-[10px] uppercase font-bold">
                    <th className="py-2.5 px-3">State / UT</th>
                    <th className="py-2.5 px-3">Zone</th>
                    <th className="py-2.5 px-3 text-right">National Share</th>
                    <th className="py-2.5 px-3 text-right">Total Demand (KL)</th>
                    <th className="py-2.5 px-3 text-right">Auto</th>
                    <th className="py-2.5 px-3 text-right">Industrial</th>
                    <th className="py-2.5 px-3 text-right">Supply Gap (KL)</th>
                    <th className="py-2.5 px-3 text-right">Coverage</th>
                    <th className="py-2.5 px-3 text-right">Market Value</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]">
                  {filteredStates.map((st) => {
                    const isExpanded = expandedStateCode === st.stateCode;
                    const isTopTier = st.nationalSharePct >= 5.0;
                    const vectors = getStateWhiteSpotVectors(st);
                    const roadmap = getStateStrategicRoadmap(st);

                    return (
                      <React.Fragment key={st.stateCode}>
                        <tr 
                          className={`hover:bg-[#151B26] transition-colors cursor-pointer ${
                            isExpanded ? 'bg-[#151B26]/80 border-l-2 border-l-[#F27D26]' : isTopTier ? 'bg-[#0A0D14]' : ''
                          }`}
                          onClick={() => setExpandedStateCode(isExpanded ? null : st.stateCode)}
                        >
                          {/* State Name */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{st.stateName}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 border border-gray-700">
                                {st.stateCode}
                              </span>
                              {st.nationalSharePct >= 10.0 && (
                                <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                  CORE HUB
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500">{st.priorityTier}</div>
                          </td>

                          {/* Region */}
                          <td className="py-3 px-3">
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-gray-900 text-gray-300 border border-gray-700">
                              {st.region}
                            </span>
                          </td>

                          {/* National Share % */}
                          <td className="py-3 px-3 text-right font-bold text-white">
                            <div>{st.nationalSharePct.toFixed(2)}%</div>
                            <div className="w-16 bg-[#05070B] h-1 rounded-full ml-auto mt-1 overflow-hidden">
                              <div 
                                className="bg-[#F27D26] h-full rounded-full" 
                                style={{ width: `${Math.min(100, (st.nationalSharePct / 16.5) * 100)}%` }}
                              />
                            </div>
                          </td>

                          {/* Total Demand KL */}
                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-[#F27D26] text-sm">
                              {st.totalDemandKL.toLocaleString()} KL
                            </div>
                            <div className="text-[9px] text-gray-500">{(st.totalDemandKL / 1000).toFixed(1)}k KL/yr</div>
                          </td>

                          {/* Auto Demand */}
                          <td className="py-3 px-3 text-right text-gray-300">
                            {st.automotiveDemandKL.toLocaleString()} KL
                          </td>

                          {/* Industrial Demand */}
                          <td className="py-3 px-3 text-right text-cyan-400 font-bold">
                            {st.industrialDemandKL.toLocaleString()} KL
                          </td>

                          {/* Supply Gap */}
                          <td className="py-3 px-3 text-right font-bold text-red-400">
                            {st.supplyGapKL.toLocaleString()} KL
                          </td>

                          {/* Coverage Ratio */}
                          <td className="py-3 px-3 text-right">
                            <span className={`font-bold ${st.coverageRatioPct >= 75 ? 'text-green-400' : 'text-yellow-400'}`}>
                              {st.coverageRatioPct.toFixed(1)}%
                            </span>
                          </td>

                          {/* Market Value */}
                          <td className="py-3 px-3 text-right font-bold text-emerald-400">
                            ₹{st.marketValueINR.toLocaleString()} Cr
                          </td>

                          {/* Opportunity Score */}
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              st.whiteSpotScore >= 85 
                                ? 'bg-red-950 text-red-300 border border-red-800' 
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {st.whiteSpotScore}
                            </span>
                          </td>

                          {/* Action Chevron */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedStateCode(isExpanded ? null : st.stateCode);
                              }}
                              className="p-1 rounded hover:bg-[#1F2937] text-gray-400 hover:text-white"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-[#F27D26]" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            </button>
                          </td>
                        </tr>

                        {/* Detailed State Drilldown Panel */}
                        {isExpanded && (
                          <tr className="bg-[#0A0D13]">
                            <td colSpan={11} className="p-4 border-b border-[#1F2937]">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                                {/* Col 1: Top Consuming Industrial & Transport Districts */}
                                <div className="bg-[#05070B] p-3 rounded border border-[#1F2937] space-y-2">
                                  <div className="text-[10px] font-bold text-white uppercase border-b border-[#1F2937] pb-1 flex items-center justify-between">
                                    <span>TOP CONSUMING DISTRICTS &amp; CLUSTERS</span>
                                    <Building2 className="w-3.5 h-3.5 text-[#F27D26]" />
                                  </div>
                                  <div className="space-y-2">
                                    {st.topDistricts.map((dist, idx) => (
                                      <div key={idx} className="bg-[#10141D] p-2 rounded border border-[#1F2937]">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-white">
                                          <span>{dist.districtName}</span>
                                          <span className="text-[#F27D26]">{dist.demandKL.toLocaleString()} KL ({dist.shareOfStatePct}%)</span>
                                        </div>
                                        <div className="text-[9.5px] text-gray-400 mt-0.5">
                                          Primary Sector: <span className="text-gray-300 font-semibold">{dist.primarySector}</span>
                                        </div>
                                        <div className="text-[9.5px] text-red-400 mt-0.5 flex items-center justify-between">
                                          <span>White-Spot Deficit Gap:</span>
                                          <strong>{dist.whiteSpotGapKL.toLocaleString()} KL</strong>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Col 2: 4-Vector White-Spot Breakdown */}
                                <div className="bg-[#05070B] p-3 rounded border border-[#1F2937] space-y-2">
                                  <div className="text-[10px] font-bold text-white uppercase border-b border-[#1F2937] pb-1 flex items-center justify-between">
                                    <span>4-VECTOR WHITE-SPOT ANATOMY ({st.supplyGapKL.toLocaleString()} KL)</span>
                                    <Layers className="w-3.5 h-3.5 text-red-400" />
                                  </div>
                                  
                                  <div className="space-y-2 pt-1">
                                    <div className="bg-[#10141D] p-2 rounded border border-amber-900/40">
                                      <div className="flex justify-between text-[10.5px]">
                                        <span className="text-amber-300 font-bold flex items-center gap-1">
                                          <Wheat className="w-3 h-3 text-amber-400" /> Rural / Agri-Mandis Gap:
                                        </span>
                                        <strong className="text-white">{vectors.ruralAgriGapKL.toLocaleString()} KL</strong>
                                      </div>
                                      <div className="text-[9px] text-gray-400 mt-0.5">
                                        Remote workshops, tractor wet-brakes &amp; agricultural pump oils.
                                      </div>
                                    </div>

                                    <div className="bg-[#10141D] p-2 rounded border border-red-900/40">
                                      <div className="flex justify-between text-[10.5px]">
                                        <span className="text-red-300 font-bold flex items-center gap-1">
                                          <ShieldAlert className="w-3 h-3 text-red-400" /> Unorganized / Grey Lubes:
                                        </span>
                                        <strong className="text-white">{vectors.unorganizedLubeGapKL.toLocaleString()} KL</strong>
                                      </div>
                                      <div className="text-[9px] text-gray-400 mt-0.5">
                                        Roadside garages using low-spec recycled Group-I oil due to stockouts.
                                      </div>
                                    </div>

                                    <div className="bg-[#10141D] p-2 rounded border border-cyan-900/40">
                                      <div className="flex justify-between text-[10.5px]">
                                        <span className="text-cyan-300 font-bold flex items-center gap-1">
                                          <Factory className="w-3 h-3 text-cyan-400" /> MSME Industrial Pails (20L/50L):
                                        </span>
                                        <strong className="text-white">{vectors.msmeIndustrialPailGapKL.toLocaleString()} KL</strong>
                                      </div>
                                      <div className="text-[9px] text-gray-400 mt-0.5">
                                        CNC and tooling workshops unable to store bulk 208L steel barrels.
                                      </div>
                                    </div>

                                    <div className="bg-[#10141D] p-2 rounded border border-blue-900/40">
                                      <div className="flex justify-between text-[10.5px]">
                                        <span className="text-blue-300 font-bold flex items-center gap-1">
                                          <Truck className="w-3 h-3 text-blue-400" /> Highway Freight Corridors:
                                        </span>
                                        <strong className="text-white">{vectors.highwayLogisticsGapKL.toLocaleString()} KL</strong>
                                      </div>
                                      <div className="text-[9px] text-gray-400 mt-0.5">
                                        Expressway heavy trucks &amp; mining fleet staging deficits.
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Col 3: Actionable State GTM Roadmap */}
                                <div className="bg-[#05070B] p-3 rounded border border-[#1F2937] space-y-2 flex flex-col justify-between">
                                  <div>
                                    <div className="text-[10px] font-bold text-white uppercase border-b border-[#1F2937] pb-1 flex items-center justify-between">
                                      <span>ACTIONABLE GTM ROADMAP</span>
                                      <Compass className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>

                                    <div className="mt-2 space-y-2">
                                      <div className="text-[10.5px] text-emerald-400 font-bold">
                                        {roadmap.primaryAction}
                                      </div>

                                      <div className="text-[10px] text-gray-300">
                                        <strong className="text-gray-400">Target Depot Staging:</strong>
                                        <div className="text-white font-semibold mt-0.5">
                                          {roadmap.recommendedDepotLocations.join(' • ')}
                                        </div>
                                      </div>

                                      <div className="text-[10px] text-gray-300">
                                        <strong className="text-gray-400">Target High-Margin SKUs:</strong>
                                        <div className="text-amber-300 font-semibold mt-0.5">
                                          {roadmap.priorityTargetSKUs.join(' • ')}
                                        </div>
                                      </div>

                                      <div className="bg-[#10141D] p-2 rounded border border-emerald-800/40 text-[10px]">
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Target Stockists to Appoint:</span>
                                          <strong className="text-emerald-400">{roadmap.targetStockistCount} Exclusive Stockists</strong>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                          <span className="text-gray-400">Addressable Revenue Pool:</span>
                                          <strong className="text-white">₹{roadmap.estimatedAddressableRevenueINR} Crores</strong>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-2">
                                    <button
                                      onClick={() => {
                                        setSimStateCode(st.stateCode);
                                        setActiveView('simulator');
                                      }}
                                      className="w-full py-1.5 rounded bg-[#F27D26] hover:bg-[#ff8f3d] text-black font-bold uppercase text-[10px] flex items-center justify-center gap-1.5 transition-colors shadow"
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                      <span>SIMULATE GAP RESOLUTION FOR {st.stateCode}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: 4-VECTOR WHITE-SPOT ANATOMY */}
      {activeView === 'vectors' && (
        <div className="space-y-4 font-mono">
          <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#F27D26]" />
                <h3 className="font-bold text-sm text-white uppercase">
                  All-India 4-Vector White-Spot Taxonomy (1.51 Million KL Breakdown)
                </h3>
              </div>
              <span className="text-xs text-emerald-400 font-bold">TOTAL NATIONAL GAP: 1,510,500 KL (₹24,117.4 CR)</span>
            </div>

            {/* 4 Vector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-[#05070B] p-3 rounded border border-amber-900/60">
                <div className="flex items-center justify-between text-amber-300 text-[10px] font-bold uppercase">
                  <span className="flex items-center gap-1"><Wheat className="w-3.5 h-3.5" /> VECTOR A: RURAL / AGRI</span>
                  <span>34.4%</span>
                </div>
                <div className="text-xl font-bold text-amber-400 mt-1">520,000 KL</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Remote tractor fleets, wet-brake UTTO, and diesel pump-sets underserved beyond 35 km radius.
                </div>
              </div>

              <div className="bg-[#05070B] p-3 rounded border border-red-900/60">
                <div className="flex items-center justify-between text-red-300 text-[10px] font-bold uppercase">
                  <span className="flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> VECTOR B: UNORGANIZED / GREY</span>
                  <span>27.2%</span>
                </div>
                <div className="text-xl font-bold text-red-400 mt-1">410,000 KL</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Roadside garages purchasing low-spec recycled Group-I oil due to tier-1 brand stockouts.
                </div>
              </div>

              <div className="bg-[#05070B] p-3 rounded border border-cyan-900/60">
                <div className="flex items-center justify-between text-cyan-300 text-[10px] font-bold uppercase">
                  <span className="flex items-center gap-1"><Factory className="w-3.5 h-3.5" /> VECTOR C: MSME PAILS (20L/50L)</span>
                  <span>21.9%</span>
                </div>
                <div className="text-xl font-bold text-cyan-400 mt-1">330,000 KL</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Machine shops and jobbers needing 20L pails of neat cutting and slideway oils instead of 208L barrels.
                </div>
              </div>

              <div className="bg-[#05070B] p-3 rounded border border-blue-900/60">
                <div className="flex items-center justify-between text-blue-300 text-[10px] font-bold uppercase">
                  <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> VECTOR D: HIGHWAY FREIGHT</span>
                  <span>16.5%</span>
                </div>
                <div className="text-xl font-bold text-blue-400 mt-1">250,500 KL</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Expressway commercial truck corridors and mining HEMM operations outgrowing depot storage.
                </div>
              </div>
            </div>

            {/* Stacked Breakdown Chart by State */}
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStatesChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="code" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} unit="k" />
                  <Tooltip content={<CustomStateTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                  <Bar dataKey="ruralGap" name="Rural / Agri Gap (k KL)" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="unorgGap" name="Unorganized Lube Gap (k KL)" stackId="a" fill="#ef4444" />
                  <Bar dataKey="msmeGap" name="MSME Industrial Pails (k KL)" stackId="a" fill="#06b6d4" />
                  <Bar dataKey="logGap" name="Highway Logistics (k KL)" stackId="a" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: STATE GAP RESOLUTION SIMULATOR */}
      {activeView === 'simulator' && (
        <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl font-mono text-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#F27D26]" />
              <div>
                <h3 className="font-bold text-sm text-white uppercase">
                  State White-Spot Gap Resolution Simulator
                </h3>
                <p className="text-[11px] text-gray-400">
                  Select any Indian state and simulate operational deployment levers to capture the supply deficit.
                </p>
              </div>
            </div>

            {/* State Picker */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold uppercase text-[10px]">SELECT STATE:</span>
              <select
                value={simStateCode}
                onChange={e => setSimStateCode(e.target.value)}
                className="bg-[#05070B] border border-[#374151] rounded px-3 py-1.5 text-white font-bold uppercase focus:outline-none focus:border-[#F27D26]"
              >
                {ALL_INDIA_STATES_DATA.map(s => (
                  <option key={s.stateCode} value={s.stateCode}>
                    {s.stateName} ({s.stateCode}) — {s.supplyGapKL.toLocaleString()} KL Gap
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Col 1: Selected State Baseline */}
            <div className="bg-[#05070B] p-3.5 rounded border border-[#1F2937] space-y-3">
              <div className="text-[11px] font-bold text-white uppercase border-b border-[#1F2937] pb-1.5 flex items-center justify-between">
                <span>{simState.stateName} Baseline</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-gray-800 text-gray-300">{simState.region} Zone</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Annual Demand:</span>
                  <strong className="text-[#F27D26]">{simState.totalDemandKL.toLocaleString()} KL</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Accessible Supply:</span>
                  <strong className="text-blue-400">{simState.accessibleSupplyKL.toLocaleString()} KL</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Unmet Supply Gap:</span>
                  <strong className="text-red-400">{simState.supplyGapKL.toLocaleString()} KL ({((simState.supplyGapKL / simState.totalDemandKL) * 100).toFixed(1)}%)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Market Value:</span>
                  <strong className="text-emerald-400">₹{simState.marketValueINR.toLocaleString()} Cr</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">White-Spot Score:</span>
                  <strong className="text-amber-300">{simState.whiteSpotScore} / 100</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1F2937]">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Dominant Gap Cause:</span>
                <div className="text-xs font-bold text-white mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {simVectors.dominantGapVector}
                </div>
              </div>
            </div>

            {/* Col 2: Operational Levers */}
            <div className="bg-[#05070B] p-3.5 rounded border border-[#1F2937] space-y-3">
              <div className="text-[11px] font-bold text-white uppercase border-b border-[#1F2937] pb-1.5 flex items-center justify-between">
                <span>Deploy Operational Levers</span>
                <span className="text-[9px] text-[#F27D26] font-bold">4 STRATEGIC LEVERS</span>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-2 rounded bg-[#10141D] border border-[#1F2937] cursor-pointer hover:border-[#374151]">
                  <div>
                    <div className="font-bold text-white text-[11px]">1. Regional C&amp;F Staging Hub</div>
                    <div className="text-[9.5px] text-gray-400">Establishes 24-hr buffer storage in key district</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={leverDepot}
                    onChange={e => setLeverDepot(e.target.checked)}
                    className="w-4 h-4 accent-[#F27D26]"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-[#10141D] border border-[#1F2937] cursor-pointer hover:border-[#374151]">
                  <div>
                    <div className="font-bold text-white text-[11px]">2. Exclusive Sub-Stockists ({simRoadmap.targetStockistCount} Units)</div>
                    <div className="text-[9.5px] text-gray-400">Penetrates Tier-3/4 rural mandis and industrial zones</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={leverStockists}
                    onChange={e => setLeverStockists(e.target.checked)}
                    className="w-4 h-4 accent-[#F27D26]"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-[#10141D] border border-[#1F2937] cursor-pointer hover:border-[#374151]">
                  <div>
                    <div className="font-bold text-white text-[11px]">3. MSME 20L/50L Pails Launch</div>
                    <div className="text-[9.5px] text-gray-400">Displaces 208L bulk barrel mismatch for machine tooling</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={leverPails}
                    onChange={e => setLeverPails(e.target.checked)}
                    className="w-4 h-4 accent-[#F27D26]"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-[#10141D] border border-[#1F2937] cursor-pointer hover:border-[#374151]">
                  <div>
                    <div className="font-bold text-white text-[11px]">4. Direct Garage Loyalty Program</div>
                    <div className="text-[9.5px] text-gray-400">Displaces unorganized recycled grey lubricants</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={leverGarage}
                    onChange={e => setLeverGarage(e.target.checked)}
                    className="w-4 h-4 accent-[#F27D26]"
                  />
                </label>
              </div>
            </div>

            {/* Col 3: Simulation Results */}
            <div className="bg-[#05070B] p-3.5 rounded border border-emerald-900/60 space-y-3">
              <div className="text-[11px] font-bold text-emerald-400 uppercase border-b border-[#1F2937] pb-1.5 flex items-center justify-between">
                <span>Simulation Outcomes</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">
                  {simResults.captureRate}% GAP CAPTURED
                </span>
              </div>

              <div className="space-y-2">
                <div className="bg-[#10141D] p-2 rounded border border-[#1F2937]">
                  <div className="text-gray-400 text-[10px]">Volume Captured from White-Spot:</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    {simResults.capturedKL.toLocaleString()} KL / Year
                  </div>
                  <div className="text-[9px] text-gray-500">
                    Remaining Unserved Gap: <strong className="text-red-400">{simResults.residualGapKL.toLocaleString()} KL</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#10141D] p-2 rounded border border-[#1F2937]">
                    <div className="text-gray-400 text-[9.5px]">Annual Revenue:</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      ₹{simResults.grossRevenueINR} Cr
                    </div>
                  </div>
                  <div className="bg-[#10141D] p-2 rounded border border-[#1F2937]">
                    <div className="text-gray-400 text-[9.5px]">EBITDA (21.5%):</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      ₹{simResults.ebitdaINR} Cr
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#10141D] p-2 rounded border border-[#1F2937]">
                    <div className="text-gray-400 text-[9.5px]">Estimated Capex:</div>
                    <div className="text-sm font-bold text-amber-300 mt-0.5">
                      ₹{simResults.requiredCapexINR} Cr
                    </div>
                  </div>
                  <div className="bg-[#10141D] p-2 rounded border border-[#1F2937]">
                    <div className="text-gray-400 text-[9.5px]">Payback Period:</div>
                    <div className="text-sm font-bold text-cyan-300 mt-0.5">
                      {simResults.paybackMonths} Months
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-1 text-[9.5px] text-gray-400">
                Prescribed Depots: <strong className="text-white">{simRoadmap.recommendedDepotLocations.slice(0, 2).join(' • ')}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: STATE GTM ROADMAPS */}
      {activeView === 'roadmaps' && (
        <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#F27D26]" />
              <h3 className="font-bold text-sm text-white uppercase">
                All-India 36 States Go-To-Market &amp; Depot Deployment Master Plan
              </h3>
            </div>
            <span className="text-xs text-emerald-400 font-bold">100% STATES COVERED</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_INDIA_STATES_DATA.slice(0, 15).map(st => {
              const roadmap = getStateStrategicRoadmap(st);
              const vectors = getStateWhiteSpotVectors(st);

              return (
                <div key={st.stateCode} className="bg-[#05070B] p-3 rounded border border-[#1F2937] space-y-2 hover:border-[#374151] transition-all">
                  <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5">
                    <div className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span>{st.stateName}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-400">{st.stateCode}</span>
                    </div>
                    <span className="text-[9.5px] font-bold text-red-400">
                      {st.supplyGapKL.toLocaleString()} KL Gap
                    </span>
                  </div>

                  <div className="text-[10px] text-emerald-400 font-bold leading-relaxed">
                    {roadmap.primaryAction}
                  </div>

                  <div className="bg-[#10141D] p-2 rounded text-[9.5px] space-y-1">
                    <div>
                      <span className="text-gray-400">Recommended Depots:</span>
                      <div className="text-white font-semibold">{roadmap.recommendedDepotLocations.join(' • ')}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Key Focus SKUs:</span>
                      <div className="text-amber-300 font-semibold">{roadmap.priorityTargetSKUs.join(' • ')}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1 border-t border-[#1F2937]">
                    <span className="text-gray-400">Stockists to Appoint: <strong className="text-emerald-400">{roadmap.targetStockistCount}</strong></span>
                    <span className="text-gray-400">Deploy Time: <strong className="text-white">{roadmap.timeToDeployMonths} Mo</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
