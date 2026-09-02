import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Sliders, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2,
  ArrowRight,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  LabelList
} from 'recharts';
import { LocationRecord, FinancialAssumptions } from '../../types';
import { calculateBusinessCase, formatINR, formatKL } from '../../utils/demandEngine';

interface BusinessCaseSimulatorProps {
  locations: LocationRecord[];
  selectedLocation: LocationRecord;
  onSelectLocation: (loc: LocationRecord) => void;
  financialAssumptions: FinancialAssumptions;
  onAssumptionsChange: (assumptions: FinancialAssumptions) => void;
}

export const BusinessCaseSimulator: React.FC<BusinessCaseSimulatorProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  financialAssumptions,
  onAssumptionsChange
}) => {
  const [activeScenario, setActiveScenario] = useState<'Conservative' | 'Base' | 'Aggressive'>(
    financialAssumptions.scenario
  );
  const [chartMode, setChartMode] = useState<'cashflow' | 'waterfall'>('cashflow');

  const loc = selectedLocation;
  const businessCase = calculateBusinessCase(loc, financialAssumptions);

  const handleScenarioSelect = (scenario: 'Conservative' | 'Base' | 'Aggressive') => {
    setActiveScenario(scenario);
    if (scenario === 'Conservative') {
      onAssumptionsChange({
        ...financialAssumptions,
        scenario: 'Conservative',
        targetMarketSharePct: 8.0,
        avgSellingPricePerLiterINR: 270.0,
        grossMarginPct: 22.0,
        initialCapexINR: 2.8
      });
    } else if (scenario === 'Base') {
      onAssumptionsChange({
        ...financialAssumptions,
        scenario: 'Base',
        targetMarketSharePct: 15.0,
        avgSellingPricePerLiterINR: 285.0,
        grossMarginPct: 26.5,
        initialCapexINR: 3.5
      });
    } else {
      onAssumptionsChange({
        ...financialAssumptions,
        scenario: 'Aggressive',
        targetMarketSharePct: 25.0,
        avgSellingPricePerLiterINR: 300.0,
        grossMarginPct: 32.0,
        initialCapexINR: 4.8
      });
    }
  };

  // Generate 5-Year Cash Flow Projection Data
  const capex = businessCase.capexInvestmentINR;
  const annualEbitda = businessCase.annualEbitdaINR;
  const cashFlowData = [
    { year: 'Yr 0 (CAPEX)', netAnnual: -capex, cumulative: -capex, benchmark: 0 },
    { year: 'Yr 1 (Ramp)', netAnnual: annualEbitda * 0.75, cumulative: -capex + (annualEbitda * 0.75), benchmark: 0 },
    { year: 'Yr 2 (Mature)', netAnnual: annualEbitda * 1.0, cumulative: -capex + (annualEbitda * 1.75), benchmark: 0 },
    { year: 'Yr 3 (Expansion)', netAnnual: annualEbitda * 1.15, cumulative: -capex + (annualEbitda * 2.90), benchmark: 0 },
    { year: 'Yr 4 (Scale)', netAnnual: annualEbitda * 1.25, cumulative: -capex + (annualEbitda * 4.15), benchmark: 0 },
    { year: 'Yr 5 (Peak)', netAnnual: annualEbitda * 1.35, cumulative: -capex + (annualEbitda * 5.50), benchmark: 0 }
  ];

  // Financial Waterfall Components
  const waterfallData = [
    { item: 'Gross Revenue', amount: businessCase.annualRevenueINR, fill: '#3b82f6' },
    { item: 'COGS & Base Oil', amount: -(businessCase.annualRevenueINR - businessCase.grossMarginINR), fill: '#ef4444' },
    { item: 'Gross Margin', amount: businessCase.grossMarginINR, fill: '#10b981' },
    { item: 'Logistics & Depot', amount: -(businessCase.annualOpexINR * 0.55), fill: '#f97316' },
    { item: 'SG&A / Manpower', amount: -(businessCase.annualOpexINR * 0.45), fill: '#eab308' },
    { item: 'Operating EBITDA', amount: businessCase.annualEbitdaINR, fill: '#F27D26' }
  ];

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs text-slate-800 z-50 min-w-[180px]">
          <div className="text-[11px] font-bold text-[#7C3AED] border-b border-slate-100 pb-1 mb-2 uppercase">
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`entry-${index}`} className="flex justify-between items-center text-[10px] gap-2 py-0.5">
              <span style={{ color: entry.color || entry.fill }}>{entry.name}:</span>
              <strong className={entry.value < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                ₹{entry.value >= 0 ? entry.value.toFixed(2) : `(${Math.abs(entry.value).toFixed(2)})`} Cr
              </strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Commercial Feasibility &amp; Unit Economics Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            CAPEX Recovery • Pro-Forma EBITDA Waterfall • Sensitivity Analysis for {loc.name}
          </p>
        </div>

        {/* Location selector dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Target Spot:</span>
          <select
            value={loc.id}
            onChange={e => {
              const target = locations.find(l => l.id === e.target.value);
              if (target) onSelectLocation(target);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500 font-bold"
          >
            {locations.map(l => (
              <option key={l.id} value={l.id}>
                {l.stateCode} — {l.name} (Deficit: {l.supplyGapKL.toLocaleString()} KL)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario Preset Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {[
          { id: 'Conservative', label: 'Conservative Case', share: '8% Share', margin: '22% Margin', desc: 'Slow ramp-up in highly contested retail micro-pockets' },
          { id: 'Base', label: 'Base Investment Case', share: '15% Share', margin: '26.5% Margin', desc: 'Standard distributor deployment with primary stock depot' },
          { id: 'Aggressive', label: 'Aggressive Expansion', share: '25% Share', margin: '32% Margin', desc: 'Direct OEM anchor tie-ups with dense secondary network' }
        ].map(sc => (
          <button
            key={sc.id}
            onClick={() => handleScenarioSelect(sc.id as any)}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
              activeScenario === sc.id
                ? 'border-[#7C3AED] bg-purple-50/70 text-slate-900 shadow-sm'
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700 shadow-2xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900">{sc.label}</span>
                {activeScenario === sc.id && (
                  <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{sc.desc}</p>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
              <span className="text-[#7C3AED] font-bold">{sc.share}</span>
              <span className="text-emerald-700 font-bold">{sc.margin}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 4 Core Financial Return KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Captured Volume Target</span>
          <span className="text-2xl font-extrabold text-[#7C3AED] mt-1 block">
            {businessCase.capturedVolumeKL.toLocaleString()} <span className="text-sm font-normal text-slate-500">KL/yr</span>
          </span>
          <span className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 block">
            {(businessCase.capturedVolumeKL / 12).toFixed(0)} KL Monthly Throughput
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Annual Gross Revenue</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            {formatINR(businessCase.annualRevenueINR)}
          </span>
          <span className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 block">
            ASP: ₹{financialAssumptions.avgSellingPricePerLiterINR}/L
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Annual Operating EBITDA</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
            {formatINR(businessCase.annualEbitdaINR)}
          </span>
          <span className="text-xs text-emerald-700 mt-2 pt-2 border-t border-slate-100 block font-semibold">
            Net Margin: {businessCase.netMarginPct}%
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Payback &amp; 5-Yr ROI</span>
          <span className="text-2xl font-extrabold text-indigo-700 mt-1 block">
            {businessCase.paybackPeriodYears} <span className="text-sm font-normal text-slate-500">Years</span>
          </span>
          <span className="text-xs text-indigo-700 mt-2 pt-2 border-t border-slate-100 block font-semibold">
            5-Year ROI: +{businessCase.fiveYearRoiPct}%
          </span>
        </div>
      </div>

      {/* Interactive Financial Graphs Panel */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              {chartMode === 'cashflow' 
                ? '5-Year Cumulative Cash Flow Curve & Break-Even Horizon' 
                : 'Annual Pro-Forma EBITDA Waterfall & Cost Structure'}
            </h3>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setChartMode('cashflow')}
              className={`px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 ${
                chartMode === 'cashflow' ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Cash Flow &amp; Payback</span>
            </button>
            <button
              onClick={() => setChartMode('waterfall')}
              className={`px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 ${
                chartMode === 'waterfall' ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>EBITDA Waterfall</span>
            </button>
          </div>
        </div>

        <div className="h-[300px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'cashflow' ? (
              <ComposedChart data={cashFlowData} margin={{ top: 20, right: 30, left: 15, bottom: 10 }}>
                <defs>
                  <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="year" stroke="#94A3B8" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => `₹${val.toFixed(1)} Cr`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                  formatter={(val) => <span className="text-slate-700 font-medium">{val}</span>}
                />
                <ReferenceLine y={0} stroke="#F43F5E" strokeDasharray="3 3" />
                <Bar dataKey="netAnnual" name="Net Annual Cash Flow (₹ Cr)" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                  <LabelList 
                    dataKey="netAnnual" 
                    position="top" 
                    formatter={(val: any) => `₹${Number(val).toFixed(1)}Cr`} 
                    style={{ fill: '#334155', fontSize: 9, fontWeight: 700 }} 
                  />
                </Bar>
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative Free Cash Flow (₹ Cr)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill="url(#cumulativeGrad)"
                />
              </ComposedChart>
            ) : (
              <BarChart data={waterfallData} margin={{ top: 20, right: 25, left: 15, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis 
                  dataKey="item" 
                  stroke="#94A3B8" 
                  tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }} 
                  angle={-25} 
                  textAnchor="end" 
                  height={45}
                  interval={0}
                />
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => `₹${val.toFixed(1)} Cr`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="amount" name="Financial Line Item (₹ Cr)" radius={[4, 4, 0, 0]}>
                  <LabelList 
                    dataKey="amount" 
                    position="top" 
                    formatter={(val: any) => `₹${Number(val).toFixed(1)}Cr`} 
                    style={{ fill: '#334155', fontSize: 9, fontWeight: 700 }} 
                  />
                  {waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Grid: Interactive Assumption Sliders (Left) & Financial Waterfall Statement (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Sliders (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#7C3AED]" />
              Adjust Commercial &amp; OPEX Parameters
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Dynamic Recalc</span>
          </div>

          {/* Slider 1: Target Market Share */}
          <div className="text-xs">
            <div className="flex justify-between mb-1.5 text-xs">
              <span className="text-slate-500 font-medium">Target Market Share:</span>
              <span className="text-[#7C3AED] font-extrabold">{financialAssumptions.targetMarketSharePct}%</span>
            </div>
            <input
              type="range"
              min="2"
              max="45"
              step="1"
              value={financialAssumptions.targetMarketSharePct}
              onChange={e => onAssumptionsChange({ ...financialAssumptions, targetMarketSharePct: Number(e.target.value) })}
              className="w-full accent-[#7C3AED] cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Slider 2: Average Selling Price */}
          <div className="text-xs">
            <div className="flex justify-between mb-1.5 text-xs">
              <span className="text-slate-500 font-medium">Average Selling Price (₹/Liter):</span>
              <span className="text-[#7C3AED] font-extrabold">₹{financialAssumptions.avgSellingPricePerLiterINR}</span>
            </div>
            <input
              type="range"
              min="180"
              max="450"
              step="5"
              value={financialAssumptions.avgSellingPricePerLiterINR}
              onChange={e => onAssumptionsChange({ ...financialAssumptions, avgSellingPricePerLiterINR: Number(e.target.value) })}
              className="w-full accent-[#7C3AED] cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Slider 3: Gross Margin % */}
          <div className="text-xs">
            <div className="flex justify-between mb-1.5 text-xs">
              <span className="text-slate-500 font-medium">Gross Margin %:</span>
              <span className="text-emerald-700 font-extrabold">{financialAssumptions.grossMarginPct}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              step="0.5"
              value={financialAssumptions.grossMarginPct}
              onChange={e => onAssumptionsChange({ ...financialAssumptions, grossMarginPct: Number(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Slider 4: Initial CAPEX */}
          <div className="text-xs">
            <div className="flex justify-between mb-1.5 text-xs">
              <span className="text-slate-500 font-medium">Initial CAPEX (Depot &amp; Racks):</span>
              <span className="text-slate-900 font-extrabold">₹{financialAssumptions.initialCapexINR} Cr</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.25"
              value={financialAssumptions.initialCapexINR}
              onChange={e => onAssumptionsChange({ ...financialAssumptions, initialCapexINR: Number(e.target.value) })}
              className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Slider 5: Warehouse Lease Rate */}
          <div className="text-xs">
            <div className="flex justify-between mb-1.5 text-xs">
              <span className="text-slate-500 font-medium">Warehouse Lease (₹/sq ft/mo):</span>
              <span className="text-slate-700 font-extrabold">₹{financialAssumptions.warehouseRentPerSqFtINR}</span>
            </div>
            <input
              type="range"
              min="15"
              max="60"
              step="1"
              value={financialAssumptions.warehouseRentPerSqFtINR}
              onChange={e => onAssumptionsChange({ ...financialAssumptions, warehouseRentPerSqFtINR: Number(e.target.value) })}
              className="w-full accent-slate-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>
        </div>

        {/* Right Financial Unit Economics Statement (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Annual Pro-Forma Income Statement
              </h3>
              <span className="text-xs text-[#7C3AED] font-bold uppercase">
                {loc.name}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 uppercase text-[10px] font-bold">Gross Revenue:</span>
                <strong className="text-slate-900">{formatINR(businessCase.annualRevenueINR)}</strong>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 uppercase text-[10px] font-bold">Gross Margin ({financialAssumptions.grossMarginPct}%):</span>
                <strong className="text-emerald-700">{formatINR(businessCase.grossMarginINR)}</strong>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-rose-600 uppercase text-[10px] font-bold">Total Annual OPEX:</span>
                <strong className="text-rose-600">-{formatINR(businessCase.annualOpexINR)}</strong>
              </div>

              <div className="flex justify-between p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 font-bold">
                <span className="text-emerald-800 uppercase text-[10px]">Annual Operating EBITDA:</span>
                <strong className="text-emerald-700 text-sm">{formatINR(businessCase.annualEbitdaINR)}</strong>
              </div>
            </div>

            {/* Payback Summary */}
            <div className="mt-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex justify-between mb-1.5 text-xs">
                <span className="text-slate-500">Initial CAPEX:</span>
                <strong className="text-slate-900">{formatINR(businessCase.capexInvestmentINR)}</strong>
              </div>
              <div className="flex justify-between mb-1.5 text-xs">
                <span className="text-slate-500">Payback Horizon:</span>
                <strong className="text-[#7C3AED] font-bold">{businessCase.paybackPeriodYears} Years</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">5-Year ROI:</span>
                <strong className="text-emerald-700 font-bold">+{businessCase.fiveYearRoiPct}%</strong>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Status: Feasible</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1 uppercase text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Investment Grade Approved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

