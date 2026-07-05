import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Trophy, Wallet, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Games', path: '/games', icon: Gamepad2 },
    { name: 'Events', path: '/tournaments', icon: Trophy },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  // Do not render bottom nav on game screens to maximize screen space
  if (path.startsWith('/game/')) return null;

  return (
    <div className="fixed bottom-0 w-full max-w-md z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/5 pb-safe pt-2 px-6 pb-2 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
      <div className="flex justify-between items-center relative">
        {tabs.map((tab) => {
          const isActive = path === tab.path || (tab.path !== '/' && path.startsWith(tab.path));
          
          return (
            <Link 
              key={tab.name} 
              to={tab.path}
              className="flex flex-col items-center justify-center w-14 h-14 relative z-10"
            >
              <div className={`flex flex-col items-center justify-center transition-all duration-300 ${isActive ? '-translate-y-2' : ''}`}>
                <tab.icon className={`w-6 h-6 mb-1 ${isActive ? 'text-cyber-blue drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : 'text-gray-500'}`} />
                <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'text-white opacity-100' : 'text-gray-500 opacity-0 transform translate-y-2'}`}>
                  {tab.name}
                </span>
              </div>
              
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-3 w-1.5 h-1.5 bg-cyber-blue rounded-full shadow-[0_0_10px_rgba(0,240,255,1)]"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
