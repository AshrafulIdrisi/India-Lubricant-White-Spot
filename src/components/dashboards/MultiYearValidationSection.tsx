import React, { useState } from 'react';
import {
  Calendar,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Layers,
  Fuel,
  Car,
  Factory,
  Scale,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  HISTORICAL_VALIDATION_YEARS,
  BRAND_HISTORICAL_PERFORMANCE,
  MACRO_HISTORICAL_GROWTH_DRIVERS,
  YearlyValidationData,
  BrandHistoricalPerformance
} from '../../data/historicalValidationData';

export const MultiYearValidationSection: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<string>('FY 2025-26');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('brand-servo');
  const [analysisView, setAnalysisView] = useState<'macro' | 'brands' | 'variance' | 'methodology'>('macro');

  const activeYearData = HISTORICAL_VALIDATION_YEARS.find(y => y.fiscalYear.includes(selectedYear)) || HISTORICAL_VALIDATION_YEARS[2];
  const activeBrandData = BRAND_HISTORICAL_PERFORMANCE.find(b => b.brandId === selectedBrandId) || BRAND_HISTORICAL_PERFORMANCE[0];

  // Prepare multi-year chart datasets
  const demandSupplyTrendData = HISTORICAL_VALIDATION_YEARS.map(y => ({
    fiscalYear: y.fiscalYear.replace(' (Forecasted)', ''),
    totalMarketKL: y.totalMarketKL / 1000000,
    accessibleSupplyKL: y.accessibleSupplyKL / 1000000,
    unmetGapKL: y.unmetSupplyGapKL / 1000000,
    marketValueCr: y.totalMarketValueINRCr,
    syntheticPct: y.syntheticAdoptionPct,
    servoVolumeKL: y.ioclDisclosedServoVolumeKL / 1000
  }));

  const segmentDemandTrendData = HISTORICAL_VALIDATION_YEARS.map(y => ({
    fiscalYear: y.fiscalYear.replace(' (Forecasted)', ''),
    automotive: y.automotiveDemandKL / 1000000,
    industrial: y.industrialDemandKL / 1000000,
    agriMarine: y.specialtyAgriMarineDemandKL / 1000000,
    total: y.totalMarketKL / 1000000
  }));

  const brandHistoricalChartData = activeBrandData.history.map(h => ({
    fiscalYear: h.fiscalYear,
    volumeKL: h.volumeKL / 1000,
    marketSharePct: h.marketSharePct,
    revenueCr: h.revenueINRCr,
    capacityKL: h.blendingCapacityKL / 1000,
    utilization: h.capacityUtilizationPct
  }));

  return (
    <div className="space-y-4">
      {/* 1. Header Card & Sub-navigation */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#7C3AED]" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                3-Year Historical Data &amp; Longitudinal Validation Analysis (FY 2023-24 to FY 2026-27)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200 uppercase">
                4-Year Series • PPAC Reconciled
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Audited historical baseline validating the 5.70M KL macro model against PPAC MoPNG sales dispatches and IOCL disclosures across multiple fiscal cycles.
            </p>
          </div>

          {/* Sub-view switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {[
              { id: 'macro', label: 'Macro Demand & Supply Trajectory' },
              { id: 'brands', label: 'Brand-Wise 3-Yr Audit' },
              { id: 'variance', label: 'PPAC Variance & Triangulation' },
              { id: 'methodology', label: 'Econometric Growth Drivers' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAnalysisView(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                  analysisView === tab.id
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4-Year Fast Comparative Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {HISTORICAL_VALIDATION_YEARS.map(y => {
            const isSelected = activeYearData.fiscalYear === y.fiscalYear;
            return (
              <div
                key={y.fiscalYear}
                onClick={() => setSelectedYear(y.fiscalYear.split(' ')[1])}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-500/20'
                    : 'bg-slate-50 border-slate-200/90 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{y.fiscalYear}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    y.fiscalYear.includes('2025-26')
                      ? 'bg-emerald-100 text-emerald-800'
                      : y.fiscalYear.includes('Forecasted')
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {y.fiscalYear.includes('2025-26') ? 'Benchmark Base' : y.fiscalYear.includes('Forecasted') ? 'Projection' : 'Audited'}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">National Demand</span>
                    <span className="text-lg font-black text-slate-900">{(y.totalMarketKL / 1000000).toFixed(2)}M KL</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Market Value</span>
                    <span className="text-xs font-bold text-slate-700">₹{y.totalMarketValueINRCr.toLocaleString()} Cr</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Supply: {(y.accessibleSupplyKL / 1000000).toFixed(2)}M KL</span>
                  <span className="text-emerald-700 font-bold">IOCL: {(y.ioclDisclosedServoVolumeKL / 1000000).toFixed(2)}M KL</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: MACRO TRAJECTORY */}
      {analysisView === 'macro' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Total Demand vs Accessible Supply vs Gap */}
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-wider block">LONGITUDINAL RECONCILIATION</span>
                <h4 className="text-sm font-black text-slate-900">National Demand, Incumbent Supply &amp; Unmet Gap (M KL)</h4>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">+5.0% CAGR</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Historical multi-year trajectory demonstrating consistent ~26.5% national supply gap driven by heavy industrial expansions in Tier-2/3 belts.
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandSupplyTrendData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="fiscalYear" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                  <YAxis tickFormatter={(v) => `${v.toFixed(1)}M`} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }}
                    formatter={(val: any, name: string) => [`${Number(val).toFixed(2)} Million KL`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: '8px' }} />
                  <Bar dataKey="totalMarketKL" name="Total Market Demand" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="accessibleSupplyKL" name="Accessible Incumbent Supply" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="unmetGapKL" name="Unmet White-Spot Gap" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Sector Mix Evolution */}
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">SECTOR COMPOSITION (3-YR)</span>
                <h4 className="text-sm font-black text-slate-900">Automotive vs Industrial vs Agri/Marine (M KL)</h4>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">60:35:5 Ratio</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Structural stability across 3 fiscal cycles: Automotive steady at 60%, Industrial expanding from 1.76M KL to 2.00M KL.
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={segmentDemandTrendData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="fiscalYear" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                  <YAxis tickFormatter={(v) => `${v.toFixed(1)}M`} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }}
                    formatter={(val: any, name: string) => [`${Number(val).toFixed(2)} M KL`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="automotive" name="Automotive Demand (60%)" stackId="1" stroke="#3B82F6" fill="#93C5FD" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="industrial" name="Industrial Demand (35%)" stackId="1" stroke="#8B5CF6" fill="#C4B5FD" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="agriMarine" name="Specialty & Agri (5%)" stackId="1" stroke="#10B981" fill="#A7F3D0" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BRAND-WISE HISTORICAL AUDIT */}
      {analysisView === 'brands' && (
        <div className="space-y-4">
          {/* Brand Selector Pills */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase mr-1">Select Brand:</span>
              {BRAND_HISTORICAL_PERFORMANCE.map(b => (
                <button
                  key={b.brandId}
                  onClick={() => setSelectedBrandId(b.brandId)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                    selectedBrandId === b.brandId
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{b.brandName}</span>
                  <span className="text-[10px] opacity-75 font-normal">({b.category.split(' ')[0]})</span>
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Parent: <strong className="text-slate-900">{activeBrandData.parentCompany}</strong>
            </div>
          </div>

          {/* Active Brand 3-Year Table & Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart: Volume & Share Trend */}
            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm lg:col-span-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-wider block">PERFORMANCE OVER TIME</span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">{activeBrandData.brandName} 3-Year Trajectory</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Volume dispatches (Thousand KL) and national market share % across FY24, FY25, and FY26.
                </p>

                <div className="h-64 w-full mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={brandHistoricalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="fiscalYear" tick={{ fontSize: 10, fill: '#334155' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="volumeKL" name="Volume (k KL)" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-purple-50/60 border border-purple-200/60 p-3 rounded-xl text-xs text-purple-900 mt-3 font-medium">
                Latest Status: <strong>{activeBrandData.history[2].marketSharePct}%</strong> Market Share (<strong>{activeBrandData.history[2].volumeMillionKL}M KL</strong>) in FY 2025-26.
              </div>
            </div>

            {/* Detailed 3-Year Audit History Table */}
            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm lg:col-span-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">AUDITED FISCAL CHRONOLOGY</span>
              <h4 className="text-sm font-black text-slate-900 mt-0.5 mb-3">Multi-Year Metric Reconciliation Table</h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 uppercase font-black">
                      <th className="py-2.5 px-3">Fiscal Year</th>
                      <th className="py-2.5 px-3">Dispatched Volume</th>
                      <th className="py-2.5 px-3">Market Share</th>
                      <th className="py-2.5 px-3">Revenue (₹ Cr)</th>
                      <th className="py-2.5 px-3">Blending Capacity</th>
                      <th className="py-2.5 px-3">Utilization</th>
                      <th className="py-2.5 px-3">Depots / Retail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeBrandData.history.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">{h.fiscalYear}</td>
                        <td className="py-3 px-3 font-extrabold text-[#7C3AED]">
                          {(h.volumeKL / 1000).toLocaleString()}k KL <span className="text-[10px] text-slate-400 font-normal">({h.volumeMillionKL}M)</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">{h.marketSharePct}%</td>
                        <td className="py-3 px-3 font-medium text-slate-700">₹{h.revenueINRCr.toLocaleString()} Cr</td>
                        <td className="py-3 px-3 text-slate-600">{(h.blendingCapacityKL / 1000).toLocaleString()}k KL</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            {h.capacityUtilizationPct}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px]">
                          {h.depotsCount} Depots / {(h.retailTouchpoints / 1000).toFixed(0)}k Retail
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Milestone Box */}
              <div className="mt-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">YEAR-ON-YEAR STRATEGIC EVOLUTION:</span>
                {activeBrandData.history.map((h, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs flex items-start gap-2">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-bold text-[10px] shrink-0 mt-0.5">
                      {h.fiscalYear}
                    </span>
                    <span className="text-slate-600">{h.keyMilestone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: PPAC VARIANCE & TRIANGULATION */}
      {analysisView === 'variance' && (
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">STATISTICAL CONVERGENCE</span>
              <h4 className="text-sm font-black text-slate-900">PPAC MoPNG vs Model Triangulation (Last 3 Years)</h4>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Variance &lt; 1.2% across all 3 years
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The platform validates estimated bottom-up regional demand against official Petroleum Planning &amp; Analysis Cell (PPAC) sales bulletins and Ministry of Petroleum refinery gate figures.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 uppercase font-black">
                  <th className="py-2.5 px-3">Fiscal Year</th>
                  <th className="py-2.5 px-3">Platform Model Demand</th>
                  <th className="py-2.5 px-3">PPAC MoPNG Reported Sales</th>
                  <th className="py-2.5 px-3">Absolute Delta (KL)</th>
                  <th className="py-2.5 px-3">Variance (%)</th>
                  <th className="py-2.5 px-3">Confidence Rating</th>
                  <th className="py-2.5 px-3">Primary Ground Truth Audit Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {HISTORICAL_VALIDATION_YEARS.slice(0, 3).map((y, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{y.fiscalYear}</td>
                    <td className="py-3 px-3 font-extrabold text-[#7C3AED]">{(y.totalMarketKL / 1000000).toFixed(2)}M KL</td>
                    <td className="py-3 px-3 font-bold text-slate-700">{(y.ppacReportedConsumptionKL / 1000000).toFixed(2)}M KL</td>
                    <td className="py-3 px-3 text-slate-600">{((y.totalMarketKL - y.ppacReportedConsumptionKL) / 1000).toFixed(0)}k KL</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs">
                        +{y.varianceVsPpacPct}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-black text-slate-900">{y.confidenceScore}/100</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs">{y.dataQualityAudit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: ECONOMETRIC GROWTH DRIVERS */}
      {analysisView === 'methodology' && (
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm space-y-4">
          <div>
            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-wider block">ECONOMETRIC MODELING</span>
            <h4 className="text-sm font-black text-slate-900 mt-0.5">Underlying Macro Growth Drivers &amp; Calibration Formula</h4>
            <p className="text-xs text-slate-500 mt-1">
              Multi-year elasticity coefficients linking VAHAN commercial vehicle registrations, manufacturing index (IIP), and synthetic mix migration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MACRO_HISTORICAL_GROWTH_DRIVERS.map((driver, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 uppercase">{driver.driver}</span>
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {driver.cagrPct}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 text-[11px] border-y border-slate-200/60">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">FY24</span>
                    <span className="font-semibold text-slate-700">{driver.fy24}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">FY25</span>
                    <span className="font-semibold text-slate-700">{driver.fy25}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">FY26</span>
                    <span className="font-bold text-slate-900">{driver.fy26}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {driver.lubricantImpact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
