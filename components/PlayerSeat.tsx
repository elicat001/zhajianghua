import React from 'react';
import { Player, PlayerStatus } from '../types';
import CardComponent from './Card';
import { User, Bot, Eye } from 'lucide-react';

interface PlayerSeatProps {
  player: Player;
  isActive: boolean;
  isDealer: boolean;
  position: 'bottom' | 'top' | 'left' | 'right';
  isWinner?: boolean;
  showCards?: boolean; // Forced show (e.g. showdown)
}

const PlayerSeat: React.FC<PlayerSeatProps> = ({ player, isActive, isDealer, position, isWinner, showCards }) => {
  const isFolded = player.status === PlayerStatus.Folded;
  const isLost = player.status === PlayerStatus.Lost;

  // Dynamic classes based on position
  const positionClasses = {
    bottom: 'bottom-4 left-1/2 -translate-x-1/2',
    top: 'top-16 left-1/2 -translate-x-1/2', // Moved down for Dealer space
    left: 'left-4 top-1/2 -translate-y-1/2',
    right: 'right-4 top-1/2 -translate-y-1/2',
  };

  // Avatar Image Source
  const avatarUrl = player.isBot 
    ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.name)}`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name)}`;

  // Safe hand access: Ensure array exists and filter out any potential null/undefined slots
  const visibleHand = (player.hand || []).filter(c => c !== undefined && c !== null);

  return (
    <div className={`absolute ${positionClasses[position]} flex flex-col items-center transition-all duration-500 z-10`}>
      
      {/* Status Badge / Action Bubble */}
      {player.actionFeedback && (
        <div className="absolute -top-12 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full shadow-lg animate-bounce z-30 whitespace-nowrap border-2 border-black">
          {player.actionFeedback}
        </div>
      )}

      {/* Dealer Button */}
      {isDealer && (
          <div className="absolute top-0 -right-2 z-20 bg-white text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-400 shadow-md">
            D
          </div>
      )}

      {/* Avatar Section */}
      <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 bg-slate-800
        ${isActive ? 'border-yellow-400 ring-4 ring-yellow-400/30 scale-110' : 'border-gray-600'}
        ${isWinner ? 'border-green-400 ring-4 ring-green-400/60' : ''}
        ${isFolded || isLost ? 'opacity-60 grayscale' : ''}
        transition-all duration-300
      `}>
        <img src={avatarUrl} alt={player.name} className="w-full h-full rounded-full p-1" />
        
        {/* Badges */}
        {player.hasSeenCards && !isFolded && !isLost && (
          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-800 z-20">
            <Eye size={12} />
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className={`mt-12 absolute top-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg text-center border min-w-[80px] shadow-lg ${isActive ? 'border-yellow-500/50' : 'border-gray-700'}`}>
        <div className="font-bold text-xs text-gray-100 truncate max-w-[100px]">{player.name}</div>
        <div className="text-yellow-400 text-xs font-mono flex items-center justify-center gap-1">
           <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-200 shadow-sm"></div>
           {player.chips}
        </div>
      </div>

      {/* Cards Layout */}
      <div className="flex -space-x-8 mt-14 z-0 h-24 items-center justify-center relative">
        {visibleHand.map((card, idx) => (
          <div 
            key={idx} 
            className={`transform transition-all duration-500 origin-bottom-left hover:-translate-y-4
                ${isFolded ? 'translate-y-2 rotate-12 opacity-60 scale-90' : ''}
                ${idx === 0 ? '-rotate-6' : idx === 1 ? 'z-10 -mt-2' : 'rotate-6'}
            `}
          >
             <CardComponent 
              card={card} 
              hidden={!showCards && (!player.hasSeenCards || player.isBot)} 
              small
              className="shadow-xl"
             />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerSeat;