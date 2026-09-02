import React, { useState } from 'react';
import { 
  Fuel, 
  Map, 
  Building2, 
  TrendingUp, 
  Box, 
  DollarSign, 
  FileText, 
  Sparkles, 
  Bell, 
  Download, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Terminal,
  Activity,
  Globe2,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { AlertNotification, FinancialAssumptions, LocationRecord } from '../types';
import { downloadWhiteSpotExcel } from '../utils/excelExporter';

export type DashboardTab = 
  | 'overview'
  | 'brandValidation'
  | 'state'
  | 'district'
  | 'product'
  | 'distributor'
  | 'warehouse'
  | 'forecast'
  | 'businessCase'
  | 'documentation';

interface NavigationHeaderProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onOpenAiAssistant: () => void;
  alerts: AlertNotification[];
  financialAssumptions: FinancialAssumptions;
  onAssumptionsChange: (assumptions: FinancialAssumptions) => void;
  onExportReport: () => void;
  onExportExcel?: () => void;
  locations?: LocationRecord[];
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenAiAssistant,
  alerts,
  financialAssumptions,
  onAssumptionsChange,
  onExportReport,
  onExportExcel,
  locations = []
}) => {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const tabs: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview // GIS Canvas', icon: Map },
    { id: 'state', label: 'All-India State Matrix (5.70M KL)', icon: Globe2 },
    { id: 'brandValidation', label: 'Brand & Market Validation', icon: ShieldCheck },
    { id: 'district', label: 'District Intelligence', icon: Fuel },
    { id: 'product', label: 'Product Taxonomy', icon: Box },
    { id: 'distributor', label: 'Distributor White-Spots', icon: Sliders },
    { id: 'warehouse', label: 'Depot Optimization', icon: Box },
    { id: 'forecast', label: 'Forecast // EV Shift', icon: TrendingUp },
    { id: 'businessCase', label: 'Financial Business Case', icon: DollarSign },
    { id: 'documentation', label: 'Methodology & Audit', icon: FileText }
  ];

  const totalDemand = locations.reduce((sum, l) => sum + (l.totalEstimatedDemandKL || 0), 0) || 5700000;
  const criticalCount = locations.filter(l => l.opportunityTier === 'Critical White Spot').length || 8;

  return (
    <header className="w-full bg-[#0E1117] border-b border-[#1F2937] text-[#D1D5DB] sticky top-0 z-40 shadow-2xl">
      {/* Top Telemetry Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937]">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F27D26] rounded flex items-center justify-center shadow-[0_0_12px_rgba(242,125,38,0.35)] shrink-0">
            <div className="w-4 h-4 border-2 border-[#0A0B0E] bg-transparent"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white uppercase font-mono flex items-center gap-1.5">
                LuboIntel <span className="text-[#F27D26]">// India</span>
              </h1>
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#1F2937] text-emerald-400 border border-[#374151] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ALL-INDIA 5.70M KL LIVE
              </span>
            </div>
            <p className="text-[10px] font-mono text-gray-500 hidden sm:block">
              ALL 36 STATES &amp; UTS // VAHAN 4.0 // PPAC DISCLOSURES // WHITE-SPOT ENGINE
            </p>
          </div>
        </div>

        {/* Center/Right Technical Telemetry Metrics */}
        <div className="hidden md:flex items-center gap-5">
          <div className="text-right">
            <p className="text-[9px] text-gray-400 uppercase font-mono font-bold">ALL-INDIA MACRO TOTAL</p>
            <p className="text-xs font-mono font-bold text-blue-400">5.70 Million KL <span className="text-[9px] text-emerald-400 font-normal">(₹91,200 Cr)</span></p>
          </div>
          <div className="text-right border-l border-[#1F2937] pl-5">
            <p className="text-[9px] text-gray-400 uppercase font-mono font-bold">NATIONAL SUPPLY GAP</p>
            <p className="text-xs font-mono font-bold text-red-400">1.51 Million KL <span className="text-[9px] text-gray-400 font-normal">(26.5% Gap)</span></p>
          </div>
          <div className="text-right border-l border-[#1F2937] pl-5">
            <p className="text-[9px] text-gray-400 uppercase font-mono font-bold">ACCESSIBLE SUPPLY</p>
            <p className="text-xs font-mono font-bold text-emerald-400">4.19 Million KL <span className="text-[9px] text-gray-400 font-normal">(73.5% Cov)</span></p>
          </div>
          <div className="text-right border-l border-[#1F2937] pl-5">
            <p className="text-[9px] text-gray-400 uppercase font-mono font-bold">GEOGRAPHIC REACH</p>
            <p className="text-xs font-mono font-bold text-white">36 States &amp; UTs <span className="text-[9px] text-[#F27D26] font-normal">(6 Zones)</span></p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2">
          {/* Scenario Selector */}
          <div className="relative">
            <button
              onClick={() => setScenarioOpen(!scenarioOpen)}
              className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded bg-[#1F2937] hover:bg-[#374151] border border-[#374151] transition-colors text-white"
            >
              <span className="text-gray-400">SCENARIO:</span>
              <span className="text-[#F27D26] font-bold uppercase">{financialAssumptions.scenario}</span>
            </button>

            {scenarioOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0E1117] border border-[#374151] rounded p-1 shadow-2xl z-50 text-xs font-mono">
                {(['Conservative', 'Base', 'Aggressive'] as const).map(sc => (
                  <button
                    key={sc}
                    onClick={() => {
                      onAssumptionsChange({
                        ...financialAssumptions,
                        scenario: sc,
                        targetMarketSharePct: sc === 'Conservative' ? 8 : sc === 'Base' ? 15 : 25,
                        avgSellingPricePerLiterINR: sc === 'Conservative' ? 145 : sc === 'Base' ? 160 : 180,
                        grossMarginPct: sc === 'Conservative' ? 24 : sc === 'Base' ? 28.5 : 33
                      });
                      setScenarioOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded transition-colors uppercase flex items-center justify-between ${
                      financialAssumptions.scenario === sc
                        ? 'bg-[#F27D26] text-black font-bold'
                        : 'text-gray-300 hover:bg-[#1F2937]'
                    }`}
                  >
                    <span>{sc}</span>
                    <span className="text-[10px] opacity-75">
                      {sc === 'Conservative' ? '8% Share' : sc === 'Base' ? '15% Share' : '25% Share'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Decision Assistant Trigger */}
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#F27D26] hover:bg-[#E06D17] text-black font-mono font-bold text-[11px] shadow-[0_0_10px_rgba(242,125,38,0.3)] transition-colors uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI COPILOT</span>
          </button>

          {/* Export Dropdown (Excel / JSON Dossier) */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-mono text-[11px] font-bold transition-all shadow"
              title="Download Data (Excel .CSV / JSON)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>EXCEL EXPORT</span>
              <ChevronDown className="w-3 h-3 text-emerald-400 opacity-80" />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0E1117] border border-[#374151] rounded p-1.5 shadow-2xl z-50 text-xs font-mono">
                <div className="px-2 py-1 text-[9.5px] text-gray-500 font-bold uppercase border-b border-[#1F2937] mb-1">
                  Export Data Formats
                </div>
                <button
                  onClick={() => {
                    if (onExportExcel) {
                      onExportExcel();
                    } else {
                      downloadWhiteSpotExcel(locations, financialAssumptions.scenario);
                    }
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded hover:bg-[#1F2937] text-emerald-300 hover:text-emerald-200 transition-colors flex items-center gap-2.5 group"
                >
                  <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px] uppercase">White-Spot Excel (.CSV)</div>
                    <div className="text-[9.5px] text-gray-400">Full 4-Section Validation Dataset (5.7M KL)</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onExportReport();
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded hover:bg-[#1F2937] text-gray-300 hover:text-white transition-colors flex items-center gap-2.5 group mt-1"
                >
                  <div className="p-1 rounded bg-blue-500/20 text-blue-400">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px] uppercase">Strategic Dossier (.JSON)</div>
                    <div className="text-[9.5px] text-gray-400">Structured parameters &amp; active scenario</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1 py-1 font-mono text-xs whitespace-nowrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-[11px] font-bold uppercase transition-colors ${
                  isActive
                    ? 'border-[#F27D26] text-[#F27D26] bg-[#151921]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#151921]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F27D26]' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
