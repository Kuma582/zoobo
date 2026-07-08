import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Gem, Settings, Bomb, ShieldAlert, Zap, CircleDollarSign } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { fetchGameSettings } from '../../api/client';

interface TreasureBombGameProps {
  onBack: () => void;
}

type GameState = 'IDLE' | 'PLAYING' | 'ENDED';
type TileState = 'HIDDEN' | 'SAFE' | 'BOMB';

const GRID_SIZE = 16;
const BOMB_COUNTS = [1, 3, 5, 10];
const CHIPS = [10, 50, 100, 500, 1000];

const TreasureBombGame = ({ onBack }: TreasureBombGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [gameState, setGameState] = useState<GameState>('IDLE');
  
  // Settings
  const [betAmount, setBetAmount] = useState(50);
  const [bombCount, setBombCount] = useState(3);
  
  // Game Board
  const [bombIndices, setBombIndices] = useState<Set<number>>(new Set());
  const [revealedTiles, setRevealedTiles] = useState<Set<number>>(new Set());
  const [multiplier, setMultiplier] = useState(1.00);
  const [nextMultiplier, setNextMultiplier] = useState(1.00);
  const [winAmount, setWinAmount] = useState(0);

  // Shake effect on loss
  const [shake, setShake] = useState(false);

  // Global Win Percentage
  const [winPercentage, setWinPercentage] = useState(50);

  useEffect(() => {
    fetchGameSettings().then(res => {
      if (res && res.winPercentage) {
        setWinPercentage(res.winPercentage);
      }
    }).catch(e => console.error("Failed to fetch win percentage:", e));
  }, []);

  const calculateMultiplier = (revealed: number, bombs: number) => {
    // Math formula to approximate true odds
    // Multiplier = (Total Combos) / (Safe Combos) * (1 - House Edge)
    // We will use a simplified curve for demonstration
    const safeTiles = GRID_SIZE - bombs;
    if (revealed === 0) return 1.00;
    
    let prob = 1.0;
    for (let i = 0; i < revealed; i++) {
      prob *= (safeTiles - i) / (GRID_SIZE - i);
    }
    
    return Number((0.95 / prob).toFixed(2));
  };

  const updateMultipliers = (currentRevealed: number) => {
    setMultiplier(calculateMultiplier(currentRevealed, bombCount));
    setNextMultiplier(calculateMultiplier(currentRevealed + 1, bombCount));
  };

  const startGame = () => {
    if (balance < betAmount) {
      alert("Insufficient balance!");
      return;
    }
    
    if (deductMoney(betAmount, 'Treasure Bombs Bet')) {
      // Generate Bombs
      const newBombs = new Set<number>();
      while (newBombs.size < bombCount) {
        newBombs.add(Math.floor(Math.random() * GRID_SIZE));
      }
      
      setBombIndices(newBombs);
      setRevealedTiles(new Set());
      setMultiplier(1.00);
      updateMultipliers(0);
      setWinAmount(0);
      setGameState('PLAYING');
    }
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'PLAYING' || revealedTiles.has(index)) return;

    if (bombIndices.has(index)) {
      // Secret Admin Win Percentage Logic (Second Chance)
      // If winPercentage > 50, user has a chance to survive the bomb
      let surviveChance = 0;
      if (winPercentage > 50) {
        surviveChance = (winPercentage - 50) / 100; // up to 50% chance to survive
      }

      if (Math.random() < surviveChance) {
        // Miraculously survive! Move the bomb to an unrevealed, non-bomb tile
        const newBombs = new Set(bombIndices);
        newBombs.delete(index);
        
        let availableTiles = [];
        for(let i=0; i<GRID_SIZE; i++) {
          if (!revealedTiles.has(i) && !newBombs.has(i) && i !== index) {
            availableTiles.push(i);
          }
        }
        
        if (availableTiles.length > 0) {
          const replacement = availableTiles[Math.floor(Math.random() * availableTiles.length)];
          newBombs.add(replacement);
          setBombIndices(newBombs);
          
          // Proceed as SAFE
          const newRevealed = new Set(revealedTiles).add(index);
          setRevealedTiles(newRevealed);
          updateMultipliers(newRevealed.size);
          
          if (newRevealed.size === GRID_SIZE - bombCount) {
            handleCashOut(newRevealed.size);
          }
          return;
        }
      }

      // LOSE
      const newRevealed = new Set(revealedTiles).add(index);
      setRevealedTiles(newRevealed);
      setShake(true);
      setGameState('ENDED');
      // Reveal everything
      const allTiles = new Set(Array.from({length: GRID_SIZE}, (_, i) => i));
      setRevealedTiles(allTiles);
      
      setTimeout(() => setShake(false), 500);
    } else {
      // SAFE
      const newRevealed = new Set(revealedTiles).add(index);
      setRevealedTiles(newRevealed);
      updateMultipliers(newRevealed.size);
      
      // Check if won completely
      if (newRevealed.size === GRID_SIZE - bombCount) {
        handleCashOut(newRevealed.size);
      }
    }
  };

  const handleCashOut = (revealedCount = revealedTiles.size) => {
    if (gameState !== 'PLAYING' || revealedCount === 0) return;
    
    const finalMult = calculateMultiplier(revealedCount, bombCount);
    const won = Number((betAmount * finalMult).toFixed(2));
    
    setWinAmount(won);
    addMoney(won, `Treasure Bombs Win (x${finalMult})`);
    
    setGameState('ENDED');
    // Reveal everything
    const allTiles = new Set(Array.from({length: GRID_SIZE}, (_, i) => i));
    setRevealedTiles(allTiles);
  };

  return (
    <div className={`fixed inset-0 z-50 bg-[#0A0A0A] font-sans flex text-white overflow-hidden justify-center ${shake ? 'animate-bounce' : ''}`}>
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#111] relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(255,215,0,0.05)] border-x border-white/5">
        
        {/* Cinematic Lighting Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-[#FFD700]/10 to-transparent" />
          <div className="absolute bottom-0 w-full h-[50%] bg-gradient-to-t from-[#B8860B]/10 to-transparent" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay" />
        </div>

        {/* Top Header */}
        <div className="h-16 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md border-b border-white/5 shrink-0 z-20">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#FFD700]" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Wallet Balance</span>
            <span className="font-black text-lg text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              ₹{balance.toLocaleString()}
            </span>
          </div>
          
          <button className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center z-10 px-4 py-4 min-h-0 overflow-y-auto scrollbar-hide">
          
          {/* Multiplier Display HUD */}
          <div className="w-full flex justify-between items-end mb-6 px-2">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Current</span>
              <div className={`text-4xl font-black drop-shadow-[0_0_15px_rgba(0,0,0,1)] ${gameState === 'PLAYING' ? 'text-green-400' : 'text-gray-300'}`}>
                {multiplier.toFixed(2)}x
              </div>
            </div>
            
            {gameState === 'PLAYING' && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-yellow-500 font-bold uppercase tracking-widest mb-1 animate-pulse">Next</span>
                <div className="text-2xl font-black text-white/50">
                  {nextMultiplier.toFixed(2)}x
                </div>
              </div>
            )}
          </div>

          {/* Treasure Grid */}
          <div className="w-full aspect-square bg-[#1A1A1A] rounded-[2rem] p-4 border border-[#333] shadow-[inset_0_0_30px_rgba(0,0,0,0.8),0_20px_40px_rgba(0,0,0,0.5)] relative">
            <div className="grid grid-cols-4 gap-3 w-full h-full">
              {Array.from({ length: GRID_SIZE }).map((_, i) => {
                const isRevealed = revealedTiles.has(i);
                const isBomb = bombIndices.has(i);
                
                return (
                  <button
                    key={i}
                    onClick={() => handleTileClick(i)}
                    disabled={gameState !== 'PLAYING' || isRevealed}
                    className={`
                      relative w-full h-full rounded-xl transition-all duration-300 overflow-hidden
                      ${!isRevealed 
                        ? 'bg-gradient-to-br from-[#333] to-[#222] border-2 border-[#444] shadow-[0_5px_15px_rgba(0,0,0,0.5)] hover:border-[#FFD700]/50 active:scale-95' 
                        : isBomb 
                          ? 'bg-red-950/80 border-2 border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.5)]' 
                          : 'bg-green-950/80 border-2 border-green-500 shadow-[inset_0_0_20px_rgba(34,197,94,0.3)]'}
                    `}
                  >
                    {/* Unrevealed Chest Image */}
                    {!isRevealed && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-70">
                         <img src="https://cdn-icons-png.flaticon.com/512/3594/3594165.png" className="w-10 h-10 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" alt="Chest" style={{ filter: 'brightness(0) invert(1) opacity(0.5)' }}/>
                      </div>
                    )}

                    <AnimatePresence>
                      {isRevealed && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", bounce: 0.5 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          {isBomb ? (
                            <div className="relative">
                              <Bomb className="w-10 h-10 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]" />
                              {gameState === 'PLAYING' && ( // Only show explosion if this is the one you clicked to lose
                                <motion.div 
                                  initial={{ scale: 0, opacity: 1 }}
                                  animate={{ scale: 3, opacity: 0 }}
                                  transition={{ duration: 0.5 }}
                                  className="absolute inset-0 bg-red-500 rounded-full"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <Gem className="w-10 h-10 text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]" />
                              <motion.div 
                                initial={{ scale: 0, opacity: 1 }}
                                animate={{ scale: 2, opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 bg-[#FFD700] rounded-full"
                              />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Win Overlay */}
          <AnimatePresence>
            {gameState === 'ENDED' && winAmount > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 backdrop-blur-xl px-10 py-8 rounded-[2rem] border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)] flex flex-col items-center w-5/6 max-w-sm"
              >
                <CircleDollarSign className="w-16 h-16 text-green-400 mb-2 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)] animate-bounce" />
                <div className="text-white font-bold tracking-widest text-sm mb-1 uppercase">Cashed Out</div>
                <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">₹{winAmount}</div>
                <div className="text-green-400 font-bold mt-2 bg-green-500/20 px-4 py-1 rounded-full border border-green-500/30">
                  {multiplier.toFixed(2)}x Multiplier
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Bottom Betting Panel */}
        <div className="bg-[#111] z-20 shrink-0 border-t-2 border-[#333] p-4 rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          
          <div className="flex gap-4 mb-4">
            {/* Bet Amount Input */}
            <div className="flex-1 bg-black/50 p-2 rounded-xl border border-white/5">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 px-1">Bet Amount</div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold pl-2">₹</span>
                <input 
                  type="number" 
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={gameState === 'PLAYING'}
                  className="w-full bg-transparent text-xl font-black text-white outline-none"
                />
              </div>
            </div>

            {/* Bomb Selector */}
            <div className="flex-1 bg-black/50 p-2 rounded-xl border border-white/5">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 px-1">Bombs</div>
              <div className="flex items-center justify-between gap-1 h-[28px]">
                {BOMB_COUNTS.map(count => (
                  <button
                    key={count}
                    onClick={() => setBombCount(count)}
                    disabled={gameState === 'PLAYING'}
                    className={`flex-1 h-full rounded text-xs font-bold transition-colors
                      ${bombCount === count 
                        ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'}
                      ${gameState === 'PLAYING' ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          {gameState === 'PLAYING' ? (
            <button
              onClick={() => handleCashOut()}
              disabled={revealedTiles.size === 0}
              className={`w-full py-4 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-lg
                ${revealedTiles.size > 0 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
              `}
            >
              Cash Out (₹{revealedTiles.size > 0 ? (betAmount * multiplier).toFixed(2) : '0.00'})
            </button>
          ) : (
            <button
              onClick={startGame}
              className="w-full py-4 rounded-xl font-black text-xl tracking-widest uppercase transition-all bg-gradient-to-r from-[#FFD700] to-orange-500 text-black shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:brightness-110 active:scale-95"
            >
              Bet
            </button>
          )}
          
        </div>
        
      </div>
    </div>
  );
};

export default TreasureBombGame;
