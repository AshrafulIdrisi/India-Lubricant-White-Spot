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
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Product Taxonomy &amp; Margin Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Viscosity Specifications • Base Oil Group • Gross Margin Spread • EV Risk Assessment
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search SKU, grade, viscosity..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 w-64 font-medium"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm'
                : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => setActiveProduct(p)}
                className={`p-4 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  activeProduct.id === p.id
                    ? 'bg-purple-50/70 border-[#7C3AED] text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-[#7C3AED] bg-purple-100/70 px-2 py-0.5 rounded-md border border-purple-200">
                      {p.viscosityGrade}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.evVulnerability === 'Vulnerable (2028-2035)'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : p.evVulnerability === 'EV Growth Opportunity'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {p.evVulnerability.split(' ')[0]}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs mb-0.5">{p.name}</h3>
                  <span className="text-[10px] text-slate-500 block mb-2">{p.subCategory}</span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">ASP: <strong className="text-slate-800">₹{p.avgSellingPricePerLiterINR}/L</strong></span>
                  <span className="text-emerald-700 font-bold">Margin: {p.grossMarginPct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Product Technical Dossier (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            {/* Title & SKU */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
              <div>
                <span className="text-[10px] text-[#7C3AED] font-bold uppercase tracking-wider block">
                  {activeProduct.sku} • {activeProduct.baseOilGroup}
                </span>
                <h3 className="font-bold text-sm text-slate-900 uppercase mt-0.5">{activeProduct.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-emerald-700 block">
                  {activeProduct.grossMarginPct}%
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Gross Margin</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed mb-3.5">
              {activeProduct.description}
            </p>

            {/* Technical Specifications */}
            <div className="space-y-2 mb-3.5 text-xs">
              <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 font-medium">Viscosity Grade:</span>
                <strong className="text-[#7C3AED]">{activeProduct.viscosityGrade}</strong>
              </div>
              <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 font-medium">Performance Specs:</span>
                <strong className="text-slate-800 text-right text-xs max-w-[200px]">{activeProduct.specifications.join(', ')}</strong>
              </div>
              <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 font-medium">Base Oil Group:</span>
                <strong className="text-slate-800">{activeProduct.baseOilGroup}</strong>
              </div>
              <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 font-medium">ASP Realization:</span>
                <strong className="text-emerald-700 font-bold">₹{activeProduct.avgSellingPricePerLiterINR} / L</strong>
              </div>
            </div>

            {/* Typical Applications */}
            <div className="mb-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Key Consuming Segments:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeProduct.applications.map((app, idx) => (
                  <span key={idx} className="text-[10px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                    {app}
                  </span>
                ))}
              </div>
            </div>

            {/* EV Risk / Transition Note */}
            <div className="bg-purple-50/70 border border-purple-200/80 p-3 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1 text-xs">
                <Zap className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span className="uppercase">EV Transition Impact:</span>
                <span className="text-[#7C3AED]">{activeProduct.evVulnerability}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeProduct.category.includes('EV') 
                  ? 'High growth specialized category benefiting from 2W/3W electrification and direct motor cooling fluids.'
                  : 'Sustained internal combustion fleet demands through 2035 with ongoing transitions to longer-drain synthetic grades.'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Packaging: {activeProduct.packSizes.join(', ')}</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> High Value SKU
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
