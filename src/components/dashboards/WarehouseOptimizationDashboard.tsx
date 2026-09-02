import React, { useState } from 'react';
import { 
  Building2, 
  Box, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { WarehouseOptimizationNode } from '../../types';
import { formatKL, formatINR } from '../../utils/demandEngine';

interface WarehouseOptimizationDashboardProps {
  warehouseNodes: WarehouseOptimizationNode[];
}

export const WarehouseOptimizationDashboard: React.FC<WarehouseOptimizationDashboardProps> = ({
  warehouseNodes
}) => {
  const [selectedNode, setSelectedNode] = useState<WarehouseOptimizationNode>(warehouseNodes[0]);

  const totalAggregatedDemand = warehouseNodes.reduce((sum, n) => sum + n.aggregatedDemandKL, 0);
  const totalRecommendedCapacity = warehouseNodes.reduce((sum, n) => sum + n.recommendedCapacityKL, 0);
  const totalCapexEstimate = warehouseNodes.reduce((sum, n) => sum + n.estimatedCapexINR, 0);
  const totalOpexSavings = warehouseNodes.reduce((sum, n) => sum + n.freightCostSavingsINR, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#7C3AED]" />
            Supply Chain &amp; Regional Depot Optimization Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Capacitated p-median facility allocation • Safety stock buffer • Secondary freight minimization
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span>Optimized Hubs: <strong className="text-[#7C3AED] font-bold">{warehouseNodes.length} Pan-India Depots</strong></span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm border-l-4 border-l-[#7C3AED]">
          <span className="text-[10px] text-slate-500 block uppercase font-medium tracking-wider">Aggregated Cluster Demand</span>
          <span className="text-xl font-extrabold text-[#7C3AED] mt-1 block">
            {formatKL(totalAggregatedDemand)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block font-medium">
            Across 28 Servicing District Rings
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm border-l-4 border-l-purple-500">
          <span className="text-[10px] text-slate-500 block uppercase font-medium tracking-wider">Optimized Storage Capacity</span>
          <span className="text-xl font-extrabold text-purple-700 mt-1 block">
            {totalRecommendedCapacity.toLocaleString()} KL
          </span>
          <span className="text-[10px] text-purple-700 mt-1 block font-semibold">
            Safety Stock Included (21 Days)
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm border-l-4 border-l-slate-400">
          <span className="text-[10px] text-slate-500 block uppercase font-medium tracking-wider">Total Depot CAPEX</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {formatINR(totalCapexEstimate)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Automated Racking &amp; Bulk Storage
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-[10px] text-slate-500 block uppercase font-medium tracking-wider">Annual Freight Savings</span>
          <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
            {formatINR(totalOpexSavings)} /yr
          </span>
          <span className="text-[10px] text-emerald-700 mt-1 block font-semibold">
            Secondary Freight Reduction (-28%)
          </span>
        </div>
      </div>

      {/* Main Grid: Hub List (Left) and Hub Sizing Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Hub Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
            Pan-India Recommended Depot Network ({warehouseNodes.length})
          </h3>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {warehouseNodes.map(node => (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-3.5 rounded-2xl text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  selectedNode.id === node.id
                    ? 'border-2 border-[#7C3AED] bg-purple-50/60 shadow-sm'
                    : 'border border-slate-200/90 bg-white hover:bg-slate-50/80 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 text-xs uppercase">{node.clusterName}</span>
                  <span className="text-[10px] font-bold text-[#7C3AED] bg-purple-100/70 px-2 py-0.5 rounded-full border border-purple-200">
                    {node.facilityTier}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-1">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Capacity:</span> <strong className="text-[#7C3AED] font-bold">{node.recommendedCapacityKL} KL</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Radius:</span> <strong className="text-slate-900 font-bold">{node.serviceRadiusKm} KM</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Lead Time:</span> <strong className="text-emerald-700 font-bold">{node.avgDeliveryLeadTimeHours} hrs</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Savings:</span> <strong className="text-emerald-700 font-bold">₹{node.freightCostSavingsINR} Cr</strong>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Coverage: {node.servingDistricts.length} District Rings</span>
                  <span className="text-[#7C3AED] font-bold flex items-center gap-0.5 uppercase">
                    Sizing <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Technical Depot Sizing & Logistics Optimization (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
              <div>
                <span className="text-[10px] text-[#7C3AED] font-bold uppercase tracking-wider block">
                  Optimized Node Specification • {selectedNode.facilityTier}
                </span>
                <h3 className="font-bold text-sm text-slate-900 uppercase mt-0.5">{selectedNode.clusterName}</h3>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-[#7C3AED] block">
                  {selectedNode.recommendedCapacityKL} KL
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Target Storage</span>
              </div>
            </div>

            {/* Step-by-Step Storage Sizing Math Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-3.5 text-xs">
              <div className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Auditable Storage Dimensioning Formula
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">1. Annual Demand:</span>
                  <strong className="text-slate-900">{selectedNode.aggregatedDemandKL.toLocaleString()} KL/yr</strong>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">2. Peak Month Throughput:</span>
                  <strong className="text-[#7C3AED]">{Math.round((selectedNode.aggregatedDemandKL / 12) * 1.35).toLocaleString()} KL/mo</strong>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">3. Buffer (21 Days):</span>
                  <strong className="text-purple-700">{Math.round(selectedNode.recommendedCapacityKL * 0.35)} KL</strong>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">4. Recommended Sizing:</span>
                  <strong className="text-emerald-700">{selectedNode.recommendedCapacityKL} KL Storage</strong>
                </div>
              </div>
            </div>

            {/* Serving Districts Cluster */}
            <div className="mb-3.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Connected Territory Demand Rings:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.servingDistricts.map((dist, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100/80 border border-slate-200/80 rounded-lg text-slate-700 text-xs font-medium flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3 text-[#7C3AED]" />
                    {dist}
                  </span>
                ))}
              </div>
            </div>

            {/* Financial & Logistics Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] uppercase font-medium">CAPEX Required:</span>
                <strong className="text-slate-900 font-bold text-xs">₹{selectedNode.estimatedCapexINR} Cr</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] uppercase font-medium">Avg Delivery Time:</span>
                <strong className="text-emerald-700 font-bold text-xs">{selectedNode.avgDeliveryLeadTimeHours} hrs</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] uppercase font-medium">Freight Savings:</span>
                <strong className="text-emerald-700 font-bold text-xs">₹{selectedNode.freightCostSavingsINR} Cr/yr</strong>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Geo-coordinates: {selectedNode.latitude.toFixed(2)}° N, {selectedNode.longitude.toFixed(2)}° E</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SLA Compliance: 98.5%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
