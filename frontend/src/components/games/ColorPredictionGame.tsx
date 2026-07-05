import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, History, BarChart2, Zap, Settings } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface ColorPredictionGameProps {
  onBack: () => void;
}

type ColorChoice = 'RED' | 'GREEN' | 'BLUE' | 'YELLOW' | 'PURPLE';
type GameState = 'BETTING' | 'DRAWING' | 'RESULT';

const COLORS = [
  { id: 'RED', label: 'Red', hex: '#EF4444', text: 'text-red-500', bg: 'bg-red-500', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.5)]' },
  { id: 'GREEN', label: 'Green', hex: '#10B981', text: 'text-green-500', bg: 'bg-green-500', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.5)]' },
  { id: 'BLUE', label: 'Blue', hex: '#3B82F6', text: 'text-blue-500', bg: 'bg-blue-500', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]' },
  { id: 'YELLOW', label: 'Yellow', hex: '#EAB308', text: 'text-yellow-500', bg: 'bg-yellow-500', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]' },
  { id: 'PURPLE', label: 'Purple', hex: '#8B5CF6', text: 'text-purple-500', bg: 'bg-purple-500', glow: 'shadow-[0_0_20px_rgba(139,92,246,0.5)]' },
] as const;

const CHIPS = [10, 50, 100, 500, 1000, 5000];

