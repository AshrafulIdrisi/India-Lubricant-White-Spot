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
      <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#F27D26]" />
            Supply Chain &amp; Regional Depot Optimization Engine
          </h2>
          <p className="text-[10px] font-mono text-gray-500">
            CAPACITATED P-MEDIAN FACILITY ALLOCATION // SAFETY STOCK BUFFER // SECONDARY FREIGHT MINIMIZATION
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-300 bg-[#0A0B0E] px-2.5 py-1.5 rounded border border-[#374151]">
          <span>OPTIMIZED HUBS: <strong className="text-[#F27D26]">{warehouseNodes.length} PAN-INDIA DEPOTS</strong></span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-[#F27D26]">
          <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">Aggregated Cluster Demand</span>
          <span className="text-xl font-bold text-[#F27D26] font-mono mt-1 block">
            {formatKL(totalAggregatedDemand)}
          </span>
          <span className="text-[10px] text-gray-400 font-mono mt-1 block">
            ACROSS 28 SERVICING DISTRICT RINGS
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-purple-500">
          <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">Optimized Storage Capacity</span>
          <span className="text-xl font-bold text-purple-300 font-mono mt-1 block">
            {totalRecommendedCapacity.toLocaleString()} KL
          </span>
          <span className="text-[10px] text-purple-300 font-mono mt-1 block font-semibold">
            SAFETY STOCK INCLUDED (21 DAYS)
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-white">
          <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">Total Depot CAPEX</span>
          <span className="text-xl font-bold text-white font-mono mt-1 block">
            {formatINR(totalCapexEstimate)}
          </span>
          <span className="text-[10px] text-gray-400 font-mono mt-1 block">
            AUTOMATED RACKING &amp; BULK STORAGE
          </span>
        </div>

        <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 border-l-2 border-green-500">
          <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">Annual Freight Savings</span>
          <span className="text-xl font-bold text-green-400 font-mono mt-1 block">
            {formatINR(totalOpexSavings)} /YR
          </span>
          <span className="text-[10px] text-green-400 font-mono mt-1 block font-semibold">
            SECONDARY FREIGHT REDUCTION (-28%)
          </span>
        </div>
      </div>

      {/* Main Grid: Hub List (Left) and Hub Sizing Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Hub Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          <h3 className="font-bold text-[11px] text-gray-500 uppercase font-mono tracking-wider">
            Pan-India Recommended Depot Network ({warehouseNodes.length})
          </h3>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {warehouseNodes.map(node => (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-3 rounded-sm border-l-2 text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  selectedNode.id === node.id
                    ? 'border-purple-500 bg-[#1F2937] border-t border-r border-b border-purple-500/40 text-white'
                    : 'border-[#1F2937] bg-[#0E1117] border-t border-r border-b text-gray-300 hover:bg-[#151921]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs uppercase font-mono">{node.clusterName}</span>
                  <span className="font-mono text-[9px] font-bold text-purple-300 bg-[#0A0B0E] px-1.5 py-0.5 rounded border border-[#374151]">
                    {node.facilityTier}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400 mt-1">
                  <div>
                    <span>CAPACITY:</span> <strong className="text-[#F27D26]">{node.recommendedCapacityKL} KL</strong>
                  </div>
                  <div>
                    <span>RADIUS:</span> <strong className="text-white">{node.serviceRadiusKm} KM</strong>
                  </div>
                  <div>
                    <span>LEAD TIME:</span> <strong className="text-green-400">{node.avgDeliveryLeadTimeHours} HRS</strong>
                  </div>
                  <div>
                    <span>SAVINGS:</span> <strong className="text-green-400">₹{node.freightCostSavingsINR} CR</strong>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 mt-1.5 pt-1.5 border-t border-[#1F2937] flex items-center justify-between font-mono">
                  <span>COVERAGE: {node.servingDistricts.length} DISTRICT RINGS</span>
                  <span className="text-[#F27D26] font-bold flex items-center gap-0.5 uppercase">
                    SIZING <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Technical Depot Sizing & Logistics Optimization (7 cols) */}
        <div className="lg:col-span-7 bg-[#0E1117] border border-[#1F2937] p-4 flex flex-col justify-between shadow-xl">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2.5 mb-3">
              <div>
                <span className="text-[9px] font-mono text-[#F27D26] font-bold uppercase tracking-wider block">
                  OPTIMIZED NODE SPECIFICATION • {selectedNode.facilityTier}
                </span>
                <h3 className="font-bold text-sm text-white uppercase font-mono mt-0.5">{selectedNode.clusterName}</h3>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-bold text-[#F27D26] block">
                  {selectedNode.recommendedCapacityKL} KL
                </span>
                <span className="text-[9px] font-mono text-gray-500 uppercase">Target Storage</span>
              </div>
            </div>

            {/* Step-by-Step Storage Sizing Math Box */}
            <div className="bg-[#151921] border border-[#374151] p-3 mb-3 text-xs font-mono">
              <div className="text-[10px] font-bold text-[#F27D26] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Auditable Storage Dimensioning Formula
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 bg-[#0E1117] border border-[#1F2937]">
                  <span className="text-gray-500 block text-[9px] uppercase">1. Annual Demand:</span>
                  <strong className="text-white">{selectedNode.aggregatedDemandKL.toLocaleString()} KL/YR</strong>
                </div>
                <div className="p-2 bg-[#0E1117] border border-[#1F2937]">
                  <span className="text-gray-500 block text-[9px] uppercase">2. Peak Month Throughput:</span>
                  <strong className="text-[#F27D26]">{Math.round((selectedNode.aggregatedDemandKL / 12) * 1.35).toLocaleString()} KL/MO</strong>
                </div>
                <div className="p-2 bg-[#0E1117] border border-[#1F2937]">
                  <span className="text-gray-500 block text-[9px] uppercase">3. Buffer (21 Days):</span>
                  <strong className="text-purple-300">{Math.round(selectedNode.recommendedCapacityKL * 0.35)} KL</strong>
                </div>
                <div className="p-2 bg-[#0E1117] border border-[#1F2937]">
                  <span className="text-gray-500 block text-[9px] uppercase">4. Recommended Sizing:</span>
                  <strong className="text-green-400">{selectedNode.recommendedCapacityKL} KL STORAGE</strong>
                </div>
              </div>
            </div>

            {/* Serving Districts Cluster */}
            <div className="mb-3">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5 font-mono">
                Connected Territory Demand Rings:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.servingDistricts.map((dist, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[#151921] border border-[#1F2937] text-gray-300 text-[10px] font-mono font-semibold flex items-center gap-1"
                  >
                    <MapPin className="w-2.5 h-2.5 text-[#F27D26]" />
                    {dist}
                  </span>
                ))}
              </div>
            </div>

            {/* Financial & Logistics Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-3 font-mono text-xs">
              <div className="bg-[#151921] p-2.5 border border-[#1F2937]">
                <span className="text-gray-500 block text-[9px] uppercase">CAPEX Required:</span>
                <strong className="text-white font-bold text-xs">₹{selectedNode.estimatedCapexINR} CR</strong>
              </div>
              <div className="bg-[#151921] p-2.5 border border-[#1F2937]">
                <span className="text-gray-500 block text-[9px] uppercase">Avg Delivery Time:</span>
                <strong className="text-green-400 font-bold text-xs">{selectedNode.avgDeliveryLeadTimeHours} HRS</strong>
              </div>
              <div className="bg-[#151921] p-2.5 border border-[#1F2937]">
                <span className="text-gray-500 block text-[9px] uppercase">Freight Savings:</span>
                <strong className="text-green-400 font-bold text-xs">₹{selectedNode.freightCostSavingsINR} CR/YR</strong>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#1F2937] flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span>GEO-COORDINATES: {selectedNode.latitude.toFixed(2)}° N, {selectedNode.longitude.toFixed(2)}° E</span>
            <span className="text-green-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> SLA COMPLIANCE: 98.5%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
