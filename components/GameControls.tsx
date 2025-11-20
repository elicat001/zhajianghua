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
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4 z-30">
        <button
          onClick={onNextRound}
          className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-green-900/50 transform hover:scale-105 transition-all flex items-center gap-2"
        >
          <PlayCircle size={24} />
          {gamePhase === GamePhase.Idle ? 'Start Game' : 'Next Round'}
        </button>
      </div>
    );
  }

  return (
    <div className={`absolute bottom-24 left-1/2 -translate-x-1/2 flex items-end gap-3 z-30 transition-opacity duration-300 ${isMyTurn ? 'opacity-100 pointer-events-auto' : 'opacity-50 pointer-events-none grayscale'}`}>
      
      <div className="flex flex-col gap-2">
        {!hasSeen && (
          <button
            onClick={onLook}
            disabled={!canLook}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex flex-col items-center justify-center w-20 h-20 border-4 border-blue-800"
          >
            <Eye size={24} />
            <span className="text-xs font-bold mt-1">Look</span>
          </button>
        )}
        {hasSeen && (
           <div className="bg-black/50 text-white text-xs p-2 rounded text-center">
             Cards Visible
           </div>
        )}
      </div>

      <button
        onClick={onFold}
        className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg flex flex-col items-center justify-center w-20 h-20 border-4 border-red-800 mb-0"
      >
        <XCircle size={24} />
        <span className="text-xs font-bold mt-1">Fold</span>
      </button>

      <button
        onClick={onCompare}
        disabled={!canCompare}
        className={`bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg flex flex-col items-center justify-center w-20 h-20 border-4 border-orange-800 mb-4 ${!canCompare ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Swords size={24} />
        <span className="text-xs font-bold mt-1">Compare</span>
      </button>

      <div className="flex flex-col gap-2">
        <button
          onClick={onCall}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg flex flex-col items-center justify-center w-24 h-24 border-4 border-green-800 transform -translate-y-2"
        >
          <div className="text-xs uppercase font-bold tracking-wider">Call</div>
          <div className="text-xl font-black text-yellow-300">{costToCall}</div>
        </button>
      </div>

      <button
        onClick={onRaise}
        className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg flex flex-col items-center justify-center w-20 h-20 border-4 border-purple-800 mb-0"
      >
        <ArrowUpCircle size={24} />
        <span className="text-xs font-bold mt-1">Raise</span>
      </button>

    </div>
  );
};

export default GameControls;