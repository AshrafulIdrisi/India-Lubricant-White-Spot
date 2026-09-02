import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Fuel, 
  HelpCircle, 
  ChevronRight, 
  ShieldCheck, 
  Building2, 
  TrendingUp, 
  DollarSign 
} from 'lucide-react';
import { LocationRecord, WarehouseOptimizationNode, FinancialAssumptions } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationRecord[];
  warehouseNodes: WarehouseOptimizationNode[];
  selectedLocation: LocationRecord | null;
  financialAssumptions: FinancialAssumptions;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  locations,
  warehouseNodes,
  selectedLocation,
  financialAssumptions
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: `Hello! I am your **Senior Oil & Gas Lubricants Intelligence Analyst**. I have access to our entire verified India demand dataset (${locations.length} district clusters, ${warehouseNodes.length} optimized regional depots, vehicle stock from VAHAN, and industrial power load metrics).\n\nHow can I support your market penetration or capital allocation strategy today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Where should I invest ₹5 crore for highest ROI in industrial lubes?',
    'Compare Nashik vs Bharuch for a new master distributor',
    'What is the EV substitution vulnerability for engine oils by 2030?',
    'Which district has the highest unmet supply deficit?'
  ];

  const handleSendMessage = async (promptToSend?: string) => {
    const query = promptToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Send query to server-side Gemini API endpoint
      const response = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          contextData: {
            selectedLocation: selectedLocation ? {
              name: selectedLocation.name,
              state: selectedLocation.stateName,
              totalDemandKL: selectedLocation.totalEstimatedDemandKL,
              supplyGapKL: selectedLocation.supplyGapKL,
              whiteSpotScore: selectedLocation.whiteSpotScore,
              opportunityTier: selectedLocation.opportunityTier,
              recommendedFacility: selectedLocation.recommendedFacility,
              explainabilityDrivers: selectedLocation.explainabilityDrivers
            } : null,
            topDistricts: locations.slice(0, 5).map(l => ({
              name: l.name,
              state: l.stateName,
              demandKL: l.totalEstimatedDemandKL,
              gapKL: l.supplyGapKL,
              score: l.whiteSpotScore
            })),
            financialAssumptions
          }
        })
      });

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply || 'Analysis complete.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Apologies, I encountered an issue retrieving the analysis. Please verify your connection or try another query.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0E1117] border border-[#1F2937] w-full max-w-3xl h-[650px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0A0B0E] border-b border-[#1F2937] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#1F2937] border border-[#374151] flex items-center justify-center text-[#F27D26]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white uppercase font-mono flex items-center gap-2">
                AI Strategic Lubricants Market Analyst
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#1F2937] text-green-400 border border-green-500/30">
                  GEMINI 2.5 GROUNDED
                </span>
              </h3>
              <p className="text-[10px] font-mono text-gray-500">
                AUDITED AGAINST VAHAN, PPAC, MOSPI, AND INDUSTRIAL POWER LOAD DATASETS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#1F2937] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs font-mono">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-6 h-6 bg-[#151921] border border-[#374151] text-[#F27D26] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`p-3 max-w-xl leading-relaxed text-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#F27D26] text-black font-semibold'
                    : 'bg-[#151921] border border-[#1F2937] text-gray-200 whitespace-pre-wrap font-sans'
                }`}
              >
                {msg.text}
                <div className={`text-[9px] mt-1.5 font-mono ${msg.sender === 'user' ? 'text-black/70' : 'text-gray-500'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-6 h-6 bg-[#1F2937] border border-[#374151] text-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-[#F27D26] font-mono">
              <div className="w-6 h-6 bg-[#151921] border border-[#374151] flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span>SYNTHESIZING GEOSPATIAL MARKET INTELLIGENCE...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-4 py-2 bg-[#0A0B0E] border-t border-[#1F2937] flex items-center gap-1.5 overflow-x-auto font-mono">
          <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider whitespace-nowrap">
            PROMPTS:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="text-[10px] px-2 py-1 rounded bg-[#151921] hover:bg-[#F27D26] hover:text-black text-gray-300 border border-[#1F2937] whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
            >
              <span>{p}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#0A0B0E] border-t border-[#1F2937] flex items-center gap-2 font-mono">
          <input
            type="text"
            placeholder="TYPE QUERY (E.G. COMPARE NASHIK VS BHARUCH, CAPEX SIZING, EV VULNERABILITY)..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-3 py-2 bg-[#151921] border border-[#374151] rounded text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F27D26] uppercase"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2 rounded bg-[#F27D26] hover:bg-[#d96a1a] disabled:opacity-50 text-black font-bold text-xs transition-colors flex items-center gap-1.5 shadow-[0_0_10px_rgba(242,125,38,0.3)] uppercase"
          >
            <span>SUBMIT</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
