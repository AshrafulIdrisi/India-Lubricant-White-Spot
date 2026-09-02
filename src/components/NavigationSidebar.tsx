import React from 'react';
import { 
  Map, 
  Globe2, 
  ShieldCheck, 
  Fuel, 
  Sliders, 
  Box, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Sparkles, 
  Building2,
  HelpCircle,
  ChevronRight,
  Zap,
  Boxes,
  FileSpreadsheet
} from 'lucide-react';
import { DashboardTab } from './NavigationHeader';
import { FinancialAssumptions } from '../types';

interface NavigationSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onOpenAiAssistant: () => void;
  financialAssumptions: FinancialAssumptions;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenAiAssistant,
  financialAssumptions,
  isOpenMobile,
  onCloseMobile
}) => {
  const mainNavItems = [
    { id: 'overview' as DashboardTab, label: 'Dashboard', sublabel: 'GIS Canvas & Heatmap', icon: Map },
    { id: 'state' as DashboardTab, label: 'All-India Matrix', sublabel: '36 States (5.70M KL)', icon: Globe2 },
    { id: 'brandValidation' as DashboardTab, label: '50 Competitors', sublabel: '8.85M KL Capacity Audit', icon: ShieldCheck }
  ];

  const analyticsNavItems = [
    { id: 'district' as DashboardTab, label: 'District Intelligence', sublabel: '780 Consuming Hubs', icon: Fuel },
    { id: 'distributor' as DashboardTab, label: 'White Spot Analysis', sublabel: '1.51M KL Unmet Gaps', icon: Sliders },
    { id: 'warehouse' as DashboardTab, label: 'Depot Optimization', sublabel: 'Network Sizing & Radius', icon: Box },
    { id: 'product' as DashboardTab, label: 'Product Taxonomy', sublabel: 'HDEO, PCMO, Hydraulics', icon: Layers },
    { id: 'forecast' as DashboardTab, label: 'Forecast // EV Shift', sublabel: '2026-2036 Trajectory', icon: TrendingUp }
  ];

  const workspaceNavItems = [
    { id: 'businessCase' as DashboardTab, label: 'Financial Business Case', sublabel: 'CAPEX, OPEX & IRR Simulator', icon: DollarSign },
    { id: 'documentation' as DashboardTab, label: 'Methodology & Audit', sublabel: 'VAHAN & PPAC Data Grounding', icon: FileText }
  ];

  const handleItemClick = (tabId: DashboardTab) => {
    onTabChange(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside 
      className={`
        w-[270px] bg-white border-r border-slate-200/90 flex flex-col h-screen shrink-0 z-30
        transition-all duration-300 select-none
        ${isOpenMobile ? 'fixed inset-y-0 left-0 shadow-2xl z-50' : 'hidden lg:flex sticky top-0'}
      `}
    >
      {/* Brand Logo & Header */}
      <div className="p-6 pb-5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] shadow-lg shadow-purple-500/25 flex items-center justify-center text-white font-extrabold text-xl tracking-tighter">
            L
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">LuboIntel</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-[#7C3AED] border border-purple-200/60">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400">India Market Insights</p>
          </div>
        </div>
      </div>

      {/* Navigation Menus List */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 text-xs font-sans">
        
        {/* Section: Main Dashboards */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            DASHBOARDS
          </div>
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all group text-left
                    ${isActive 
                      ? 'bg-purple-50 text-[#7C3AED] shadow-sm font-bold' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`
                      p-1.5 rounded-lg transition-colors
                      ${isActive ? 'bg-[#7C3AED] text-white shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-[13px] leading-tight truncate">{item.label}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-[#7C3AED]/80' : 'text-slate-400'}`}>{item.sublabel}</div>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Analytics & Intelligence */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            ANALYTICS &amp; GIS
          </div>
          <div className="space-y-1">
            {analyticsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all group text-left
                    ${isActive 
                      ? 'bg-purple-50 text-[#7C3AED] shadow-sm font-bold' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`
                      p-1.5 rounded-lg transition-colors
                      ${isActive ? 'bg-[#7C3AED] text-white shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-[13px] leading-tight truncate">{item.label}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-[#7C3AED]/80' : 'text-slate-400'}`}>{item.sublabel}</div>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Workspace & Finance */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            WORKSPACE &amp; SIMULATORS
          </div>
          <div className="space-y-1">
            {workspaceNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all group text-left
                    ${isActive 
                      ? 'bg-purple-50 text-[#7C3AED] shadow-sm font-bold' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`
                      p-1.5 rounded-lg transition-colors
                      ${isActive ? 'bg-[#7C3AED] text-white shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-[13px] leading-tight truncate">{item.label}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-[#7C3AED]/80' : 'text-slate-400'}`}>{item.sublabel}</div>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* AI Strategy Copilot Footer Card */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70">
        <div className="bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] rounded-2xl p-3.5 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-xs">AI Market Copilot</span>
          </div>
          <p className="text-[11px] text-purple-100 leading-snug mb-3">
            Ask ROI sizing, competitor capacities, or compare district clusters.
          </p>
          <button
            onClick={onOpenAiAssistant}
            className="w-full py-1.5 px-3 rounded-lg bg-white text-[#7C3AED] hover:bg-purple-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Launch Copilot</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live 5.70M KL Model
          </span>
          <span className="text-slate-500">v2.8 Enterprise</span>
        </div>
      </div>
    </aside>
  );
};
