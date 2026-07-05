import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, History, CheckCircle2, Clock, Send, ChevronRight, X, QrCode, Loader2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const Wallet = () => {
  const { balance, transactions, addMoney, withdrawMoney, transferMoney } = useWallet();
  const [activeModal, setActiveModal] = useState<'add' | 'withdraw' | 'transfer' | null>(null);
  const [amount, setAmount] = useState('');
  const [targetId, setTargetId] = useState(''); // UPI ID or Username
  const [paymentStep, setPaymentStep] = useState<'input' | 'qr' | 'processing' | 'success'>('input');

  const handleOpenModal = (type: 'add' | 'withdraw' | 'transfer') => {
    setActiveModal(type);
    setPaymentStep('input');
    setAmount('');
    setTargetId('');
  };

  const handleInitiateAction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount);
    
    if (parsedAmount > 0) {
      if (activeModal === 'add') {
        setPaymentStep('qr');
      } else if (activeModal === 'withdraw' || activeModal === 'transfer') {
        if (activeModal === 'withdraw') {
          if (parsedAmount < 100) {
            alert('Minimum withdrawal amount is ₹100');
            return;
          }
          if (parsedAmount > 50000) {
            alert('Maximum withdrawal amount is ₹50,000');
            return;
          }
        }
        
        if (parsedAmount > balance) {
          alert('Insufficient balance!');
          return;
        }
        setPaymentStep('processing');
      }
    }
  };

  const scrollToHistory = () => {
    document.getElementById('recent-activity')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Simulate payment flows
  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;

    if (paymentStep === 'qr' && activeModal === 'add') {
      timer1 = setTimeout(() => {
        setPaymentStep('processing');
      }, 4000);
    }

    if (paymentStep === 'processing') {
      timer2 = setTimeout(() => {
        const numAmount = parseInt(amount);
        
        if (activeModal === 'add') {
          addMoney(numAmount);
        } else if (activeModal === 'withdraw') {
          withdrawMoney(numAmount, targetId);
        } else if (activeModal === 'transfer') {
          transferMoney(numAmount, targetId);
        }
        
        setPaymentStep('success');
        
        timer3 = setTimeout(() => {
          setActiveModal(null);
        }, 2000);
        
      }, 2000);
    }
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [paymentStep, activeModal, amount, targetId, addMoney, withdrawMoney, transferMoney]);

  return (
    <div className="min-h-screen bg-[#050505] pb-24 font-sans">
      
      {/* App Header Spacer (Covered by Navbar) */}
      <div className="pt-4 px-4">
        <h1 className="text-2xl font-black text-white mb-4 tracking-wide">Wallet</h1>
        
        {/* Premium Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative rounded-2xl p-6 overflow-hidden shadow-[0_10px_40px_rgba(177,75,244,0.3)] mb-6"
          style={{ background: 'linear-gradient(135deg, #2a0845 0%, #6441A5 100%)' }}
        >
          {/* Card Decorations */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                <WalletIcon className="w-4 h-4 text-white" />
                <span className="text-xs font-medium text-white/90 uppercase tracking-wider">Total Balance</span>
              </div>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Card" className="h-6 opacity-80" />
            </div>
            
            <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
              ₹{balance.toLocaleString()}
            </h2>
            <p className="text-white/60 text-sm mt-1">Available for gaming</p>
          </div>
        </motion.div>

        {/* Action Buttons Row */}
        <div className="flex justify-between items-center px-2 mb-8">
          <button onClick={() => handleOpenModal('add')} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full bg-cyber-gray flex items-center justify-center border border-white/5 shadow-lg group-hover:border-cyber-purple group-active:scale-95 transition-all">
              <Plus className="w-6 h-6 text-cyber-purple" />
            </div>
            <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors">Add</span>
          </button>
          
          <button onClick={() => handleOpenModal('withdraw')} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full bg-cyber-gray flex items-center justify-center border border-white/5 shadow-lg group-hover:border-cyber-blue group-active:scale-95 transition-all">
              <ArrowUpRight className="w-6 h-6 text-cyber-blue" />
            </div>
            <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors">Withdraw</span>
          </button>
          
          <button onClick={() => handleOpenModal('transfer')} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full bg-cyber-gray flex items-center justify-center border border-white/5 shadow-lg group-hover:border-cyber-pink group-active:scale-95 transition-all">
              <Send className="w-5 h-5 text-cyber-pink" />
            </div>
            <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors">Transfer</span>
          </button>
          
          <button onClick={scrollToHistory} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full bg-cyber-gray flex items-center justify-center border border-white/5 shadow-lg group-hover:border-yellow-500 group-active:scale-95 transition-all">
              <History className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors">History</span>
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div id="recent-activity" className="bg-cyber-gray-light/30 rounded-t-3xl p-6 min-h-[400px] border-t border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          <button className="text-xs font-bold text-cyber-blue flex items-center">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-500 flex flex-col items-center">
              <History className="w-12 h-12 mb-3 opacity-20" />
              <p>No transactions yet.</p>
            </div>
          ) : (
            transactions.map((tx, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={tx.id} 
                className="flex items-center justify-between bg-black/40 p-3 rounded-2xl border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                    tx.type === 'deposit' || tx.type === 'winnings' 
                      ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                      : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'winnings' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm capitalize">
                      {tx.type === 'game_fee' ? 'Game Entry' : tx.type}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">{tx.reference}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${
                    tx.type === 'deposit' || tx.type === 'winnings' ? 'text-green-400' : 'text-white'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'winnings' ? '+' : '-'}₹{tx.amount}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {tx.status === 'Success' ? (
                      <CheckCircle2 className="w-3 h-3 text-cyber-blue" />
                    ) : (
                      <Clock className="w-3 h-3 text-orange-500" />
                    )}
                    <p className="text-[10px] text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add/Withdraw/Transfer Bottom Sheet Overlay */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveModal(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 w-full bg-[#121215] z-[70] rounded-t-3xl border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pb-safe p-6 flex flex-col items-center justify-center min-h-[40vh]"
            >
              
              {paymentStep === 'input' && (
                <div className="w-full max-w-md mx-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white capitalize">
                      {activeModal === 'add' ? 'Top Up Wallet' : activeModal === 'withdraw' ? 'Withdraw Funds' : 'Transfer Coins'}
                    </h3>
                    <button onClick={() => setActiveModal(null)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleInitiateAction}>
                    {/* Input fields based on action type */}
                    {activeModal === 'withdraw' && (
                      <div className="space-y-4 mb-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">Account Holder Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. John Doe"
                            className="w-full bg-cyber-black border-2 border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyber-purple transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">Bank Account Number</label>
                          <input 
                            type="text" 
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            placeholder="e.g. 1234567890"
                            className="w-full bg-cyber-black border-2 border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyber-purple transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">IFSC Code</label>
                          <input 
                            type="text" 
                            placeholder="e.g. HDFC0001234"
                            className="w-full bg-cyber-black border-2 border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyber-purple transition-colors uppercase"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {activeModal === 'transfer' && (
                      <div className="mb-4">
                        <label className="text-sm text-gray-400 mb-2 block">Friend's Username or ID</label>
                        <input 
                          type="text" 
                          value={targetId}
                          onChange={(e) => setTargetId(e.target.value)}
                          placeholder="e.g. NeonNinja"
                          className="w-full bg-cyber-black border-2 border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyber-purple transition-colors"
                          required
                        />
                      </div>
                    )}

                    <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400 font-bold">₹</span>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        autoFocus
                        className="w-full bg-cyber-black border-2 border-white/10 rounded-2xl py-4 pl-10 pr-4 text-3xl font-black text-white focus:outline-none focus:border-cyber-purple transition-colors"
                        min={activeModal === 'withdraw' ? 100 : 1}
                        max={activeModal === 'withdraw' ? Math.min(50000, balance) : activeModal === 'transfer' ? balance : undefined}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-8">
                      {[100, 500, 1000, 5000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmount(amt.toString())}
                          className="bg-cyber-gray border border-white/5 py-3 rounded-xl text-xs font-bold text-gray-300 hover:border-cyber-purple hover:text-white hover:bg-cyber-purple/20 transition-all"
                        >
                          +₹{amt}
                        </button>
                      ))}
                    </div>

                    <button 
                      type="submit"
                      className="w-full btn-primary py-4 rounded-2xl text-lg tracking-wide shadow-[0_0_20px_rgba(177,75,244,0.4)] capitalize"
                    >
                      {activeModal === 'add' ? 'Proceed to Pay' : activeModal === 'withdraw' ? 'Confirm Withdrawal' : 'Send Transfer'}
                    </button>
                  </form>
                </div>
              )}

              {paymentStep === 'qr' && activeModal === 'add' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md mx-auto flex flex-col items-center py-6"
                >
                  <h3 className="text-xl font-bold text-white mb-2">Scan to Pay</h3>
                  <p className="text-gray-400 text-sm mb-6">Use any UPI app to complete payment</p>
                  
                  <div className="bg-white p-4 rounded-2xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <div className="w-48 h-48 overflow-hidden rounded-xl">
                      <img src="/qr.jpg" alt="UPI QR Code" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  
                  <div className="text-3xl font-black text-white mb-6 tracking-tight">₹{amount}</div>
                  
                  <div className="flex items-center justify-center gap-2 text-cyber-blue animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Waiting for payment...</span>
                  </div>
                </motion.div>
              )}

              {paymentStep === 'processing' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full max-w-md mx-auto flex flex-col items-center py-12"
                >
                  <div className="w-20 h-20 bg-cyber-blue/10 rounded-full flex items-center justify-center mb-6">
                    <Loader2 className="w-10 h-10 text-cyber-blue animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {activeModal === 'add' ? 'Processing Payment' : activeModal === 'withdraw' ? 'Processing Withdrawal' : 'Processing Transfer'}
                  </h3>
                  <p className="text-gray-400 text-sm">Please do not close this window...</p>
                </motion.div>
              )}

              {paymentStep === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md mx-auto flex flex-col items-center py-12"
                >
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">
                    {activeModal === 'add' ? 'Payment Successful!' : activeModal === 'withdraw' ? 'Withdrawal Successful!' : 'Transfer Sent!'}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">
                    {activeModal === 'add' 
                      ? `₹${amount} has been added to your wallet.` 
                      : activeModal === 'withdraw' 
                        ? `₹${amount} sent to ${targetId}.` 
                        : `₹${amount} transferred to ${targetId}.`}
                  </p>
                </motion.div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Wallet;