const ColorPredictionGame = ({ onBack }: ColorPredictionGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  
  const [gameState, setGameState] = useState<GameState>('BETTING');
  const [timeLeft, setTimeLeft] = useState(30);
  
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [bets, setBets] = useState<Record<ColorChoice, number>>({
    RED: 0, GREEN: 0, BLUE: 0, YELLOW: 0, PURPLE: 0
  });
  
  const [winningColor, setWinningColor] = useState<ColorChoice | null>(null);
  const [payoutAmount, setPayoutAmount] = useState(0);
  
  const [history, setHistory] = useState<ColorChoice[]>(['RED', 'BLUE', 'YELLOW', 'GREEN', 'RED', 'PURPLE', 'BLUE']);

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
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)].id as ColorChoice;
        setWinningColor(randomColor);
        
        // Payout logic: 5 colors = ~4.5x payout to include house edge, but let's give 4.8x for premium feel
        const userBet = bets[randomColor];
        if (userBet > 0) {
          const won = userBet * 4.8;
          setPayoutAmount(won);
          addMoney(won, `Won Color Prediction (${randomColor})`);
        }
        
        setHistory(prev => [randomColor, ...prev].slice(0, 10));
        setGameState('RESULT');
      }, 3000); // 3 seconds of suspense
    } else if (gameState === 'RESULT') {
      timer = setTimeout(() => {
        setBets({ RED: 0, GREEN: 0, BLUE: 0, YELLOW: 0, PURPLE: 0 });
        setWinningColor(null);
        setPayoutAmount(0);
        setTimeLeft(30);
        setGameState('BETTING');
      }, 5000); // Show results for 5s
    }

    return () => clearInterval(timer);
  }, [gameState]);

  const placeBet = (color: ColorChoice) => {
    if (gameState !== 'BETTING') return;
    if (balance < selectedChip) {
      alert("Insufficient balance!");
      return;
    }
    
    if (deductMoney(selectedChip, `Bet on ${color}`)) {
      setBets(prev => ({ ...prev, [color]: prev[color] + selectedChip }));
    }
  };

  const totalBetAmount = Object.values(bets).reduce((a, b) => a + b, 0);
  
  // Calculate stats
  const stats = COLORS.map(c => ({
    ...c,
    count: history.filter(h => h === c.id).length
  }));

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#111] relative overflow-hidden flex flex-col border-x border-white/5">
        
        {/* Background Ambient Lights */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-50">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-red-500/10 rounded-full blur-[80px]" />
          <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[30%] bg-green-500/10 rounded-full blur-[80px]" />
        </div>

        {/* Top Header */}
        <div className="h-16 flex items-center justify-between px-4 bg-black/60 backdrop-blur-xl border-b border-white/5 shrink-0 z-20">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-300" />
            </button>
            <span className="font-black text-lg tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-500">
              Neon Colors
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-400 font-bold tracking-wider">BALANCE</span>
              <span className="text-sm font-black text-white">₹{balance.toLocaleString()}</span>
            </div>
            <button className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <Settings className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 relative flex flex-col z-10 px-4 pt-4 pb-2 overflow-y-auto scrollbar-hide">
          
          {/* Timer / Status */}
          <div className="flex justify-center mb-6">
            <AnimatePresence mode="wait">
              {gameState === 'BETTING' && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Place Your Bets
                  </div>
                  <div className={`text-5xl font-black ${timeLeft <= 5 ? 'text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-white'}`}>
                    00:{timeLeft.toString().padStart(2, '0')}
                  </div>
                </motion.div>
              )}
              {gameState === 'DRAWING' && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Drawing Color</div>
                  <div className="text-4xl font-black text-gray-300 animate-pulse tracking-widest">
                    ...
                  </div>
                </motion.div>
              )}
              {gameState === 'RESULT' && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Winning Color</div>
                  <div className={`text-4xl font-black uppercase ${COLORS.find(c => c.id === winningColor)?.text} ${COLORS.find(c => c.id === winningColor)?.glow}`}>
                    {COLORS.find(c => c.id === winningColor)?.label}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Winning Overlay */}
          <AnimatePresence>
            {gameState === 'RESULT' && payoutAmount > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 px-8 py-6 rounded-3xl border-2 border-[#FFD700] shadow-[0_0_50px_rgba(255,215,0,0.5)] flex flex-col items-center backdrop-blur-xl"
              >
                <Zap className="w-12 h-12 text-[#FFD700] mb-2 animate-bounce" />
                <div className="text-white font-bold tracking-widest text-sm mb-1 uppercase">Winner</div>
                <div className="text-4xl font-black text-[#FFD700]">+₹{payoutAmount}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Color Prediction Cards */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 h-1/2">
              {/* Top 4 Colors */}
              {COLORS.slice(0, 4).map(color => (
                <button
                  key={color.id}
                  onClick={() => placeBet(color.id as ColorChoice)}
                  disabled={gameState !== 'BETTING'}
                  className={`
                    relative rounded-2xl border-2 overflow-hidden flex flex-col items-center justify-center transition-all duration-300
                    ${gameState !== 'BETTING' && winningColor !== color.id ? 'opacity-30 grayscale border-gray-800' : `border-${color.text.split('-')[1]}-500/50 hover:bg-white/5 active:scale-95`}
                    ${winningColor === color.id ? `${color.glow} border-${color.text.split('-')[1]}-400 scale-105 z-10 bg-${color.text.split('-')[1]}-900/40` : 'bg-black/40'}
                  `}
                >
                  {/* Glowing backdrop */}
                  <div className={`absolute inset-0 opacity-20 ${color.bg} blur-xl`} />
                  
                  <span className={`text-2xl font-black tracking-widest uppercase relative z-10 ${color.text}`}>
                    {color.label}
                  </span>
                  <span className="text-xs font-bold text-gray-500 mt-1 relative z-10">4.8x Payout</span>
                  
                  {bets[color.id as ColorChoice] > 0 && (
                    <div className="absolute top-3 right-3 bg-white text-black px-2 py-0.5 rounded-full text-xs font-bold shadow-lg z-20">
                      ₹{bets[color.id as ColorChoice]}
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* 5th Color (Full Width) */}
            <button
              onClick={() => placeBet(COLORS[4].id as ColorChoice)}
              disabled={gameState !== 'BETTING'}
              className={`
                relative h-24 rounded-2xl border-2 overflow-hidden flex flex-col items-center justify-center transition-all duration-300
                ${gameState !== 'BETTING' && winningColor !== COLORS[4].id ? 'opacity-30 grayscale border-gray-800' : `border-${COLORS[4].text.split('-')[1]}-500/50 hover:bg-white/5 active:scale-95`}
                ${winningColor === COLORS[4].id ? `${COLORS[4].glow} border-${COLORS[4].text.split('-')[1]}-400 scale-[1.02] z-10 bg-${COLORS[4].text.split('-')[1]}-900/40` : 'bg-black/40'}
              `}
            >
              <div className={`absolute inset-0 opacity-20 ${COLORS[4].bg} blur-xl`} />
              <span className={`text-2xl font-black tracking-widest uppercase relative z-10 ${COLORS[4].text}`}>
                {COLORS[4].label}
              </span>
              <span className="text-xs font-bold text-gray-500 mt-1 relative z-10">4.8x Payout</span>
              
              {bets[COLORS[4].id as ColorChoice] > 0 && (
                <div className="absolute top-3 right-3 bg-white text-black px-2 py-0.5 rounded-full text-xs font-bold shadow-lg z-20">
                  ₹{bets[COLORS[4].id as ColorChoice]}
                </div>
              )}
            </button>
          </div>

        </div>

        {/* Bottom Controls - Chips & Stats */}
        <div className="bg-[#111] backdrop-blur-xl z-20 shrink-0 border-t border-white/5 pb-4">
          
          {/* Stats Bar */}
          <div className="flex items-center gap-1 p-2 bg-black/50 overflow-x-auto scrollbar-hide border-b border-white/5">
            <BarChart2 className="w-4 h-4 text-gray-500 mx-2 shrink-0" />
            {stats.map(s => (
              <div key={s.id} className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 shrink-0">
                <div className={`w-2 h-2 rounded-full ${s.bg}`} />
                <span className="text-[10px] text-gray-400 font-bold">{Math.round((s.count / history.length) * 100)}%</span>
              </div>
            ))}
          </div>

          {/* History Ticker */}
          <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
             <History className="w-4 h-4 text-gray-500 shrink-0" />
             {history.map((h, i) => (
               <div key={i} className={`w-6 h-6 rounded-full shrink-0 border-2 ${COLORS.find(c => c.id === h)?.bg} border-black/50 shadow-sm`} />
             ))}
          </div>

          {/* Chip Selector */}
          <div className="px-4 pt-2">
            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide pb-4">
              {CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => setSelectedChip(chip)}
                  className={`
                    w-12 h-12 rounded-full border-[3px] border-dashed shrink-0 flex items-center justify-center transition-all
                    ${selectedChip === chip ? 'scale-110 -translate-y-2 border-white shadow-[0_5px_15px_rgba(255,255,255,0.2)] bg-white text-black' : 'border-gray-600 scale-95 opacity-70 bg-gray-900 text-white'}
                  `}
                >
                  <div className="font-black text-xs">
                    {chip >= 1000 ? `${chip/1000}k` : chip}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex justify-between items-center bg-white/5 px-4 py-2 rounded-xl border border-white/10">
               <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Total Bet</span>
               <span className="text-xl font-black text-white">₹{totalBetAmount}</span>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
};

export default ColorPredictionGame;
