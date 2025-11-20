
import { Card, HandRank, HandResult, Suit } from '../types';

const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const RANK_LABELS: Record<number, string> = {
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
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

export const shuffleDeck = (deck: Card[]): Card[] => {
  if (!deck || !Array.isArray(deck)) return [];
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const evaluateHand = (hand: Card[]): HandResult => {
  // Safety check for empty, null, or incomplete hands
  if (!hand || !Array.isArray(hand)) {
    return { type: HandRank.HighCard, score: 0, name: 'Dealing...' };
  }

  // Robust filter for valid card objects
  const validCards = hand.filter(c => 
      c && 
      typeof c === 'object' && 
      c.suit && 
      typeof c.rank === 'number'
  );

  if (validCards.length < 3) {
    return { type: HandRank.HighCard, score: 0, name: 'Dealing...' };
  }

  // Sort by rank descending
  const sorted = [...validCards].sort((a, b) => (b.rank || 0) - (a.rank || 0));
  const ranks = sorted.map((c) => c.rank);
  const suits = sorted.map((c) => c.suit);

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
};

export const compareHands = (hand1: Card[], hand2: Card[]): boolean => {
  try {
    const r1 = evaluateHand(hand1);
    const r2 = evaluateHand(hand2);
    return r1.score > r2.score;
  } catch (e) {
    console.error("Error comparing hands:", e);
    return false;
  }
};
