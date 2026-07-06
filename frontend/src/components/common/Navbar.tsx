import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Search, Bell, Wallet, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';

const Navbar = () => {
  const { balance, refreshWallet } = useWallet();

  return (
    <nav className="fixed top-0 w-full max-w-md z-50 glass-panel border-b-0 rounded-none bg-cyber-black/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <Gamepad2 className="text-cyber-purple w-6 h-6" />
            <span className="text-xl font-black tracking-wider text-white neon-text-purple">ZOOBO</span>
          </Link>

          <div className="flex items-center space-x-3">
            <button className="text-gray-400 hover:text-cyber-blue transition-colors relative p-1 bg-white/5 rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-cyber-pink w-2 h-2 rounded-full"></span>
            </button>
            <div className="flex items-center gap-1 bg-cyber-gray-light px-1 py-1 rounded-full border border-cyber-purple/30">
              <Link to="/wallet" className="flex items-center gap-1 hover:brightness-110 transition-colors px-2 py-0.5">
                <Wallet className="w-4 h-4 text-cyber-purple" />
                <span className="text-xs font-bold text-white">₹{balance.toLocaleString()}</span>
              </Link>
              <button 
                onClick={refreshWallet}
                className="p-1 hover:bg-white/10 rounded-full transition-colors group"
                title="Refresh Balance"
              >
                <RefreshCcw className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyber-purple" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
