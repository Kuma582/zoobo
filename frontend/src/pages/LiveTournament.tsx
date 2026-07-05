import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { fetchLeaderboard } from '../api/client';

const LiveTournament = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  if (leaderboard.length < 3) return <div className="text-white text-center mt-20">Loading...</div>;

  const top3 = leaderboard.slice(0, 3);
  const restOfWinners = leaderboard.slice(3).concat([
    { id: 'u6', username: 'CyberGamer99', avatar: 'https://i.pravatar.cc/150?u=u6', rank: 6, level: 75, xp: '100K', badge: 'Gold' },
    { id: 'u7', username: 'NeonStriker', avatar: 'https://i.pravatar.cc/150?u=u7', rank: 7, level: 68, xp: '95K', badge: 'Silver' },
    { id: 'u8', username: 'TechWizard', avatar: 'https://i.pravatar.cc/150?u=u8', rank: 8, level: 60, xp: '80K', badge: 'Silver' },
  ]);

  return (
    <div className="min-h-screen pt-10 pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-cyber-pink/10 border border-cyber-pink/30 text-cyber-pink px-4 py-1.5 rounded-full text-sm font-bold mb-4"
          >
            <TrendingUp className="w-4 h-4" /> 500+ Players Won Today
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-5xl font-black uppercase tracking-wide neon-text-pink mb-4"
          >
            Daily Winners
          </motion.h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            The biggest winners of the day. Compete in games, climb the ranks, and secure your spot on the daily podium!
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-2 sm:gap-6 mt-16 mb-16 h-64">
          
          {/* Rank 2 - Silver */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center w-1/3 max-w-[120px]"
          >
            <div className="relative mb-2">
              <img src={top3[1].avatar} alt={top3[1].username} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-gray-300" />
              <div className="absolute -bottom-3 -right-2 bg-gray-300 text-black w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 border-black">
                2
              </div>
            </div>
            <div className="text-center truncate w-full font-bold text-sm sm:text-base">{top3[1].username}</div>
            <div className="text-cyber-pink text-xs sm:text-sm font-black mb-3">{top3[1].xp}</div>
            <div className="w-full h-24 sm:h-32 bg-gradient-to-t from-gray-500/40 to-gray-300/20 border border-gray-400/30 rounded-t-lg backdrop-blur-sm flex items-start justify-center pt-4">
              <Medal className="w-8 h-8 text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.8)]" />
            </div>
          </motion.div>

          {/* Rank 1 - Gold */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center w-1/3 max-w-[140px] z-10"
          >
            <div className="relative mb-3">
              <div className="absolute -inset-4 bg-yellow-500/20 blur-xl rounded-full" />
              <img src={top3[0].avatar} alt={top3[0].username} className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-yellow-400 relative z-10" />
              <div className="absolute -bottom-4 -right-2 bg-yellow-400 text-black w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-2 border-black z-20">
                1
              </div>
            </div>
            <div className="text-center truncate w-full font-black text-lg sm:text-xl text-yellow-400">{top3[0].username}</div>
            <div className="text-cyber-pink text-sm sm:text-base font-black mb-4">{top3[0].xp}</div>
            <div className="w-full h-32 sm:h-40 bg-gradient-to-t from-yellow-600/50 to-yellow-400/20 border-2 border-yellow-500/50 rounded-t-lg backdrop-blur-sm shadow-[0_0_30px_rgba(250,204,21,0.3)] flex items-start justify-center pt-4">
              <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]" />
            </div>
          </motion.div>

          {/* Rank 3 - Bronze */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center w-1/3 max-w-[120px]"
          >
            <div className="relative mb-2">
              <img src={top3[2].avatar} alt={top3[2].username} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-amber-700" />
              <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border-2 border-black">
                3
              </div>
            </div>
            <div className="text-center truncate w-full font-bold text-sm">{top3[2].username}</div>
            <div className="text-cyber-pink text-xs font-black mb-2">{top3[2].xp}</div>
            <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-amber-900/40 to-amber-700/20 border border-amber-700/30 rounded-t-lg backdrop-blur-sm flex items-start justify-center pt-3">
              <Award className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.8)]" />
            </div>
          </motion.div>

        </div>

        {/* History / Recent Winners List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-6 text-white px-2">Recent Winners</h2>
          <div className="space-y-3">
            {restOfWinners.map((winner, idx) => (
              <motion.div 
                key={winner.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-cyber-gray/30 backdrop-blur-sm border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-cyber-gray/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-gray-500 font-bold w-6 text-center">#{winner.rank}</div>
                  <img src={winner.avatar} alt={winner.username} className="w-12 h-12 rounded-full border border-white/10" />
                  <div>
                    <h4 className="font-bold text-white text-base">{winner.username}</h4>
                    <span className="text-xs text-cyber-blue">{winner.badge}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-cyber-pink text-sm sm:text-base">{winner.xp}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Won Today</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LiveTournament;
