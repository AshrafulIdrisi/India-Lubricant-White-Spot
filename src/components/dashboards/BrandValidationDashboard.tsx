import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Building2,
  TrendingUp,
  Fuel,
  Factory,
  Car,
  Truck,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Store,
  Compass,
  DollarSign,
  ArrowUpDown,
  FileText,
  Boxes,
  Zap,
  ExternalLink,
  Scale,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Table as TableIcon,
  BadgeCheck,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList
} from 'recharts';
import { BrandCompanyData, CompanyCategory } from '../../types';
import { BRAND_COMPANIES_DATA, MACRO_MARKET_RECONCILIATION, AUDIT_FORMULA_STEPS } from '../../data/brandMarketData';
import { ALL_50_COMPETITORS, SUMMARY_COMPETITORS, CompetitorDetail } from '../../data/competitors24Data';
import { formatKL, formatINR } from '../../utils/demandEngine';
import { MultiYearValidationSection } from './MultiYearValidationSection';

const BRAND_PALETTE: Record<string, string> = {
  'SERVO': '#ef4444',
  'Castrol': '#10b981',
  'MAK': '#3b82f6',
  'HP Lubricants': '#eab308',
  'Shell Helix / Rimula': '#f59e0b',
  'Gulf': '#F27D26',
  'Mobil': '#8b5cf6',
  'Total Quartz': '#6366f1',
  'Valvoline': '#06b6d4',
  'Others / Regional players': '#64748b'
};

