import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, Users, ArrowLeft, Trophy, Coins, Gamepad2, X, Loader2 } from 'lucide-react';
import { fetchGames } from '../api/client';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import ChickenRollGame from '../components/games/ChickenRollGame';
import AviatorGame from '../components/games/AviatorGame';
import LuckySpinGame from '../components/games/LuckySpinGame';
import MinesGame from '../components/games/MinesGame';
import DragonTigerGame from '../components/games/DragonTigerGame';
import ColorPredictionGame from '../components/games/ColorPredictionGame';
import SlotMachineGame from '../components/games/SlotMachineGame';
import TeenPattiGame from '../components/games/TeenPattiGame';
import TreasureBombGame from '../components/games/TreasureBombGame';
import DiceRollGame from '../components/games/DiceRollGame';
import WinGoGame from '../components/games/WinGoGame';
import PokerGame from '../components/games/PokerGame';
import CoinFlipGame from '../components/games/CoinFlipGame';
import NumberPredictionGame from '../components/games/NumberPredictionGame';

const GameDetails = () => {
  const { id } = useParams();
  const [game, setGame] = useState<any>(null);

  useEffect(() => {
    const loadGame = async () => {
      try {
        const data = await fetchGames();
        const found = data.find((g: any) => g.id === id);
        if (found) setGame(found);
      } catch (err) {
        console.error(err);
      }
    };
    loadGame();
  }, [id]);

  const { deductMoney, balance } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate game loading
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying && isLoading) {
      timeout = setTimeout(() => {
        setIsLoading(false);
      }, 3000); // 3 seconds loading
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, isLoading]);

  if (!game) {
    return <div className="min-h-screen pt-20 text-center text-white">Loading Game...</div>;
  }

  const handlePlay = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setIsPlaying(true);
    setIsLoading(true);
  };

  const renderGameComponent = () => {
    if (game.id === 'g24') return <NumberPredictionGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g23') return <CoinFlipGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g22') return <PokerGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g21') return <WinGoGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g20') return <DiceRollGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g19') return <TreasureBombGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g18') return <TeenPattiGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g17') return <SlotMachineGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g16') return <ColorPredictionGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g15') return <DragonTigerGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g14') return <MinesGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g13') return <LuckySpinGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g12') return <ChickenRollGame onBack={() => setIsPlaying(false)} />;
    if (game.id === 'g11') return <AviatorGame onBack={() => setIsPlaying(false)} />;
    
    // Default fallback layout for games not yet implemented
    return (
      <div className="fixed inset-0 z-50 bg-cyber-black flex flex-col font-sans w-full max-w-md mx-auto shadow-2xl border-x border-white/5">
        <div className="bg-black/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-white/10 z-20">
          <div className="text-xl font-bold neon-text-blue flex items-center gap-2">
            <Gamepad2 className="w-6 h-6" /> {game.name}
          </div>
          <button onClick={() => setIsPlaying(false)} className="text-white hover:text-red-400 font-bold px-4 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all flex items-center gap-2 border border-red-500/50">
            <X className="w-5 h-5" /> Quit Game
          </button>
        </div>
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
          <img src={game.image} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
          <div className="relative w-full max-w-sm aspect-square bg-cyber-gray/50 rounded-2xl border border-cyber-purple/30 shadow-[0_0_50px_rgba(188,19,254,0.15)] flex flex-col items-center justify-center overflow-hidden backdrop-blur-sm p-6 text-center">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-cyber-pink animate-spin mb-4" />
                <h2 className="text-2xl font-black uppercase text-white mb-2">Loading</h2>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Gamepad2 className="w-16 h-16 text-cyber-blue mb-4 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
                <h2 className="text-3xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue to-cyber-purple mb-4">Started</h2>
                <button onClick={() => { alert('Simulating game win! +50 XP'); setIsPlaying(false); }} className="mt-4 btn-primary px-8 py-3 w-full">
                  Simulate Win
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Game Header Banner */}
      <div 
        className="relative min-h-[50vh] w-full flex flex-col justify-between px-4 sm:px-8 pt-6 pb-10 cursor-pointer group overflow-hidden"
        onClick={handlePlay}
      >
        <div className="absolute inset-0 bg-cyber-black/50 z-10 transition-colors group-hover:bg-cyber-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-black via-transparent to-transparent z-10" />
        <img src={game.image} alt={game.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        
        {/* Huge Play Icon Overlay (Native App Style) */}
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform">
            <Play className="w-10 h-10 text-white fill-current ml-2" />
          </div>
        </div>

        <div className="relative z-30 flex justify-between items-start">
          <Link 
            to="/games" 
            onClick={(e) => e.stopPropagation()} 
            className="inline-flex items-center gap-2 text-white hover:text-cyber-pink transition-colors font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </Link>

          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Entry</span>
            <span className="font-black text-yellow-500 text-sm">{game.entryFee === 0 ? 'FREE' : `₹${game.entryFee}`}</span>
          </div>
        </div>

        <div className="relative z-30 mt-12 flex flex-col items-start gap-2">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cyber-purple px-3 py-1 rounded text-sm font-bold inline-block"
          >
            {game.category}
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black uppercase neon-text-blue leading-tight"
          >
            {game.name}
          </motion.h1>
        </div>
      </div>

      {/* App-like Game Stats Row */}
      <div className="px-4 sm:px-8 mt-2">
        <div className="flex items-center justify-between py-4 border-y border-white/5 overflow-x-auto scrollbar-hide gap-6">
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1 uppercase tracking-widest font-bold">
              <Star className="w-3 h-3 text-yellow-400" /> Rating
            </div>
            <div className="text-xl font-black text-white">{game.rating}</div>
          </div>
          
          <div className="w-px h-8 bg-white/10 shrink-0" />

          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1 uppercase tracking-widest font-bold">
              <Users className="w-3 h-3 text-cyber-blue" /> Online
            </div>
            <div className="text-xl font-black text-white">
              {game.playersOnline >= 1000 ? (game.playersOnline / 1000).toFixed(1) + 'k' : game.playersOnline}
            </div>
          </div>

          <div className="w-px h-8 bg-white/10 shrink-0" />

          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1 uppercase tracking-widest font-bold">
              <Trophy className="w-3 h-3 text-cyber-pink" /> Level
            </div>
            <div className="text-xl font-black text-white">{game.difficulty}</div>
          </div>
          
          <div className="w-px h-8 bg-white/10 shrink-0" />

          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1 uppercase tracking-widest font-bold">
              <Coins className="w-3 h-3 text-yellow-500" /> Entry
            </div>
            <div className="text-xl font-black text-white">
              {game.entryFee === 0 ? 'Free' : `₹${game.entryFee}`}
            </div>
          </div>
        </div>
      </div>

      {/* App-like About Section */}
      <div className="px-4 sm:px-8 mt-8 space-y-8">
        <div>
          <h3 className="text-xl font-black mb-3 text-white">About this game</h3>
          <p className="text-gray-400 leading-relaxed text-sm font-medium">
            Experience the ultimate {game.category.toLowerCase()} challenge in a cyberpunk setting. Compete with players worldwide, earn XP, and unlock exclusive rewards. Features stunning neon visuals and smooth gameplay mechanics designed for competitive players.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-black mb-3 text-white">How to Play</h3>
          <ul className="list-disc list-inside text-gray-400 space-y-2 text-sm font-medium">
            <li>Join a match by clicking Play Now.</li>
            <li>Follow the objective for the specific game mode.</li>
            <li>Win matches to gain XP and rank up on the leaderboard.</li>
            <li>Participate in daily tournaments for huge coin rewards.</li>
          </ul>
        </div>
      </div>

      {/* App-like Game Modal Slide-up Transition */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] flex justify-center bg-black"
          >
            <div className="w-full max-w-md h-full relative">
              {renderGameComponent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameDetails;
