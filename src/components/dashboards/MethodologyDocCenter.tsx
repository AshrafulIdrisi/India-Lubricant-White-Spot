import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Database, 
  Calculator, 
  Layers, 
  BookOpen, 
  ChevronRight, 
  Copy, 
  Check, 
  Code2, 
  Sparkles,
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';
import { DOCUMENTATION_SECTIONS } from '../../data/documentationData';
import { INDIA_LOCATIONS } from '../../data/indiaGeoData';
import { downloadWhiteSpotExcel } from '../../utils/excelExporter';

export const MethodologyDocCenter: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>(DOCUMENTATION_SECTIONS[0].id);
  const [copied, setCopied] = useState<boolean>(false);

  const activeSection = DOCUMENTATION_SECTIONS.find(s => s.id === activeSectionId) || DOCUMENTATION_SECTIONS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSection.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#7C3AED]" />
            Methodology &amp; Engineering Documentation Repository
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Business requirements specification • PostGIS DDL schemas • Mathematical formulas • Data catalogue
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadWhiteSpotExcel(INDIA_LOCATIONS, 'Base')}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors uppercase shadow-2xs cursor-pointer"
            title="Download full benchmark validation dataset as Excel .CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download Dataset (.CSV)</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors uppercase shadow-2xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Specification'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Navigation (4 cols) & Right Document Viewer (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Navigation Menu */}
        <div className="lg:col-span-4 space-y-2">
          {DOCUMENTATION_SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              className={`w-full p-3.5 rounded-2xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                activeSectionId === sec.id
                  ? 'border-2 border-[#7C3AED] bg-purple-50/60 shadow-sm'
                  : 'border border-slate-200/90 bg-white hover:bg-slate-50/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs uppercase text-slate-900">{sec.title.split('. ')[1]}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100/70 text-[#7C3AED] border border-purple-200">
                  {sec.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                {sec.summary}
              </p>
            </button>
          ))}
        </div>

        {/* Right Document Content */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm max-h-[700px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <span className="text-[10px] text-[#7C3AED] uppercase font-bold tracking-wider">
                {activeSection.badge}
              </span>
              <h3 className="font-bold text-sm text-slate-900 uppercase mt-0.5">{activeSection.title}</h3>
            </div>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Audited Specification
            </span>
          </div>

          <div className="text-slate-700 leading-relaxed text-xs space-y-3">
            <pre className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-800 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
              {activeSection.markdownContent}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
