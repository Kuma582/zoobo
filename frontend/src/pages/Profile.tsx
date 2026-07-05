import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Shield, Trophy, Zap, Users, LogOut, ChevronRight, Bell, CreditCard, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  if (!user) return null; // Should be handled by ProtectedRoute

  const handleLogout = () => {
    logout();
  };

  const handleAction = (action: string) => {
    if (action === 'My Achievements') navigate('/achievements');
    else if (action === 'Support') navigate('/support');
    else setActiveModal(action);
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-24 font-sans text-white">
      {/* Header */}
      <div className="pt-8 px-4 mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-wide neon-text-purple">Profile</h1>
        <button 
          onClick={() => setActiveModal('Settings')}
          className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition"
        >
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* User Info Card */}
      <div className="px-4 mb-8">
        <div className="bg-cyber-gray-light/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyber-purple to-cyber-blue p-0.5">
              <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-cyber-black rounded-full" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user.username}</h2>
            <p className="text-sm text-gray-400">ID: {user.id.toUpperCase()}</p>
          </div>
          <div className="bg-cyber-purple/20 border border-cyber-purple/50 px-3 py-1 rounded-lg">
            <span className="text-xs font-bold text-cyber-purple uppercase">{user.vip}</span>
          </div>
        </div>
      </div>

      {/* Options List */}
      <div className="px-4 mb-10">
        <div className="bg-cyber-gray-light/20 rounded-2xl border border-white/5 overflow-hidden">
          {[
            { icon: Trophy, label: "My Achievements", color: "text-yellow-500" },
            { icon: CreditCard, label: "Payment Methods", color: "text-cyber-blue" },
            { icon: Bell, label: "Notifications", color: "text-cyber-pink" },
            { icon: Shield, label: "Security Settings", color: "text-green-500" }
          ].map((item, idx, arr) => (
            <div 
              key={item.label}
              onClick={() => handleAction(item.label)}
              className={`flex items-center justify-between p-4 bg-transparent hover:bg-white/5 transition-colors cursor-pointer ${
                idx !== arr.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/5 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Platform Guarantees / Support */}
      <div className="px-4 mb-8">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 px-1">Quick Links</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Zap, title: "Fast Rewards", desc: "Instant withdrawals", action: 'Rewards' },
            { icon: Shield, title: "Fair Play", desc: "Anti-cheat system", action: 'FairPlay' },
            { icon: Users, title: "Support", desc: "24x7 always here", action: 'Support' },
            { icon: AlertCircle, title: "FAQ", desc: "Get help instantly", action: 'FAQ' }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleAction(feature.action)}
              className="bg-cyber-gray-light/40 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center group cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-cyber-black flex items-center justify-center mb-3 border border-white/5 group-hover:border-cyber-blue/50 transition-colors">
                <feature.icon className="w-6 h-6 text-cyber-blue drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
              </div>
              <h4 className="text-sm font-bold mb-1">{feature.title}</h4>
              <p className="text-[10px] text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4">
        <button 
          onClick={handleLogout}
          className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 font-bold hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setActiveModal(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-cyber-gray rounded-t-3xl border-t border-white/10 z-50 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{activeModal}</h3>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Modal Content Based on Type */}
              {activeModal === 'Payment Methods' && (
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-bold text-cyber-blue">UPI</div>
                      <div className="text-sm text-gray-400">user@ybl</div>
                    </div>
                    <button className="text-red-400 text-sm font-bold">Remove</button>
                  </div>
                  <button className="w-full py-3 btn-secondary rounded-xl font-bold">Add New UPI ID</button>
                </div>
              )}

              {activeModal === 'Notifications' && (
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl border-l-4 border-l-cyber-purple">
                    <div className="font-bold text-sm">Level Up!</div>
                    <div className="text-xs text-gray-400 mt-1">You just reached Level 99.</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl border-l-4 border-l-cyber-blue">
                    <div className="font-bold text-sm">Deposit Successful</div>
                    <div className="text-xs text-gray-400 mt-1">₹500 has been added to your wallet.</div>
                  </div>
                </div>
              )}

              {activeModal === 'Security Settings' && (
                <div className="space-y-4">
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left px-4 font-bold transition-colors">Change Password</button>
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left px-4 font-bold transition-colors">Two-Factor Authentication (2FA)</button>
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left px-4 font-bold transition-colors">Active Sessions</button>
                </div>
              )}

              {activeModal === 'Settings' && (
                <div className="space-y-4">
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left px-4 font-bold transition-colors">App Theme (Dark)</button>
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left px-4 font-bold transition-colors">Sound & Music</button>
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left px-4 font-bold transition-colors">Language (English)</button>
                </div>
              )}

              {['Rewards', 'FairPlay', 'FAQ'].includes(activeModal) && (
                <div className="text-gray-400 text-sm text-center py-10">
                  This page will be available soon.
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
