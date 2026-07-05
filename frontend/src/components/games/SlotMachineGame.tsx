import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Minus, Repeat, Trophy, Settings, Zap, Play } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface SlotMachineGameProps {
  onBack: () => void;
}

const SYMBOLS = [
  { id: 'SEVEN', icon: '7️⃣', mult: 50 },
  { id: 'DIAMOND', icon: '💎', mult: 20 },
  { id: 'BELL', icon: '🔔', mult: 10 },
  { id: 'CHERRY', icon: '🍒', mult: 5 },
  { id: 'LEMON', icon: '🍋', mult: 3 },
  { id: 'GRAPE', icon: '🍇', mult: 2 }
];

const REELS = 3;

const SlotMachineGame = ({ onBack }: SlotMachineGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  
  // Results for each reel (index of SYMBOLS)
  const [results, setResults] = useState<number[]>([0, 1, 2]);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false]);
  const [winAmount, setWinAmount] = useState<number | null>(null);

  const handleSpin = () => {
    if (isSpinning) return;
    if (balance < betAmount) {
      alert("Insufficient balance!");
      setIsAutoSpin(false);
      return;
    }
    
    if (!deductMoney(betAmount, 'Slot Spin')) {
      setIsAutoSpin(false);
      return;
    }

    setWinAmount(null);
    setIsSpinning(true);
    setSpinningReels([true, true, true]);

    // Determine results
    const newResults = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length)
    ];

    // Force a win occasionally for demo purposes
    if (Math.random() < 0.2) {
      const winSymbol = Math.floor(Math.random() * SYMBOLS.length);
      newResults[0] = winSymbol;
      newResults[1] = winSymbol;
      newResults[2] = winSymbol;
    }

    // Stop reels one by one
    setTimeout(() => { setSpinningReels([false, true, true]); setResults([newResults[0], results[1], results[2]]); }, 1000);
    setTimeout(() => { setSpinningReels([false, false, true]); setResults([newResults[0], newResults[1], results[2]]); }, 2000);
    setTimeout(() => { 
      setSpinningReels([false, false, false]); 
      setResults(newResults);
      
      // Check win
      if (newResults[0] === newResults[1] && newResults[1] === newResults[2]) {
        const symbol = SYMBOLS[newResults[0]];
        const won = betAmount * symbol.mult;
        setWinAmount(won);
        addMoney(won, `Slot Win (${symbol.icon})`);
      } else if (newResults[0] === newResults[1] || newResults[1] === newResults[2] || newResults[0] === newResults[2]) {
        // Small win for 2 matches
        const won = Number((betAmount * 1.5).toFixed(2));
        setWinAmount(won);
        addMoney(won, `Slot Win (Pair)`);
      }

      setIsSpinning(false);
    }, 3000);
  };

  // Auto spin logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isAutoSpin && !isSpinning && winAmount === null) {
      timeout = setTimeout(handleSpin, 1000);
    } else if (isAutoSpin && !isSpinning && winAmount !== null) {
      timeout = setTimeout(() => {
        setWinAmount(null);
        handleSpin();
      }, 3000); // Wait 3s after a win before next auto spin
    }
    return () => clearTimeout(timeout);
  }, [isAutoSpin, isSpinning, winAmount]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#111] relative overflow-hidden flex flex-col border-x border-white/5 shadow-[0_0_100px_rgba(255,215,0,0.1)]">
        
        {/* Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-[#FFD700]/10 to-transparent" />
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#FFD700]/10 rounded-full blur-[100px]" />
        </div>

        {/* Top Header */}
        <div className="h-16 flex items-center justify-between px-4 bg-black/60 backdrop-blur-xl border-b border-[#FFD700]/20 shrink-0 z-20">
          <button onClick={() => { setIsAutoSpin(false); onBack(); }} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#FFD700]" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#FFD700] font-bold tracking-widest uppercase">Live Jackpot</span>
            <span className="font-black text-xl tracking-wider text-white drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
              ₹{(854000 + balance % 1000).toLocaleString()}
            </span>
          </div>
          
          <button className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <Settings className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Main Machine Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center z-10 px-4 py-8">
          
          {/* Machine Frame */}
          <div className="w-full bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] rounded-[2rem] p-4 border-[4px] border-[#333] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(255,255,255,0.1)] relative">
            
            {/* Neon Accent Line */}
            <div className="absolute -inset-1 rounded-[2.2rem] border-2 border-[#FFD700] opacity-50 shadow-[0_0_20px_rgba(255,215,0,0.4)] pointer-events-none" />

            {/* Payline Indicator */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,1)] z-30 pointer-events-none -translate-y-1/2" />

            {/* Reels Container */}
            <div className="bg-[#050505] rounded-xl p-2 grid grid-cols-3 gap-2 h-64 overflow-hidden relative shadow-[inset_0_10px_20px_rgba(0,0,0,1)] border border-white/5">
              
              {/* Inner Shadow to simulate depth */}
              <div className="absolute inset-0 shadow-[inset_0_20px_20px_rgba(0,0,0,0.8),inset_0_-20px_20px_rgba(0,0,0,0.8)] pointer-events-none z-20" />

              {/* Reel 1 */}
              <div className="bg-gradient-to-b from-[#111] via-[#222] to-[#111] rounded-lg overflow-hidden flex flex-col relative justify-center border-r border-white/5">
                <AnimatePresence mode="wait">
                  {spinningReels[0] ? (
                    <motion.div
                      key="spin0"
                      animate={{ y: [0, -1000] }}
                      transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }}
                      className="absolute top-0 flex flex-col items-center w-full"
                    >
                      {[...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS].map((s, i) => (
                        <div key={i} className="h-24 flex items-center justify-center text-6xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] opacity-50 blur-[2px]">{s.icon}</div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="result0"
                      initial={{ y: -100 }}
                      animate={{ y: 0 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="flex flex-col items-center justify-center h-full w-full relative z-10"
                    >
                      <div className="text-7xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">{SYMBOLS[results[0]].icon}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reel 2 */}
              <div className="bg-gradient-to-b from-[#111] via-[#222] to-[#111] rounded-lg overflow-hidden flex flex-col relative justify-center border-r border-white/5">
                <AnimatePresence mode="wait">
                  {spinningReels[1] ? (
                    <motion.div
                      key="spin1"
                      animate={{ y: [0, -1000] }}
                      transition={{ repeat: Infinity, duration: 0.25, ease: "linear" }}
                      className="absolute top-0 flex flex-col items-center w-full"
                    >
                      {[...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS].map((s, i) => (
                        <div key={i} className="h-24 flex items-center justify-center text-6xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] opacity-50 blur-[2px]">{s.icon}</div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="result1"
                      initial={{ y: -100 }}
                      animate={{ y: 0 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="flex flex-col items-center justify-center h-full w-full relative z-10"
                    >
                      <div className="text-7xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">{SYMBOLS[results[1]].icon}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reel 3 */}
              <div className="bg-gradient-to-b from-[#111] via-[#222] to-[#111] rounded-lg overflow-hidden flex flex-col relative justify-center">
                <AnimatePresence mode="wait">
                  {spinningReels[2] ? (
                    <motion.div
                      key="spin2"
                      animate={{ y: [0, -1000] }}
                      transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
                      className="absolute top-0 flex flex-col items-center w-full"
                    >
                      {[...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS].map((s, i) => (
                        <div key={i} className="h-24 flex items-center justify-center text-6xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] opacity-50 blur-[2px]">{s.icon}</div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="result2"
                      initial={{ y: -100 }}
                      animate={{ y: 0 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="flex flex-col items-center justify-center h-full w-full relative z-10"
                    >
                      <div className="text-7xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">{SYMBOLS[results[2]].icon}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

          {/* Win Overlay */}
          <AnimatePresence>
            {winAmount !== null && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
              >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                
                {/* Simulated Coin Explosion */}
                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.8)]"
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{ 
                      x: (Math.random() - 0.5) * 400,
                      y: (Math.random() - 0.5) * 400,
                      opacity: 0,
                      rotateY: 720,
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                ))}

                <div className="bg-gradient-to-b from-yellow-900/90 to-black/90 p-8 rounded-[2rem] border-4 border-yellow-500 shadow-[0_0_50px_rgba(250,204,21,0.6)] flex flex-col items-center relative z-10">
                  <Trophy className="w-16 h-16 text-yellow-400 mb-2 drop-shadow-lg" />
                  <div className="text-yellow-400 font-black text-2xl tracking-widest uppercase drop-shadow-md">BIG WIN</div>
                  <div className="text-5xl font-black text-white mt-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">+₹{winAmount}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Bottom Industrial Control Panel */}
        <div className="bg-gradient-to-t from-[#111] to-[#1A1A1A] p-6 z-20 shrink-0 border-t-2 border-[#333] shadow-[0_-10px_20px_rgba(0,0,0,0.5)] rounded-t-[2rem]">
          
          <div className="flex justify-between items-center bg-black/50 p-3 rounded-2xl border border-white/5 mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Balance</span>
              <span className="text-lg font-black text-[#FFD700]">₹{balance.toLocaleString()}</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Last Win</span>
              <span className="text-lg font-black text-green-400">{winAmount ? `+₹${winAmount}` : '₹0'}</span>
            </div>
          </div>
          
          <div className="flex gap-4 items-end">
            
            {/* Bet Controls */}
            <div className="flex-1">
              <div className="text-center text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Total Bet</div>
              <div className="flex items-center justify-between bg-black/60 rounded-xl p-2 border border-white/5 shadow-inner">
                <button 
                  onClick={() => setBetAmount(Math.max(10, betAmount - 10))} 
                  disabled={isSpinning || isAutoSpin}
                  className="w-10 h-10 flex items-center justify-center bg-gradient-to-b from-[#333] to-[#222] hover:from-[#444] rounded-lg text-white disabled:opacity-50 border border-white/10 shadow-md active:scale-95 transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="font-black text-xl text-white">₹{betAmount}</div>
                <button 
                  onClick={() => setBetAmount(betAmount + 10)} 
                  disabled={isSpinning || isAutoSpin}
                  className="w-10 h-10 flex items-center justify-center bg-gradient-to-b from-[#333] to-[#222] hover:from-[#444] rounded-lg text-white disabled:opacity-50 border border-white/10 shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Auto Spin Toggle */}
            <button
              onClick={() => setIsAutoSpin(!isAutoSpin)}
              className={`
                w-14 h-14 rounded-xl border-2 flex items-center justify-center shadow-lg transition-all active:scale-95 shrink-0
                ${isAutoSpin ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gradient-to-b from-[#333] to-[#222] border-white/10 text-gray-400'}
              `}
            >
              <Repeat className={`w-6 h-6 ${isAutoSpin ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            </button>
            
            {/* SPIN BUTTON */}
            <button
              onClick={handleSpin}
              disabled={isSpinning && !isAutoSpin}
              className={`
                w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl transition-all active:scale-90 shrink-0 relative
                ${isSpinning 
                  ? 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed scale-95' 
                  : 'bg-gradient-to-b from-[#FFD700] via-[#F59E0B] to-[#D97706] border-[#FFF8E7] text-black shadow-[0_10px_30px_rgba(245,158,11,0.6),inset_0_5px_10px_rgba(255,255,255,0.6)] hover:brightness-110'
                }
              `}
            >
              <div className="absolute -inset-2 bg-[#FFD700] opacity-20 blur-xl rounded-full pointer-events-none" />
              <Zap className="w-8 h-8 fill-current drop-shadow-md mb-1" />
              <span className="font-black text-xl tracking-widest drop-shadow-md leading-none">SPIN</span>
            </button>
            
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default SlotMachineGame;
