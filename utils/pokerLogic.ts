
import { Card, HandRank, HandResult, Suit } from '../types';

const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const RANK_LABELS: Record<number, string> = {
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
  16: 'JOKER',
  17: 'JOKER'
};

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  const suits = [Suit.Spades, Suit.Hearts, Suit.Clubs, Suit.Diamonds];

  for (const suit of suits) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        label: RANK_LABELS[rank] || String(rank),
      });
    }
  }
  return deck;
};

// Dou Di Zhu Deck: 52 cards + 2 Jokers
export const createDDZDeck = (): Card[] => {
  const deck = createDeck();
  
  // Add Black Joker (Small)
  deck.push({
    suit: Suit.Joker,
    rank: 16,
    label: 'S', // Small
  });

  // Add Red Joker (Big)
  deck.push({
    suit: Suit.Joker,
    rank: 17,
    label: 'B', // Big
  });

  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  if (!deck || !Array.isArray(deck)) return [];
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// Sort for DDZ (Descending rank)
export const sortDDZHand = (hand: Card[]): Card[] => {
    return [...hand].sort((a, b) => b.rank - a.rank);
};

export const evaluateHand = (hand: Card[]): HandResult => {
  try {
      // Safety check for empty, null, or incomplete hands
      if (!hand || !Array.isArray(hand)) {
        return { type: HandRank.HighCard, score: 0, name: 'Dealing...' };
      }

      // Robust filter for valid card objects
      const validCards = hand.filter(c => 
          c && 
          typeof c === 'object' && 
          (c.suit || c.suit === Suit.Joker) && 
          typeof c.rank === 'number'
      );

      if (validCards.length < 3) {
        return { type: HandRank.HighCard, score: 0, name: 'Dealing...' };
      }

      // Sort by rank descending
      const sorted = [...validCards].sort((a, b) => (b.rank || 0) - (a.rank || 0));
      const ranks = sorted.map((c) => c.rank);
      const suits = sorted.map((c) => c.suit);

      // Safety check if mapping failed
      if (ranks.some(r => r === undefined) || suits.some(s => s === undefined)) {
          return { type: HandRank.HighCard, score: 0, name: 'Error' };
      }

      const isFlush = suits.every((s) => s === suits[0]);
      
      // Check Straight
      let isStraight = false;
      if (ranks[0] === ranks[1] + 1 && ranks[1] === ranks[2] + 1) {
        isStraight = true;
      }
      // Special case: A-3-2 (14, 3, 2)
      if (ranks[0] === 14 && ranks[1] === 3 && ranks[2] === 2) {
          isStraight = true; 
      }

      const isTrips = ranks[0] === ranks[1] && ranks[1] === ranks[2];
      const isPair = ranks[0] === ranks[1] || ranks[1] === ranks[2]; 

      // Calculate tie-breaker value
      const val = (ranks[0] || 0) * 256 + (ranks[1] || 0) * 16 + (ranks[2] || 0);

      if (isTrips) {
        return { type: HandRank.Leopard, score: 600000 + val, name: 'Leopard (Bao Zi)' };
      }
      if (isFlush && isStraight) {
        return { type: HandRank.StraightFlush, score: 500000 + val, name: 'Straight Flush' };
      }
      if (isFlush) {
        return { type: HandRank.Flush, score: 400000 + val, name: 'Flush' };
      }
      if (isStraight) {
        return { type: HandRank.Straight, score: 300000 + val, name: 'Straight' };
      }
      if (isPair) {
        let pairRank = 0;
        let kicker = 0;
        if (ranks[0] === ranks[1]) { pairRank = ranks[0]; kicker = ranks[2]; }
        else { pairRank = ranks[1]; kicker = ranks[0]; }
        
        const pairVal = pairRank * 4096 + kicker;
        return { type: HandRank.Pair, score: 200000 + pairVal, name: 'Pair' };
      }

      return { type: HandRank.HighCard, score: 100000 + val, name: 'High Card' };
  } catch (e) {
      console.error("Error evaluating hand", e);
      return { type: HandRank.HighCard, score: 0, name: 'Error' };
  }
};

export const compareHands = (hand1: Card[], hand2: Card[]): boolean => {
  try {
    const r1 = evaluateHand(hand1);
    const r2 = evaluateHand(hand2);
    return r1.score > r2.score;
  } catch (e) {
    console.error("Error comparing hands:", e);
    return false; // Default to losing if error occurs
  }
};

export const calculateWinProbability = (
  heroHand: Card[], 
  opponentCount: number, 
  iterations = 800, 
  excludeCards: Card[] = []
): number => {
  if (!heroHand || heroHand.length !== 3 || opponentCount <= 0) return 0;
  const heroResult = evaluateHand(heroHand);
  const heroScore = heroResult.score;
  const fullDeck = createDeck();
  
  const heroCardKeys = new Set(heroHand.map(c => `${c.rank}-${c.suit}`));
  const excludeKeys = new Set(excludeCards.map(c => `${c.rank}-${c.suit}`));

  // Remove hero's cards and any other known cards (e.g. revealed in PK)
  const remainingDeck = fullDeck.filter(c => 
    !heroCardKeys.has(`${c.rank}-${c.suit}`) && 
    !excludeKeys.has(`${c.rank}-${c.suit}`)
  );

  let wins = 0;

  for (let i = 0; i < iterations; i++) {
    const simDeck = [...remainingDeck];
    // Fisher-Yates Shuffle partial deck
    for (let k = simDeck.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [simDeck[k], simDeck[j]] = [simDeck[j], simDeck[k]];
    }

    // Check if deck has enough cards to deal to all opponents
    if (simDeck.length < opponentCount * 3) break;

    let heroWinsThisRound = true;
    for (let opp = 0; opp < opponentCount; opp++) {
        const oppHand = [simDeck[opp*3], simDeck[opp*3+1], simDeck[opp*3+2]];
        const oppScore = evaluateHand(oppHand).score;
        if (oppScore > heroScore) {
            heroWinsThisRound = false;
            break; 
        }
    }
    if (heroWinsThisRound) {
        wins++;
    }
  }
  return wins / iterations;
};

export const calculateHandPercentile = (hand: Card[], excludeCards: Card[] = []): number => {
    return calculateWinProbability(hand, 1, 500, excludeCards);
};
