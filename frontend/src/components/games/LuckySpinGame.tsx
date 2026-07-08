import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trophy, Settings, Sparkles, Coins, Gift } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { fetchGameSettings } from '../../api/client';

interface LuckySpinGameProps {
  onBack: () => void;
}

type GameState = 'IDLE' | 'SPINNING' | 'RESULT';

const CHIPS = [10, 50, 100, 500, 1000];

// Wheel Configuration (8 slices)
const SLICES = [
  { label: '2x', color: '#8B5CF6', multiplier: 2 },
  { label: '0x', color: '#1F2937', multiplier: 0 },
  { label: '1.5x', color: '#3B82F6', multiplier: 1.5 },
  { label: '0x', color: '#1F2937', multiplier: 0 },
  { label: '5x', color: '#EC4899', multiplier: 5 },
  { label: '0x', color: '#1F2937', multiplier: 0 },
  { label: '3x', color: '#F59E0B', multiplier: 3 },
  { label: '0x', color: '#1F2937', multiplier: 0 },
];

const LuckySpinGame = ({ onBack }: LuckySpinGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [gameState, setGameState] = useState<GameState>('IDLE');
  
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [betAmount, setBetAmount] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState<{label: string, mult: number}[]>([]);
  const [jackpot, setJackpot] = useState(1254300);

  // Animate jackpot occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpot(prev => prev + Math.floor(Math.random() * 500));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Global Win Percentage
  const [winPercentage, setWinPercentage] = useState(50);

  useEffect(() => {
    fetchGameSettings().then(res => {
      if (res && res.winPercentage) {
        setWinPercentage(res.winPercentage);
      }
    }).catch(e => console.error("Failed to fetch win percentage:", e));
  }, []);

  const handleSpin = () => {
    if (gameState !== 'IDLE') return;
    if (balance < selectedChip) {
      alert("Insufficient balance!");
      return;
    }
    
    if (deductMoney(selectedChip, 'Lucky Spin Bet')) {
      setBetAmount(selectedChip);
      setGameState('SPINNING');
      
      // Determine outcome based on winPercentage
      // winPercentage is out of 100
      const isWin = Math.random() < (winPercentage / 100);
      let targetIndex = 1; // Default to a 0x slice
      
      if (isWin) {
        // Pick a random winning slice
        const winningIndices = [0, 2, 4, 6];
        targetIndex = winningIndices[Math.floor(Math.random() * winningIndices.length)];
      } else {
        const losingIndices = [1, 3, 5, 7];
        targetIndex = losingIndices[Math.floor(Math.random() * losingIndices.length)];
      }
      
      // Calculate rotation
      const sliceAngle = 360 / SLICES.length;
      // We want the target slice to end up at the top (0 degrees).
      // The slice's center is at index * sliceAngle + sliceAngle/2.
      // So we need to rotate by 360 - (center angle) + (some full spins)
      const targetAngle = 360 - (targetIndex * sliceAngle + sliceAngle / 2);
      const spins = 5; // 5 full spins
      const newRotation = rotation + (spins * 360) + targetAngle - (rotation % 360);
      
      setRotation(newRotation);
      
      // Wait for spin to finish
      setTimeout(() => {
        const result = SLICES[targetIndex];
        const won = Math.floor(selectedChip * result.multiplier);
        setWinAmount(won);
        
        if (won > 0) {
          addMoney(won, `Lucky Spin Win (${result.label})`);
        }
        
        setHistory(prev => [ {label: result.label, mult: result.multiplier}, ...prev].slice(0, 10));
        setGameState('RESULT');
        
        // Reset after showing result
        setTimeout(() => {
          setGameState('IDLE');
          setBetAmount(0);
          setWinAmount(0);
        }, 4000);
        
      }, 5000); // 5 seconds spin duration
    }
  };

  // Generate Conic Gradient for the Wheel
  const wheelGradient = SLICES.map((slice, i) => {
    const start = (i * 100) / SLICES.length;
    const end = ((i + 1) * 100) / SLICES.length;
    return `${slice.color} ${start}% ${end}%`;
  }).join(', ');

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#111] relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(139,92,246,0.15)] border-x border-white/5">
        
        {/* Cinematic Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[150%] h-[50%] bg-purple-600/20 rounded-[100%] blur-[100px]" />
          <div className="absolute bottom-0 w-full h-[50%] bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent" />
          
          {/* Ambient Floating Particles */}
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        {/* Top Header */}
        <div className="h-16 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md border-b border-white/5 shrink-0 z-20">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-purple-400" />
          </button>
          
          {/* Live Jackpot */}
          <div className="flex flex-col items-center bg-purple-900/40 border border-purple-500/30 px-6 py-1 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <span className="text-[9px] text-purple-300 uppercase font-black tracking-widest flex items-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-400" /> Mega Jackpot
            </span>
            <span className="text-sm font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
              ₹ {jackpot.toLocaleString()}
            </span>
          </div>
          
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-gray-400 font-bold uppercase">Balance</span>
             <span className="text-sm font-black text-yellow-400">₹{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center z-10 overflow-y-auto scrollbar-hide py-4 min-h-0">
          
          {/* History Ticker */}
          <div className="w-full px-4 mb-4 mt-2">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-xl p-2 border border-white/5 overflow-x-auto scrollbar-hide">
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mx-1" />
              {history.map((h, i) => (
                 <div key={i} className={`
                   px-3 py-0.5 rounded text-xs font-bold shrink-0 border uppercase
                   ${h.mult > 0 ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'}
                 `}>
                   {h.label}
                 </div>
              ))}
              {history.length === 0 && <span className="text-xs text-gray-500 italic">No spins yet...</span>}
            </div>
          </div>

          {/* 3D Wheel Area */}
          <div className="relative w-full aspect-square max-w-[320px] flex items-center justify-center my-4">
            
            {/* Outer Glow / Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 blur-xl" />
            
            {/* The Pointer */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
              <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 50L0 20C0 20 5 0 20 0C35 0 40 20 40 20L20 50Z" fill="url(#paint0_linear)" stroke="#FBBF24" strokeWidth="2"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="20" y1="0" x2="20" y2="50" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F59E0B"/>
                    <stop offset="1" stopColor="#D97706"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* The Wheel */}
            <motion.div
              className="relative w-[90%] h-[90%] rounded-full border-8 border-[#1F2937] shadow-[inset_0_0_30px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
              animate={{ rotate: rotation }}
              transition={{ duration: 5, ease: [0.2, 0.8, 0.2, 1] }} // smooth ease out
            >
              <div 
                className="w-full h-full rounded-full"
                style={{ background: `conic-gradient(${wheelGradient})` }}
              />
              
              {/* Wheel Slice Labels (Math to position text correctly) */}
              {SLICES.map((slice, i) => {
                const rotationAngle = (i * 360) / SLICES.length + (360 / SLICES.length) / 2;
                return (
                  <div
                    key={i}
                    className="absolute top-0 left-1/2 h-1/2 origin-bottom flex items-start justify-center pt-6 z-10"
                    style={{ transform: `translateX(-50%) rotate(${rotationAngle}deg)` }}
                  >
                    <span className="text-xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                      {slice.label}
                    </span>
                  </div>
                );
              })}
              
              {/* Center Hub */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#111] rounded-full border-4 border-[#374151] shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center z-20">
                <div className="w-6 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)] animate-pulse" />
              </div>
              
              {/* Inner overlay for depth */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)] pointer-events-none z-10" />
            </motion.div>

          </div>

          {/* Confetti & Win Result */}
          <AnimatePresence>
            {gameState === 'RESULT' && winAmount > 0 && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
                {/* Simulated Confetti Particles */}
                {Array.from({ length: 50 }).map((_, i) => {
                  const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
                  const color = colors[Math.floor(Math.random() * colors.length)];
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-3 h-3 rounded-sm"
                      style={{ backgroundColor: color }}
                      initial={{ 
                        x: 0, y: 0, 
                        scale: 0,
                        rotate: 0 
                      }}
                      animate={{ 
                        x: (Math.random() - 0.5) * window.innerWidth * 1.5, 
                        y: (Math.random() - 0.5) * window.innerHeight * 1.5,
                        scale: Math.random() * 1.5 + 0.5,
                        rotate: Math.random() * 360 + 360
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                  );
                })}

                <motion.div
                  initial={{ scale: 0, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: -50 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="bg-black/90 backdrop-blur-xl px-12 py-8 rounded-[2rem] border-2 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.6)] flex flex-col items-center pointer-events-auto mt-20"
                >
                  <Gift className="w-16 h-16 text-yellow-400 mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce" />
                  <div className="text-white font-bold tracking-widest text-sm mb-1 uppercase">Big Win!</div>
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    +₹{winAmount}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>

        {/* Bottom Betting Controls */}
        <div className="bg-black/80 backdrop-blur-xl z-20 shrink-0 p-4 border-t border-purple-500/20 rounded-t-[2rem] shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Select Bet</span>
            <span className="text-sm font-black text-white bg-white/10 px-3 py-1 rounded-full border border-white/5 flex items-center gap-1">
              <Coins className="w-3 h-3 text-yellow-500" /> ₹{selectedChip}
            </span>
          </div>
          
          {/* Chips */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide pb-4">
            {CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => setSelectedChip(chip)}
                disabled={gameState !== 'IDLE'}
                className={`
                  w-14 h-14 rounded-full border-[3px] border-dashed shrink-0 flex items-center justify-center transition-all duration-300 relative
                  ${selectedChip === chip 
                    ? 'border-purple-400 bg-gradient-to-br from-purple-600 to-pink-600 scale-110 -translate-y-2 shadow-[0_10px_20px_rgba(168,85,247,0.5)] text-white' 
                    : 'border-gray-600 bg-gray-900 scale-95 opacity-80 hover:opacity-100 text-gray-400'}
                  ${gameState !== 'IDLE' ? 'cursor-not-allowed opacity-50' : ''}
                `}
              >
                <div className="font-black text-sm">
                  {chip >= 1000 ? `${chip/1000}k` : chip}
                </div>
              </button>
            ))}
          </div>

          {/* Spin Button */}
          <button
            onClick={handleSpin}
            disabled={gameState !== 'IDLE'}
            className="w-full py-5 rounded-2xl font-black text-2xl tracking-widest uppercase transition-all relative overflow-hidden group
              disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed
              bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 shadow-[0_0_30px_rgba(168,85,247,0.4)]
              hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] active:scale-[0.98] border border-purple-400/50"
            style={{ backgroundSize: '200% 100%' }}
          >
            <motion.div
              animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-overlay"
            />
            <span className="relative z-10 drop-shadow-md">
               {gameState === 'SPINNING' ? 'Spinning...' : 'SPIN WHEEL'}
            </span>
          </button>
          
        </div>
        
      </div>
    </div>
  );
};

export default LuckySpinGame;
