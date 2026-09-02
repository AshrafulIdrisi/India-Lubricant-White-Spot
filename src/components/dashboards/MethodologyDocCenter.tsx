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
      <div className="bg-[#0E1117] border border-[#1F2937] p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#F27D26]" />
            Methodology &amp; Engineering Documentation Repository
          </h2>
          <p className="text-[10px] font-mono text-gray-500">
            BUSINESS REQUIREMENTS SPECIFICATION // POSTGIS DDL SCHEMAS // MATHEMATICAL FORMULAS // DATA CATALOGUE
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadWhiteSpotExcel(INDIA_LOCATIONS, 'Base')}
            className="flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition-colors uppercase shadow"
            title="Download full benchmark validation dataset as Excel .CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>DOWNLOAD DATASET (.CSV)</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded bg-[#1F2937] hover:bg-[#374151] text-gray-200 border border-[#374151] transition-colors uppercase"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
            <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY SPECIFICATION'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Navigation (4 cols) & Right Document Viewer (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Navigation Menu */}
        <div className="lg:col-span-4 space-y-1.5">
          {DOCUMENTATION_SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              className={`w-full p-3 rounded-sm border-l-2 text-left transition-all flex flex-col justify-between ${
                activeSectionId === sec.id
                  ? 'border-[#F27D26] bg-[#1F2937] border-t border-r border-b border-[#F27D26]/40 text-white'
                  : 'border-[#1F2937] bg-[#0E1117] border-t border-r border-b text-gray-400 hover:bg-[#151921] hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs font-mono uppercase text-white">{sec.title.split('. ')[1]}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0A0B0E] text-[#F27D26] border border-[#374151]">
                  {sec.badge}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono leading-relaxed line-clamp-2">
                {sec.summary}
              </p>
            </button>
          ))}
        </div>

        {/* Right Document Content */}
        <div className="lg:col-span-8 bg-[#0E1117] border border-[#1F2937] p-4 shadow-xl max-h-[700px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-2.5 mb-3">
            <div>
              <span className="text-[9px] font-mono text-[#F27D26] uppercase font-bold tracking-wider">
                {activeSection.badge}
              </span>
              <h3 className="font-bold text-sm text-white uppercase font-mono mt-0.5">{activeSection.title}</h3>
            </div>
            <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> AUDITED SPECIFICATION
            </span>
          </div>

          <div className="text-gray-300 leading-relaxed text-xs space-y-3 font-mono">
            <pre className="bg-[#0A0B0E] p-3 rounded border border-[#1F2937] text-[10px] text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
              {activeSection.markdownContent}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
