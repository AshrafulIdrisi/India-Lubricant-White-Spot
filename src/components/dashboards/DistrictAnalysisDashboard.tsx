import React, { useState } from 'react';
import { 
  Fuel, 
  MapPin, 
  Building2, 
  Factory, 
  Car, 
  Wheat, 
  Truck, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  Box, 
  Flame, 
  ChevronRight,
  Info,
  BarChart3,
  PieChart as PieChartIcon,
  Store,
  Phone,
  User,
  Clock,
  Boxes
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
import { LocationRecord, DistributorRecord } from '../../types';
import { CURRENT_DISTRIBUTORS } from '../../data/indiaGeoData';
import { formatKL, formatINR } from '../../utils/demandEngine';

interface DistrictAnalysisDashboardProps {
  locations: LocationRecord[];
  distributors?: DistributorRecord[];
  selectedLocation: LocationRecord;
  onSelectLocation: (loc: LocationRecord) => void;
  onNavigateToBusinessCase: (loc: LocationRecord) => void;
}

export const DistrictAnalysisDashboard: React.FC<DistrictAnalysisDashboardProps> = ({
  locations,
  distributors = CURRENT_DISTRIBUTORS,
  selectedLocation,
  onSelectLocation,
  onNavigateToBusinessCase
}) => {
  const loc = selectedLocation;
  const [districtChartView, setDistrictChartView] = useState<'balance' | 'sectors'>('balance');

  // Find distributors operating in or associated with this district
  const localDistributors = distributors.filter(d => 
    d.targetWhiteSpotId === loc.id || 
    d.district.toLowerCase() === loc.parentDistrict.toLowerCase() ||
    (d.stateCode === loc.stateCode && d.city.toLowerCase() === loc.name.toLowerCase().split(' ')[0])
  );

  // Prepare Chart Data
  const supplyBalanceData = [
    { metric: 'Total Demand', volumeKL: loc.totalEstimatedDemandKL, fill: '#F27D26' },
    { metric: 'Accessible Supply', volumeKL: loc.supply.estimatedAccessibleSupplyKL, fill: '#3b82f6' },
    { metric: 'Net Deficit Gap', volumeKL: loc.supplyGapKL, fill: '#ef4444' }
  ];

  const sectoralMixData = [
    { name: 'Automotive & Fleet (HDEO/PCMO)', value: loc.automotiveDemandKL + loc.commercialVehicleDemandKL, color: '#F27D26' },
    { name: 'Industrial & Metals', value: loc.industrialDemandKL, color: '#3b82f6' },
    { name: 'Agricultural Machinery (UTTO)', value: loc.agriculturalDemandKL, color: '#eab308' },
    { name: 'Freight & Logistics', value: loc.logisticsDemandKL, color: '#10b981' }
  ];

  const CustomDistrictTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs text-slate-800 min-w-[170px] z-50">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
            {data.payload.metric || data.name}
          </div>
          <div className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span className="text-slate-500 font-normal">Volume:</span>
            <span className="text-[#7C3AED] font-extrabold">{(data.value || 0).toLocaleString()} KL</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Top District Selector Header */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-[#7C3AED]">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{loc.name}</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                White Spot Score: {loc.whiteSpotScore}/100
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">
              {loc.stateName} • {loc.region} India • Area: {loc.areaSqKm.toLocaleString()} sq km • Pop: {loc.population.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quick Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold">District Cluster:</span>
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
                {l.stateCode} — {l.name} (Score: {l.whiteSpotScore})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Annual Demand</span>
          <span className="text-2xl font-extrabold text-[#7C3AED] mt-1 block">
            {formatKL(loc.totalEstimatedDemandKL)}
          </span>
          <span className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 block">
            Auto: {loc.automotiveDemandKL} KL | Ind: {loc.industrialDemandKL} KL
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Accessible Local Supply</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            {formatKL(loc.supply.estimatedAccessibleSupplyKL)}
          </span>
          <span className="text-xs text-amber-700 mt-2 pt-2 border-t border-slate-100 block font-semibold">
            Coverage: {loc.supplyCoverageRatioPct}% (Severely Deficit)
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Net Supply Deficit Gap</span>
          <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
            {formatKL(loc.supplyGapKL)}
          </span>
          <span className="text-xs text-rose-700 mt-2 pt-2 border-t border-slate-100 block font-semibold">
            Unmet Addressable Market
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Commercial Opportunity</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
            {formatINR(loc.unmetOpportunityValueINR)}
          </span>
          <span className="text-xs text-emerald-700 mt-2 pt-2 border-t border-slate-100 block font-semibold">
            5-Year CAGR: +{loc.cagrForecastPct}%
          </span>
        </div>
      </div>

      {/* Interactive Demand vs Supply Balance & Sector Charts */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              {districtChartView === 'balance' 
                ? `Supply Deficit Balance Graph: ${loc.name}` 
                : `Sectoral Lubricant Demand Mix (KL / Year)`}
            </h3>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setDistrictChartView('balance')}
              className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
                districtChartView === 'balance' ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Supply-Demand Balance
            </button>
            <button
              onClick={() => setDistrictChartView('sectors')}
              className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
                districtChartView === 'sectors' ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Sector Mix Breakdown
            </button>
          </div>
        </div>

        <div className="h-[270px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            {districtChartView === 'balance' ? (
              <BarChart data={supplyBalanceData} margin={{ top: 25, right: 30, left: 15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="metric" stroke="#94A3B8" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={val => `${val.toLocaleString()} KL`} />
                <Tooltip content={<CustomDistrictTooltip />} />
                <Bar dataKey="volumeKL" name="Volume (KL)" radius={[4, 4, 0, 0]}>
                  <LabelList 
                    dataKey="volumeKL" 
                    position="top" 
                    formatter={(val: any) => `${Number(val).toLocaleString()} KL`} 
                    style={{ fill: '#334155', fontSize: 10, fontWeight: 700 }} 
                  />
                  {supplyBalanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={sectoralMixData} layout="vertical" margin={{ top: 10, right: 80, left: 180, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={val => `${val.toLocaleString()} KL`} />
                <YAxis type="category" dataKey="name" stroke="#94A3B8" width={175} tick={{ fill: '#334155', fontSize: 10, fontWeight: 500 }} />
                <Tooltip content={<CustomDistrictTooltip />} />
                <Bar dataKey="value" name="Demand (KL)" radius={[0, 4, 4, 0]}>
                  <LabelList 
                    dataKey="value" 
                    position="right" 
                    formatter={(val: any) => `${Number(val).toLocaleString()} KL`} 
                    style={{ fill: '#334155', fontSize: 10, fontWeight: 700 }} 
                  />
                  {sectoralMixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explainability Engine: "Why is this location recommended?" */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3.5">
          <Sparkles className="w-4 h-4 text-[#7C3AED]" />
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            Decision Explainability Engine: Why is this location recommended?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {loc.explainabilityDrivers.map((driver, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 flex items-start gap-3 leading-relaxed"
            >
              <div className="w-5 h-5 bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 rounded-md">
                {idx + 1}
              </div>
              <p className="text-xs text-slate-600">{driver}</p>
            </div>
          ))}
        </div>

        {/* Strategic Recommendation Box */}
        <div className="bg-purple-50/70 border border-purple-200/80 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#7C3AED] tracking-wider block">
              Optimal Facility Specification:
            </span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
              {loc.recommendedFacility}
            </h4>
            <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
              <span>Capacity: <strong className="text-slate-900">{loc.recommendedStorageCapacityKL} KL</strong></span>
              <span>Buffer: <strong className="text-slate-900">{loc.recommendedSafetyStockKL} KL</strong></span>
              <span>Radius: <strong className="text-[#7C3AED] font-bold">{loc.supply.accessibilityCategory}</strong></span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToBusinessCase(loc)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:opacity-90 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Model Business Case &amp; ROI</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sector Drivers Breakdown (Vehicles, Industry, Logistics, Agri) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Vehicles Breakdown */}
        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Car className="w-4 h-4 text-[#7C3AED]" /> Fleet Population
              </span>
              <span className="text-xs text-[#7C3AED] font-bold">
                +{loc.vehicles.annualVehicleGrowthRatePct}% /yr
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">2-Wheelers:</span>
                <strong className="text-slate-800">{loc.vehicles.twoWheelers.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cars (PCMO):</span>
                <strong className="text-slate-800">{loc.vehicles.passengerCars.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Commercial (HDEO):</span>
                <strong className="text-slate-800">{(loc.vehicles.lightCommercialVehicles + loc.vehicles.mediumHeavyTrucks).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fleet Age:</span>
                <strong className="text-[#7C3AED] font-bold">{loc.vehicles.avgFleetAgeYears} Yrs</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Industrial Breakdown */}
        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Factory className="w-4 h-4 text-blue-600" /> Industrial Load
              </span>
              <span className="text-xs text-blue-700 font-bold">
                +{loc.industry.annualIndustrialGrowthRatePct}% /yr
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Factories:</span>
                <strong className="text-slate-800">{loc.industry.manufacturingUnits.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Power Load:</span>
                <strong className="text-slate-800">{loc.industry.industrialPowerLoadMW.toLocaleString()} MW</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Machine Tools:</span>
                <strong className="text-slate-800">{loc.industry.machineToolsCount.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Steel/Cement:</span>
                <strong className="text-blue-700 font-bold">{loc.industry.steelAndMetalPlants + loc.industry.cementPlants} Plants</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Freight & Logistics */}
        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Truck className="w-4 h-4 text-emerald-600" /> Freight Corridor
              </span>
              <span className="text-xs text-emerald-700 font-bold">
                {loc.logistics.freightCorridorPassing ? 'DFC Link' : 'NH Link'}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Trucks:</span>
                <strong className="text-slate-800">{loc.logistics.dailyTruckTransitCount.toLocaleString()} /day</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NH Length:</span>
                <strong className="text-slate-800">{loc.logistics.nationalHighwayLengthKm} km</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Logistics Parks:</span>
                <strong className="text-slate-800">{loc.logistics.logisticsParksCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Port Distance:</span>
                <strong className="text-emerald-700 font-bold">{loc.logistics.portProximityKm} km</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Agricultural Mechanization */}
        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Wheat className="w-4 h-4 text-amber-600" /> Agri &amp; Tractor
              </span>
              <span className="text-xs text-amber-700 font-bold">
                {loc.agriculture.croppingIntensityPct}% Intensity
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tractors:</span>
                <strong className="text-slate-800">{loc.vehicles.tractorsAndAgri.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tractor Density:</span>
                <strong className="text-slate-800">{loc.agriculture.tractorDensityPer1000Ha}/1k Ha</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Diesel Pumps:</span>
                <strong className="text-slate-800">{loc.agriculture.tubewellDieselPumpsCount.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Harvesters:</span>
                <strong className="text-amber-700 font-bold">{loc.agriculture.combineHarvestersCount}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incumbent Lubricant Distributors Presence in this District / Cluster */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#7C3AED]" />
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Current Lubricant Distributor Presence in {loc.name} &amp; Surrounding Radius ({localDistributors.length} Hubs Tracked)
            </h3>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 uppercase">
            Competitive Benchmark
          </span>
        </div>

        {localDistributors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase">
                  <th className="pb-2.5 pl-2">Distributor Name</th>
                  <th className="pb-2.5">Brand / Parent</th>
                  <th className="pb-2.5">Channel Type</th>
                  <th className="pb-2.5 text-right">Annual Throughput</th>
                  <th className="pb-2.5 text-right">Storage Cap</th>
                  <th className="pb-2.5 text-right">Dealer Network</th>
                  <th className="pb-2.5 text-right">Lead Time</th>
                  <th className="pb-2.5 text-center">Performance Tier</th>
                  <th className="pb-2.5 text-right pr-2">District Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {localDistributors.map(dist => (
                  <tr key={dist.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-2">
                      <span className="font-bold text-slate-900 block">{dist.name}</span>
                      <span className="text-[10px] text-slate-500 block">{dist.address}</span>
                      <span className="text-[10px] text-slate-400 block">📞 {dist.contactPerson} ({dist.contactPhone})</span>
                    </td>
                    <td className="py-3">
                      <span className="text-[#7C3AED] font-bold text-xs block">{dist.brand}</span>
                      <span className="text-[10px] text-slate-500 block">{dist.parentCompany}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-slate-700 text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                        {dist.distributorType}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      {formatKL(dist.annualVolumeKL)}
                      <span className="text-[10px] text-slate-400 block font-normal">{dist.monthlyThroughputKL} KL/mo</span>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-700">
                      {dist.warehouseCapacityKL} KL
                    </td>
                    <td className="py-3 text-right text-emerald-700 font-bold">
                      {dist.dealerNetworkCount} outlets
                    </td>
                    <td className="py-3 text-right text-amber-700 font-medium">
                      {dist.avgLeadTimeDays} days ({dist.coverageRadiusKm}km)
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        dist.performanceTier === 'Dominant Leader'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : dist.performanceTier === 'Capacity Constrained'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {dist.performanceTier}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-2 font-bold text-slate-900">
                      {dist.marketShareInDistrictPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-xl text-center">
            <p className="text-xs text-slate-600">
              No master stockist directly registered within this exact municipal boundary. Currently served via secondary supply routes from neighboring regional hub ({loc.supply.avgAccessibilityDistanceKm || 45} km average transit distance).
            </p>
            <p className="text-xs text-[#7C3AED] font-bold mt-1.5 uppercase">
              High Penetration Opportunity for First-Mover Depot Deployment
            </p>
          </div>
        )}
      </div>

      {/* Data Quality & Source Audit Metadata */}
      <div className="bg-white border border-slate-200/90 p-3.5 rounded-xl shadow-2xs text-xs flex flex-wrap items-center justify-between gap-3 text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Confidence: <strong className="text-slate-900">{loc.confidenceMeta.confidenceScore}/100</strong> (VAHAN + PPAC Audited)</span>
          <span>• Type: <strong className="uppercase text-[#7C3AED]">{loc.confidenceMeta.dataType}</strong></span>
        </div>
        <div className="text-slate-400">
          Source: {loc.confidenceMeta.source} ({loc.confidenceMeta.lastUpdated})
        </div>
      </div>
    </div>
  );
};

