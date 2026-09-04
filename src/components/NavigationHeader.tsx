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
  Search,
  Activity,
  Globe2,
  FileSpreadsheet,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { AlertNotification, FinancialAssumptions, LocationRecord } from '../types';
import { downloadWhiteSpotExcel } from '../utils/excelExporter';

export type DashboardTab = 
  | 'overview'
  | 'executiveKpi'
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
  onToggleMobileSidebar?: () => void;
  onSearchQuery?: (q: string) => void;
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
  locations = [],
  onToggleMobileSidebar,
  onSearchQuery
}) => {
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const tabs: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Dashboard', icon: Map },
    { id: 'state', label: 'All-India Matrix', icon: Globe2 },
    { id: 'brandValidation', label: '50 Competitors', icon: ShieldCheck },
    { id: 'district', label: 'District Intelligence', icon: Fuel },
    { id: 'distributor', label: 'White Spot Analysis', icon: Sliders },
    { id: 'warehouse', label: 'Depot Optimization', icon: Box },
    { id: 'product', label: 'Product Taxonomy', icon: Building2 },
    { id: 'forecast', label: 'Forecast // EV Shift', icon: TrendingUp },
    { id: 'businessCase', label: 'Financial Business Case', icon: DollarSign },
    { id: 'documentation', label: 'Methodology & Audit', icon: FileText }
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearchQuery) onSearchQuery(e.target.value);
  };

  return (
    <header className="w-full bg-white border-b border-slate-200/90 sticky top-0 z-20 shadow-sm select-none">
      {/* Top Workspace Header Bar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-[72px] flex items-center justify-between gap-4">
        
        {/* Left: Mobile Sidebar Toggle & Search Input */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Search Bar matching Variation 18 */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search markets, states, or distributors..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-sans"
            />
          </div>
        </div>

        {/* Center/Right: Macro Telemetry & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Live Data Ticker Pill */}
          <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>5.70M KL</span>
              <span className="text-slate-400 font-normal">(₹91.2K Cr)</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="text-slate-600">
              Unmet Gap: <strong className="text-rose-600">1.51M KL</strong>
            </div>
          </div>

          {/* Scenario Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setScenarioOpen(!scenarioOpen)}
              className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-700 transition-colors shadow-sm"
            >
              <span className="text-slate-400 hidden sm:inline">Scenario:</span>
              <span className="text-[#7C3AED] uppercase">{financialAssumptions.scenario}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {scenarioOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Target Scenario
                </div>
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
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between font-semibold ${
                      financialAssumptions.scenario === sc
                        ? 'bg-[#7C3AED] text-white font-bold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{sc}</span>
                    <span className="text-[10px] opacity-80">
                      {sc === 'Conservative' ? '8% Share' : sc === 'Base' ? '15% Share' : '25% Share'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Hub Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs shadow-sm transition-all"
              title="Export CSV / JSON"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  Download Formats
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
                  className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 hover:text-emerald-950 transition-colors flex items-center gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[12px]">White-Spot Dataset (.CSV)</div>
                    <div className="text-[10px] text-slate-500">All 36 States &amp; 780 Districts</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onExportReport();
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50 text-slate-800 hover:text-[#7C3AED] transition-colors flex items-center gap-3 group mt-1"
                >
                  <div className="p-2 rounded-lg bg-purple-100 text-[#7C3AED]">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[12px]">Strategic Dossier (.JSON)</div>
                    <div className="text-[10px] text-slate-500">Configured Scenario &amp; Drivers</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* AI Decision Assistant Action Button */}
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#6D28D9] hover:to-[#4338CA] text-white font-bold text-xs shadow-md shadow-purple-500/25 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>
        </div>
      </div>

      {/* Horizontal Sub-tabs (Visible on Tablet/Mobile or as quick switcher) */}
      <div className="lg:hidden border-t border-slate-100 bg-slate-50/80 px-4 overflow-x-auto no-scrollbar">
        <nav className="flex space-x-2 py-2 text-xs font-semibold whitespace-nowrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

