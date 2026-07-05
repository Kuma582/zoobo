import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Star, Users, Gamepad2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchGames } from '../api/client';

const AllGames = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const data = await fetchGames();
        setGames(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadGames();
  }, []);

  const filteredGames = games.filter(game => {
    const matchesCategory = activeCategory === 'All' || game.category === activeCategory;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Search games..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-cyber-gray/40 backdrop-blur-md border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyber-purple transition-all"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredGames.length > 0 ? (
            filteredGames.map((game, idx) => (
              <motion.div 
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
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
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <Gamepad2 className="w-16 h-16 text-cyber-gray mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400">No games found</h3>
              <p className="text-gray-500">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AllGames;
