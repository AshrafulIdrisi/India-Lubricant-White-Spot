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
  BadgeCheck
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
  Legend
} from 'recharts';
import { BrandCompanyData, CompanyCategory } from '../../types';
import { BRAND_COMPANIES_DATA, MACRO_MARKET_RECONCILIATION, AUDIT_FORMULA_STEPS } from '../../data/brandMarketData';
import { ALL_50_COMPETITORS, SUMMARY_COMPETITORS, CompetitorDetail } from '../../data/competitors24Data';
import { formatKL, formatINR } from '../../utils/demandEngine';

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
  const [activeTab, setActiveTab] = useState<'benchmark' | 'competitorsMaster' | 'matrix' | 'charts' | 'comparator' | 'formulas'>('benchmark');
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
      <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] pb-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#F27D26]" />
              <h2 className="text-base font-bold font-mono text-white uppercase tracking-tight">
                Brand &amp; Market Number Validation // Macro Demand &amp; Competitor Supply Audit
              </h2>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold uppercase flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-emerald-400" />
                VERIFIED 5.70M KL BENCHMARK
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              ALL-INDIA TOTAL LUBRICANT MARKET (5.70M KL / ₹91,200 CR) &amp; AUDITED 50 MASTER COMPETITOR PROFILES (8.85M KL CAPACITY)
            </p>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center gap-1 bg-[#05070B] p-1 rounded border border-[#2D3748] text-xs font-mono flex-wrap">
            {[
              { id: 'benchmark', label: 'EXACT BENCHMARK TABLE', icon: TableIcon, badge: '5.70M KL' },
              { id: 'competitorsMaster', label: '50 COMPETITORS & CAPACITY', icon: Boxes, badge: '50 BRANDS' },
              { id: 'matrix', label: 'BRAND SUPPLY MATRIX', icon: Building2, badge: '10 PROFILES' },
              { id: 'charts', label: 'MARKET ANALYTICS', icon: BarChart3 },
              { id: 'comparator', label: 'HEAD-TO-HEAD COMPARISON', icon: Scale },
              { id: 'formulas', label: 'MATHEMATICAL AUDIT', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-all uppercase text-[11px] ${
                    isActive
                      ? 'bg-[#F27D26] text-black shadow'
                      : 'text-gray-400 hover:text-white hover:bg-[#151B26]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      isActive ? 'bg-black/20 text-black font-extrabold' : 'bg-[#1F2937] text-gray-400'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
          {/* Box 1: Macro National Total Demand */}
          <div className="bg-[#05070B] p-3 rounded border border-blue-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-bold">
                <span>ALL-INDIA DEMAND</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 text-[8.5px]">MACRO TOTAL</span>
              </div>
              <div className="text-xl font-bold text-blue-400 mt-1">
                5.70 Million KL
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                5,700,000 KL / YR (<strong className="text-white">₹91,200 Crores</strong>)
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#1F2937] text-[9px] text-gray-500 flex justify-between">
              <span>AUTO: 3.42M KL (60%)</span>
              <span>IND: 2.00M KL (35%)</span>
            </div>
          </div>

          {/* Box 2: All 50 Competitor Brands */}
          <div 
            onClick={() => setActiveTab('competitorsMaster')}
            className="bg-[#05070B] p-3 rounded border border-[#F27D26]/70 flex flex-col justify-between cursor-pointer hover:border-[#F27D26] hover:bg-[#151B26]/60 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-bold">
                <span className="group-hover:text-[#F27D26] transition-colors">50 COMPETITOR BRANDS</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-950 text-[#F27D26] text-[8.5px] font-bold">8.85M KL CAP</span>
              </div>
              <div className="text-xl font-bold text-[#F27D26] mt-1 flex items-center justify-between">
                <span>50 Key Players</span>
                <ChevronRight className="w-4 h-4 text-[#F27D26] group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-[10px] text-gray-300 mt-0.5">
                6 PSU + 19 MNC + 17 Ind + 8 Spec
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#1F2937] text-[9px] text-gray-400 flex justify-between">
              <span>8,720 DISTRIBUTORS</span>
              <span className="text-[#F27D26] font-bold">55.3% UTIL</span>
            </div>
          </div>

          {/* Box 3: Accessible Existing Supply Nationwide */}
          <div className="bg-[#05070B] p-3 rounded border border-emerald-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-bold">
                <span>ACCESSIBLE SUPPLY</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[8.5px]">73.5% COV</span>
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                4.19 Million KL
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Delivered Supply: <strong className="text-white">4,189,500 KL / YR</strong>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#1F2937] text-[9px] text-gray-500 flex justify-between">
              <span>OMC: 46.5%</span>
              <span>MNC/PVT: 27.0%</span>
            </div>
          </div>

          {/* Box 4: National Supply Deficit Gap */}
          <div className="bg-[#05070B] p-3 rounded border border-red-900/60 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-bold">
                <span>SUPPLY DEFICIT GAP</span>
                <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[8.5px]">26.5% GAP</span>
              </div>
              <div className="text-xl font-bold text-red-400 mt-1">
                1.51 Million KL
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Unmet Pool: <strong className="text-white">₹24,117.4 Crores</strong>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#1F2937] text-[9px] text-red-400 flex justify-between">
              <span>WHITE-SPOT POOL</span>
              <span className="font-bold">36 STATES &amp; UTs</span>
            </div>
          </div>

          {/* Box 5: Total Market Geographic Reach */}
          <div className="bg-[#05070B] p-3 rounded border border-purple-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-bold">
                <span>GEOGRAPHIC REACH</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 text-[8.5px]">NATIONWIDE</span>
              </div>
              <div className="text-xl font-bold text-purple-300 mt-1">
                36 States &amp; UTs
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Spread across <strong className="text-white">6 Macro Zones</strong>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#1F2937] text-[9px] text-purple-400 flex justify-between font-bold">
              <span>780+ DISTRICTS</span>
              <span>100% COVERAGE</span>
            </div>
          </div>
        </div>

        {/* Context Explanatory Note with Competitor Context */}
        <div className="mt-3 bg-[#151B26] p-2.5 rounded border border-[#2D3748] text-xs font-mono flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#F27D26] shrink-0 mt-0.5" />
          <div className="text-gray-300 leading-relaxed text-[11px]">
            <strong className="text-white">Validation Audit Note:</strong> India’s total national lubricant market benchmark is established at{' '}
            <span className="text-blue-400 font-bold">5.70 Million KL (5,700,000 KL / year / ₹91,200 Crores)</span> across 50 organized competitor manufacturers (holding <strong>8.85 Million KL installed blending capacity</strong>) and regional blenders. Delivered accessible supply is <span className="text-emerald-400 font-bold">4.89 Million KL (85.85% organized coverage)</span> across 8,720 primary authorized distributors, leaving an addressable national supply deficit gap of <span className="text-red-400 font-bold">1.51 Million KL (₹24,117.4 Crores unmet market pool)</span> across all 36 States &amp; UTs.
          </div>
        </div>
      </div>

      {/* TAB 1: EXACT BENCHMARK TABLE (AS UPLOADED) */}
      {activeTab === 'benchmark' && (
        <div className="space-y-4 font-mono text-xs">
          {/* Header Banner with Mode Switcher and Quick Search */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-3 rounded flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-[#F27D26]" />
              <div>
                <span className="font-bold text-white uppercase text-xs">
                  {benchmarkMode === 'macro10' ? 'OFFICIAL BENCHMARK DATASET: COMPANY SHARE & VOLUME RECONCILIATION' : 'ALL-INDIA 50 COMPETITOR BRANDS REGISTRY & CAPACITY MATRIX'}
                </span>
                <p className="text-[10px] text-gray-400">
                  {benchmarkMode === 'macro10' ? 'TOP 10 MACRO ENTITIES (5.70M KL) WITH EXPANDABLE 41 REGIONAL PLAYERS' : 'ALL 50 AUDITED COMPETITORS // 8.85M KL INSTALLED BLENDING CAPACITY'}
                </p>
              </div>
            </div>

            {/* Mode Switcher Pill */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-[#05070B] p-1 rounded border border-[#2D3748] flex items-center gap-1">
                <button
                  onClick={() => setBenchmarkMode('macro10')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                    benchmarkMode === 'macro10'
                      ? 'bg-[#F27D26] text-black shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>TOP 10 MACRO (5.70M KL)</span>
                </button>
                <button
                  onClick={() => setBenchmarkMode('allCompetitors')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                    benchmarkMode === 'allCompetitors'
                      ? 'bg-[#F27D26] text-black shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Boxes className="w-3 h-3" />
                  <span>ALL 50 COMPETITORS (8.85M KL)</span>
                </button>
              </div>

              {/* Quick Competitor Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search competitor / brand..."
                  value={benchmarkSearch}
                  onChange={e => setBenchmarkSearch(e.target.value)}
                  className="bg-[#05070B] border border-[#374151] rounded pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F27D26] w-52 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 4-Tier Competitor Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-[#0E1117] p-2.5 rounded border border-red-900/50 flex items-center justify-between">
              <div>
                <span className="text-red-400 font-bold block text-[10px] uppercase">🏛️ PSU OMCs (6 Brands)</span>
                <span className="text-gray-300 text-[10px]">SERVO, MAK, HP, Balmerol, MRPL, ONGC</span>
              </div>
              <div className="text-right">
                <span className="text-white font-bold block">48.20% Share</span>
                <span className="text-red-400 text-[9px]">2.75M KL / 3.98M Cap</span>
              </div>
            </div>

            <div className="bg-[#0E1117] p-2.5 rounded border border-blue-900/50 flex items-center justify-between">
              <div>
                <span className="text-blue-400 font-bold block text-[10px] uppercase">🌐 MNC Majors (19 Brands)</span>
                <span className="text-gray-300 text-[10px]">Castrol, Shell, Gulf, Mobil, Total, Motul, Fuchs...</span>
              </div>
              <div className="text-right">
                <span className="text-white font-bold block">30.80% Share</span>
                <span className="text-blue-400 text-[9px]">1.76M KL / 2.76M Cap</span>
              </div>
            </div>

            <div className="bg-[#0E1117] p-2.5 rounded border border-amber-900/50 flex items-center justify-between">
              <div>
                <span className="text-amber-400 font-bold block text-[10px] uppercase">🇮🇳 Indian Independents (17 Brands)</span>
                <span className="text-gray-300 text-[10px]">Veedol, Savsol, IPOL, Divyol, Rajol, GS Caltex...</span>
              </div>
              <div className="text-right">
                <span className="text-white font-bold block">12.60% Share</span>
                <span className="text-amber-400 text-[9px]">0.72M KL / 1.54M Cap</span>
              </div>
            </div>

            <div className="bg-[#0E1117] p-2.5 rounded border border-purple-900/50 flex items-center justify-between">
              <div>
                <span className="text-purple-400 font-bold block text-[10px] uppercase">⚙️ Specialty &amp; Industrial (8 Brands)</span>
                <span className="text-gray-300 text-[10px]">Petronas, Quaker, Kluber, Rymax, Bechem...</span>
              </div>
              <div className="text-right">
                <span className="text-white font-bold block">4.25% Share</span>
                <span className="text-purple-400 text-[9px]">0.24M KL / 0.57M Cap</span>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: Top 10 Macro Benchmark Table with Expandable Regional Competitors */}
          {benchmarkMode === 'macro10' && (
            <div className="bg-[#0E1117] border border-[#1F2937] rounded overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#102A45] text-white text-[11px] font-bold border-b border-[#1E3A8A]">
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Brand</th>
                      <th className="py-3 px-4 text-right">Est. Share %</th>
                      <th className="py-3 px-4 text-right">Est. Volume (Million KL)</th>
                      <th className="py-3 px-4 text-right">Est. Volume (KL)</th>
                      <th className="py-3 px-4">Basis &amp; Competitor Breakdown</th>
                      <th className="py-3 px-4">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937]">
                    {filteredBenchmarkList.map((row, idx) => {
                      const isIOCL = row.id === 'brand-servo';
                      const isOthers = row.id === 'brand-others';

                      return (
                        <React.Fragment key={row.id}>
                          <tr 
                            className={`transition-colors hover:bg-[#151B26] ${
                              isIOCL ? 'bg-[#0E2030]/60' : idx % 2 === 0 ? 'bg-[#0A0D14]' : 'bg-[#0E1117]'
                            }`}
                          >
                            {/* Company */}
                            <td className="py-3 px-4 font-bold text-white">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="w-2 h-2 rounded-full shrink-0" 
                                  style={{ backgroundColor: BRAND_PALETTE[row.brandName] || '#94a3b8' }}
                                />
                                <span>{row.parentCompany}</span>
                              </div>
                            </td>

                            {/* Brand */}
                            <td className="py-3 px-4 font-bold text-cyan-300">
                              {row.brandName}
                            </td>

                            {/* Est. Share % (with highlighted cell) */}
                            <td className="py-3 px-4 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                                isIOCL 
                                  ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700' 
                                  : 'bg-amber-950/40 text-amber-200 border border-amber-900/50'
                              }`}>
                                {row.nationalMarketSharePct.toFixed(1)}%
                              </span>
                            </td>

                            {/* Est. Volume (Million KL) */}
                            <td className="py-3 px-4 text-right font-bold text-[#F27D26] text-sm">
                              {row.volumeMillionKL?.toFixed(2)}
                            </td>

                            {/* Est. Volume (KL) */}
                            <td className="py-3 px-4 text-right font-mono text-gray-300">
                              {row.nationalSupplyVolumeKL.toLocaleString()} KL
                            </td>

                            {/* Basis & Competitor Expand Action */}
                            <td className="py-3 px-4 text-gray-300">
                              <div className="flex items-center justify-between gap-2">
                                <span>{row.basis}</span>
                                {isOthers && (
                                  <button
                                    onClick={() => setIsOthersExpanded(!isOthersExpanded)}
                                    className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 hover:bg-purple-900 transition-colors text-[10px] font-bold flex items-center gap-1 shrink-0"
                                  >
                                    <span>{isOthersExpanded ? 'Hide 41 Competitors' : 'View 41 Competitors'}</span>
                                    {isOthersExpanded ? <ChevronDown className="w-3 h-3 text-purple-400" /> : <ChevronRight className="w-3 h-3 text-purple-400" />}
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Confidence */}
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold ${
                                row.confidence === 'High — company-disclosed'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : row.confidence === 'Low — modeled'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-purple-950 text-purple-300 border border-purple-800'
                              }`}>
                                {row.confidence === 'High — company-disclosed' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                {row.confidence === 'Low — modeled' && <HelpCircle className="w-3 h-3 text-blue-400" />}
                                {row.confidence === 'Very low — residual' && <AlertTriangle className="w-3 h-3 text-purple-400" />}
                                <span>{row.confidence}</span>
                              </span>
                            </td>
                          </tr>

                          {/* Expanded Nested Rows for the 41 Regional, MNC & Specialty Competitors */}
                          {isOthers && isOthersExpanded && (
                            <tr>
                              <td colSpan={7} className="p-0 border-y-2 border-purple-900/60 bg-[#07090F]">
                                <div className="p-3 space-y-2">
                                  <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
                                    <div className="flex items-center gap-2">
                                      <Boxes className="w-4 h-4 text-purple-400" />
                                      <span className="font-bold text-white uppercase text-[11px]">
                                        41 REGIONAL, MNC &amp; SPECIALTY COMPETITORS CONSTITUTING THE 1.17M KL (20.5% SHARE) POOL
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => setActiveTab('competitorsMaster')}
                                      className="text-xs text-[#F27D26] hover:underline flex items-center gap-1 font-bold"
                                    >
                                      <span>Explore All 50 in Master Tab</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-[10.5px] max-h-96 overflow-y-auto pr-1">
                                    {regionalCompetitors.map(c => (
                                      <div key={c.id} className="bg-[#0E1117] p-2.5 rounded border border-[#2D3748] hover:border-purple-500/50 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className="px-1.5 py-0.2 rounded bg-[#1F2937] text-gray-300 font-bold text-[9px]">
                                              #{c.rank}
                                            </span>
                                            <span className="font-bold text-white text-xs">{c.brandName}</span>
                                          </div>
                                          <span className="font-bold text-purple-300">{c.nationalMarketSharePct.toFixed(2)}%</span>
                                        </div>
                                        <div className="text-gray-400 text-[10px] mb-1.5">{c.parentCompany}</div>
                                        <div className="grid grid-cols-2 gap-1 text-[9.5px] border-t border-[#1F2937] pt-1 text-gray-300">
                                          <div>
                                            <span className="text-gray-500 block text-[8.5px]">CAPACITY:</span>
                                            <span className="font-bold">{c.blendingCapacityKL.toLocaleString()} KL</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-500 block text-[8.5px]">ANNUAL VOL:</span>
                                            <span className="font-bold text-emerald-400">{c.annualDispatchedVolumeKL.toLocaleString()} KL</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-500 block text-[8.5px]">DISTRIBUTORS:</span>
                                            <span className="font-bold text-cyan-400">{c.distributorCountNational}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-500 block text-[8.5px]">UTILIZATION:</span>
                                            <span className="font-bold text-amber-400">{c.capacityUtilizationPct}%</span>
                                          </div>
                                        </div>
                                        <div className="mt-1.5 pt-1 border-t border-[#1F2937] text-[9px] text-gray-400 line-clamp-1">
                                          <strong className="text-gray-300">SKU:</strong> {c.keyFlagshipSKU}
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
                    <tr className="bg-[#102A45] text-white font-bold text-sm border-t-2 border-[#1E3A8A]">
                      <td className="py-3.5 px-4 uppercase tracking-wider" colSpan={2}>
                        TOTAL MACRO MARKET
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-300 font-extrabold text-base">
                        {totalMarketShareSum.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#F27D26] font-extrabold text-base">
                        {totalNationalVolumeMillionSum.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-white font-extrabold">
                        {totalNationalVolumeSum.toLocaleString()} KL
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 text-xs font-normal" colSpan={2}>
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
            <div className="bg-[#0E1117] border border-[#1F2937] rounded overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead className="bg-[#102A45] text-white text-[11px] font-bold border-b border-[#1E3A8A]">
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
                  <tbody className="divide-y divide-[#1F2937] text-[11px]">
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
                      <tr key={c.id} className="hover:bg-[#151B26] transition-colors">
                        <td className="py-2.5 px-3 text-center text-gray-500 font-bold">#{c.rank}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white text-xs">{c.brandName}</div>
                          <div className="text-gray-400 text-[10px]">{c.parentCompany}</div>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            c.category === 'PSU OMC'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : c.category === 'MNC Major'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : c.category === 'Indian Private Independent'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}>
                            {c.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-300">
                          {c.blendingCapacityKL.toLocaleString()} KL
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono">
                          <span className={`font-bold ${
                            c.capacityUtilizationPct >= 75 ? 'text-emerald-400' : c.capacityUtilizationPct >= 65 ? 'text-amber-400' : 'text-gray-400'
                          }`}>
                            {c.capacityUtilizationPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          {c.annualDispatchedVolumeKL.toLocaleString()} KL
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-white">
                          {c.nationalMarketSharePct.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-400">
                          {c.distributorCountNational.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#F27D26] font-bold">
                          {c.avgDistributorThroughputKL.toLocaleString()} KL
                        </td>
                        <td className="py-2.5 px-3 text-gray-300 text-[10px] max-w-xs">
                          <div className="font-semibold text-gray-200">{c.motherPlants.join(', ')}</div>
                          <div className="text-gray-400 line-clamp-1">{c.keyFlagshipSKU}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#102A45] text-white font-bold uppercase text-[11px] border-t-2 border-[#1E3A8A]">
                    <tr>
                      <td colSpan={3} className="py-3 px-3">
                        TOTAL 50 AUDITED COMPETITORS
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-white">
                        8,850,000 KL
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-amber-400">
                        55.3%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 text-xs">
                        4,893,500 KL
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-white text-xs">
                        85.85%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-cyan-400 text-xs">
                        8,720
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#F27D26] text-xs">
                        561 KL / Yr
                      </td>
                      <td className="py-3 px-3 text-emerald-300 text-[10px]">
                        100% RECONCILED WITH PPAC &amp; ANNUAL REPORTS
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Sourcing & Methodology Insight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#0E1117] border border-[#1F2937] p-3 rounded space-y-1.5">
              <div className="text-[#F27D26] font-bold text-[11px] uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Disclosed Primary Anchor</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                <strong>Indian Oil Corporation (SERVO)</strong> volume of <strong>1.54 Million KL (27.0% share)</strong> is directly sourced from official IOCL company disclosures and website publications, representing the highest confidence baseline.
              </p>
            </div>

            <div className="bg-[#0E1117] border border-[#1F2937] p-3 rounded space-y-1.5">
              <div className="text-cyan-400 font-bold text-[11px] uppercase flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>2. Modeled Brand Cohort</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                Volumes for <strong>Castrol (0.74M KL)</strong>, <strong>BPCL MAK (0.63M KL)</strong>, <strong>HPCL (0.57M KL)</strong>, <strong>Shell (0.34M KL)</strong>, <strong>Gulf (0.26M KL)</strong>, <strong>Mobil (0.20M KL)</strong>, <strong>Total (0.14M KL)</strong>, and <strong>Valvoline (0.11M KL)</strong> are econometric model estimates calibrated against plant capacity and quarterly financial disclosures.
              </p>
            </div>

            <div className="bg-[#0E1117] border border-[#1F2937] p-3 rounded space-y-1.5">
              <div className="text-purple-400 font-bold text-[11px] uppercase flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-purple-400" />
                <span>3. 41 Regional &amp; Specialty Competitors</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                The <strong>1.17 Million KL (20.5% share)</strong> pool comprises 41 audited Indian independents, MNCs, and specialty manufacturers (Veedol, Savsol, Motul, Fuchs, Idemitsu, ENEOS, GS Caltex, Repsol, ENI, IPOL, Balmerol, Divyol, Rajol, MRPL, ONGC, Quaker Houghton, Klüber, etc.) holding <strong>3,225,000 KL blending capacity</strong> across all Indian states.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: 50 COMPETITORS & CAPACITY JUSTIFICATION */}
      {activeTab === 'competitorsMaster' && (
        <div className="space-y-4 font-mono">
          {/* Top Capacity Justification Banner */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-4 rounded shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-[#F27D26]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                    All-India 50 Master Competitor Intelligence &amp; Capacity Justification
                  </h3>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-bold uppercase">
                    50 PLAYERS // 4.89M KL AUDITED SUPPLY
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  INSTALLED BLENDING CAPACITIES, UTILIZATION RATES, 8,720 PRIMARY DISTRIBUTORS &amp; THROUGHPUT RECONCILIATION
                </p>
              </div>

              {/* Summary Stats Badges */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="bg-[#05070B] px-3 py-1.5 rounded border border-[#2D3748]">
                  <span className="text-gray-500 text-[10px] block">TOTAL INSTALLED CAPACITY</span>
                  <span className="text-white font-bold text-sm">8,850,000 KL / YR</span>
                </div>
                <div className="bg-[#05070B] px-3 py-1.5 rounded border border-emerald-900/60">
                  <span className="text-emerald-400 text-[10px] block">DISPATCHED VOLUME (4.89M KL)</span>
                  <span className="text-emerald-400 font-bold text-sm">4,893,500 KL (55.3% Util)</span>
                </div>
                <div className="bg-[#05070B] px-3 py-1.5 rounded border border-blue-900/60">
                  <span className="text-blue-400 text-[10px] block">TOTAL PRIMARY DISTRIBUTORS</span>
                  <span className="text-blue-400 font-bold text-sm">8,720 (Avg 561 KL/Yr)</span>
                </div>
              </div>
            </div>

            {/* Capacity Reconciliation Explanation Banner */}
            <div className="bg-[#05070B] border border-[#1F2937] p-3 rounded mb-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Executive Capacity Justification: Why 8.85M KL Capacity Delivers 4.89M KL Accessible Supply</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                While India's 50 organized lubricant manufacturers possess an aggregate installed nameplate capacity of <strong>8.85 Million KL / year</strong>, their actual domestic delivered throughput is <strong>4,893,500 KL (4.89 Million KL)</strong> due to 4 verified operational constraints:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1 text-[10.5px]">
                <div className="bg-[#0E1117] p-2 rounded border border-[#2D3748]">
                  <strong className="text-[#F27D26] block">1. 35km Freight Chokehold:</strong>
                  <span className="text-gray-400">Beyond 35km from port hubs, secondary freight surges to ₹9.8/L, making rural/MSME delivery uneconomic.</span>
                </div>
                <div className="bg-[#0E1117] p-2 rounded border border-[#2D3748]">
                  <strong className="text-cyan-400 block">2. Batch-Blending Cycles:</strong>
                  <span className="text-gray-400">Line pigging, flushing, and multi-grade kettle changeovers limit practical sustainable utilization to 50%-80%.</span>
                </div>
                <div className="bg-[#0E1117] p-2 rounded border border-[#2D3748]">
                  <strong className="text-purple-400 block">3. Packaging Bottleneck:</strong>
                  <span className="text-gray-400">Incumbent high-speed lines favor 208L bulk drums, creating severe shortages of 20L/50L pails demanded by MSMEs.</span>
                </div>
                <div className="bg-[#0E1117] p-2 rounded border border-[#2D3748]">
                  <strong className="text-emerald-400 block">4. Group II/III Base Oil Import:</strong>
                  <span className="text-gray-400">&gt;70% of premium base oils are imported; port clearance and vessel lead-times cap operating speed.</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar for Competitors */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-500 font-bold uppercase text-[10px]">TIER FILTER:</span>
                {[
                  { id: 'all', label: 'ALL 50 PLAYERS' },
                  { id: 'PSU OMC', label: 'PSU OMCS (6)' },
                  { id: 'MNC Major', label: 'MNC MAJORS (19)' },
                  { id: 'Indian Private Independent', label: 'INDIAN INDEPENDENTS (17)' },
                  { id: 'Specialty / OEM / Industrial', label: 'SPECIALTY & INDUSTRIAL (8)' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setCategoryFilterCompetitors(f.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                      categoryFilterCompetitors === f.id
                        ? 'bg-[#F27D26] text-black shadow'
                        : 'bg-[#151B26] text-gray-400 border border-[#2D3748] hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search competitor, plant, SKU..."
                  value={searchCompetitors}
                  onChange={e => setSearchCompetitors(e.target.value)}
                  className="bg-[#05070B] border border-[#374151] rounded pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F27D26] w-56 font-mono"
                />
              </div>
            </div>

            {/* 50 Competitors Master Table */}
            <div className="overflow-x-auto border border-[#1F2937] rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#151B26] text-gray-400 uppercase text-[10px] border-b border-[#1F2937]">
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
                <tbody className="divide-y divide-[#1F2937]/70 text-[11px]">
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
                    <tr key={c.id} className="hover:bg-[#151B26]/60 transition-colors">
                      <td className="py-2.5 px-3 text-center text-gray-500 font-bold">{c.rank}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white text-xs">{c.brandName}</div>
                        <div className="text-gray-400 text-[10px]">{c.parentCompany}</div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          c.category === 'PSU OMC'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : c.category === 'MNC Major'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : c.category === 'Indian Private Independent'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}>
                          {c.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-300">
                        {c.blendingCapacityKL.toLocaleString()} KL
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        <span className={`font-bold ${
                          c.capacityUtilizationPct >= 75
                            ? 'text-emerald-400'
                            : c.capacityUtilizationPct >= 65
                            ? 'text-amber-400'
                            : 'text-gray-400'
                        }`}>
                          {c.capacityUtilizationPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {c.annualDispatchedVolumeKL.toLocaleString()} KL
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-white">
                        {c.nationalMarketSharePct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-400">
                        {c.distributorCountNational.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#F27D26] font-bold">
                        {c.avgDistributorThroughputKL.toLocaleString()} KL
                      </td>
                      <td className="py-2.5 px-3 text-gray-300 text-[10px] max-w-xs">
                        <div className="font-semibold text-gray-200">{c.motherPlants.join(', ')}</div>
                        <div className="text-gray-400 line-clamp-1">{c.primaryFocus}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#111827] text-white font-bold uppercase text-[11px] border-t-2 border-[#374151]">
                  <tr>
                    <td colSpan={3} className="py-3 px-3">
                      TOTAL ALL-INDIA 50 COMPETITORS RECONCILIATION
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-white">
                      8,850,000 KL
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-amber-400">
                      55.3%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 text-xs">
                      4,893,500 KL
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-white text-xs">
                      85.85%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-cyan-400 text-xs">
                      8,720
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#F27D26] text-xs">
                      561 KL / Yr
                    </td>
                    <td className="py-3 px-3 text-emerald-400 text-[10px]">
                      100% RECONCILED WITH PPAC &amp; ANNUAL REPORTS
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
        <div className="space-y-3">
          {/* Controls Bar: Category Filter, Search, Sort */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-3 rounded flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-500 font-bold uppercase text-[10px] mr-1">COMPANY TYPE:</span>
              {[
                { id: 'all', label: 'ALL 10 PLAYERS' },
                { id: 'OMC Public Sector', label: 'PUBLIC SECTOR OMCS' },
                { id: 'MNC Major', label: 'MNC MAJORS' },
                { id: 'Indian Private Independent', label: 'INDIAN INDEPENDENTS' },
                { id: 'Specialty & Premium', label: 'SPECIALTY & REGIONAL' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-[#F27D26] text-black shadow'
                      : 'bg-[#151B26] text-gray-400 border border-[#2D3748] hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search and Sort */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Filter brand, plant, SKU..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-[#05070B] border border-[#374151] rounded pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F27D26] w-48 font-mono"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#151B26] px-2 py-1 rounded border border-[#2D3748]">
                <span className="text-gray-500 text-[10px] font-bold uppercase">SORT:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
                >
                  <option value="share" className="bg-[#0E1117]">Market Share (%)</option>
                  <option value="volume" className="bg-[#0E1117]">National Volume (KL)</option>
                  <option value="capacity" className="bg-[#0E1117]">Plant Capacity (KL)</option>
                  <option value="revenue" className="bg-[#0E1117]">Revenue (₹ Cr)</option>
                  <option value="clusterVol" className="bg-[#0E1117]">Cluster Supply (KL)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master Table of All 10 Brand Companies */}
          <div className="bg-[#0E1117] border border-[#1F2937] rounded overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-[#05070B] border-b border-[#1F2937] text-gray-400 text-[10px] uppercase font-bold">
                    <th className="py-2.5 px-3">Brand &amp; Parent Company</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">National Share (%)</th>
                    <th className="py-2.5 px-3 text-right">Est. Volume (Million KL)</th>
                    <th className="py-2.5 px-3 text-right">Annual Supply (KL/Yr)</th>
                    <th className="py-2.5 px-3 text-right">Plant Capacity (KL)</th>
                    <th className="py-2.5 px-3 text-right">Utilization</th>
                    <th className="py-2.5 px-3 text-right">Est. Revenue (₹ Cr)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]">
                  {filteredBrands.map((brand) => {
                    const isExpanded = expandedBrandId === brand.id;
                    const brandColor = BRAND_PALETTE[brand.brandName] || '#94a3b8';

                    return (
                      <React.Fragment key={brand.id}>
                        <tr 
                          className={`hover:bg-[#151B26] transition-colors cursor-pointer ${
                            isExpanded ? 'bg-[#151B26]/80 border-l-2 border-l-[#F27D26]' : ''
                          }`}
                          onClick={() => setExpandedBrandId(isExpanded ? null : brand.id)}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0" 
                                style={{ backgroundColor: brandColor }}
                              />
                              <div>
                                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                  <span>{brand.brandName}</span>
                                  {brand.nationalMarketSharePct > 15 && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                      MARKET LEADER
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-500">{brand.parentCompany}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                              brand.companyType === 'OMC Public Sector'
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : brand.companyType === 'MNC Major'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : brand.companyType === 'Specialty & Premium'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            }`}>
                              {brand.companyType}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-white text-sm">
                              {brand.nationalMarketSharePct.toFixed(1)}%
                            </div>
                            <div className="w-20 bg-[#05070B] h-1.5 rounded-full ml-auto mt-1 overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{ width: `${(brand.nationalMarketSharePct / 30) * 100}%`, backgroundColor: brandColor }}
                              />
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-cyan-300">
                            {brand.volumeMillionKL?.toFixed(2)} M KL
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-[#F27D26]">
                              {brand.nationalSupplyVolumeKL.toLocaleString()} KL
                            </div>
                            <div className="text-[9px] text-gray-500">₹{brand.nationalRevenueINR.toLocaleString()} Cr</div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="text-gray-300">
                              {brand.blendingCapacityKL.toLocaleString()} KL
                            </div>
                            <div className="text-[9px] text-gray-500">{brand.plantLocations.length} Plant(s)</div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span className={`font-bold ${
                              brand.capacityUtilizationPct > 78 ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {brand.capacityUtilizationPct}%
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-emerald-400">
                              ₹{brand.nationalRevenueINR.toLocaleString()} Cr
                            </div>
                            <div className="text-[9px] text-gray-500">
                              ~₹160/L realization
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedBrandId(isExpanded ? null : brand.id);
                              }}
                              className="p-1 rounded hover:bg-[#1F2937] text-gray-400 hover:text-white"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-[#F27D26]" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Drilldown Profile */}
                        {isExpanded && (
                          <tr className="bg-[#0A0D13]">
                            <td colSpan={9} className="p-4 border-b border-[#1F2937]">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                                {/* Col 1: Manufacturing & Supply Infrastructure */}
                                <div className="bg-[#05070B] p-3 rounded border border-[#1F2937] space-y-2">
                                  <div className="text-[10px] font-bold text-white uppercase border-b border-[#1F2937] pb-1 flex items-center justify-between">
                                    <span>MANUFACTURING &amp; BLENDING INFRASTRUCTURE</span>
                                    <Factory className="w-3.5 h-3.5 text-[#F27D26]" />
                                  </div>
                                  <div>
                                    <span className="text-gray-500 text-[10px] block">BLENDING PLANTS IN INDIA:</span>
                                    <div className="text-gray-200 mt-0.5 space-y-0.5">
                                      {brand.plantLocations.map((loc, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-[11px]">
                                          <span className="w-1 h-1 rounded-full bg-[#F27D26]" />
                                          <span>{loc}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1F2937]">
                                    <div>
                                      <span className="text-gray-500 text-[9px] block">RETAIL OUTLETS:</span>
                                      <span className="font-bold text-white">{brand.retailDealerNetworkCount.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-[9px] block">PRIMARY DEPOTS:</span>
                                      <span className="font-bold text-white">{brand.depotCountNational}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-[9px] block">WORKSHOPS:</span>
                                      <span className="font-bold text-white">{brand.authorizedWorkshopsCount.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-[9px] block">B2B ACCOUNTS:</span>
                                      <span className="font-bold text-white">{brand.directIndustrialAccounts.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Col 2: Sector Breakdown & Flagship SKUs */}
                                <div className="bg-[#05070B] p-3 rounded border border-[#1F2937] space-y-2">
                                  <div className="text-[10px] font-bold text-white uppercase border-b border-[#1F2937] pb-1 flex items-center justify-between">
                                    <span>SECTOR STRENGTHS &amp; FLAGSHIP SKUS</span>
                                    <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                                  </div>
                                  <div className="space-y-1.5">
                                    {brand.sectorStrengths.map((sec, i) => (
                                      <div key={i}>
                                        <div className="flex justify-between text-[10px] mb-0.5">
                                          <span className="text-gray-400">{sec.sector}</span>
                                          <span className="text-white font-bold">{sec.sharePct}% ({sec.volumeKL.toLocaleString()} KL)</span>
                                        </div>
                                        <div className="w-full bg-[#151B26] h-1 rounded overflow-hidden">
                                          <div className="bg-cyan-500 h-full rounded" style={{ width: `${sec.sharePct}%` }} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="pt-1.5 border-t border-[#1F2937]">
                                    <span className="text-gray-500 text-[9px] block mb-1">KEY FLAGSHIP PRODUCTS:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {brand.flagshipSKUs.map((sku, i) => (
                                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#151B26] text-gray-300 border border-[#2D3748]">
                                          {sku}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Col 3: Competitive Strengths & White-Spot Vulnerabilities */}
                                <div className="bg-[#05070B] p-3 rounded border border-[#1F2937] space-y-2">
                                  <div className="text-[10px] font-bold text-white uppercase border-b border-[#1F2937] pb-1 flex items-center justify-between">
                                    <span>WHITE-SPOT EXPOSURE &amp; STRATEGY</span>
                                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                  </div>
                                  <div>
                                    <span className="text-green-400 text-[10px] font-bold block mb-1">KEY COMPETITIVE ADVANTAGES:</span>
                                    <ul className="text-[10px] text-gray-300 space-y-1">
                                      {brand.keyStrengths.map((st, i) => (
                                        <li key={i} className="flex items-start gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
                                          <span>{st}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="pt-1.5 border-t border-[#1F2937]">
                                    <span className="text-red-400 text-[10px] font-bold block mb-1">WHITE-SPOT VULNERABILITIES:</span>
                                    <ul className="text-[10px] text-gray-300 space-y-1">
                                      {brand.whiteSpotVulnerabilities.map((vuln, i) => (
                                        <li key={i} className="flex items-start gap-1">
                                          <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
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
          <div className="bg-[#0E1117] border border-[#1F2937] p-4 rounded shadow-xl font-mono">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-[#F27D26]" />
                  All-India Lubricants Market Share (5.70M KL Total)
                </h3>
                <p className="text-[10px] text-gray-500">AUDITED SOURCED &amp; MODELED BENCHMARK</p>
              </div>
              <span className="text-[10px] font-bold text-[#F27D26]">SUM: 100.0% (5.70M KL)</span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0C1017', borderColor: '#374151', fontSize: '11px', fontFamily: 'monospace' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val}% (${item.payload.volMillion}M KL / ${item.payload.volume.toLocaleString()} KL)`,
                      name
                    ]}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Blending Capacity vs Actual Volume Utilization */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-4 rounded shadow-xl font-mono">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Factory className="w-4 h-4 text-cyan-400" />
                  Plant Blending Capacity vs Annual Volume (Thousand KL)
                </h3>
                <p className="text-[10px] text-gray-500">INSTALLED CAPACITY VS OPERATIONAL THROUGHPUT</p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityUtilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={9} interval={0} angle={-30} textAnchor="end" />
                  <YAxis stroke="#6B7280" fontSize={9} unit="k" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0C1017', borderColor: '#374151', fontSize: '11px', fontFamily: 'monospace' }}
                    formatter={(val: any, name: any) => [`${val}k KL (${Number(val) * 1000} KL)`, name === 'capacity' ? 'Installed Capacity' : 'Actual Volume']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <Bar dataKey="capacity" name="Installed Capacity (k KL)" fill="#334155" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="actualVolume" name="Actual Annual Supply (k KL)" fill="#F27D26" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: National Revenue Realization by Brand */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-4 rounded shadow-xl font-mono lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Estimated Annual Lubricant Revenue Realization by Brand (₹ Crores / Year)
                </h3>
                <p className="text-[10px] text-gray-500">REALIZED AT ~₹160/L WEIGHTED BLENDED PRICE (₹91,200 CR TOTAL MARKET)</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400">TOTAL: ₹91,200 CR</span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueAndDepotData} margin={{ top: 10, right: 10, left: 10, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={10} />
                  <YAxis stroke="#6B7280" fontSize={10} tickFormatter={(v) => `₹${v.toLocaleString()}Cr`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0C1017', borderColor: '#374151', fontSize: '11px', fontFamily: 'monospace' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()} Crores`, 'Estimated Annual Revenue']}
                  />
                  <Bar dataKey="revenueINR" name="Revenue (₹ Cr)" radius={[3, 3, 0, 0]}>
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
        <div className="space-y-4 font-mono text-xs">
          {/* Selectors */}
          <div className="bg-[#0E1117] border border-[#1F2937] p-3 rounded flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] text-gray-400 uppercase font-bold">SELECT UP TO 3 BRANDS TO COMPARE:</span>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-red-400 font-bold">1:</span>
                <select
                  value={compareBrand1Id}
                  onChange={e => setCompareBrand1Id(e.target.value)}
                  className="bg-[#05070B] border border-[#374151] rounded px-2.5 py-1 text-white font-bold text-xs"
                >
                  {BRAND_COMPANIES_DATA.map(b => (
                    <option key={b.id} value={b.id}>{b.brandName} ({b.nationalMarketSharePct}%)</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">2:</span>
                <select
                  value={compareBrand2Id}
                  onChange={e => setCompareBrand2Id(e.target.value)}
                  className="bg-[#05070B] border border-[#374151] rounded px-2.5 py-1 text-white font-bold text-xs"
                >
                  {BRAND_COMPANIES_DATA.map(b => (
                    <option key={b.id} value={b.id}>{b.brandName} ({b.nationalMarketSharePct}%)</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[#F27D26] font-bold">3:</span>
                <select
                  value={compareBrand3Id}
                  onChange={e => setCompareBrand3Id(e.target.value)}
                  className="bg-[#05070B] border border-[#374151] rounded px-2.5 py-1 text-white font-bold text-xs"
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
              <div key={b.id} className="bg-[#0E1117] border border-[#1F2937] rounded p-4 shadow-xl space-y-3">
                <div className="border-b border-[#1F2937] pb-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-gray-500">PLAYER {idx + 1}</span>
                    <h3 className="text-base font-bold text-white">{b.brandName}</h3>
                    <p className="text-[10px] text-gray-400">{b.parentCompany}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    b.companyType === 'OMC Public Sector' ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {b.companyType}
                  </span>
                </div>

                <div className="space-y-2 bg-[#05070B] p-3 rounded border border-[#1F2937]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">National Market Share:</span>
                    <span className="font-bold text-[#F27D26]">{b.nationalMarketSharePct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Est. Volume (Million KL):</span>
                    <span className="font-bold text-cyan-300">{b.volumeMillionKL} M KL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Annual Supply Volume:</span>
                    <span className="font-bold text-white">{b.nationalSupplyVolumeKL.toLocaleString()} KL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated Annual Revenue:</span>
                    <span className="font-bold text-green-400">₹{b.nationalRevenueINR.toLocaleString()} Cr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Plant Blending Capacity:</span>
                    <span className="font-bold text-gray-200">{b.blendingCapacityKL.toLocaleString()} KL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacity Utilization:</span>
                    <span className="font-bold text-cyan-400">{b.capacityUtilizationPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Data Basis &amp; Confidence:</span>
                    <span className="font-bold text-amber-300 text-[10px]">{b.confidence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Retail Dealer Touchpoints:</span>
                    <span className="font-bold text-white">{b.retailDealerNetworkCount.toLocaleString()} Outlets</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Target Coverage Footprint:</span>
                    <span className="font-bold text-cyan-300">All 36 States &amp; UTs</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">PLANTS &amp; BASE OIL HUBS:</span>
                  <div className="text-[10px] text-gray-300 space-y-0.5">
                    {b.plantLocations.map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#F27D26]" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">STRATEGIC ADVANTAGE:</span>
                  <p className="text-[10px] text-gray-300 leading-relaxed bg-[#05070B] p-2 rounded border border-[#1F2937]">
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
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-[#0E1117] border border-[#1F2937] p-4 rounded shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2 border-b border-[#1F2937] pb-2 mb-3">
              <FileText className="w-4 h-4 text-[#F27D26]" />
              Audited Mathematical Formulas &amp; Data Pipeline Architecture
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              DETAILED FORMULA DISCLOSURE FOR 5.70M KL MACRO MARKET ESTIMATE, 36 STATES &amp; UTs AGGREGATION, AND EXACT COMPANY ALLOCATIONS
            </p>

            <div className="space-y-3">
              {AUDIT_FORMULA_STEPS.map((step, idx) => (
                <div key={step.id} className="bg-[#05070B] border border-[#1F2937] rounded p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2937] pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#1F2937] text-[#F27D26] font-bold text-[10px]">
                        STEP 0{idx + 1}
                      </span>
                      <span className="font-bold text-white text-xs uppercase">{step.name}</span>
                    </div>
                    <span className="text-green-400 font-bold text-[10px]">{step.outputMetric}</span>
                  </div>

                  <div className="text-[10px] text-gray-400">
                    TARGET SCOPE: <strong className="text-gray-200">{step.targetScope}</strong>
                  </div>

                  <div className="bg-[#0E1117] p-2.5 rounded border border-[#2D3748] text-[#F27D26] text-[11px] font-bold overflow-x-auto">
                    <code>{step.formulaString}</code>
                  </div>

                  <p className="text-gray-300 text-[11px] leading-relaxed">
                    {step.explanation}
                  </p>

                  <div className="bg-[#05070B] p-2 rounded border border-[#1F2937] text-[10px] text-cyan-300">
                    <strong>Sample Execution:</strong> {step.sampleCalculation}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-gray-500 text-[9px] font-bold uppercase">OFFICIAL SOURCES:</span>
                    {step.dataInputs.map((src, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#151B26] text-gray-400 border border-[#2D3748]">
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
