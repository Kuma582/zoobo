import { Link } from 'react-router-dom';
import { Gamepad2, MessageCircle, Camera, Disc, Video } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-cyber-gray-light border-t border-white/5 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Gamepad2 className="text-cyber-purple w-8 h-8" />
              <span className="text-2xl font-black tracking-wider text-white neon-text-purple">ZOOBO</span>
            </Link>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              The ultimate premium gaming platform. Play games, join tournaments, and win big rewards in a cyberpunk universe.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-cyber-gray flex items-center justify-center hover:bg-cyber-purple transition-colors">
                <MessageCircle className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-cyber-gray flex items-center justify-center hover:bg-cyber-pink transition-colors">
                <Camera className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-cyber-gray flex items-center justify-center hover:bg-cyber-blue transition-colors">
                <Disc className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-cyber-gray flex items-center justify-center hover:bg-red-500 transition-colors">
                <Video className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6 text-lg tracking-wide">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/games" className="text-gray-400 hover:text-cyber-blue transition-colors text-sm">All Games</Link></li>
              <li><Link to="/tournaments" className="text-gray-400 hover:text-cyber-blue transition-colors text-sm">Live Tournaments</Link></li>
              <li><Link to="/leaderboard" className="text-gray-400 hover:text-cyber-blue transition-colors text-sm">Leaderboard</Link></li>
              <li><Link to="/vip" className="text-gray-400 hover:text-cyber-blue transition-colors text-sm">VIP Membership</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-lg tracking-wide">Support</h4>
            <ul className="space-y-3">
              <li><Link to="/faq" className="text-gray-400 hover:text-cyber-blue transition-colors text-sm">FAQ</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-cyber-blue transition-colors text-sm">Contact Us</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-cyber-blue transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-cyber-blue transition-colors text-sm">Terms & Conditions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-lg tracking-wide">Newsletter</h4>
            <p className="text-gray-400 text-sm mb-4">Subscribe for exclusive offers and updates.</p>
            <div className="flex">
              <input type="email" placeholder="Your Email" className="bg-cyber-gray px-4 py-2 rounded-l-md w-full border border-white/10 focus:outline-none focus:border-cyber-purple text-white text-sm" />
              <button className="bg-cyber-purple hover:bg-cyber-pink transition-colors px-4 rounded-r-md text-white font-bold text-sm">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">© 2026 ZOOBO Gaming. All rights reserved.</p>
          <p className="text-gray-500 text-sm mt-2 md:mt-0">Designed with Cyberpunk Vibes</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
