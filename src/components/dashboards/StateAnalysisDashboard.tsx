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
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs text-slate-800 min-w-[210px] z-50">
          <div className="text-[11px] font-bold text-[#7C3AED] border-b border-slate-100 pb-1 mb-2 uppercase">
            {stateObj?.stateName || label} ({stateObj?.nationalSharePct}% of India)
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`entry-${index}`} className="flex justify-between items-center text-[10px] gap-2 py-0.5">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <strong className="text-slate-900">{(Number(entry.value) * 1000).toLocaleString()} KL</strong>
            </div>
          ))}
          <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-500">
            Market Value: <strong className="text-emerald-700 font-bold">₹{stateObj?.marketValueINR.toLocaleString()} Cr</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Complete All-India 5.70M KL State & Regional Intelligence */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-[#7C3AED]" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                All-India 36 States &amp; UTs Enhanced White-Spot Analysis
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% National Scope (5.70M KL)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete Coverage: 5,700,000 KL Demand // 4,189,500 KL Accessible Supply // 1,510,500 KL White-Spot Pool (₹24,117.4 Cr)
            </p>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 text-xs flex-wrap">
            <button
              onClick={() => setActiveView('matrix')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                activeView === 'matrix' ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>36 States Matrix</span>
            </button>

            <button
              onClick={() => setActiveView('vectors')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                activeView === 'vectors' ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>4-Vector Gap Anatomy</span>
            </button>

            <button
              onClick={() => setActiveView('simulator')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                activeView === 'simulator' ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>State Gap Simulator</span>
            </button>

            <button
              onClick={() => setActiveView('roadmaps')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                activeView === 'roadmaps' ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>State GTM Roadmaps</span>
            </button>
          </div>
        </div>

        {/* 4 Macro KPI Cards for All India / Selected Zone */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
              <span>Total Demand (KL/Yr)</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold">
                {selectedZone === 'all' ? '100% of India' : `${selectedZone.toUpperCase()} Zone`}
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1.5">
              {(displayedDemandKL / 1000000).toFixed(2)} Million KL
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {displayedDemandKL.toLocaleString()} KL / YR (<strong className="text-slate-900">₹{displayedValueINR.toLocaleString()} Cr</strong>)
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
              <span>Accessible Supply</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 text-[9px] font-bold">OMC + Pvt Depots</span>
            </div>
            <div className="text-xl font-extrabold text-cyan-700 mt-1.5">
              {((displayedDemandKL - displayedSupplyGapKL) / 1000000).toFixed(2)} Million KL
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Coverage: <strong className="text-slate-900">{(((displayedDemandKL - displayedSupplyGapKL) / displayedDemandKL) * 100).toFixed(1)}% Satisfied</strong>
            </div>
          </div>

          <div className="bg-rose-50/50 border border-rose-200 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
              <span>Supply Gap Deficit</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300 text-[9px] font-bold">Addressable Pool</span>
            </div>
            <div className="text-xl font-extrabold text-rose-600 mt-1.5">
              {(displayedSupplyGapKL / 1000000).toFixed(2)} Million KL
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Unmet Opportunity: <strong className="text-emerald-700 font-bold">₹{(displayedSupplyGapKL * 0.016).toFixed(1)} Crores</strong>
            </div>
          </div>

          <div className="bg-purple-50/50 border border-purple-200 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
              <span>Registered Fleet</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-300 text-[9px] font-bold">VAHAN 4.0</span>
            </div>
            <div className="text-xl font-extrabold text-[#7C3AED] mt-1.5">
              {(displayedVehicles / 1000000).toFixed(1)} Million Units
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Across <strong className="text-slate-900">{filteredStates.length} State(s) / UTs</strong>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: 36 STATES MATRIX */}
      {activeView === 'matrix' && (
        <>
          {/* Top 10 States Benchmark Bar Chart */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Top 10 Indian States: Lubricant Demand vs. Accessible Supply &amp; Unmet Deficit (Thousand KL / Year)
                </h3>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                All-India Macro Total: 5.70M KL
              </span>
            </div>

            <div className="h-[240px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStatesChartData} margin={{ top: 15, right: 20, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="code" stroke="#94A3B8" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={(val) => `${val}k KL`} />
                  <Tooltip content={<CustomStateTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="totalDemand" name="Total Demand (k KL)" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="accessibleSupply" name="Accessible Supply (k KL)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="supplyGap" name="Supply Gap Deficit (k KL)" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filter and Sort Controls Bar */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
            {/* Quick Zone Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 uppercase text-[10px] font-bold mr-1">Zone:</span>
              {[
                { id: 'all', label: 'All 36' },
                { id: 'West', label: 'West' },
                { id: 'North', label: 'North' },
                { id: 'South', label: 'South' },
                { id: 'East', label: 'East' },
                { id: 'Central', label: 'Central' },
                { id: 'North-East', label: 'N-East' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedZone(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                    selectedZone === tab.id
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm'
                      : 'text-slate-600 bg-slate-100/80 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search state, district, industry..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white w-64 transition-all"
              />
            </div>

            {/* Sort Selector and Excel Export */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 uppercase text-[10px] font-bold">Sort:</span>
              {[
                { id: 'demand', label: 'Demand' },
                { id: 'gap', label: 'Gap' },
                { id: 'score', label: 'Score' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    sortBy === s.id
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}

              <button
                onClick={() => downloadWhiteSpotExcel(locations, 'Base')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-colors ml-1 shadow-xs"
                title="Download full 36 states validation excel dataset"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel (.csv)</span>
              </button>
            </div>
          </div>

          {/* Complete All 36 States Table with Drilldown Expansion */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                    <th className="py-3 px-3.5">State / UT</th>
                    <th className="py-3 px-3.5">Zone</th>
                    <th className="py-3 px-3.5 text-right">National Share</th>
                    <th className="py-3 px-3.5 text-right">Total Demand (KL)</th>
                    <th className="py-3 px-3.5 text-right">Auto</th>
                    <th className="py-3 px-3.5 text-right">Industrial</th>
                    <th className="py-3 px-3.5 text-right">Supply Gap (KL)</th>
                    <th className="py-3 px-3.5 text-right">Coverage</th>
                    <th className="py-3 px-3.5 text-right">Market Value</th>
                    <th className="py-3 px-3.5 text-center">Score</th>
                    <th className="py-3 px-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStates.map((st) => {
                    const isExpanded = expandedStateCode === st.stateCode;
                    const isTopTier = st.nationalSharePct >= 5.0;
                    const vectors = getStateWhiteSpotVectors(st);
                    const roadmap = getStateStrategicRoadmap(st);

                    return (
                      <React.Fragment key={st.stateCode}>
                        <tr 
                          className={`hover:bg-slate-50/90 transition-colors cursor-pointer ${
                            isExpanded ? 'bg-purple-50/50 border-l-4 border-l-[#7C3AED]' : isTopTier ? 'bg-slate-50/30' : ''
                          }`}
                          onClick={() => setExpandedStateCode(isExpanded ? null : st.stateCode)}
                        >
                          {/* State Name */}
                          <td className="py-3.5 px-3.5">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{st.stateName}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                                {st.stateCode}
                              </span>
                              {st.nationalSharePct >= 10.0 && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200 font-bold">
                                  Core Hub
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{st.priorityTier}</div>
                          </td>

                          {/* Region */}
                          <td className="py-3.5 px-3.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                              {st.region}
                            </span>
                          </td>

                          {/* National Share % */}
                          <td className="py-3.5 px-3.5 text-right font-bold text-slate-900">
                            <div>{st.nationalSharePct.toFixed(2)}%</div>
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full ml-auto mt-1 overflow-hidden border border-slate-200/60">
                              <div 
                                className="bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] h-full rounded-full" 
                                style={{ width: `${Math.min(100, (st.nationalSharePct / 16.5) * 100)}%` }}
                              />
                            </div>
                          </td>

                          {/* Total Demand KL */}
                          <td className="py-3.5 px-3.5 text-right">
                            <div className="font-extrabold text-[#7C3AED] text-sm">
                              {st.totalDemandKL.toLocaleString()} KL
                            </div>
                            <div className="text-[10px] text-slate-400">{(st.totalDemandKL / 1000).toFixed(1)}k KL/yr</div>
                          </td>

                          {/* Auto Demand */}
                          <td className="py-3.5 px-3.5 text-right text-slate-700 font-medium">
                            {st.automotiveDemandKL.toLocaleString()} KL
                          </td>

                          {/* Industrial Demand */}
                          <td className="py-3.5 px-3.5 text-right text-blue-600 font-bold">
                            {st.industrialDemandKL.toLocaleString()} KL
                          </td>

                          {/* Supply Gap */}
                          <td className="py-3.5 px-3.5 text-right font-extrabold text-rose-600">
                            {st.supplyGapKL.toLocaleString()} KL
                          </td>

                          {/* Coverage Ratio */}
                          <td className="py-3.5 px-3.5 text-right">
                            <span className={`font-bold ${st.coverageRatioPct >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {st.coverageRatioPct.toFixed(1)}%
                            </span>
                          </td>

                          {/* Market Value */}
                          <td className="py-3.5 px-3.5 text-right font-bold text-emerald-700">
                            ₹{st.marketValueINR.toLocaleString()} Cr
                          </td>

                          {/* Opportunity Score */}
                          <td className="py-3.5 px-3.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              st.whiteSpotScore >= 85 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {st.whiteSpotScore}
                            </span>
                          </td>

                          {/* Action Chevron */}
                          <td className="py-3.5 px-3.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedStateCode(isExpanded ? null : st.stateCode);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-[#7C3AED]" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>

                        {/* Detailed State Drilldown Panel */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70">
                            <td colSpan={11} className="p-5 border-b border-slate-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                {/* Col 1: Top Consuming Industrial & Transport Districts */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                                  <div className="text-[11px] font-bold text-slate-900 uppercase border-b border-slate-100 pb-2 flex items-center justify-between">
                                    <span>Top Consuming Districts &amp; Clusters</span>
                                    <Building2 className="w-3.5 h-3.5 text-[#7C3AED]" />
                                  </div>
                                  <div className="space-y-2">
                                    {st.topDistricts.map((dist, idx) => (
                                      <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                                          <span>{dist.districtName}</span>
                                          <span className="text-[#7C3AED]">{dist.demandKL.toLocaleString()} KL ({dist.shareOfStatePct}%)</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                          Sector: <span className="text-slate-700 font-semibold">{dist.primarySector}</span>
                                        </div>
                                        <div className="text-[10px] text-rose-600 mt-1 flex items-center justify-between font-semibold">
                                          <span>White-Spot Deficit Gap:</span>
                                          <strong>{dist.whiteSpotGapKL.toLocaleString()} KL</strong>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Col 2: 4-Vector White-Spot Breakdown */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                                  <div className="text-[11px] font-bold text-slate-900 uppercase border-b border-slate-100 pb-2 flex items-center justify-between">
                                    <span>4-Vector White-Spot Anatomy ({st.supplyGapKL.toLocaleString()} KL)</span>
                                    <Layers className="w-3.5 h-3.5 text-rose-500" />
                                  </div>
                                  
                                  <div className="space-y-2 pt-1">
                                    <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-amber-800 font-bold flex items-center gap-1">
                                          <Wheat className="w-3 h-3 text-amber-600" /> Rural / Agri-Mandis Gap:
                                        </span>
                                        <strong className="text-slate-900">{vectors.ruralAgriGapKL.toLocaleString()} KL</strong>
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">
                                        Remote workshops, tractor wet-brakes &amp; agricultural pump oils.
                                      </div>
                                    </div>

                                    <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-200/80">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-rose-800 font-bold flex items-center gap-1">
                                          <ShieldAlert className="w-3 h-3 text-rose-600" /> Unorganized / Grey Lubes:
                                        </span>
                                        <strong className="text-slate-900">{vectors.unorganizedLubeGapKL.toLocaleString()} KL</strong>
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">
                                        Roadside garages using low-spec recycled Group-I oil due to stockouts.
                                      </div>
                                    </div>

                                    <div className="bg-cyan-50/60 p-2.5 rounded-lg border border-cyan-200/80">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-cyan-800 font-bold flex items-center gap-1">
                                          <Factory className="w-3 h-3 text-cyan-600" /> MSME Industrial Pails (20L/50L):
                                        </span>
                                        <strong className="text-slate-900">{vectors.msmeIndustrialPailGapKL.toLocaleString()} KL</strong>
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">
                                        CNC and tooling workshops unable to store bulk 208L steel barrels.
                                      </div>
                                    </div>

                                    <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-200/80">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-blue-800 font-bold flex items-center gap-1">
                                          <Truck className="w-3 h-3 text-blue-600" /> Highway Freight Corridors:
                                        </span>
                                        <strong className="text-slate-900">{vectors.highwayLogisticsGapKL.toLocaleString()} KL</strong>
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">
                                        Expressway heavy trucks &amp; mining fleet staging deficits.
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Col 3: Actionable State GTM Roadmap */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 flex flex-col justify-between">
                                  <div>
                                    <div className="text-[11px] font-bold text-slate-900 uppercase border-b border-slate-100 pb-2 flex items-center justify-between">
                                      <span>Actionable GTM Roadmap</span>
                                      <Compass className="w-3.5 h-3.5 text-emerald-600" />
                                    </div>

                                    <div className="mt-2.5 space-y-2">
                                      <div className="text-xs text-emerald-700 font-bold">
                                        {roadmap.primaryAction}
                                      </div>

                                      <div className="text-[11px] text-slate-600">
                                        <strong className="text-slate-400 block text-[10px] uppercase">Target Depot Staging:</strong>
                                        <div className="text-slate-900 font-semibold mt-0.5">
                                          {roadmap.recommendedDepotLocations.join(' • ')}
                                        </div>
                                      </div>

                                      <div className="text-[11px] text-slate-600">
                                        <strong className="text-slate-400 block text-[10px] uppercase">Target High-Margin SKUs:</strong>
                                        <div className="text-amber-700 font-semibold mt-0.5">
                                          {roadmap.priorityTargetSKUs.join(' • ')}
                                        </div>
                                      </div>

                                      <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/80 text-[11px]">
                                        <div className="flex justify-between">
                                          <span className="text-slate-600">Stockists to Appoint:</span>
                                          <strong className="text-emerald-700">{roadmap.targetStockistCount} Exclusive Stockists</strong>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                          <span className="text-slate-600">Addressable Revenue Pool:</span>
                                          <strong className="text-slate-900">₹{roadmap.estimatedAddressableRevenueINR} Crores</strong>
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
                                      className="w-full py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:shadow-md text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                      <span>Simulate Gap Resolution for {st.stateCode}</span>
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
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#7C3AED]" />
                <h3 className="font-bold text-sm text-slate-900">
                  All-India 4-Vector White-Spot Taxonomy (1.51 Million KL Breakdown)
                </h3>
              </div>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Total National Gap: 1,510,500 KL (₹24,117.4 Cr)
              </span>
            </div>

            {/* 4 Vector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mb-5">
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between text-amber-800 text-[10px] font-bold uppercase">
                  <span className="flex items-center gap-1"><Wheat className="w-3.5 h-3.5" /> Vector A: Rural / Agri</span>
                  <span className="bg-amber-100 px-1.5 py-0.5 rounded text-[9px]">34.4%</span>
                </div>
                <div className="text-xl font-extrabold text-amber-700 mt-1.5">520,000 KL</div>
                <div className="text-xs text-slate-500 mt-1">
                  Remote tractor fleets, wet-brake UTTO, and diesel pump-sets underserved beyond 35 km radius.
                </div>
              </div>

              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                <div className="flex items-center justify-between text-rose-800 text-[10px] font-bold uppercase">
                  <span className="flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Vector B: Unorganized</span>
                  <span className="bg-rose-100 px-1.5 py-0.5 rounded text-[9px]">27.2%</span>
                </div>
                <div className="text-xl font-extrabold text-rose-600 mt-1.5">410,000 KL</div>
                <div className="text-xs text-slate-500 mt-1">
                  Roadside garages purchasing low-spec recycled Group-I oil due to tier-1 brand stockouts.
                </div>
              </div>

              <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-200">
                <div className="flex items-center justify-between text-cyan-800 text-[10px] font-bold uppercase">
                  <span className="flex items-center gap-1"><Factory className="w-3.5 h-3.5" /> Vector C: MSME Pails</span>
                  <span className="bg-cyan-100 px-1.5 py-0.5 rounded text-[9px]">21.9%</span>
                </div>
                <div className="text-xl font-extrabold text-cyan-700 mt-1.5">330,000 KL</div>
                <div className="text-xs text-slate-500 mt-1">
                  Machine shops and jobbers needing 20L pails of neat cutting and slideway oils instead of 208L barrels.
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between text-blue-800 text-[10px] font-bold uppercase">
                  <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Vector D: Highway Logistics</span>
                  <span className="bg-blue-100 px-1.5 py-0.5 rounded text-[9px]">16.5%</span>
                </div>
                <div className="text-xl font-extrabold text-blue-600 mt-1.5">250,500 KL</div>
                <div className="text-xs text-slate-500 mt-1">
                  Expressway commercial truck corridors and mining HEMM operations outgrowing depot storage.
                </div>
              </div>
            </div>

            {/* Stacked Breakdown Chart by State */}
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStatesChartData} margin={{ top: 15, right: 20, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="code" stroke="#94A3B8" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={(val) => `${val}k KL`} />
                  <Tooltip content={<CustomStateTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="ruralGap" name="Rural / Agri Gap (k KL)" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="unorgGap" name="Unorganized Lube Gap (k KL)" stackId="a" fill="#F43F5E" />
                  <Bar dataKey="msmeGap" name="MSME Industrial Pails (k KL)" stackId="a" fill="#06B6D4" />
                  <Bar dataKey="logGap" name="Highway Logistics (k KL)" stackId="a" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: STATE GAP RESOLUTION SIMULATOR */}
      {activeView === 'simulator' && (
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm text-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#7C3AED]" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  State White-Spot Gap Resolution Simulator
                </h3>
                <p className="text-xs text-slate-500">
                  Select any Indian state and simulate operational deployment levers to capture the supply deficit.
                </p>
              </div>
            </div>

            {/* State Picker */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Select State:</span>
              <select
                value={simStateCode}
                onChange={e => setSimStateCode(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-bold text-xs focus:outline-none focus:border-purple-500"
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
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200/80 pb-2 flex items-center justify-between">
                <span>{simState.stateName} Baseline</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 font-bold">{simState.region} Zone</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Annual Demand:</span>
                  <strong className="text-[#7C3AED]">{simState.totalDemandKL.toLocaleString()} KL</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Accessible Supply:</span>
                  <strong className="text-blue-600">{simState.accessibleSupplyKL.toLocaleString()} KL</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unmet Supply Gap:</span>
                  <strong className="text-rose-600">{simState.supplyGapKL.toLocaleString()} KL ({((simState.supplyGapKL / simState.totalDemandKL) * 100).toFixed(1)}%)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Market Value:</span>
                  <strong className="text-emerald-700 font-bold">₹{simState.marketValueINR.toLocaleString()} Cr</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">White-Spot Score:</span>
                  <strong className="text-amber-700 font-bold">{simState.whiteSpotScore} / 100</strong>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Dominant Gap Cause:</span>
                <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {simVectors.dominantGapVector}
                </div>
              </div>
            </div>

            {/* Col 2: Operational Levers */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200/80 pb-2 flex items-center justify-between">
                <span>Deploy Operational Levers</span>
                <span className="text-[10px] text-[#7C3AED] font-bold">4 Levers</span>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80 cursor-pointer hover:border-purple-300 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">1. Regional C&amp;F Staging Hub</div>
                    <div className="text-[10px] text-slate-500">Establishes 24-hr buffer storage in key district</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={leverDepot}
                    onChange={e => setLeverDepot(e.target.checked)}
                    className="w-4 h-4 accent-[#7C3AED] rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80 cursor-pointer hover:border-purple-300 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">2. Exclusive Sub-Stockists ({simRoadmap.targetStockistCount} Units)</div>
                    <div className="text-[10px] text-slate-500">Penetrates Tier-3/4 rural mandis and industrial zones</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={leverStockists}
                    onChange={e => setLeverStockists(e.target.checked)}
                    className="w-4 h-4 accent-[#7C3AED] rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80 cursor-pointer hover:border-purple-300 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">3. MSME 20L/50L Pails Launch</div>
                    <div className="text-[10px] text-slate-500">Displaces 208L bulk barrel mismatch for machine tooling</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={leverPails}
                    onChange={e => setLeverPails(e.target.checked)}
                    className="w-4 h-4 accent-[#7C3AED] rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80 cursor-pointer hover:border-purple-300 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">4. Direct Garage Loyalty Program</div>
                    <div className="text-[10px] text-slate-500">Displaces unorganized recycled grey lubricants</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={leverGarage}
                    onChange={e => setLeverGarage(e.target.checked)}
                    className="w-4 h-4 accent-[#7C3AED] rounded"
                  />
                </label>
              </div>
            </div>

            {/* Col 3: Simulation Results */}
            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/80 space-y-3">
              <div className="text-xs font-bold text-emerald-800 uppercase border-b border-emerald-200/60 pb-2 flex items-center justify-between">
                <span>Simulation Outcomes</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {simResults.captureRate}% Gap Captured
                </span>
              </div>

              <div className="space-y-2">
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="text-slate-500 text-[10px] font-medium">Volume Captured from White-Spot:</div>
                  <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
                    {simResults.capturedKL.toLocaleString()} KL / Year
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Remaining Unserved Gap: <strong className="text-rose-600">{simResults.residualGapKL.toLocaleString()} KL</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <div className="text-slate-400 text-[10px]">Annual Revenue:</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      ₹{simResults.grossRevenueINR} Cr
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <div className="text-slate-400 text-[10px]">EBITDA (21.5%):</div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5">
                      ₹{simResults.ebitdaINR} Cr
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <div className="text-slate-400 text-[10px]">Estimated Capex:</div>
                    <div className="text-sm font-bold text-amber-700 mt-0.5">
                      ₹{simResults.requiredCapexINR} Cr
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <div className="text-slate-400 text-[10px]">Payback Period:</div>
                    <div className="text-sm font-bold text-indigo-700 mt-0.5">
                      {simResults.paybackMonths} Months
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-1 text-[10px] text-slate-500">
                Prescribed Depots: <strong className="text-slate-800">{simRoadmap.recommendedDepotLocations.slice(0, 2).join(' • ')}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: STATE GTM ROADMAPS */}
      {activeView === 'roadmaps' && (
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#7C3AED]" />
              <h3 className="font-bold text-sm text-slate-900">
                All-India 36 States Go-To-Market &amp; Depot Deployment Master Plan
              </h3>
            </div>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              100% States Covered
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {ALL_INDIA_STATES_DATA.slice(0, 15).map(st => {
              const roadmap = getStateStrategicRoadmap(st);
              const vectors = getStateWhiteSpotVectors(st);

              return (
                <div key={st.stateCode} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2.5 hover:border-purple-300 hover:bg-white transition-all shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{st.stateName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">{st.stateCode}</span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      {st.supplyGapKL.toLocaleString()} KL Gap
                    </span>
                  </div>

                  <div className="text-xs text-emerald-700 font-bold leading-relaxed">
                    {roadmap.primaryAction}
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 text-[10px] space-y-1">
                    <div>
                      <span className="text-slate-400 font-medium">Recommended Depots:</span>
                      <div className="text-slate-800 font-semibold">{roadmap.recommendedDepotLocations.join(' • ')}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Key Focus SKUs:</span>
                      <div className="text-amber-700 font-semibold">{roadmap.priorityTargetSKUs.join(' • ')}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Stockists to Appoint: <strong className="text-emerald-700">{roadmap.targetStockistCount}</strong></span>
                    <span className="text-slate-500">Deploy Time: <strong className="text-slate-800">{roadmap.timeToDeployMonths} Mo</strong></span>
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
