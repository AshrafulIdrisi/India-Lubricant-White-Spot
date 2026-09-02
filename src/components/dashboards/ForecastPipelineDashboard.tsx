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

  // Custom Light Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs text-slate-700 min-w-[200px] z-50">
          <div className="text-[11px] font-bold text-[#7C3AED] border-b border-slate-100 pb-1 mb-2 uppercase">
            Year {label} Outlook
          </div>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between text-[11px] gap-3">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-2 h-2 inline-block rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-bold text-slate-900">
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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
            10-Year Demand Projections &amp; EV Transition Trajectory (2026–2036)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Structural shifts • Industrial expansion • Fleet electrification curve
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs">
          {FORECAST_TRENDS.map(f => (
            <button
              key={f.year}
              onClick={() => setSelectedYear(f.year)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedYear === f.year
                  ? 'bg-white text-[#7C3AED] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.year}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Forecast KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm border-l-4 border-l-[#7C3AED]">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Projected Total Demand ({selectedYear})</span>
          <span className="text-xl font-extrabold text-[#7C3AED] mt-1 block">
            {formatKL(activeForecast.totalDemandKL)}
          </span>
          <span className="text-[10px] text-emerald-700 mt-1 block font-semibold">
            +{(activeForecast.totalDemandKL - FORECAST_TRENDS[0].totalDemandKL).toLocaleString()} KL Expansion
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm border-l-4 border-l-blue-500">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Industrial Lubricants</span>
          <span className="text-xl font-extrabold text-blue-700 mt-1 block">
            {formatKL(activeForecast.industrialDemandKL)}
          </span>
          <span className="text-[10px] text-blue-600 mt-1 block font-medium">
            Strong CAPEX (+10.2% CAGR)
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm border-l-4 border-l-slate-400">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Automotive ICE Fleet</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {formatKL(activeForecast.automotiveDemandKL)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Peak ICE Demand: 2030-2032
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">EV Specialized Fluids</span>
          <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
            {formatKL(activeForecast.evFluidsDemandKL)}
          </span>
          <span className="text-[10px] text-emerald-700 mt-1 block font-semibold">
            Penetration: {activeForecast.evPenetrationPct}%
          </span>
        </div>
      </div>

      {/* Interactive 10-Year Projections Chart */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              10-Year Macro Demand Curve &amp; Fuel-Transition Dynamics (2026–2036)
            </h3>
          </div>

          {/* Chart View Modes */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setChartView('composed')}
              className={`px-3 py-1 rounded-lg transition-colors font-bold text-[11px] ${
                chartView === 'composed' ? 'bg-white text-[#7C3AED] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Multi-Sector Trajectory
            </button>
            <button
              onClick={() => setChartView('stacked')}
              className={`px-3 py-1 rounded-lg transition-colors font-bold text-[11px] ${
                chartView === 'stacked' ? 'bg-white text-[#7C3AED] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stacked Sector Volume
            </button>
            <button
              onClick={() => setChartView('evTrend')}
              className={`px-3 py-1 rounded-lg transition-colors font-bold text-[11px] ${
                chartView === 'evTrend' ? 'bg-white text-[#7C3AED] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EV Penetration Rate (%)
            </button>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="h-[340px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'composed' ? (
              <ComposedChart data={FORECAST_TRENDS} margin={{ top: 15, right: 35, left: 15, bottom: 10 }}>
                <defs>
                  <linearGradient id="totalDemandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="industrialGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="year" stroke="#94A3B8" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                <YAxis
                  yAxisId="left"
                  stroke="#94A3B8"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k KL`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#059669"
                  domain={[0, 40]}
                  tick={{ fill: '#059669', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                  formatter={(val) => <span className="text-slate-700 font-medium">{val}</span>}
                />
                
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalDemandKL"
                  name="Total Demand (KL)"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  fill="url(#totalDemandGrad)"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="industrialDemandKL"
                  name="Industrial Lubricants (KL)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#2563eb' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="automotiveDemandKL"
                  name="Automotive ICE Fleet (KL)"
                  stroke="#64748b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3.5, fill: '#64748b' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="evFluidsDemandKL"
                  name="EV Dielectric Fluids (KL)"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#059669' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="evPenetrationPct"
                  name="EV Fleet Penetration Rate (%)"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  dot={{ r: 4, fill: '#d97706' }}
                />
              </ComposedChart>
            ) : chartView === 'stacked' ? (
              <BarChart data={FORECAST_TRENDS} margin={{ top: 15, right: 25, left: 15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="year" stroke="#94A3B8" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k KL`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                  formatter={(val) => <span className="text-slate-700 font-medium">{val}</span>}
                />
                <Bar dataKey="automotiveDemandKL" name="Automotive ICE (KL)" stackId="a" fill="#94A3B8" />
                <Bar dataKey="industrialDemandKL" name="Industrial Lubes (KL)" stackId="a" fill="#3B82F6" />
                <Bar dataKey="evFluidsDemandKL" name="EV Fluids (KL)" stackId="a" fill="#10B981" />
              </BarChart>
            ) : (
              <ComposedChart data={FORECAST_TRENDS} margin={{ top: 15, right: 35, left: 15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="year" stroke="#94A3B8" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                <YAxis
                  yAxisId="left"
                  stroke="#059669"
                  domain={[0, 40]}
                  tick={{ fill: '#059669', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#7C3AED"
                  tick={{ fill: '#7C3AED', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k KL`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                  formatter={(val) => <span className="text-slate-700 font-medium">{val}</span>}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="evPenetrationPct"
                  name="EV Fleet Penetration (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="#10b981"
                  fillOpacity={0.15}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="evFluidsDemandKL"
                  name="EV Fluids Volume (KL)"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#7C3AED' }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecasting Timeline & EV Vulnerability Matrix Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-xs text-slate-900 uppercase flex items-center gap-2 mb-3.5">
          <Zap className="w-4 h-4 text-[#7C3AED]" />
          Long-Range Sector Demand Evolution &amp; EV Disruption Timeline
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase font-semibold">
                <th className="pb-2.5 pl-3">Year</th>
                <th className="pb-2.5 text-right">Total Demand (KL)</th>
                <th className="pb-2.5 text-right">Automotive (KL)</th>
                <th className="pb-2.5 text-right">Industrial (KL)</th>
                <th className="pb-2.5 text-right">EV Fluids (KL)</th>
                <th className="pb-2.5 text-right">EV Penetration</th>
                <th className="pb-2.5 pl-4">Strategic Implication</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FORECAST_TRENDS.map(f => (
                <tr
                  key={f.year}
                  className={`hover:bg-slate-50 transition-colors ${
                    selectedYear === f.year ? 'bg-purple-50/70 text-slate-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <td className="py-2.5 pl-3 font-bold text-[#7C3AED]">{f.year}</td>
                  <td className="py-2.5 text-right font-medium">{f.totalDemandKL.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-slate-500">{f.automotiveDemandKL.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-blue-700 font-medium">{f.industrialDemandKL.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-emerald-700 font-medium">{f.evFluidsDemandKL.toLocaleString()}</td>
                  <td className="py-2.5 text-right font-bold text-[#7C3AED]">{f.evPenetrationPct}%</td>
                  <td className="py-2.5 pl-4 text-xs text-slate-600">{getStrategicNote(f.year)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Mega Projects Catalyst Feed */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="font-bold text-xs text-slate-900 uppercase flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#7C3AED]" />
              Major Industrial &amp; Infrastructure Projects Catalyzing Lubricant Demand
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Corridor correlation • Steel, cement, expressway, &amp; metals pipeline</p>
          </div>
          <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            {UPCOMING_MEGA_PROJECTS.length} Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {UPCOMING_MEGA_PROJECTS.map(proj => (
            <div key={proj.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between hover:bg-slate-100/70 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-[#7C3AED] bg-purple-100/70 px-2 py-0.5 rounded-full border border-purple-200 uppercase">
                    {proj.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Commission: {proj.commissioningYear}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs mb-1 uppercase">{proj.name}</h4>
                <p className="text-xs text-slate-500 mb-2.5">Location: {proj.location}</p>
              </div>

              <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">Investment: <strong className="text-slate-900">₹{proj.investmentSizeINR} Cr</strong></span>
                <span className="text-emerald-700 font-bold">+{proj.expectedLubeDemandBoostKL} KL/yr</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

