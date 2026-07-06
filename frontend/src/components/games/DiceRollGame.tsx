import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Wallet, Settings, History, Dice1, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import FakePlayersPanel from './FakePlayersPanel';

interface DiceRollGameProps {
  onBack: () => void;
}

type GameState = 'BETTING' | 'ROLLING' | 'RESULT';
type Prediction = 'UNDER' | 'EXACT' | 'OVER' | null;

const CHIPS = [10, 50, 100, 500, 1000];

// A helper component to render a realistic 3D dice face
const DiceFace = ({ value }: { value: number }) => {
  const dots = {
    1: ['center'],
    2: ['top-right', 'bottom-left'],
    3: ['top-right', 'center', 'bottom-left'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
  }[value as 1|2|3|4|5|6] || [];

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] border border-gray-200 relative p-2">
      {dots.map(pos => {
        let positionClass = "";
        if (pos === 'center') positionClass = "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
        if (pos === 'top-left') positionClass = "top-2 left-2";
        if (pos === 'top-right') positionClass = "top-2 right-2";
        if (pos === 'bottom-left') positionClass = "bottom-2 left-2";
        if (pos === 'bottom-right') positionClass = "bottom-2 right-2";
        if (pos === 'middle-left') positionClass = "top-1/2 left-2 -translate-y-1/2";
        if (pos === 'middle-right') positionClass = "top-1/2 right-2 -translate-y-1/2";

        return (
          <div 
            key={pos} 
            className={`absolute w-3 h-3 bg-red-600 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] ${positionClass}`} 
          />
        );
      })}
    </div>
  );
};

