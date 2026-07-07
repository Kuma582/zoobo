import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, History, CheckCircle2, Clock, Send, ChevronRight, X, Loader2, Copy, Download, AlertCircle, CreditCard, Landmark, RefreshCcw } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { requestDeposit, submitDepositUtr, getDepositStatus, verifyRazorpayDeposit } from '../api/client';

const Wallet = () => {
  const { balance, transactions, withdrawMoney, transferMoney, refreshWallet } = useWallet();
  const [activeModal, setActiveModal] = useState<'add' | 'withdraw' | 'transfer' | null>(null);
  const [amount, setAmount] = useState('');
  const [targetId, setTargetId] = useState(''); // UPI ID or Username or Account Number
  const [accountName, setAccountName] = useState(''); // Account Holder Name
  const [ifscCode, setIfscCode] = useState(''); // IFSC Code
  const [paymentStep, setPaymentStep] = useState<'input' | 'method_select' | 'qr' | 'utr_entry' | 'verifying' | 'success' | 'failed' | 'processing' | 'submitted'>('input');
  
  // Secure Deposit States
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const [utr, setUtr] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [timer, setTimer] = useState(600); // 10 minutes (600s)

  const handleOpenModal = (type: 'add' | 'withdraw' | 'transfer') => {
    setActiveModal(type);
    setPaymentStep('input');
    setAmount('');
    setTargetId('');
    setAccountName('');
    setIfscCode('');
    setUtr('');
    setErrorMsg('');
    setCurrentTransactionId(null);
    setTimer(600);
  };

  const handleInitiateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount);
    
    if (parsedAmount > 0) {
      if (activeModal === 'add') {
        if (parsedAmount < 1) {
          alert('Minimum deposit amount is ₹1');
          return;
        }
        setPaymentStep('method_select');
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

  const handleSelectRazorpay = () => {
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setPaymentStep('processing');

    const options = {
      key: 'rzp_test_5mF6yO1Y2xP3zQ', // Test key id
      amount: parsedAmount * 100, // paise
      currency: 'INR',
      name: 'Zoobo Games',
      description: 'Deposit to Wallet',
      image: 'https://cdn-icons-png.flaticon.com/512/10014/10014798.png',
      handler: async function (response: any) {
        try {
          setPaymentStep('verifying');
          const paymentId = response.razorpay_payment_id;
          // Verify on backend
          await verifyRazorpayDeposit(paymentId, parsedAmount);
          await refreshWallet(); // Reload balance securely
          setPaymentStep('success');
        } catch (err: any) {
          setErrorMsg(err.message || 'Razorpay payment verification failed.');
          setPaymentStep('failed');
        }
      },
      prefill: {
        name: 'Zoobo Player',
        email: 'player@zoobo.com',
        contact: '9999999999'
      },
      theme: {
        color: '#6441A5' // purple theme color matching zoobo
      },
      modal: {
        ondismiss: function () {
          setPaymentStep('method_select');
        }
      }
    };

    try {
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error('Razorpay SDK failed to load', err);
      alert('Razorpay payment gateway failed to load. Please try again or use manual UPI.');
      setPaymentStep('method_select');
    }
  };

  const handleSelectManualUPI = async () => {
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setTimer(600); // Reset 10 minutes countdown
    setPaymentStep('qr');
  };

  const scrollToHistory = () => {
    document.getElementById('recent-activity')?.scrollIntoView({ behavior: 'smooth' });
  };

  // UPI Copy & QR Download Helper functions
  const UPI_ID = '9910357567-0@airtel';

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      alert('✅ UPI ID copied! Paste it in your payment app.');
    }).catch(() => {
      alert('UPI ID: ' + UPI_ID + ' — Please copy manually.');
    });
  };

  const handleDownloadQR = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=Zoobo&am=${amount}&cu=INR`)}`;
    window.open(qrUrl, '_blank');
  };

  // Timer Effect for QR Payment
  useEffect(() => {
    if (paymentStep !== 'qr' || activeModal !== 'add') return;
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMsg('Payment request timed out.');
          setPaymentStep('failed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [paymentStep, activeModal]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitUTR = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    
    if (!/^\d{10,16}$/.test(utr)) {
      setErrorMsg('Please enter a valid UTR number (10-16 digits)');
      return;
    }

    try {
      setErrorMsg('');
      setPaymentStep('processing');
      await submitDepositUtr(parsedAmount, utr);
      
      // Update step to submitted as the transaction is manually verified by the admin
      setPaymentStep('submitted');
      refreshWallet();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification submission failed');
      setPaymentStep('failed');
    }
  };

  // Simulate withdrawal / transfer flows (unchanged)
  useEffect(() => {
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;

    if (paymentStep === 'processing' && activeModal !== 'add') {
      timer2 = setTimeout(() => {
        const numAmount = parseInt(amount);
        
        if (activeModal === 'withdraw') {
          const bankDetails = `Acc: ${targetId}, IFSC: ${ifscCode.toUpperCase()}, Name: ${accountName}`;
          withdrawMoney(numAmount, bankDetails);
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
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [paymentStep, activeModal, amount, targetId, withdrawMoney, transferMoney]);

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
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                  <WalletIcon className="w-4 h-4 text-white" />
                  <span className="text-xs font-medium text-white/90 uppercase tracking-wider">Total Balance</span>
                </div>
                <button 
                  onClick={refreshWallet}
                  className="p-1.5 bg-black/20 hover:bg-black/40 border border-white/10 rounded-full transition-all group"
                  title="Refresh Balance"
                >
                  <RefreshCcw className="w-3.5 h-3.5 text-white/70 group-hover:text-white" />
                </button>
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
                    <p className="text-[9px] text-gray-600">ID: {tx.id}</p>
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
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                    ) : tx.status === 'Failed' ? (
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-orange-500 animate-pulse" />
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
              onClick={() => {
                if (paymentStep !== 'verifying' && paymentStep !== 'processing') {
                  setActiveModal(null);
                }
              }}
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
                    {activeModal === 'withdraw' && (
                      <div className="space-y-4 mb-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">Account Holder Name</label>
                          <input 
                            type="text" 
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
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
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value)}
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

                    <div className="grid grid-cols-3 gap-2 mb-8">
                      {[1, 50, 100].map(amt => (
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

              {paymentStep === 'method_select' && activeModal === 'add' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md mx-auto flex flex-col items-center py-4 text-center"
                >
                  <h3 className="text-xl font-bold text-white mb-2">Select Payment Method</h3>
                  <p className="text-gray-400 text-xs mb-6">Choose how you want to add ₹{amount} to your wallet</p>

                  <div className="space-y-3 w-full mb-6">
                    {/* Razorpay Option */}
                    <button 
                      onClick={handleSelectRazorpay}
                      className="w-full flex items-center justify-between bg-black/40 border border-white/5 hover:border-cyber-purple/50 p-4 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-cyber-purple/10 flex items-center justify-center border border-cyber-purple/20 text-cyber-purple group-hover:scale-105 transition-transform">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-white">Online Payment (Razorpay)</div>
                          <div className="text-[10px] text-gray-500">Pay via UPI, Cards, Netbanking instantly</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                    </button>

                    {/* Manual UPI Option */}
                    <button 
                      onClick={handleSelectManualUPI}
                      className="w-full flex items-center justify-between bg-black/40 border border-white/5 hover:border-cyber-blue/50 p-4 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-cyber-blue/10 flex items-center justify-center border border-cyber-blue/20 text-cyber-blue group-hover:scale-105 transition-transform">
                          <Landmark className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-white">Manual UPI (QR Code & UTR)</div>
                          <div className="text-[10px] text-gray-500">Scan QR code and enter 12-digit UTR manually</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                    </button>
                  </div>

                  <button 
                    onClick={() => setPaymentStep('input')}
                    className="w-full py-3.5 bg-white/5 border border-white/10 text-gray-300 text-xs font-bold uppercase rounded-xl hover:text-white transition-colors"
                  >
                    Go Back
                  </button>
                </motion.div>
              )}

              {paymentStep === 'qr' && activeModal === 'add' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md mx-auto flex flex-col items-center py-2"
                >
                  <div className="flex justify-between items-center w-full mb-4">
                    <h3 className="text-lg font-bold text-white">Scan & Pay</h3>
                    <div className="bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30 text-xs font-mono font-black text-red-400">
                      Timer: {formatTimer(timer)}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-2xl mb-4 shadow-[0_0_30px_rgba(255,255,255,0.15)] flex justify-center">
                    <div className="w-40 h-40 overflow-hidden rounded-xl">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=Zoobo&am=${amount}&cu=INR`)}`} 
                        alt="UPI QR Code" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                  
                  <div className="text-3xl font-black text-white mb-2 tracking-tight">₹{amount}</div>
                  
                  {/* UPI Details Box removed as requested by the user */}

                  {/* Instructions */}
                  <div className="w-full text-left text-gray-400 text-[10px] space-y-1 bg-white/5 p-3 rounded-xl border border-white/5 mb-6">
                    <div className="font-bold text-white uppercase text-[9px] mb-1">Instructions:</div>
                    <p>1. Open <strong className="text-white">any UPI app</strong> (PhonePe, GPay, Paytm, etc.) and scan the QR code above.</p>
                    <p>2. Pay exactly <strong className="text-white">₹{amount}</strong> — enter the amount manually if needed.</p>
                    <p>3. After payment, find the <strong className="text-white">UTR / UPI Ref No.</strong> in your payment receipt.</p>
                    <p>4. Click <strong className="text-cyber-purple">"I Have Paid"</strong> and enter that reference number below.</p>
                  </div>

                  {/* QR Action buttons */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button onClick={handleDownloadQR} className="py-3 px-4 rounded-xl font-bold text-xs uppercase bg-[#1a1a20] border border-white/10 text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> Download QR
                    </button>
                    <button onClick={() => setPaymentStep('utr_entry')} className="py-3 px-4 rounded-xl font-bold text-xs uppercase bg-[#2cba00] border-b-4 border-green-800 text-white shadow-lg hover:brightness-110 transition-all">
                      I Have Paid
                    </button>
                  </div>
                </motion.div>
              )}

              {paymentStep === 'utr_entry' && activeModal === 'add' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md mx-auto flex flex-col items-center py-4"
                >
                  <h3 className="text-xl font-bold text-white mb-2">Enter Payment UTR</h3>
                  <p className="text-gray-400 text-xs text-center mb-6">Please enter the 12-digit UPI Transaction Reference (UTR) number to verify your payment.</p>
                  
                  <form onSubmit={handleSubmitUTR} className="w-full">
                    <div className="mb-4">
                      <input 
                        type="text" 
                        maxLength={16}
                        value={utr}
                        onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter UTR / UPI Ref No. (10-16 digits)"
                        className="w-full bg-black/60 border-2 border-white/10 rounded-xl py-3 px-4 text-white text-center font-mono font-bold tracking-widest focus:outline-none focus:border-cyber-purple transition-all"
                        required
                      />
                      {errorMsg && (
                        <p className="text-red-500 text-xs font-bold text-center mt-2 flex items-center justify-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 w-full">
                      <button 
                        type="button" 
                        onClick={() => {
                          setErrorMsg('');
                          setPaymentStep('qr');
                        }}
                        className="flex-1 py-3.5 bg-[#1a1a20] border border-white/10 text-gray-300 text-xs font-bold uppercase rounded-xl"
                      >
                        Go Back
                      </button>
                      <button 
                        type="submit"
                        disabled={utr.length < 10 || utr.length > 16}
                        className="flex-1 py-3.5 bg-[#2cba00] border-b-4 border-green-800 disabled:opacity-40 text-white text-xs font-bold uppercase rounded-xl shadow-lg"
                      >
                        Submit UTR
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {paymentStep === 'verifying' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full max-w-md mx-auto flex flex-col items-center py-10"
                >
                  <div className="w-20 h-20 bg-cyber-purple/10 rounded-full flex items-center justify-center mb-6">
                    <Loader2 className="w-10 h-10 text-cyber-purple animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Verifying Payment...</h3>
                  <p className="text-gray-400 text-xs text-center max-w-xs">
                    Your payment has been submitted for verification. Please wait while we verify your transaction.
                  </p>
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
                    {activeModal === 'add' ? 'Creating Deposit Request' : activeModal === 'withdraw' ? 'Processing Withdrawal' : 'Processing Transfer'}
                  </h3>
                  <p className="text-gray-400 text-sm">Please do not close this window...</p>
                </motion.div>
              )}

              {paymentStep === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md mx-auto flex flex-col items-center py-10"
                >
                  <div className="w-20 h-20 bg-[#2cba00]/15 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(44,186,0,0.3)]">
                    <CheckCircle2 className="w-10 h-10 text-[#2cba00]" />
                  </div>
                  <h3 className="text-2xl font-black text-white text-center mb-2">
                    Payment Verified Successfully!
                  </h3>
                  <p className="text-gray-400 text-xs text-center max-w-xs mb-6">
                    ₹{amount} has been added to your wallet.
                  </p>
                  <button onClick={() => setActiveModal(null)} className="w-full py-3.5 bg-[#2cba00] border-b-4 border-green-800 text-white text-xs font-black uppercase rounded-xl shadow-lg">
                    Done
                  </button>
                </motion.div>
              )}

              {paymentStep === 'submitted' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md mx-auto flex flex-col items-center py-10"
                >
                  <div className="w-20 h-20 bg-orange-500/15 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(249,115,22,0.3)] text-orange-500">
                    <Clock className="w-10 h-10 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 text-center">
                    Deposit Request Submitted!
                  </h3>
                  <p className="text-gray-400 text-xs text-center max-w-xs mb-6 leading-relaxed">
                    Your payment of ₹{amount} has been submitted with UTR: <strong className="text-white font-mono">{utr}</strong>. Please wait while the administrator verifies and approves your transaction.
                  </p>
                  <button onClick={() => setActiveModal(null)} className="w-full py-3.5 bg-orange-500 border-b-4 border-orange-700 text-white text-xs font-black uppercase rounded-xl shadow-lg">
                    Close
                  </button>
                </motion.div>
              )}

              {paymentStep === 'failed' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md mx-auto flex flex-col items-center py-10"
                >
                  <div className="w-20 h-20 bg-red-500/15 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Verification Failed / Pending
                  </h3>
                  <p className="text-gray-400 text-xs text-center max-w-xs mb-6 leading-relaxed">
                    {errorMsg || 'Payment verification failed. Please try again or contact support.'}
                  </p>
                  
                  <div className="flex gap-3 w-full">
                    {utr && (
                      <button onClick={() => setPaymentStep('utr_entry')} className="flex-1 py-3.5 bg-[#1a1a20] border border-white/10 text-gray-300 text-xs font-bold uppercase rounded-xl">
                        Try Again
                      </button>
                    )}
                    <button onClick={() => setActiveModal(null)} className="flex-1 py-3.5 bg-red-600 border-b-4 border-red-800 text-white text-xs font-bold uppercase rounded-xl">
                      Close
                    </button>
                  </div>
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
