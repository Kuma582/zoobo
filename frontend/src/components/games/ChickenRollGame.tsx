import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Wallet, 
  History, 
  Flame, 
  Trophy, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Sparkles, 
  ArrowUp, 
  CheckCircle
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import FakePlayersPanel from './FakePlayersPanel';

interface ChickenRollGameProps {
  onBack: () => void;
}

type GameState = 'IDLE' | 'PLAYING' | 'CRASHED' | 'WON';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type JumpState = 'IDLE' | 'JUMPING';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

const CHIPS = [10, 50, 100, 500, 1000];

// Multipliers from reference video
const MULTIPLIERS: Record<Difficulty, number[]> = {
  EASY: [1.00, 1.05, 1.15, 1.30, 1.50, 1.75, 2.10, 2.60, 3.30, 4.30, 5.80],
  MEDIUM: [1.00, 1.12, 1.30, 1.55, 1.90, 2.40, 3.10, 4.10, 5.60, 8.00, 12.00],
  HARD: [1.00, 1.19, 1.47, 1.84, 2.32, 2.97, 3.84, 5.05, 6.78, 9.32, 13.25]
};

const getCrashProbability = (difficulty: Difficulty, nextLane: number, betAmount: number): number => {
  const isHighBet = betAmount > 100;

  if (difficulty === 'EASY') {
    if (isHighBet) {
      if (nextLane <= 2) return 0.50; // 50% crash chance even on step 1-2!
      return 0.80;                    // 80% crash chance on higher steps
    }
    if (nextLane <= 2) return 0.10; // 10% crash chance (90% safe)
    if (nextLane <= 4) return 0.20; // 20% crash chance
    if (nextLane <= 6) return 0.30; // 30% crash chance
    return 0.40;                    // 40% crash chance
  }
  if (difficulty === 'MEDIUM') {
    if (isHighBet) {
      if (nextLane <= 2) return 0.65; // 65% crash chance
      return 0.85;                    // 85% crash chance
    }
    if (nextLane <= 2) return 0.15; // 15% crash chance
    if (nextLane <= 4) return 0.30; // 30% crash chance
    if (nextLane <= 6) return 0.45; // 45% crash chance
    return 0.60;                    // 60% crash chance
  }
  // HARD
  if (isHighBet) {
    if (nextLane <= 2) return 0.80;   // 80% crash chance (very hard to even start!)
    return 0.95;                      // 95% crash chance (virtually impossible to win!)
  }
  if (nextLane <= 2) return 0.20;   // 20% crash chance (80% safe for initial hook!)
  if (nextLane <= 4) return 0.40;   // 40% crash chance
  if (nextLane <= 6) return 0.60;   // 60% crash chance
  return 0.75;                      // 75% crash chance (high company profit for deep runs!)
};

// Sound synthesizer using Web Audio API
class AudioSynth {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {}

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playJump() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio failed to play', e);
    }
  }

  playCrash() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio failed to play', e);
    }
  }

  playCashout() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.15, this.ctx!.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.08 + 0.15);

        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.15);
      });
    } catch (e) {
      console.warn('Audio failed to play', e);
    }
  }
}

const synth = new AudioSynth();

