import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Wallet, Plus, ArrowDownToLine, User, History, Flame, Trophy, Timer, Crosshair } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface ChickenRollGameProps {
  onBack: () => void;
}

type GameState = 'BETTING' | 'ROLLING' | 'RESULT';

const CHIPS = [10, 50, 100, 500, 1000];

const ChickenRollGame = ({ onBack }: ChickenRollGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [gameState, setGameState] = useState<GameState>('BETTING');
  const [timeLeft, setTimeLeft] = useState(15);
  
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [totalBet, setTotalBet] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  const [multiplier, setMultiplier] = useState(0);
  
  const [history, setHistory] = useState<number[]>([1.5, 2.1, 0.0, 5.5, 1.2, 0.0, 3.4]);
  const [roundId, setRoundId] = useState(() => Math.floor(Math.random() * 10000000));

  // Game Loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameState === 'BETTING') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('ROLLING');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState === 'ROLLING') {
      // Simulate spinning the roll and getting a multiplier
      setTimeout(() => {
        const isWin = Math.random() > 0.4;
        const newMult = isWin ? Number((1 + Math.random() * 4).toFixed(2)) : 0;
        setMultiplier(newMult);
        
        if (newMult > 0 && totalBet > 0) {
          const won = Math.floor(totalBet * newMult);
          setWinAmount(won);
          addMoney(won, `Chicken Roll Win (x${newMult})`);
        }
        
        setHistory(prev => [newMult, ...prev].slice(0, 10));
        setGameState('RESULT');
      }, 4000); // 4 seconds of rolling anticipation
    } else if (gameState === 'RESULT') {
      timer = setTimeout(() => {
        setTotalBet(0);
        setWinAmount(0);
        setMultiplier(0);
        setTimeLeft(15);
        setRoundId(Math.floor(Math.random() * 10000000));
        setGameState('BETTING');
      }, 5000); // Show results for 5s
    }

    return () => clearInterval(timer);
  }, [gameState]);

  const handlePlaceBet = () => {
    if (gameState !== 'BETTING') return;
    if (balance < selectedChip) {
      alert("Insufficient balance!");
      return;
    }
    
    if (deductMoney(selectedChip, 'Chicken Roll Bet')) {
      setTotalBet(prev => prev + selectedChip);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#111] relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(255,100,0,0.15)]">
        
        {/* Background Cinematic Atmosphere */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          {/* Intense center glow */}
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[150%] h-[50%] bg-orange-600/20 rounded-[100%] blur-[100px]" />
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[100%] h-[30%] bg-red-600/20 rounded-[100%] blur-[80px]" />
          <div className="absolute bottom-0 w-full h-[30%] bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>

        {/* Top Header - Wallet & Profile */}
        <div className="h-16 flex items-center justify-between px-4 bg-black/50 backdrop-blur-xl border-b border-white/5 shrink-0 z-20">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-orange-500" />
          </button>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
              <Plus className="w-3 h-3 text-green-400" />
              <span className="text-xs font-bold">Deposit</span>
            </button>
            <button className="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
              <ArrowDownToLine className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-bold">Withdraw</span>
            </button>
          </div>
          
          <button className="p-1.5 bg-gradient-to-tr from-orange-600 to-yellow-500 rounded-full hover:brightness-110 transition-colors shadow-[0_0_15px_rgba(234,179,8,0.4)]">
            <User className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Live Balance & Round Info */}
        <div className="flex justify-between items-center px-4 py-2 z-20 relative">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest flex items-center gap-1">
              <Wallet className="w-3 h-3" /> Balance
            </span>
            <span className="text-lg font-black text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">₹{balance.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest flex items-center gap-1">
              <Crosshair className="w-3 h-3" /> Round ID
            </span>
            <span className="text-xs font-mono text-gray-300">#{roundId}</span>
          </div>
        </div>

        {/* Hero Section - 3D Roll & Timer */}
        <div className="flex-1 relative flex flex-col items-center justify-center z-10 px-4">
          
          {/* Timer Overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full px-8 flex justify-center z-30">
            <AnimatePresence mode="wait">
              {gameState === 'BETTING' && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`flex flex-col items-center px-8 py-2 rounded-2xl bg-black/60 backdrop-blur-md border-2 
                    ${timeLeft <= 5 ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]'}
                  `}
                >
                  <span className="text-[10px] text-gray-300 font-bold tracking-widest uppercase flex items-center gap-1 mb-1">
                    <Timer className="w-3 h-3" /> Place Bets
                  </span>
                  <span className={`text-4xl font-black tabular-nums ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    00:{timeLeft.toString().padStart(2, '0')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Realistic 3D Roll Area */}
          <div className="relative w-full aspect-square max-w-[300px] flex items-center justify-center">
            
            {/* Glowing Platform */}
            <div className="absolute bottom-4 w-[250px] h-[60px] bg-gradient-to-b from-orange-500/40 to-transparent rounded-[100%] blur-md transform rotate-x-60 pointer-events-none" />
            <div className="absolute bottom-8 w-[150px] h-[30px] bg-yellow-400/60 rounded-[100%] blur-lg transform rotate-x-60 shadow-[0_0_50px_rgba(250,204,21,0.8)] pointer-events-none" />

            {/* Fire Particles */}
            {gameState !== 'BETTING' && Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute bottom-12 w-2 h-2 rounded-full bg-orange-400 blur-[1px]"
                initial={{ x: (Math.random() - 0.5) * 100, y: 0, opacity: 1, scale: Math.random() * 2 }}
                animate={{ 
                  y: -200 - Math.random() * 100, 
                  opacity: 0,
                  scale: 0
                }}
                transition={{ 
                  duration: 1 + Math.random() * 2, 
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* The Chicken Roll */}
            <motion.div
              animate={{ 
                rotateZ: gameState === 'ROLLING' ? [0, 360] : 0,
                y: gameState === 'ROLLING' ? [-10, 10, -10] : 0
              }}
              transition={{ 
                rotateZ: { repeat: Infinity, duration: 0.5, ease: "linear" },
                y: { repeat: Infinity, duration: 1, ease: "easeInOut" }
              }}
              className="relative w-48 h-48 z-20 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]"
            >
              {/* Using a high quality image representation */}
              <img 
                src="https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=400&auto=format&fit=crop" 
                className="w-full h-full object-cover rounded-full border-4 border-orange-500/30 shadow-[inset_0_0_20px_rgba(255,100,0,0.5)] opacity-90"
                style={{ clipPath: 'circle(45% at 50% 50%)' }}
                alt="Chicken Roll"
              />
              <Flame className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-orange-500/50 blur-[2px]" />
            </motion.div>

            {/* Result Overlay */}
            <AnimatePresence>
              {gameState === 'RESULT' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center z-40 bg-black/60 backdrop-blur-sm rounded-full"
                >
                  <div className={`text-6xl font-black drop-shadow-[0_0_30px_rgba(0,0,0,1)] ${multiplier > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                    {multiplier}x
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
          
          {/* Win Amount Text */}
          <AnimatePresence>
            {gameState === 'RESULT' && winAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-[70%] z-50 flex flex-col items-center"
              >
                <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest bg-black/80 px-4 py-1 rounded-full border border-yellow-500/50 mb-1">
                  You Won!
                </div>
                <div className="text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">
                  +₹{winAmount}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* History Ticker */}
        <div className="px-4 py-2 z-20">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-xl p-2 border border-white/5">
             <History className="w-4 h-4 text-gray-500 shrink-0" />
             <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
               {history.map((h, i) => (
                 <div key={i} className={`
                   px-2 py-0.5 rounded text-xs font-bold shrink-0 border
                   ${h > 2 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                     h > 0 ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
                     'bg-gray-800 text-gray-500 border-gray-700'}
                 `}>
                   {h.toFixed(2)}x
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Bottom Betting Controls (Glassmorphism) */}
        <div className="bg-black/60 backdrop-blur-2xl z-20 shrink-0 p-4 border-t border-white/10 rounded-t-[2rem] shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Select Chip</span>
            <span className="text-sm font-black text-white bg-white/10 px-3 py-1 rounded-full border border-white/5">
              Bet: ₹{totalBet}
            </span>
          </div>
          
          {/* Chips */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide pb-4">
            {CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => setSelectedChip(chip)}
                className={`
                  w-14 h-14 rounded-full border-[3px] border-dashed shrink-0 flex items-center justify-center transition-all duration-300 relative
                  ${selectedChip === chip 
                    ? 'border-yellow-400 bg-gradient-to-br from-yellow-500 to-orange-600 scale-110 -translate-y-2 shadow-[0_10px_20px_rgba(249,115,22,0.5)] text-black' 
                    : 'border-gray-600 bg-gray-900 scale-95 opacity-80 hover:opacity-100 text-white'}
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
            onClick={handlePlaceBet}
            disabled={gameState !== 'BETTING'}
            className="w-full py-4 rounded-2xl font-black text-xl tracking-widest uppercase transition-all relative overflow-hidden group
              disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed
              bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 shadow-[0_0_30px_rgba(234,88,12,0.4)]
              hover:shadow-[0_0_50px_rgba(234,88,12,0.6)] active:scale-[0.98] border border-orange-400/50"
            style={{ backgroundSize: '200% 100%' }}
          >
            <motion.div
              animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-overlay"
            />
            <span className="relative z-10 drop-shadow-md flex items-center justify-center gap-2">
               Place Bet
            </span>
          </button>
          
        </div>
        
        {/* Fake Bottom Navigation (for standalone app feel) */}
        <div className="bg-black z-30 flex justify-around items-center py-4 px-6 border-t border-white/5 pb-8 sm:pb-4">
           <button className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
             <Trophy className="w-5 h-5" />
             <span className="text-[10px] font-bold">Games</span>
           </button>
           <button className="flex flex-col items-center gap-1 text-orange-500">
             <Flame className="w-5 h-5" />
             <span className="text-[10px] font-bold">Hot</span>
           </button>
           <button className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
             <Wallet className="w-5 h-5" />
             <span className="text-[10px] font-bold">Wallet</span>
           </button>
           <button className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
             <User className="w-5 h-5" />
             <span className="text-[10px] font-bold">Profile</span>
           </button>
        </div>
        
      </div>
    </div>
  );
};

export default ChickenRollGame;
