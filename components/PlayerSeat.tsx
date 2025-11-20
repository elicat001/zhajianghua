
import React from 'react';
import { Player, PlayerStatus } from '../types';
import CardComponent from './Card';
import { Eye } from 'lucide-react';

interface PlayerSeatProps {
  player: Player;
  isActive: boolean;
  isDealer: boolean;
  position: 'bottom' | 'top' | 'left' | 'right';
  isWinner?: boolean;
  showCards?: boolean; // Forced show (e.g. showdown)
  isMe?: boolean;
}

const PlayerSeat: React.FC<PlayerSeatProps> = ({ player, isActive, isDealer, position, isWinner, showCards, isMe }) => {
  const isFolded = player.status === PlayerStatus.Folded;
  const isLost = player.status === PlayerStatus.Lost;

  // Determine if the cards are actually visible to the user (Face Up)
  // This happens if it's a showdown OR if it's "Me" (not a bot) and I have clicked "Look"
  const isRevealed = showCards || (player.hasSeenCards && isMe);

  // Dynamic classes based on position - Adjusted for Mobile
  const positionClasses = {
    bottom: 'bottom-0 md:bottom-4 left-1/2 -translate-x-1/2 translate-y-1/3 md:translate-y-0', // Push bottom player slightly down on mobile to save space
    top: 'top-12 md:top-16 left-1/2 -translate-x-1/2', 
    left: '-left-2 md:left-4 top-1/2 -translate-y-1/2', // Closer to edge on mobile
    right: '-right-2 md:right-4 top-1/2 -translate-y-1/2', // Closer to edge on mobile
  };

  // Avatar Image Source
  // Use avatarId if available, otherwise fallback to name as seed
  const seed = player.avatarId ? `avatar-${player.avatarId}` : player.name;
  
  // Using different collections for Bots vs Humans for clear visual distinction
  const avatarUrl = player.isBot 
    ? `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}`
    : `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;

  // Safe hand access
  const visibleHand = (player.hand || []).filter(c => c !== undefined && c !== null);

  return (
    <div className={`absolute ${positionClasses[position]} flex flex-col items-center transition-all duration-500 z-10`}>
      
      {/* Status Badge / Action Bubble */}
      {player.actionFeedback && (
        <div className="absolute -top-8 md:-top-12 bg-yellow-400 text-black font-bold px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-sm rounded-full shadow-lg animate-bounce z-30 whitespace-nowrap border-2 border-black">
          {player.actionFeedback}
        </div>
      )}

      {/* Dealer Button */}
      {isDealer && (
          <div className="absolute top-0 -right-2 z-20 bg-white text-black text-[10px] font-black w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center border-2 border-gray-400 shadow-md">
            D
          </div>
      )}

      {/* Avatar Section - Smaller on Mobile */}
      <div className={`relative w-12 h-12 md:w-20 md:h-20 rounded-full border-2 md:border-4 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 bg-slate-800
        ${isActive ? 'border-yellow-400 ring-2 md:ring-4 ring-yellow-400/30 scale-110 shadow-[0_0_30px_rgba(250,204,21,0.4)]' : 'border-gray-600'}
        ${isWinner ? 'border-green-400 ring-2 md:ring-4 ring-green-400/60 scale-110 shadow-[0_0_30px_rgba(74,222,128,0.6)]' : ''}
        ${isFolded || isLost ? 'opacity-60 grayscale' : ''}
        transition-all duration-300
      `}>
        <img src={avatarUrl} alt={player.name} className="w-full h-full rounded-full p-0.5 md:p-1" />
        
        {/* Active Pulse Effect */}
        {isActive && (
            <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping opacity-75"></div>
        )}

        {/* Badges */}
        {player.hasSeenCards && !isFolded && !isLost && (
          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center border-2 border-slate-800 z-20 animate-in zoom-in duration-300">
            <Eye size={10} className="md:w-3 md:h-3" />
          </div>
        )}
      </div>

      {/* Info Box - Compact on Mobile */}
      <div className={`mt-8 md:mt-12 absolute top-4 bg-black/80 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-center border min-w-[60px] md:min-w-[80px] shadow-lg transition-colors duration-300 ${isActive ? 'border-yellow-500/50 bg-black/90' : 'border-gray-700'}`}>
        <div className="font-bold text-[10px] md:text-xs text-gray-100 truncate max-w-[70px] md:max-w-[100px]">{player.name}</div>
        <div className="text-yellow-400 text-[10px] md:text-xs font-mono flex items-center justify-center gap-1">
           <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500 border border-yellow-200 shadow-sm"></div>
           {player.chips}
        </div>
      </div>

      {/* Cards Layout */}
      <div 
        className={`flex mt-10 md:mt-14 z-0 h-16 md:h-24 items-center justify-center relative transition-all duration-500 ease-out
          ${isRevealed ? 'space-x-1 md:space-x-2' : '-space-x-4 md:-space-x-8'}
        `}
      >
        {visibleHand.map((card, idx) => {
          // Calculate transforms based on state
          let transformClass = '';
          let zIndexClass = 'z-0';
          
          if (isFolded) {
             // Folded: messily stacked, grayed out
             transformClass = 'translate-y-2 rotate-12 opacity-60 scale-90';
          } else if (isRevealed) {
             // Revealed/Looking: Spread out clearly, minimal rotation
             if (idx === 0) { transformClass = '-rotate-2 translate-y-1'; zIndexClass = 'z-0'; }
             if (idx === 1) { transformClass = '-translate-y-1'; zIndexClass = 'z-10'; } // Center pops up slightly
             if (idx === 2) { transformClass = 'rotate-2 translate-y-1'; zIndexClass = 'z-20'; }
          } else {
             // Hidden/Dealing: Tight fan
             if (idx === 0) { transformClass = '-rotate-12 translate-x-1 md:translate-x-2'; zIndexClass = 'z-0'; }
             if (idx === 1) { transformClass = '-mt-2 md:-mt-4'; zIndexClass = 'z-10'; }
             if (idx === 2) { transformClass = 'rotate-12 -translate-x-1 md:-translate-x-2'; zIndexClass = 'z-20'; }
          }

          return (
            <div 
              key={`${idx}-${card.rank}-${card.suit}`} 
              className={`transform transition-all duration-500 origin-bottom ${transformClass} ${zIndexClass} hover:z-30 hover:-translate-y-2 cursor-default`}
            >
               <CardComponent 
                card={card} 
                hidden={!isRevealed} 
                small
                className="shadow-2xl scale-75 md:scale-100 origin-top" // Scale down cards slightly on mobile
               />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerSeat;
