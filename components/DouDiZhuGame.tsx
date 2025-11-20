
import React, { useState, useEffect } from 'react';
import { Card, Player, PlayerStatus, GamePhase, Suit } from '../types';
import { createDDZDeck, shuffleDeck, sortDDZHand } from '../utils/pokerLogic';
import PlayerSeat from './PlayerSeat';
import { ArrowLeft, PlayCircle } from 'lucide-react';

interface DouDiZhuGameProps {
  onExit: () => void;
}

const DouDiZhuGame: React.FC<DouDiZhuGameProps> = ({ onExit }) => {
  const [players, setPlayers] = useState<Player[]>([
    { id: 0, name: 'Me', isBot: false, chips: 1000, hand: [], status: PlayerStatus.Waiting, hasSeenCards: true, currentBetAmount: 0, totalInvested: 0 },
    { id: 1, name: 'Bot 1', isBot: true, chips: 1000, hand: [], status: PlayerStatus.Waiting, hasSeenCards: true, currentBetAmount: 0, totalInvested: 0 },
    { id: 2, name: 'Bot 2', isBot: true, chips: 1000, hand: [], status: PlayerStatus.Waiting, hasSeenCards: true, currentBetAmount: 0, totalInvested: 0 }
  ]);
  const [landlordCards, setLandlordCards] = useState<Card[]>([]);
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.Idle);
  const [landlordId, setLandlordId] = useState<number | null>(null);

  const startDeal = async () => {
    setGamePhase(GamePhase.Dealing);
    const deck = shuffleDeck(createDDZDeck());
    
    // Reserve 3 cards
    const hiddenCards = deck.splice(0, 3);
    setLandlordCards(hiddenCards);

    // Distribute 17 cards to each (Simulated fast deal)
    const p1Hand = sortDDZHand(deck.splice(0, 17));
    const p2Hand = sortDDZHand(deck.splice(0, 17));
    const p3Hand = sortDDZHand(deck.splice(0, 17));

    await new Promise(r => setTimeout(r, 500)); // Deal delay

    setPlayers(prev => prev.map(p => {
        if (p.id === 0) return { ...p, hand: p1Hand, status: PlayerStatus.Playing };
        if (p.id === 1) return { ...p, hand: p2Hand, status: PlayerStatus.Playing };
        if (p.id === 2) return { ...p, hand: p3Hand, status: PlayerStatus.Playing };
        return p;
    }));

    setGamePhase(GamePhase.Bidding);
  };

  // Simple Bidding Logic (Auto-assign landlord to Player 0 for demo)
  useEffect(() => {
      if (gamePhase === GamePhase.Bidding) {
          setTimeout(() => {
              setLandlordId(0);
              setPlayers(prev => prev.map(p => {
                  if (p.id === 0) {
                      return { ...p, isLandlord: true, hand: sortDDZHand([...p.hand, ...landlordCards]) };
                  }
                  return p;
              }));
              setGamePhase(GamePhase.Playing);
          }, 1500);
      }
  }, [gamePhase, landlordCards]);

  return (
    <div className="w-full h-[100dvh] bg-slate-900 relative overflow-hidden flex flex-col font-sans">
       {/* Header */}
       <div className="absolute top-4 left-4 z-50">
         <button onClick={onExit} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg flex items-center gap-2 px-4">
             <ArrowLeft size={16}/> Exit
         </button>
       </div>

       {/* Table */}
       <div className="flex-grow flex items-center justify-center relative perspective-[1200px]">
         <div className="relative w-[95vw] aspect-[1.6/1] md:w-[900px] bg-[#2c3e50] rounded-[100px] border-[12px] border-[#34495e] shadow-2xl flex flex-col items-center justify-center">
            
            <div className="text-white/10 font-black text-6xl select-none absolute pointer-events-none">DOU DI ZHU</div>

            {/* Landlord Cards Area */}
            <div className="absolute top-16 flex gap-2 bg-black/20 p-2 rounded-lg border border-white/10">
                {landlordCards.length === 0 ? (
                    <div className="text-gray-400 text-xs">HIDDEN CARDS</div>
                ) : (
                    landlordCards.map((c, i) => (
                        // Simple card render for top area
                        <div key={i} className="w-8 h-12 bg-white rounded text-black text-xs flex items-center justify-center border border-gray-400">
                            {c.suit === Suit.Joker ? (c.rank === 17 ? 'R' : 'B') : c.rank}
                        </div>
                    ))
                )}
            </div>

            {/* Players */}
            {players.map(p => {
                let pos: 'bottom' | 'left' | 'right' = 'bottom';
                if (p.id === 1) pos = 'right';
                if (p.id === 2) pos = 'left';
                
                return (
                    <PlayerSeat 
                        key={p.id} 
                        player={p} 
                        isDealer={false} 
                        isActive={false} // Turn logic not implemented yet
                        position={pos as any} 
                        isMe={p.id === 0}
                    />
                );
            })}

            {gamePhase === GamePhase.Idle && (
                 <button onClick={startDeal} className="absolute z-50 bg-blue-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-xl animate-bounce flex items-center gap-2">
                     <PlayCircle /> Start Game
                 </button>
            )}

            {gamePhase === GamePhase.Playing && (
                <div className="absolute bottom-32 text-yellow-400 font-bold bg-black/50 px-4 py-2 rounded-full">
                    Game Started (Logic WIP)
                </div>
            )}

         </div>
       </div>
    </div>
  );
};

export default DouDiZhuGame;
