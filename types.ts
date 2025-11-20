
export enum Suit {
  Spades = '♠',
  Hearts = '♥',
  Clubs = '♣',
  Diamonds = '♦',
  Joker = 'JOKER' // Added for Dou Di Zhu
}

export interface Card {
  suit: Suit;
  rank: number; // 2-14 (Ace), 16 (Black Joker), 17 (Red Joker)
  label: string;
}

export enum HandRank {
  HighCard = 1,
  Pair = 2,
  Straight = 3,
  Flush = 4,
  StraightFlush = 5,
  Leopard = 6, // Triplet
}

export interface HandResult {
  type: HandRank;
  score: number; // For tie-breaking
  name: string;
}

export enum PlayerStatus {
  Waiting = 'Waiting',
  Playing = 'Playing',
  Folded = 'Folded',
  Lost = 'Lost', // Eliminated via comparison
  Won = 'Won',
}

export interface Player {
  id: number; 
  name: string;
  isBot: boolean;
  chips: number;
  hand: Card[]; 
  status: PlayerStatus;
  hasSeenCards: boolean;
  currentBetAmount: number; 
  totalInvested: number; 
  actionFeedback?: string; 
  avatarId?: number;
  isLandlord?: boolean; // DDZ specific
}

export enum GamePhase {
  Lobby = 'Lobby',
  Idle = 'Idle',
  Dealing = 'Dealing',
  Betting = 'Betting',
  Showdown = 'Showdown',
  Bidding = 'Bidding', // DDZ specific
  Playing = 'Playing'  // DDZ specific
}

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard'
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'action' | 'win';
}

export interface AnalysisResult {
  winRate: number; 
  handStrength: number; 
  advice: 'Fold' | 'Call' | 'Raise' | 'Caution';
  handName: string;
}

// Multiplayer Types
export interface GameState {
  players: Player[];
  pot: number;
  currentBetUnit: number;
  dealerIndex: number;
  turnIndex: number;
  gamePhase: GamePhase;
  logs: LogEntry[];
  turnCount: number;
  roomId: string;
  winnerId?: number;
}

export type P2PMessage = 
  | { type: 'JOIN'; player: Player }
  | { type: 'STATE_UPDATE'; state: GameState }
  | { type: 'ACTION'; playerId: number; action: string; payload?: any };

export enum GameMode {
  Menu = 'Menu',
  ZhaJinHua = 'ZhaJinHua',
  DouDiZhu = 'DouDiZhu'
}
