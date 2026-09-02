import React, { useState } from 'react';
import { 
  TrendingUp, 
  Zap, 
  Calendar, 
  Building2, 
  Truck, 
  Factory, 
  Flame, 
  ArrowUpRight, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  BarChart3,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { FORECAST_TRENDS, UPCOMING_MEGA_PROJECTS } from '../../data/productTaxonomy';
import { formatKL, formatINR } from '../../utils/demandEngine';

export const ForecastPipelineDashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2028);
  const [chartView, setChartView] = useState<'composed' | 'stacked' | 'evTrend'>('composed');

  const activeForecast = FORECAST_TRENDS.find(f => f.year === selectedYear) || FORECAST_TRENDS[1];

  const getStrategicNote = (year: number) => {
    switch (year) {
      case 2026:
        return 'Baseline post-pandemic industrial expansion and BS-VI synthetic lubricant migration.';
      case 2028:
        return 'Accelerating Western & Eastern DFC freight corridors; early commercial EV 2W/3W fleet penetration.';
      case 2031:
        return 'Peak ICE engine oil volume; heavy industrial CAPEX and cement/steel infrastructure consumption.';
      case 2036:
        return 'Structural ICE decline compensated by next-gen EV dielectric fluids and high-margin industrial robotics oils.';
      default:
        return 'Steady multi-sector demand growth across primary transport and manufacturing corridors.';
    }
  };

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0E1117]/95 border border-[#374151] p-3 rounded shadow-2xl font-mono text-xs text-gray-200 min-w-[200px] z-50">
          <div className="text-[11px] font-bold text-[#F27D26] border-b border-[#1F2937] pb-1 mb-2 uppercase">
            YEAR {label} OUTLOOK
          </div>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between text-[10px] gap-3">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-2 h-2 inline-block rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-bold text-white">
                  {entry.dataKey === 'evPenetrationPct' 
                    ? `${entry.value}%` 
                    : `${entry.value.toLocaleString()} KL`}
                </span>
              </div>
            ))}
          </div>
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
            <TrendingUp className="w-4 h-4 text-[#F27D26]" />
            10-Year Demand Projections &amp; EV Transition Trajectory (2026–2036)
          </h2>
          <p className="text-[10px] font-mono text-gray-500">
            STRUCTURAL SHIFTS // INDUSTRIAL EXPANSION // FLEET ELECTRIFICATION CURVE
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center bg-[#0A0B0E] rounded p-0.5 border border-[#374151] text-xs font-mono">
          {FORECAST_TRENDS.map(f => (
            <button
              key={f.year}
              onClick={() => setSelectedYear(f.year)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                selectedYear === f.year
                  ? 'bg-[#F27D26] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.year}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Forecast KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-[#F27D26]">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Projected Total Demand ({selectedYear})</span>
          <span className="text-xl font-bold text-[#F27D26] mt-1 block">
            {formatKL(activeForecast.totalDemandKL)}
          </span>
          <span className="text-[10px] text-green-400 mt-1 block font-semibold">
            +{(activeForecast.totalDemandKL - FORECAST_TRENDS[0].totalDemandKL).toLocaleString()} KL EXPANSION
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-blue-500">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Industrial Lubricants</span>
          <span className="text-xl font-bold text-blue-400 mt-1 block">
            {formatKL(activeForecast.industrialDemandKL)}
          </span>
          <span className="text-[10px] text-blue-300 mt-1 block">
            STRONG CAPEX (+10.2% CAGR)
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-white">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Automotive ICE Fleet</span>
          <span className="text-xl font-bold text-white mt-1 block">
            {formatKL(activeForecast.automotiveDemandKL)}
          </span>
          <span className="text-[10px] text-gray-400 mt-1 block">
            PEAK ICE DEMAND: 2030-2032
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-green-500">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">EV Specialized Fluids</span>
          <span className="text-xl font-bold text-green-400 mt-1 block">
            {formatKL(activeForecast.evFluidsDemandKL)}
          </span>
          <span className="text-[10px] text-green-400 mt-1 block font-semibold">
            PENETRATION: {activeForecast.evPenetrationPct}%
          </span>
        </div>
      </div>

      {/* Interactive 10-Year Projections Chart */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] pb-3 mb-4">
          <div className="flex items-center gap-2 font-mono">
            <BarChart3 className="w-4 h-4 text-[#F27D26]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">
              10-Year Macro Demand Curve &amp; Fuel-Transition Dynamics (2026–2036)
            </h3>
          </div>

          {/* Chart View Modes */}
          <div className="flex items-center bg-[#0A0B0E] rounded p-0.5 border border-[#374151] text-[10px] font-mono">
            <button
              onClick={() => setChartView('composed')}
              className={`px-2.5 py-1 rounded transition-colors font-bold ${
                chartView === 'composed' ? 'bg-[#F27D26] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              MULTI-SECTOR TRAJECTORY
            </button>
            <button
              onClick={() => setChartView('stacked')}
              className={`px-2.5 py-1 rounded transition-colors font-bold ${
                chartView === 'stacked' ? 'bg-[#F27D26] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              STACKED SECTOR VOLUME
            </button>
            <button
              onClick={() => setChartView('evTrend')}
              className={`px-2.5 py-1 rounded transition-colors font-bold ${
                chartView === 'evTrend' ? 'bg-[#F27D26] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              EV PENETRATION RATE (%)
            </button>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="h-[320px] w-full font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'composed' ? (
              <ComposedChart data={FORECAST_TRENDS} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="totalDemandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F27D26" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F27D26" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="industrialGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="year" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis
                  yAxisId="left"
                  stroke="#6B7280"
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10b981"
                  domain={[0, 40]}
                  tick={{ fill: '#10b981', fontSize: 10 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalDemandKL"
                  name="Total Demand (KL)"
                  stroke="#F27D26"
                  strokeWidth={2.5}
                  fill="url(#totalDemandGrad)"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="industrialDemandKL"
                  name="Industrial Lubricants (KL)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="automotiveDemandKL"
                  name="Automotive ICE Fleet (KL)"
                  stroke="#e5e7eb"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#e5e7eb' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="evFluidsDemandKL"
                  name="EV Dielectric Fluids (KL)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="evPenetrationPct"
                  name="EV Fleet Penetration Rate (%)"
                  stroke="#eab308"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  dot={{ r: 4, fill: '#eab308' }}
                />
              </ComposedChart>
            ) : chartView === 'stacked' ? (
              <BarChart data={FORECAST_TRENDS} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="year" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="automotiveDemandKL" name="Automotive ICE (KL)" stackId="a" fill="#4b5563" />
                <Bar dataKey="industrialDemandKL" name="Industrial Lubes (KL)" stackId="a" fill="#3b82f6" />
                <Bar dataKey="evFluidsDemandKL" name="EV Fluids (KL)" stackId="a" fill="#10b981" />
              </BarChart>
            ) : (
              <ComposedChart data={FORECAST_TRENDS} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="year" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis
                  stroke="#10b981"
                  domain={[0, 35]}
                  tick={{ fill: '#10b981', fontSize: 10 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="evPenetrationPct"
                  name="EV Fleet Penetration (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="#10b981"
                  fillOpacity={0.2}
                />
                <Line
                  type="monotone"
                  dataKey="evFluidsDemandKL"
                  name="EV Fluids Volume (KL)"
                  stroke="#F27D26"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#F27D26' }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecasting Timeline & EV Vulnerability Matrix Table */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl">
        <h3 className="font-bold text-xs text-white uppercase font-mono flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-[#F27D26]" />
          Long-Range Sector Demand Evolution &amp; EV Disruption Timeline
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1F2937] text-[10px] text-gray-500 uppercase">
                <th className="pb-2 pl-2">YEAR</th>
                <th className="pb-2 text-right">TOTAL DEMAND (KL)</th>
                <th className="pb-2 text-right">AUTOMOTIVE (KL)</th>
                <th className="pb-2 text-right">INDUSTRIAL (KL)</th>
                <th className="pb-2 text-right">EV FLUIDS (KL)</th>
                <th className="pb-2 text-right">EV PENETRATION</th>
                <th className="pb-2 pl-4">STRATEGIC IMPLICATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {FORECAST_TRENDS.map(f => (
                <tr
                  key={f.year}
                  className={`hover:bg-[#151921] transition-colors ${
                    selectedYear === f.year ? 'bg-[#1F2937] text-white font-bold' : 'text-gray-300'
                  }`}
                >
                  <td className="py-2 pl-2 font-bold text-[#F27D26]">{f.year}</td>
                  <td className="py-2 text-right">{f.totalDemandKL.toLocaleString()}</td>
                  <td className="py-2 text-right text-gray-400">{f.automotiveDemandKL.toLocaleString()}</td>
                  <td className="py-2 text-right text-blue-400">{f.industrialDemandKL.toLocaleString()}</td>
                  <td className="py-2 text-right text-green-400">{f.evFluidsDemandKL.toLocaleString()}</td>
                  <td className="py-2 text-right text-[#F27D26]">{f.evPenetrationPct}%</td>
                  <td className="py-2 pl-4 text-[10px] text-gray-400 font-sans">{getStrategicNote(f.year)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Mega Projects Catalyst Feed */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
          <div>
            <h3 className="font-bold text-xs text-white uppercase font-mono flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-[#F27D26]" />
              Major Industrial &amp; Infrastructure Projects Catalyzing Lubricant Demand
            </h3>
            <p className="text-[10px] font-mono text-gray-500">CORRIDOR CORRELATION // STEEL, CEMENT, EXPRESSWAY, &amp; METALS PIPELINE</p>
          </div>
          <span className="text-[10px] font-mono text-[#F27D26] bg-[#1F2937] px-2 py-0.5 rounded border border-[#374151]">
            {UPCOMING_MEGA_PROJECTS.length} MONITORED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {UPCOMING_MEGA_PROJECTS.map(proj => (
            <div key={proj.id} className="p-3 bg-[#151921] border border-[#1F2937] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono font-bold text-[#F27D26] bg-[#0A0B0E] px-1.5 py-0.5 rounded border border-[#374151]">
                    {proj.category.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">COMMISSION: {proj.commissioningYear}</span>
                </div>
                <h4 className="font-bold text-white text-xs mb-1 uppercase font-mono">{proj.name}</h4>
                <p className="text-[10px] text-gray-400 font-mono mb-2">Location: {proj.location}</p>
              </div>

              <div className="pt-2 border-t border-[#1F2937] flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-400">INVESTMENT: <strong className="text-white">₹{proj.investmentSizeINR} CR</strong></span>
                <span className="text-[#F27D26] font-bold">+{proj.expectedLubeDemandBoostKL} KL/YR</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

