import React, { useState } from 'react';
import { INDIA_LOCATIONS, OPTIMIZED_WAREHOUSE_NODES, SYSTEM_ALERTS, CURRENT_DISTRIBUTORS } from './data/indiaGeoData';
import { LocationRecord, ScoringWeights, FinancialAssumptions, GridResolution, AlertNotification, DistributorRecord } from './types';
import { DEFAULT_WEIGHTS, DEFAULT_FINANCIAL_ASSUMPTIONS } from './utils/demandEngine';
import { downloadWhiteSpotExcel } from './utils/excelExporter';

import { NavigationHeader, DashboardTab } from './components/NavigationHeader';
import { IndiaOverviewDashboard } from './components/dashboards/IndiaOverviewDashboard';
import { StateAnalysisDashboard } from './components/dashboards/StateAnalysisDashboard';
import { DistrictAnalysisDashboard } from './components/dashboards/DistrictAnalysisDashboard';
import { ProductAnalysisDashboard } from './components/dashboards/ProductAnalysisDashboard';
import { DistributorOpportunityDashboard } from './components/dashboards/DistributorOpportunityDashboard';
import { WarehouseOptimizationDashboard } from './components/dashboards/WarehouseOptimizationDashboard';
import { ForecastPipelineDashboard } from './components/dashboards/ForecastPipelineDashboard';
import { BusinessCaseSimulator } from './components/dashboards/BusinessCaseSimulator';
import { MethodologyDocCenter } from './components/dashboards/MethodologyDocCenter';
import { BrandValidationDashboard } from './components/dashboards/BrandValidationDashboard';
import { AiAssistantModal } from './components/AiAssistantModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [locations, setLocations] = useState<LocationRecord[]>(INDIA_LOCATIONS);
  const [warehouseNodes, setWarehouseNodes] = useState(OPTIMIZED_WAREHOUSE_NODES);
  const [distributors, setDistributors] = useState<DistributorRecord[]>(CURRENT_DISTRIBUTORS);
  const [selectedLocation, setSelectedLocation] = useState<LocationRecord>(INDIA_LOCATIONS[0]);
  const [gridResolution, setGridResolution] = useState<GridResolution>('5km');
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [financialAssumptions, setFinancialAssumptions] = useState<FinancialAssumptions>(DEFAULT_FINANCIAL_ASSUMPTIONS);
  const [alerts, setAlerts] = useState<AlertNotification[]>(SYSTEM_ALERTS);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleSelectLocation = (loc: LocationRecord) => {
    setSelectedLocation(loc);
  };

  const handleNavigateToDistrict = (loc: LocationRecord) => {
    setSelectedLocation(loc);
    setActiveTab('district');
  };

  const handleNavigateToBusinessCase = (loc: LocationRecord) => {
    setSelectedLocation(loc);
    setActiveTab('businessCase');
  };

  const handleExportDossier = () => {
    const reportData = {
      platform: "LuboIntel // India Lubricants White-Spot & Demand Intelligence Platform",
      generatedAt: new Date().toISOString(),
      activeScenario: financialAssumptions.scenario,
      scoringWeights,
      selectedDistrictDossier: {
        districtName: selectedLocation.name,
        state: selectedLocation.stateName,
        totalDemandKL: selectedLocation.totalEstimatedDemandKL,
        accessibleSupplyKL: selectedLocation.supply.estimatedAccessibleSupplyKL,
        supplyGapKL: selectedLocation.supplyGapKL,
        whiteSpotScore: selectedLocation.whiteSpotScore,
        opportunityTier: selectedLocation.opportunityTier,
        recommendedFacility: selectedLocation.recommendedFacility,
        recommendedStorageCapacityKL: selectedLocation.recommendedStorageCapacityKL,
        explainabilityDrivers: selectedLocation.explainabilityDrivers
      },
      top10WhiteSpotsNational: locations.slice(0, 10).map(l => ({
        rank: l.whiteSpotRank,
        name: l.name,
        state: l.stateName,
        demandKL: l.totalEstimatedDemandKL,
        gapKL: l.supplyGapKL,
        score: l.whiteSpotScore
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LuboIntel_WhiteSpot_Dossier_${selectedLocation.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportNotice(`Dossier for ${selectedLocation.name} exported.`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportExcel = () => {
    downloadWhiteSpotExcel(locations, financialAssumptions.scenario);
    setExportNotice(`All-India White-Spot Validation Excel (.csv) downloaded.`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#D1D5DB] flex flex-col selection:bg-[#F27D26] selection:text-black font-sans">
      {/* Top Main Navigation Header */}
      <NavigationHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        alerts={alerts}
        financialAssumptions={financialAssumptions}
        onAssumptionsChange={setFinancialAssumptions}
        onExportReport={handleExportDossier}
        onExportExcel={handleExportExcel}
        locations={locations}
      />

      {/* Export Toast Notification */}
      {exportNotice && (
        <div className="fixed bottom-10 right-6 z-50 bg-[#0E1117] border border-[#F27D26] text-[#F27D26] px-4 py-2.5 rounded shadow-2xl text-xs font-mono font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <span className="w-2 h-2 rounded-full bg-[#F27D26] animate-ping" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Main View Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5">
        {activeTab === 'overview' && (
          <IndiaOverviewDashboard
            locations={locations}
            warehouseNodes={warehouseNodes}
            distributors={distributors}
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
            gridResolution={gridResolution}
            onResolutionChange={setGridResolution}
            scoringWeights={scoringWeights}
            onWeightsChange={setScoringWeights}
            onNavigateToDistrict={handleNavigateToDistrict}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'brandValidation' && (
          <BrandValidationDashboard />
        )}

        {activeTab === 'state' && (
          <StateAnalysisDashboard
            locations={locations}
            onSelectDistrict={handleNavigateToDistrict}
          />
        )}

        {activeTab === 'district' && (
          <DistrictAnalysisDashboard
            locations={locations}
            distributors={distributors}
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
            onNavigateToBusinessCase={handleNavigateToBusinessCase}
          />
        )}

        {activeTab === 'product' && (
          <ProductAnalysisDashboard />
        )}

        {activeTab === 'distributor' && (
          <DistributorOpportunityDashboard
            locations={locations}
            distributors={distributors}
            scoringWeights={scoringWeights}
            onWeightsChange={setScoringWeights}
            onSelectDistrict={handleNavigateToDistrict}
          />
        )}

        {activeTab === 'warehouse' && (
          <WarehouseOptimizationDashboard
            warehouseNodes={warehouseNodes}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastPipelineDashboard />
        )}

        {activeTab === 'businessCase' && (
          <BusinessCaseSimulator
            locations={locations}
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
            financialAssumptions={financialAssumptions}
            onAssumptionsChange={setFinancialAssumptions}
          />
        )}

        {activeTab === 'documentation' && (
          <MethodologyDocCenter />
        )}
      </main>

      {/* Technical Telemetry Status Footer */}
      <footer className="h-8 bg-[#050608] border-t border-[#1F2937] flex items-center px-6 justify-between shrink-0 font-mono text-[10px] text-gray-500">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            STATUS: <strong className="text-gray-300">DATA_SYNC_COMPLETE</strong>
          </span>
          <span className="hidden sm:inline uppercase">
            Confidence Index: <span className="text-green-400 font-bold">88.2% (VAHAN+PPAC)</span>
          </span>
          <span className="hidden md:inline text-gray-600">|</span>
          <span className="hidden md:inline uppercase text-gray-400">
            Active Grid: <strong className="text-[#F27D26]">{gridResolution}</strong>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="italic text-gray-400">AI-ASSISTANT: READY FOR QUERY...</span>
          <span className="text-[#F27D26] font-bold">v2.5_PRO</span>
        </div>
      </footer>

      {/* AI Strategic Market Analyst Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        locations={locations}
        warehouseNodes={warehouseNodes}
        selectedLocation={selectedLocation}
        financialAssumptions={financialAssumptions}
      />
    </div>
  );
}
