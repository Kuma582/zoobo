import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Coins, Settings, Eye, EyeOff, ShieldCheck, Trophy, LogOut } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

interface TeenPattiGameProps {
  onBack: () => void;
}

type Card = { suit: string; value: number; label: string };
type PlayerState = 'WAITING' | 'PLAYING' | 'PACKED' | 'WINNER';
type GameState = 'BOOT' | 'DEALING' | 'PLAYING' | 'SHOWDOWN';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = [
  { v: 14, l: 'A' }, { v: 2, l: '2' }, { v: 3, l: '3' }, { v: 4, l: '4' }, 
  { v: 5, l: '5' }, { v: 6, l: '6' }, { v: 7, l: '7' }, { v: 8, l: '8' }, 
  { v: 9, l: '9' }, { v: 10, l: '10' }, { v: 11, l: 'J' }, { v: 12, l: 'Q' }, { v: 13, l: 'K' }
];
const CHIPS = [10, 50, 100, 500, 1000];

const getRandomCard = (): Card => {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const val = VALUES[Math.floor(Math.random() * VALUES.length)];
  return { suit, value: val.v, label: val.l };
};

const getSuitColor = (suit: string) => (suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-black');

const TeenPattiGame = ({ onBack }: TeenPattiGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [gameState, setGameState] = useState<GameState>('BOOT');
  
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(10);
  
  // Players: 0 = User, 1 = AI Left, 2 = AI Right
  const [cards, setCards] = useState<Record<number, Card[]>>({ 0: [], 1: [], 2: [] });
  const [playerStates, setPlayerStates] = useState<Record<number, PlayerState>>({ 0: 'WAITING', 1: 'WAITING', 2: 'WAITING' });
  const [isSeen, setIsSeen] = useState(false);
  const [turn, setTurn] = useState<number | null>(null);
  
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [message, setMessage] = useState<string>("Waiting for players...");

  const bootAmount = 10;

  const startRound = () => {
    if (balance < bootAmount) {
      alert("Insufficient balance for boot amount!");
      return;
    }
    
    // Reset round
    setIsSeen(false);
    setCards({ 0: [], 1: [], 2: [] });
    setPlayerStates({ 0: 'PLAYING', 1: 'PLAYING', 2: 'PLAYING' });
    setCurrentBet(bootAmount);
    
    // Deduct boot
    deductMoney(bootAmount, 'Teen Patti Boot');
    setPot(bootAmount * 3); // Assume AIs also pay boot
    
    setGameState('DEALING');
    setMessage("Dealing Cards...");

    // Deal cards (simulate delay)
    setTimeout(() => {
      setCards({
        0: [getRandomCard(), getRandomCard(), getRandomCard()],
        1: [getRandomCard(), getRandomCard(), getRandomCard()],
        2: [getRandomCard(), getRandomCard(), getRandomCard()]
      });
      setGameState('PLAYING');
      setTurn(0); // User's turn first
      setMessage("Your Turn");
    }, 2000);
  };

  const nextTurn = () => {
    // Very simple AI simulation
    setTurn(1);
    setMessage("AI 1 Thinking...");
    setTimeout(() => {
      if (Math.random() < 0.2) {
        setPlayerStates(prev => ({...prev, 1: 'PACKED'}));
        setMessage("AI 1 Packed");
      } else {
        setPot(prev => prev + currentBet);
        setMessage("AI 1 Chaal");
      }
      
      setTimeout(() => {
        setTurn(2);
        setMessage("AI 2 Thinking...");
        setTimeout(() => {
          if (Math.random() < 0.2) {
            setPlayerStates(prev => ({...prev, 2: 'PACKED'}));
            setMessage("AI 2 Packed");
          } else {
            setPot(prev => prev + currentBet);
            setMessage("AI 2 Chaal");
          }
          
          setTimeout(() => {
            setTurn(0);
            setMessage("Your Turn");
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1500);
  };

  const handleAction = (action: 'PACK' | 'CHAAL' | 'SHOW') => {
    if (turn !== 0 || gameState !== 'PLAYING') return;
    
    if (action === 'PACK') {
      setPlayerStates(prev => ({...prev, 0: 'PACKED'}));
      setGameState('SHOWDOWN');
      evaluateWinner(0); // Evaluate without user
    } else if (action === 'CHAAL') {
      const amount = isSeen ? currentBet * 2 : currentBet; // Seen pays double blind
      if (deductMoney(amount, 'Teen Patti Chaal')) {
        setPot(prev => prev + amount);
        nextTurn();
      } else {
        alert("Insufficient balance!");
      }
    } else if (action === 'SHOW') {
      const amount = isSeen ? currentBet * 2 : currentBet;
      if (deductMoney(amount, 'Teen Patti Show')) {
        setPot(prev => prev + amount);
        setGameState('SHOWDOWN');
        evaluateWinner();
      } else {
        alert("Insufficient balance!");
      }
    }
  };

  const evaluateWinner = (packedPlayer?: number) => {
    setMessage("Showdown!");
    
    // Simplistic evaluation: just sum up card values (in real TP, it's Trail > Pure Seq > Seq > Color > Pair > High Card)
    // We will just do a mock random winner or highest sum for demonstration.
    setTimeout(() => {
      let scores = { 0: 0, 1: 0, 2: 0 };
      
      Object.entries(cards).forEach(([playerId, hand]) => {
        if (playerStates[Number(playerId)] !== 'PACKED' && Number(playerId) !== packedPlayer) {
          scores[Number(playerId) as keyof typeof scores] = hand.reduce((acc, card) => acc + card.value, 0);
        }
      });
      
      const winnerId = Object.keys(scores).reduce((a, b) => scores[Number(a) as keyof typeof scores] > scores[Number(b) as keyof typeof scores] ? a : b);
      
      setPlayerStates(prev => ({...prev, [Number(winnerId)]: 'WINNER'}));
      
      if (Number(winnerId) === 0) {
        addMoney(pot, 'Teen Patti Win');
        setMessage(`You Won ₹${pot}!`);
      } else {
        setMessage(`AI ${winnerId} Won!`);
      }

      setTimeout(() => {
        setGameState('BOOT');
        setTurn(null);
        setPot(0);
      }, 5000);
      
    }, 2000);
  };

  const renderCard = (card: Card, isHidden: boolean, index: number, total: number) => {
    const offset = (index - (total - 1) / 2) * 20; // Fan out cards
    const rot = (index - (total - 1) / 2) * 10;
    
    return (
      <motion.div
        key={index}
        initial={{ x: 0, y: -200, opacity: 0, rotateY: 180 }}
        animate={{ x: offset, y: 0, opacity: 1, rotateY: isHidden ? 180 : 0, rotateZ: rot }}
        transition={{ duration: 0.5, delay: index * 0.1, type: "spring" }}
        className="absolute w-12 h-16 sm:w-16 sm:h-24 rounded-lg bg-white shadow-xl border border-gray-200 flex flex-col justify-between p-1 sm:p-2"
        style={{ transformOrigin: 'bottom center' }}
      >
        {isHidden ? (
          <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/argyle.png')] bg-blue-900 rounded border-2 border-white/20" />
        ) : (
          <>
            <div className={`text-xs sm:text-sm font-bold leading-none ${getSuitColor(card.suit)}`}>{card.label}</div>
            <div className={`text-xl sm:text-3xl self-center ${getSuitColor(card.suit)}`}>{card.suit}</div>
            <div className={`text-xs sm:text-sm font-bold leading-none self-end rotate-180 ${getSuitColor(card.suit)}`}>{card.label}</div>
          </>
        )}
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0E14] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full bg-[#0a2e16] relative shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden flex flex-col">
        
        {/* Felt Table Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Table Base */}
          <div className="absolute inset-2 sm:inset-4 rounded-full bg-gradient-to-b from-[#064e3b] via-[#065f46] to-[#022c22] border-4 sm:border-8 border-[#B8860B] shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(184,134,11,0.3)] scale-[1.5] sm:scale-100 origin-center opacity-90" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-30 mix-blend-multiply" />
          {/* Edge Glows */}
          <div className="absolute top-0 left-0 w-full h-[150px] bg-gradient-to-b from-black/80 to-transparent" />
          <div className="absolute bottom-0 w-full h-[250px] bg-gradient-to-t from-black/90 to-transparent" />
        </div>

        {/* Top Header */}
        <div className="h-16 flex items-center justify-between px-4 shrink-0 z-20 absolute top-0 w-full">
          <button onClick={onBack} className="p-2 bg-black/40 rounded-full hover:bg-black/60 backdrop-blur-md transition-colors border border-white/10">
            <LogOut className="w-4 h-4 text-gray-300" />
          </button>
          
          <div className="flex flex-col items-center bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <span className="text-[10px] text-gray-300 font-bold tracking-wider">BALANCE</span>
            <span className="text-sm font-black text-yellow-400">₹{balance.toLocaleString()}</span>
          </div>
          
          <button className="p-2 bg-black/40 rounded-full hover:bg-black/60 backdrop-blur-md transition-colors border border-white/10">
            <Settings className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Game Area */}
        <div className="flex-1 relative z-10 pt-16 pb-32">
          
          {/* Dealer Top */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-black border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] overflow-hidden mb-1 relative">
              <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=100&auto=format&fit=crop" className="w-full h-full object-cover" alt="Dealer" />
            </div>
            <div className="text-[10px] bg-black/80 px-2 py-0.5 rounded-full text-yellow-400 font-bold uppercase tracking-widest border border-yellow-500/30">Dealer</div>
          </div>

          {/* AI Player 1 (Left) */}
          <div className="absolute top-1/3 left-4 flex flex-col items-center opacity-90">
            <div className="relative">
              <div className={`w-14 h-14 rounded-full border-2 overflow-hidden mb-1 ${turn === 1 ? 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.6)]' : 'border-white/20'}`}>
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop" className="w-full h-full object-cover" alt="AI 1" />
              </div>
              {playerStates[1] === 'PACKED' && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <span className="text-xs font-black text-red-500 rotate-[-15deg] uppercase">Pack</span>
                </div>
              )}
            </div>
            <div className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-white font-bold mb-2">Guest_123</div>
            
            {/* AI 1 Cards */}
            <div className="relative h-16 w-12">
              {cards[1].length > 0 && cards[1].map((c, i) => renderCard(c, gameState !== 'SHOWDOWN', i, cards[1].length))}
            </div>
          </div>

          {/* AI Player 2 (Right) */}
          <div className="absolute top-1/3 right-4 flex flex-col items-center opacity-90">
            <div className="relative">
              <div className={`w-14 h-14 rounded-full border-2 overflow-hidden mb-1 ${turn === 2 ? 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.6)]' : 'border-white/20'}`}>
                <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=100&auto=format&fit=crop" className="w-full h-full object-cover" alt="AI 2" />
              </div>
              {playerStates[2] === 'PACKED' && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <span className="text-xs font-black text-red-500 rotate-[-15deg] uppercase">Pack</span>
                </div>
              )}
            </div>
            <div className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-white font-bold mb-2">Guest_456</div>
            
            {/* AI 2 Cards */}
            <div className="relative h-16 w-12">
              {cards[2].length > 0 && cards[2].map((c, i) => renderCard(c, gameState !== 'SHOWDOWN', i, cards[2].length))}
            </div>
          </div>

          {/* Center Pot & Chips */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            {pot > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative mb-2">
                <div className="w-20 h-20 rounded-full border-4 border-yellow-500/20 flex items-center justify-center bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <Coins className="w-8 h-8 text-yellow-400/50" />
                  {/* Simulated chip pile */}
                  <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full border-2 border-white/50 bg-[repeating-conic-gradient(from_0deg,#3b82f6_0deg_30deg,#1d4ed8_30deg_60deg)] shadow-sm transform -rotate-12" />
                  <div className="absolute bottom-1 right-2 w-6 h-6 rounded-full border-2 border-white/50 bg-[repeating-conic-gradient(from_0deg,#ef4444_0deg_30deg,#b91c1c_30deg_60deg)] shadow-sm transform rotate-12" />
                  <div className="absolute top-2 left-4 w-6 h-6 rounded-full border-2 border-white/50 bg-[repeating-conic-gradient(from_0deg,#10b981_0deg_30deg,#047857_30deg_60deg)] shadow-sm z-10" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-black px-3 py-0.5 rounded-full text-xs shadow-lg whitespace-nowrap">
                  ₹ {pot.toLocaleString()}
                </div>
              </motion.div>
            )}
            
            {/* Game Message */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest text-white mt-4 border border-white/10"
              >
                {message}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* User Player (Bottom) */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
            {/* User Cards */}
            <div className="relative h-24 w-16 mb-4">
              {cards[0].length > 0 && cards[0].map((c, i) => renderCard(c, !isSeen && gameState !== 'SHOWDOWN', i, cards[0].length))}
            </div>

            <div className="relative">
              <div className={`w-16 h-16 rounded-full border-2 overflow-hidden mb-1 ${turn === 0 ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : 'border-white/20'}`}>
                 <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xl">👤</div>
              </div>
              {playerStates[0] === 'PACKED' && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <span className="text-sm font-black text-red-500 rotate-[-15deg] uppercase drop-shadow-md">Pack</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs bg-black/80 px-3 py-1 rounded-full text-white font-bold border border-white/10">You</div>
              {gameState === 'PLAYING' && playerStates[0] !== 'PACKED' && (
                <button 
                  onClick={() => setIsSeen(true)}
                  disabled={isSeen}
                  className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest flex items-center gap-1 border transition-colors
                    ${isSeen ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-blue-500 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] active:scale-95'}
                  `}
                >
                  {isSeen ? <><Eye className="w-3 h-3" /> Seen</> : <><EyeOff className="w-3 h-3" /> See</>}
                </button>
              )}
            </div>
          </div>
          
        </div>

        {/* Bottom Action Panel */}
        <div className="absolute bottom-0 w-full bg-black/90 backdrop-blur-xl z-30 border-t border-white/10 p-4 rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          
          {gameState === 'BOOT' ? (
            <div className="flex justify-center">
              <button
                onClick={startRound}
                className="bg-gradient-to-r from-green-500 to-emerald-600 w-full py-4 rounded-xl font-black text-lg tracking-widest uppercase shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:brightness-110 active:scale-[0.98] transition-all border border-green-400/50"
              >
                Place Boot (₹{bootAmount})
              </button>
            </div>
          ) : (
            <div className="flex justify-between gap-2">
              <button
                onClick={() => handleAction('PACK')}
                disabled={turn !== 0 || playerStates[0] === 'PACKED' || gameState !== 'PLAYING'}
                className="flex-1 py-3 bg-red-950/80 border border-red-500/50 rounded-xl font-bold text-red-500 text-sm uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-transform"
              >
                Pack
              </button>
              <button
                onClick={() => handleAction('CHAAL')}
                disabled={turn !== 0 || playerStates[0] === 'PACKED' || gameState !== 'PLAYING'}
                className="flex-[2] py-3 bg-blue-900/80 border border-blue-500/50 rounded-xl font-black text-blue-400 text-sm uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-transform relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent pointer-events-none" />
                {isSeen ? 'Chaal' : 'Blind'} (₹{isSeen ? currentBet * 2 : currentBet})
              </button>
              <button
                onClick={() => handleAction('SHOW')}
                disabled={turn !== 0 || playerStates[0] === 'PACKED' || gameState !== 'PLAYING'}
                className="flex-1 py-3 bg-yellow-950/80 border border-yellow-500/50 rounded-xl font-bold text-yellow-500 text-sm uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-transform"
              >
                Show
              </button>
            </div>
          )}

        </div>
        
      </div>
    </div>
  );
};

export default TeenPattiGame;
