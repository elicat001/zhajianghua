
import React from 'react';
import { Eye, ArrowUpCircle, XCircle, PlayCircle, Swords } from 'lucide-react';
import { GamePhase } from '../types';

interface GameControlsProps {
  onLook: () => void;
  onFold: () => void;
  onCall: () => void;
  onRaise: () => void;
  onCompare: () => void;
  onNextRound: () => void;
  canLook: boolean;
  canCompare: boolean;
  currentBet: number;
  isMyTurn: boolean;
  gamePhase: GamePhase;
  hasSeen: boolean;
  costToCall: number;
}

const GameControls: React.FC<GameControlsProps> = ({
  onLook,
  onFold,
  onCall,
  onRaise,
  onCompare,
  onNextRound,
  canLook,
  canCompare,
  isMyTurn,
  gamePhase,
  hasSeen,
  costToCall
}) => {

  if (gamePhase === GamePhase.Showdown || gamePhase === GamePhase.Idle) {
    return (
      <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 flex gap-4 z-30 w-full justify-center px-4">
        <button
          onClick={onNextRound}
          className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-green-900/50 transform hover:scale-105 transition-all flex items-center gap-2 text-sm md:text-base"
        >
          <PlayCircle size={20} className="md:w-6 md:h-6" />
          {gamePhase === GamePhase.Idle ? 'Start Game' : 'Next Round'}
        </button>
      </div>
    );
  }

  // Button shared styles
  const btnBase = "text-white rounded-full shadow-lg flex flex-col items-center justify-center border-2 md:border-4 transition-all active:scale-95";
  const btnSize = "w-14 h-14 md:w-20 md:h-20";
  const btnCallSize = "w-16 h-16 md:w-24 md:h-24";
  const labelSize = "text-[9px] md:text-xs font-bold mt-0.5 md:mt-1";
  const iconSize = 18; // Lucide size prop
  const iconClass = "md:w-6 md:h-6"; // Tailwind scaling for larger screens

  return (
    <div className={`absolute bottom-8 md:bottom-24 left-1/2 -translate-x-1/2 flex items-end gap-2 md:gap-3 z-30 transition-opacity duration-300 ${isMyTurn ? 'opacity-100 pointer-events-auto' : 'opacity-50 pointer-events-none grayscale'}`}>
      
      <div className="flex flex-col gap-2 items-center">
        {!hasSeen && (
          <button
            onClick={onLook}
            disabled={!canLook}
            className={`${btnBase} ${btnSize} bg-blue-600 hover:bg-blue-700 border-blue-800`}
          >
            <Eye size={iconSize} className={iconClass} />
            <span className={labelSize}>Look</span>
          </button>
        )}
        {hasSeen && (
           <div className="bg-black/50 text-white text-[9px] md:text-xs p-1 rounded text-center max-w-[60px]">
             Seen
           </div>
        )}
      </div>

      <button
        onClick={onFold}
        className={`${btnBase} ${btnSize} bg-red-600 hover:bg-red-700 border-red-800 mb-0`}
      >
        <XCircle size={iconSize} className={iconClass} />
        <span className={labelSize}>Fold</span>
      </button>

      <button
        onClick={onCompare}
        disabled={!canCompare}
        className={`${btnBase} ${btnSize} bg-orange-600 hover:bg-orange-700 border-orange-800 mb-2 md:mb-4 ${!canCompare ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Swords size={iconSize} className={iconClass} />
        <span className={labelSize}>PK</span>
      </button>

      <div className="flex flex-col gap-2 items-center">
        <button
          onClick={onCall}
          className={`${btnBase} ${btnCallSize} bg-green-600 hover:bg-green-700 border-green-800 -translate-y-1 md:-translate-y-2`}
        >
          <div className="text-[8px] md:text-xs uppercase font-bold tracking-wider">Call</div>
          <div className="text-sm md:text-xl font-black text-yellow-300">{costToCall}</div>
        </button>
      </div>

      <button
        onClick={onRaise}
        className={`${btnBase} ${btnSize} bg-purple-600 hover:bg-purple-700 border-purple-800 mb-0`}
      >
        <ArrowUpCircle size={iconSize} className={iconClass} />
        <span className={labelSize}>Raise</span>
      </button>

    </div>
  );
};

export default GameControls;
