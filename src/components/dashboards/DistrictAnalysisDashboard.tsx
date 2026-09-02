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
  Legend
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
        <div className="bg-[#0E1117]/95 border border-[#374151] p-2.5 rounded shadow-2xl font-mono text-xs text-gray-200 min-w-[170px] z-50">
          <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
            {data.payload.metric || data.name}
          </div>
          <div className="text-sm font-bold text-white flex items-center justify-between">
            <span>VOLUME:</span>
            <span className="text-[#F27D26]">{(data.value || 0).toLocaleString()} KL</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top District Selector Header */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1F2937] border border-[#374151] flex items-center justify-center text-[#F27D26]">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-mono text-white uppercase">{loc.name}</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1F2937] text-red-400 border border-red-500/30 uppercase">
                WHITE SPOT SCORE: {loc.whiteSpotScore}/100
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 uppercase">
              {loc.stateName} • {loc.region} INDIA • AREA: {loc.areaSqKm.toLocaleString()} SQ KM • POP: {loc.population.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quick Switcher Dropdown */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-[10px] text-gray-400 uppercase">DISTRICT CLUSTER:</span>
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
                {l.stateCode} — {l.name.toUpperCase()} (SCORE: {l.whiteSpotScore})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-[#F27D26]">
          <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">Total Annual Demand</span>
          <span className="text-xl font-bold text-[#F27D26] font-mono mt-1 block">
            {formatKL(loc.totalEstimatedDemandKL)}
          </span>
          <span className="text-[10px] text-gray-400 font-mono mt-1 block">
            AUTO: {loc.automotiveDemandKL} KL | IND: {loc.industrialDemandKL} KL
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-yellow-500">
          <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">Accessible Local Supply</span>
          <span className="text-xl font-bold text-white font-mono mt-1 block">
            {formatKL(loc.supply.estimatedAccessibleSupplyKL)}
          </span>
          <span className="text-[10px] text-yellow-400 font-mono mt-1 block font-semibold">
            COVERAGE: {loc.supplyCoverageRatioPct}% (SEVERELY DEFICIT)
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-red-500">
          <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">Net Supply Deficit Gap</span>
          <span className="text-xl font-bold text-red-500 font-mono mt-1 block">
            {formatKL(loc.supplyGapKL)}
          </span>
          <span className="text-[10px] text-gray-400 font-mono mt-1 block">
            UNMET ADDRESSABLE MARKET
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-green-500">
          <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">Commercial Opportunity</span>
          <span className="text-xl font-bold text-green-400 font-mono mt-1 block">
            {formatINR(loc.unmetOpportunityValueINR)}
          </span>
          <span className="text-[10px] text-green-400 font-mono mt-1 block font-semibold">
            5-YEAR CAGR: +{loc.cagrForecastPct}%
          </span>
        </div>
      </div>

      {/* Interactive Demand vs Supply Balance & Sector Charts */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] pb-3 mb-4">
          <div className="flex items-center gap-2 font-mono">
            <BarChart3 className="w-4 h-4 text-[#F27D26]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">
              {districtChartView === 'balance' 
                ? `Supply Deficit Balance Graph: ${loc.name.toUpperCase()}` 
                : `Sectoral Lubricant Demand Mix (KL / Year)`}
            </h3>
          </div>

          <div className="flex items-center bg-[#0A0B0E] rounded p-0.5 border border-[#374151] text-[10px] font-mono">
            <button
              onClick={() => setDistrictChartView('balance')}
              className={`px-3 py-1 rounded transition-colors font-bold ${
                districtChartView === 'balance' ? 'bg-[#F27D26] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              SUPPLY-DEMAND BALANCE
            </button>
            <button
              onClick={() => setDistrictChartView('sectors')}
              className={`px-3 py-1 rounded transition-colors font-bold ${
                districtChartView === 'sectors' ? 'bg-[#F27D26] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              SECTOR MIX BREAKDOWN
            </button>
          </div>
        </div>

        <div className="h-[250px] w-full font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            {districtChartView === 'balance' ? (
              <BarChart data={supplyBalanceData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="metric" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={val => `${val.toLocaleString()} KL`} />
                <Tooltip content={<CustomDistrictTooltip />} />
                <Bar dataKey="volumeKL" name="Volume (KL)">
                  {supplyBalanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={sectoralMixData} layout="vertical" margin={{ top: 10, right: 30, left: 150, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                <XAxis type="number" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={val => `${val} KL`} />
                <YAxis type="category" dataKey="name" stroke="#6B7280" tick={{ fill: '#D1D5DB', fontSize: 9.5 }} />
                <Tooltip content={<CustomDistrictTooltip />} />
                <Bar dataKey="value" name="Demand (KL)">
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
      <div className="bg-[#0E1117] border border-[#1F2937] p-4 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#F27D26]" />
          <h3 className="font-bold text-xs text-white uppercase font-mono tracking-wider">
            Decision Explainability Engine: Why is this location recommended?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4">
          {loc.explainabilityDrivers.map((driver, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded bg-[#151921] border border-[#1F2937] text-xs text-gray-200 flex items-start gap-2.5 leading-relaxed"
            >
              <div className="w-4 h-4 bg-[#1F2937] text-[#F27D26] font-mono font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5 border border-[#374151]">
                {idx + 1}
              </div>
              <p className="text-[11px] text-gray-300 font-sans">{driver}</p>
            </div>
          ))}
        </div>

        {/* Strategic Recommendation Box */}
        <div className="bg-[#151921] border border-[#374151] p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[9px] uppercase font-mono font-bold text-[#F27D26] tracking-wider block">
              OPTIMAL FACILITY SPECIFICATION:
            </span>
            <h4 className="text-sm font-bold text-white uppercase font-mono mt-0.5">
              {loc.recommendedFacility}
            </h4>
            <div className="flex items-center gap-4 text-[10px] text-gray-400 mt-1 font-mono">
              <span>CAPACITY: <strong className="text-white">{loc.recommendedStorageCapacityKL} KL</strong></span>
              <span>BUFFER: <strong className="text-white">{loc.recommendedSafetyStockKL} KL</strong></span>
              <span>RADIUS: <strong className="text-[#F27D26]">{loc.supply.accessibilityCategory}</strong></span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToBusinessCase(loc)}
            className="px-3.5 py-2 rounded bg-[#F27D26] hover:bg-[#d96a1a] text-black font-mono font-bold text-xs transition-all shadow-[0_0_10px_rgba(242,125,38,0.3)] flex items-center gap-1.5 uppercase"
          >
            <span>Model Business Case &amp; ROI</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sector Drivers Breakdown (Vehicles, Industry, Logistics, Agri) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Vehicles Breakdown */}
        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5 mb-2.5">
              <span className="font-mono font-bold text-gray-200 flex items-center gap-1.5 text-[11px] uppercase">
                <Car className="w-3.5 h-3.5 text-[#F27D26]" /> Fleet Population
              </span>
              <span className="font-mono text-[9px] text-[#F27D26] font-bold">
                +{loc.vehicles.annualVehicleGrowthRatePct}% /YR
              </span>
            </div>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-500">2-WHEELERS:</span>
                <strong className="text-gray-200">{loc.vehicles.twoWheelers.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">CARS (PCMO):</span>
                <strong className="text-gray-200">{loc.vehicles.passengerCars.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">COMMERCIAL (HDEO):</span>
                <strong className="text-gray-200">{(loc.vehicles.lightCommercialVehicles + loc.vehicles.mediumHeavyTrucks).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">FLEET AGE:</span>
                <strong className="text-[#F27D26]">{loc.vehicles.avgFleetAgeYears} YRS</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Industrial Breakdown */}
        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5 mb-2.5">
              <span className="font-mono font-bold text-gray-200 flex items-center gap-1.5 text-[11px] uppercase">
                <Factory className="w-3.5 h-3.5 text-blue-400" /> Industrial Load
              </span>
              <span className="font-mono text-[9px] text-blue-400 font-bold">
                +{loc.industry.annualIndustrialGrowthRatePct}% /YR
              </span>
            </div>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-500">FACTORIES:</span>
                <strong className="text-gray-200">{loc.industry.manufacturingUnits.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">POWER LOAD:</span>
                <strong className="text-gray-200">{loc.industry.industrialPowerLoadMW.toLocaleString()} MW</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">MACHINE TOOLS:</span>
                <strong className="text-gray-200">{loc.industry.machineToolsCount.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">STEEL/CEMENT:</span>
                <strong className="text-blue-300">{loc.industry.steelAndMetalPlants + loc.industry.cementPlants} PLANTS</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Freight & Logistics */}
        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5 mb-2.5">
              <span className="font-mono font-bold text-gray-200 flex items-center gap-1.5 text-[11px] uppercase">
                <Truck className="w-3.5 h-3.5 text-green-400" /> Freight Corridor
              </span>
              <span className="font-mono text-[9px] text-green-400 font-bold">
                {loc.logistics.freightCorridorPassing ? 'DFC LINK' : 'NH LINK'}
              </span>
            </div>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-500">DAILY TRUCKS:</span>
                <strong className="text-gray-200">{loc.logistics.dailyTruckTransitCount.toLocaleString()} /DAY</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">NH LENGTH:</span>
                <strong className="text-gray-200">{loc.logistics.nationalHighwayLengthKm} KM</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">LOGISTICS PARKS:</span>
                <strong className="text-gray-200">{loc.logistics.logisticsParksCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">PORT DISTANCE:</span>
                <strong className="text-green-300">{loc.logistics.portProximityKm} KM</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Agricultural Mechanization */}
        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5 mb-2.5">
              <span className="font-mono font-bold text-gray-200 flex items-center gap-1.5 text-[11px] uppercase">
                <Wheat className="w-3.5 h-3.5 text-yellow-400" /> Agri &amp; Tractor
              </span>
              <span className="font-mono text-[9px] text-yellow-400 font-bold">
                {loc.agriculture.croppingIntensityPct}% INTENSITY
              </span>
            </div>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-500">TRACTORS:</span>
                <strong className="text-gray-200">{loc.vehicles.tractorsAndAgri.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">TRACTOR DENSITY:</span>
                <strong className="text-gray-200">{loc.agriculture.tractorDensityPer1000Ha}/1k Ha</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DIESEL PUMPS:</span>
                <strong className="text-gray-200">{loc.agriculture.tubewellDieselPumpsCount.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">HARVESTERS:</span>
                <strong className="text-yellow-300">{loc.agriculture.combineHarvestersCount}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incumbent Lubricant Distributors Presence in this District / Cluster */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs text-white uppercase font-mono tracking-wider">
              Current Lubricant Distributor Presence in {loc.name} &amp; Surrounding Radius ({localDistributors.length} Hubs Tracked)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-700/50 uppercase">
            COMPETITIVE BENCHMARK
          </span>
        </div>

        {localDistributors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1F2937] text-[10px] text-gray-500 uppercase">
                  <th className="pb-2 pl-2">DISTRIBUTOR NAME</th>
                  <th className="pb-2">BRAND / PARENT</th>
                  <th className="pb-2">CHANNEL TYPE</th>
                  <th className="pb-2 text-right">ANNUAL THROUGHPUT</th>
                  <th className="pb-2 text-right">STORAGE CAP</th>
                  <th className="pb-2 text-right">DEALER NETWORK</th>
                  <th className="pb-2 text-right">LEAD TIME</th>
                  <th className="pb-2 text-center">PERFORMANCE TIER</th>
                  <th className="pb-2 text-right pr-2">DISTRICT SHARE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {localDistributors.map(dist => (
                  <tr key={dist.id} className="hover:bg-[#151921] transition-colors">
                    <td className="py-2.5 pl-2">
                      <span className="font-bold text-white block">{dist.name}</span>
                      <span className="text-[9px] text-gray-400 block">{dist.address}</span>
                      <span className="text-[9px] text-gray-500 block">📞 {dist.contactPerson} ({dist.contactPhone})</span>
                    </td>
                    <td className="py-2.5">
                      <span className="text-cyan-300 font-bold text-[10px] block">{dist.brand}</span>
                      <span className="text-[9px] text-gray-500 block">{dist.parentCompany}</span>
                    </td>
                    <td className="py-2.5">
                      <span className="text-gray-300 text-[10px] bg-[#0A0B0E] px-1.5 py-0.5 rounded border border-[#374151]">
                        {dist.distributorType}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-cyan-400">
                      {formatKL(dist.annualVolumeKL)}
                      <span className="text-[9px] text-gray-500 block">{dist.monthlyThroughputKL} KL/mo</span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-gray-200">
                      {dist.warehouseCapacityKL} KL
                    </td>
                    <td className="py-2.5 text-right text-emerald-400 font-bold">
                      {dist.dealerNetworkCount} outlets
                    </td>
                    <td className="py-2.5 text-right text-yellow-400">
                      {dist.avgLeadTimeDays} days ({dist.coverageRadiusKm}km)
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        dist.performanceTier === 'Dominant Leader'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : dist.performanceTier === 'Capacity Constrained'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}>
                        {dist.performanceTier}
                      </span>
                    </td>
                    <td className="py-2.5 text-right pr-2 font-bold text-white">
                      {dist.marketShareInDistrictPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#050608] border border-[#1F2937] p-4 rounded text-center font-mono">
            <p className="text-xs text-gray-400">
              No master stockist directly registered within this exact municipal boundary. Currently served via secondary supply routes from neighboring regional hub ({loc.supply.avgAccessibilityDistanceKm || 45} km average transit distance).
            </p>
            <p className="text-[10px] text-[#F27D26] font-bold mt-1 uppercase">
              HIGH PENETRATION OPPORTUNITY FOR FIRST-MOVER DEPOT DEPLOYMENT
            </p>
          </div>
        )}
      </div>

      {/* Data Quality & Source Audit Metadata */}
      <div className="bg-[#0E1117] border border-[#1F2937] p-3 text-[10px] font-mono flex flex-wrap items-center justify-between gap-3 text-gray-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          <span>CONFIDENCE: <strong className="text-white">{loc.confidenceMeta.confidenceScore}/100</strong> (VAHAN + PPAC AUDITED)</span>
          <span>• TYPE: <strong className="uppercase text-[#F27D26]">{loc.confidenceMeta.dataType}</strong></span>
        </div>
        <div className="text-gray-500">
          SOURCE: {loc.confidenceMeta.source} ({loc.confidenceMeta.lastUpdated})
        </div>
      </div>
    </div>
  );
};

