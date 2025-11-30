
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, PlayerStatus, GamePhase, LogEntry, Card, GameState, P2PMessage, Difficulty, AnalysisResult } from '../types';
import { createDeck, shuffleDeck, evaluateHand, compareHands, calculateWinProbability, calculateHandPercentile } from '../utils/pokerLogic';
import PlayerSeat from './PlayerSeat';
import GameControls from './GameControls';
import Dealer from './Dealer';
import GameAnalyzer from './GameAnalyzer';
// @ts-ignore
import * as confetti from 'canvas-confetti';
import { Copy, Coins, Settings, LogOut } from 'lucide-react';

// Constants
const ANTE = 10;
const INITIAL_CHIPS = 1000;

interface ZhaJinHuaGameProps {
    playerName: string;
    roomId: string;
    isHost: boolean;
    onExit: () => void;
}

const ZhaJinHuaGame: React.FC<ZhaJinHuaGameProps> = ({ playerName, roomId, isHost, onExit }) => {
  // --- State ---
  // If host, I am 0. If guest, I am waiting for ID (-1).
  const [myPlayerId, setMyPlayerId] = useState<number>(isHost ? 0 : -1); 
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Medium);
  
  // Game State
  const [deck, setDeck] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [pot, setPot] = useState(0);
  const [currentBetUnit, setCurrentBetUnit] = useState(ANTE);
  const [dealerIndex, setDealerIndex] = useState(0);
  const [turnIndex, setTurnIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.Lobby);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Analysis State
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [knownCards, setKnownCards] = useState<Card[]>([]);

  // UI Interaction State
  const [compareMode, setCompareMode] = useState(false);
  const [dealingCard, setDealingCard] = useState<{targetId: number, cardIdx: number} | null>(null);
  
  // Animation States
  const [flyingChips, setFlyingChips] = useState<{id: number, fromId: number, toPot: boolean, amount: number}[]>([]);
  const [winningChips, setWinningChips] = useState<{winnerId: number, amount: number} | null>(null);

  // Refs
  const turnTimeoutRef = useRef<number | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  
  // Keep a ref to state for P2P sync and async operations
  const stateRef = useRef<GameState>({
    players: [],
    pot: 0,
    currentBetUnit: ANTE,
    dealerIndex: 0,
    turnIndex: 0,
    gamePhase: GamePhase.Lobby,
    logs: [],
    turnCount: 0,
    roomId: ""
  });

  // Update ref when state changes
  useEffect(() => {
    stateRef.current = {
        players, pot, currentBetUnit, dealerIndex, turnIndex, gamePhase, logs, turnCount: 0, roomId
    };
    if (isHost) broadcastState({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, pot, currentBetUnit, dealerIndex, turnIndex, gamePhase, logs, isHost]);

  // --- Initialization ---
  useEffect(() => {
    // Only Host initializes the game state with Bots
    if (isHost) {
        const initialPlayers: Player[] = [
            { id: 0, name: playerName, isBot: false, chips: INITIAL_CHIPS, hand: [], status: PlayerStatus.Waiting, hasSeenCards: false, currentBetAmount: 0, totalInvested: 0, avatarId: 1 },
            { id: 1, name: "Li Wei", isBot: true, chips: INITIAL_CHIPS, hand: [], status: PlayerStatus.Waiting, hasSeenCards: false, currentBetAmount: 0, totalInvested: 0, avatarId: 2 },
            { id: 2, name: "Fat Brother", isBot: true, chips: INITIAL_CHIPS, hand: [], status: PlayerStatus.Waiting, hasSeenCards: false, currentBetAmount: 0, totalInvested: 0, avatarId: 3 },
            { id: 3, name: "Auntie Zhang", isBot: true, chips: INITIAL_CHIPS, hand: [], status: PlayerStatus.Waiting, hasSeenCards: false, currentBetAmount: 0, totalInvested: 0, avatarId: 4 },
        ];
        setPlayers(initialPlayers);
        setGamePhase(GamePhase.Idle);
        setLogs([{ id: 'init', text: `Room Created: ${roomId}`, type: 'info' }]);
    } else {
        // Guest starts empty and waits for sync
        setLogs([{ id: 'init', text: `Joining Room ${roomId}...`, type: 'info' }]);
    }
  }, [isHost, playerName, roomId]);

  // --- BroadcastChannel & Networking ---
  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            ch = new BroadcastChannel(`zjh_room_${roomId}`);
            channelRef.current = ch;
            
            // If Guest, send Join Request immediately
            if (!isHost) {
                setTimeout(() => {
                    ch?.postMessage({ type: 'JOIN_REQUEST', name: playerName });
                }, 500);
            }

            const handleMessage = (event: MessageEvent) => {
              try {
                if (!event || !event.data) return;
                const msg = event.data as P2PMessage;
                const currentState = stateRef.current;

                if (isHost) {
                    // --- Host Logic ---
                    if (msg.type === 'ACTION') {
                        handlePlayerAction(msg.playerId, msg.action as any, msg.payload);
                    }
                    else if (msg.type === 'JOIN_REQUEST') {
                        // Find a bot to replace
                        const currentP = [...currentState.players];
                        // Look for a bot (id > 0)
                        const botIndex = currentP.findIndex(p => p.isBot && p.id !== 0);
                        
                        if (botIndex !== -1) {
                            const newPlayerId = currentP[botIndex].id;
                            const newPlayer: Player = { 
                                ...currentP[botIndex], 
                                name: msg.name, 
                                isBot: false, 
                                chips: INITIAL_CHIPS, // Reset chips for new player
                                avatarId: Math.floor(Math.random() * 20) + 5
                            };
                            currentP[botIndex] = newPlayer;
                            setPlayers(currentP);
                            addLog(`${msg.name} joined!`, 'info');
                            
                            // Broadcast immediately so guest knows they are in
                            setTimeout(() => {
                                if (channelRef.current) {
                                  const fullState: GameState = { ...currentState, players: currentP };
                                  channelRef.current.postMessage({ type: 'STATE_UPDATE', state: fullState });
                                }
                            }, 100);
                        } else {
                            // Table full logic could go here
                        }
                    }
                } else {
                    // --- Guest Logic ---
                    if (msg.type === 'STATE_UPDATE') {
                        syncState(msg.state);
                    }
                }
              } catch (e) { console.error("Broadcast msg error:", e); }
            };
            ch.onmessage = handleMessage;
        }
    } catch (e) { console.warn("BC failed:", e); }
    return () => {
      try { if (ch) ch.close(); } catch(e) {}
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isHost, playerName]);

  // Guest: Check if I've been assigned an ID in the new state
  useEffect(() => {
    if (!isHost && myPlayerId === -1 && players.length > 0) {
        // Simple check: Look for my name. 
        // In a real app, we'd use a unique session ID in the JOIN_REQUEST to prevent name collision issues.
        const me = players.find(p => p.name === playerName && !p.isBot);
        if (me) {
            setMyPlayerId(me.id);
            addLog(`Joined as ${me.name}`, 'info');
        }
    }
  }, [players, isHost, myPlayerId, playerName]);


  const syncState = (newState: GameState) => {
      if (!newState || !newState.players) return;
      try {
        setPlayers(newState.players);
        setPot(newState.pot);
        setDealerIndex(newState.dealerIndex);
        setTurnIndex(newState.turnIndex);
        setGamePhase(newState.gamePhase);
        // Merge logs simply
        if (newState.logs && newState.logs.length > 0) {
            const lastLog = newState.logs[newState.logs.length-1];
            setLogs(prev => {
                if (prev.length > 0 && prev[prev.length-1].id === lastLog.id) return prev;
                return newState.logs;
            });
        }
        setCurrentBetUnit(newState.currentBetUnit);
      } catch (e) {}
  };

  const broadcastState = (state: Partial<GameState>) => {
      if (!isHost || !channelRef.current) return;
      try {
        const fullState: GameState = { ...stateRef.current, ...state };
        channelRef.current.postMessage({ type: 'STATE_UPDATE', state: fullState });
      } catch(e) {}
  };

  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-4), { id: Date.now().toString() + Math.random(), text, type }]);
  };

  const safeConfetti = () => {
    try {
        // Robust confetti access
        // @ts-ignore
        const C = confetti.default || confetti || window.confetti;
        if (typeof C === 'function') {
            C({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
        }
    } catch (e) { console.warn("Confetti error", e); }
  };

  const triggerChipAnimation = (fromId: number, amount: number) => {
    const id = Date.now();
    setFlyingChips(prev => [...prev, { id, fromId, toPot: true, amount }]);
    setTimeout(() => { setFlyingChips(prev => prev.filter(chip => chip.id !== id)); }, 600); 
  };

  const runAnalysis = useCallback(() => {
    try {
        const me = players.find(p => p.id === myPlayerId);
        if (!me || !me.hasSeenCards || me.status !== PlayerStatus.Playing || !me.hand || me.hand.length !== 3) {
            setAnalysisData(null);
            return;
        }
        setIsAnalyzing(true);
        setTimeout(() => {
            try {
                const activeOpponents = players.filter(p => p.id !== myPlayerId && p.status === PlayerStatus.Playing).length;
                const winRate = calculateWinProbability(me.hand, activeOpponents, 800, knownCards); 
                const handStrength = calculateHandPercentile(me.hand, knownCards);
                const handEval = evaluateHand(me.hand);
                
                let advice: AnalysisResult['advice'] = 'Fold';
                if (winRate > 0.7) advice = 'Raise';
                else if (winRate > 0.4) advice = 'Call';
                else if (winRate > 0.2 && activeOpponents <= 1) advice = 'Caution';
                else advice = 'Fold';

                setAnalysisData({ 
                    winRate, 
                    handStrength, 
                    advice, 
                    handName: handEval.name,
                    knownCardsCount: knownCards.length 
                });
            } catch (e) { console.warn("Analysis failed", e); } finally { setIsAnalyzing(false); }
        }, 100);
    } catch (e) { setIsAnalyzing(false); }
  }, [players, myPlayerId, knownCards]);

  useEffect(() => {
      const me = players.find(p => p.id === myPlayerId);
      if (me && me.hasSeenCards && gamePhase === GamePhase.Betting) { runAnalysis(); } else { setAnalysisData(null); }
  }, [players, myPlayerId, gamePhase, runAnalysis, knownCards]);

  const startNewRound = async () => {
    if (!isHost) return; 
    try {
        const currentPlayers = stateRef.current.players;
        if (!currentPlayers || currentPlayers.length === 0) return;
        const activePlayers = currentPlayers.map(p => ({
          ...p,
          hand: [],
          status: p.chips >= ANTE ? PlayerStatus.Playing : PlayerStatus.Lost,
          hasSeenCards: false,
          currentBetAmount: 0,
          totalInvested: 0,
          actionFeedback: undefined
        }));
        if (activePlayers.length === 0) return;
        setPlayers(activePlayers);
        setPot(0);
        setKnownCards([]);
        setWinningChips(null);
        setGamePhase(GamePhase.Dealing);
        setAnalysisData(null); 
        const newDeck = shuffleDeck(createDeck());
        setDeck(newDeck);

        const dealQueue: {pid: number, card: Card}[] = [];
        for (let round = 0; round < 3; round++) {
            for (let i = 0; i < activePlayers.length; i++) {
                const pIdx = (dealerIndex + 1 + i) % activePlayers.length;
                const playerToDeal = activePlayers[pIdx];
                if (playerToDeal && playerToDeal.status === PlayerStatus.Playing) {
                    const card = newDeck.pop();
                    if (card) dealQueue.push({ pid: playerToDeal.id, card });
                }
            }
        }
        for (let i = 0; i < dealQueue.length; i++) {
            const { pid, card } = dealQueue[i];
            setDealingCard({ targetId: pid, cardIdx: Math.floor(i / activePlayers.length) });
            await new Promise(r => setTimeout(r, 100));
            setPlayers(prev => prev.map(p => {
                if (p.id === pid) { return { ...p, hand: [...(p.hand || []), card].filter(c => c) }; }
                return p;
            }));
            setDealingCard(null);
        }
        const playingCount = activePlayers.filter(p => p.status === PlayerStatus.Playing).length;
        const startPot = playingCount * ANTE;
        activePlayers.forEach(p => {
            if (p.status === PlayerStatus.Playing) triggerChipAnimation(p.id, ANTE);
        });
        setPlayers(prev => prev.map(p => p.status === PlayerStatus.Playing ? { ...p, chips: p.chips - ANTE, totalInvested: ANTE, currentBetAmount: ANTE } : p));
        setPot(startPot);
        setCurrentBetUnit(ANTE);
        setDealerIndex((prev) => (prev + 1) % activePlayers.length);
        setTurnIndex((dealerIndex + 1) % activePlayers.length);
        setGamePhase(GamePhase.Betting);
        addLog("Dealing complete.", 'info');
    } catch (e) { console.error("Error in startNewRound:", e); }
  };

  const handlePlayerAction = (pId: number, action: 'Fold' | 'Call' | 'Raise' | 'Compare' | 'Look', targetId?: number) => {
    if (!isHost) {
        try { channelRef.current?.postMessage({ type: 'ACTION', playerId: pId, action, payload: targetId }); } catch (e) {}
        return;
    }
    try {
        const currentState = stateRef.current;
        const currentPlayersList = currentState.players;
        const playerIndex = currentPlayersList.findIndex(p => p.id === pId);
        if (playerIndex === -1) return;

        const newPlayers = [...currentPlayersList];
        const currentPlayer = { ...newPlayers[playerIndex] };
        newPlayers[playerIndex] = currentPlayer;

        let actionDesc = "";
        let currentPot = currentState.pot;
        let betUnit = currentState.currentBetUnit;
        const myCostFactor = currentPlayer.hasSeenCards ? 2 : 1;
        const unitCost = betUnit * myCostFactor;

        newPlayers.forEach(p => p.actionFeedback = undefined);

        if (action === 'Look') {
            currentPlayer.hasSeenCards = true;
            currentPlayer.actionFeedback = "👀 Look";
            setPlayers(newPlayers);
            addLog(`${currentPlayer.name} checked cards.`, 'action');
            return; 
        }

        if (action === 'Fold') {
            currentPlayer.status = PlayerStatus.Folded;
            currentPlayer.actionFeedback = "❌ Fold";
            actionDesc = `${currentPlayer.name} folds.`;
        } else if (action === 'Call') {
            if (currentPlayer.chips < unitCost) {
                currentPlayer.status = PlayerStatus.Lost;
                actionDesc = `${currentPlayer.name} is broke!`;
            } else {
                currentPlayer.chips -= unitCost;
                currentPlayer.totalInvested += unitCost;
                currentPlayer.currentBetAmount = unitCost;
                currentPot += unitCost;
                currentPlayer.actionFeedback = "✅ Call";
                triggerChipAnimation(pId, unitCost);
                actionDesc = `${currentPlayer.name} calls ${unitCost}.`;
            }
        } else if (action === 'Raise') {
            const newUnit = betUnit * 2;
            betUnit = newUnit; 
            setCurrentBetUnit(newUnit); 
            const raiseCost = newUnit * myCostFactor;
            if (currentPlayer.chips < raiseCost) {
                currentPlayer.chips -= unitCost;
                currentPlayer.totalInvested += unitCost;
                currentPot += unitCost;
                currentPlayer.actionFeedback = "✅ Call";
                triggerChipAnimation(pId, unitCost);
                actionDesc = `${currentPlayer.name} call (couldn't raise).`;
            } else {
                currentPlayer.chips -= raiseCost;
                currentPlayer.totalInvested += raiseCost;
                currentPot += raiseCost;
                currentPlayer.actionFeedback = "🚀 Raise";
                triggerChipAnimation(pId, raiseCost);
                actionDesc = `${currentPlayer.name} raises to ${newUnit}!`;
            }
        } else if (action === 'Compare') {
            const compareCost = unitCost * 2; 
            if (currentPlayer.chips < compareCost) {
                currentPlayer.status = PlayerStatus.Folded;
                actionDesc = `${currentPlayer.name} folded.`;
            } else {
                currentPlayer.chips -= compareCost;
                currentPlayer.totalInvested += compareCost;
                currentPot += compareCost;
                triggerChipAnimation(pId, compareCost);
                const target = newPlayers.find(p => p.id === targetId);
                if (target) {
                    const iWin = compareHands(currentPlayer.hand, target.hand);
                    setKnownCards(prev => [...prev, ...currentPlayer.hand, ...target.hand]);
                    if (iWin) {
                        target.status = PlayerStatus.Lost;
                        target.actionFeedback = "💀 Lost PK";
                        currentPlayer.actionFeedback = "⚔️ Won PK";
                        actionDesc = `${currentPlayer.name} defeats ${target.name}!`;
                    } else {
                        currentPlayer.status = PlayerStatus.Lost;
                        currentPlayer.actionFeedback = "💀 Lost PK";
                        target.actionFeedback = "⚔️ Won PK";
                        actionDesc = `${currentPlayer.name} lost to ${target.name}!`;
                    }
                }
            }
        }
        setPlayers(newPlayers);
        setPot(currentPot);
        addLog(actionDesc, 'action');

        const remaining = newPlayers.filter(p => p.status === PlayerStatus.Playing);
        if (remaining.length === 1) {
            handleWin(remaining[0], newPlayers, currentPot);
            return;
        }
        let nextTurn = (currentState.turnIndex + 1) % newPlayers.length;
        let loops = 0;
        while ((newPlayers[nextTurn].status !== PlayerStatus.Playing) && loops < 10) {
            nextTurn = (nextTurn + 1) % newPlayers.length;
            loops++;
        }
        setTurnIndex(nextTurn);
    } catch (e) { console.error("Error in handlePlayerAction", e); }
  };

  const handleWin = (winner: Player, currentPlayers: Player[], finalPot: number) => {
    try {
        setGamePhase(GamePhase.Showdown);
        setAnalysisData(null); 
        setWinningChips({ winnerId: winner.id, amount: finalPot });
        setTimeout(() => {
            const finalPlayers = currentPlayers.map(p => {
                if (p.id === winner.id) return { ...p, chips: p.chips + finalPot, status: PlayerStatus.Won };
                return p;
            });
            setPlayers(finalPlayers);
            setPot(0);
            safeConfetti();
            addLog(`${winner.name} WINS!`, 'win');
        }, 600);
    } catch (e) {}
  };

  // AI Turn logic
  useEffect(() => {
    if (!isHost) return;
    try {
        const currentPlayer = players[turnIndex];
        if (gamePhase === GamePhase.Betting && currentPlayer?.isBot && currentPlayer.status === PlayerStatus.Playing) {
        const delay = Math.random() * 1500 + 1000;
        turnTimeoutRef.current = window.setTimeout(() => {
            try {
                const latestPlayer = stateRef.current.players.find(p => p.id === currentPlayer.id);
                if (!latestPlayer || latestPlayer.status !== PlayerStatus.Playing) return;
                const handStrength = evaluateHand(latestPlayer.hand);
                const rng = Math.random();
                let lookThreshold = difficulty === Difficulty.Easy ? 0.5 : difficulty === Difficulty.Hard ? 0.9 : 0.85;
                if (!latestPlayer.hasSeenCards && rng > lookThreshold) {
                    handlePlayerAction(latestPlayer.id, 'Look');
                    return; 
                }
                let action: 'Fold' | 'Call' | 'Raise' | 'Compare' = 'Fold';
                let targetId: number | undefined = undefined;
                const score = handStrength.score;
                const validTargets = stateRef.current.players.filter(p => p.id !== latestPlayer.id && p.status === PlayerStatus.Playing);
                if (difficulty === Difficulty.Easy) {
                     action = score > 100500 ? (rng > 0.4 ? 'Call' : 'Fold') : (rng > 0.6 ? 'Call' : 'Fold');
                } else {
                    if (score > 200000) action = 'Raise';
                    else if (score > 100500) {
                        if (rng > 0.9 && validTargets.length > 0) action = 'Compare';
                        else action = rng > 0.4 ? 'Call' : 'Fold';
                    } else action = rng > 0.8 ? 'Raise' : 'Fold';
                }
                if (action === 'Compare') {
                    if (validTargets.length > 0) {
                        targetId = validTargets[Math.floor(Math.random() * validTargets.length)].id;
                        handlePlayerAction(latestPlayer.id, 'Compare', targetId);
                    } else { handlePlayerAction(latestPlayer.id, 'Call'); }
                } else { handlePlayerAction(latestPlayer.id, action); }
            } catch (e) {}
        }, delay);
        }
    } catch(e) {}
    return () => { if (turnTimeoutRef.current) window.clearTimeout(turnTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnIndex, gamePhase, players, isHost, difficulty]);

  const getPositionOffsets = (pid: number) => {
      // If I'm a guest and haven't sat down yet (id=-1), show default view
      const myId = myPlayerId === -1 ? 0 : myPlayerId;
      const relativePos = (pid - myId + 4) % 4;
      const isMobile = window.innerWidth < 768;
      const yOffset = isMobile ? 140 : 220;
      const xOffset = isMobile ? 160 : 380;
      if (relativePos === 0) return [0, yOffset];
      if (relativePos === 1) return [xOffset, 0];
      if (relativePos === 2) return [0, -yOffset];
      if (relativePos === 3) return [-xOffset, 0];
      return [0,0];
  };

  const myPlayer = players.find(p => p.id === myPlayerId) || players[0];
  // Wait for sync if Guest
  if (!myPlayer && !isHost && players.length === 0) return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-950 text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <div>Waiting for host to accept...</div>
            <button onClick={onExit} className="text-sm text-red-400 underline">Cancel</button>
          </div>
      </div>
  );

  const isMyTurn = turnIndex === myPlayerId && gamePhase === GamePhase.Betting && myPlayer?.status === PlayerStatus.Playing;
  const myCost = currentBetUnit * (myPlayer?.hasSeenCards ? 2 : 1);
  const activeOpponents = players.filter(p => p.id !== myPlayerId && p.status === PlayerStatus.Playing);

  return (
    <div className="w-full h-[100dvh] bg-slate-950 overflow-hidden relative flex flex-col font-sans select-none">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-green-950 to-black opacity-90"></div>
      
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-50 flex flex-col md:flex-row gap-2 md:items-center">
         <div className="flex gap-2">
            <button onClick={onExit} className="bg-red-900/50 hover:bg-red-800 text-white p-1 md:p-2 rounded-full border border-red-500/30 mr-2">
                <LogOut size={12} className="md:w-3.5 md:h-3.5" />
            </button>
            <div className="bg-black/40 backdrop-blur px-3 py-1 rounded-full text-[10px] md:text-xs text-gray-300 border border-white/10 flex items-center gap-1">
                <span>Room: <span className="text-yellow-400 font-mono">{roomId}</span></span>
            </div>
            <button 
            onClick={() => { 
                const url = new URL(window.location.href);
                url.searchParams.set('room', roomId);
                navigator.clipboard.writeText(url.toString()); 
                addLog("Link copied!"); 
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white p-1 md:p-2 rounded-full shadow-lg"
            >
                <Copy size={12} className="md:w-3.5 md:h-3.5" />
            </button>
         </div>
         {isHost && (
             <div className="flex items-center bg-black/40 backdrop-blur rounded-full px-2 border border-white/10 w-fit">
                <Settings size={12} className="text-gray-400 mr-2" />
                <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="bg-transparent text-[10px] md:text-xs text-yellow-400 font-bold py-1 focus:outline-none cursor-pointer"
                >
                    <option value={Difficulty.Easy}>Easy</option>
                    <option value={Difficulty.Medium}>Medium</option>
                    <option value={Difficulty.Hard}>Hard</option>
                </select>
             </div>
         )}
      </div>

      <GameAnalyzer analysis={analysisData} isLoading={isAnalyzing} visible={myPlayer?.status === PlayerStatus.Playing} />

      <div className="absolute top-2 right-2 md:top-4 md:right-4 z-40 flex flex-col items-end max-w-[120px] md:max-w-[200px] pointer-events-none">
         <div className="w-full bg-black/30 rounded-xl p-1.5 md:p-2 h-24 md:h-32 overflow-hidden flex flex-col-reverse gap-1 pointer-events-auto border border-white/5">
            {logs.slice(-5).reverse().map(log => (
                <div key={log.id} className={`text-[9px] md:text-[10px] px-1 py-0.5 rounded ${log.type === 'win' ? 'bg-yellow-900/50 text-yellow-200' : log.type === 'action' ? 'bg-blue-900/30 text-blue-100' : 'text-gray-400'}`}>
                    {log.text}
                </div>
            ))}
         </div>
      </div>

      <Dealer message={gamePhase === GamePhase.Dealing ? "Dealing..." : undefined} />

      <div className="relative flex-grow flex items-center justify-center perspective-[1200px]">
        <div className="relative w-[95vw] aspect-[1.2/1] md:aspect-[1.6/1] md:w-[900px] md:h-[550px] bg-[#1a4c28] rounded-[100px] md:rounded-[200px] shadow-[0_10px_30px_rgba(0,0,0,0.9)] border-[8px] md:border-[16px] border-[#3d2b1f] flex items-center justify-center ring-1 ring-white/10 transition-all duration-300">
           <div className="absolute inset-0 rounded-[90px] md:rounded-[180px] bg-[radial-gradient(circle,_rgba(255,255,255,0.05)_0%,_rgba(0,0,0,0.3)_100%)]"></div>
           <div className="absolute inset-4 md:inset-8 border-2 border-yellow-400/10 rounded-[80px] md:rounded-[160px]"></div>
           
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-0">
              <div className="text-yellow-500/20 font-black text-4xl md:text-6xl tracking-widest select-none pointer-events-none">ZJH</div>
              {pot > 0 && (
                  <div className="mt-2 md:mt-4 bg-black/40 px-4 py-1 md:px-6 md:py-2 rounded-full border border-yellow-500/30 flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.2)] animate-bounce-slow">
                      <Coins className="text-yellow-400 w-4 h-4 md:w-6 md:h-6" />
                      <span className="text-lg md:text-2xl font-mono text-yellow-100 font-