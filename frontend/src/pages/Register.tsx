import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Lock, User, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  // Password strength
  const getStrength = (p: string) => {
    if (p.length === 0) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', 'text-red-500', 'text-orange-400', 'text-yellow-400', 'text-green-400', 'text-emerald-400'][strength];
  const strengthBg = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-400'][strength];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();

    // Validations
    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (trimmedUsername.length > 20) {
      setError('Username cannot be longer than 20 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);
    try {
      await register(trimmedUsername, password);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror') || msg.toLowerCase().includes('load')) {
        setError('⚠️ Server not reachable. Please make sure the backend is running.');
      } else if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('username')) {
        setError('❌ This username is already taken. Please choose another.');
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#050505] p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-cyber-pink/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-cyber-purple/20 blur-[100px] rounded-full pointer-events-none" />

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
            <Gamepad2 className="w-10 h-10 text-cyber-pink" />
          </motion.div>
          <h1 className="text-3xl font-black uppercase tracking-wide neon-text-pink">Create Account</h1>
          <p className="text-gray-400 mt-2 text-sm">Join ZOOBO and start playing! 🚀</p>
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

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
              <input
                id="register-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                maxLength={20}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyber-pink transition-colors placeholder:text-gray-600"
                placeholder="Choose a username (letters, numbers, _)"
              />
              {username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username) && (
                <CheckCircle2 className="absolute right-4 top-3.5 w-5 h-5 text-green-500" />
              )}
            </div>
            <p className="text-[10px] text-gray-600 mt-1 pl-1">3-20 characters, only letters, numbers and underscore</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-cyber-pink transition-colors placeholder:text-gray-600"
                placeholder="Create a strong password"
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
            {/* Strength bar */}
            {password.length > 0 && (
              <div className="mt-2 px-1">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        i <= strength ? strengthBg : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-[10px] font-bold ${strengthColor}`}>{strengthLabel}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
              <input
                id="register-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                className={`w-full bg-black/40 border rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none transition-colors placeholder:text-gray-600 ${
                  confirmPassword.length > 0
                    ? confirmPassword === password
                      ? 'border-green-500/50 focus:border-green-500'
                      : 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-cyber-pink'
                }`}
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-3.5 text-gray-500 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword.length > 0 && confirmPassword !== password && (
              <p className="text-[10px] text-red-400 mt-1 pl-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit */}
          <button
            id="register-submit"
            type="submit"
            disabled={loading}
            className="w-full btn-secondary py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create Account <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-cyber-pink font-bold hover:underline">
            Login Here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
