
import React from 'react';
import { Card as CardType, Suit } from '../types';

interface CardProps {
  card: CardType;
  hidden?: boolean;
  className?: string;
  small?: boolean;
}

const CardComponent: React.FC<CardProps> = ({ card, hidden, className = '', small }) => {
  const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds;

  // Base dimensions
  const sizeClasses = small 
    ? 'w-8 h-12 text-xs' 
    : 'w-14 h-20 md:w-20 md:h-28';

  return (
    <div 
      className={`relative ${sizeClasses} ${className}`}
      style={{ perspective: '1000px' }}
    >
      <div 
        className={`w-full h-full transition-transform duration-700`}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: hidden ? 'rotateY(0deg)' : 'rotateY(180deg)' 
        }}
      >
        
        {/* --- Card Back --- */}
        <div 
          className="absolute inset-0 w-full h-full bg-blue-900 border-2 border-white/20 rounded-lg shadow-lg flex items-center justify-center overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20"></div>
          <div className="w-full h-full bg-gradient-to-br from-blue-800 to-blue-950 border-4 border-white/10 m-1 rounded"></div>
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-8 h-8 rounded-full border-2 border-white"></div>
          </div>
        </div>

        {/* --- Card Front --- */}
        <div 
          className={`absolute inset-0 w-full h-full bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col items-center justify-between p-1 select-none`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
            <>
                {/* Top Left Corner */}
                <div className={`w-full text-left font-bold leading-none ${isRed ? 'text-red-600' : 'text-black'} ${small ? 'text-[10px]' : 'text-sm md:text-lg'}`}>
                    {card.label}
                    <div className="text-[0.6em]">{card.suit}</div>
                </div>
                
                {/* Center Suit */}
                <div className={`absolute inset-0 flex items-center justify-center ${small ? 'text-lg' : 'text-2xl md:text-4xl'} ${isRed ? 'text-red-600' : 'text-black'}`}>
                    {card.suit}
                </div>

                {/* Bottom Right Corner (Rotated) */}
                <div className={`w-full text-right font-bold leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-black'} ${small ? 'text-[10px]' : 'text-sm md:text-lg'}`}>
                    {card.label}
                    <div className="text-[0.6em]">{card.suit}</div>
                </div>
            </>
        </div>

      </div>
    </div>
  );
};

export default CardComponent;
