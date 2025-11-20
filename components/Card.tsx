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

  if (hidden) {
    return (
      <div 
        className={`relative bg-blue-900 border-2 border-white/20 rounded-lg shadow-lg 
        ${small ? 'w-8 h-12' : 'w-14 h-20 md:w-20 md:h-28'} 
        flex items-center justify-center overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20"></div>
        <div className="w-full h-full bg-gradient-to-br from-blue-800 to-blue-950 border-4 border-white/10 m-1 rounded"></div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-white border border-gray-300 rounded-lg shadow-lg 
      ${small ? 'w-8 h-12 text-xs' : 'w-14 h-20 md:w-20 md:h-28'} 
      flex flex-col items-center justify-between p-1 select-none ${className}`}
    >
      <div className={`w-full text-left font-bold leading-none ${isRed ? 'text-red-600' : 'text-black'} ${small ? 'text-[10px]' : 'text-sm md:text-lg'}`}>
        {card.label}
        <div className="text-[0.6em]">{card.suit}</div>
      </div>
      
      <div className={`absolute inset-0 flex items-center justify-center ${small ? 'text-lg' : 'text-2xl md:text-4xl'} ${isRed ? 'text-red-600' : 'text-black'}`}>
        {card.suit}
      </div>

      <div className={`w-full text-right font-bold leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-black'} ${small ? 'text-[10px]' : 'text-sm md:text-lg'}`}>
        {card.label}
        <div className="text-[0.6em]">{card.suit}</div>
      </div>
    </div>
  );
};

export default CardComponent;