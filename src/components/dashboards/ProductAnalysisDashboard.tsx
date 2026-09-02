import React, { useState } from 'react';
import { 
  Box, 
  Car, 
  Factory, 
  Wheat, 
  Zap, 
  Filter, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { PRODUCT_CATALOG } from '../../data/productTaxonomy';
import { LubricantProduct, LubricantCategory } from '../../types';

export const ProductAnalysisDashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVulnerability, setSelectedVulnerability] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeProduct, setActiveProduct] = useState<LubricantProduct>(PRODUCT_CATALOG[0]);

  const categories = [
    { id: 'all', label: 'ALL PRODUCTS' },
    { id: 'Automotive — Personal Mobility', label: 'AUTOMOTIVE (PCMO)' },
    { id: 'Commercial Vehicles & Fleets', label: 'COMMERCIAL (HDEO)' },
    { id: 'Industrial Lubricants', label: 'INDUSTRIAL HYDRAULIC/GEAR' },
    { id: 'Agricultural Machinery', label: 'AGRICULTURE (UTTO)' },
    { id: 'Mining & Off-Highway', label: 'MINING & HEAVY PLANT' },
    { id: 'Electric Vehicle & Thermal Fluids', label: 'NEXT-GEN EV FLUIDS' }
  ];

  const filteredProducts = PRODUCT_CATALOG.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchVuln = selectedVulnerability === 'all' || p.evVulnerability === selectedVulnerability;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.viscosityGrade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.subCategory.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchVuln && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
            <Box className="w-4 h-4 text-[#F27D26]" />
            Product Taxonomy &amp; Margin Architecture
          </h2>
          <p className="text-[10px] font-mono text-gray-500">
            VISCOSITY SPECIFICATIONS // BASE OIL GROUP // GROSS MARGIN SPREAD // EV RISK
          </p>
        </div>

        {/* Search */}
        <div className="relative font-mono">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="SEARCH SKU, GRADE, VISCOSITY..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-[#0A0B0E] border border-[#374151] rounded text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F27D26] w-64 uppercase"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 font-mono text-[10px]">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded text-[10px] font-bold whitespace-nowrap transition-all uppercase ${
              selectedCategory === cat.id
                ? 'bg-[#1F2937] text-[#F27D26] border border-[#F27D26]'
                : 'bg-[#0E1117] border border-[#1F2937] text-gray-400 hover:text-white hover:bg-[#151921]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Catalog List (Left) and Product Deep Dive (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Product Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => setActiveProduct(p)}
                className={`p-3 rounded-sm border-l-2 text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  p.grossMarginPct >= 30 ? 'border-green-500' : p.grossMarginPct >= 25 ? 'border-[#F27D26]' : 'border-blue-500'
                } ${
                  activeProduct.id === p.id
                    ? 'bg-[#1F2937] border-t border-r border-b border-[#F27D26]/60 text-white'
                    : 'bg-[#0E1117] border-t border-r border-b border-[#1F2937] text-gray-300 hover:bg-[#151921]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[9px] font-bold text-[#F27D26] bg-[#0A0B0E] px-1.5 py-0.5 rounded border border-[#374151]">
                      {p.viscosityGrade}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      p.evVulnerability === 'Vulnerable (2028-2035)'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : p.evVulnerability === 'EV Growth Opportunity'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                        : 'bg-[#1F2937] text-gray-400'
                    }`}>
                      {p.evVulnerability.split(' ')[0]}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-xs mb-0.5">{p.name}</h3>
                  <span className="text-[10px] text-gray-500 block mb-2 font-mono">{p.subCategory}</span>
                </div>

                <div className="pt-2 border-t border-[#1F2937] flex items-center justify-between font-mono text-[10px]">
                  <span className="text-gray-400">ASP: <strong className="text-white">₹{p.avgSellingPricePerLiterINR}/L</strong></span>
                  <span className="text-green-400 font-bold">MARGIN: {p.grossMarginPct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Product Technical Dossier (5 cols) */}
        <div className="lg:col-span-5 bg-[#0E1117] border border-[#1F2937] p-4 flex flex-col justify-between shadow-xl">
          <div>
            {/* Title & SKU */}
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2.5 mb-3">
              <div>
                <span className="text-[9px] font-mono text-[#F27D26] font-bold uppercase tracking-wider block">
                  {activeProduct.sku} • {activeProduct.baseOilGroup}
                </span>
                <h3 className="font-bold text-sm text-white uppercase mt-0.5">{activeProduct.name}</h3>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-bold text-green-400 block">
                  {activeProduct.grossMarginPct}%
                </span>
                <span className="text-[9px] font-mono text-gray-500 uppercase">Gross Margin</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-[11px] text-gray-300 leading-relaxed mb-3 font-sans">
              {activeProduct.description}
            </p>

            {/* Technical Specifications */}
            <div className="space-y-1.5 mb-3 text-[10px] font-mono">
              <div className="flex justify-between bg-[#151921] p-2 border border-[#1F2937]">
                <span className="text-gray-500 uppercase">Viscosity Grade:</span>
                <strong className="text-[#F27D26]">{activeProduct.viscosityGrade}</strong>
              </div>
              <div className="flex justify-between bg-[#151921] p-2 border border-[#1F2937]">
                <span className="text-gray-500 uppercase">Performance Specs:</span>
                <strong className="text-gray-200 text-right text-[10px] max-w-[200px]">{activeProduct.specifications.join(', ')}</strong>
              </div>
              <div className="flex justify-between bg-[#151921] p-2 border border-[#1F2937]">
                <span className="text-gray-500 uppercase">Base Oil Group:</span>
                <strong className="text-gray-200">{activeProduct.baseOilGroup}</strong>
              </div>
              <div className="flex justify-between bg-[#151921] p-2 border border-[#1F2937]">
                <span className="text-gray-500 uppercase">ASP Realization:</span>
                <strong className="text-green-400 font-bold">₹{activeProduct.avgSellingPricePerLiterINR} / L</strong>
              </div>
            </div>

            {/* Typical Applications */}
            <div className="mb-3">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1 font-mono">
                Key Consuming Segments:
              </span>
              <div className="flex flex-wrap gap-1">
                {activeProduct.applications.map((app, idx) => (
                  <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#151921] text-gray-300 border border-[#1F2937]">
                    {app}
                  </span>
                ))}
              </div>
            </div>

            {/* EV Risk / Transition Note */}
            <div className="bg-[#151921] border border-[#1F2937] p-2.5 rounded text-xs font-mono">
              <div className="flex items-center gap-1.5 font-bold text-gray-200 mb-1 text-[10px]">
                <Zap className="w-3 h-3 text-[#F27D26]" />
                <span className="uppercase">EV Transition Impact:</span>
                <span className="text-[#F27D26]">{activeProduct.evVulnerability}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                {activeProduct.category.includes('EV') 
                  ? 'High growth specialized category benefiting from 2W/3W electrification and direct motor cooling fluids.'
                  : 'Sustained internal combustion fleet demands through 2035 with ongoing transitions to longer-drain synthetic grades.'}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#1F2937] flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span>PACKAGING: {activeProduct.packSizes.join(', ')}</span>
            <span className="text-green-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> HIGH VALUE SKU
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
