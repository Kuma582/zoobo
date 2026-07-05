import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Wallet, Settings, CircleDot, History, ArrowUpCircle, AlertCircle, Coins, Sparkles, TrendingUp } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface CoinFlipGameProps {
  onBack: () => void;
}

type GameState = 'BETTING' | 'FLIPPING' | 'RESULT';
type Prediction = 'HEADS' | 'TAILS' | null;

const CHIPS = [10, 50, 100, 500, 1000, 5000];

const CoinFlipGame = ({ onBack }: CoinFlipGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [gameState, setGameState] = useState<GameState>('BETTING');
  const [timeLeft, setTimeLeft] = useState(15);
  const [period, setPeriod] = useState(() => Math.floor(Date.now() / 1000));
  
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction>(null);
  
  const [betAmount, setBetAmount] = useState(0);
  const [activePrediction, setActivePrediction] = useState<Prediction>(null);
  const [winAmount, setWinAmount] = useState(0);
  
  const [resultFace, setResultFace] = useState<'HEADS' | 'TAILS' | null>(null);
  const [history, setHistory] = useState<'HEADS' | 'TAILS'[]>(['HEADS', 'TAILS', 'HEADS', 'HEADS', 'TAILS', 'HEADS']);
  const [flipCount, setFlipCount] = useState(0);

  // Game Loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameState === 'BETTING') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('FLIPPING');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState === 'FLIPPING') {
      setFlipCount(prev => prev + 1);
      
      // Simulate flipping
      setTimeout(() => {
        const isHeads = Math.random() > 0.5;
        const face = isHeads ? 'HEADS' : 'TAILS';
        setResultFace(face);
        
        // Evaluate Win
        if (activePrediction !== null && betAmount > 0) {
          if (activePrediction === face) {
            const won = Math.floor(betAmount * 1.98); // 1.98x payout
            setWinAmount(won);
            addMoney(won, `Golden Coin Flip Win (${face})`);
          }
        }
        
        setHistory(prev => [face, ...prev].slice(0, 15));
        setGameState('RESULT');
      }, 3500); // 3.5 seconds flipping
    } else if (gameState === 'RESULT') {
      timer = setTimeout(() => {
        setBetAmount(0);
        setWinAmount(0);
        setActivePrediction(null);
        setSelectedPrediction(null);
        setResultFace(null);
        setTimeLeft(15);
        setPeriod(prev => prev + 1);
        setGameState('BETTING');
      }, 4000); // 4s result viewing
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
    
    if (deductMoney(selectedChip, `Golden Coin Flip Bet (${selectedPrediction})`)) {
      setBetAmount(prev => prev + selectedChip);
      setActivePrediction(selectedPrediction);
    }
  };

  const headsCount = history.filter(h => h === 'HEADS').length;
  const tailsCount = history.length - headsCount;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#111] relative flex flex-col shadow-[0_0_50px_rgba(234,179,8,0.1)] border-x border-white/5">
        
        {/* Cinematic Background */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-yellow-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 w-full h-[50%] bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>

        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 bg-black/60 backdrop-blur-md border-b border-white/10 shrink-0 z-20">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-yellow-500" />
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
          
          {/* Timer & History Summary */}
          <div className="flex justify-between items-start px-4 py-4">
             <div className="flex flex-col">
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Period {period}</span>
               <AnimatePresence mode="wait">
                 {gameState === 'BETTING' ? (
                   <motion.div key="betting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                     <span className={`text-3xl font-black ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]'}`}>
                       00:{timeLeft.toString().padStart(2, '0')}
                     </span>
                   </motion.div>
                 ) : (
                   <motion.div key="flipping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[36px] flex items-center">
                     <span className="text-lg font-black text-yellow-500 uppercase tracking-widest animate-pulse">
                       {gameState === 'FLIPPING' ? 'Flipping...' : 'Result'}
                     </span>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
             
             <div className="bg-black/50 backdrop-blur-md rounded-xl p-2 border border-white/5 flex gap-4 text-xs font-bold text-gray-400">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase tracking-widest mb-0.5">Heads</span>
                  <span className="text-yellow-500">{headsCount}</span>
                </div>
                <div className="w-px bg-white/10" />
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase tracking-widest mb-0.5">Tails</span>
                  <span className="text-blue-400">{tailsCount}</span>
                </div>
             </div>
          </div>

          {/* 3D Coin Stage */}
          <div className="w-full flex-1 min-h-[250px] flex items-center justify-center perspective-[1200px] my-4">
            <motion.div
              key={flipCount}
              initial={gameState === 'FLIPPING' ? { rotateX: 0, rotateY: 0, y: 0, scale: 1 } : false}
              animate={gameState === 'FLIPPING' ? {
                rotateX: [0, 1080, 2160, 2880], // 8 full flips
                rotateY: [0, 360, 720, 1080],
                y: [0, -150, -200, -100, 0],
                scale: [1, 1.3, 1.5, 1.2, 1]
              } : { 
                rotateX: resultFace === 'TAILS' ? 180 : 0, 
                rotateY: 0, 
                y: 0, 
                scale: 1 
              }}
              transition={gameState === 'FLIPPING' ? { duration: 3.5, ease: [0.2, 0.8, 0.2, 1] } : { type: "spring" }}
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-full"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Outer Glow */}
              <div className="absolute inset-0 rounded-full shadow-[0_0_50px_rgba(234,179,8,0.4)] blur-md" />
              
              {/* Heads Side (Front) */}
              <div 
                className="absolute inset-0 rounded-full border-4 border-yellow-600 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 flex flex-col items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] backface-hidden"
              >
                <div className="w-24 h-24 rounded-full border-2 border-yellow-400/50 flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20">
                  <Sparkles className="w-8 h-8 text-yellow-100 mb-1 drop-shadow-md" />
                  <span className="text-xl font-black text-yellow-100 drop-shadow-lg">HEADS</span>
                </div>
              </div>

              {/* Tails Side (Back) */}
              <div 
                className="absolute inset-0 rounded-full border-4 border-gray-400 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600 flex flex-col items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] backface-hidden"
                style={{ transform: 'rotateX(180deg)' }}
              >
                <div className="w-24 h-24 rounded-full border-2 border-gray-300/50 flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20">
                  <Coins className="w-8 h-8 text-gray-100 mb-1 drop-shadow-md" />
                  <span className="text-xl font-black text-gray-100 drop-shadow-lg">TAILS</span>
                </div>
              </div>
              
              {/* Coin Edge (Fake 3D thickness) */}
              <div className="absolute inset-0 rounded-full border-[16px] border-yellow-600/30" style={{ transform: 'translateZ(-1px)', backfaceVisibility: 'hidden' }} />
              <div className="absolute inset-0 rounded-full border-[16px] border-yellow-600/30" style={{ transform: 'translateZ(-2px)', backfaceVisibility: 'hidden' }} />
              
            </motion.div>
          </div>

          {/* Prediction Cards */}
          <div className="px-4 grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => setSelectedPrediction('HEADS')}
              disabled={gameState !== 'BETTING'}
              className={`
                relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all overflow-hidden
                ${selectedPrediction === 'HEADS' 
                  ? 'bg-yellow-900/40 border-yellow-500 shadow-[inset_0_0_20px_rgba(234,179,8,0.3),0_0_15px_rgba(234,179,8,0.3)]' 
                  : 'bg-black/40 border-white/5 hover:border-yellow-500/30'}
                ${gameState !== 'BETTING' ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent" />
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 mb-2 shadow-[0_0_15px_rgba(234,179,8,0.5)] flex items-center justify-center border-2 border-yellow-300">
                <span className="font-black text-black">H</span>
              </div>
              <span className="text-xl font-black text-white z-10 mb-1">Heads</span>
              <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">1.98x Payout</span>
              
              {activePrediction === 'HEADS' && betAmount > 0 && (
                <div className="absolute top-2 right-2 text-[10px] font-black bg-yellow-500 text-black px-2 py-0.5 rounded-sm z-20">₹{betAmount}</div>
              )}
            </button>

            <button
              onClick={() => setSelectedPrediction('TAILS')}
              disabled={gameState !== 'BETTING'}
              className={`
                relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all overflow-hidden
                ${selectedPrediction === 'TAILS' 
                  ? 'bg-blue-900/40 border-blue-400 shadow-[inset_0_0_20px_rgba(96,165,250,0.3),0_0_15px_rgba(96,165,250,0.3)]' 
                  : 'bg-black/40 border-white/5 hover:border-blue-400/30'}
                ${gameState !== 'BETTING' ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 mb-2 shadow-[0_0_15px_rgba(156,163,175,0.5)] flex items-center justify-center border-2 border-gray-200">
                <span className="font-black text-black">T</span>
              </div>
              <span className="text-xl font-black text-white z-10 mb-1">Tails</span>
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">1.98x Payout</span>
              
              {activePrediction === 'TAILS' && betAmount > 0 && (
                <div className="absolute top-2 right-2 text-[10px] font-black bg-yellow-500 text-black px-2 py-0.5 rounded-sm z-20">₹{betAmount}</div>
              )}
            </button>
          </div>

          {/* History Ticker */}
          <div className="px-4">
             <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/5">
               <History className="w-4 h-4 text-gray-400 shrink-0" />
               <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
                 {history.map((face, i) => (
                   <div 
                     key={i} 
                     className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border
                       ${face === 'HEADS' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300 text-black' : 'bg-gradient-to-br from-gray-300 to-gray-500 border-gray-200 text-black'}`}
                   >
                     {face === 'HEADS' ? 'H' : 'T'}
                   </div>
                 ))}
               </div>
             </div>
          </div>

        </div>

        {/* Win Overlay */}
        <AnimatePresence>
          {gameState === 'RESULT' && resultFace && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none"
            >
              {winAmount > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
                  className="mt-32 flex flex-col items-center bg-black/60 px-10 py-6 rounded-3xl border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.3)]"
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
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="mt-32 flex flex-col items-center"
                >
                  <div className="text-xl font-bold text-gray-400 uppercase tracking-widest bg-black/60 px-8 py-4 rounded-full">
                    No Win This Round
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Absolute Bottom Betting Panel */}
        <div className="absolute bottom-0 left-0 w-full bg-[#0d0d0d] backdrop-blur-2xl z-50 p-4 border-t border-white/10 rounded-t-[2rem] shadow-[0_-20px_40px_rgba(0,0,0,0.9)]">
          
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
              bg-gradient-to-r from-yellow-500 to-orange-600 shadow-[0_0_30px_rgba(234,179,8,0.4)]
              hover:shadow-[0_0_50px_rgba(234,179,8,0.6)] active:scale-[0.98] border border-yellow-400 text-black"
            style={{ backgroundSize: '200% 100%' }}
          >
            <motion.div
              animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent mix-blend-overlay"
            />
            <span className="relative z-10 drop-shadow-sm">
               Place Bet {selectedPrediction !== null && `(${selectedPrediction})`}
            </span>
          </button>
          
        </div>
        
      </div>
    </div>
  );
};

export default CoinFlipGame;
