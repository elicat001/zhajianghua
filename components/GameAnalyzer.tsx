
import React from 'react';
import { AnalysisResult } from '../types';
import { BrainCircuit, TrendingUp, AlertTriangle, ThumbsUp, ArrowUpCircle } from 'lucide-react';

interface GameAnalyzerProps {
  analysis: AnalysisResult | null;
  isLoading: boolean;
  visible: boolean;
}

const GameAnalyzer: React.FC<GameAnalyzerProps> = ({ analysis, isLoading, visible }) => {
  if (!visible) return null;

  return (
    <div className="absolute top-20 left-4 z-30 animate-in slide-in-from-left fade-in duration-500">
      <div className="bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.2)] w-64">
        
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
          <BrainCircuit className="text-cyan-400" size={20} />
          <h3 className="text-cyan-100 font-bold text-sm uppercase tracking-wider">AI Tactics</h3>
        </div>

        {isLoading ? (
           <div className="flex flex-col items-center justify-center h-24 space-y-2">
             <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
             <div className="text-xs text-cyan-400/70">Analyzing probabilities...</div>
           </div>
        ) : analysis ? (
          <div className="space-y-4">
            
            {/* Hand Strength */}
            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>Hand Strength</span>
                <span className="font-mono text-cyan-300">{(analysis.handStrength * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    analysis.handStrength > 0.8 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                    analysis.handStrength > 0.5 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                    'bg-gradient-to-r from-red-500 to-pink-600'
                  }`}
                  style={{ width: `${analysis.handStrength * 100}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-gray-400 mt-1 text-right">{analysis.handName}</div>
            </div>

            {/* Win Rate */}
            <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                    <TrendingUp size={16} className={analysis.winRate > 0.5 ? "text-green-400" : "text-red-400"} />
                    <span className="text-xs text-gray-300">Win Prob</span>
                </div>
                <span className={`text-lg font-black font-mono ${
                    analysis.winRate > 0.7 ? "text-green-400" :
                    analysis.winRate > 0.4 ? "text-yellow-400" : "text-red-400"
                }`}>
                    {(analysis.winRate * 100).toFixed(0)}%
                </span>
            </div>

            {/* Recommendation */}
            <div className={`p-3 rounded-xl flex items-center gap-3 border ${
                analysis.advice === 'Raise' ? 'bg-green-900/30 border-green-500/50' :
                analysis.advice === 'Call' ? 'bg-blue-900/30 border-blue-500/50' :
                'bg-red-900/30 border-red-500/50'
            }`}>
                {analysis.advice === 'Raise' && <ArrowUpCircle className="text-green-400" size={24} />}
                {analysis.advice === 'Call' && <ThumbsUp className="text-blue-400" size={24} />}
                {analysis.advice === 'Fold' && <AlertTriangle className="text-red-400" size={24} />}
                {analysis.advice === 'Caution' && <AlertTriangle className="text-yellow-400" size={24} />}
                
                <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Suggestion</div>
                    <div className="text-sm font-bold text-white">
                        {analysis.advice === 'Raise' ? 'Aggressive' : 
                         analysis.advice === 'Call' ? 'Hold / Call' : 
                         analysis.advice === 'Fold' ? 'Fold' : 'Caution'}
                    </div>
                </div>
            </div>

          </div>
        ) : (
            <div className="text-xs text-gray-500 text-center py-4">
                Look at your cards to see analysis.
            </div>
        )}

      </div>
    </div>
  );
};

export default GameAnalyzer;
