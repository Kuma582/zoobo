import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Search, Bell, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';

const Navbar = () => {
  const { balance } = useWallet();

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
            <Link to="/wallet" className="flex items-center gap-1 bg-cyber-gray-light px-3 py-1.5 rounded-full border border-cyber-purple/30 hover:border-cyber-purple transition-colors">
              <Wallet className="w-4 h-4 text-cyber-purple" />
              <span className="text-xs font-bold text-white">₹{balance.toLocaleString()}</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
