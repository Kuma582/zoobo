import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Wallet, Settings, Rocket, Coins, Sparkles, Plus, Minus, History, TriangleAlert, Info } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface AviatorGameProps {
  onBack: () => void;
}

type GameState = 'WAITING' | 'FLYING' | 'CRASHED';

const CHIPS = [10, 50, 100, 500, 1000];

const generateHistory = () => {
  return Array.from({ length: 15 }, () => {
    const r = Math.random();
    if (r < 0.5) return (1 + Math.random() * 0.9).toFixed(2);
    if (r < 0.8) return (2 + Math.random() * 3).toFixed(2);
    if (r < 0.95) return (5 + Math.random() * 5).toFixed(2);
    return (10 + Math.random() * 20).toFixed(2);
  });
};

const AviatorGame = ({ onBack }: AviatorGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [gameState, setGameState] = useState<GameState>('WAITING');
  const [multiplier, setMultiplier] = useState(1.00);
  const [targetCrash, setTargetCrash] = useState(1.00);
  const [history, setHistory] = useState<string[]>(generateHistory());
  
  // Dual Bet States
  const [bet1Amount, setBet1Amount] = useState(10);
  const [bet2Amount, setBet2Amount] = useState(10);
  
  const [activeBet1, setActiveBet1] = useState(0); // 0 means no active bet
  const [activeBet2, setActiveBet2] = useState(0);
  
  const [win1, setWin1] = useState(0);
  const [win2, setWin2] = useState(0);

  const [waitTimer, setWaitTimer] = useState(5.0);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState === 'WAITING') {
      const interval = setInterval(() => {
        setWaitTimer(prev => {
          if (prev <= 0.1) {
            clearInterval(interval);
            startGame();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  const startGame = () => {
    // Generate crash point (weighted towards lower numbers for house edge)
    const r = Math.random();
    let crash = 1.01; // Minimum 1.01 to ensure it always starts from 1.00x
    if (r < 0.1) crash = 1.01 + Math.random() * 0.2; // 1.01 - 1.20 (quick crash)
    else if (r < 0.5) crash = 1.2 + Math.random() * 1.3; // 1.20 - 2.50
    else if (r < 0.8) crash = 2.5 + Math.random() * 2.5; // 2.50 - 5.00
    else if (r < 0.95) crash = 5.0 + Math.random() * 5.0; // 5.00 - 10.00
    else crash = 10.0 + Math.random() * 40.0; // 10.00 - 50.00
    
    setTargetCrash(crash);
    setMultiplier(1.00);
    setWin1(0);
    setWin2(0);
    setGameState('FLYING');
    
    startTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(updateMultiplier);
  };

  const updateMultiplier = (time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    const elapsed = (time - startTimeRef.current) / 1000;
    
    // Exponential growth curve - balanced for perfect pacing
    const currentMult = Math.pow(1.028, elapsed * 6);
    
    if (currentMult >= targetCrash) {
      setMultiplier(targetCrash);
      setGameState('CRASHED');
      setActiveBet1(0); // Bets lost if not cashed out
      setActiveBet2(0);
      setHistory(prev => [targetCrash.toFixed(2), ...prev].slice(0, 15));
      setTimeout(() => {
        setWaitTimer(5.0);
        setGameState('WAITING');
      }, 4000); // Wait 4 seconds before next round
    } else {
      setMultiplier(currentMult);
      requestRef.current = requestAnimationFrame(updateMultiplier);
    }
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const placeBet = (panel: 1 | 2) => {
    if (gameState !== 'WAITING') return;
    const amount = panel === 1 ? bet1Amount : bet2Amount;
    
    if (balance < amount) {
      alert("Insufficient balance");
      return;
    }
    
    if (deductMoney(amount, `Aviator Bet ${panel}`)) {
      if (panel === 1) setActiveBet1(amount);
      else setActiveBet2(amount);
    }
  };

  const cancelBet = (panel: 1 | 2) => {
    if (gameState !== 'WAITING') return;
    const amount = panel === 1 ? activeBet1 : activeBet2;
    if (amount > 0) {
       addMoney(amount, `Aviator Bet ${panel} Cancelled`);
       if (panel === 1) setActiveBet1(0);
       else setActiveBet2(0);
    }
  };

  const cashOut = (panel: 1 | 2) => {
    if (gameState !== 'FLYING') return;
    
    const betAmount = panel === 1 ? activeBet1 : activeBet2;
    if (betAmount > 0) {
      const winAmount = Math.floor(betAmount * multiplier);
      if (panel === 1) {
        setWin1(winAmount);
        setActiveBet1(0);
      } else {
        setWin2(winAmount);
        setActiveBet2(0);
      }
      addMoney(winAmount, `Aviator Cash Out at ${multiplier.toFixed(2)}x`);
    }
  };

  const getMultiplierColor = (mult: number) => {
    if (mult < 2) return 'text-blue-400';
    if (mult < 10) return 'text-purple-400';
    return 'text-yellow-400';
  };

  const getMultiplierBg = (mult: number) => {
    if (mult < 2) return 'bg-blue-900/30 border-blue-500/30';
    if (mult < 10) return 'bg-purple-900/30 border-purple-500/30';
    return 'bg-yellow-900/30 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.3)]';
  };

  // Calculate responsive coordinates for the plane and flight path based on current multiplier
  const progress = 1 - Math.pow(0.85, multiplier - 1);
  const planeLeft = progress * 75; // Cap at 75% width
  const planeTop = 90 - (progress * 70); // Starts at 90% (bottom), goes up to 20%
  const planeRotate = -progress * 25;

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#0a0a0c] relative flex flex-col shadow-[0_0_50px_rgba(239,68,68,0.1)] border-x border-white/5">
        
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 bg-black/80 backdrop-blur-md border-b border-white/10 shrink-0 z-20">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-red-500" />
          </button>
          
          <div className="flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Aviator_logo.svg/1024px-Aviator_logo.svg.png" alt="Aviator" className="h-4 opacity-80 mix-blend-screen grayscale" style={{ filter: 'brightness(100) sepia(1) hue-rotate(-50deg) saturate(5)'}} />
            <span className="font-black text-red-500 tracking-widest uppercase italic">Aviator</span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Balance</span>
            <span className="text-xs font-black text-white">₹{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* History Ticker */}
        <div className="h-8 bg-black/50 border-b border-white/5 flex items-center px-2 gap-2 overflow-x-auto scrollbar-hide shrink-0 z-20">
          {history.map((multStr, i) => {
             const m = parseFloat(multStr);
             return (
               <div key={i} className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 border ${getMultiplierBg(m)} ${getMultiplierColor(m)}`}>
                 {multStr}x
               </div>
             )
          })}
        </div>

        {/* Main Cinematic Flight Area */}
        <div className="flex-1 relative flex flex-col overflow-hidden bg-black z-10">
          {/* Background Grid & Stars */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-red-900/20 to-transparent" />
          
          {/* Grid lines moving */}
          {gameState === 'FLYING' && (
            <motion.div 
              animate={{ backgroundPosition: ['0px 0px', '-50px 50px'] }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
          )}

          {/* Center Multiplier / Status */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
            {gameState === 'WAITING' && (
              <div className="flex flex-col items-center">
                <motion.div 
                   animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                   transition={{ repeat: Infinity, duration: 2 }}
                   className="text-4xl font-black text-white/50 mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  WAITING...
                </motion.div>
                <div className="text-xl font-bold text-red-500 font-mono bg-black/60 px-4 py-1 rounded-full border border-red-500/30">
                  {waitTimer.toFixed(1)}s
                </div>
              </div>
            )}
            
            {gameState === 'FLYING' && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: Math.min(1 + multiplier * 0.05, 2), opacity: 1 }}
                className="text-7xl font-black font-mono tracking-tighter drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] text-transparent bg-clip-text bg-gradient-to-b from-white via-red-100 to-red-500"
              >
                {multiplier.toFixed(2)}x
              </motion.div>
            )}
            
            {gameState === 'CRASHED' && (
              <motion.div 
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="text-6xl font-black font-mono tracking-tighter text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,1)]">
                  {targetCrash.toFixed(2)}x
                </div>
                <div className="text-xl font-black text-red-500 uppercase tracking-widest mt-2 bg-red-950/80 px-6 py-2 rounded border border-red-500">
                  Flew Away!
                </div>
              </motion.div>
            )}
          </div>

          {/* Plane & Flight Path */}
          {(gameState === 'FLYING' || gameState === 'CRASHED') && (
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                {gameState === 'FLYING' && (
                  <path
                    d={`M 0,100 Q ${planeLeft * 0.5},100 ${planeLeft},${planeTop}`}
                    fill="none"
                    stroke="rgba(239, 68, 68, 0.5)"
                    strokeWidth="2"
                    strokeDasharray="2,2"
                  />
                )}
              </svg>
              
              <div
                className="absolute w-24 h-12 transition-all duration-100 ease-out"
                style={{ 
                  left: `${planeLeft}%`, 
                  top: `${planeTop}%`,
                  transform: `translate(-50%, -50%) rotate(${planeRotate}deg)`,
                  transformOrigin: 'center center' 
                }}
              >
                {gameState === 'CRASHED' ? (
                  <motion.div 
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-20 h-20 bg-red-500 rounded-full blur-xl" />
                    <Sparkles className="absolute w-12 h-12 text-yellow-500" />
                  </motion.div>
                ) : (
                  <>
                    <img src="https://cdn3d.iconscout.com/3d/premium/thumb/airplane-4993623-4161730.png" className="w-full h-full object-contain filter drop-shadow-[0_10px_10px_rgba(239,68,68,0.5)]" />
                    {/* Engine exhaust */}
                    <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-8 h-3 bg-gradient-to-r from-transparent via-orange-500 to-yellow-300 blur-sm rounded-full animate-pulse rotate-12" />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Screen Flash on Crash */}
          {gameState === 'CRASHED' && (
             <motion.div 
               initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 1 }}
               className="absolute inset-0 bg-red-600 pointer-events-none z-30 mix-blend-overlay"
             />
          )}

        </div>

        {/* Dual Betting Console */}
        <div className="bg-[#121215] z-20 shrink-0 p-2 pb-6 border-t border-red-900/30 shadow-[0_-20px_40px_rgba(0,0,0,0.9)] flex flex-col gap-2">
          
          {/* Panel 1 */}
          <div className="bg-black/40 rounded-xl border border-white/5 p-2 flex flex-col">
            <div className="flex gap-2 mb-2">
              <div className="flex-1 flex items-center bg-black/60 rounded-lg border border-white/10 px-2">
                <button onClick={() => setBet1Amount(Math.max(10, bet1Amount - 10))} disabled={activeBet1 > 0} className="p-1 text-gray-400 hover:text-white disabled:opacity-30"><Minus className="w-4 h-4"/></button>
                <input 
                  type="number" 
                  value={bet1Amount} 
                  onChange={(e) => setBet1Amount(Number(e.target.value))}
                  disabled={activeBet1 > 0}
                  className="w-full bg-transparent text-center font-bold text-white text-sm outline-none"
                />
                <button onClick={() => setBet1Amount(bet1Amount + 10)} disabled={activeBet1 > 0} className="p-1 text-gray-400 hover:text-white disabled:opacity-30"><Plus className="w-4 h-4"/></button>
              </div>
              
              <div className="grid grid-cols-2 gap-1 flex-1">
                <button onClick={() => setBet1Amount(100)} disabled={activeBet1 > 0} className="bg-[#1a1a20] rounded border border-white/5 text-[10px] font-bold text-gray-300 disabled:opacity-30">100</button>
                <button onClick={() => setBet1Amount(500)} disabled={activeBet1 > 0} className="bg-[#1a1a20] rounded border border-white/5 text-[10px] font-bold text-gray-300 disabled:opacity-30">500</button>
                <button onClick={() => setBet1Amount(1000)} disabled={activeBet1 > 0} className="bg-[#1a1a20] rounded border border-white/5 text-[10px] font-bold text-gray-300 disabled:opacity-30">1000</button>
                <button onClick={() => setBet1Amount(5000)} disabled={activeBet1 > 0} className="bg-[#1a1a20] rounded border border-white/5 text-[10px] font-bold text-gray-300 disabled:opacity-30">5000</button>
              </div>
            </div>

            {gameState === 'WAITING' ? (
              activeBet1 > 0 ? (
                <button onClick={() => cancelBet(1)} className="w-full py-2.5 rounded-lg font-black text-sm uppercase tracking-widest bg-red-900/80 text-red-300 border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                  Cancel Betting
                </button>
              ) : (
                <button onClick={() => placeBet(1)} className="w-full py-2.5 rounded-lg font-black text-sm uppercase tracking-widest bg-green-600 text-white border border-green-400 shadow-[0_0_20px_rgba(22,163,74,0.4)] hover:bg-green-500">
                  Bet <span className="text-green-200">₹{bet1Amount}</span>
                </button>
              )
            ) : gameState === 'FLYING' ? (
              activeBet1 > 0 ? (
                <button onClick={() => cashOut(1)} className="w-full py-2.5 rounded-lg font-black text-lg uppercase tracking-widest bg-orange-500 text-white border border-orange-300 shadow-[0_0_30px_rgba(249,115,22,0.6)] animate-pulse flex flex-col items-center leading-tight">
                  <span>Cash Out</span>
                  <span className="text-[10px] text-orange-200">₹{Math.floor(activeBet1 * multiplier)}</span>
                </button>
              ) : win1 > 0 ? (
                <div className="w-full py-2.5 rounded-lg font-black text-sm uppercase tracking-widest bg-black text-green-400 border border-green-500/50 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Won ₹{win1}
                </div>
              ) : (
                <button disabled className="w-full py-2.5 rounded-lg font-black text-sm uppercase tracking-widest bg-gray-800 text-gray-500 border border-gray-700">
                  Waiting...
                </button>
              )
            ) : (
              <button disabled className="w-full py-2.5 rounded-lg font-black text-sm uppercase tracking-widest bg-gray-800 text-gray-500 border border-gray-700">
                Next Round
              </button>
            )}
          </div>

          {/* Panel 2 */}
          <div className="bg-black/40 rounded-xl border border-white/5 p-2 flex flex-col opacity-90">
            <div className="flex gap-2 mb-2">
              <div className="flex-1 flex items-center bg-black/60 rounded-lg border border-white/10 px-2">
                <button onClick={() => setBet2Amount(Math.max(10, bet2Amount - 10))} disabled={activeBet2 > 0} className="p-1 text-gray-400 hover:text-white disabled:opacity-30"><Minus className="w-4 h-4"/></button>
                <input 
                  type="number" 
                  value={bet2Amount} 
                  onChange={(e) => setBet2Amount(Number(e.target.value))}
                  disabled={activeBet2 > 0}
                  className="w-full bg-transparent text-center font-bold text-white text-sm outline-none"
                />
                <button onClick={() => setBet2Amount(bet2Amount + 10)} disabled={activeBet2 > 0} className="p-1 text-gray-400 hover:text-white disabled:opacity-30"><Plus className="w-4 h-4"/></button>
              </div>
              
              <div className="grid grid-cols-2 gap-1 flex-1">
                <button onClick={() => setBet2Amount(100)} disabled={activeBet2 > 0} className="bg-[#1a1a20] rounded border border-white/5 text-[10px] font-bold text-gray-300 disabled:opacity-30">100</button>
                <button onClick={() => setBet2Amount(500)} disabled={activeBet2 > 0} className="bg-[#1a1a20] rounded border border-white/5 text-[10px] font-bold text-gray-300 disabled:opacity-30">500</button>
                <button onClick={() => setBet2Amount(1000)} disabled={activeBet2 > 0} className="bg-[#1a1a20] rounded border border-white/5 text-[10px] font-bold text-gray-300 disabled:opacity-30">1000</button>
                <button onClick={() => setBet2Amount(5000)} disabled={activeBet2 > 0} className="bg-[#1a1a20] rounded border border-white/5 text-[10px] font-bold text-gray-300 disabled:opacity-30">5000</button>
              </div>
            </div>

            {gameState === 'WAITING' ? (
              activeBet2 > 0 ? (
                <button onClick={() => cancelBet(2)} className="w-full py-2.5 rounded-lg font-black text-sm uppercase tracking-widest bg-red-900/80 text-red-300 border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                  Cancel Betting
                </button>
              ) : (
                <button onClick={() => placeBet(2)} className="w-full py-2.5 rounded-lg font-black text-sm uppercase tracking-widest bg-green-600/80 text-white border border-green-500 hover:bg-green-500">
                  Bet <span className="text-green-200">₹{bet2Amount}</span>
                </button>
              )
            ) : gameState === 'FLYING' ? (
              activeBet2 > 0 ? (
                <button onClick={() => cashOut(2)} className="w-full py-2.5 rounded-lg font-black text-lg uppercase tracking-widest bg-orange-500 text-white border border-orange-300 shadow-[0_0_30px_rgba(249,115,22,0.6)] animate-pulse flex flex-col items-center leading-tight">
                  <span>Cash Out</span>
                  <span className="text-[10px] text-orange-200">₹{Math.floor(activeBet2 * multiplier)}</span>
                </button>
              ) : win2 > 0 ? (
                <div className="w-full py-2.5 rounded-lg font-black text-sm uppercase tracking-widest bg-black text-green-400 border border-green-500/50 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Won ₹{win2}
                </div>
              ) : (
                <button disabled className="w-full py-2.5 rounded-lg font-black text-sm uppercase tracking-widest bg-gray-800/80 text-gray-500 border border-gray-700">
                  Waiting...
                </button>
              )
            ) : (
              <button disabled className="w-full py-2.5 rounded-lg font-black text-sm uppercase tracking-widest bg-gray-800/80 text-gray-500 border border-gray-700">
                Next Round
              </button>
            )}
          </div>
          
        </div>
        
      </div>
    </div>
  );
};

// Quick mock for CheckCircle2 missing from lucide-react import list
const CheckCircle2 = ({className}: {className?: string}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
)

export default AviatorGame;
