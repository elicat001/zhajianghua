
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, PlayerStatus, GamePhase, LogEntry, Card, GameState, P2PMessage, Difficulty, AnalysisResult } from './types';
import { createDeck, shuffleDeck, evaluateHand, compareHands, calculateWinProbability, calculateHandPercentile } from './utils/pokerLogic';
import PlayerSeat from './components/PlayerSeat';
import GameControls from './components/GameControls';
import Dealer from './components/Dealer';
import GameAnalyzer from './components/GameAnalyzer';
import { generateCommentary } from './services/geminiService';
import confetti from 'canvas-confetti';
import { MessageSquareQuote, Copy, Coins, Settings } from 'lucide-react';

// Constants
const ANTE = 10;
const INITIAL_CHIPS = 1000;

const App: React.FC = () => {
  // --- State ---
  // App UI State
  const [roomId, setRoomId] = useState<string>("");
  const [myPlayerId, setMyPlayerId] = useState<number>(0); // 0 is host/me
  const [isHost, setIsHost] = useState(true);
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
  const [geminiComment, setGeminiComment] = useState<string>("Welcome to the high stakes table.");
  
  // Analysis State
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // UI Interaction State
  const [compareMode, setCompareMode] = useState(false);
  const [dealingCard, setDealingCard] = useState<{targetId: number, cardIdx: number} | null>(null);
  const [flyingChip, setFlyingChip] = useState<{fromId: number, amount: number} | null>(null);

  // Refs
  const turnTimeoutRef = useRef<number | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  
  // State Ref (Source of Truth for Event Listeners)
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

  // Keep stateRef updated for broadcast and event listeners
  useEffect(() => {
    try {
      stateRef.current = {
          players, pot, currentBetUnit, dealerIndex, turnIndex, gamePhase, logs, turnCount: 0, roomId
      };
      if (isHost) broadcastState({});
    } catch (e) {
      console.warn("Error in state sync effect:", e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, pot, currentBetUnit, dealerIndex, turnIndex, gamePhase, logs, isHost]);

  // --- Broadcast Channel Setup ---
  useEffect(() => {
    if (!roomId) return;

    let ch: BroadcastChannel | null = null;
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            ch = new BroadcastChannel(`zjh_room_${roomId}`);
            channelRef.current = ch;

            const handleMessage = (event: MessageEvent) => {
              try {
                // Strict check for event data validity
                if (!event || !event.data) return;
                const msg = event.data as P2PMessage;
                
                // Use Ref state to avoid closures
                const currentState = stateRef.current;

                if (isHost) {
                    if (msg.type === 'ACTION') {
                        handlePlayerAction(msg.playerId, msg.action as any, msg.payload);
                    }
                    if (msg.type === 'JOIN') {
                        // Host Logic: Add new player
                        const currentP = [...currentState.players];
                        // Simple logic: Replace the first bot found
                        const botIndex = currentP.findIndex(p => p.isBot && p.id !== 0);
                        
                        if (botIndex !== -1) {
                            const newPlayer = { ...msg.player, id: currentP[botIndex].id, chips: INITIAL_CHIPS };
                            currentP[botIndex] = newPlayer;
                            setPlayers(currentP);
                            addLog(`${msg.player.name} joined the table!`, 'info');
                            
                            // Broadcast immediate update so joiner gets state
                            if (channelRef.current) {
                              const fullState: GameState = { ...currentState, players: currentP };
                              channelRef.current.postMessage({ type: 'STATE_UPDATE', state: fullState });
                            }
                        }
                    }
                } else {
                    if (msg.type === 'STATE_UPDATE') {
                        syncState(msg.state);
                    }
                }
              } catch (e) {
                console.error("Error handling broadcast message:", e);
              }
            };

            ch.onmessage = handleMessage;
        }
    } catch (e) {
        console.warn("BroadcastChannel not supported or failed:", e);
    }

    return () => {
      try {
        if (ch) ch.close();
      } catch(e) {}
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isHost]);

  // --- Initialization ---

  const initializeGame = useCallback((name: string, room: string, host: boolean) => {
    const newPlayers: Player[] = [
        { id: 0, name: name, isBot: false, chips: INITIAL_CHIPS, hand: [], status: PlayerStatus.Waiting, hasSeenCards: false, currentBetAmount: 0, totalInvested: 0 },
        { id: 1, name: "Li Wei", isBot: true, chips: INITIAL_CHIPS, hand: [], status: PlayerStatus.Waiting, hasSeenCards: false, currentBetAmount: 0, totalInvested: 0 },
        { id: 2, name: "Fat Brother", isBot: true, chips: INITIAL_CHIPS, hand: [], status: PlayerStatus.Waiting, hasSeenCards: false, currentBetAmount: 0, totalInvested: 0 },
        { id: 3, name: "Auntie Zhang", isBot: true, chips: INITIAL_CHIPS, hand: [], status: PlayerStatus.Waiting, hasSeenCards: false, currentBetAmount: 0, totalInvested: 0 },
    ];

    setPlayers(newPlayers);
    setRoomId(room);
    setIsHost(host);
    setGamePhase(GamePhase.Idle);
    setLogs([{ id: 'init', text: `Joined Room ${room}`, type: 'info' }]);

    if (!host) {
        setMyPlayerId(1); 
        setTimeout(() => {
            try {
                channelRef.current?.postMessage({ type: 'JOIN', player: { ...newPlayers[0], id: 1 } });
            } catch(e) { console.warn("Failed to send join", e)}
        }, 1000);
    }
  }, []);

  // Auto-Start Effect
  useEffect(() => {
    try {
        const params = new URLSearchParams(window.location.search);
        const roomParam = params.get('room');
        
        if (roomParam) {
            const randomName = `Guest${Math.floor(Math.random()*1000)}`;
            initializeGame(randomName, roomParam, false);
        } else {
            const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            try {
                window.history.replaceState({}, '', `?room=${newRoomId}`);
            } catch (e) {
                // ignore history errors
            }
            initializeGame("Me", newRoomId, true);
        }
    } catch (e) {
        console.error("Auto-start failed:", e);
    }
  }, [initializeGame]);

  const syncState = (newState: GameState) => {
      if (!newState || !newState.players) return;
      try {
        setPlayers(newState.players);
        setPot(newState.pot);
        setDealerIndex(newState.dealerIndex);
        setTurnIndex(newState.turnIndex);
        setGamePhase(newState.gamePhase);
        setLogs(newState.logs || []);
        setCurrentBetUnit(newState.currentBetUnit);
      } catch (e) {
        console.warn("State sync error:", e);
      }
  };

  const broadcastState = (state: Partial<GameState>) => {
      if (!isHost || !channelRef.current) return;
      try {
        // Filter out any non-cloneable data if necessary (Card objects are clean JSON)
        const fullState: GameState = {
            ...stateRef.current,
            ...state
        };
        channelRef.current.postMessage({ type: 'STATE_UPDATE', state: fullState });
      } catch(e) { 
          console.warn("Broadcast failed", e); 
      }
  };

  // --- Game Logic ---

  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-4), { id: Date.now().toString() + Math.random(), text, type }]);
  };

  const safeConfetti = () => {
    try {
        if (typeof confetti === 'undefined' || !confetti) return;
        
        // Explicitly handle potentially undefined module structure or CDN weirdness
        // @ts-ignore
        const confettiFn = confetti.default || confetti;
        if (typeof confettiFn === 'function') {
            confettiFn({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
        }
    } catch (e) {
        console.warn("Confetti failed to load or run", e);
    }
  };

  // --- Analyzer Logic ---
  const runAnalysis = useCallback(() => {
    try {
        const me = players.find(p => p.id === myPlayerId);
        if (!me || !me.hasSeenCards || me.status !== PlayerStatus.Playing || !me.hand || me.hand.length !== 3) {
            setAnalysisData(null);
            return;
        }

        setIsAnalyzing(true);
        
        // Run in next tick to allow UI to show loading state if we wanted, 
        // though for small simulations it's fast enough to be synchronous.
        setTimeout(() => {
            try {
                const activeOpponents = players.filter(p => p.id !== myPlayerId && p.status === PlayerStatus.Playing).length;
                const winRate = calculateWinProbability(me.hand, activeOpponents);
                const handStrength = calculateHandPercentile(me.hand);
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
                    handName: handEval.name
                });
            } catch (e) {
                console.warn("Analysis failed", e);
            } finally {
                setIsAnalyzing(false);
            }
        }, 100);
    } catch (e) {
        console.warn("Analysis setup failed", e);
        setIsAnalyzing(false);
    }
  }, [players, myPlayerId]);

  // Trigger analysis when player sees cards or opponent count changes
  useEffect(() => {
      const me = players.find(p => p.id === myPlayerId);
      if (me && me.hasSeenCards && gamePhase === GamePhase.Betting) {
          runAnalysis();
      } else {
          setAnalysisData(null);
      }
  }, [players, myPlayerId, gamePhase, runAnalysis]);


  const startNewRound = async () => {
    if (!isHost) return; 

    try {
        const currentPlayers = stateRef.current.players;
        if (!currentPlayers || currentPlayers.length === 0) return;
        
        // Reset Players
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
        setGamePhase(GamePhase.Dealing);
        setAnalysisData(null); // Clear analysis
        
        const newDeck = shuffleDeck(createDeck());
        if (!newDeck || newDeck.length === 0) {
            console.error("Deck creation failed");
            return;
        }
        setDeck(newDeck);

        // Dealing Animation
        const dealQueue: {pid: number, card: Card}[] = [];
        // 3 cards per player
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

        // Execute Animation
        for (let i = 0; i < dealQueue.length; i++) {
            const { pid, card } = dealQueue[i];
            setDealingCard({ targetId: pid, cardIdx: Math.floor(i / activePlayers.length) });
            
            await new Promise(r => setTimeout(r, 150)); 
            
            setPlayers(prev => prev.map(p => {
                if (p.id === pid) {
                    return { ...p, hand: [...(p.hand || []), card].filter(c => c) };
                }
                return p;
            }));
            setDealingCard(null);
        }

        // Post-Deal Setup
        const playingCount = activePlayers.filter(p => p.status === PlayerStatus.Playing).length;
        const startPot = playingCount * ANTE;
        
        setPlayers(prev => prev.map(p => p.status === PlayerStatus.Playing ? { ...p, chips: p.chips - ANTE, totalInvested: ANTE, currentBetAmount: ANTE } : p));
        setPot(startPot);
        setCurrentBetUnit(ANTE);
        setDealerIndex((prev) => (prev + 1) % activePlayers.length);
        setTurnIndex((dealerIndex + 1) % activePlayers.length);
        setGamePhase(GamePhase.Betting);
        addLog("Dealing complete. Pot open.", 'info');
        setGeminiComment("Let the chips fall where they may!");
        
        updateCommentary("Game started. Cards dealt.", undefined, stateRef.current.players);
    } catch (e) {
        console.error("Error in startNewRound:", e);
    }
  };

  const handlePlayerAction = (pId: number, action: 'Fold' | 'Call' | 'Raise' | 'Compare' | 'Look', targetId?: number) => {
    if (!isHost) {
        try {
            channelRef.current?.postMessage({ type: 'ACTION', playerId: pId, action, payload: targetId });
        } catch (e) { console.warn("Failed to send action", e); }
        return;
    }

    try {
        const currentState = stateRef.current;
        const currentPlayersList = currentState.players;
        
        if (!currentPlayersList || currentPlayersList.length === 0) return;

        const playerIndex = currentPlayersList.findIndex(p => p.id === pId);
        if (playerIndex === -1) return;

        const newPlayers = [...currentPlayersList];
        const currentPlayer = { ...newPlayers[playerIndex] }; // Copy
        newPlayers[playerIndex] = currentPlayer;

        let actionDesc = "";
        let currentPot = currentState.pot;
        let betUnit = currentState.currentBetUnit;
        
        // Betting Logic
        const myCostFactor = currentPlayer.hasSeenCards ? 2 : 1;
        const unitCost = betUnit * myCostFactor;

        newPlayers.forEach(p => p.actionFeedback = undefined);

        if (action === 'Look') {
            currentPlayer.hasSeenCards = true;
            currentPlayer.actionFeedback = "👀 Look";
            setPlayers(newPlayers);
            addLog(`${currentPlayer.name} checked their cards.`, 'action');
            return; 
        }

        if (action === 'Fold') {
            currentPlayer.status = PlayerStatus.Folded;
            currentPlayer.actionFeedback = "❌ Fold";
            actionDesc = `${currentPlayer.name} folds.`;
        } 
        else if (action === 'Call') {
            if (currentPlayer.chips < unitCost) {
                currentPlayer.status = PlayerStatus.Lost;
                actionDesc = `${currentPlayer.name} is broke!`;
            } else {
                currentPlayer.chips -= unitCost;
                currentPlayer.totalInvested += unitCost;
                currentPlayer.currentBetAmount = unitCost;
                currentPot += unitCost;
                currentPlayer.actionFeedback = "✅ Call";
                setFlyingChip({ fromId: pId, amount: unitCost });
                actionDesc = `${currentPlayer.name} calls ${unitCost}.`;
            }
        }
        else if (action === 'Raise') {
            const newUnit = betUnit * 2;
            betUnit = newUnit; 
            setCurrentBetUnit(newUnit); 

            const raiseCost = newUnit * myCostFactor;
            
            if (currentPlayer.chips < raiseCost) {
                currentPlayer.chips -= unitCost;
                currentPlayer.totalInvested += unitCost;
                currentPot += unitCost;
                currentPlayer.actionFeedback = "✅ Call";
                setFlyingChip({ fromId: pId, amount: unitCost });
                actionDesc = `${currentPlayer.name} tried to raise but couldn't afford it.`;
            } else {
                currentPlayer.chips -= raiseCost;
                currentPlayer.totalInvested += raiseCost;
                currentPot += raiseCost;
                currentPlayer.actionFeedback = "🚀 Raise";
                setFlyingChip({ fromId: pId, amount: raiseCost });
                actionDesc = `${currentPlayer.name} raises unit to ${newUnit}!`;
            }
        }
        else if (action === 'Compare') {
            const compareCost = unitCost * 2; 
            if (currentPlayer.chips < compareCost) {
                currentPlayer.status = PlayerStatus.Folded;
                actionDesc = `${currentPlayer.name} folded (cannot afford compare).`;
            } else {
                currentPlayer.chips -= compareCost;
                currentPlayer.totalInvested += compareCost;
                currentPot += compareCost;
                setFlyingChip({ fromId: pId, amount: compareCost });

                const target = newPlayers.find(p => p.id === targetId);
                if (target) {
                const iWin = compareHands(currentPlayer.hand, target.hand);
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
        updateCommentary(actionDesc);
        setTimeout(() => setFlyingChip(null), 800);

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
    } catch (e) {
        console.error("Error in handlePlayerAction", e);
    }
  };

  const handleWin = (winner: Player, currentPlayers: Player[], finalPot: number) => {
    try {
        setGamePhase(GamePhase.Showdown);
        setAnalysisData(null); // Stop analysis
        const finalPlayers = currentPlayers.map(p => {
            if (p.id === winner.id) {
                return { ...p, chips: p.chips + finalPot, status: PlayerStatus.Won };
            }
            return p;
        });
        setPlayers(finalPlayers);
        setPot(0);
        safeConfetti();
        addLog(`${winner.name} WINS THE POT!`, 'win');
        updateCommentary("Game Over. Winner declared.", winner);
    } catch (e) {
        console.error("Error handling win:", e);
    }
  };

  const updateCommentary = async (action: string, winner?: Player, activePlayers?: Player[]) => {
      try {
        const pList = activePlayers || stateRef.current.players;
        const readyToComment = pList && pList.length > 0;
        
        if (readyToComment) {
            generateCommentary(pList, action, winner).then(comment => {
                if (comment) setGeminiComment(comment);
            }).catch(e => console.warn("Commentary failed", e));
        }
      } catch (e) {
          console.warn("Update commentary wrapper failed", e);
      }
  };

  // --- AI Turn ---
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
                
                // --- Difficulty Logic ---
                
                // 1. Decide whether to look at cards
                let lookThreshold = 0.85; // Probability of NOT looking (playing blind)
                if (difficulty === Difficulty.Easy) lookThreshold = 0.5; // Looks frequently
                if (difficulty === Difficulty.Hard) lookThreshold = 0.9; // Plays blind aggressively

                if (!latestPlayer.hasSeenCards && rng > lookThreshold) {
                    handlePlayerAction(latestPlayer.id, 'Look');
                    return; 
                }

                // 2. Strategy based on difficulty
                let action: 'Fold' | 'Call' | 'Raise' | 'Compare' = 'Fold';
                let targetId: number | undefined = undefined;
                
                const score = handStrength.score;
                const validTargets = stateRef.current.players.filter(p => p.id !== latestPlayer.id && p.status === PlayerStatus.Playing);
                
                // --- Easy Strategy: Passive, calls too much, folds rare, raises only on nuts ---
                if (difficulty === Difficulty.Easy) {
                     if (score > 200000) { // Pair+
                         action = rng > 0.7 ? 'Raise' : 'Call';
                     } else if (score > 100500) { // Decent high card
                         action = rng > 0.4 ? 'Call' : 'Fold';
                     } else {
                         // Weak hand, but calls often (fishy behavior)
                         action = rng > 0.6 ? 'Call' : 'Fold';
                     }
                } 
                // --- Hard Strategy: Aggressive, bluffs, plays blind ---
                else if (difficulty === Difficulty.Hard) {
                    // If playing blind, be aggressive
                    if (!latestPlayer.hasSeenCards) {
                         if (rng > 0.6) action = 'Raise';
                         else action = 'Call';
                    } else {
                        if (score > 200000) { // Pair+
                            action = 'Raise'; // Always value bet
                        } else if (score > 100800) { // Good high card
                            // Mix raise (semi-bluff) and call
                            action = rng > 0.5 ? 'Raise' : 'Call';
                        } else {
                            // Weak hand
                            if (rng > 0.8) action = 'Raise'; // Pure bluff
                            else if (rng > 0.6 && validTargets.length > 0) action = 'Compare'; // Aggressive check
                            else action = 'Fold';
                        }
                    }
                } 
                // --- Medium Strategy (Balanced) ---
                else {
                    if (score > 202000) { 
                        action = rng > 0.7 ? 'Raise' : 'Call';
                    } else if (score > 100500) { 
                        if (rng > 0.4) action = 'Call';
                        else if (rng > 0.8 && validTargets.length > 0) action = 'Compare';
                        else action = 'Fold';
                    } else {
                        if (rng > 0.9) action = 'Raise'; // Rare bluff
                        else action = 'Fold';
                    }
                }

                // Execute Action
                if (action === 'Compare') {
                    if (validTargets.length > 0) {
                        targetId = validTargets[Math.floor(Math.random() * validTargets.length)].id;
                        handlePlayerAction(latestPlayer.id, 'Compare', targetId);
                    } else {
                        handlePlayerAction(latestPlayer.id, 'Call'); // Fallback
                    }
                } else {
                    handlePlayerAction(latestPlayer.id, action);
                }

            } catch (e) {
                console.error("AI logic error:", e);
            }
        }, delay);
        }
    } catch(e) { console.error("Effect Error", e); }
    
    return () => { 
        if (turnTimeoutRef.current) window.clearTimeout(turnTimeoutRef.current); 
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnIndex, gamePhase, players, isHost, difficulty]);


  // --- Render ---

  const myPlayer = players.find(p => p.id === myPlayerId) || players[0];
  
  if (!myPlayer) return <div className="w-full h-screen bg-black text-white flex items-center justify-center">Loading Table...</div>;

  const isMyTurn = turnIndex === myPlayerId && gamePhase === GamePhase.Betting && myPlayer.status === PlayerStatus.Playing;
  const myCost = currentBetUnit * (myPlayer?.hasSeenCards ? 2 : 1);
  const activeOpponents = players.filter(p => p.id !== myPlayerId && p.status === PlayerStatus.Playing);

  return (
    <div className="w-full h-screen bg-slate-950 overflow-hidden relative flex flex-col font-sans select-none">
      
      {/* Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-green-950 to-black opacity-90"></div>
      
      {/* Invite, Room Info & Settings */}
      <div className="absolute top-4 left-4 z-50 flex gap-2 items-center">
         <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-full text-xs text-gray-300 border border-white/10 flex items-center gap-2">
            <span>Room: <span className="text-yellow-400 font-mono">{roomId}</span></span>
         </div>
         <button 
           onClick={() => {
               navigator.clipboard.writeText(window.location.href);
               addLog("Link copied to clipboard!");
           }}
           className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg transition-transform active:scale-90"
           title="Copy Invite Link"
         >
            <Copy size={14} />
         </button>

         {isHost && (
             <div className="ml-2 flex items-center bg-black/40 backdrop-blur rounded-full px-2 border border-white/10">
                <Settings size={14} className="text-gray-400 mr-2" />
                <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="bg-transparent text-xs text-yellow-400 font-bold py-2 focus:outline-none cursor-pointer"
                >
                    <option value={Difficulty.Easy}>Easy Bot</option>
                    <option value={Difficulty.Medium}>Medium Bot</option>
                    <option value={Difficulty.Hard}>Hard Bot</option>
                </select>
             </div>
         )}
      </div>

      {/* AI Analyzer (Left Side) */}
      <GameAnalyzer 
          analysis={analysisData} 
          isLoading={isAnalyzing} 
          visible={myPlayer.status === PlayerStatus.Playing}
      />

      {/* Commentary & Logs */}
      <div className="absolute top-4 right-4 z-40 flex flex-col items-end max-w-[250px] md:max-w-sm pointer-events-none">
         <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 mb-2 pointer-events-auto transform transition-all hover:scale-105">
            <div className="flex gap-2">
                <MessageSquareQuote className="text-yellow-400 shrink-0" size={20} />
                <p className="text-sm text-gray-200 italic leading-tight">"{geminiComment}"</p>
            </div>
         </div>
         <div className="w-full bg-black/30 rounded-xl p-2 h-32 overflow-hidden flex flex-col-reverse gap-1">
            {logs.slice(-5).reverse().map(log => (
                <div key={log.id} className={`text-[10px] px-2 py-0.5 rounded ${
                    log.type === 'win' ? 'bg-yellow-900/50 text-yellow-200' :
                    log.type === 'action' ? 'bg-blue-900/30 text-blue-100' : 'text-gray-400'
                }`}>
                    {log.text}
                </div>
            ))}
         </div>
      </div>

      {/* Dealer */}
      <Dealer message={gamePhase === GamePhase.Dealing ? "Dealing..." : undefined} />

      {/* Table Area */}
      <div className="relative flex-grow flex items-center justify-center perspective-[1200px]">
        
        {/* Table Felt */}
        <div className="relative w-[95vw] aspect-[1.6/1] md:w-[900px] md:h-[550px] bg-[#1a4c28] rounded-[200px] shadow-[0_20px_50px_rgba(0,0,0,0.9)] border-[16px] border-[#3d2b1f] flex items-center justify-center ring-1 ring-white/10">
           
           {/* Inner Felt Texture */}
           <div className="absolute inset-0 rounded-[180px] bg-[radial-gradient(circle,_rgba(255,255,255,0.05)_0%,_rgba(0,0,0,0.3)_100%)]"></div>
           <div className="absolute inset-8 border-2 border-yellow-400/10 rounded-[160px]"></div>
           
           {/* Center Pot */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-0">
              <div className="text-yellow-500/20 font-black text-6xl tracking-widest select-none pointer-events-none">ZJH</div>
              {pot > 0 && (
                  <div className="mt-4 bg-black/40 px-6 py-2 rounded-full border border-yellow-500/30 flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.2)] animate-bounce-slow">
                      <Coins className="text-yellow-400" size={24} />
                      <span className="text-2xl font-mono text-yellow-100 font-bold">{pot}</span>
                  </div>
              )}
           </div>

           {/* Players */}
           {players.map((p) => {
               // Calculate visual position based on My ID
               const offset = myPlayerId;
               const relativePos = (p.id - offset + 4) % 4;
               let posName: 'bottom' | 'right' | 'top' | 'left' = 'bottom';
               if (relativePos === 1) posName = 'right';
               if (relativePos === 2) posName = 'top';
               if (relativePos === 3) posName = 'left';

               return (
                   <PlayerSeat 
                    key={p.id} 
                    player={p} 
                    isDealer={dealerIndex === p.id} 
                    isActive={turnIndex === p.id && gamePhase !== GamePhase.Idle && gamePhase !== GamePhase.Showdown} 
                    position={posName}
                    isWinner={p.status === PlayerStatus.Won}
                    showCards={gamePhase === GamePhase.Showdown}
                   />
               )
           })}

           {/* Animations Layer */}
           {/* Flying Card */}
           {dealingCard && (
               <div 
                 className="absolute top-0 left-1/2 w-10 h-14 bg-blue-600 border border-white rounded shadow-xl z-50 transition-all duration-200 ease-out"
                 style={{
                     // Rough physics for flying card
                     transform: `translate(${
                         dealingCard.targetId === myPlayerId ? '0px, 200px' : 
                         (dealingCard.targetId - myPlayerId + 4) % 4 === 1 ? '350px, 0px' :
                         (dealingCard.targetId - myPlayerId + 4) % 4 === 2 ? '0px, -200px' : '-350px, 0px'
                     })`
                 }}
               ></div>
           )}

           {/* Flying Chips */}
           {flyingChip && (
               <div 
                 className="absolute w-6 h-6 bg-yellow-500 rounded-full border-2 border-dashed border-yellow-200 shadow-lg z-50 animate-ping"
                 style={{
                     left: '50%', top: '50%',
                 }}
               ></div>
           )}

           {/* Compare Overlay */}
           {compareMode && (
             <div className="absolute inset-0 bg-black/70 z-50 rounded-[180px] flex flex-col items-center justify-center animate-in fade-in">
                <h2 className="text-2xl font-bold text-white mb-8 animate-pulse">CHOOSE OPPONENT</h2>
                <div className="flex gap-4">
                    {activeOpponents.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => { setCompareMode(false); handlePlayerAction(myPlayerId, 'Compare', p.id); }}
                            className="w-24 h-24 rounded-full bg-red-600 hover:bg-red-500 border-4 border-white shadow-[0_0_20px_red] flex flex-col items-center justify-center transform hover:scale-110 transition-all"
                        >
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.name)}`} className="w-12 h-12 rounded-full mb-1" alt={p.name} />
                            <span className="text-xs font-bold text-white bg-black/50 px-2 rounded">{p.name}</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => setCompareMode(false)} className="mt-8 text-gray-400 hover:text-white underline">Cancel</button>
             </div>
           )}

        </div>
      </div>

      {/* Controls */}
      <GameControls
        gamePhase={gamePhase}
        isMyTurn={isMyTurn}
        hasSeen={myPlayer.hasSeenCards}
        canLook={!myPlayer.hasSeenCards}
        canCompare={activeOpponents.length > 0 && myPlayer.chips >= myCost * 2}
        costToCall={myCost}
        currentBet={currentBetUnit}
        onFold={() => handlePlayerAction(myPlayerId, 'Fold')}
        onLook={() => handlePlayerAction(myPlayerId, 'Look')}
        onCall={() => handlePlayerAction(myPlayerId, 'Call')}
        onRaise={() => handlePlayerAction(myPlayerId, 'Raise')}
        onCompare={() => {
            if (activeOpponents.length === 1) handlePlayerAction(myPlayerId, 'Compare', activeOpponents[0].id);
            else setCompareMode(true);
        }}
        onNextRound={startNewRound}
      />

    </div>
  );
};

export default App;
