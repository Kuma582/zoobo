import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Wallet, Settings, Trophy, History, Sparkles, Zap, PieChart } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface NumberPredictionGameProps {
  onBack: () => void;
}

type GameState = 'BETTING' | 'DRAWING' | 'RESULT';
type Prediction = number[] | null;

const CHIPS = [10, 50, 100, 500, 1000, 5000];

// Payout is based on how many numbers are selected (out of 100).
// Payout = 98 / count (e.g. 1 number = 98x, 50 numbers = 1.96x)

const NumberPredictionGame = ({ onBack }: NumberPredictionGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [gameState, setGameState] = useState<GameState>('BETTING');
  const [timeLeft, setTimeLeft] = useState(45);
  const [period, setPeriod] = useState(() => Math.floor(Date.now() / 1000));
  
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction>(null);
  
  const [betAmount, setBetAmount] = useState(0);
  const [activePrediction, setActivePrediction] = useState<Prediction>(null);
  const [winAmount, setWinAmount] = useState(0);
  
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([42, 7, 88, 15, 99, 0, 23, 45, 67, 89]);

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
      
      // Simulate roulette spin effect
      let spins = 0;
      const spinInterval = setInterval(() => {
        setHighlightedNumber(Math.floor(Math.random() * 100));
        spins++;
        if (spins > 30) {
          clearInterval(spinInterval);
          
          const drawnNumber = Math.floor(Math.random() * 100);
          setResultNumber(drawnNumber);
          setHighlightedNumber(null);
          
          // Evaluate Win
          if (activePrediction !== null && betAmount > 0) {
            if (activePrediction.includes(drawnNumber)) {
              const multiplier = 98 / activePrediction.length;
              const won = Math.floor(betAmount * multiplier);
              setWinAmount(won);
              addMoney(won, `Neon Numbers Win (${drawnNumber})`);
            }
          }
          
          setHistory(prev => [drawnNumber, ...prev].slice(0, 20));
          setGameState('RESULT');
        }
      }, 100);

      return () => clearInterval(spinInterval);

    } else if (gameState === 'RESULT') {
      timer = setTimeout(() => {
        setBetAmount(0);
        setWinAmount(0);
        setActivePrediction(null);
        setSelectedPrediction(null);
        setResultNumber(null);
        setTimeLeft(45);
        setPeriod(prev => prev + 1);
        setGameState('BETTING');
      }, 5000); // 5s result viewing
    }

    return () => clearInterval(timer);
  }, [gameState]);

  const handleConfirmBet = () => {
    if (gameState !== 'BETTING' || selectedPrediction === null || selectedPrediction.length === 0) return;
    if (balance < selectedChip) {
      alert("Insufficient balance!");
      return;
    }
    
    // Simplification: Can only bet once per round for now
    if (activePrediction !== null) {
       alert("You have already placed a bet for this round.");
       return;
    }
    
    let label = selectedPrediction.length === 1 ? selectedPrediction[0].toString() : `${selectedPrediction.length} nums`;

    if (deductMoney(selectedChip, `Neon Numbers Bet (${label})`)) {
      setBetAmount(selectedChip);
      setActivePrediction(selectedPrediction);
    }
  };

  const handleQuickPick = (type: 'ODD' | 'EVEN' | 'LOW' | 'HIGH' | 'RANDOM') => {
    if (gameState !== 'BETTING') return;
    
    let nums: number[] = [];
    if (type === 'ODD') nums = Array.from({length: 100}, (_, i) => i).filter(n => n % 2 !== 0);
    if (type === 'EVEN') nums = Array.from({length: 100}, (_, i) => i).filter(n => n % 2 === 0);
    if (type === 'LOW') nums = Array.from({length: 50}, (_, i) => i);
    if (type === 'HIGH') nums = Array.from({length: 50}, (_, i) => i + 50);
    if (type === 'RANDOM') {
      const count = 10;
      while (nums.length < count) {
        const r = Math.floor(Math.random() * 100);
        if (!nums.includes(r)) nums.push(r);
      }
    }
    setSelectedPrediction(nums);
  };

  const handleNumberClick = (num: number) => {
    if (gameState !== 'BETTING') return;
    setSelectedPrediction(prev => {
      if (!prev) return [num];
      if (prev.includes(num)) return prev.filter(n => n !== num);
      return [...prev, num];
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#0a0f18] relative flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.1)] border-x border-white/5">
        
        {/* Cinematic Background */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Hexagon Pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
          
          {/* Ambient Glows */}
          <div className="absolute top-0 right-[-20%] w-[70%] h-[30%] bg-blue-600/20 blur-[120px]" />
          <div className="absolute bottom-[20%] left-[-20%] w-[70%] h-[40%] bg-yellow-500/10 blur-[120px]" />
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
        <div className="flex-1 relative flex flex-col z-10 min-h-0 overflow-y-auto scrollbar-hide pb-40">
          
          {/* Hero Timer & Period */}
          <div className="px-4 py-4 flex justify-between items-center bg-black/40 border-b border-white/5">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-blue-400" /> Draw
              </span>
              <span className="text-lg font-mono font-bold text-white tracking-wider">#{period}</span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <Zap className={`w-3 h-3 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} /> Time Left
              </span>
              <AnimatePresence mode="wait">
                 {gameState === 'BETTING' ? (
                   <motion.div key="betting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                     <div className={`text-2xl font-black font-mono tracking-widest ${timeLeft <= 5 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse' : 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]'}`}>
                       00:{timeLeft.toString().padStart(2, '0')}
                     </div>
                   </motion.div>
                 ) : (
                   <motion.div key="drawing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                     <span className="text-lg font-black text-yellow-500 uppercase tracking-widest animate-pulse">
                       {gameState === 'DRAWING' ? 'Drawing...' : 'Result'}
                     </span>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>

          {/* Quick Picks */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
              <button onClick={() => handleQuickPick('EVEN')} disabled={gameState !== 'BETTING'} className="px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-lg text-xs font-bold text-blue-300 uppercase tracking-wider shrink-0 active:scale-95 disabled:opacity-50">Even</button>
              <button onClick={() => handleQuickPick('ODD')} disabled={gameState !== 'BETTING'} className="px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-lg text-xs font-bold text-blue-300 uppercase tracking-wider shrink-0 active:scale-95 disabled:opacity-50">Odd</button>
              <button onClick={() => handleQuickPick('LOW')} disabled={gameState !== 'BETTING'} className="px-4 py-2 bg-yellow-900/30 border border-yellow-500/30 rounded-lg text-xs font-bold text-yellow-300 uppercase tracking-wider shrink-0 active:scale-95 disabled:opacity-50">0-49</button>
              <button onClick={() => handleQuickPick('HIGH')} disabled={gameState !== 'BETTING'} className="px-4 py-2 bg-yellow-900/30 border border-yellow-500/30 rounded-lg text-xs font-bold text-yellow-300 uppercase tracking-wider shrink-0 active:scale-95 disabled:opacity-50">50-99</button>
              <button onClick={() => handleQuickPick('RANDOM')} disabled={gameState !== 'BETTING'} className="px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-xs font-bold text-purple-300 uppercase tracking-wider shrink-0 active:scale-95 disabled:opacity-50 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Random 10</button>
              <button onClick={() => setSelectedPrediction([])} disabled={gameState !== 'BETTING'} className="px-4 py-2 bg-gray-900/30 border border-gray-500/30 rounded-lg text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 active:scale-95 disabled:opacity-50">Clear</button>
            </div>
          </div>

          {/* Glowing 100-Number Grid */}
          <div className="px-4 pb-4 flex-1">
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-2 border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] h-[350px] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                {Array.from({length: 100}, (_, i) => i).map(num => {
                  const isSelected = selectedPrediction?.includes(num);
                  const isHighlighted = highlightedNumber === num;
                  const isResult = resultNumber === num;
                  const isWinningSelected = isResult && activePrediction?.includes(num);

                  return (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      disabled={gameState !== 'BETTING'}
                      className={`
                        relative aspect-square rounded flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold transition-all
                        ${isResult 
                          ? 'bg-yellow-500 text-black scale-110 shadow-[0_0_15px_rgba(234,179,8,1)] border-2 border-white z-10' 
                          : isHighlighted
                            ? 'bg-white text-black scale-125 shadow-[0_0_20px_rgba(255,255,255,1)] z-20 rounded-md'
                            : isSelected
                              ? 'bg-blue-600/80 text-white border border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.8)]'
                              : 'bg-[#1a2333] text-gray-400 border border-[#2a3750] hover:bg-[#2a3750] hover:text-white'}
                        ${gameState !== 'BETTING' && !isResult && !isHighlighted ? 'opacity-30' : ''}
                      `}
                    >
                      {num.toString().padStart(2, '0')}
                      
                      {isWinningSelected && (
                         <div className="absolute inset-0 bg-yellow-400 animate-ping rounded opacity-50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* History Ticker */}
          <div className="px-4 pb-4">
             <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/5">
               <History className="w-4 h-4 text-gray-400 shrink-0" />
               <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
                 {history.map((num, i) => (
                   <div 
                     key={i} 
                     className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0 shadow-sm
                       ${i === 0 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.6)]' : 'bg-[#1a2333] text-gray-300 border border-[#2a3750]'}`}
                   >
                     {num.toString().padStart(2, '0')}
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
              className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                className="w-48 h-48 rounded-3xl flex items-center justify-center text-8xl font-black font-mono text-black shadow-[0_0_80px_rgba(234,179,8,0.4)] bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 border-4 border-white/20"
              >
                {resultNumber.toString().padStart(2, '0')}
              </motion.div>
              
              {winAmount > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="mt-8 flex flex-col items-center bg-black/60 px-8 py-4 rounded-2xl border border-yellow-500/30 backdrop-blur-md"
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
                  <div className="text-xl font-bold text-gray-400 uppercase tracking-widest bg-black/80 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10">
                    Better Luck Next Time
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Absolute Bottom Betting Panel */}
        <div className="absolute bottom-0 left-0 w-full bg-[#0a0f18]/95 backdrop-blur-2xl z-50 p-4 border-t border-blue-900/30 rounded-t-[2rem] shadow-[0_-20px_40px_rgba(0,0,0,0.9)]">
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Select Chip</span>
            <div className="flex flex-col items-end">
               <span className="text-xs font-bold text-gray-400">
                 Selected: <span className="text-blue-400">{selectedPrediction?.length || 0}</span>
               </span>
               <span className="text-xs font-bold text-gray-400">
                 Payout: <span className="text-yellow-500">{selectedPrediction && selectedPrediction.length > 0 ? (98/selectedPrediction.length).toFixed(2) : '0'}x</span>
               </span>
            </div>
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
                    ? 'border-blue-400 bg-gradient-to-br from-blue-600 to-indigo-800 scale-110 -translate-y-2 shadow-[0_10px_20px_rgba(37,99,235,0.5)] text-white' 
                    : 'border-gray-700 bg-[#1a2333] scale-95 opacity-80 hover:opacity-100 text-gray-400'}
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
            disabled={gameState !== 'BETTING' || !selectedPrediction || selectedPrediction.length === 0}
            className="w-full mt-4 py-4 rounded-2xl font-black text-xl tracking-widest uppercase transition-all relative overflow-hidden group
              disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed
              bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_30px_rgba(37,99,235,0.4)]
              hover:shadow-[0_0_50px_rgba(37,99,235,0.6)] active:scale-[0.98] border border-blue-400/50 text-white"
            style={{ backgroundSize: '200% 100%' }}
          >
            <motion.div
              animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-overlay"
            />
            <span className="relative z-10 drop-shadow-md flex items-center justify-center gap-2">
               Place Bet <span className="bg-black/30 px-2 py-0.5 rounded text-sm">₹{selectedChip}</span>
            </span>
          </button>
          
        </div>
        
      </div>
    </div>
  );
};

export default NumberPredictionGame;
