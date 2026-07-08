import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Minus, Check, Menu, Wallet } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import FakePlayersPanel from './FakePlayersPanel';
import { fetchGameSettings } from '../../api/client';

interface AviatorGameProps {
  onBack: () => void;
}

type GameState = 'WAITING' | 'FLYING' | 'CRASHED';

interface CashoutNotification {
  id: number;
  mult: number;
  amount: number;
}

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
  const [bet1Amount, setBet1Amount] = useState(100);
  const [bet2Amount, setBet2Amount] = useState(10);
  
  const [activeBet1, setActiveBet1] = useState(0); 
  const [activeBet2, setActiveBet2] = useState(0);
  
  const [hasBet1ThisRound, setHasBet1ThisRound] = useState(false);
  const [hasBet2ThisRound, setHasBet2ThisRound] = useState(false);

  const [waitTimer, setWaitTimer] = useState(5.0);
  const [notifications, setNotifications] = useState<CashoutNotification[]>([]);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const multiplierRef = useRef<number>(1.00);

  // Sound Synth class instance placeholder
  const audioSynthRef = useRef<any>(null);

  // UFC Player count state
  const [onlinePlayers, setOnlinePlayers] = useState(328);

  // Global Win Percentage
  const [winPercentage, setWinPercentage] = useState(50);

  useEffect(() => {
    fetchGameSettings().then(res => {
      if (res && res.winPercentage) {
        setWinPercentage(res.winPercentage);
      }
    }).catch(e => console.error("Failed to fetch win percentage:", e));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlinePlayers(prev => {
        const delta = Math.floor(Math.random() * 21) - 10;
        return Math.max(100, prev + delta);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameState === 'WAITING') {
      setHasBet1ThisRound(false);
      setHasBet2ThisRound(false);
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
    // Generate crash point based on global win percentage
    const r = Math.random();
    let crash = 1.01;
    
    // Default config logic (50%)
    let quickCrashProb = 0.12;
    let midCrashProb = 0.50;
    let highCrashProb = 0.80;
    let hugeCrashProb = 0.95;

    // Shift curve based on winPercentage (0 to 100)
    // If winPercentage > 50, fewer quick crashes, more huge crashes
    if (winPercentage > 50) {
      const bonus = (winPercentage - 50) / 100; // up to 0.5
      quickCrashProb = Math.max(0.01, quickCrashProb - bonus); // less early crashes
      midCrashProb = Math.max(0.1, midCrashProb - (bonus / 2)); 
      highCrashProb = Math.min(0.95, highCrashProb - (bonus / 2)); // push more to upper brackets
    } else if (winPercentage < 50) {
      const penalty = (50 - winPercentage) / 100; // up to 0.5
      quickCrashProb = Math.min(0.5, quickCrashProb + penalty); // more early crashes
      midCrashProb = Math.min(0.8, midCrashProb + penalty);
    }

    if (r < quickCrashProb) crash = 1.01 + Math.random() * 0.15; 
    else if (r < midCrashProb) crash = 1.16 + Math.random() * 1.24; 
    else if (r < highCrashProb) crash = 2.4 + Math.random() * 2.6; 
    else if (r < hugeCrashProb) crash = 5.0 + Math.random() * 5.0; 
    else crash = 10.0 + Math.random() * 30.0; 
    
    setTargetCrash(crash);
    setMultiplier(1.00);
    multiplierRef.current = 1.00;
    setGameState('FLYING');
    
    startTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(updateMultiplier);
  };

  const updateMultiplier = (time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    const elapsed = (time - startTimeRef.current) / 1000;
    
    // Smooth flight curve acceleration, strictly capped at targetCrash
    const currentMult = Math.min(Math.pow(1.028, elapsed * 6.5), targetCrash);
    multiplierRef.current = currentMult;
    
    if (currentMult >= targetCrash) {
      setMultiplier(targetCrash);
      setGameState('CRASHED');
      setActiveBet1(0); 
      setActiveBet2(0);
      setHistory(prev => [targetCrash.toFixed(2), ...prev].slice(0, 15));
      setTimeout(() => {
        setWaitTimer(5.0);
        setGameState('WAITING');
      }, 3500); 
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
    const amount = panel === 1 ? bet1Amount : bet2Amount;
    
    if (balance < amount) {
      alert("Insufficient balance");
      return;
    }
    
    if (deductMoney(amount, `Udan Jahaj Bet ${panel}`)) {
      if (panel === 1) {
        setActiveBet1(amount);
        setHasBet1ThisRound(true);
      } else {
        setActiveBet2(amount);
        setHasBet2ThisRound(true);
      }
    }
  };

  const cancelBet = (panel: 1 | 2) => {
    const amount = panel === 1 ? activeBet1 : activeBet2;
    if (amount > 0) {
      addMoney(amount, `Udan Jahaj Bet ${panel} Cancelled`);
      if (panel === 1) {
        setActiveBet1(0);
        setHasBet1ThisRound(false);
      } else {
        setActiveBet2(0);
        setHasBet2ThisRound(false);
      }
    }
  };

  const cashOut = (panel: 1 | 2) => {
    if (gameState !== 'FLYING') return;
    
    const betVal = panel === 1 ? activeBet1 : activeBet2;
    if (betVal > 0) {
      const currentLiveMult = multiplierRef.current;
      const winVal = Math.floor(betVal * currentLiveMult);
      if (panel === 1) {
        setActiveBet1(0);
      } else {
        setActiveBet2(0);
      }
      addMoney(winVal, `Udan Jahaj Cash Out at ${currentLiveMult.toFixed(2)}x`);

      // Add notification
      const newNotif: CashoutNotification = {
        id: Date.now() + Math.random(),
        mult: currentLiveMult,
        amount: winVal
      };
      setNotifications(prev => [...prev, newNotif]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
      }, 3000);
    }
  };

  const getMultiplierColor = (mult: number) => {
    if (mult < 2.00) return 'text-[#9c59f6]';
    if (mult < 10.00) return 'text-[#c21bcf]';
    return 'text-[#fbbe24]';
  };

  const getMultiplierBg = (mult: number) => {
    if (mult < 2.00) return 'bg-[#2a2b36] border-[#313243]';
    if (mult < 10.00) return 'bg-[#c21bcf]/10 border-[#c21bcf]/20';
    return 'bg-[#fbbe24]/10 border-[#fbbe24]/20';
  };

  // Curved flight coordinates
  const progress = 1 - Math.pow(0.85, multiplier - 1);
  const planeLeft = progress * 75; 
  const planeTop = 90 - (progress * 70); 
  const planeRotate = -progress * 25;

  return (
    <div className="fixed inset-0 z-50 bg-[#060608] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-sm h-full bg-[#0a0a0c] relative flex flex-col shadow-[0_0_60px_rgba(239,68,68,0.08)] border-x border-white/5">
        
        {/* Floating Cashout Notifications */}
        <div className="absolute top-16 left-4 right-4 z-40 flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {notifications.map(notif => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#2cba00]/95 border border-[#40e000] p-2.5 rounded-xl shadow-xl flex items-center justify-between pointer-events-auto"
              >
                <div>
                  <div className="text-[9px] text-green-100 uppercase tracking-widest font-black">You have cashed out!</div>
                  <div className="text-[10px] text-white font-bold">{notif.mult.toFixed(2)}x</div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] text-green-200 font-bold uppercase">WIN INR</div>
                  <div className="text-sm font-black text-white">₹{notif.amount.toLocaleString()}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Header */}
        <div className="h-12 flex items-center justify-between px-3 bg-[#1b1c24] border-b border-black/40 shrink-0 z-20">
          <button onClick={onBack} className="p-1 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4 text-red-500" />
          </button>
          
          <div className="flex items-center gap-1.5">
            <span className="font-black text-red-500 tracking-wider text-base uppercase italic">Aviator</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#2cba00]/10 px-2.5 py-0.5 rounded-full border border-[#2cba00]/30">
              <Wallet className="w-3.5 h-3.5 text-[#2cba00]" />
              <span className="text-xs font-black text-[#2cba00]">₹{balance.toLocaleString()}</span>
            </div>
            <Menu className="w-4 h-4 text-gray-400 cursor-pointer" />
          </div>
        </div>

        {/* Multiplier History log */}
        <div className="h-8 bg-[#0b0b0d] border-b border-white/5 flex items-center px-2.5 gap-1.5 overflow-x-auto scrollbar-hide shrink-0 z-20">
          {history.map((multStr, i) => {
             const m = parseFloat(multStr);
             return (
               <div key={i} className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 border ${getMultiplierBg(m)} ${getMultiplierColor(m)}`}>
                 {multStr}x
               </div>
             )
          })}
        </div>

        {/* Main Graph Flight Area */}
        <div className="flex-1 relative flex flex-col overflow-hidden bg-[#07070a] z-10 select-none">
          {/* Radial Sunburst lines */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_80%)]" />
          <div className="absolute bottom-0 w-full h-[50%] bg-gradient-to-t from-red-600/10 to-transparent pointer-events-none" />
          
          {/* Moving Grid Background */}
          {gameState === 'FLYING' && (
            <motion.div 
              animate={{ backgroundPosition: ['0px 0px', '-40px 40px'] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="absolute inset-0 opacity-15"
              style={{ 
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', 
                backgroundSize: '24px 24px' 
              }}
            />
          )}

          {/* Spribe Aviator Banner in Center background */}
          <div className="absolute top-[20%] left-0 right-0 flex flex-col items-center justify-center opacity-30 pointer-events-none select-none z-0 scale-90">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-white font-black italic text-lg tracking-wider">Aviator</span>
            </div>
            <div className="bg-black/80 px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1 text-[7px] font-black text-green-400 uppercase tracking-widest shadow-lg">
              <span className="bg-[#2cba00] p-0.5 rounded-full text-black"><Check className="w-1.5 h-1.5 text-black" strokeWidth={5} /></span>
              <span>SPRIBE Official Game Since 2018</span>
            </div>
          </div>

          {/* Live Flight HUD */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
            {gameState === 'WAITING' && (
              <div className="flex flex-col items-center">
                {/* Visual airplane loop before start */}
                <motion.div 
                   animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                   transition={{ repeat: Infinity, duration: 1.5 }}
                   className="text-2xl font-black text-white/40 uppercase tracking-widest mb-1 shadow-sm"
                >
                  WAITING...
                </motion.div>
                <div className="text-sm font-bold text-red-500 font-mono bg-black/60 px-3 py-0.5 rounded-full border border-red-500/20">
                  {waitTimer.toFixed(1)}s
                </div>
              </div>
            )}
            
            {gameState === 'FLYING' && (
              <motion.div 
                animate={{ scale: Math.min(1 + multiplier * 0.05, 1.8) }}
                className="text-6xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {multiplier.toFixed(2)}x
              </motion.div>
            )}
            
            {gameState === 'CRASHED' && (
              <motion.div 
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="text-5xl font-black font-mono tracking-tighter text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
                  {targetCrash.toFixed(2)}x
                </div>
                <div className="text-[11px] font-black text-red-500 uppercase tracking-wider mt-1 bg-red-950/80 px-4 py-1 rounded border border-red-500/30">
                  Flew Away!
                </div>
              </motion.div>
            )}
          </div>

          {/* Plane & Path Graphics */}
          {(gameState === 'FLYING' || gameState === 'CRASHED') && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                {gameState === 'FLYING' && (
                  <motion.path
                    d={`M 0,90 Q ${planeLeft * 0.4},90 ${planeLeft},${planeTop}`}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                  />
                )}
              </svg>
              
              <div
                className="absolute w-16 h-10 transition-all duration-75 ease-out"
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
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-12 h-12 bg-red-500 rounded-full blur-lg opacity-60" />
                  </motion.div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Plane SVG silhouette profile */}
                    <svg className="w-14 h-10 text-red-500 fill-current filter drop-shadow-[0_4px_6px_rgba(239,68,68,0.5)]" viewBox="0 0 64 64">
                      <path d="M60.6,31.7c-0.6-0.8-1.5-1.3-2.6-1.3l-8.5-0.1c-1-2.9-3.2-8.5-6.7-14.7c-0.9-1.6-2.5-2.6-4.3-2.6h-5.2c-0.8,0-1.5,0.4-1.9,1.1c-0.4,0.7-0.4,1.5-0.1,2.2c1.9,4.2,3.9,9.4,5,13.8L22,30.1L12.5,21c-0.6-0.6-1.4-0.9-2.2-0.9H5.1c-0.8,0-1.5,0.4-1.9,1.1c-0.4,0.7-0.4,1.5-0.1,2.2c1.4,3.1,3,7.2,3.7,10L4.1,35c-0.8,0.3-1.4,1-1.6,1.8C2.3,37.6,2.5,38.5,3.1,39l6.5,5.6c0.5,0.4,1.1,0.6,1.7,0.6H17c0.8,0,1.5-0.4,1.9-1.1c0.4-0.7,0.4-1.5,0.1-2.2c-0.9-2-1.9-4.2-2.5-5.9l9.3-0.1l7.8,11c0.6,0.8,1.5,1.3,2.6,1.3h4.9c0.8,0,1.5-0.4,1.9-1.1c0.4-0.7,0.4-1.5,0.1-2.2c-1.9-4.2-4.1-9.3-5.2-13.4l8.2-0.1c1,0.1,2.4,0.3,3.7,0.9c1,0.5,2.1,0.7,3.2,0.7h5.1c1.1,0,2-0.5,2.6-1.3C61.2,34.8,61.2,32.7,60.6,31.7z" />
                    </svg>
                    {/* Exhause fire trail */}
                    <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-4 h-1.5 bg-gradient-to-r from-transparent via-orange-500 to-yellow-300 blur-[1px] rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active online players count in bottom corner of HUD */}
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/10 flex items-center gap-1 text-[8px] font-black text-gray-300 z-20">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span>{onlinePlayers} players online</span>
          </div>

          {/* Screen Flash on crash */}
          {gameState === 'CRASHED' && (
             <motion.div 
               initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 1 }}
               className="absolute inset-0 bg-red-600 pointer-events-none z-30 mix-blend-overlay"
             />
          )}
        </div>

        {/* Dual Betting Console Panel */}
        <div className="bg-[#101115] z-20 shrink-0 p-2.5 pb-4 border-t border-white/5 flex flex-col gap-2.5">

          {/* Live Players Feed */}
          <FakePlayersPanel showMultiplier={true} maxVisible={6} label="Live Bets" />

          
          {/* Panel 1 */}
          <div className="bg-[#1b1c24] rounded-2xl border border-white/5 p-2 flex flex-col">
            <div className="flex justify-between items-center px-1 mb-1.5">
              <div className="flex bg-black/35 rounded-full p-0.5 border border-white/5">
                <button className="text-[8px] font-black px-3.5 py-0.5 rounded-full bg-[#1b1c24] text-white">Bet</button>
                <button className="text-[8px] font-black px-3.5 py-0.5 rounded-full text-gray-500">Auto</button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-1">
                {/* Counter Input */}
                <div className="flex items-center bg-black/45 rounded-xl border border-white/5 px-2 py-1 relative">
                  <button onClick={() => setBet1Amount(Math.max(10, bet1Amount - 100))} disabled={activeBet1 > 0} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"><Minus className="w-3.5 h-3.5"/></button>
                  <input 
                    type="number" 
                    value={bet1Amount} 
                    onChange={(e) => setBet1Amount(Number(e.target.value))}
                    disabled={activeBet1 > 0}
                    className="w-full bg-transparent text-center font-black text-white text-xs outline-none"
                  />
                  <button onClick={() => setBet1Amount(bet1Amount + 100)} disabled={activeBet1 > 0} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"><Plus className="w-3.5 h-3.5"/></button>
                </div>

                {/* Quick Chips selection grid */}
                <div className="grid grid-cols-4 gap-1">
                  {[100, 200, 500, 1000].map(val => (
                    <button key={val} onClick={() => setBet1Amount(val)} disabled={activeBet1 > 0} className="bg-black/30 rounded border border-white/5 text-[8px] font-black py-1 text-gray-400 hover:text-white disabled:opacity-20 transition-all">
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* LARGE green/red/orange button */}
              <div className="flex-1">
                {gameState === 'WAITING' ? (
                  activeBet1 > 0 ? (
                    <button onClick={() => cancelBet(1)} className="w-full h-[62px] rounded-2xl font-black text-xs uppercase tracking-widest bg-red-600 border-b-4 border-red-800 text-white shadow-lg active:border-b-0 active:translate-y-[2px] transition-all flex flex-col items-center justify-center leading-none">
                      <span className="text-[13px] tracking-wide mb-0.5">Cancel</span>
                      <span className="text-[7px] text-red-200">Waiting for next round</span>
                    </button>
                  ) : (
                    <button onClick={() => placeBet(1)} className="w-full h-[62px] rounded-2xl font-black text-xs uppercase tracking-widest bg-[#2cba00] border-b-4 border-green-800 text-white shadow-lg hover:brightness-110 active:border-b-0 active:translate-y-[2px] transition-all flex flex-col items-center justify-center leading-none">
                      <span className="text-[14px] tracking-widest mb-0.5">Bet</span>
                      <span className="text-[8px] text-green-100">₹{bet1Amount.toFixed(2)}</span>
                    </button>
                  )
                ) : gameState === 'FLYING' ? (
                  activeBet1 > 0 ? (
                    <button onClick={() => cashOut(1)} className="w-full h-[62px] rounded-2xl font-black text-xs uppercase tracking-widest bg-gradient-to-b from-[#ff8c00] to-[#e06c00] border-b-4 border-amber-800 text-white shadow-lg active:border-b-0 active:translate-y-[2px] transition-all flex flex-col items-center justify-center leading-none">
                      <span className="text-[13px] tracking-wider mb-0.5">Cash Out</span>
                      <span className="text-[8px] text-orange-100">₹{Math.floor(activeBet1 * multiplier)}</span>
                    </button>
                  ) : hasBet1ThisRound ? (
                    <div className="w-full h-[62px] rounded-2xl font-black text-[9px] uppercase tracking-widest bg-black/40 text-green-400 border border-green-500/20 flex flex-col items-center justify-center leading-none">
                      <span>Cashed out!</span>
                    </div>
                  ) : (
                    <button disabled className="w-full h-[62px] rounded-2xl font-black text-[9px] uppercase tracking-widest bg-gray-800/40 text-gray-500 border border-gray-700 flex items-center justify-center leading-none">
                      Waiting for round
                    </button>
                  )
                ) : (
                  <button disabled className="w-full h-[62px] rounded-2xl font-black text-[9px] uppercase tracking-widest bg-[#2cba00]/30 text-green-800/40 border border-transparent flex items-center justify-center leading-none">
                    Next Round
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Panel 2 */}
          <div className="bg-[#1b1c24] rounded-2xl border border-white/5 p-2 flex flex-col">
            <div className="flex justify-between items-center px-1 mb-1.5">
              <div className="flex bg-black/35 rounded-full p-0.5 border border-white/5">
                <button className="text-[8px] font-black px-3.5 py-0.5 rounded-full bg-[#1b1c24] text-white">Bet</button>
                <button className="text-[8px] font-black px-3.5 py-0.5 rounded-full text-gray-500">Auto</button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-1">
                {/* Counter Input */}
                <div className="flex items-center bg-black/45 rounded-xl border border-white/5 px-2 py-1 relative">
                  <button onClick={() => setBet2Amount(Math.max(10, bet2Amount - 100))} disabled={activeBet2 > 0} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"><Minus className="w-3.5 h-3.5"/></button>
                  <input 
                    type="number" 
                    value={bet2Amount} 
                    onChange={(e) => setBet2Amount(Number(e.target.value))}
                    disabled={activeBet2 > 0}
                    className="w-full bg-transparent text-center font-black text-white text-xs outline-none"
                  />
                  <button onClick={() => setBet2Amount(bet2Amount + 100)} disabled={activeBet2 > 0} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"><Plus className="w-3.5 h-3.5"/></button>
                </div>

                {/* Quick Chips selection grid */}
                <div className="grid grid-cols-4 gap-1">
                  {[100, 200, 500, 1000].map(val => (
                    <button key={val} onClick={() => setBet2Amount(val)} disabled={activeBet2 > 0} className="bg-black/30 rounded border border-white/5 text-[8px] font-black py-1 text-gray-400 hover:text-white disabled:opacity-20 transition-all">
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* LARGE green/red/orange button */}
              <div className="flex-1">
                {gameState === 'WAITING' ? (
                  activeBet2 > 0 ? (
                    <button onClick={() => cancelBet(2)} className="w-full h-[62px] rounded-2xl font-black text-xs uppercase tracking-widest bg-red-600 border-b-4 border-red-800 text-white shadow-lg active:border-b-0 active:translate-y-[2px] transition-all flex flex-col items-center justify-center leading-none">
                      <span className="text-[13px] tracking-wide mb-0.5">Cancel</span>
                      <span className="text-[7px] text-red-200">Waiting for next round</span>
                    </button>
                  ) : (
                    <button onClick={() => placeBet(2)} className="w-full h-[62px] rounded-2xl font-black text-xs uppercase tracking-widest bg-[#2cba00] border-b-4 border-green-800 text-white shadow-lg hover:brightness-110 active:border-b-0 active:translate-y-[2px] transition-all flex flex-col items-center justify-center leading-none">
                      <span className="text-[14px] tracking-widest mb-0.5">Bet</span>
                      <span className="text-[8px] text-green-100">₹{bet2Amount.toFixed(2)}</span>
                    </button>
                  )
                ) : gameState === 'FLYING' ? (
                  activeBet2 > 0 ? (
                    <button onClick={() => cashOut(2)} className="w-full h-[62px] rounded-2xl font-black text-xs uppercase tracking-widest bg-gradient-to-b from-[#ff8c00] to-[#e06c00] border-b-4 border-amber-800 text-white shadow-lg active:border-b-0 active:translate-y-[2px] transition-all flex flex-col items-center justify-center leading-none">
                      <span className="text-[13px] tracking-wider mb-0.5">Cash Out</span>
                      <span className="text-[8px] text-orange-100">₹{Math.floor(activeBet2 * multiplier)}</span>
                    </button>
                  ) : hasBet2ThisRound ? (
                    <div className="w-full h-[62px] rounded-2xl font-black text-[9px] uppercase tracking-widest bg-black/40 text-green-400 border border-green-500/20 flex flex-col items-center justify-center leading-none">
                      <span>Cashed out!</span>
                    </div>
                  ) : (
                    <button disabled className="w-full h-[62px] rounded-2xl font-black text-[9px] uppercase tracking-widest bg-gray-800/40 text-gray-500 border border-gray-700 flex items-center justify-center leading-none">
                      Waiting for round
                    </button>
                  )
                ) : (
                  <button disabled className="w-full h-[62px] rounded-2xl font-black text-[9px] uppercase tracking-widest bg-[#2cba00]/30 text-green-800/40 border border-transparent flex items-center justify-center leading-none">
                    Next Round
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
};

export default AviatorGame;
