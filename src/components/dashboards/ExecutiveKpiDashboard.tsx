import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  Target, 
  Activity, 
  Zap, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Sliders, 
  Building2, 
  Layers, 
  BarChart3, 
  PieChart as PieIcon, 
  Award, 
  RefreshCw,
  Download,
  Flame,
  FileSpreadsheet,
  HelpCircle,
  Truck,
  RotateCcw,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  LineChart, 
  Line, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  AreaChart, 
  Area 
} from 'recharts';
import { LocationRecord, DistributorRecord, FinancialAssumptions } from '../../types';

interface ExecutiveKpiDashboardProps {
  locations: LocationRecord[];
  distributors: DistributorRecord[];
  financialAssumptions: FinancialAssumptions;
  onNavigateToTab?: (tab: any) => void;
}

export const ExecutiveKpiDashboard: React.FC<ExecutiveKpiDashboardProps> = ({
  locations,
  distributors,
  financialAssumptions,
  onNavigateToTab
}) => {
  // Strategic Leadership Scenario Filters & Levers
  const [selectedPillar, setSelectedPillar] = useState<'all' | 'commercial' | 'margins' | 'supplyChain' | 'workingCapital' | 'esg'>('all');
  const [targetTimeHorizon, setTargetTimeHorizon] = useState<'18mo' | '36mo' | '60mo'>('18mo');
  const [syntheticConversionPush, setSyntheticConversionPush] = useState<number>(42); // Target %
  const [whiteSpotCaptureTarget, setWhiteSpotCaptureTarget] = useState<number>(65); // Target %
  const [freightOptimizationGoal, setFreightOptimizationGoal] = useState<number>(92); // % FTL

  // 1. Calculate Aggregate Network Metrics
  const totalDemandKL = useMemo(() => {
    return locations.reduce((sum, l) => sum + (l.totalEstimatedDemandKL || 0), 0);
  }, [locations]);

  const totalWhiteSpotGapKL = useMemo(() => {
    return locations.reduce((sum, l) => sum + (l.supplyGapKL > 0 ? l.supplyGapKL : 0), 0);
  }, [locations]);

  const totalDistributorThroughputKL = useMemo(() => {
    return distributors.reduce((sum, d) => sum + (d.annualVolumeKL || 0), 0);
  }, [distributors]);

  const pacsCount = useMemo(() => {
    return distributors.filter(d => d.distributorType?.includes('PACS') || d.osmMeta?.source?.includes('PACS') || d.primarySector?.includes('Agri')).length;
  }, [distributors]);

  const omcDepotCount = useMemo(() => {
    return distributors.filter(d => d.distributorType === 'Direct OMC Depot' || d.distributorType?.includes('OMC')).length;
  }, [distributors]);

  const transportNagarCount = useMemo(() => {
    return distributors.filter(d => d.distributorType?.includes('Transport') || d.name?.toLowerCase().includes('transport')).length;
  }, [distributors]);

  // White-Spot Capture Potential & Economic Yield
  const whiteSpotCaptureKL = Math.round(totalWhiteSpotGapKL * (whiteSpotCaptureTarget / 100));
  const estimatedRevenueFromCaptureCr = ((whiteSpotCaptureKL * financialAssumptions.avgSellingPricePerLiterINR * 1000) / 10000000).toFixed(1);
  const estimatedGrossProfitCr = ((whiteSpotCaptureKL * financialAssumptions.avgSellingPricePerLiterINR * (financialAssumptions.grossMarginPct / 100) * 1000) / 10000000).toFixed(1);

  // 2. Executive Balanced Scorecard Data
  const executiveScorecard = [
    {
      id: 'kpi-1',
      pillar: 'commercial',
      name: 'White-Spot Demand Capture Ratio',
      current: '48.2%',
      target: `${whiteSpotCaptureTarget}%`,
      benchmark: '≥ 65.0% by 2027',
      status: 'yellow',
      trend: '+6.4% YoY',
      isPositive: true,
      impact: `₹${estimatedGrossProfitCr} Cr Unlocked Gross Profit`,
      formula: '(Captured Gap KL / Total Addressable White-Spot Gap KL) × 100',
      action: 'Accelerate Super Stockist appointments in 36 Master White-Spot Industrial Corridors.'
    },
    {
      id: 'kpi-2',
      pillar: 'margins',
      name: 'Synthetic & Semi-Synth Premiumization Index',
      current: `${syntheticConversionPush}%`,
      target: '50.0%',
      benchmark: '≥ 38.0% (Euro VI / BS-VI Norms)',
      status: 'green',
      trend: '+8.1% vs 2025',
      isPositive: true,
      impact: '₹52,000/KL Synthetic GM vs ₹21,500/KL Mineral GM',
      formula: '(Synthetic & Semi-Synthetic Volume / Total Volume Sold) × 100',
      action: 'Disincentivize monograde mineral CF-4; tie sales incentives to CK-4, API SP, and Longlife fluids.'
    },
    {
      id: 'kpi-3',
      pillar: 'supplyChain',
      name: 'OTIF (On-Time, In-Full) Order Fulfillment',
      current: '94.8%',
      target: '98.0%',
      benchmark: '≥ 96.5% SLA',
      status: 'yellow',
      trend: '+1.4% MoM',
      isPositive: true,
      impact: '1.2-Day Avg Lead Time to Key Plant Gates',
      formula: '(Orders Shipped On-Time & In-Full / Total POs) × 100',
      action: 'Establish satellite buffer replenishment in Dahej PCPIR and Angul Heavy Steel corridors.'
    },
    {
      id: 'kpi-4',
      pillar: 'workingCapital',
      name: 'Days Sales Outstanding (DSO)',
      current: '31.4 Days',
      target: '26.0 Days',
      benchmark: '≤ 28.0 Days',
      status: 'yellow',
      trend: '-3.2 Days YoY',
      isPositive: true,
      impact: '₹14.2 Cr Released in Working Capital',
      formula: '(Accounts Receivable / Total Credit Sales) × 365',
      action: 'Automate ERP dynamic credit locks at 35 days; offer 1.5% prompt-pay rebate at 7 days.'
    },
    {
      id: 'kpi-5',
      pillar: 'supplyChain',
      name: 'FTL Freight Consolidation Index',
      current: `${freightOptimizationGoal}%`,
      target: '95.0%',
      benchmark: '≥ 88.0% FTL',
      status: 'green',
      trend: '+4.0% YoY',
      isPositive: true,
      impact: '₹1,850/KL Secondary Freight Cost Savings',
      formula: '(Full Truckload 16-24 KL Dispatches / Total Dispatches) × 100',
      action: 'Implement tiered order consolidation discounts for regional distributor clusters.'
    },
    {
      id: 'kpi-6',
      pillar: 'commercial',
      name: 'Channel Network Attrition / Churn Rate',
      current: '3.8%',
      target: '< 3.0%',
      benchmark: '< 4.5% p.a.',
      status: 'green',
      trend: '-1.1% YoY',
      isPositive: true,
      impact: '96.2% Multi-Year Partner Retention',
      formula: '(Inactivated Channel Partners / Active Base) × 100',
      action: 'Maintain competitive 18-22% distributor ROCE through high-margin synthetic mix.'
    },
    {
      id: 'kpi-7',
      pillar: 'workingCapital',
      name: 'Distributor ROCE (Return on Capital Employed)',
      current: '24.6%',
      target: '26.5%',
      benchmark: '≥ 22.0% - 28.0%',
      status: 'green',
      trend: '+2.3% YoY',
      isPositive: true,
      impact: 'Top-Quartile Channel Partner Loyalty',
      formula: '(Distributor Net Operating Profit / Working Capital) × 100',
      action: 'Protect distributor territory exclusivity within a 45-km radius to maintain volume density.'
    },
    {
      id: 'kpi-8',
      pillar: 'esg',
      name: 'OEM Approval & Bio-Lubricant Portfolio',
      current: '79.2%',
      target: '85.0%',
      benchmark: '≥ 75.0% Portfolio Coverage',
      status: 'green',
      trend: '+5.5% YoY',
      isPositive: true,
      impact: '100% Warranty Compliance in Core Fleets',
      formula: '(Volume Covered by Active OEM Approval / Total Volume) × 100',
      action: 'Secure OEM certifications for next-gen hydraulic HEES fluids and EV driveline e-fluids.'
    }
  ];

  const filteredScorecard = useMemo(() => {
    if (selectedPillar === 'all') return executiveScorecard;
    return executiveScorecard.filter(k => k.pillar === selectedPillar);
  }, [selectedPillar, executiveScorecard]);

  // 3. Margin & Product Mix Waterfall Simulation Data
  const productMixEconomics = [
    { segment: 'Fully Synthetic (0W-20, 5W-30, CK-4)', shortName: 'Synthetic (CK-4/SP)', sharePct: 28, gmPerKL: 58000, volumeKL: 285000, revenueCr: 997.5, gmCr: 165.3 },
    { segment: 'Semi-Synthetic & High-Tier Fleet (15W-40, UTTO)', shortName: 'Semi-Synth & UTTO', sharePct: 34, gmPerKL: 32000, volumeKL: 346000, revenueCr: 865.0, gmCr: 110.7 },
    { segment: 'Industrial Hyd (HLP 68) & Gear (CLP 220/320)', shortName: 'Industrial Hyd/Gear', sharePct: 23, gmPerKL: 26500, volumeKL: 234000, revenueCr: 514.8, gmCr: 62.0 },
    { segment: 'Commercial Monograde & Process Oils', shortName: 'Monograde Mineral', sharePct: 15, gmPerKL: 16500, volumeKL: 152000, revenueCr: 273.6, gmCr: 25.1 }
  ];

  // 4. Regional Territory Health & White-Spot Deficit Index
  const territoryHealthData = [
    { zone: 'West Zone', fullName: 'West (MH, GJ, GA)', addressableKL: 1820000, capturedKL: 1180000, gapKL: 640000, healthScore: 88, dsoDays: 28.5, otifPct: 96.2 },
    { zone: 'South Zone', fullName: 'South (TN, KA, TS, AP, KL)', addressableKL: 1540000, capturedKL: 980000, gapKL: 560000, healthScore: 84, dsoDays: 29.8, otifPct: 95.4 },
    { zone: 'North Zone', fullName: 'North (DL, HR, PB, UP, RJ)', addressableKL: 1390000, capturedKL: 790000, gapKL: 600000, healthScore: 78, dsoDays: 34.2, otifPct: 93.1 },
    { zone: 'East & Central', fullName: 'East & Central (WB, OD, JH, CG, MP)', addressableKL: 950000, capturedKL: 510000, gapKL: 440000, healthScore: 72, dsoDays: 36.5, otifPct: 91.8 }
  ];

  // 5. Strategic Radar Comparison (Current vs Industry World-Class Benchmark)
  const radarData = [
    { metric: 'White-Spot Penetration', Current: 68, Benchmark: 85, Max: 100 },
    { metric: 'Synthetic Mix (%)', Current: 74, Benchmark: 90, Max: 100 },
    { metric: 'OTIF Fulfillment', Current: 95, Benchmark: 98, Max: 100 },
    { metric: 'Distributor ROCE', Current: 82, Benchmark: 90, Max: 100 },
    { metric: 'Credit Control (DSO)', Current: 76, Benchmark: 92, Max: 100 },
    { metric: 'Multi-Source Coverage', Current: 88, Benchmark: 95, Max: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Leadership Executive Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-purple-300" />
                  C-SUITE &amp; EXECUTIVE STRATEGY
                </span>
                <span className="text-slate-400 text-xs font-semibold">| FY 2026-27 Strategic Governance</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Executive Leadership KPI &amp; Value Realization Scorecard
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
                Strategic decision engine balancing <strong>Market Share Expansion</strong>, <strong>Gross Margin per KiloLitre (GM/KL)</strong>, <strong>Supply Chain OTIF Resilience</strong>, and <strong>Distributor Capital Efficiency</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateToTab && onNavigateToTab('brandValidation')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold text-white transition-all flex items-center gap-2 backdrop-blur-sm"
              >
                <Calendar className="w-4 h-4 text-purple-300" />
                <span>3-YR DATA VALIDATION</span>
              </button>
              <button
                onClick={() => onNavigateToTab && onNavigateToTab('businessCase')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold text-white transition-all flex items-center gap-2 backdrop-blur-sm"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>CAPEX &amp; IRR SIMULATOR</span>
              </button>
              <button
                onClick={() => onNavigateToTab && onNavigateToTab('distributor')}
                className="px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-2xl text-xs font-black text-white transition-all flex items-center gap-2 shadow-lg shadow-purple-900/30"
              >
                <Target className="w-4 h-4" />
                <span>36 WHITE-SPOT CORRIDORS</span>
              </button>
            </div>
          </div>

          {/* Interactive Executive Simulation Levers */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>White-Spot Target Capture</span>
                <span className="text-purple-400 font-black">{whiteSpotCaptureTarget}%</span>
              </div>
              <input
                type="range"
                min={30}
                max={90}
                step={5}
                value={whiteSpotCaptureTarget}
                onChange={e => setWhiteSpotCaptureTarget(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Yield: {whiteSpotCaptureKL.toLocaleString()} KL/yr (~₹{estimatedGrossProfitCr} Cr GM)</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>Synthetic Mix Target</span>
                <span className="text-emerald-400 font-black">{syntheticConversionPush}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={60}
                step={2}
                value={syntheticConversionPush}
                onChange={e => setSyntheticConversionPush(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Adds +₹6,800/KL blended gross margin</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>FTL Consolidation Goal</span>
                <span className="text-blue-400 font-black">{freightOptimizationGoal}%</span>
              </div>
              <input
                type="range"
                min={75}
                max={98}
                step={1}
                value={freightOptimizationGoal}
                onChange={e => setFreightOptimizationGoal(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Reduces secondary logistics cost by 14%</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>Target Horizon</span>
                <span className="text-amber-400 font-bold">{targetTimeHorizon.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-2">
                {(['18mo', '36mo', '60mo'] as const).map(horizon => (
                  <button
                    key={horizon}
                    onClick={() => setTargetTimeHorizon(horizon)}
                    className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                      targetTimeHorizon === horizon 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'bg-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {horizon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Executive KPI Summary Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Addressable Market</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {(totalDemandKL / 1000000).toFixed(2)}M <span className="text-sm font-normal text-slate-500">KL</span>
            </span>
            <span className="text-xs font-black text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +5.8% CAGR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Ground validated across 780+ districts</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase tracking-wider">
            <span>White-Spot Deficit Gap</span>
            <Target className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-900">
              {(totalWhiteSpotGapKL / 1000000).toFixed(2)}M <span className="text-sm font-normal text-amber-700">KL</span>
            </span>
            <span className="text-xs font-black text-purple-600">
              36 Priority Hubs
            </span>
          </div>
          <p className="text-xs text-amber-700/80 mt-1">₹{estimatedRevenueFromCaptureCr} Cr addressable revenue target</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <span>Current Network Volume</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-900">
              {(totalDistributorThroughputKL / 1000).toFixed(1)}k <span className="text-sm font-normal text-emerald-700">KL/yr</span>
            </span>
            <span className="text-xs font-black text-emerald-600">
              {distributors.length} Ground Nodes
            </span>
          </div>
          <p className="text-xs text-emerald-700/80 mt-1">{pacsCount} PACS Agri + {omcDepotCount} OMC Rail Sidings</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-blue-700 uppercase tracking-wider">
            <span>Avg Blended Gross Margin</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-blue-900">
              ₹33.5k <span className="text-sm font-normal text-blue-700">/ KL</span>
            </span>
            <span className="text-xs font-black text-emerald-600">
              +14% w/ Synthetic
            </span>
          </div>
          <p className="text-xs text-blue-700/80 mt-1">Synthetics deliver up to ₹58,000/KL GM</p>
        </div>
      </div>

      {/* 3. Executive Strategic Scorecard Matrix */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div>
            <span className="text-xs font-black text-[#7C3AED] uppercase tracking-wider block">STRATEGIC GOVERNANCE</span>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">Leadership Balanced Scorecard &amp; Action Triggers</h2>
          </div>

          {/* Pillar Navigation Chips */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/70">
            {[
              { id: 'all', label: 'All 8 KPIs' },
              { id: 'commercial', label: 'Commercial & Market Share' },
              { id: 'margins', label: 'Margin & Mix' },
              { id: 'supplyChain', label: 'Supply Chain & OTIF' },
              { id: 'workingCapital', label: 'Capital & ROCE' },
              { id: 'esg', label: 'OEM & ESG' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPillar(p.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedPillar === p.id 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scorecard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Strategic Metric &amp; Calculation</th>
                <th className="pb-3">Current Status</th>
                <th className="pb-3">Target Benchmark</th>
                <th className="pb-3">YoY Trend</th>
                <th className="pb-3">Business Value Impact</th>
                <th className="pb-3 pr-2 text-right">Executive Decision / Action Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredScorecard.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-purple-50/30 transition-colors group">
                  <td className="py-4 pl-2">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        kpi.status === 'green' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <span>{kpi.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5 max-w-sm">
                      {kpi.formula}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm font-black text-slate-900">{kpi.current}</span>
                  </td>
                  <td className="py-4">
                    <span className="font-bold text-[#7C3AED] bg-purple-50 px-2 py-1 rounded-lg border border-purple-200/60">
                      {kpi.target}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">{kpi.benchmark}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center w-fit gap-1">
                      <ArrowUpRight className="w-3 h-3" /> {kpi.trend}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="font-semibold text-slate-700 block">{kpi.impact}</span>
                  </td>
                  <td className="py-4 pr-2 text-right">
                    <span className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/80 inline-block text-left max-w-xs font-medium">
                      {kpi.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Strategic Deep Dives: Product Mix Margin Waterfall & Regional Territory Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Mix Economics Waterfall */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-black text-emerald-600 uppercase tracking-wider block">MARGIN ARCHITECTURE</span>
                <h3 className="text-lg font-black text-slate-900">Gross Margin Yield by Fluid Category</h3>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                Synthetic Multiplier
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Higher-tier synthetic formulations generate <strong>2.7x greater gross profit per KL</strong> compared to standard monograde mineral products.
            </p>

            <div className="h-72 w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productMixEconomics} layout="vertical" margin={{ top: 10, right: 35, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(val) => `₹${val / 1000}k`} 
                    tick={{ fontSize: 11, fill: '#64748B' }} 
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="shortName" 
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} 
                    width={110}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }}
                    formatter={(val: any, name: string) => [
                      name === 'gmPerKL' ? `₹${Number(val).toLocaleString()} / KL` : `${val}%`, 
                      name === 'gmPerKL' ? 'Gross Margin / KL' : 'Volume Share'
                    ]}
                  />
                  <Bar dataKey="gmPerKL" fill="#7C3AED" radius={[0, 8, 8, 0]} name="Gross Margin / KL (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {productMixEconomics.map((p, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl p-2">
                <span className="text-[10px] text-slate-500 font-bold block truncate">{p.segment.split(' ')[0]}</span>
                <span className="text-xs font-black text-slate-900">₹{(p.gmPerKL / 1000).toFixed(1)}k <span className="text-[9px] text-slate-400">/KL</span></span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">{p.sharePct}% Vol</span>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Territory Health Index & Lead Time Performance */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-black text-blue-600 uppercase tracking-wider block">GEOGRAPHIC HEALTH</span>
                <h3 className="text-lg font-black text-slate-900">Zone-Wise Demand, Gap &amp; OTIF Health</h3>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200/60">
                4 Macro Zones
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Western and Southern corridors exhibit high operational health, while Eastern &amp; Central mining hubs present significant white-spot expansion opportunities.
            </p>

            <div className="h-72 w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={territoryHealthData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="zone" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} axisLine={{ stroke: '#CBD5E1' }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }}
                    formatter={(val: any, name: string) => [
                      `${(Number(val) / 1000).toLocaleString()}k KL`, 
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                  <Bar dataKey="capturedKL" name="Captured Vol (KL)" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="gapKL" name="Unmet White-Spot Gap (KL)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {territoryHealthData.map((z, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl p-2 text-center">
                <span className="text-[10px] text-slate-500 font-bold block truncate">{z.zone.split(' ')[0]} Zone</span>
                <span className="text-xs font-black text-slate-900">{z.healthScore}/100 Health</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{z.otifPct}% OTIF | {z.dsoDays}d DSO</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Strategic Radar Comparison & Executive Playbook */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar: Company Current vs World-Class Target */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <span className="text-xs font-black text-purple-600 uppercase tracking-wider block">COMPETITIVE BENCHMARKING</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">Strategic Capabilities Radar</h3>
            <p className="text-xs text-slate-500 mt-1">
              Assessment of active channel maturity against world-class downstream benchmarks.
            </p>

            <div className="h-72 w-full min-h-[280px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94A3B8' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }}
                    formatter={(val: any, name: string) => [`${val}/100`, name]}
                  />
                  <Radar name="Current Performance" dataKey="Current" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.4} />
                  <Radar name="Target Benchmark" dataKey="Benchmark" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-purple-50/60 border border-purple-200/60 rounded-2xl p-3 text-xs text-purple-900 font-semibold mt-4">
            🚀 <strong>Primary Strategic Upside</strong>: Closing the White-Spot penetration gap in East/Central and accelerating synthetic PCMO/HDEO conversions.
          </div>
        </div>

        {/* Executive Action Playbook */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-black text-[#7C3AED] uppercase tracking-wider block">EXECUTIVE ACTION PLAYBOOK</span>
                <h3 className="text-lg font-black text-slate-900">Priority 90-Day Execution Roadmap</h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60">
                Board Level Approval
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-purple-900 font-black text-xs uppercase">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Appoint Super Stockists in Top 10 White-Spots</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Focus on <strong>Dahej PCPIR</strong>, <strong>Raigad / JNPT</strong>, <strong>Angul Steel</strong>, and <strong>Ludhiana Tractor Corridor</strong> to capture ~340k KL/yr of unsatisfied fluid demand.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-purple-700 font-bold border-t border-slate-200/60 pt-2">
                  <span>Target: ₹84 Cr EBITDA Addition</span>
                  <span className="text-slate-400">Owner: VP Commercial</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Scale PACS Agri-Cooperative Partnerships</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Deepen distribution ties with <strong>Markfed Punjab</strong>, <strong>HAFED Haryana</strong>, and <strong>TANFED Tamil Nadu</strong> for UTTO transmission fluid and 20W-40 seasonal demand.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-700 font-bold border-t border-slate-200/60 pt-2">
                  <span>Target: 185k KL Agri Capture</span>
                  <span className="text-slate-400">Owner: Rural Head</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Enforce Synthetic Premiumization Strategy</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Phase out low-margin monograde CF-4; tie distributor rebates and quarterly sales incentives strictly to CK-4 15W-40 and Euro-VI PCMO synthetic volume.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-blue-700 font-bold border-t border-slate-200/60 pt-2">
                  <span>Target: +₹6,800/KL GM Realization</span>
                  <span className="text-slate-400">Owner: Head of Marketing</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">4</span>
                  <span>Automate DSO &amp; Dynamic Credit Control</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Integrate ERP-level credit stop rules for receivables &gt; 35 days; introduce dynamic 1.5% 7-day cash settlement discounts to shorten working capital cycles.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-amber-700 font-bold border-t border-slate-200/60 pt-2">
                  <span>Target: Reduce DSO to 26 Days</span>
                  <span className="text-slate-400">Owner: Chief Financial Officer</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              * Governance metrics updated daily against active VAHAN 4.0, PPAC, and Ground GIS telemetry.
            </span>
            <button
              onClick={() => onNavigateToTab && onNavigateToTab('businessCase')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <span>RUN SENSITIVITY SIMULATION</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