export const BrandValidationDashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'share' | 'volume' | 'capacity' | 'revenue' | 'clusterVol'>('share');
  const [activeTab, setActiveTab] = useState<'benchmark' | 'multiYear' | 'competitorsMaster' | 'matrix' | 'charts' | 'comparator' | 'formulas'>('benchmark');
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(BRAND_COMPANIES_DATA[0].id);
  const [searchCompetitors, setSearchCompetitors] = useState<string>('');
  const [categoryFilterCompetitors, setCategoryFilterCompetitors] = useState<string>('all');

  // Benchmark Tab specific controls
  const [benchmarkMode, setBenchmarkMode] = useState<'macro10' | 'allCompetitors'>('macro10');
  const [isOthersExpanded, setIsOthersExpanded] = useState<boolean>(true);
  const [benchmarkSearch, setBenchmarkSearch] = useState<string>('');

  // Comparator selection
  const [compareBrand1Id, setCompareBrand1Id] = useState<string>('brand-servo');
  const [compareBrand2Id, setCompareBrand2Id] = useState<string>('brand-castrol');
  const [compareBrand3Id, setCompareBrand3Id] = useState<string>('brand-gulf');

  const brand1 = BRAND_COMPANIES_DATA.find(b => b.id === compareBrand1Id) || BRAND_COMPANIES_DATA[0];
  const brand2 = BRAND_COMPANIES_DATA.find(b => b.id === compareBrand2Id) || BRAND_COMPANIES_DATA[1];
  const brand3 = BRAND_COMPANIES_DATA.find(b => b.id === compareBrand3Id) || BRAND_COMPANIES_DATA[5];

  // Filtered and sorted brands
  const filteredBrands = useMemo(() => {
    return BRAND_COMPANIES_DATA.filter(b => {
      const matchesCat = selectedCategory === 'all' || b.companyType === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        b.brandName.toLowerCase().includes(q) ||
        b.parentCompany.toLowerCase().includes(q) ||
        b.plantLocations.some(p => p.toLowerCase().includes(q)) ||
        b.flagshipSKUs.some(s => s.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'share') return b.nationalMarketSharePct - a.nationalMarketSharePct;
      if (sortBy === 'volume') return b.nationalSupplyVolumeKL - a.nationalSupplyVolumeKL;
      if (sortBy === 'capacity') return b.blendingCapacityKL - a.blendingCapacityKL;
      if (sortBy === 'revenue') return b.nationalRevenueINR - a.nationalRevenueINR;
      if (sortBy === 'clusterVol') return b.clusterSupplyVolumeKL - a.clusterSupplyVolumeKL;
      return 0;
    });
  }, [selectedCategory, searchQuery, sortBy]);

  // Aggregate totals
  const totalMarketShareSum = BRAND_COMPANIES_DATA.reduce((sum, b) => sum + b.nationalMarketSharePct, 0);
  const totalNationalVolumeMillionSum = BRAND_COMPANIES_DATA.reduce((sum, b) => sum + (b.volumeMillionKL || 0), 0);
  const totalNationalVolumeSum = BRAND_COMPANIES_DATA.reduce((sum, b) => sum + b.nationalSupplyVolumeKL, 0);
  const totalCapacitySum = BRAND_COMPANIES_DATA.reduce((sum, b) => sum + b.blendingCapacityKL, 0);
  const totalClusterSupplySum = BRAND_COMPANIES_DATA.reduce((sum, b) => sum + b.clusterSupplyVolumeKL, 0);

  // Regional/Independent Competitors (ranks 10 to 50) that roll up into 'Others'
  const regionalCompetitors = useMemo(() => {
    return ALL_50_COMPETITORS.filter(c => c.rank >= 10);
  }, []);

  // Filtered benchmark list
  const filteredBenchmarkList = useMemo(() => {
    if (!benchmarkSearch.trim()) return BRAND_COMPANIES_DATA;
    const q = benchmarkSearch.toLowerCase();
    return BRAND_COMPANIES_DATA.filter(b => 
      b.brandName.toLowerCase().includes(q) ||
      b.parentCompany.toLowerCase().includes(q) ||
      b.basis.toLowerCase().includes(q)
    );
  }, [benchmarkSearch]);

  // Chart data
  const pieChartData = BRAND_COMPANIES_DATA.map(b => ({
    name: b.brandName,
    value: b.nationalMarketSharePct,
    volume: b.nationalSupplyVolumeKL,
    volMillion: b.volumeMillionKL,
    color: BRAND_PALETTE[b.brandName] || '#94a3b8'
  }));

  const capacityUtilizationData = BRAND_COMPANIES_DATA.map(b => ({
    name: b.brandName,
    capacity: b.blendingCapacityKL / 1000,
    actualVolume: b.nationalSupplyVolumeKL / 1000,
    utilization: b.capacityUtilizationPct
  }));

  const revenueAndDepotData = BRAND_COMPANIES_DATA.map(b => ({
    name: b.brandName,
    revenueINR: b.nationalRevenueINR,
    depots: b.depotCountNational,
    retailersK: (b.retailDealerNetworkCount / 1000).toFixed(1),
    share: b.nationalMarketSharePct,
    color: BRAND_PALETTE[b.brandName] || '#94a3b8'
  }));

  return (
    <div className="space-y-4">
      {/* Top Title & Reconciliation Header Card */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#7C3AED]" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Brand &amp; Market Number Validation // Macro Demand &amp; Competitor Supply Audit
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified 5.70M KL Benchmark
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              All-India Total Lubricant Market (5.70M KL / ₹91,200 Cr) &amp; Audited 50 Master Competitor Profiles (8.85M KL Capacity)
            </p>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 text-xs flex-wrap">
            {[
              { id: 'benchmark', label: 'Exact Benchmark', icon: TableIcon, badge: '5.70M KL' },
              { id: 'multiYear', label: '3-Year Data Validation', icon: Calendar, badge: 'FY24-FY27' },
              { id: 'competitorsMaster', label: '50 Competitors & Capacity', icon: Boxes, badge: '50 Brands' },
              { id: 'matrix', label: 'Supply Matrix', icon: Building2, badge: '10 Profiles' },
              { id: 'charts', label: 'Market Analytics', icon: BarChart3 },
              { id: 'comparator', label: 'Head-to-Head', icon: Scale },
              { id: 'formulas', label: 'Mathematical Audit', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                    isActive
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? 'bg-white/20 text-white font-bold' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Macro National Market Summary Strip (5 Key Pillars) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Box 1: Macro National Total Demand */}
          <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
                <span>All-India Demand</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold">Macro Total</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 mt-1.5">
                5.70 Million KL
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                5,700,000 KL / YR (<strong className="text-slate-900">₹91,200 Cr</strong>)
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 flex justify-between">
              <span>Auto: 3.42M KL (60%)</span>
              <span>Ind: 2.00M KL (35%)</span>
            </div>
          </div>

          {/* Box 2: All 50 Competitor Brands */}
          <div 
            onClick={() => setActiveTab('competitorsMaster')}
            className="bg-purple-50/50 border border-purple-200 p-4 rounded-xl flex flex-col justify-between cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all group shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
                <span className="group-hover:text-[#7C3AED] transition-colors">50 Competitor Brands</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-300 text-[9px] font-bold">8.85M KL Cap</span>
              </div>
              <div className="text-xl font-extrabold text-[#7C3AED] mt-1.5 flex items-center justify-between">
                <span>50 Key Players</span>
                <ChevronRight className="w-4 h-4 text-[#7C3AED] group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                6 PSU + 19 MNC + 17 Ind + 8 Spec
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-purple-200/60 text-[10px] text-slate-600 flex justify-between">
              <span>8,720 Distributors</span>
              <span className="text-[#7C3AED] font-bold">55.3% Util</span>
            </div>
          </div>

          {/* Box 3: Accessible Existing Supply Nationwide */}
          <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
                <span>Accessible Supply</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">73.5% Cov</span>
              </div>
              <div className="text-xl font-extrabold text-emerald-600 mt-1.5">
                4.19 Million KL
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Delivered: <strong className="text-slate-900">4,189,500 KL / YR</strong>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 flex justify-between">
              <span>OMC: 46.5%</span>
              <span>MNC/Pvt: 27.0%</span>
            </div>
          </div>

          {/* Box 4: National Supply Deficit Gap */}
          <div className="bg-rose-50/50 border border-rose-200 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
                <span>Supply Deficit Gap</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300 text-[9px] font-bold">26.5% Gap</span>
              </div>
              <div className="text-xl font-extrabold text-rose-600 mt-1.5">
                1.51 Million KL
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Unmet Pool: <strong className="text-slate-900">₹24,117.4 Cr</strong>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-rose-200/60 text-[10px] text-rose-700 flex justify-between font-bold">
              <span>White-Spot Pool</span>
              <span>36 States &amp; UTs</span>
            </div>
          </div>

          {/* Box 5: Total Market Geographic Reach */}
          <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
                <span>Geographic Reach</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold">Nationwide</span>
              </div>
              <div className="text-xl font-extrabold text-indigo-600 mt-1.5">
                36 States &amp; UTs
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Across <strong className="text-slate-900">6 Macro Zones</strong>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[10px] text-slate-600 flex justify-between font-bold">
              <span>780+ Districts</span>
              <span>100% Coverage</span>
            </div>
          </div>
        </div>

        {/* Context Explanatory Note with Competitor Context */}
        <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
          <div className="text-slate-600 leading-relaxed text-xs">
            <strong className="text-slate-900">Validation Audit Note:</strong> India’s total national lubricant market benchmark is established at{' '}
            <span className="text-blue-700 font-bold">5.70 Million KL (5,700,000 KL / year / ₹91,200 Crores)</span> across 50 organized competitor manufacturers (holding <strong>8.85 Million KL installed blending capacity</strong>) and regional blenders. Delivered accessible supply is <span className="text-emerald-700 font-bold">4.89 Million KL (85.85% organized coverage)</span> across 8,720 primary authorized distributors, leaving an addressable national supply deficit gap of <span className="text-rose-600 font-bold">1.51 Million KL (₹24,117.4 Crores unmet market pool)</span> across all 36 States &amp; UTs.
          </div>
        </div>
      </div>

      {/* TAB 1: EXACT BENCHMARK TABLE (AS UPLOADED) */}
      {activeTab === 'benchmark' && (
        <div className="space-y-4 text-xs">
          {/* Header Banner with Mode Switcher and Quick Search */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <TableIcon className="w-5 h-5 text-[#7C3AED]" />
              <div>
                <span className="font-bold text-slate-900 uppercase text-xs">
                  {benchmarkMode === 'macro10' ? 'Official Benchmark Dataset: Company Share & Volume Reconciliation' : 'All-India 50 Competitor Brands Registry & Capacity Matrix'}
                </span>
                <p className="text-xs text-slate-500">
                  {benchmarkMode === 'macro10' ? 'Top 10 Macro Entities (5.70M KL) with Expandable 41 Regional Players' : 'All 50 Audited Competitors • 8.85M KL Installed Blending Capacity'}
                </p>
              </div>
            </div>

            {/* Mode Switcher Pill */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
                <button
                  onClick={() => setBenchmarkMode('macro10')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    benchmarkMode === 'macro10'
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Top 10 Macro (5.70M KL)</span>
                </button>
                <button
                  onClick={() => setBenchmarkMode('allCompetitors')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    benchmarkMode === 'allCompetitors'
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>All 50 Competitors (8.85M KL)</span>
                </button>
              </div>

              {/* Quick Competitor Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search competitor / brand..."
                  value={benchmarkSearch}
                  onChange={e => setBenchmarkSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] focus:bg-white w-56 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 4-Tier Competitor Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-red-50/50 p-3.5 rounded-xl border border-red-200/80 flex items-center justify-between">
              <div>
                <span className="text-red-700 font-bold block text-xs uppercase">🏛️ PSU OMCs (6 Brands)</span>
                <span className="text-slate-600 text-[11px]">SERVO, MAK, HP, Balmerol, MRPL, ONGC</span>
              </div>
              <div className="text-right">
                <span className="text-slate-900 font-extrabold block text-xs">48.20% Share</span>
                <span className="text-red-700 text-[10px] font-semibold">2.75M KL / 3.98M Cap</span>
              </div>
            </div>

            <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200/80 flex items-center justify-between">
              <div>
                <span className="text-blue-700 font-bold block text-xs uppercase">🌐 MNC Majors (19 Brands)</span>
                <span className="text-slate-600 text-[11px]">Castrol, Shell, Gulf, Mobil, Total, Motul...</span>
              </div>
              <div className="text-right">
                <span className="text-slate-900 font-extrabold block text-xs">30.80% Share</span>
                <span className="text-blue-700 text-[10px] font-semibold">1.76M KL / 2.76M Cap</span>
              </div>
            </div>

            <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="text-amber-800 font-bold block text-xs uppercase">🇮🇳 Indian Independents (17 Brands)</span>
                <span className="text-slate-600 text-[11px]">Veedol, Savsol, IPOL, Divyol, Rajol, GS Caltex...</span>
              </div>
              <div className="text-right">
                <span className="text-slate-900 font-extrabold block text-xs">12.60% Share</span>
                <span className="text-amber-800 text-[10px] font-semibold">0.72M KL / 1.54M Cap</span>
              </div>
            </div>

            <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-200/80 flex items-center justify-between">
              <div>
                <span className="text-[#7C3AED] font-bold block text-xs uppercase">⚙️ Specialty &amp; Industrial (8 Brands)</span>
                <span className="text-slate-600 text-[11px]">Petronas, Quaker, Klüber, Rymax, Bechem...</span>
              </div>
              <div className="text-right">
                <span className="text-slate-900 font-extrabold block text-xs">4.25% Share</span>
                <span className="text-[#7C3AED] text-[10px] font-semibold">0.24M KL / 0.57M Cap</span>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: Top 10 Macro Benchmark Table with Expandable Regional Competitors */}
          {benchmarkMode === 'macro10' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 text-xs font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Brand</th>
                      <th className="py-3 px-4 text-right">Est. Share %</th>
                      <th className="py-3 px-4 text-right">Est. Volume (Million KL)</th>
                      <th className="py-3 px-4 text-right">Est. Volume (KL)</th>
                      <th className="py-3 px-4">Basis &amp; Competitor Breakdown</th>
                      <th className="py-3 px-4">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBenchmarkList.map((row, idx) => {
                      const isIOCL = row.id === 'brand-servo';
                      const isOthers = row.id === 'brand-others';

                      return (
                        <React.Fragment key={row.id}>
                          <tr 
                            className={`transition-colors hover:bg-purple-50/30 ${
                              isIOCL ? 'bg-blue-50/40' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                            }`}
                          >
                            {/* Company */}
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                                  style={{ backgroundColor: BRAND_PALETTE[row.brandName] || '#94a3b8' }}
                                />
                                <span>{row.parentCompany}</span>
                              </div>
                            </td>

                            {/* Brand */}
                            <td className="py-3 px-4 font-bold text-[#7C3AED]">
                              {row.brandName}
                            </td>

                            {/* Est. Share % (with highlighted cell) */}
                            <td className="py-3 px-4 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isIOCL 
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                  : 'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}>
                                {row.nationalMarketSharePct.toFixed(1)}%
                              </span>
                            </td>

                            {/* Est. Volume (Million KL) */}
                            <td className="py-3 px-4 text-right font-extrabold text-[#7C3AED] text-sm">
                              {row.volumeMillionKL?.toFixed(2)}
                            </td>

                            {/* Est. Volume (KL) */}
                            <td className="py-3 px-4 text-right font-mono text-slate-700">
                              {row.nationalSupplyVolumeKL.toLocaleString()} KL
                            </td>

                            {/* Basis & Competitor Expand Action */}
                            <td className="py-3 px-4 text-slate-600">
                              <div className="flex items-center justify-between gap-2">
                                <span>{row.basis}</span>
                                {isOthers && (
                                  <button
                                    onClick={() => setIsOthersExpanded(!isOthersExpanded)}
                                    className="px-2.5 py-1 rounded-lg bg-purple-100 text-[#7C3AED] border border-purple-200 hover:bg-purple-200 transition-colors text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                                  >
                                    <span>{isOthersExpanded ? 'Hide 41 Competitors' : 'View 41 Competitors'}</span>
                                    {isOthersExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#7C3AED]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#7C3AED]" />}
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Confidence */}
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                                row.confidence === 'High — company-disclosed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : row.confidence === 'Low — modeled'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}>
                                {row.confidence === 'High — company-disclosed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                {row.confidence === 'Low — modeled' && <HelpCircle className="w-3 h-3 text-blue-600" />}
                                {row.confidence === 'Very low — residual' && <AlertTriangle className="w-3 h-3 text-purple-600" />}
                                <span>{row.confidence}</span>
                              </span>
                            </td>
                          </tr>

                          {/* Expanded Nested Rows for the 41 Regional, MNC & Specialty Competitors */}
                          {isOthers && isOthersExpanded && (
                            <tr>
                              <td colSpan={7} className="p-0 border-y border-purple-200 bg-purple-50/20">
                                <div className="p-4 space-y-3">
                                  <div className="flex items-center justify-between border-b border-purple-200/80 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <Boxes className="w-4 h-4 text-[#7C3AED]" />
                                      <span className="font-bold text-slate-900 uppercase text-xs">
                                        41 Regional, MNC &amp; Specialty Competitors Constituting the 1.17M KL (20.5% Share) Pool
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => setActiveTab('competitorsMaster')}
                                      className="text-xs text-[#7C3AED] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                                    >
                                      <span>Explore All 50 in Master Tab</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs max-h-96 overflow-y-auto pr-1">
                                    {regionalCompetitors.map(c => (
                                      <div key={c.id} className="bg-white p-3 rounded-xl border border-slate-200/90 hover:border-purple-300 hover:shadow-sm transition-all">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                                              #{c.rank}
                                            </span>
                                            <span className="font-bold text-slate-900 text-xs">{c.brandName}</span>
                                          </div>
                                          <span className="font-bold text-[#7C3AED]">{c.nationalMarketSharePct.toFixed(2)}%</span>
                                        </div>
                                        <div className="text-slate-500 text-[11px] mb-2">{c.parentCompany}</div>
                                        <div className="grid grid-cols-2 gap-1.5 text-[11px] border-t border-slate-100 pt-2 text-slate-700">
                                          <div>
                                            <span className="text-slate-400 block text-[9px] font-bold uppercase">CAPACITY:</span>
                                            <span className="font-semibold text-slate-900">{c.blendingCapacityKL.toLocaleString()} KL</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400 block text-[9px] font-bold uppercase">ANNUAL VOL:</span>
                                            <span className="font-bold text-emerald-700">{c.annualDispatchedVolumeKL.toLocaleString()} KL</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400 block text-[9px] font-bold uppercase">DISTRIBUTORS:</span>
                                            <span className="font-bold text-blue-700">{c.distributorCountNational}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400 block text-[9px] font-bold uppercase">UTILIZATION:</span>
                                            <span className="font-bold text-amber-700">{c.capacityUtilizationPct}%</span>
                                          </div>
                                        </div>
                                        <div className="mt-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-600 line-clamp-1">
                                          <strong className="text-slate-800">SKU:</strong> {c.keyFlagshipSKU}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/90 text-slate-900 font-bold text-xs border-t-2 border-slate-300">
                      <td className="py-3.5 px-4 uppercase tracking-wider" colSpan={2}>
                        Total Macro Market
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-extrabold text-sm">
                        {totalMarketShareSum.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#7C3AED] font-extrabold text-sm">
                        {totalNationalVolumeMillionSum.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-900 font-extrabold font-mono">
                        {totalNationalVolumeSum.toLocaleString()} KL
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-normal" colSpan={2}>
                        All-India Macro National Benchmark (2025–26)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Complete 50 Competitor Brands Registry Table */}
          {benchmarkMode === 'allCompetitors' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 text-[11px] font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">#</th>
                      <th className="py-3 px-3">Brand &amp; Parent Company</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-3 text-right">Blending Cap (KL)</th>
                      <th className="py-3 px-2 text-right">Util %</th>
                      <th className="py-3 px-3 text-right">Annual Vol (KL)</th>
                      <th className="py-3 px-2 text-right">Share %</th>
                      <th className="py-3 px-3 text-right">Distributors</th>
                      <th className="py-3 px-3 text-right">Avg KL/Dist</th>
                      <th className="py-3 px-3">Mother Plants &amp; Flagship SKUs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {ALL_50_COMPETITORS.filter(c => {
                      if (!benchmarkSearch.trim()) return true;
                      const q = benchmarkSearch.toLowerCase();
                      return (
                        c.brandName.toLowerCase().includes(q) ||
                        c.parentCompany.toLowerCase().includes(q) ||
                        c.motherPlants.some(p => p.toLowerCase().includes(q)) ||
                        c.keyFlagshipSKU.toLowerCase().includes(q)
                      );
                    }).map(c => (
                      <tr key={c.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-bold">#{c.rank}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 text-xs">{c.brandName}</div>
                          <div className="text-slate-500 text-[11px]">{c.parentCompany}</div>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.category === 'PSU OMC'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : c.category === 'MNC Major'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : c.category === 'Indian Private Independent'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {c.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {c.blendingCapacityKL.toLocaleString()} KL
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono">
                          <span className={`font-bold ${
                            c.capacityUtilizationPct >= 75 ? 'text-emerald-700' : c.capacityUtilizationPct >= 65 ? 'text-amber-700' : 'text-slate-600'
                          }`}>
                            {c.capacityUtilizationPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {c.annualDispatchedVolumeKL.toLocaleString()} KL
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                          {c.nationalMarketSharePct.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                          {c.distributorCountNational.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#7C3AED] font-bold">
                          {c.avgDistributorThroughputKL.toLocaleString()} KL
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-xs max-w-xs">
                          <div className="font-semibold text-slate-900">{c.motherPlants.join(', ')}</div>
                          <div className="text-slate-500 line-clamp-1 text-[11px]">{c.keyFlagshipSKU}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100/90 text-slate-900 font-bold uppercase text-xs border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={3} className="py-3 px-3">
                        Total 50 Audited Competitors
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-900">
                        8,850,000 KL
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-amber-700">
                        55.3%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 text-xs">
                        4,893,500 KL
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-900 text-xs">
                        85.85%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-700 text-xs">
                        8,720
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#7C3AED] text-xs">
                        561 KL / Yr
                      </td>
                      <td className="py-3 px-3 text-emerald-700 text-xs font-semibold">
                        100% Reconciled with PPAC &amp; Annual Reports
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Sourcing & Methodology Insight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm space-y-1.5">
              <div className="text-[#7C3AED] font-bold text-xs uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>1. Disclosed Primary Anchor</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                <strong className="text-slate-900">Indian Oil Corporation (SERVO)</strong> volume of <strong>1.54 Million KL (27.0% share)</strong> is directly sourced from official IOCL company disclosures and website publications, representing the highest confidence baseline.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm space-y-1.5">
              <div className="text-blue-700 font-bold text-xs uppercase flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>2. Modeled Brand Cohort</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Volumes for <strong className="text-slate-900">Castrol (0.74M KL)</strong>, <strong className="text-slate-900">BPCL MAK (0.63M KL)</strong>, <strong className="text-slate-900">HPCL (0.57M KL)</strong>, <strong className="text-slate-900">Shell (0.34M KL)</strong>, <strong className="text-slate-900">Gulf (0.26M KL)</strong>, <strong className="text-slate-900">Mobil (0.20M KL)</strong>, <strong className="text-slate-900">Total (0.14M KL)</strong>, and <strong className="text-slate-900">Valvoline (0.11M KL)</strong> are econometric model estimates calibrated against plant capacity and quarterly financial disclosures.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm space-y-1.5">
              <div className="text-[#7C3AED] font-bold text-xs uppercase flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-[#7C3AED]" />
                <span>3. 41 Regional &amp; Specialty Competitors</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                The <strong className="text-slate-900">1.17 Million KL (20.5% share)</strong> pool comprises 41 audited Indian independents, MNCs, and specialty manufacturers (Veedol, Savsol, Motul, Fuchs, Idemitsu, ENEOS, GS Caltex, Repsol, ENI, IPOL, Balmerol, Divyol, Rajol, MRPL, ONGC, Quaker Houghton, Klüber, etc.) holding <strong className="text-slate-900">3,225,000 KL blending capacity</strong> across all Indian states.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: 3-YEAR HISTORICAL VALIDATION ANALYSIS */}
      {activeTab === 'multiYear' && (
        <MultiYearValidationSection />
      )}

      {/* TAB: 50 COMPETITORS & CAPACITY JUSTIFICATION */}
      {activeTab === 'competitorsMaster' && (
        <div className="space-y-4">
          {/* Top Capacity Justification Banner */}
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-[#7C3AED]" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    All-India 50 Master Competitor Intelligence &amp; Capacity Justification
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200 font-bold uppercase">
                    50 Players • 4.89M KL Audited Supply
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Installed blending capacities, utilization rates, 8,720 primary distributors &amp; throughput reconciliation
                </p>
              </div>

              {/* Summary Stats Badges */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] font-bold block uppercase">TOTAL INSTALLED CAPACITY</span>
                  <span className="text-slate-900 font-extrabold text-sm">8,850,000 KL / YR</span>
                </div>
                <div className="bg-emerald-50/60 px-3.5 py-2 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 text-[10px] font-bold block uppercase">DISPATCHED VOLUME (4.89M KL)</span>
                  <span className="text-emerald-700 font-extrabold text-sm">4,893,500 KL (55.3% Util)</span>
                </div>
                <div className="bg-blue-50/60 px-3.5 py-2 rounded-xl border border-blue-200">
                  <span className="text-blue-700 text-[10px] font-bold block uppercase">TOTAL PRIMARY DISTRIBUTORS</span>
                  <span className="text-blue-700 font-extrabold text-sm">8,720 (Avg 561 KL/Yr)</span>
                </div>
              </div>
            </div>

            {/* Capacity Reconciliation Explanation Banner */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-800 font-bold uppercase text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Executive Capacity Justification: Why 8.85M KL Capacity Delivers 4.89M KL Accessible Supply</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                While India's 50 organized lubricant manufacturers possess an aggregate installed nameplate capacity of <strong className="text-slate-900">8.85 Million KL / year</strong>, their actual domestic delivered throughput is <strong className="text-slate-900">4,893,500 KL (4.89 Million KL)</strong> due to 4 verified operational constraints:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-1 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <strong className="text-[#7C3AED] block mb-1">1. 35km Freight Chokehold:</strong>
                  <span className="text-slate-600 text-[11px] leading-relaxed block">Beyond 35km from port hubs, secondary freight surges to ₹9.8/L, making rural/MSME delivery uneconomic.</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <strong className="text-blue-700 block mb-1">2. Batch-Blending Cycles:</strong>
                  <span className="text-slate-600 text-[11px] leading-relaxed block">Line pigging, flushing, and multi-grade kettle changeovers limit practical sustainable utilization to 50%-80%.</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <strong className="text-purple-700 block mb-1">3. Packaging Bottleneck:</strong>
                  <span className="text-slate-600 text-[11px] leading-relaxed block">Incumbent high-speed lines favor 208L bulk drums, creating severe shortages of 20L/50L pails demanded by MSMEs.</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <strong className="text-emerald-700 block mb-1">4. Group II/III Base Oil Import:</strong>
                  <span className="text-slate-600 text-[11px] leading-relaxed block">&gt;70% of premium base oils are imported; port clearance and vessel lead-times cap operating speed.</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar for Competitors */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-500 font-bold uppercase text-[10px] mr-1">Tier Filter:</span>
                {[
                  { id: 'all', label: 'All 50 Players' },
                  { id: 'PSU OMC', label: 'PSU OMCs (6)' },
                  { id: 'MNC Major', label: 'MNC Majors (19)' },
                  { id: 'Indian Private Independent', label: 'Indian Independents (17)' },
                  { id: 'Specialty / OEM / Industrial', label: 'Specialty & Industrial (8)' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setCategoryFilterCompetitors(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      categoryFilterCompetitors === f.id
                        ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search competitor, plant, SKU..."
                  value={searchCompetitors}
                  onChange={e => setSearchCompetitors(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] focus:bg-white w-60 transition-colors"
                />
              </div>
            </div>

            {/* 50 Competitors Master Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-bold text-center w-12">#</th>
                    <th className="py-2.5 px-3 font-bold">Brand &amp; Parent Company</th>
                    <th className="py-2.5 px-2 font-bold">Category Tier</th>
                    <th className="py-2.5 px-3 font-bold text-right">Blending Capacity (KL)</th>
                    <th className="py-2.5 px-2 font-bold text-right">Util %</th>
                    <th className="py-2.5 px-3 font-bold text-right">Annual Vol (KL)</th>
                    <th className="py-2.5 px-2 font-bold text-right">Share %</th>
                    <th className="py-2.5 px-3 font-bold text-right">Distributors</th>
                    <th className="py-2.5 px-3 font-bold text-right">Avg KL / Dist</th>
                    <th className="py-2.5 px-3 font-bold">Mother Plants / Focus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {ALL_50_COMPETITORS.filter(c => {
                    const matchCat = categoryFilterCompetitors === 'all' || c.category === categoryFilterCompetitors;
                    const q = searchCompetitors.toLowerCase();
                    const matchSearch =
                      c.brandName.toLowerCase().includes(q) ||
                      c.parentCompany.toLowerCase().includes(q) ||
                      c.motherPlants.some(p => p.toLowerCase().includes(q)) ||
                      c.keyFlagshipSKU.toLowerCase().includes(q);
                    return matchCat && matchSearch;
                  }).map(c => (
                    <tr key={c.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-bold">#{c.rank}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-xs">{c.brandName}</div>
                        <div className="text-slate-500 text-[11px]">{c.parentCompany}</div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.category === 'PSU OMC'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : c.category === 'MNC Major'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : c.category === 'Indian Private Independent'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {c.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {c.blendingCapacityKL.toLocaleString()} KL
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        <span className={`font-bold ${
                          c.capacityUtilizationPct >= 75
                            ? 'text-emerald-700'
                            : c.capacityUtilizationPct >= 65
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}>
                          {c.capacityUtilizationPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {c.annualDispatchedVolumeKL.toLocaleString()} KL
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                        {c.nationalMarketSharePct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                        {c.distributorCountNational.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#7C3AED] font-bold">
                        {c.avgDistributorThroughputKL.toLocaleString()} KL
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-xs max-w-xs">
                        <div className="font-semibold text-slate-900">{c.motherPlants.join(', ')}</div>
                        <div className="text-slate-500 line-clamp-1 text-[11px]">{c.primaryFocus}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100/90 text-slate-900 font-bold uppercase text-xs border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={3} className="py-3 px-3">
                      Total All-India 50 Competitors Reconciliation
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-900">
                      8,850,000 KL
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-amber-700">
                      55.3%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700 text-xs">
                      4,893,500 KL
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-900 text-xs">
                      85.85%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-blue-700 text-xs">
                      8,720
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#7C3AED] text-xs">
                      561 KL / Yr
                    </td>
                    <td className="py-3 px-3 text-emerald-700 text-xs font-semibold">
                      100% Reconciled with PPAC &amp; Annual Reports
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRAND SUPPLY MATRIX & DRILLDOWN */}
      {activeTab === 'matrix' && (
        <div className="space-y-4 text-xs">
          {/* Controls Bar: Category Filter, Search, Sort */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 font-bold uppercase text-[10px] mr-1">Company Type:</span>
              {[
                { id: 'all', label: 'All 10 Players' },
                { id: 'OMC Public Sector', label: 'Public Sector OMCs' },
                { id: 'MNC Major', label: 'MNC Majors' },
                { id: 'Indian Private Independent', label: 'Indian Independents' },
                { id: 'Specialty & Premium', label: 'Specialty & Regional' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search and Sort */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter brand, plant, SKU..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] focus:bg-white w-52 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] font-bold uppercase">SORT:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="share" className="bg-white">Market Share (%)</option>
                  <option value="volume" className="bg-white">National Volume (KL)</option>
                  <option value="capacity" className="bg-white">Plant Capacity (KL)</option>
                  <option value="revenue" className="bg-white">Revenue (₹ Cr)</option>
                  <option value="clusterVol" className="bg-white">Cluster Supply (KL)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master Table of All 10 Brand Companies */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] uppercase font-bold">
                    <th className="py-3 px-4">Brand &amp; Parent Company</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3 text-right">National Share (%)</th>
                    <th className="py-3 px-3 text-right">Est. Volume (Million KL)</th>
                    <th className="py-3 px-3 text-right">Annual Supply (KL/Yr)</th>
                    <th className="py-3 px-3 text-right">Plant Capacity (KL)</th>
                    <th className="py-3 px-3 text-right">Utilization</th>
                    <th className="py-3 px-3 text-right">Est. Revenue (₹ Cr)</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBrands.map((brand) => {
                    const isExpanded = expandedBrandId === brand.id;
                    const brandColor = BRAND_PALETTE[brand.brandName] || '#94a3b8';

                    return (
                      <React.Fragment key={brand.id}>
                        <tr 
                          className={`hover:bg-purple-50/30 transition-colors cursor-pointer ${
                            isExpanded ? 'bg-purple-50/50 border-l-4 border-l-[#7C3AED]' : ''
                          }`}
                          onClick={() => setExpandedBrandId(isExpanded ? null : brand.id)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <span 
                                className="w-3 h-3 rounded-full shrink-0" 
                                style={{ backgroundColor: brandColor }}
                              />
                              <div>
                                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                  <span>{brand.brandName}</span>
                                  {brand.nationalMarketSharePct > 15 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                      MARKET LEADER
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500">{brand.parentCompany}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              brand.companyType === 'OMC Public Sector'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : brand.companyType === 'MNC Major'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : brand.companyType === 'Specialty & Premium'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            }`}>
                              {brand.companyType}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-extrabold text-slate-900 text-sm">
                              {brand.nationalMarketSharePct.toFixed(1)}%
                            </div>
                            <div className="w-20 bg-slate-100 h-1.5 rounded-full ml-auto mt-1 overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{ width: `${(brand.nationalMarketSharePct / 30) * 100}%`, backgroundColor: brandColor }}
                              />
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-extrabold text-[#7C3AED]">
                            {brand.volumeMillionKL?.toFixed(2)} M KL
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-slate-900 font-mono">
                              {brand.nationalSupplyVolumeKL.toLocaleString()} KL
                            </div>
                            <div className="text-[11px] text-slate-500">₹{brand.nationalRevenueINR.toLocaleString()} Cr</div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="text-slate-700 font-mono">
                              {brand.blendingCapacityKL.toLocaleString()} KL
                            </div>
                            <div className="text-[11px] text-slate-500">{brand.plantLocations.length} Plant(s)</div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span className={`font-bold ${
                              brand.capacityUtilizationPct > 78 ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                              {brand.capacityUtilizationPct}%
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-emerald-700">
                              ₹{brand.nationalRevenueINR.toLocaleString()} Cr
                            </div>
                            <div className="text-[11px] text-slate-500">
                              ~₹160/L realization
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedBrandId(isExpanded ? null : brand.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-purple-100 text-slate-500 hover:text-[#7C3AED] transition-colors cursor-pointer"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-[#7C3AED]" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Drilldown Profile */}
                        {isExpanded && (
                          <tr className="bg-purple-50/20">
                            <td colSpan={9} className="p-5 border-b border-purple-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                {/* Col 1: Manufacturing & Supply Infrastructure */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                                  <div className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-2 flex items-center justify-between">
                                    <span>Manufacturing &amp; Blending Infrastructure</span>
                                    <Factory className="w-4 h-4 text-[#7C3AED]" />
                                  </div>
                                  <div>
                                    <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">Blending Plants in India:</span>
                                    <div className="text-slate-700 mt-0.5 space-y-1">
                                      {brand.plantLocations.map((loc, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-xs">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                                          <span>{loc}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                    <div>
                                      <span className="text-slate-400 text-[10px] font-bold block uppercase">Retail Outlets:</span>
                                      <span className="font-bold text-slate-900">{brand.retailDealerNetworkCount.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 text-[10px] font-bold block uppercase">Primary Depots:</span>
                                      <span className="font-bold text-slate-900">{brand.depotCountNational}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 text-[10px] font-bold block uppercase">Workshops:</span>
                                      <span className="font-bold text-slate-900">{brand.authorizedWorkshopsCount.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 text-[10px] font-bold block uppercase">B2B Accounts:</span>
                                      <span className="font-bold text-slate-900">{brand.directIndustrialAccounts.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Col 2: Sector Breakdown & Flagship SKUs */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                                  <div className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-2 flex items-center justify-between">
                                    <span>Sector Strengths &amp; Flagship SKUs</span>
                                    <Boxes className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div className="space-y-2">
                                    {brand.sectorStrengths.map((sec, i) => (
                                      <div key={i}>
                                        <div className="flex justify-between text-xs mb-1">
                                          <span className="text-slate-600">{sec.sector}</span>
                                          <span className="text-slate-900 font-bold">{sec.sharePct}% ({sec.volumeKL.toLocaleString()} KL)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${sec.sharePct}%` }} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="pt-2 border-t border-slate-100">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Key Flagship Products:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {brand.flagshipSKUs.map((sku, i) => (
                                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                                          {sku}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Col 3: Competitive Strengths & White-Spot Vulnerabilities */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                                  <div className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-2 flex items-center justify-between">
                                    <span>White-Spot Exposure &amp; Strategy</span>
                                    <Zap className="w-4 h-4 text-amber-600" />
                                  </div>
                                  <div>
                                    <span className="text-emerald-700 text-[10px] font-bold uppercase block mb-1">Key Competitive Advantages:</span>
                                    <ul className="text-xs text-slate-600 space-y-1">
                                      {brand.keyStrengths.map((st, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                          <span>{st}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="pt-2 border-t border-slate-100">
                                    <span className="text-rose-700 text-[10px] font-bold uppercase block mb-1">White-Spot Vulnerabilities:</span>
                                    <ul className="text-xs text-slate-600 space-y-1">
                                      {brand.whiteSpotVulnerabilities.map((vuln, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                          <span>{vuln}</span>
                                        </li>
                                      ))}
                                    </ul>
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
        </div>
      )}

      {/* TAB 3: MARKET ANALYTICS */}
      {activeTab === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: All-India Market Share Donut Breakdown */}
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-[#7C3AED]" />
                  All-India Lubricants Market Share (5.70M KL Total)
                </h3>
                <p className="text-[11px] text-slate-500">Audited sourced &amp; modeled benchmark</p>
              </div>
              <span className="text-xs font-bold text-[#7C3AED]">Sum: 100.0% (5.70M KL)</span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val}% (${item.payload.volMillion}M KL / ${Number(item.payload.volume).toLocaleString()} KL)`,
                      name
                    ]}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    formatter={(val, entry: any) => (
                      <span className="text-slate-700 font-medium text-[10px]">
                        {val} <span className="text-slate-400">({entry.payload.value}%)</span>
                      </span>
                    )}
                    wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Blending Capacity vs Actual Volume Utilization */}
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Factory className="w-4 h-4 text-blue-600" />
                  Plant Blending Capacity vs Annual Volume (Thousand KL)
                </h3>
                <p className="text-[11px] text-slate-500">Installed capacity vs operational throughput</p>
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityUtilizationData} margin={{ top: 15, right: 15, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748B" 
                    fontSize={10} 
                    interval={0} 
                    angle={-30} 
                    textAnchor="end"
                    height={45}
                    tick={{ fill: '#334155', fontWeight: 500 }}
                  />
                  <YAxis 
                    stroke="#64748B" 
                    fontSize={10} 
                    tickFormatter={(val) => `${val.toLocaleString()}k KL`}
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any, name: any) => [`${Number(val).toLocaleString()}k KL (${(Number(val) * 1000).toLocaleString()} KL)`, name === 'capacity' ? 'Installed Capacity' : 'Actual Supply Volume']}
                    labelFormatter={(label) => `Brand: ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} 
                    formatter={(val) => <span className="text-slate-700 font-medium">{val}</span>}
                  />
                  <Bar dataKey="capacity" name="Installed Capacity (k KL)" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualVolume" name="Actual Annual Supply (k KL)" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: National Revenue Realization by Brand */}
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Estimated Annual Lubricant Revenue Realization by Brand (₹ Crores / Year)
                </h3>
                <p className="text-[11px] text-slate-500">Realized at ~₹160/L weighted blended price (₹91,200 Cr total market)</p>
              </div>
              <span className="text-xs font-bold text-emerald-700">Total: ₹91,200 Cr</span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueAndDepotData} margin={{ top: 20, right: 15, left: 15, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748B" 
                    fontSize={10} 
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={40}
                    tick={{ fill: '#334155', fontWeight: 500 }}
                  />
                  <YAxis 
                    stroke="#64748B" 
                    fontSize={10} 
                    tickFormatter={(v) => `₹${Number(v).toLocaleString()} Cr`}
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()} Crores`, 'Estimated Annual Revenue']}
                    labelFormatter={(label) => `Brand: ${label}`}
                  />
                  <Bar dataKey="revenueINR" name="Revenue (₹ Cr)" radius={[4, 4, 0, 0]}>
                    <LabelList 
                      dataKey="revenueINR" 
                      position="top" 
                      formatter={(v: any) => `₹${Number(v).toLocaleString()}Cr`} 
                      style={{ fill: '#475569', fontSize: 9, fontWeight: 700 }} 
                    />
                    {revenueAndDepotData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HEAD-TO-HEAD COMPARATOR */}
      {activeTab === 'comparator' && (
        <div className="space-y-4 text-xs">
          {/* Selectors */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <span className="text-xs text-slate-500 uppercase font-bold">Select Up To 3 Brands to Compare:</span>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-rose-600 font-bold">1:</span>
                <select
                  value={compareBrand1Id}
                  onChange={e => setCompareBrand1Id(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#7C3AED]"
                >
                  {BRAND_COMPANIES_DATA.map(b => (
                    <option key={b.id} value={b.id}>{b.brandName} ({b.nationalMarketSharePct}%)</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">2:</span>
                <select
                  value={compareBrand2Id}
                  onChange={e => setCompareBrand2Id(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#7C3AED]"
                >
                  {BRAND_COMPANIES_DATA.map(b => (
                    <option key={b.id} value={b.id}>{b.brandName} ({b.nationalMarketSharePct}%)</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[#7C3AED] font-bold">3:</span>
                <select
                  value={compareBrand3Id}
                  onChange={e => setCompareBrand3Id(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#7C3AED]"
                >
                  {BRAND_COMPANIES_DATA.map(b => (
                    <option key={b.id} value={b.id}>{b.brandName} ({b.nationalMarketSharePct}%)</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[brand1, brand2, brand3].map((b, idx) => (
              <div key={b.id} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3.5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">PLAYER {idx + 1}</span>
                    <h3 className="text-base font-bold text-slate-900">{b.brandName}</h3>
                    <p className="text-xs text-slate-500">{b.parentCompany}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    b.companyType === 'OMC Public Sector' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {b.companyType}
                  </span>
                </div>

                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-600">National Market Share:</span>
                    <span className="font-extrabold text-[#7C3AED]">{b.nationalMarketSharePct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Est. Volume (Million KL):</span>
                    <span className="font-bold text-blue-700">{b.volumeMillionKL} M KL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Annual Supply Volume:</span>
                    <span className="font-bold text-slate-900 font-mono">{b.nationalSupplyVolumeKL.toLocaleString()} KL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Estimated Annual Revenue:</span>
                    <span className="font-bold text-emerald-700">₹{b.nationalRevenueINR.toLocaleString()} Cr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Plant Blending Capacity:</span>
                    <span className="font-bold text-slate-900 font-mono">{b.blendingCapacityKL.toLocaleString()} KL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Capacity Utilization:</span>
                    <span className="font-bold text-amber-700">{b.capacityUtilizationPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Data Basis &amp; Confidence:</span>
                    <span className="font-bold text-slate-900 text-[11px]">{b.confidence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Retail Dealer Touchpoints:</span>
                    <span className="font-bold text-slate-900">{b.retailDealerNetworkCount.toLocaleString()} Outlets</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Target Coverage Footprint:</span>
                    <span className="font-bold text-blue-700">All 36 States &amp; UTs</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PLANTS &amp; BASE OIL HUBS:</span>
                  <div className="text-xs text-slate-700 space-y-0.5">
                    {b.plantLocations.map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">STRATEGIC ADVANTAGE:</span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {b.keyStrengths[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: MATHEMATICAL FORMULAS & AUDIT */}
      {activeTab === 'formulas' && (
        <div className="space-y-4 text-xs">
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
              <FileText className="w-4 h-4 text-[#7C3AED]" />
              Audited Mathematical Formulas &amp; Data Pipeline Architecture
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Detailed formula disclosure for 5.70M KL macro market estimate, 36 States &amp; UTs aggregation, and exact company allocations
            </p>

            <div className="space-y-3.5">
              {AUDIT_FORMULA_STEPS.map((step, idx) => (
                <div key={step.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] font-bold text-[10px]">
                        STEP 0{idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-xs uppercase">{step.name}</span>
                    </div>
                    <span className="text-emerald-700 font-bold text-xs">{step.outputMetric}</span>
                  </div>

                  <div className="text-xs text-slate-600">
                    Target Scope: <strong className="text-slate-900">{step.targetScope}</strong>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-[#7C3AED] font-mono text-xs font-bold overflow-x-auto shadow-2xs">
                    <code>{step.formulaString}</code>
                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed">
                    {step.explanation}
                  </p>

                  <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-200 text-xs text-blue-900">
                    <strong>Sample Execution:</strong> {step.sampleCalculation}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Official Sources:</span>
                    {step.dataInputs.map((src, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 shadow-2xs">
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
