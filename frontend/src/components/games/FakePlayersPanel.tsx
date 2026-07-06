import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const FAKE_NAMES = [
  'Rajan_786', 'Priya**', 'Amit_K', 'lucky_star', 'RajuBhai',
  'Ankit99', 'KingKohli', 'SonuStar', 'deepak_j', 'Mohit_G',
  'VijayP', 'Rahul88', 'Nikhil_N', 'Aakash9', 'Sanjay_K',
  'GoluBhai', 'Pooja**', 'Sandeep5', 'Arjun_7', 'Kapil_D',
  'Ravi_S', 'Subhash9', 'Govind3', 'Rocky_R', 'Chandu_7',
  'Sachin_8', 'Rohan_1', 'Manish_2', 'Ritu_P', 'Sunil_9',
  'Hari_K', 'Bunty_M', 'Pintu_R', 'Suman_D', 'Kiran_V',
];

const AVATARS = [
  'https://i.pravatar.cc/30?img=1', 'https://i.pravatar.cc/30?img=2',
  'https://i.pravatar.cc/30?img=3', 'https://i.pravatar.cc/30?img=4',
  'https://i.pravatar.cc/30?img=5', 'https://i.pravatar.cc/30?img=6',
  'https://i.pravatar.cc/30?img=7', 'https://i.pravatar.cc/30?img=8',
  'https://i.pravatar.cc/30?img=9', 'https://i.pravatar.cc/30?img=10',
];

export interface FakeEntry {
  id: number;
  name: string;
  avatar: string;
  bet: number;
  won: boolean;
  winAmount: number;
  multiplier?: number;
  timestamp: number;
}

function generateEntry(showMultiplier = false): FakeEntry {
  const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
  const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const bet = [10, 20, 50, 100, 200, 500, 1000][Math.floor(Math.random() * 7)];
  const won = Math.random() > 0.35; // 65% win rate for visual effect
  const multiplier = showMultiplier
    ? parseFloat((1.2 + Math.random() * 8).toFixed(2))
    : undefined;
  const winAmount = won ? Math.floor(bet * (multiplier || (1.5 + Math.random() * 2))) : 0;

  return { id: Date.now() + Math.random(), name, avatar, bet, won, winAmount, multiplier, timestamp: Date.now() };
}

interface FakePanelProps {
  showMultiplier?: boolean;
  maxVisible?: number;
  label?: string;
}

export const FakePlayersPanel = ({
  showMultiplier = false,
  maxVisible = 10,
  label = 'Live Players',
}: FakePanelProps) => {
  const [entries, setEntries] = useState<FakeEntry[]>(() =>
    Array.from({ length: maxVisible }, () => generateEntry(showMultiplier))
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const newEntry = generateEntry(showMultiplier);
      setEntries(prev => [newEntry, ...prev].slice(0, maxVisible));
    }, 1200 + Math.random() * 800);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showMultiplier, maxVisible]);

  return (
    <div className="w-full bg-black/30 rounded-xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-white/5">
        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[8px] text-green-400 font-bold">{220 + Math.floor(Math.random() * 80)} LIVE</span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 px-3 py-1 text-[7px] text-gray-600 font-bold uppercase tracking-widest">
        <span>Player</span>
        <span className="text-center">Bet</span>
        <span className="text-right">{showMultiplier ? 'Cashout' : 'Win'}</span>
      </div>

      {/* Entries */}
      <div className="overflow-hidden" style={{ maxHeight: '200px' }}>
        <AnimatePresence>
          {entries.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-3 px-3 py-1 border-b border-white/[0.03] items-center hover:bg-white/5 transition-colors"
            >
              {/* Player */}
              <div className="flex items-center gap-1.5 overflow-hidden">
                <img src={e.avatar} className="w-4 h-4 rounded-full shrink-0" alt="" />
                <span className="text-[9px] text-gray-300 font-bold truncate">{e.name}</span>
              </div>

              {/* Bet */}
              <div className="text-center text-[9px] text-gray-400 font-bold">₹{e.bet}</div>

              {/* Win */}
              <div className="text-right">
                {e.won ? (
                  <span className="text-[9px] text-green-400 font-black flex items-center justify-end gap-0.5">
                    {showMultiplier && <span className="text-[8px] text-green-300">{e.multiplier}x</span>}
                    <TrendingUp className="w-2.5 h-2.5" />
                    ₹{e.winAmount}
                  </span>
                ) : (
                  <span className="text-[9px] text-red-500/60 font-bold flex items-center justify-end gap-0.5">
                    <TrendingDown className="w-2.5 h-2.5" />
                    ₹{e.bet}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FakePlayersPanel;
