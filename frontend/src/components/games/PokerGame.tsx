import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Wallet, Settings, Users, ArrowUpCircle, XCircle, CheckCircle2, ShieldAlert, BadgeCent } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface PokerGameProps {
  onBack: () => void;
}

type Phase = 'PRE_FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';

// Mock Card Data
const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const PlayingCard = ({ value, suit, hidden = false, delay = 0 }: { value?: string, suit?: string, hidden?: boolean, delay?: number }) => {
  const isRed = suit === '♥' || suit === '♦';
  
  return (
    <motion.div
      initial={{ scale: 0, y: -50, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.4, delay }}
      className={`relative w-12 h-16 sm:w-16 sm:h-24 rounded-lg bg-white shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-gray-200 flex flex-col justify-between p-1 sm:p-2 ${hidden ? 'bg-gradient-to-br from-blue-800 to-indigo-900 border-indigo-400/50' : ''}`}
    >
      {hidden ? (
        <div className="absolute inset-1 border border-white/20 rounded opacity-50 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      ) : (
        <>
          <div className={`text-[10px] sm:text-sm font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>{value}</div>
          <div className={`text-xl sm:text-3xl self-center ${isRed ? 'text-red-600' : 'text-black'}`}>{suit}</div>
          <div className={`text-[10px] sm:text-sm font-bold self-end rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>{value}</div>
        </>
      )}
    </motion.div>
  );
};

const PokerGame = ({ onBack }: PokerGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [phase, setPhase] = useState<Phase>('PRE_FLOP');
  const [pot, setPot] = useState(1500);
  const [currentBet, setCurrentBet] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [winMessage, setWinMessage] = useState("");

  const handRanking = "Pair of Aces";

  const handleAction = (action: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    setTimeout(() => {
      if (action === 'FOLD') {
        setWinMessage("You Folded");
        setTimeout(() => resetGame(), 2000);
      } else {
        if (action === 'CALL' || action === 'RAISE') {
          const amount = action === 'CALL' ? currentBet : currentBet * 2;
          if (deductMoney(amount, `Poker ${action}`)) {
            setPot(prev => prev + amount * 3); // Simulate others matching
            setCurrentBet(amount);
          } else {
            alert("Insufficient balance!");
            setIsProcessing(false);
            return;
          }
        }
        
        // Advance Phase
        if (phase === 'PRE_FLOP') setPhase('FLOP');
        else if (phase === 'FLOP') setPhase('TURN');
        else if (phase === 'TURN') setPhase('RIVER');
        else if (phase === 'RIVER') {
          setPhase('SHOWDOWN');
          setWinMessage("You Won the Pot!");
          addMoney(pot, "Poker Win");
          setTimeout(() => resetGame(), 4000);
        }
      }
      setIsProcessing(false);
    }, 1500);
  };

  const resetGame = () => {
    setPhase('PRE_FLOP');
    setPot(1500);
    setCurrentBet(100);
    setWinMessage("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full relative flex flex-col border-x border-white/5 bg-black">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 bg-black/80 backdrop-blur-md border-b border-white/10 shrink-0 z-20">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <BadgeCent className="w-3 h-3 text-yellow-500" /> VIP Table
            </span>
            <span className="text-sm font-black text-yellow-400">Blinds: 50/100</span>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Balance</span>
               <span className="text-xs font-black text-white">₹{balance.toLocaleString()}</span>
             </div>
          </div>
        </div>

        {/* Main Poker Table Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center z-10 px-4 py-8 overflow-y-auto scrollbar-hide">
          
          {/* Green Velvet Table */}
          <div className="relative w-[95%] h-[60%] min-h-[350px] bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-[4rem] border-[12px] border-[#2A1B0A] shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_20px_40px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center">
            
            {/* Table inner line */}
            <div className="absolute inset-4 border-2 border-emerald-500/20 rounded-[3rem] pointer-events-none" />

            {/* Dealer / Top Player */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-gray-600 shadow-xl overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Dealer" alt="Dealer" />
              </div>
              <div className="bg-black/80 px-2 py-0.5 rounded text-[9px] mt-1 border border-white/10 font-bold">Dealer</div>
              <div className="flex gap-1 mt-2">
                 <PlayingCard hidden delay={0.1} />
                 <PlayingCard hidden delay={0.2} />
              </div>
            </div>

            {/* Left Player */}
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600 shadow-xl overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=P1" alt="P1" />
              </div>
              <div className="bg-black/80 px-2 py-0.5 rounded text-[9px] mt-1 border border-white/10 font-bold">₹42.5k</div>
              {phase !== 'PRE_FLOP' && <div className="text-[10px] text-gray-400 font-bold bg-black/60 px-1 rounded mt-1">Folded</div>}
            </div>

            {/* Right Player */}
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600 shadow-xl overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=P2" alt="P2" />
              </div>
              <div className="bg-black/80 px-2 py-0.5 rounded text-[9px] mt-1 border border-white/10 font-bold">₹18.2k</div>
              {isProcessing && <div className="text-[10px] text-yellow-400 font-bold bg-black/60 px-1 rounded mt-1 animate-pulse">Thinking...</div>}
            </div>

            {/* Pot Area */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest bg-black/40 px-2 py-1 rounded-full mb-1">Main Pot</div>
              <div className="text-xl font-black text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                ₹{pot.toLocaleString()}
              </div>
              {/* Animated Chips */}
              <div className="flex gap-0.5 mt-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-4 h-1 bg-yellow-500 rounded-sm border border-yellow-700 shadow-md" style={{ transform: `translateY(-${i*2}px)` }}/>
                ))}
              </div>
            </div>

            {/* Community Cards */}
            <div className="flex justify-center gap-1 sm:gap-2 mt-8 z-10">
              <AnimatePresence>
                {(phase === 'FLOP' || phase === 'TURN' || phase === 'RIVER' || phase === 'SHOWDOWN') && (
                  <>
                    <PlayingCard value="K" suit="♠" delay={0.1} />
                    <PlayingCard value="10" suit="♥" delay={0.2} />
                    <PlayingCard value="4" suit="♣" delay={0.3} />
                  </>
                )}
                {(phase === 'TURN' || phase === 'RIVER' || phase === 'SHOWDOWN') && (
                  <PlayingCard value="A" suit="♠" delay={0.4} />
                )}
                {(phase === 'RIVER' || phase === 'SHOWDOWN') && (
                  <PlayingCard value="2" suit="♦" delay={0.5} />
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Player Hand & Ranking */}
          <div className="w-full flex flex-col items-center -mt-10 z-20">
            <div className="flex gap-2">
               <motion.div initial={{ y: 50, rotate: -10 }} animate={{ y: 0, rotate: -10 }} className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] z-10">
                 <PlayingCard value="A" suit="♥" />
               </motion.div>
               <motion.div initial={{ y: 50, rotate: 10 }} animate={{ y: 0, rotate: 10 }} className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] z-20">
                 <PlayingCard value="A" suit="♣" />
               </motion.div>
            </div>
            
            <div className="mt-4 bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <span className="text-xs text-gray-400 uppercase font-bold tracking-widest mr-2">Hand:</span>
              <span className="text-sm font-black text-cyan-400">{handRanking}</span>
            </div>
          </div>

        </div>

        {/* Action Controls */}
        <div className="bg-[#0f0f13] z-20 shrink-0 p-4 border-t border-white/5 rounded-t-[2rem] pb-8 shadow-[0_-20px_40px_rgba(0,0,0,0.9)]">
          
          <div className="flex justify-between items-center mb-4 px-2">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-widest">Call Amount: <span className="text-white">₹{currentBet}</span></div>
            {isProcessing && <div className="text-xs text-yellow-500 font-bold animate-pulse">Opponents turn...</div>}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => handleAction('FOLD')}
              disabled={isProcessing || phase === 'SHOWDOWN'}
              className="flex flex-col items-center justify-center bg-red-950/40 border border-red-900/50 rounded-xl py-3 active:scale-95 disabled:opacity-50 transition-all hover:bg-red-900/40"
            >
              <XCircle className="w-5 h-5 text-red-500 mb-1" />
              <span className="text-[10px] font-bold text-red-400 uppercase">Fold</span>
            </button>
            
            <button 
              onClick={() => handleAction('CHECK')}
              disabled={isProcessing || phase === 'SHOWDOWN'}
              className="flex flex-col items-center justify-center bg-gray-800/40 border border-gray-700/50 rounded-xl py-3 active:scale-95 disabled:opacity-50 transition-all hover:bg-gray-700/50"
            >
              <CheckCircle2 className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-[10px] font-bold text-gray-300 uppercase">Check</span>
            </button>
            
            <button 
              onClick={() => handleAction('CALL')}
              disabled={isProcessing || phase === 'SHOWDOWN'}
              className="flex flex-col items-center justify-center bg-blue-900/40 border border-blue-500/50 rounded-xl py-3 active:scale-95 disabled:opacity-50 transition-all hover:bg-blue-800/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            >
              <span className="text-sm font-black text-blue-400 mb-0.5">₹{currentBet}</span>
              <span className="text-[10px] font-bold text-blue-300 uppercase">Call</span>
            </button>
            
            <button 
              onClick={() => handleAction('RAISE')}
              disabled={isProcessing || phase === 'SHOWDOWN'}
              className="flex flex-col items-center justify-center bg-gradient-to-b from-yellow-600 to-orange-700 border border-yellow-400 rounded-xl py-3 active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)]"
            >
              <ArrowUpCircle className="w-5 h-5 text-white mb-1" />
              <span className="text-[10px] font-black text-white uppercase drop-shadow-md">Raise</span>
            </button>
          </div>
          
        </div>

        {/* Win Overlay */}
        <AnimatePresence>
          {winMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-gradient-to-b from-yellow-900 to-black border-2 border-yellow-500 px-12 py-8 rounded-3xl flex flex-col items-center shadow-[0_0_50px_rgba(234,179,8,0.4)]"
              >
                <Trophy className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">{winMessage}</h2>
                {winMessage.includes("Won") && (
                  <p className="text-xl font-bold text-yellow-400 mt-2">+₹{pot.toLocaleString()}</p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
    </div>
  );
};

export default PokerGame;
