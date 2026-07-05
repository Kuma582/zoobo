import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Trophy, Zap, Shield, ChevronRight, Star, Users, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchGames, fetchLeaderboard } from '../api/client';

const Home = () => {
  const [games, setGames] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [gamesData, leaderboardData] = await Promise.all([
          fetchGames(),
          fetchLeaderboard()
        ]);
        setGames(gamesData);
        setLeaderboard(leaderboardData);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);
  return (
    <div className="min-h-screen text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-cyber-black/80 z-10" />
          <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" alt="Hero Background" className="w-full h-full object-cover" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tight">
              Play Games <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple via-cyber-pink to-cyber-blue neon-text-purple">Win Big Rewards</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Join the most premium cyberpunk gaming platform. Compete in tournaments, climb the leaderboard, and earn exclusive rewards.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/games">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary px-8 py-4 text-lg w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Gamepad2 className="w-6 h-6" />
                  Play Now
                </motion.button>
              </Link>
              <Link to="/tournaments">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary px-8 py-4 text-lg w-full sm:w-auto"
                >
                  Explore Tournaments
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>


      {/* Popular Games */}
      <section className="py-20 bg-cyber-gray/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black uppercase tracking-wide neon-text-purple">Popular Games</h2>
            <Link to="/games" className="text-cyber-blue hover:text-cyber-pink flex items-center gap-1 font-bold">
              View All <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {games.slice(0, 4).map((game, idx) => (
              <motion.div 
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="glass-card overflow-hidden group cursor-pointer flex flex-col"
              >
                <Link to={`/game/${game.id}`} className="flex flex-col h-full">
                  <div className="h-36 overflow-hidden relative">
                    <img src={game.image} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10 flex items-center justify-center">
                      <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 text-yellow-400 z-20">
                      <Star className="w-3 h-3 fill-current" /> {game.rating}
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-grow gap-2">
                    <h3 className="text-sm font-bold leading-tight line-clamp-2">{game.name}</h3>
                    <div className="flex justify-between items-center w-full mt-auto pt-2 border-t border-white/5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{game.category}</span>
                      <span className="text-[10px] font-black text-cyber-blue bg-cyber-blue/10 px-2 py-1 rounded">
                        {game.entryFee === 0 ? 'FREE' : `₹${game.entryFee}`}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Players Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black uppercase tracking-wide neon-text-blue">Top Players</h2>
            <Link to="/leaderboard" className="text-cyber-purple hover:text-cyber-pink flex items-center gap-1 font-bold">
              Full Leaderboard <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="glass-panel p-1 rounded-2xl overflow-hidden">
            {leaderboard.slice(0, 3).map((player, idx) => (
              <motion.div 
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-cyber-gray text-gray-400'}`}>
                    #{player.rank}
                  </div>
                  <img src={player.avatar} alt={player.username} className="w-12 h-12 rounded-full border-2 border-cyber-purple" />
                  <div>
                    <h4 className="font-bold text-lg">{player.username}</h4>
                    <span className="text-xs text-cyber-blue font-mono">Level {player.level}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-cyber-pink">{player.xp} XP</div>
                  <div className="text-xs text-gray-400">{player.badge}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