const ChickenRollGame = ({ onBack }: ChickenRollGameProps) => {
  const { balance, deductMoney, addMoney } = useWallet();
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [difficulty, setDifficulty] = useState<Difficulty>('HARD');
  const [muted, setMuted] = useState(false);

  // Betting States
  const [selectedChip, setSelectedChip] = useState(100);
  const [betAmount, setBetAmount] = useState(0);
  const [winAmount, setWinAmount] = useState(0);

  // Gameplay States
  const [chickenLane, setChickenLane] = useState(0); // 0 = start safe, 1-10 = active lanes
  const [jumpState, setJumpState] = useState<JumpState>('IDLE');
  const [placedBarricades, setPlacedBarricades] = useState<number[]>([]);
  const [crashVehicle, setCrashVehicle] = useState<{ lane: number; color: string; type: 'car' | 'truck' } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  const frameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const gameActiveRef = useRef<boolean>(false);
  const [history, setHistory] = useState<number[]>([1.25, 0, 2.3, 3.5, 0, 1.65, 5.05]);

  const toggleMuted = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    synth.setMuted(nextMuted);
  };

  // Main 60FPS Particle Emitters loop
  useEffect(() => {
    const gameLoop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 16.666;
      lastTimeRef.current = time;

      // Update Particles
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        alpha: p.alpha - 0.02 * dt
      })).filter(p => p.alpha > 0));

      frameIdRef.current = requestAnimationFrame(gameLoop);
    };

    frameIdRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, []);

  // Place Bet / Start Game
  const handlePlay = () => {
    if (gameState !== 'IDLE') return;

    if (balance < selectedChip) {
      alert("Insufficient balance!");
      return;
    }

    if (deductMoney(selectedChip, 'Chicken Road Bet')) {
      setBetAmount(selectedChip);
      setChickenLane(0);
      setJumpState('IDLE');
      setWinAmount(0);
      setPlacedBarricades([]);
      setCrashVehicle(null);
      setGameState('PLAYING');
      gameActiveRef.current = true;
    }
  };

  // Jump to Next Lane
  const handleJump = () => {
    if (gameState !== 'PLAYING' || jumpState === 'JUMPING') return;

    setJumpState('JUMPING');
    synth.playJump();

    // Spawn dust particles at current lane
    spawnParticles(50, 735 - chickenLane * 70, '#ffffff', 8);

    const nextLane = chickenLane + 1;
    const isSafe = Math.random() >= getCrashProbability(difficulty, nextLane, betAmount);

    setTimeout(() => {
      setChickenLane(nextLane);

      if (isSafe) {
        // Safe Landing
        setPlacedBarricades(prev => [...prev, nextLane]);
        spawnParticles(50, 735 - nextLane * 70, '#eab308', 5);
        setJumpState('IDLE');

        if (nextLane === 10) {
          // Reached Safe Zone (Won max multiplier!)
          handleWin(MULTIPLIERS[difficulty][10]);
        }
      } else {
        // Trap! Spawn crash vehicle
        setJumpState('IDLE');
        const colors = ['#ef4444', '#f97316', '#3b82f6', '#ec4899', '#10b981'];
        setCrashVehicle({
          lane: nextLane,
          color: colors[Math.floor(Math.random() * colors.length)],
          type: Math.random() > 0.5 ? 'truck' : 'car'
        });

        // Trigger crash collision at center point (approx 250ms into vehicle travel)
        setTimeout(() => {
          handleCrash(nextLane);
        }, 220);
      }
    }, 220); // Quick 220ms jump transition
  };

  // Cash Out
  const handleCashOut = () => {
    if (gameState !== 'PLAYING' || chickenLane === 0) return;
    handleWin(MULTIPLIERS[difficulty][chickenLane]);
  };

  // Win Action
  const handleWin = (finalMultiplier: number) => {
    gameActiveRef.current = false;
    const winnings = Math.floor(betAmount * finalMultiplier);
    setWinAmount(winnings);
    setGameState('WON');
    addMoney(winnings, `Chicken Road Cash Out (x${finalMultiplier.toFixed(2)})`);
    synth.playCashout();

    // Update game history
    setHistory(prev => [finalMultiplier, ...prev].slice(0, 10));

    // Return to idle state after 3.5 seconds
    setTimeout(() => {
      setGameState('IDLE');
      setChickenLane(0);
      setBetAmount(0);
      setPlacedBarricades([]);
      setCrashVehicle(null);
    }, 3500);
  };

  // Crash Action
  const handleCrash = (crashLane: number) => {
    gameActiveRef.current = false;
    setGameState('CRASHED');
    synth.playCrash();

    // Exploding chicken feathers & flame particles
    spawnParticles(50, 735 - crashLane * 70, '#f59e0b', 15);
    spawnParticles(50, 735 - crashLane * 70, '#ef4444', 10);
    spawnParticles(50, 735 - crashLane * 70, '#ffffff', 10);

    // Update history with crash (0x)
    setHistory(prev => [0, ...prev].slice(0, 10));

    // Reset game after 3.5 seconds
    setTimeout(() => {
      setGameState('IDLE');
      setChickenLane(0);
      setBetAmount(0);
      setPlacedBarricades([]);
      setCrashVehicle(null);
    }, 3500);
  };

  // Particle Emitter Helper
  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    const newParticles: Particle[] = Array.from({ length: count }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      return {
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0,
        color,
        size: Math.random() * 4 + 3,
        alpha: 1.0
      };
    });

    setParticles(prev => [...prev, ...newParticles]);
  };

  // Current Accumulating Multiplier
  const currentMult = MULTIPLIERS[difficulty][chickenLane];
  const nextMult = MULTIPLIERS[difficulty][Math.min(10, chickenLane + 1)];
  const prospectiveWin = Math.floor(betAmount * currentMult);
  const nextProspectiveWin = Math.floor(betAmount * nextMult);

  return (
    <div className="fixed inset-0 z-50 bg-[#060608] font-sans flex text-white overflow-hidden justify-center">
      
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md h-full bg-[#0e0f12] relative overflow-hidden flex flex-col shadow-[0_0_60px_rgba(234,179,8,0.15)] border-x border-white/5">
        
        {/* Cinematic atmospheric backgrounds */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay" />
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[120%] h-[40%] bg-amber-500/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 w-full h-[30%] bg-gradient-to-t from-black via-black/85 to-transparent" />
        </div>

        {/* Top Header Navigation */}
        <div className="h-16 flex items-center justify-between px-4 bg-black/60 backdrop-blur-md border-b border-white/10 shrink-0 z-20">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-amber-500" />
          </button>
          
          <div className="flex items-center gap-1">
            <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="font-extrabold text-white tracking-widest text-sm uppercase italic">Chicken Road</span>
          </div>

          <button onClick={toggleMuted} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
            {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-amber-500" />}
          </button>
        </div>

        {/* Stats Dashboard (Wallet, Bet, Difficulty) */}
        <div className="bg-black/30 border-b border-white/5 px-4 py-3 flex flex-col gap-2.5 z-20 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest flex items-center gap-1 mb-0.5">
                <Wallet className="w-3 h-3 text-amber-500" /> Balance
              </div>
              <div className="text-sm font-black text-amber-500">₹{balance.toLocaleString()}</div>
            </div>

            {gameState === 'IDLE' ? (
              <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
                {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`text-[9px] font-black px-2.5 py-1 rounded transition-all uppercase tracking-wider
                      ${difficulty === d 
                        ? d === 'EASY' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : d === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'text-gray-400 opacity-60 hover:opacity-100'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            ) : (
              <span className={`text-[9px] font-black px-2.5 py-1 rounded border uppercase tracking-widest
                ${difficulty === 'EASY' ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : difficulty === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {difficulty} MODE
              </span>
            )}
          </div>

          {gameState !== 'IDLE' && (
            <div className="grid grid-cols-3 gap-2 bg-white/5 rounded-xl p-2 border border-white/10 text-center backdrop-blur-md">
              <div>
                <div className="text-[8px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Active Bet</div>
                <div className="text-xs font-black text-white">₹{betAmount}</div>
              </div>
              <div className="border-x border-white/10">
                <div className="text-[8px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Multiplier</div>
                <div className="text-xs font-black text-amber-400">{currentMult.toFixed(2)}x</div>
              </div>
              <div>
                <div className="text-[8px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Potential Win</div>
                <div className="text-xs font-black text-green-400">₹{prospectiveWin}</div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Road / Game Board Section */}
        <div className="flex-1 relative flex flex-col z-10 min-h-0 bg-[#16171d] select-none border-b border-white/5 overflow-hidden">
          
          {/* Camera Scrolling Wrapper */}
          <motion.div 
            animate={{ translateY: Math.max(0, (chickenLane - 2) * 70) }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="absolute left-0 right-0 bottom-[40px]"
            style={{
              height: '770px',
            }}
          >
            {/* Render Lanes from Lane 10 (Finish) down to Lane 0 (Start) */}
            {Array.from({ length: 11 }, (_, i) => 10 - i).map(laneIdx => {
              const isFinish = laneIdx === 10;
              const isStart = laneIdx === 0;
              const isSafeLane = placedBarricades.includes(laneIdx);

              if (isFinish) {
                return (
                  <div key={laneIdx} className="h-[70px] bg-gradient-to-b from-amber-600/30 via-yellow-600/10 to-transparent border-b border-amber-500/20 flex items-center justify-between px-4 relative">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000),linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)] bg-[size:8px_8px] bg-[position:0_0,4px_4px] opacity-10 absolute inset-x-0 bottom-0 h-2" />
                    <div className="flex items-center gap-1.5 z-10">
                      <Trophy className="w-4 h-4 text-yellow-400 animate-bounce" />
                      <span className="text-[10px] font-black text-yellow-300 tracking-wider uppercase">SAFE FINISH!</span>
                    </div>
                    <span className="text-xs font-black text-yellow-400 z-10">{MULTIPLIERS[difficulty][10].toFixed(2)}x</span>
                  </div>
                );
              }

              if (isStart) {
                return (
                  <div key={laneIdx} className="h-[70px] bg-[#14201a] border-t border-emerald-900/40 flex items-center justify-between px-4">
                    <span className="text-[10px] font-black text-emerald-500/80 tracking-widest uppercase">Start safe</span>
                    <span className="text-xs font-bold text-emerald-500/80">1.00x</span>
                  </div>
                );
              }

              return (
                <div key={laneIdx} className="h-[70px] bg-[#1b1c24] border-b border-white/5 flex items-center justify-between px-4 relative">
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">LANE {laneIdx}</span>
                  <span className="text-xs font-bold text-gray-500">{MULTIPLIERS[difficulty][laneIdx].toFixed(2)}x</span>
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5 border-b border-dashed border-white/20" />

                  {/* Render Persistent Barricade if lane is completed successfully */}
                  {isSafeLane && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute left-[20%] top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                    >
                      <div className="w-5 h-7 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_4px,#000_4px,#000_8px)] border border-amber-400 rounded shadow-md flex items-center justify-center relative">
                        <span className="text-[5px] font-black text-white bg-black px-0.5 rounded select-none uppercase tracking-wide">SAFE</span>
                        <div className="absolute bottom-[-3px] left-0 w-0.5 h-3 bg-gray-600 rounded-sm" style={{ transform: 'skewX(-15deg)' }} />
                        <div className="absolute bottom-[-3px] right-0 w-0.5 h-3 bg-gray-600 rounded-sm" style={{ transform: 'skewX(15deg)' }} />
                      </div>
                    </motion.div>
                  )}

                  {/* Crash vehicle zoom animation */}
                  {crashVehicle && crashVehicle.lane === laneIdx && (
                    <motion.div
                      initial={{ left: '-25%' }}
                      animate={{ left: '115%' }}
                      transition={{ duration: 0.55, ease: 'linear' }}
                      className="absolute h-8 rounded flex items-center justify-center shadow-lg border border-black/40 z-20"
                      style={{
                        width: '65px',
                        backgroundColor: crashVehicle.color,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                    >
                      {/* Windows */}
                      <div className="absolute top-1 right-1 w-2.5 h-1.5 bg-sky-200/60 rounded-sm" />
                      {/* Lights */}
                      <div className="absolute bottom-1 right-0 w-1 h-1 bg-yellow-200" />
                      {/* Wheels */}
                      <div className="absolute bottom-[-2px] left-2 w-3 h-2 bg-black rounded-t-sm" />
                      <div className="absolute bottom-[-2px] right-2 w-3 h-2 bg-black rounded-t-sm" />
                      <span className="text-xs font-black text-black/85 uppercase z-10 select-none">
                        {crashVehicle.type}
                      </span>
                    </motion.div>
                  )}
                </div>
              );
            })}

            {/* Dust / Smoke Particles */}
            <div className="absolute inset-0 pointer-events-none z-15">
              {particles.map(p => (
                <div
                  key={p.id}
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}px`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: p.color,
                    opacity: p.alpha,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute rounded-full transition-all duration-75"
                />
              ))}
            </div>

            {/* The Cute Chicken Character */}
            <motion.div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: `${chickenLane * 70 + 15}px`,
                transform: 'translateX(-50%)',
              }}
              animate={
                gameState === 'CRASHED' 
                  ? { rotate: [0, 720, 1080], scale: [1, 1.8, 0], y: [0, -100, 200] }
                  : jumpState === 'JUMPING'
                    ? { y: [-15, -35, -5], scale: [1, 1.35, 1.05] }
                    : { y: [0, -2, 0] }
              }
              transition={
                gameState === 'CRASHED'
                  ? { duration: 1.5, ease: 'easeOut' }
                  : jumpState === 'JUMPING'
                    ? { duration: 0.22, ease: 'easeInOut' }
                    : { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
              }
              className="absolute w-12 h-12 z-25 flex items-center justify-center"
            >
              {/* Dynamic visual indicator representing Current Multiplier */}
              {gameState === 'PLAYING' && (
                <div className="absolute top-[-26px] bg-black/80 px-2 py-0.5 rounded border border-amber-500/50 text-[9px] font-black text-amber-400 uppercase tracking-widest whitespace-nowrap animate-bounce">
                  {currentMult.toFixed(2)}x
                </div>
              )}

              {/* Visual Shadow below chicken */}
              <div className={`absolute bottom-0 w-8 h-2.5 bg-black/45 rounded-full blur-[1.5px] transition-all
                ${jumpState === 'JUMPING' ? 'scale-50 opacity-20' : 'scale-100 opacity-100'}`} />

              {/* Chicken graphic container */}
              <div className={`w-10 h-10 relative flex items-center justify-center rounded-full
                ${gameState === 'CRASHED' ? 'brightness-50 grayscale contrast-125' : ''}`}>
                
                {/* Chicken body */}
                <div className="absolute w-8 h-8 bg-amber-400 rounded-full border border-amber-500 shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.2)]" />
                
                {/* Comb (Red crest) */}
                <div className="absolute top-[-4px] w-3 h-2.5 bg-red-500 rounded-t-full border-x border-red-600" />
                
                {/* Beak */}
                <div className="absolute bottom-3 w-2.5 h-2.5 bg-orange-500 rotate-45 border-r border-b border-orange-600 z-10" />

                {/* Eyes */}
                <div className="absolute top-2.5 left-2 w-2 h-2.5 bg-white rounded-full flex items-center justify-center border border-black/10">
                  <div className="w-1 h-1 bg-black rounded-full" />
                </div>
                <div className="absolute top-2.5 right-2 w-2 h-2.5 bg-white rounded-full flex items-center justify-center border border-black/10">
                  <div className="w-1 h-1 bg-black rounded-full" />
                </div>

                {/* Little Wings */}
                <motion.div 
                  animate={jumpState === 'JUMPING' ? { rotateZ: [-30, 30, -30] } : { rotateZ: 0 }}
                  transition={{ duration: 0.1, repeat: 2 }}
                  className="absolute left-[-2px] top-3.5 w-2 h-3 bg-amber-300 rounded-l-full border border-amber-500 origin-right" 
                />
                <motion.div 
                  animate={jumpState === 'JUMPING' ? { rotateZ: [30, -30, 30] } : { rotateZ: 0 }}
                  transition={{ duration: 0.1, repeat: 2 }}
                  className="absolute right-[-2px] top-3.5 w-2 h-3 bg-amber-300 rounded-r-full border border-amber-500 origin-left" 
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Game Over / Win Screens overlays */}
          <AnimatePresence>
            {gameState === 'CRASHED' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-red-950/70 backdrop-blur-md z-30 flex flex-col items-center justify-center"
              >
                <motion.div 
                  initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  className="bg-black/60 border border-red-500 p-6 rounded-3xl flex flex-col items-center shadow-2xl"
                >
                  <AlertTriangle className="w-14 h-14 text-red-500 mb-3 animate-bounce" />
                  <h3 className="text-xl font-black text-white uppercase tracking-widest mb-1">CHICKEN CRASHED</h3>
                  <p className="text-xs text-red-400 font-bold">Lost ₹{betAmount}</p>
                </motion.div>
              </motion.div>
            )}

            {gameState === 'WON' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-yellow-950/70 backdrop-blur-md z-30 flex flex-col items-center justify-center"
              >
                <motion.div 
                  initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  className="bg-black/60 border border-yellow-500 p-6 rounded-3xl flex flex-col items-center shadow-2xl"
                >
                  <Sparkles className="w-14 h-14 text-yellow-400 mb-3 animate-spin" />
                  <h3 className="text-xl font-black text-white uppercase tracking-widest mb-1">CASH OUT SUCCESS</h3>
                  <p className="text-2xl font-black text-yellow-400 mt-1">+₹{winAmount}</p>
                  <p className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-wider mt-1">Multiplier: {currentMult.toFixed(2)}x</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* History Log ticker */}
        <div className="px-4 py-2 bg-[#0e0f12] z-20 relative shrink-0">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-xl p-2.5 border border-white/5">
            <History className="w-4 h-4 text-gray-500 shrink-0" />
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
              {history.map((val, i) => (
                <div key={i} className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 border
                  ${val >= 5 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    : val > 0 ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                  {val > 0 ? `${val.toFixed(2)}x` : 'Crashed'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Control Console (Play, Jump, Cash Out) */}
        <div className="bg-[#0e0f12] z-20 shrink-0 p-4 border-t border-white/10 rounded-t-[2rem] shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">
          {gameState === 'IDLE' ? (
            // Betting Console
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Select Bet</span>
                <span className="text-xs font-black text-gray-200">
                  Total Bet: <span className="text-amber-500">₹{selectedChip}</span>
                </span>
              </div>
              
              {/* Chips select */}
              <div className="flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-hide pb-3">
                {CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => setSelectedChip(chip)}
                    className={`w-12 h-12 rounded-full border-2 border-dashed shrink-0 flex items-center justify-center transition-all duration-300 relative
                      ${selectedChip === chip 
                        ? 'border-amber-400 bg-gradient-to-br from-amber-500 to-yellow-600 scale-105 shadow-[0_5px_15px_rgba(234,179,8,0.4)] text-black' 
                        : 'border-gray-700 bg-gray-900 opacity-80 hover:opacity-100 text-gray-400'}`}
                  >
                    <span className="font-extrabold text-xs">
                      {chip >= 1000 ? `${chip/1000}k` : chip}
                    </span>
                  </button>
                ))}
              </div>

              {/* Live Players Feed */}
              <div className="my-3">
                <FakePlayersPanel maxVisible={5} label="Live Players" showMultiplier={true} />
              </div>

              {/* Play Button */}
              <button
                onClick={handlePlay}
                className="w-full py-3.5 rounded-2xl font-black text-lg tracking-widest uppercase transition-all border border-amber-400/50
                  bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]
                  hover:brightness-110 active:scale-[0.98]"
              >
                Start Game
              </button>
            </div>
          ) : (
            // Active Gameplay Controls
            <div className="flex gap-4">
              {/* Jump button */}
              <button
                onClick={handleJump}
                disabled={jumpState === 'JUMPING' || gameState !== 'PLAYING'}
                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex flex-col items-center justify-center leading-tight
                  bg-gradient-to-b from-green-500 to-emerald-600 border border-green-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]
                  active:scale-[0.97] disabled:opacity-50 text-white"
              >
                <ArrowUp className="w-5 h-5 mb-1 animate-bounce" />
                <span>Jump Forward</span>
                {chickenLane < 10 && (
                  <span className="text-[9px] text-green-200/80 font-bold mt-0.5">To {nextMult.toFixed(2)}x (₹{nextProspectiveWin})</span>
                )}
              </button>

              {/* Cash out button */}
              <button
                onClick={handleCashOut}
                disabled={chickenLane === 0 || gameState !== 'PLAYING'}
                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex flex-col items-center justify-center leading-tight
                  bg-gradient-to-b from-orange-500 to-amber-600 border border-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.3)]
                  active:scale-[0.97] disabled:opacity-50 disabled:grayscale text-white"
              >
                <CheckCircle className="w-5 h-5 mb-1" />
                <span>Cash Out</span>
                <span className="text-[9px] text-orange-200/80 font-bold mt-0.5">₹{prospectiveWin} ({currentMult.toFixed(2)}x)</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChickenRollGame;
