
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { BrainCircuit, TrendingUp, AlertTriangle, ThumbsUp, ArrowUpCircle, ChevronUp, ChevronDown, X } from 'lucide-react';

interface GameAnalyzerProps {
  analysis: AnalysisResult | null;
  isLoading: boolean;
  visible: boolean;
}

const GameAnalyzer: React.FC<GameAnalyzerProps> = ({ analysis, isLoading, visible }) => {
  const [isOpen, setIsOpen] = useState(true); // Desktop default open
  // Mobile check via CSS or effect is harder without hooks, so we use responsive classes.
  // Instead we'll default to a minimized state visually on mobile if we want, 
  // but a manual toggle is better.
  
  if (!visible) return null;

  if (!isOpen) {
      return (
          <button 
            onClick={() => setIsOpen(true)}
            className="absolute top-20 left-2 md:left-4 z-30 bg-cyan-900/80 text-cyan-400 p-2 rounded-full border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-in fade-in"
          >
              <BrainCircuit size={24} />
          </button>
      )
  }

  return (
    <div className="absolute top-16 md:top-20 left-2 md:left-4 z-30 animate-in slide-in-from-left fade-in duration-500 max-w-[200px] md:max-w-xs">
      <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-3 md:p-4 shadow-[0_0_20px_rgba(6,182,212,0.2)] w-full md:w-64 relative">
        
        <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white md:hidden"
        >
            <X size={16} />
        </button>

        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10 pr-4">
          <BrainCircuit className="text-cyan-400" size={18} />
          <h3 className="text-cyan-100 font-bold text-xs md:text-sm uppercase tracking-wider">AI Tactics</h3>
        </div>

        {isLoading ? (
           <div className="flex flex-col items-center justify-center h-20 space-y-2">
             <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
             <div className="text-[10px] text-cyan-400/70">Calculating...</div>
           </div>
        ) : analysis ? (
          <div className="space-y-3">
            
            {/* Hand Strength */}
            <div>
              <div className="flex justify-between text-[10px] md:text-xs text-gray-300 mb-1">
                <span>Strength</span>
                <span className="font-mono text-cyan-300">{(analysis.handStrength * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 md:h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    analysis.handStrength > 0.8 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                    analysis.handStrength > 0.5 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                    'bg-gradient-to-r from-red-500 to-pink-600'
                  }`}
                  style={{ width: `${analysis.handStrength * 100}%` }}
                ></div>
              </div>
              <div className="text-[9px] text-gray-400 mt-1 text-right truncate">{analysis.handName}</div>
            </div>

            {/* Win Rate */}
            <div className="flex items-center justify-between bg-white/5 p-1.5 md:p-2 rounded-lg">
                <div className="flex items-center gap-1.5">
                    <TrendingUp size={14} className={analysis.winRate > 0.5 ? "text-green-400" : "text-red-400"} />
                    <span className="text-[10px] md:text-xs text-gray-300">Win Prob</span>
                </div>
                <span className={`text-sm md:text-lg font-black font-mono ${
                    analysis.winRate > 0.7 ? "text-green-400" :
                    analysis.winRate > 0.4 ? "text-yellow-400" : "text-red-400"
                }`}>
                    {(analysis.winRate * 100).toFixed(0)}%
                </span>
            </div>

            {/* Recommendation */}
            <div className={`p-2 md:p-3 rounded-xl flex items-center gap-2 md:gap-3 border ${
                analysis.advice === 'Raise' ? 'bg-green-900/30 border-green-500/50' :
                analysis.advice === 'Call' ? 'bg-blue-900/30 border-blue-500/50' :
                'bg-red-900/30 border-red-500/50'
            }`}>
                {analysis.advice === 'Raise' && <ArrowUpCircle className="text-green-400" size={20} />}
                {analysis.advice === 'Call' && <ThumbsUp className="text-blue-400" size={20} />}
                {analysis.advice === 'Fold' && <AlertTriangle className="text-red-400" size={20} />}
                {analysis.advice === 'Caution' && <AlertTriangle className="text-yellow-400" size={20} />}
                
                <div>
                    <div className="text-[9px] text-gray-400 uppercase font-bold">Advice</div>
                    <div className="text-xs md:text-sm font-bold text-white">
                        {analysis.advice === 'Raise' ? 'Aggressive' : 
                         analysis.advice === 'Call' ? 'Hold / Call' : 
                         analysis.advice === 'Fold' ? 'Fold' : 'Caution'}
                    </div>
                </div>
            </div>

          </div>
        ) : (
            <div className="text-[10px] text-gray-500 text-center py-2">
                Look at cards first.
            </div>
        )}

      </div>
    </div>
  );
};

export default GameAnalyzer;
