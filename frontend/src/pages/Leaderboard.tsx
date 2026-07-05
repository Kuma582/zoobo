import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';
import { mockLeaderboard } from '../data/mockData';

const Leaderboard = () => {
  return (
    <div className="min-h-screen pt-10 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-black uppercase tracking-wide mb-2 neon-text-purple">Global Leaderboard</h1>
          <p className="text-gray-400">Top players across the ZOOBO universe</p>
        </div>

        {/* Top 3 Podium */}
        <div className="flex justify-center items-end gap-2 sm:gap-6 mb-16 h-64">
          {[mockLeaderboard[1], mockLeaderboard[0], mockLeaderboard[2]].map((player, i) => {
            if (!player) return null;
            const isFirst = i === 1;
            const isSecond = i === 0;
            const isThird = i === 2;
            
            return (
              <motion.div 
                key={player.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`flex flex-col items-center relative ${isFirst ? 'w-32 sm:w-40 z-10' : 'w-28 sm:w-32'}`}
              >
                {isFirst && <div className="absolute -top-10"><Trophy className="w-8 h-8 text-yellow-400" /></div>}
                {isSecond && <div className="absolute -top-10"><Medal className="w-8 h-8 text-gray-300" /></div>}
                {isThird && <div className="absolute -top-10"><Medal className="w-8 h-8 text-amber-700" /></div>}
                
                <img 
                  src={player.avatar} 
                  alt={player.username} 
                  className={`rounded-full border-4 ${isFirst ? 'w-24 h-24 border-yellow-400' : isSecond ? 'w-20 h-20 border-gray-300' : 'w-20 h-20 border-amber-700'} mb-4`} 
                />
                
                <div 
                  className={`w-full rounded-t-lg flex flex-col items-center justify-center p-2 text-center shadow-lg ${
                    isFirst ? 'bg-gradient-to-t from-yellow-600/50 to-yellow-400/20 h-40 border-t-2 border-yellow-400' : 
                    isSecond ? 'bg-gradient-to-t from-gray-600/50 to-gray-400/20 h-32 border-t-2 border-gray-300' : 
                    'bg-gradient-to-t from-amber-900/50 to-amber-700/20 h-28 border-t-2 border-amber-700'
                  }`}
                >
                  <span className="font-bold truncate w-full px-1">{player.username}</span>
                  <span className="text-sm font-black mt-1 text-white">{player.xp} XP</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* List */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 text-gray-400 text-sm font-bold border-b border-white/10 uppercase tracking-wider bg-cyber-gray-light">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-2 text-center">Level</div>
            <div className="col-span-2 text-center">Badge</div>
            <div className="col-span-2 text-right">Total XP</div>
          </div>

          {mockLeaderboard.slice(3).map((player, idx) => (
            <motion.div 
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + (idx * 0.05) }}
              className="grid grid-cols-12 gap-4 p-4 items-center border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
            >
              <div className="col-span-2 md:col-span-1 flex justify-center">
                <span className="font-black text-gray-500 text-xl">#{player.rank}</span>
              </div>
              <div className="col-span-10 md:col-span-5 flex items-center gap-3">
                <img src={player.avatar} alt={player.username} className="w-10 h-10 rounded-full" />
                <span className="font-bold text-lg">{player.username}</span>
              </div>
              <div className="hidden md:flex col-span-2 justify-center">
                <span className="bg-cyber-gray px-3 py-1 rounded text-cyber-blue font-mono text-sm border border-cyber-blue/30">{player.level}</span>
              </div>
              <div className="hidden md:flex col-span-2 justify-center items-center gap-1">
                <Star className="w-4 h-4 text-cyber-pink" />
                <span className="text-sm">{player.badge}</span>
              </div>
              <div className="hidden md:flex col-span-2 justify-end font-bold text-cyber-pink">
                {player.xp}
              </div>
              
              {/* Mobile details */}
              <div className="md:hidden col-span-12 flex justify-between mt-2 pt-2 border-t border-white/5">
                <span className="text-cyber-blue text-sm">Level {player.level}</span>
                <span className="text-cyber-pink font-bold">{player.xp} XP</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Leaderboard;
