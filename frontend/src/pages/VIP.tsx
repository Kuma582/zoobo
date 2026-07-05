import { motion } from 'framer-motion';
import { Crown, Check } from 'lucide-react';

const VIP = () => {
  return (
    <div className="min-h-screen pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-black uppercase tracking-wide neon-text-purple mb-4">VIP Club</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">Upgrade to VIP to unlock exclusive features, premium tournaments, and double XP rewards.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Basic */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 border border-white/10 hover:border-cyber-blue transition-colors"
          >
            <h3 className="text-2xl font-bold mb-2 text-white">Pro</h3>
            <div className="text-3xl font-black mb-6 text-cyber-blue">$9.99<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 text-gray-300">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-cyber-blue" /> Access to Pro Tournaments</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-cyber-blue" /> Custom Avatar Borders</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-cyber-blue" /> 1.5x XP Boost</li>
            </ul>
            <button className="btn-secondary w-full py-3">Subscribe Now</button>
          </motion.div>

          {/* Premium */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8 border-2 border-cyber-purple relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(177,75,244,0.3)]"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-purple text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white mt-4">Elite</h3>
            <div className="text-4xl font-black mb-6 text-cyber-purple">$19.99<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 text-gray-100">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-cyber-purple" /> Access to ALL Tournaments</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-cyber-purple" /> Animated Avatar Borders</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-cyber-purple" /> 2x XP Boost</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-cyber-purple" /> Priority Support</li>
            </ul>
            <button className="btn-primary w-full py-3">Subscribe Now</button>
          </motion.div>

          {/* Ultimate */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 border border-white/10 hover:border-cyber-pink transition-colors"
          >
            <h3 className="text-2xl font-bold mb-2 text-white">Legend</h3>
            <div className="text-3xl font-black mb-6 text-cyber-pink">$49.99<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 text-gray-300">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-cyber-pink" /> Everything in Elite</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-cyber-pink" /> 3x XP Boost</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-cyber-pink" /> Private Discord Access</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-cyber-pink" /> Legend Badge</li>
            </ul>
            <button className="btn-secondary w-full py-3">Subscribe Now</button>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default VIP;
