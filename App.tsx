
import React, { useState } from 'react';
import ZhaJinHuaGame from './components/ZhaJinHuaGame';
import DouDiZhuGame from './components/DouDiZhuGame';
import { GameMode } from './types';
import { Spade, Club } from 'lucide-react';

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameMode>(GameMode.Menu);

  if (activeGame === GameMode.ZhaJinHua) {
    return <ZhaJinHuaGame onExit={() => setActiveGame(GameMode.Menu)} />;
  }

  if (activeGame === GameMode.DouDiZhu) {
    return <DouDiZhuGame onExit={() => setActiveGame(GameMode.Menu)} />;
  }

  return (
    <div className="w-full h-[100dvh] bg-slate-950 flex items-center justify-center relative overflow-hidden">
       {/* Animated Background */}
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
       <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-black opacity-90"></div>

       <div className="z-10 max-w-4xl w-full px-4 flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4 poker-font drop-shadow-lg text-center">
             CASINO HUB
          </h1>
          <p className="text-gray-400 mb-12 text-center">Select a game to start playing</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              
              {/* Zha Jin Hua Card */}
              <button 
                onClick={() => setActiveGame(GameMode.ZhaJinHua)}
                className="group relative bg-gradient-to-br from-green-900 to-slate-900 border border-green-700/50 rounded-3xl p-8 hover:scale-105 transition-all duration-300 shadow-2xl flex flex-col items-center"
              >
                 <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity"></div>
                 <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] group-hover:shadow-[0_0_50px_rgba(34,197,94,0.6)] transition-shadow">
                    <Spade size={48} className="text-white" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">Zha Jin Hua</h2>
                 <p className="text-green-200/60 text-sm text-center">Classic 3-Card Poker. Bluff, bet, and win big against AI opponents.</p>
              </button>

              {/* Dou Di Zhu Card */}
              <button 
                onClick={() => setActiveGame(GameMode.DouDiZhu)}
                className="group relative bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-700/50 rounded-3xl p-8 hover:scale-105 transition-all duration-300 shadow-2xl flex flex-col items-center"
              >
                 <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity"></div>
                 <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] transition-shadow">
                    <Club size={48} className="text-white" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">Dou Di Zhu</h2>
                 <p className="text-blue-200/60 text-sm text-center">Fight the Landlord. 1 vs 2 card strategy game with 54 cards.</p>
                 <div className="absolute top-4 right-4 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded">NEW</div>
              </button>

          </div>
       </div>
    </div>
  );
};

export default App;
