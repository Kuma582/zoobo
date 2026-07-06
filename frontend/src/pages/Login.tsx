import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Lock, User, ArrowRight, Loader2, Eye, EyeOff, WifiOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Please enter your username.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmedUsername, password);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror') || msg.toLowerCase().includes('load')) {
        setError('⚠️ Server not reachable. Please make sure the backend is running.');
      } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        setError('❌ Wrong username or password. Please try again.');
      } else {
        setError(msg || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#050505] p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyber-purple/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyber-blue/20 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-cyber-gray-light/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/10 mb-4"
          >
            <Gamepad2 className="w-10 h-10 text-cyber-blue" />
          </motion.div>
          <h1 className="text-3xl font-black uppercase tracking-wide neon-text-blue">ZOOBO</h1>
          <p className="text-gray-400 mt-2 text-sm">Welcome back, player! 🎮</p>
        </div>

        {/* Error Box */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl mb-6 text-center flex items-center justify-center gap-2"
          >
            {error.includes('reachable') && <WifiOff className="w-4 h-4 flex-shrink-0" />}
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyber-blue transition-colors placeholder:text-gray-600"
                placeholder="Enter your username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-cyber-blue transition-colors placeholder:text-gray-600"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-gray-500 hover:text-white transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                Login to Play <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-8 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyber-blue font-bold hover:underline">
            Register Now
          </Link>
        </div>

        {/* Demo account hint */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => { setUsername('NeonNinja'); setPassword('password123'); }}
            className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
          >
            Use demo account
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
