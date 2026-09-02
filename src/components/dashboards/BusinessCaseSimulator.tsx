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
  ReferenceLine
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
        <div className="bg-[#0E1117]/95 border border-[#374151] p-3 rounded shadow-2xl font-mono text-xs text-gray-200 z-50 min-w-[180px]">
          <div className="text-[11px] font-bold text-[#F27D26] border-b border-[#1F2937] pb-1 mb-2 uppercase">
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`entry-${index}`} className="flex justify-between items-center text-[10px] gap-2">
              <span style={{ color: entry.color || entry.fill }}>{entry.name}:</span>
              <strong className={entry.value < 0 ? 'text-red-400' : 'text-green-400'}>
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
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#F27D26]" />
            Commercial Feasibility &amp; Unit Economics Simulator
          </h2>
          <p className="text-[10px] font-mono text-gray-500">
            CAPEX RECOVERY // PRO-FORMA EBITDA WATERFALL // SENSITIVITY FOR {loc.name.toUpperCase()}
          </p>
        </div>

        {/* Location selector dropdown */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-[10px] text-gray-500 uppercase">TARGET SPOT:</span>
          <select
            value={loc.id}
            onChange={e => {
              const target = locations.find(l => l.id === e.target.value);
              if (target) onSelectLocation(target);
            }}
            className="bg-[#0A0B0E] border border-[#374151] text-gray-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#F27D26] font-bold"
          >
            {locations.map(l => (
              <option key={l.id} value={l.id}>
                {l.stateCode} — {l.name.toUpperCase()} (DEFICIT: {l.supplyGapKL.toLocaleString()} KL)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario Preset Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { id: 'Conservative', label: 'CONSERVATIVE CASE', share: '8% SHARE', margin: '22% MARGIN', desc: 'Slow ramp-up in highly contested retail micro-pockets' },
          { id: 'Base', label: 'BASE INVESTMENT CASE', share: '15% SHARE', margin: '26.5% MARGIN', desc: 'Standard distributor deployment with primary stock depot' },
          { id: 'Aggressive', label: 'AGGRESSIVE EXPANSION', share: '25% SHARE', margin: '32% MARGIN', desc: 'Direct OEM anchor tie-ups with dense secondary network' }
        ].map(sc => (
          <button
            key={sc.id}
            onClick={() => handleScenarioSelect(sc.id as any)}
            className={`p-3.5 rounded-sm border-l-2 text-left transition-all flex flex-col justify-between ${
              activeScenario === sc.id
                ? 'border-[#F27D26] bg-[#1F2937] border-t border-r border-b border-[#F27D26]/40'
                : 'border-[#1F2937] bg-[#0E1117] border-t border-r border-b hover:bg-[#151921]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs font-mono text-white uppercase">{sc.label}</span>
                {activeScenario === sc.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F27D26]" />
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-sans leading-relaxed mb-2">{sc.desc}</p>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-[#1F2937]">
              <span className="text-[#F27D26] font-bold">{sc.share}</span>
              <span className="text-green-400 font-bold">{sc.margin}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 4 Core Financial Return KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-[#F27D26]">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Captured Volume Target</span>
          <span className="text-xl font-bold text-[#F27D26] mt-1 block">
            {businessCase.capturedVolumeKL.toLocaleString()} KL / YR
          </span>
          <span className="text-[10px] text-gray-400 mt-1 block">
            {(businessCase.capturedVolumeKL / 12).toFixed(0)} KL MONTHLY THROUGHPUT
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-white">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Annual Gross Revenue</span>
          <span className="text-xl font-bold text-white mt-1 block">
            {formatINR(businessCase.annualRevenueINR)}
          </span>
          <span className="text-[10px] text-gray-400 mt-1 block">
            ASP: ₹{financialAssumptions.avgSellingPricePerLiterINR}/L
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-green-500">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Annual Operating EBITDA</span>
          <span className="text-xl font-bold text-green-400 mt-1 block">
            {formatINR(businessCase.annualEbitdaINR)} / YR
          </span>
          <span className="text-[10px] text-green-400 mt-1 block font-semibold">
            NET MARGIN: {businessCase.netMarginPct}%
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-purple-500">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Payback &amp; 5-Yr ROI</span>
          <span className="text-xl font-bold text-purple-300 mt-1 block">
            {businessCase.paybackPeriodYears} YEARS
          </span>
          <span className="text-[10px] text-purple-300 mt-1 block font-semibold">
            5-YEAR ROI: +{businessCase.fiveYearRoiPct}%
          </span>
        </div>
      </div>

      {/* Interactive Financial Graphs Panel */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] pb-3 mb-4">
          <div className="flex items-center gap-2 font-mono">
            <BarChart3 className="w-4 h-4 text-[#F27D26]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">
              {chartMode === 'cashflow' 
                ? '5-Year Cumulative Cash Flow Curve & Break-Even Horizon' 
                : 'Annual Pro-Forma EBITDA Waterfall & Cost Structure'}
            </h3>
          </div>

          <div className="flex items-center bg-[#0A0B0E] rounded p-0.5 border border-[#374151] text-[10px] font-mono">
            <button
              onClick={() => setChartMode('cashflow')}
              className={`px-3 py-1 rounded transition-colors font-bold flex items-center gap-1.5 ${
                chartMode === 'cashflow' ? 'bg-[#F27D26] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3 h-3" />
              <span>CASH FLOW &amp; PAYBACK</span>
            </button>
            <button
              onClick={() => setChartMode('waterfall')}
              className={`px-3 py-1 rounded transition-colors font-bold flex items-center gap-1.5 ${
                chartMode === 'waterfall' ? 'bg-[#F27D26] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>EBITDA WATERFALL</span>
            </button>
          </div>
        </div>

        <div className="h-[280px] w-full font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'cashflow' ? (
              <ComposedChart data={cashFlowData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="year" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  tickFormatter={(val) => `₹${val.toFixed(1)}Cr`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                <Bar dataKey="netAnnual" name="Net Annual Cash Flow (₹ Cr)" fill="#3b82f6" />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative Free Cash Flow (₹ Cr)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#cumulativeGrad)"
                />
              </ComposedChart>
            ) : (
              <BarChart data={waterfallData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="item" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  tickFormatter={(val) => `₹${val.toFixed(1)}Cr`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="amount" name="Financial Line Item (₹ Cr)">
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
        <div className="lg:col-span-6 bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#F27D26]" />
              Adjust Commercial &amp; OPEX Parameters
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">DYNAMIC RECALC</span>
          </div>

          {/* Slider 1: Target Market Share */}
          <div className="text-xs font-mono">
            <div className="flex justify-between mb-1 text-[10px]">
              <span className="text-gray-400">TARGET MARKET SHARE:</span>
              <span className="text-[#F27D26] font-bold">{financialAssumptions.targetMarketSharePct}%</span>
            </div>
            <input
              type="range"
              min="2"
              max="45"
              step="1"
              value={financialAssumptions.targetMarketSharePct}
              onChange={e => onAssumptionsChange({ ...financialAssumptions, targetMarketSharePct: Number(e.target.value) })}
              className="w-full accent-[#F27D26] cursor-pointer h-1 bg-[#1F2937] rounded"
            />
          </div>

          {/* Slider 2: Average Selling Price */}
          <div className="text-xs font-mono">
            <div className="flex justify-between mb-1 text-[10px]">
              <span className="text-gray-400">AVERAGE SELLING PRICE (₹/LITER):</span>
              <span className="text-[#F27D26] font-bold">₹{financialAssumptions.avgSellingPricePerLiterINR}</span>
            </div>
            <input
              type="range"
              min="180"
              max="450"
              step="5"
              value={financialAssumptions.avgSellingPricePerLiterINR}
              onChange={e => onAssumptionsChange({ ...financialAssumptions, avgSellingPricePerLiterINR: Number(e.target.value) })}
              className="w-full accent-[#F27D26] cursor-pointer h-1 bg-[#1F2937] rounded"
            />
          </div>

          {/* Slider 3: Gross Margin % */}
          <div className="text-xs font-mono">
            <div className="flex justify-between mb-1 text-[10px]">
              <span className="text-gray-400">GROSS MARGIN %:</span>
              <span className="text-green-400 font-bold">{financialAssumptions.grossMarginPct}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              step="0.5"
              value={financialAssumptions.grossMarginPct}
              onChange={e => onAssumptionsChange({ ...financialAssumptions, grossMarginPct: Number(e.target.value) })}
              className="w-full accent-green-500 cursor-pointer h-1 bg-[#1F2937] rounded"
            />
          </div>

          {/* Slider 4: Initial CAPEX */}
          <div className="text-xs font-mono">
            <div className="flex justify-between mb-1 text-[10px]">
              <span className="text-gray-400">INITIAL CAPEX (DEPOT &amp; RACKS):</span>
              <span className="text-white font-bold">₹{financialAssumptions.initialCapexINR} CR</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.25"
              value={financialAssumptions.initialCapexINR}
              onChange={e => onAssumptionsChange({ ...financialAssumptions, initialCapexINR: Number(e.target.value) })}
              className="w-full accent-purple-500 cursor-pointer h-1 bg-[#1F2937] rounded"
            />
          </div>

          {/* Slider 5: Warehouse Lease Rate */}
          <div className="text-xs font-mono">
            <div className="flex justify-between mb-1 text-[10px]">
              <span className="text-gray-400">WAREHOUSE LEASE (₹/SQ FT/MO):</span>
              <span className="text-gray-300 font-bold">₹{financialAssumptions.warehouseRentPerSqFtINR}</span>
            </div>
            <input
              type="range"
              min="15"
              max="60"
              step="1"
              value={financialAssumptions.warehouseRentPerSqFtINR}
              onChange={e => onAssumptionsChange({ ...financialAssumptions, warehouseRentPerSqFtINR: Number(e.target.value) })}
              className="w-full accent-gray-500 cursor-pointer h-1 bg-[#1F2937] rounded"
            />
          </div>
        </div>

        {/* Right Financial Unit Economics Statement (6 cols) */}
        <div className="lg:col-span-6 bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
              <h3 className="font-bold text-xs text-white uppercase font-mono tracking-wider">
                Annual Pro-Forma Income Statement
              </h3>
              <span className="font-mono text-xs text-[#F27D26] font-bold uppercase">
                {loc.name}
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between p-2 bg-[#151921] border border-[#1F2937]">
                <span className="text-gray-400 uppercase text-[10px]">Gross Revenue:</span>
                <strong className="text-white">{formatINR(businessCase.annualRevenueINR)}</strong>
              </div>

              <div className="flex justify-between p-2 bg-[#151921] border border-[#1F2937]">
                <span className="text-gray-400 uppercase text-[10px]">Gross Margin ({financialAssumptions.grossMarginPct}%):</span>
                <strong className="text-green-400">{formatINR(businessCase.grossMarginINR)}</strong>
              </div>

              <div className="flex justify-between p-2 bg-[#151921] border border-[#1F2937]">
                <span className="text-red-400 uppercase text-[10px]">Total Annual OPEX:</span>
                <strong className="text-red-400">-{formatINR(businessCase.annualOpexINR)}</strong>
              </div>

              <div className="flex justify-between p-2 bg-[#151921] border border-green-500/40 font-bold">
                <span className="text-green-300 uppercase text-[10px]">Annual Operating EBITDA:</span>
                <strong className="text-green-400 text-sm">{formatINR(businessCase.annualEbitdaINR)}</strong>
              </div>
            </div>

            {/* Payback Summary */}
            <div className="mt-3 p-3 bg-[#151921] border border-[#1F2937] text-xs font-mono">
              <div className="flex justify-between mb-1 text-[10px]">
                <span className="text-gray-500 uppercase">Initial CAPEX:</span>
                <strong className="text-white">{formatINR(businessCase.capexInvestmentINR)}</strong>
              </div>
              <div className="flex justify-between mb-1 text-[10px]">
                <span className="text-gray-500 uppercase">Payback Horizon:</span>
                <strong className="text-[#F27D26] font-bold">{businessCase.paybackPeriodYears} YEARS</strong>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500 uppercase">5-Year ROI:</span>
                <strong className="text-green-400 font-bold">+{businessCase.fiveYearRoiPct}%</strong>
              </div>
            </div>
          </div>

          <div className="pt-2.5 mt-3 border-t border-[#1F2937] flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span>STATUS: FEASIBLE</span>
            <span className="text-green-400 font-bold flex items-center gap-1 uppercase">
              <ShieldCheck className="w-3.5 h-3.5" /> Investment Grade Approved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

