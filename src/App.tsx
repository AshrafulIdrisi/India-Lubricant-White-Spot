import React, { useState } from 'react';
import { INDIA_LOCATIONS, OPTIMIZED_WAREHOUSE_NODES, SYSTEM_ALERTS, CURRENT_DISTRIBUTORS } from './data/indiaGeoData';
import { LocationRecord, ScoringWeights, FinancialAssumptions, GridResolution, AlertNotification, DistributorRecord } from './types';
import { DEFAULT_WEIGHTS, DEFAULT_FINANCIAL_ASSUMPTIONS } from './utils/demandEngine';
import { downloadWhiteSpotExcel } from './utils/excelExporter';

import { NavigationSidebar } from './components/NavigationSidebar';
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');

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
      platform: "LuboIntel // Global Lubricant Market Insights",
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex selection:bg-purple-500/20 selection:text-purple-900 font-sans">
      {/* Left Sidebar Navigation (Desktop + Mobile Drawer) */}
      <NavigationSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        financialAssumptions={financialAssumptions}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Backdrop for Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Workspace Top Header Bar */}
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
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onSearchQuery={setGlobalSearchTerm}
        />

        {/* Export Toast Notification */}
        {exportNotice && (
          <div className="fixed bottom-12 right-6 z-50 bg-white border border-purple-200 text-purple-900 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] animate-ping" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Workspace Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
              onDistributorsChange={setDistributors}
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

        {/* Enterprise Telemetry Footer */}
        <footer className="mt-auto h-11 bg-white border-t border-slate-200/80 flex items-center px-6 justify-between shrink-0 text-[11px] font-semibold text-slate-500">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              DATA ENGINE: <strong className="text-slate-900 font-bold">5.70M KL GROUNDED</strong>
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-600">
              Confidence Index: <strong className="text-emerald-700">88.2% (VAHAN 4.0 + PPAC)</strong>
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-600">
              Active Mesh Grid: <strong className="text-[#7C3AED]">{gridResolution}</strong>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-500 hidden sm:inline">LuboIntel Decision Engine</span>
            <span className="px-2 py-0.5 rounded bg-purple-50 text-[#7C3AED] font-bold border border-purple-200/60">
              v2.8 Enterprise
            </span>
          </div>
        </footer>
      </div>

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

