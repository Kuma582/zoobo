import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, History, Trophy, Crown, Flame, AlertCircle, Settings } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface DragonTigerGameProps {
  onBack: () => void;
}

type Card = { suit: string; value: number; label: string };
type GameState = 'BETTING' | 'DEALING' | 'RESOLVING';
type BetZone = 'DRAGON' | 'TIGER' | 'TIE' | null;

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = [
  { v: 1, l: 'A' }, { v: 2, l: '2' }, { v: 3, l: '3' }, { v: 4, l: '4' }, 
  { v: 5, l: '5' }, { v: 6, l: '6' }, { v: 7, l: '7' }, { v: 8, l: '8' }, 
  { v: 9, l: '9' }, { v: 10, l: '10' }, { v: 11, l: 'J' }, { v: 12, l: 'Q' }, { v: 13, l: 'K' }
];
const CHIPS = [10, 50, 100, 500, 1000, 5000];

const getRandomCard = (): Card => {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const val = VALUES[Math.floor(Math.random() * VALUES.length)];
  return { suit, value: val.v, label: val.l };
};

const DragonTigerGame = ({ onBack }: DragonTigerGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [gameState, setGameState] = useState<GameState>('BETTING');
  const [timeLeft, setTimeLeft] = useState(15);
  
  // Bets
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [bets, setBets] = useState({ DRAGON: 0, TIGER: 0, TIE: 0 });
  const [totalBet, setTotalBet] = useState(0);

  // Cards
  const [dragonCard, setDragonCard] = useState<Card | null>(null);
  const [tigerCard, setTigerCard] = useState<Card | null>(null);
  const [winner, setWinner] = useState<BetZone>(null);
  const [payoutAmount, setPayoutAmount] = useState(0);

  // History
  const [history, setHistory] = useState<BetZone[]>(['DRAGON', 'TIGER', 'DRAGON', 'DRAGON', 'TIE', 'TIGER']);

  // Game Loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameState === 'BETTING') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('DEALING');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState === 'DEALING') {
      // Deal cards
      const dCard = getRandomCard();
      const tCard = getRandomCard();
      
      setTimeout(() => setDragonCard(dCard), 500);
      setTimeout(() => setTigerCard(tCard), 1500);
      
      setTimeout(() => {
        let winZone: BetZone = null;
        if (dCard.value > tCard.value) winZone = 'DRAGON';
        else if (tCard.value > dCard.value) winZone = 'TIGER';
        else winZone = 'TIE';
        
        setWinner(winZone);
        setHistory(prev => [...prev.slice(-9), winZone]);
        
        // Calculate payouts
        let payout = 0;
        if (winZone === 'DRAGON' && bets.DRAGON > 0) payout += bets.DRAGON * 2;
        if (winZone === 'TIGER' && bets.TIGER > 0) payout += bets.TIGER * 2;
        if (winZone === 'TIE' && bets.TIE > 0) payout += bets.TIE * 9; // 8:1 payout means you get 9x back total
        
        // In DT, tie usually returns half of Dragon/Tiger bets. Simplified here: lose full if tie unless bet on tie.
        
        if (payout > 0) {
          setPayoutAmount(payout);
          addMoney(payout, 'Dragon Tiger Win');
        }
        
        setGameState('RESOLVING');
      }, 3000);
      
    } else if (gameState === 'RESOLVING') {
      timer = setTimeout(() => {
        // Reset for next round
        setDragonCard(null);
        setTigerCard(null);
        setWinner(null);
        setBets({ DRAGON: 0, TIGER: 0, TIE: 0 });
        setTotalBet(0);
        setPayoutAmount(0);
        setTimeLeft(15);
        setGameState('BETTING');
      }, 5000); // Wait 5s before next round
    }

    return () => clearInterval(timer);
  }, [gameState]);

  const placeBet = (zone: 'DRAGON' | 'TIGER' | 'TIE') => {
    if (gameState !== 'BETTING') return;
    if (balance < selectedChip) {
      alert("Insufficient balance!");
      return;
    }
    
    if (deductMoney(selectedChip, `Bet on ${zone}`)) {
      setBets(prev => ({ ...prev, [zone]: prev[zone] + selectedChip }));
      setTotalBet(prev => prev + selectedChip);
    }
  };

  const getSuitColor = (suit: string) => (suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-black');

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0E14] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#0a2e16] relative shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden flex flex-col">
        
        {/* Felt Table Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#064e3b] via-[#065f46] to-[#022c22] opacity-90" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-20 mix-blend-multiply" />
          {/* Table Glows */}
          <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-black/60 to-transparent" />
          <div className="absolute bottom-0 w-full h-[400px] bg-gradient-to-t from-black/90 to-transparent" />
        </div>

        {/* Top Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 shrink-0 z-20">
          <button onClick={onBack} className="p-2 bg-black/20 rounded-full hover:bg-black/40 backdrop-blur-md transition-colors">
            <ChevronLeft className="w-5 h-5 text-yellow-400" />
          </button>
          
          <div className="flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border border-white/10">
            <span className="text-[10px] text-gray-300 font-bold tracking-wider">BALANCE</span>
            <span className="text-sm font-black text-yellow-400">₹{balance.toLocaleString()}</span>
          </div>
          
          <button className="p-2 bg-black/20 rounded-full hover:bg-black/40 backdrop-blur-md transition-colors">
            <Settings className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Game Area */}
        <div className="flex-1 relative flex flex-col z-10 px-4 pt-4 pb-2">
          
          {/* Dealer Area / Timer */}
          <div className="flex flex-col items-center mb-8 relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-b from-gray-700 to-black border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center overflow-hidden mb-2">
               <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Dealer" />
            </div>
            
            <AnimatePresence mode="wait">
              {gameState === 'BETTING' && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`px-6 py-2 rounded-full border-2 bg-black/80 backdrop-blur-md flex items-center gap-2
                    ${timeLeft <= 5 ? 'border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'}
                  `}
                >
                  <AlertCircle className="w-4 h-4 animate-pulse" />
                  <span className="font-black tracking-widest">PLACE BETS: {timeLeft}s</span>
                </motion.div>
              )}
              {gameState === 'DEALING' && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="px-6 py-2 rounded-full border-2 border-blue-500 text-blue-400 bg-black/80 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.5)] font-black tracking-widest"
                >
                  NO MORE BETS
                </motion.div>
              )}
              {gameState === 'RESOLVING' && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="px-6 py-2 rounded-full border-2 border-yellow-500 text-yellow-400 bg-black/80 backdrop-blur-md shadow-[0_0_20px_rgba(234,179,8,0.6)] font-black tracking-widest flex items-center gap-2 text-lg"
                >
                  {winner} WINS
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card Dealing Area */}
          <div className="flex justify-between items-center px-4 mb-8">
            {/* Dragon Card Spot */}
            <div className="flex flex-col items-center">
              <span className="text-red-500 font-black tracking-widest uppercase mb-2 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">Dragon</span>
              <div className={`w-24 h-36 rounded-xl border-2 flex items-center justify-center bg-black/40 backdrop-blur-sm relative
                ${winner === 'DRAGON' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'border-white/10'}
              `}>
                <AnimatePresence>
                  {dragonCard && (
                    <motion.div 
                      initial={{ scale: 0, rotateY: 180, x: 50, y: -100 }}
                      animate={{ scale: 1, rotateY: 0, x: 0, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="absolute inset-0 bg-white rounded-xl flex flex-col justify-between p-2 shadow-xl"
                    >
                      <div className={`text-xl font-bold ${getSuitColor(dragonCard.suit)}`}>{dragonCard.label}</div>
                      <div className={`text-4xl self-center ${getSuitColor(dragonCard.suit)}`}>{dragonCard.suit}</div>
                      <div className={`text-xl font-bold self-end rotate-180 ${getSuitColor(dragonCard.suit)}`}>{dragonCard.label}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Tie Indicator */}
            <div className="flex flex-col items-center">
               {winner === 'TIE' && (
                 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-green-500 text-white px-4 py-2 rounded-full font-black text-xl shadow-[0_0_20px_rgba(34,197,94,0.8)]">
                   TIE
                 </motion.div>
               )}
            </div>

            {/* Tiger Card Spot */}
            <div className="flex flex-col items-center">
              <span className="text-yellow-400 font-black tracking-widest uppercase mb-2 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">Tiger</span>
              <div className={`w-24 h-36 rounded-xl border-2 flex items-center justify-center bg-black/40 backdrop-blur-sm relative
                ${winner === 'TIGER' ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)]' : 'border-white/10'}
              `}>
                <AnimatePresence>
                  {tigerCard && (
                    <motion.div 
                      initial={{ scale: 0, rotateY: 180, x: -50, y: -100 }}
                      animate={{ scale: 1, rotateY: 0, x: 0, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="absolute inset-0 bg-white rounded-xl flex flex-col justify-between p-2 shadow-xl"
                    >
                      <div className={`text-xl font-bold ${getSuitColor(tigerCard.suit)}`}>{tigerCard.label}</div>
                      <div className={`text-4xl self-center ${getSuitColor(tigerCard.suit)}`}>{tigerCard.suit}</div>
                      <div className={`text-xl font-bold self-end rotate-180 ${getSuitColor(tigerCard.suit)}`}>{tigerCard.label}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Win Overlay */}
          <AnimatePresence>
            {gameState === 'RESOLVING' && payoutAmount > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 px-8 py-4 rounded-2xl border-2 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.5)] flex flex-col items-center"
              >
                <Trophy className="w-12 h-12 text-yellow-400 mb-2" />
                <div className="text-white font-bold tracking-widest text-sm mb-1">YOU WON</div>
                <div className="text-3xl font-black text-yellow-400">+₹{payoutAmount}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Betting Zones */}
          <div className="flex-1 flex flex-col justify-end gap-2 mb-4">
            {/* TIE Zone */}
            <button 
              onClick={() => placeBet('TIE')}
              disabled={gameState !== 'BETTING'}
              className="w-full h-16 rounded-t-3xl border-2 border-green-500/50 bg-green-900/40 backdrop-blur-sm relative overflow-hidden flex items-center justify-center transition-all hover:bg-green-800/60 active:scale-[0.98] disabled:opacity-80"
            >
              <div className="flex flex-col items-center relative z-10">
                <span className="text-green-400 font-black text-xl tracking-widest drop-shadow-md">TIE</span>
                <span className="text-xs font-bold text-green-300">8:1</span>
              </div>
              {bets.TIE > 0 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/80 rounded-full border-2 border-green-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">₹{bets.TIE}</span>
                </div>
              )}
            </button>
            
            <div className="flex gap-2 h-32">
              {/* DRAGON Zone */}
              <button 
                onClick={() => placeBet('DRAGON')}
                disabled={gameState !== 'BETTING'}
                className="flex-1 rounded-bl-3xl border-2 border-red-500/50 bg-red-900/40 backdrop-blur-sm relative overflow-hidden flex flex-col items-center justify-center transition-all hover:bg-red-800/60 active:scale-[0.98] disabled:opacity-80"
              >
                <Flame className="w-12 h-12 text-red-500/20 absolute bottom-2 left-2" />
                <span className="text-red-500 font-black text-3xl tracking-widest drop-shadow-md relative z-10">DRAGON</span>
                <span className="text-xs font-bold text-red-300 relative z-10">1:1</span>
                
                {bets.DRAGON > 0 && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-black/80 rounded-full border-2 border-red-500 flex items-center justify-center z-20">
                    <span className="text-xs font-bold text-white">₹{bets.DRAGON}</span>
                  </div>
                )}
              </button>
              
              {/* TIGER Zone */}
              <button 
                onClick={() => placeBet('TIGER')}
                disabled={gameState !== 'BETTING'}
                className="flex-1 rounded-br-3xl border-2 border-yellow-500/50 bg-yellow-900/40 backdrop-blur-sm relative overflow-hidden flex flex-col items-center justify-center transition-all hover:bg-yellow-800/60 active:scale-[0.98] disabled:opacity-80"
              >
                <Crown className="w-12 h-12 text-yellow-500/20 absolute bottom-2 right-2" />
                <span className="text-yellow-500 font-black text-3xl tracking-widest drop-shadow-md relative z-10">TIGER</span>
                <span className="text-xs font-bold text-yellow-300 relative z-10">1:1</span>
                
                {bets.TIGER > 0 && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-black/80 rounded-full border-2 border-yellow-500 flex items-center justify-center z-20">
                    <span className="text-xs font-bold text-white">₹{bets.TIGER}</span>
                  </div>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Controls - Chips & History */}
        <div className="bg-black/90 backdrop-blur-xl z-20 shrink-0 border-t border-white/10 p-4">
          
          {/* History Ticker */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide py-1">
            <History className="w-4 h-4 text-gray-500 shrink-0" />
            {history.map((h, i) => (
              <div key={i} className={`
                w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border
                ${h === 'DRAGON' ? 'bg-red-500/20 text-red-500 border-red-500/50' : 
                  h === 'TIGER' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 
                  'bg-green-500/20 text-green-500 border-green-500/50'}
              `}>
                {h ? h.charAt(0) : '-'}
              </div>
            ))}
          </div>

          {/* Chip Selector */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide pb-2">
            {CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => setSelectedChip(chip)}
                className={`
                  w-14 h-14 rounded-full border-[4px] border-dashed shrink-0 flex items-center justify-center shadow-lg transition-all
                  ${selectedChip === chip ? 'scale-110 -translate-y-2 border-yellow-400 shadow-[0_10px_20px_rgba(250,204,21,0.3)]' : 'border-gray-500 scale-95 opacity-80'}
                  bg-gradient-to-br from-gray-800 to-black
                `}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs
                  ${selectedChip === chip ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}
                `}>
                  {chip >= 1000 ? `${chip/1000}k` : chip}
                </div>
              </button>
            ))}
          </div>
          
          <div className="flex justify-between items-center mt-2 px-2">
             <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Total Bet</span>
             <span className="text-lg font-black text-white">₹{totalBet}</span>
          </div>

        </div>
        
      </div>
    </div>
  );
};

export default DragonTigerGame;
