import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Wallet, Settings, Trophy, History, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface WinGoGameProps {
  onBack: () => void;
}

type GameState = 'BETTING' | 'DRAWING' | 'RESULT';
type ColorPrediction = 'GREEN' | 'VIOLET' | 'RED';
type Prediction = ColorPrediction | number | null;

const CHIPS = [10, 50, 100, 500, 1000];

// Win Go Rules:
// Green: 1, 3, 7, 9 (2x payout), 5 is Violet/Green (1.5x)
// Red: 2, 4, 6, 8 (2x payout), 0 is Violet/Red (1.5x)
// Violet: 0, 5 (4.5x payout)
// Number: 0-9 (9x payout)

const WinGoGame = ({ onBack }: WinGoGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [gameState, setGameState] = useState<GameState>('BETTING');
  const [timeLeft, setTimeLeft] = useState(30);
  const [period, setPeriod] = useState(() => Math.floor(Date.now() / 1000));
  
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction>(null);
  
  const [betAmount, setBetAmount] = useState(0);
  const [activePrediction, setActivePrediction] = useState<Prediction>(null);
  const [winAmount, setWinAmount] = useState(0);
  
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([2, 5, 8, 1, 0, 7, 4, 9, 3]);

  // Game Loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameState === 'BETTING') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('DRAWING');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState === 'DRAWING') {
      // Simulate drawing
      setTimeout(() => {
        const drawnNumber = Math.floor(Math.random() * 10);
        setResultNumber(drawnNumber);
        
        // Evaluate Win
        if (activePrediction !== null && betAmount > 0) {
          let multiplier = 0;
          
          if (typeof activePrediction === 'number') {
            if (drawnNumber === activePrediction) multiplier = 9;
          } else {
            if (activePrediction === 'GREEN') {
              if ([1, 3, 7, 9].includes(drawnNumber)) multiplier = 2;
              if (drawnNumber === 5) multiplier = 1.5;
            } else if (activePrediction === 'RED') {
              if ([2, 4, 6, 8].includes(drawnNumber)) multiplier = 2;
              if (drawnNumber === 0) multiplier = 1.5;
            } else if (activePrediction === 'VIOLET') {
              if ([0, 5].includes(drawnNumber)) multiplier = 4.5;
            }
          }

          if (multiplier > 0) {
            const won = Math.floor(betAmount * multiplier);
            setWinAmount(won);
            addMoney(won, `Neon Win Go Win`);
          }
        }
        
        setHistory(prev => [drawnNumber, ...prev].slice(0, 15));
        setGameState('RESULT');
      }, 3000); // 3 seconds drawing
    } else if (gameState === 'RESULT') {
      timer = setTimeout(() => {
        setBetAmount(0);
        setWinAmount(0);
        setActivePrediction(null);
        setSelectedPrediction(null);
        setResultNumber(null);
        setTimeLeft(30);
        setPeriod(prev => prev + 1);
        setGameState('BETTING');
      }, 5000); // 5s result viewing
    }

    return () => clearInterval(timer);
  }, [gameState]);

  const handleConfirmBet = () => {
    if (gameState !== 'BETTING' || selectedPrediction === null) return;
    if (balance < selectedChip) {
      alert("Insufficient balance!");
      return;
    }
    
    if (activePrediction !== null && activePrediction !== selectedPrediction) {
       alert("You can only place one type of bet per round.");
       return;
    }
    
    if (deductMoney(selectedChip, `Neon Win Go Bet`)) {
      setBetAmount(prev => prev + selectedChip);
      setActivePrediction(selectedPrediction);
    }
  };

  const getColorForNumber = (num: number) => {
    if (num === 0) return 'from-red-500 to-purple-500';
    if (num === 5) return 'from-green-500 to-purple-500';
    if ([1, 3, 7, 9].includes(num)) return 'from-green-400 to-green-600';
    return 'from-red-400 to-red-600';
  };

  const getBorderColorForNumber = (num: number) => {
    if (num === 0 || num === 5) return 'border-purple-500';
    if ([1, 3, 7, 9].includes(num)) return 'border-green-500';
    return 'border-red-500';
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#111] relative flex flex-col shadow-[0_0_50px_rgba(139,92,246,0.1)] border-x border-white/5">
        
        {/* Cinematic Background */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Hexagon Pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
          
          {/* Ambient Glows */}
          <div className="absolute top-[10%] left-[-20%] w-[70%] h-[30%] bg-green-500/10 blur-[100px]" />
          <div className="absolute top-[10%] right-[-20%] w-[70%] h-[30%] bg-red-500/10 blur-[100px]" />
          <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-purple-500/10 blur-[100px]" />
        </div>

        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 bg-black/60 backdrop-blur-md border-b border-white/10 shrink-0 z-20">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <Wallet className="w-3 h-3 text-yellow-500" /> Balance
            </span>
            <span className="text-sm font-black text-white">₹{balance.toLocaleString()}</span>
          </div>
          
          <button className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Main Scrollable Game Area */}
        <div className="flex-1 relative flex flex-col z-10 min-h-0 overflow-y-auto scrollbar-hide pb-32">
          
          {/* Hero Timer & Period */}
          <div className="px-4 py-6 flex justify-between items-center bg-black/30 border-b border-white/5">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-purple-400" /> Period
              </span>
              <span className="text-xl font-mono font-bold text-white tracking-wider">{period}</span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Time Left</span>
              <AnimatePresence mode="wait">
                 {gameState === 'BETTING' ? (
                   <motion.div 
                     key="betting"
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="flex gap-1"
                   >
                     <div className={`w-8 h-10 flex items-center justify-center bg-black rounded border ${timeLeft <= 5 ? 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-white/20 text-white'}`}>
                       <span className="text-2xl font-black">0</span>
                     </div>
                     <div className={`w-8 h-10 flex items-center justify-center bg-black rounded border ${timeLeft <= 5 ? 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-white/20 text-white'}`}>
                       <span className="text-2xl font-black">0</span>
                     </div>
                     <div className="text-2xl font-black self-center pb-1 mx-0.5 animate-pulse">:</div>
                     <div className={`w-8 h-10 flex items-center justify-center bg-black rounded border ${timeLeft <= 5 ? 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-white/20 text-white'}`}>
                       <span className="text-2xl font-black">{Math.floor(timeLeft / 10)}</span>
                     </div>
                     <div className={`w-8 h-10 flex items-center justify-center bg-black rounded border ${timeLeft <= 5 ? 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-white/20 text-white'}`}>
                       <span className="text-2xl font-black">{timeLeft % 10}</span>
                     </div>
                   </motion.div>
                 ) : (
                   <motion.div 
                     key="rolling"
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="h-10 flex items-center justify-center"
                   >
                     <span className="text-xl font-black text-yellow-500 uppercase tracking-widest animate-pulse">
                       {gameState === 'DRAWING' ? 'Drawing...' : 'Result'}
                     </span>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>

          {/* Color Prediction Cards */}
          <div className="px-4 py-4 grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedPrediction('GREEN')}
              disabled={gameState !== 'BETTING'}
              className={`relative flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all overflow-hidden ${selectedPrediction === 'GREEN' ? 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]' : 'border-green-500/30 bg-black/40'} ${gameState !== 'BETTING' ? 'opacity-50' : 'active:scale-95'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-green-500/20 to-transparent" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-2 shadow-[0_0_15px_rgba(74,222,128,0.6)]" />
              <span className="text-sm font-black text-white z-10">Join Green</span>
              
              {activePrediction === 'GREEN' && betAmount > 0 && (
                <div className="absolute top-1 right-1 text-[9px] font-black bg-yellow-500 text-black px-1.5 rounded-sm z-20">₹{betAmount}</div>
              )}
            </button>

            <button
              onClick={() => setSelectedPrediction('VIOLET')}
              disabled={gameState !== 'BETTING'}
              className={`relative flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all overflow-hidden ${selectedPrediction === 'VIOLET' ? 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'border-purple-500/30 bg-black/40'} ${gameState !== 'BETTING' ? 'opacity-50' : 'active:scale-95'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-transparent" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 mb-2 shadow-[0_0_15px_rgba(168,85,247,0.6)]" />
              <span className="text-sm font-black text-white z-10">Join Violet</span>
              
              {activePrediction === 'VIOLET' && betAmount > 0 && (
                <div className="absolute top-1 right-1 text-[9px] font-black bg-yellow-500 text-black px-1.5 rounded-sm z-20">₹{betAmount}</div>
              )}
            </button>

            <button
              onClick={() => setSelectedPrediction('RED')}
              disabled={gameState !== 'BETTING'}
              className={`relative flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all overflow-hidden ${selectedPrediction === 'RED' ? 'border-red-400 shadow-[0_0_20px_rgba(248,113,113,0.4)]' : 'border-red-500/30 bg-black/40'} ${gameState !== 'BETTING' ? 'opacity-50' : 'active:scale-95'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/20 to-transparent" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 mb-2 shadow-[0_0_15px_rgba(248,113,113,0.6)]" />
              <span className="text-sm font-black text-white z-10">Join Red</span>
              
              {activePrediction === 'RED' && betAmount > 0 && (
                <div className="absolute top-1 right-1 text-[9px] font-black bg-yellow-500 text-black px-1.5 rounded-sm z-20">₹{betAmount}</div>
              )}
            </button>
          </div>

          {/* Number Grid */}
          <div className="px-4 py-2">
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/5 shadow-inner">
              <div className="grid grid-cols-5 gap-3">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => setSelectedPrediction(num)}
                    disabled={gameState !== 'BETTING'}
                    className={`
                      relative w-full aspect-square rounded-full flex items-center justify-center text-xl font-black transition-all border-2
                      ${selectedPrediction === num 
                        ? 'bg-gradient-to-br ' + getColorForNumber(num) + ' text-white scale-110 shadow-lg border-white' 
                        : 'bg-black/60 ' + getBorderColorForNumber(num) + ' text-white hover:scale-105'}
                      ${gameState !== 'BETTING' ? 'opacity-50' : 'active:scale-90'}
                    `}
                  >
                    {num}
                    {activePrediction === num && betAmount > 0 && (
                      <div className="absolute -top-1 -right-1 text-[8px] font-black bg-yellow-500 text-black px-1 rounded-sm z-20 shadow">₹{betAmount}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* History Ticker */}
          <div className="px-4 py-4">
             <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/5">
               <History className="w-4 h-4 text-gray-400 shrink-0" />
               <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
                 {history.map((num, i) => (
                   <div 
                     key={i} 
                     className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br ${getColorForNumber(num)} text-white shadow-sm`}
                   >
                     {num}
                   </div>
                 ))}
               </div>
             </div>
          </div>

        </div>

        {/* Result Overlay */}
        <AnimatePresence>
          {gameState === 'RESULT' && resultNumber !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                className={`w-40 h-40 rounded-full flex items-center justify-center text-7xl font-black text-white shadow-[0_0_50px_rgba(255,255,255,0.2)] bg-gradient-to-br ${getColorForNumber(resultNumber)}`}
              >
                {resultNumber}
              </motion.div>
              
              {winAmount > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="mt-8 flex flex-col items-center"
                >
                  <div className="text-xl font-bold text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Sparkles className="w-6 h-6" /> Winner!
                  </div>
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">
                    +₹{winAmount}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="mt-8 flex flex-col items-center"
                >
                  <div className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Better Luck Next Time
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Absolute Bottom Betting Panel */}
        <div className="absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur-2xl z-50 p-4 border-t border-white/10 rounded-t-[2rem] shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Select Chip Value</span>
            <span className="text-xs font-bold text-gray-400">
              Total Bet: <span className="text-white">₹{betAmount}</span>
            </span>
          </div>
          
          {/* Chips */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide pb-2">
            {CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => setSelectedChip(chip)}
                disabled={gameState !== 'BETTING'}
                className={`
                  w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-dashed shrink-0 flex items-center justify-center transition-all duration-300 relative
                  ${selectedChip === chip 
                    ? 'border-yellow-400 bg-gradient-to-br from-yellow-500 to-orange-600 scale-110 -translate-y-2 shadow-[0_10px_20px_rgba(234,179,8,0.5)] text-black' 
                    : 'border-gray-600 bg-gray-900 scale-95 opacity-80 hover:opacity-100 text-gray-400'}
                  ${gameState !== 'BETTING' ? 'cursor-not-allowed opacity-50' : ''}
                `}
              >
                <div className="font-black text-sm">
                  {chip >= 1000 ? `${chip/1000}k` : chip}
                </div>
              </button>
            ))}
          </div>
          
          {/* Place Bet Button */}
          <button
            onClick={handleConfirmBet}
            disabled={gameState !== 'BETTING' || selectedPrediction === null}
            className="w-full mt-4 py-4 rounded-2xl font-black text-xl tracking-widest uppercase transition-all relative overflow-hidden group
              disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed
              bg-gradient-to-r from-green-500 to-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.4)]
              hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] active:scale-[0.98] border border-green-400/50 text-white"
            style={{ backgroundSize: '200% 100%' }}
          >
            <motion.div
              animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-overlay"
            />
            <span className="relative z-10 drop-shadow-md">
               Place Bet {selectedPrediction !== null && `(${selectedPrediction})`}
            </span>
          </button>
          
        </div>
        
      </div>
    </div>
  );
};

export default WinGoGame;
