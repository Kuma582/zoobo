import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Diamond, Bomb, Plus, Minus, Settings, Shield, Info } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface MinesGameProps {
  onBack: () => void;
}

type TileState = 'HIDDEN' | 'GEM' | 'BOMB';

const GRID_SIZE = 25;

const MinesGame = ({ onBack }: MinesGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'ENDED'>('IDLE');
  
  // Game Configuration
  const [betAmount, setBetAmount] = useState<number>(100);
  const [mineCount, setMineCount] = useState<number>(3);
  
  // Grid State
  const [grid, setGrid] = useState<TileState[]>(Array(GRID_SIZE).fill('HIDDEN'));
  const [minesLayout, setMinesLayout] = useState<boolean[]>(Array(GRID_SIZE).fill(false)); // true = mine
  
  // Progress
  const [gemsRevealed, setGemsRevealed] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [nextMultiplier, setNextMultiplier] = useState(1.0);
  const [shake, setShake] = useState(false);

  // Helper to calculate multiplier
  // In a real game, this uses combinations logic. We'll use a simplified approximation for this UI demo.
  const calculateMultiplier = (revealed: number, mines: number) => {
    if (revealed === 0) return 1.0;
    const safeTiles = GRID_SIZE - mines;
    let mult = 1.0;
    for (let i = 0; i < revealed; i++) {
      mult *= (GRID_SIZE - i) / (safeTiles - i);
    }
    return Number((mult * 0.95).toFixed(2)); // 5% house edge built in
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      setCurrentMultiplier(calculateMultiplier(gemsRevealed, mineCount));
      setNextMultiplier(calculateMultiplier(gemsRevealed + 1, mineCount));
    }
  }, [gemsRevealed, mineCount, gameState]);

  const handleBet = () => {
    if (balance < betAmount) {
      alert("Insufficient balance!");
      return;
    }
    
    const success = deductMoney(betAmount, 'Mines Bet');
    if (!success) return;

    // Generate mines
    const layout = Array(GRID_SIZE).fill(false);
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const idx = Math.floor(Math.random() * GRID_SIZE);
      if (!layout[idx]) {
        layout[idx] = true;
        minesPlaced++;
      }
    }
    
    setMinesLayout(layout);
    setGrid(Array(GRID_SIZE).fill('HIDDEN'));
    setGemsRevealed(0);
    setCurrentMultiplier(1.0);
    setGameState('PLAYING');
  };

  const handleCashOut = () => {
    if (gameState !== 'PLAYING' || gemsRevealed === 0) return;
    
    const winAmount = Number((betAmount * currentMultiplier).toFixed(2));
    addMoney(winAmount, `Mines Win (${currentMultiplier}x)`);
    
    // Reveal everything
    const newGrid = grid.map((state, idx) => {
      if (state !== 'HIDDEN') return state;
      return minesLayout[idx] ? 'BOMB' : 'GEM';
    });
    setGrid(newGrid);
    setGameState('ENDED');
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'PLAYING' || grid[index] !== 'HIDDEN') return;

    const newGrid = [...grid];
    if (minesLayout[index]) {
      // BOOM
      newGrid[index] = 'BOMB';
      setGrid(newGrid);
      setGameState('ENDED');
      
      // Screen shake
      setShake(true);
      setTimeout(() => setShake(false), 500);

      // Reveal everything else after a tiny delay
      setTimeout(() => {
        setGrid(prev => prev.map((state, idx) => {
          if (idx === index) return state; // keep clicked bomb
          if (state !== 'HIDDEN') return state;
          return minesLayout[idx] ? 'BOMB' : 'GEM';
        }));
      }, 500);
      
    } else {
      // Safe Gem
      newGrid[index] = 'GEM';
      setGrid(newGrid);
      setGemsRevealed(prev => prev + 1);
      
      // Auto cash out if we found all gems
      if (gemsRevealed + 1 === GRID_SIZE - mineCount) {
        setTimeout(() => {
          const winAmount = Number((betAmount * calculateMultiplier(gemsRevealed + 1, mineCount)).toFixed(2));
          addMoney(winAmount, `Mines Max Win!`);
          setGameState('ENDED');
          setGrid(prev => prev.map((state, idx) => state === 'HIDDEN' ? 'BOMB' : state));
        }, 300);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0E14] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#0F131C] relative shadow-[0_0_50px_rgba(0,255,255,0.05)] overflow-hidden flex flex-col">
        
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#00E676]/10 to-transparent" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#00B0FF]/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        </div>

        {/* Top Header */}
        <div className="h-16 flex items-center justify-between px-4 bg-black/40 backdrop-blur-md border-b border-white/5 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5 text-[#00E676]" />
            </button>
            <div className="font-black text-xl tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-[#00E676] to-[#00B0FF]">
              Mines
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-400 font-bold tracking-wider">BALANCE</span>
              <span className="text-sm font-black text-white">₹{balance.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <button className="p-1.5 text-gray-400 hover:text-white transition-colors"><Shield className="w-4 h-4" /></button>
              <button className="p-1.5 text-gray-400 hover:text-white transition-colors"><Settings className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 relative flex flex-col z-10 px-4 pt-6 pb-2 overflow-y-auto scrollbar-hide">
          
          {/* Multiplier Display */}
          <div className="flex justify-between items-end mb-6 bg-black/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Current Multiplier</span>
              <div className="text-4xl font-black text-[#00E676] drop-shadow-[0_0_15px_rgba(0,230,118,0.4)]">
                {currentMultiplier.toFixed(2)}x
              </div>
            </div>
            {gameState === 'PLAYING' && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Next Gem</span>
                <div className="text-xl font-bold text-[#00B0FF]">
                  {nextMultiplier.toFixed(2)}x
                </div>
              </div>
            )}
          </div>

          {/* Grid Container */}
          <motion.div 
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="w-full aspect-square bg-black/40 rounded-2xl p-3 border border-white/5 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          >
            <div className="grid grid-cols-5 gap-2 h-full">
              {grid.map((tileState, i) => (
                <button
                  key={i}
                  onClick={() => handleTileClick(i)}
                  disabled={gameState !== 'PLAYING' || tileState !== 'HIDDEN'}
                  className={`
                    relative w-full h-full rounded-xl transition-all duration-300 flex items-center justify-center overflow-hidden
                    ${tileState === 'HIDDEN' 
                      ? 'bg-[#1C2331] border border-white/5 shadow-inner hover:bg-[#252E40] cursor-pointer hover:border-white/10 hover:shadow-[0_0_15px_rgba(0,176,255,0.2)]' 
                      : tileState === 'GEM'
                      ? 'bg-[#00E676]/10 border border-[#00E676]/50 shadow-[inset_0_0_20px_rgba(0,230,118,0.2)]'
                      : 'bg-[#FF1744]/20 border border-[#FF1744]/50 shadow-[inset_0_0_20px_rgba(255,23,68,0.3)]'
                    }
                    ${gameState !== 'PLAYING' && tileState === 'HIDDEN' ? 'opacity-50' : 'opacity-100'}
                  `}
                >
                  <AnimatePresence>
                    {tileState === 'GEM' && (
                      <motion.div
                        initial={{ scale: 0, rotate: -45, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        className="relative z-10"
                      >
                        <Diamond className="w-8 h-8 text-[#00E676] fill-[#00E676]/20 drop-shadow-[0_0_10px_rgba(0,230,118,0.8)]" />
                      </motion.div>
                    )}
                    {tileState === 'BOMB' && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [1.2, 1], opacity: 1 }}
                        transition={{ type: "spring" }}
                        className="relative z-10"
                      >
                        <Bomb className="w-8 h-8 text-[#FF1744] fill-[#FF1744]/20 drop-shadow-[0_0_10px_rgba(255,23,68,0.8)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Bottom Betting Controls */}
        <div className="p-4 bg-black/60 backdrop-blur-xl z-20 shrink-0 border-t border-white/5 rounded-t-3xl">
          
          <div className="flex gap-4 mb-4">
            {/* Bet Amount */}
            <div className="flex-1 bg-[#1C2331] rounded-xl p-3 border border-white/5 relative overflow-hidden">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bet Amount</div>
              <div className="flex items-center justify-between bg-black/50 rounded-lg p-1">
                <button 
                  onClick={() => setBetAmount(Math.max(10, betAmount - 10))} 
                  disabled={gameState === 'PLAYING'}
                  className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded text-gray-300 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={gameState === 'PLAYING'}
                  className="w-full bg-transparent text-center font-bold text-lg outline-none disabled:opacity-50"
                />
                <button 
                  onClick={() => setBetAmount(betAmount + 10)} 
                  disabled={gameState === 'PLAYING'}
                  className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded text-gray-300 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mines Count */}
            <div className="flex-1 bg-[#1C2331] rounded-xl p-3 border border-white/5 relative overflow-hidden">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Mines</div>
              <div className="flex items-center justify-between bg-black/50 rounded-lg p-1">
                <button 
                  onClick={() => setMineCount(Math.max(1, mineCount - 1))} 
                  disabled={gameState === 'PLAYING'}
                  className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded text-gray-300 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className={`w-full text-center font-bold text-lg ${gameState === 'PLAYING' ? 'opacity-50' : ''}`}>
                  {mineCount}
                </div>
                <button 
                  onClick={() => setMineCount(Math.min(24, mineCount + 1))} 
                  disabled={gameState === 'PLAYING'}
                  className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded text-gray-300 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Main Action Button */}
          {gameState === 'PLAYING' ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCashOut}
              className={`
                w-full h-16 rounded-xl font-black text-2xl uppercase tracking-wider transition-all flex flex-col items-center justify-center shadow-xl
                ${gemsRevealed > 0 
                  ? 'bg-gradient-to-r from-[#00E676] to-[#00C853] text-black shadow-[0_0_30px_rgba(0,230,118,0.4)] hover:shadow-[0_0_40px_rgba(0,230,118,0.6)] border border-[#00E676]' 
                  : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                }
              `}
              disabled={gemsRevealed === 0}
            >
              {gemsRevealed > 0 ? (
                <>
                  <span className="text-lg leading-tight">CASH OUT</span>
                  <span className="text-sm font-bold opacity-80">₹{(betAmount * currentMultiplier).toFixed(2)}</span>
                </>
              ) : (
                <span className="text-lg leading-tight tracking-widest">PICK A TILE</span>
              )}
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleBet}
              className="w-full h-16 rounded-xl font-black text-2xl uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl bg-gradient-to-r from-[#00B0FF] to-[#2979FF] text-white shadow-[0_0_30px_rgba(0,176,255,0.4)] hover:shadow-[0_0_40px_rgba(0,176,255,0.6)] border border-[#00B0FF]"
            >
              BET
            </motion.button>
          )}

        </div>
        
      </div>
    </div>
  );
};

export default MinesGame;