const DiceRollGame = ({ onBack }: DiceRollGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [gameState, setGameState] = useState<GameState>('BETTING');
  const [timeLeft, setTimeLeft] = useState(15);
  
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction>('UNDER');
  const [prediction, setPrediction] = useState<Prediction>(null);
  const [betAmount, setBetAmount] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  
  const [dice1, setDice1] = useState(3);
  const [dice2, setDice2] = useState(4);
  const [history, setHistory] = useState<number[]>([7, 4, 11, 2, 8, 7]);
  
  const [rollKey, setRollKey] = useState(0); // Used to re-trigger animations

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
      setRollKey(prev => prev + 1);
      
      // Simulate rolling
      setTimeout(() => {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const sum = d1 + d2;
        
        setDice1(d1);
        setDice2(d2);
        setHistory(prev => [sum, ...prev].slice(0, 10));
        
        // Evaluate Win
        if (prediction && betAmount > 0) {
          let multiplier = 0;
          if (prediction === 'UNDER' && sum < 7) multiplier = 2;
          else if (prediction === 'OVER' && sum > 7) multiplier = 2;
          else if (prediction === 'EXACT' && sum === 7) multiplier = 5.8; // High payout for exact 7

          if (multiplier > 0) {
            const won = Math.floor(betAmount * multiplier);
            setWinAmount(won);
            addMoney(won, `Neon Dice Win (${prediction})`);
          }
        }
        
        setGameState('RESULT');
      }, 3000); // 3 seconds rolling animation
    } else if (gameState === 'RESULT') {
      timer = setTimeout(() => {
        setBetAmount(0);
        setWinAmount(0);
        setPrediction(null);
        setTimeLeft(15);
        setGameState('BETTING');
      }, 5000); // 5s result viewing
    }

    return () => clearInterval(timer);
  }, [gameState]);

  const handleConfirmBet = () => {
    if (gameState !== 'BETTING') return;
    if (balance < selectedChip) {
      alert("Insufficient balance!");
      return;
    }
    
    if (prediction && prediction !== selectedPrediction) {
       alert("You can only bet on one prediction per round.");
       return;
    }
    
    if (deductMoney(selectedChip, `Neon Dice Bet (${selectedPrediction})`)) {
      setBetAmount(prev => prev + selectedChip);
      setPrediction(selectedPrediction);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#0d1117] relative flex flex-col shadow-[0_0_50px_rgba(0,191,255,0.1)] border-x border-white/5">
        
        {/* Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Table Surface Grid */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
          
          {/* Neon Edge Glows */}
          <div className="absolute top-[20%] left-0 w-[20%] h-[60%] bg-blue-500/20 blur-[80px]" />
          <div className="absolute top-[20%] right-0 w-[20%] h-[60%] bg-red-500/20 blur-[80px]" />
          
          {/* Center Spotlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-[50px]" />
        </div>

        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 bg-black/60 backdrop-blur-md border-b border-white/10 shrink-0 z-20">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-cyan-400" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <Wallet className="w-3 h-3 text-cyan-500" /> Balance
            </span>
            <span className="text-sm font-black text-white">₹{balance.toLocaleString()}</span>
          </div>
          
          <button className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 relative flex flex-col items-center justify-between z-10 px-4 py-4 min-h-0 overflow-y-auto scrollbar-hide">
          
          {/* Live Timer & Info */}
          <div className="w-full flex justify-between items-start mb-4">
            <div className="flex flex-col items-center bg-black/50 backdrop-blur-sm rounded-xl border border-white/10 p-3 min-w-[80px]">
               <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Status</span>
               <AnimatePresence mode="wait">
                 {gameState === 'BETTING' && (
                   <motion.div 
                     key="betting"
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="flex flex-col items-center"
                   >
                     <span className={`text-2xl font-black tabular-nums ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                       00:{timeLeft.toString().padStart(2, '0')}
                     </span>
                     <span className="text-[9px] text-white/50 uppercase mt-1">Place Bets</span>
                   </motion.div>
                 )}
                 {gameState !== 'BETTING' && (
                   <motion.div 
                     key="rolling"
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="text-sm font-black text-yellow-500 uppercase tracking-widest h-[40px] flex items-center"
                   >
                     {gameState === 'ROLLING' ? 'Rolling...' : 'Result'}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
            
            {/* History Ticker */}
            <div className="flex-1 ml-4 bg-black/40 backdrop-blur-sm border border-white/5 rounded-xl p-2 h-full flex flex-col justify-center overflow-hidden">
               <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase font-bold mb-1">
                 <History className="w-3 h-3" /> Recent Rolls
               </div>
               <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                 {history.map((sum, i) => (
                   <div key={i} className={`
                     w-7 h-7 shrink-0 rounded flex items-center justify-center text-xs font-black border shadow-sm
                     ${sum < 7 ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 
                       sum > 7 ? 'bg-red-500/20 text-red-400 border-red-500/50' : 
                       'bg-green-500/20 text-green-400 border-green-500/50'}
                   `}>
                     {sum}
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* 3D Dice Stage */}
          <div className="relative w-full h-[250px] flex items-center justify-center perspective-[1000px] mb-8">
            
            {/* Dice 1 */}
            <motion.div
              key={`dice1-${rollKey}`}
              className="absolute w-20 h-20 -ml-12 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]"
              initial={gameState === 'ROLLING' ? { y: -200, x: -100, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0.5 } : false}
              animate={gameState === 'ROLLING' ? { 
                y: [ -200, 50, -30, 20, 0 ], 
                x: [ -100, -20, -40, -30, -30 ],
                rotateX: [0, 720, 1080, 1440, 0], 
                rotateY: [0, 360, 720, 900, 0],
                rotateZ: [0, 180, 360, 540, (Math.random()-0.5)*45],
                scale: [0.5, 1.2, 1, 1, 1]
              } : { rotateZ: (Math.random()-0.5)*45, x: -30, y: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {gameState === 'ROLLING' ? (
                // Fast blur placeholder during roll
                <div className="w-full h-full bg-white rounded-xl shadow-xl border border-gray-200 flex items-center justify-center blur-[2px]">
                   <Dice1 className="w-12 h-12 text-red-600 animate-spin" />
                </div>
              ) : (
                <DiceFace value={dice1} />
              )}
            </motion.div>

            {/* Dice 2 */}
            <motion.div
              key={`dice2-${rollKey}`}
              className="absolute w-20 h-20 ml-12 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]"
              initial={gameState === 'ROLLING' ? { y: -250, x: 100, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0.5 } : false}
              animate={gameState === 'ROLLING' ? { 
                y: [ -250, 40, -20, 10, 0 ], 
                x: [ 100, 30, 50, 40, 40 ],
                rotateX: [0, -720, -1080, -1440, 0], 
                rotateY: [0, -360, -720, -900, 0],
                rotateZ: [0, -180, -360, -540, (Math.random()-0.5)*45],
                scale: [0.5, 1.2, 1, 1, 1]
              } : { rotateZ: (Math.random()-0.5)*45, x: 40, y: 0 }}
              transition={{ duration: 2.7, ease: "easeOut" }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {gameState === 'ROLLING' ? (
                <div className="w-full h-full bg-white rounded-xl shadow-xl border border-gray-200 flex items-center justify-center blur-[2px]">
                   <Dice1 className="w-12 h-12 text-red-600 animate-spin" style={{ animationDirection: 'reverse' }} />
                </div>
              ) : (
                <DiceFace value={dice2} />
              )}
            </motion.div>

            {/* Result Sum Overlay */}
            <AnimatePresence>
              {gameState === 'RESULT' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-12 bg-black/80 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center mb-1">Total Sum</div>
                  <div className="text-4xl font-black text-white text-center">{dice1 + dice2}</div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Win Amount Overlay */}
            <AnimatePresence>
              {gameState === 'RESULT' && winAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-16 z-50 flex flex-col items-center"
                >
                  <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest bg-black/80 px-4 py-1 rounded-full border border-yellow-500/50 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Winner!
                  </div>
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">
                    +₹{winAmount}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Prediction Betting Panel */}
          <div className="w-full grid grid-cols-3 gap-2">
            
            {/* UNDER 7 */}
            <button 
              onClick={() => setSelectedPrediction('UNDER')}
              disabled={gameState !== 'BETTING'}
              className={`
                relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all overflow-hidden
                ${selectedPrediction === 'UNDER' 
                  ? 'bg-blue-900/40 border-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.5),0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-black/40 border-white/5 hover:border-blue-500/30'}
                ${gameState !== 'BETTING' ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              `}
            >
              {selectedPrediction === 'UNDER' && <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500 blur-xl" />}
              <TrendingDown className={`w-6 h-6 mb-1 ${prediction === 'UNDER' ? 'text-blue-400' : 'text-gray-500'}`} />
              <div className="text-xl font-black text-white">2 - 6</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Under 7</div>
              <div className="text-xs text-blue-400 font-black mt-2 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">2x Payout</div>
              
              {prediction === 'UNDER' && betAmount > 0 && (
                <div className="absolute top-1 right-1 text-[9px] font-black bg-yellow-500 text-black px-1.5 rounded-sm">₹{betAmount}</div>
              )}
            </button>

            {/* EXACT 7 */}
            <button 
              onClick={() => setSelectedPrediction('EXACT')}
              disabled={gameState !== 'BETTING'}
              className={`
                relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all overflow-hidden
                ${selectedPrediction === 'EXACT' 
                  ? 'bg-green-900/40 border-green-500 shadow-[inset_0_0_20px_rgba(34,197,94,0.5),0_0_15px_rgba(34,197,94,0.3)]' 
                  : 'bg-black/40 border-white/5 hover:border-green-500/30'}
                ${gameState !== 'BETTING' ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              `}
            >
              {selectedPrediction === 'EXACT' && <div className="absolute top-0 right-0 w-8 h-8 bg-green-500 blur-xl" />}
              <Minus className={`w-6 h-6 mb-1 ${prediction === 'EXACT' ? 'text-green-400' : 'text-gray-500'}`} />
              <div className="text-xl font-black text-white">7</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Exactly 7</div>
              <div className="text-xs text-green-400 font-black mt-2 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">5.8x Payout</div>
              
              {prediction === 'EXACT' && betAmount > 0 && (
                <div className="absolute top-1 right-1 text-[9px] font-black bg-yellow-500 text-black px-1.5 rounded-sm">₹{betAmount}</div>
              )}
            </button>

            {/* OVER 7 */}
            <button 
              onClick={() => setSelectedPrediction('OVER')}
              disabled={gameState !== 'BETTING'}
              className={`
                relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all overflow-hidden
                ${selectedPrediction === 'OVER' 
                  ? 'bg-red-900/40 border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.5),0_0_15px_rgba(239,68,68,0.3)]' 
                  : 'bg-black/40 border-white/5 hover:border-red-500/30'}
                ${gameState !== 'BETTING' ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              `}
            >
              {selectedPrediction === 'OVER' && <div className="absolute top-0 right-0 w-8 h-8 bg-red-500 blur-xl" />}
              <TrendingUp className={`w-6 h-6 mb-1 ${prediction === 'OVER' ? 'text-red-400' : 'text-gray-500'}`} />
              <div className="text-xl font-black text-white">8 - 12</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Over 7</div>
              <div className="text-xs text-red-400 font-black mt-2 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">2x Payout</div>
              
              {prediction === 'OVER' && betAmount > 0 && (
                <div className="absolute top-1 right-1 text-[9px] font-black bg-yellow-500 text-black px-1.5 rounded-sm">₹{betAmount}</div>
              )}
            </button>

          </div>

        </div>

        {/* Bottom Chip Selector */}
        <div className="bg-black/80 backdrop-blur-xl z-20 shrink-0 p-4 border-t border-white/10 rounded-t-[2rem] shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Select Chip Value</span>
            <span className="text-xs font-bold text-gray-400">
              Total Bet: ₹{betAmount}
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
                  w-14 h-14 rounded-full border-[3px] border-dashed shrink-0 flex items-center justify-center transition-all duration-300 relative
                  ${selectedChip === chip 
                    ? 'border-cyan-400 bg-gradient-to-br from-cyan-600 to-blue-600 scale-110 -translate-y-2 shadow-[0_10px_20px_rgba(6,182,212,0.5)] text-white' 
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

          {/* Live Player Feed */}
          <div className="my-3">
            <FakePlayersPanel maxVisible={5} label="Live Players" />
          </div>

          {/* Place Bet Button */}
          <button
            onClick={handleConfirmBet}
            disabled={gameState !== 'BETTING'}
            className="w-full mt-4 py-4 rounded-2xl font-black text-xl tracking-widest uppercase transition-all relative overflow-hidden group
              disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed
              bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 shadow-[0_0_30px_rgba(6,182,212,0.4)]
              hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] active:scale-[0.98] border border-cyan-400/50"
            style={{ backgroundSize: '200% 100%' }}
          >
            <motion.div
              animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-overlay"
            />
            <span className="relative z-10 drop-shadow-md">
               Place Bet
            </span>
          </button>
          
        </div>
        
      </div>
    </div>
  );
};

export default DiceRollGame;
