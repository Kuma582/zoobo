import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowDownLeft, ArrowUpRight, Check, X, Search, RefreshCw, Landmark, AlertCircle, Edit3, DollarSign, ListCollapse, Wallet, Settings, Save } from 'lucide-react';
import { 
  fetchAdminStats, 
  fetchAdminUsers, 
  fetchAdminTransactions, 
  approveDeposit, 
  rejectDeposit, 
  approveWithdrawal, 
  rejectWithdrawal, 
  updateUserBalance,
  withdrawSystemProfit,
  verifyAdminPassword,
  setAdminToken,
  clearAdminToken,
  updateAdminSettings
} from '../api/client';

interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  offlineUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalUserBalances: number;
  platformBankCash: number;
  withdrawnProfit: number;
  availableProfit: number;
  winPercentage: number;
}

interface AdminUser {
  id: string;
  username: string;
  avatar: string;
  level: number;
  vip: string;
  wallet: {
    balance: number;
    transactions: any[];
  };
}

interface AdminTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  reference: string;
  utr?: string;
  userId: string;
  username: string;
}

const AdminPanel = () => {
  const [isAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Filter States
  const [userQuery, setUserQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'approvals' | 'users' | 'transactions'>('stats');

  // Balance edit modal state
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');

  const [showProfitModal, setShowProfitModal] = useState(false);
  const [profitAmount, setProfitAmount] = useState('');
  const [payoutAccount, setPayoutAccount] = useState('');
  
  const [tempWinPercentage, setTempWinPercentage] = useState<number>(50);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const statsData = await fetchAdminStats();
      const usersData = await fetchAdminUsers();
      const txData = await fetchAdminTransactions();
      
      setStats(statsData);
      setUsers(usersData);
      setTransactions(txData);
      setTempWinPercentage(statsData.winPercentage || 50);
      setIsAdminAuthenticated(true);
    } catch (err: any) {
      console.error(err);
      if (err.message?.toLowerCase().includes('unauthorized') || err.message?.toLowerCase().includes('invalid')) {
        setIsAdminAuthenticated(false);
        clearAdminToken();
      }
      setError('Failed to load admin dashboard. Ensure you are authorized.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await verifyAdminPassword(passwordInput);
      setAdminToken(passwordInput);
      setIsAdminAuthenticated(true);
      loadAdminData();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid password');
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setIsAdminAuthenticated(false);
    setStats(null);
  };

  const handleApproveDeposit = async (userId: string, txId: string) => {
    if (!window.confirm('Are you sure you want to APPROVE this deposit? This will credit the user\'s wallet.')) return;
    try {
      await approveDeposit(userId, txId);
      alert('Deposit approved and credited successfully!');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleRejectDeposit = async (userId: string, txId: string) => {
    if (!window.confirm('Are you sure you want to REJECT this deposit? No funds will be credited.')) return;
    try {
      await rejectDeposit(userId, txId);
      alert('Deposit rejected successfully!');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleApproveWithdrawal = async (userId: string, txId: string) => {
    if (!window.confirm('Are you sure you want to APPROVE this withdrawal request? This confirms the cashout is complete.')) return;
    try {
      await approveWithdrawal(userId, txId);
      alert('Withdrawal approved successfully!');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleRejectWithdrawal = async (userId: string, txId: string) => {
    if (!window.confirm('Are you sure you want to REJECT this withdrawal? This will REFUND the withdrawal amount back to the user\'s wallet balance.')) return;
    try {
      await rejectWithdrawal(userId, txId);
      alert('Withdrawal rejected and funds refunded to the user!');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleUpdateBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    const amountVal = parseInt(adjustmentAmount);
    if (isNaN(amountVal) || amountVal === 0) {
      alert('Please enter a valid non-zero adjustment amount.');
      return;
    }

    try {
      await updateUserBalance(editUser.id, amountVal);
      alert(`User balance adjusted successfully by ₹${amountVal}!`);
      setEditUser(null);
      setAdjustmentAmount('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update balance');
    }
  };

  const handleExtractProfitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseInt(profitAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    if (!payoutAccount.trim()) {
      alert('Please enter the payout account details.');
      return;
    }
    try {
      await withdrawSystemProfit(amountVal, `To: ${payoutAccount}`);
      alert(`Successfully extracted ₹${amountVal} from platform profit!`);
      setShowProfitModal(false);
      setProfitAmount('');
      setPayoutAccount('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to extract profit');
    }
  };

  const handleUpdateSettings = async () => {
    setIsUpdatingSettings(true);
    try {
      await updateAdminSettings(tempWinPercentage);
      alert('Global Game Settings updated successfully!');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Filters pending UPI deposits (only manual ones that have submitted UTR)
  const pendingDepositsList = transactions.filter(
    tx => tx.type === 'deposit' && tx.status === 'Pending' && tx.utr && tx.utr !== 'ADMIN'
  );

  // Filters pending withdrawals
  const pendingWithdrawalsList = transactions.filter(
    tx => tx.type === 'withdraw' && tx.status === 'Pending'
  );

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userQuery.toLowerCase()) || 
    u.id.toLowerCase().includes(userQuery.toLowerCase())
  );

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
        <div className="bg-[#121215] border border-white/5 p-8 rounded-3xl max-w-sm w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-cyber-purple"></div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black uppercase italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-cyber-purple mb-2">Restricted Area</h1>
            <p className="text-xs text-gray-500 font-bold uppercase">Control Center Authentication</p>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] uppercase font-bold p-3 rounded-xl text-center mb-6 flex items-center justify-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" /> {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 block">Admin Master Password</label>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyber-purple transition-all font-mono"
                required
              />
            </div>
            <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-wider text-xs py-3 rounded-xl hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-cyber-purple border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Loading admin control center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-24 text-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-wide bg-gradient-to-r from-red-500 to-cyber-purple bg-clip-text text-transparent uppercase italic">
              Zoobo Control Center
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">Global Administration Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadAdminData}
              className="p-2.5 bg-cyber-gray border border-white/5 rounded-xl hover:border-cyber-purple transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyber-purple" /> Refresh
            </button>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              Lock
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6 flex items-center gap-3 text-red-400 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dashboard Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Users</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black">{stats.totalUsers}</span>
                <Users className="w-4 h-4 text-cyber-purple shrink-0" />
              </div>
            </div>

            <div className="bg-[#121215] border border-white/5 border-b-2 border-b-green-500 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
              <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black">{stats.onlineUsers}</span>
                <Users className="w-4 h-4 text-green-500/50 shrink-0" />
              </div>
            </div>

            <div className="bg-[#121215] border border-white/5 border-b-2 border-b-gray-500 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span> Offline
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-gray-400">{stats.offlineUsers}</span>
                <Users className="w-4 h-4 text-gray-600 shrink-0" />
              </div>
            </div>

            <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Deposits</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-green-400">₹{stats.totalDeposits.toLocaleString()}</span>
                <ArrowDownLeft className="w-4 h-4 text-green-400 shrink-0" />
              </div>
            </div>

            <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Withdrawals</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-red-400">₹{stats.totalWithdrawals.toLocaleString()}</span>
                <ArrowUpRight className="w-4 h-4 text-red-400 shrink-0" />
              </div>
            </div>

            <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pending Deposits</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-orange-400">{stats.pendingDeposits}</span>
                <Landmark className="w-4 h-4 text-orange-400 shrink-0 animate-pulse" />
              </div>
            </div>

            <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pending Withdrawals</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-rose-500">{stats.pendingWithdrawals}</span>
                <Wallet className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 mb-6 gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'stats', label: 'Summary' },
            { id: 'approvals', label: `Approvals Queue (${pendingDepositsList.length + pendingWithdrawalsList.length})` },
            { id: 'users', label: 'User Balances' },
            { id: 'transactions', label: 'Global Logs' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'border-cyber-purple text-white bg-cyber-purple/5' 
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section 1: Dashboard Overview */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Action Pending list */}
            <div className="bg-[#121215] rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-orange-400 animate-pulse" /> Pending Approval Actions Required
              </h3>
              
              {pendingDepositsList.length === 0 && pendingWithdrawalsList.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">No pending deposits or withdrawals to verify.</p>
              ) : (
                <div className="space-y-3">
                  {/* Show top 2 pending deposits */}
                  {pendingDepositsList.slice(0, 2).map(tx => (
                    <div key={tx.id} className="bg-black/30 border border-[#2cba00]/10 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#2cba00]/15 text-[#2cba00] px-1.5 py-0.5 rounded text-[8px] font-black uppercase">Deposit Request</span>
                          <span className="font-bold text-white">{tx.username}</span>
                        </div>
                        <div className="text-[9px] text-gray-500 mt-1">UTR: <span className="font-mono text-white font-bold">{tx.utr}</span></div>
                        <div className="text-[10px] text-green-400 font-bold mt-0.5">₹{tx.amount}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRejectDeposit(tx.userId, tx.id)} className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleApproveDeposit(tx.userId, tx.id)} className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg hover:bg-green-500/20 transition-all">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Show top 2 pending withdrawals */}
                  {pendingWithdrawalsList.slice(0, 2).map(tx => (
                    <div key={tx.id} className="bg-black/30 border border-rose-500/10 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-rose-500/15 text-rose-500 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">Withdraw Request</span>
                          <span className="font-bold text-white">{tx.username}</span>
                        </div>
                        <div className="text-[9px] text-gray-500 mt-1">Details: <span className="text-white font-bold">{tx.reference}</span></div>
                        <div className="text-[10px] text-rose-400 font-bold mt-0.5">₹{tx.amount}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRejectWithdrawal(tx.userId, tx.id)} className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleApproveWithdrawal(tx.userId, tx.id)} className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg hover:bg-green-500/20 transition-all">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button onClick={() => setActiveTab('approvals')} className="w-full text-center text-xs font-bold text-cyber-purple py-2 hover:underline">
                    View approvals queue ({pendingDepositsList.length + pendingWithdrawalsList.length} items)
                  </button>
                </div>
              )}
            </div>

            {/* Quick Audit Snapshot */}
            <div className="bg-[#121215] rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <ListCollapse className="w-4 h-4 text-cyber-purple" /> Recent Activities Log
              </h3>
              
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <div>
                      <div className="font-bold text-white capitalize">{tx.type}</div>
                      <div className="text-[9px] text-gray-500">User: {tx.username} | {tx.reference}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount}
                      </div>
                      <div className="text-[9px] text-gray-500">{tx.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Financials */}
            <div className="lg:col-span-2 bg-[#121215] rounded-2xl border border-white/5 p-6 border-l-4 border-l-cyber-purple">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyber-purple" /> Platform Financials
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Total Real Bank Cash</div>
                  <div className="text-2xl font-black text-white">₹{stats?.platformBankCash?.toLocaleString() || 0}</div>
                  <div className="text-[9px] text-gray-500 mt-1">Total Deposits - Withdrawals</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Available Profit</div>
                  <div className={`text-2xl font-black ${(stats?.availableProfit || 0) >= 0 ? 'text-green-400' : 'text-rose-500'}`}>
                    ₹{stats?.availableProfit?.toLocaleString() || 0}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-1">Total Withdrawn: ₹{stats?.withdrawnProfit || 0}</div>
                </div>
                <div className="flex items-center justify-end">
                  <button 
                    onClick={() => setShowProfitModal(true)}
                    className="py-3 px-6 rounded-xl text-xs font-black uppercase tracking-wider bg-cyber-purple border-b-4 border-purple-800 text-white hover:brightness-110 transition-all flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" /> Extract Profit
                  </button>
                </div>
              </div>
            </div>

            {/* Global Game Settings */}
            <div className="lg:col-span-2 bg-[#121215] rounded-2xl border border-white/5 p-6 border-l-4 border-l-orange-500 mt-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-500" /> Global Game Settings
              </h3>
              
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Global Win Percentage (RTP)</label>
                    <span className="text-lg font-black text-orange-400">{tempWinPercentage}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={tempWinPercentage}
                    onChange={(e) => setTempWinPercentage(Number(e.target.value))}
                    className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-orange-500 border border-white/10"
                  />
                  <div className="text-[9px] text-gray-500 mt-2">Adjusting this controls how often users win across all games (Aviator, TreasureBomb, etc.) to keep them engaged.</div>
                </div>
                
                <div className="flex items-center justify-end shrink-0 w-full md:w-auto">
                  <button 
                    onClick={handleUpdateSettings}
                    disabled={isUpdatingSettings || tempWinPercentage === stats?.winPercentage}
                    className="py-3 px-6 w-full md:w-auto rounded-xl text-xs font-black uppercase tracking-wider bg-orange-600 border-b-4 border-orange-900 text-white hover:brightness-110 active:border-b-0 active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isUpdatingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                    Save Settings
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Section 2: Pending Manual UPI Deposits & Withdrawals */}
        {activeTab === 'approvals' && (
          <div className="space-y-8">
            
            {/* Deposits Approvals Sub-section */}
            <div className="bg-[#121215] rounded-2xl border border-white/5 p-6">
              <h3 className="text-base font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-green-400" /> Pending UPI Deposits Approvals ({pendingDepositsList.length})
              </h3>
              
              {pendingDepositsList.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No manual deposits waiting for approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDepositsList.map(tx => (
                    <div key={tx.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-sm text-white">{tx.username}</span>
                          <span className="text-[10px] text-gray-500">ID: {tx.userId}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs">
                          <div>UTR: <span className="font-mono text-white font-black bg-white/5 px-2 py-0.5 rounded">{tx.utr}</span></div>
                          <div>Amount: <span className="text-green-400 font-bold">₹{tx.amount}</span></div>
                          <div className="col-span-2 text-[10px] text-gray-500 mt-1">Date: {new Date(tx.date).toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 shrink-0">
                        <button 
                          onClick={() => handleRejectDeposit(tx.userId, tx.id)}
                          className="flex-1 md:flex-initial py-2 px-4 rounded-xl font-black text-xs uppercase bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                        <button 
                          onClick={() => handleApproveDeposit(tx.userId, tx.id)}
                          className="flex-1 md:flex-initial py-2 px-4 rounded-xl font-black text-xs uppercase bg-green-500 border-b-4 border-green-800 text-white hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Withdrawals Approvals Sub-section */}
            <div className="bg-[#121215] rounded-2xl border border-white/5 p-6">
              <h3 className="text-base font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-rose-500" /> Pending Bank Withdrawals Approvals ({pendingWithdrawalsList.length})
              </h3>
              
              {pendingWithdrawalsList.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No withdrawal requests waiting for approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingWithdrawalsList.map(tx => (
                    <div key={tx.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-sm text-white">{tx.username}</span>
                          <span className="text-[10px] text-gray-500">ID: {tx.userId}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs">
                          <div>Payout Target: <span className="font-bold text-white">{tx.reference}</span></div>
                          <div>Amount: <span className="text-rose-400 font-bold">₹{tx.amount}</span></div>
                          <div className="col-span-2 text-[10px] text-gray-500 mt-1">Date: {new Date(tx.date).toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 shrink-0">
                        <button 
                          onClick={() => handleRejectWithdrawal(tx.userId, tx.id)}
                          className="flex-1 md:flex-initial py-2 px-4 rounded-xl font-black text-xs uppercase bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <X className="w-4 h-4" /> Reject (Refund)
                        </button>
                        <button 
                          onClick={() => handleApproveWithdrawal(tx.userId, tx.id)}
                          className="flex-1 md:flex-initial py-2 px-4 rounded-xl font-black text-xs uppercase bg-green-500 border-b-4 border-green-800 text-white hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Approve & Pay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Section 3: Users Balance Management */}
        {activeTab === 'users' && (
          <div className="bg-[#121215] rounded-2xl border border-white/5 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="text-base font-black uppercase tracking-wider">User Account Balances</h3>
              
              <div className="relative max-w-sm w-full">
                <input 
                  type="text" 
                  placeholder="Search user..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-cyber-purple transition-all"
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Username</th>
                    <th className="py-3 px-2">User ID</th>
                    <th className="py-3 px-2">VIP Grade</th>
                    <th className="py-3 px-2">Balance</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-2 font-bold text-white flex items-center gap-2">
                        <img src={u.avatar} alt="Avatar" className="w-6 h-6 rounded-full border border-white/10" />
                        {u.username}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-gray-500">{u.id}</td>
                      <td className="py-3.5 px-2 font-bold text-cyber-purple">{u.vip}</td>
                      <td className="py-3.5 px-2 font-black text-green-400">₹{u.wallet.balance.toLocaleString()}</td>
                      <td className="py-3.5 px-2 text-right">
                        <button 
                          onClick={() => setEditUser(u)}
                          className="py-1 px-3 bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple rounded-lg hover:bg-cyber-purple/20 transition-all font-bold uppercase text-[9px] flex items-center gap-1.5 ml-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Adjust Balance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 4: Global Activity logs */}
        {activeTab === 'transactions' && (
          <div className="bg-[#121215] rounded-2xl border border-white/5 p-6">
            <h3 className="text-base font-black uppercase tracking-wider mb-4">Platform Activity Audit Log</h3>
            
            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                      tx.type === 'deposit' 
                        ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{tx.username}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 capitalize">{tx.type}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{tx.reference}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black ${tx.type === 'deposit' ? 'text-green-400' : 'text-white'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount}
                    </div>
                    <div className="text-[8px] text-gray-600 mt-0.5">{new Date(tx.date).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Adjust balance modal sheet */}
      <AnimatePresence>
        {editUser && (
          <>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setEditUser(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-[#121215] border border-white/10 rounded-2xl z-[60] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-black text-sm uppercase tracking-wider">Adjust User Balance</h4>
                <button onClick={() => setEditUser(null)} className="p-1 text-gray-400 hover:text-white"><X className="w-4.5 h-4.5"/></button>
              </div>

              <div className="flex items-center gap-3 mb-6 bg-black/45 p-3 rounded-xl border border-white/5 text-xs">
                <img src={editUser.avatar} className="w-8 h-8 rounded-full border border-white/10" />
                <div>
                  <div className="font-bold text-white">{editUser.username}</div>
                  <div className="text-gray-500">Current Balance: <span className="text-green-400 font-bold">₹{editUser.wallet.balance}</span></div>
                </div>
              </div>

              <form onSubmit={handleUpdateBalanceSubmit}>
                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider font-bold">Adjustment Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                    <input 
                      type="text" 
                      placeholder="e.g. 500 (credit) or -500 (debit)"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyber-purple transition-all"
                      required
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1 leading-normal">Enter a positive number to add funds, or a negative number to deduct funds directly.</p>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditUser(null)} className="flex-1 py-2 rounded-xl text-xs font-bold uppercase bg-[#1a1a20] border border-white/10">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2 rounded-xl text-xs font-bold uppercase bg-[#2cba00] border-b-4 border-green-800 text-white shadow-lg">
                    Confirm
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Extract Profit modal sheet */}
      <AnimatePresence>
        {showProfitModal && stats && (
          <>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowProfitModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-[#121215] border border-white/10 rounded-2xl z-[60] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-black text-sm uppercase tracking-wider text-cyber-purple">Extract Platform Profit</h4>
                <button onClick={() => setShowProfitModal(false)} className="p-1 text-gray-400 hover:text-white"><X className="w-4.5 h-4.5"/></button>
              </div>

              <div className="mb-6 bg-black/45 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 font-bold uppercase">Available</span>
                  <span className={`font-black ${stats.availableProfit >= 0 ? 'text-green-400' : 'text-rose-500'}`}>₹{stats.availableProfit.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-gray-500">Note: Attempting to withdraw more than the available profit will be rejected by the system to maintain liquidity.</div>
              </div>

              <form onSubmit={handleExtractProfitSubmit}>
                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider font-bold">Withdraw Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                    <input 
                      type="number" 
                      placeholder="Amount to extract..."
                      value={profitAmount}
                      onChange={(e) => setProfitAmount(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyber-purple transition-all"
                      required
                      min="1"
                      max={stats.availableProfit > 0 ? stats.availableProfit : 0}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider font-bold">Payout Account Details</label>
                  <input 
                    type="text" 
                    placeholder="Enter UPI ID or Bank Details..."
                    value={payoutAccount}
                    onChange={(e) => setPayoutAccount(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-cyber-purple transition-all"
                    required
                  />
                  <p className="text-[9px] text-gray-500 mt-1 leading-normal">Enter the account where you want to receive this profit.</p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setShowProfitModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase bg-[#1a1a20] border border-white/10">
                    Cancel
                  </button>
                  <button type="submit" disabled={stats.availableProfit <= 0} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase border-b-4 transition-all ${stats.availableProfit > 0 ? 'bg-cyber-purple border-purple-800 text-white shadow-lg' : 'bg-gray-800 border-gray-900 text-gray-500 cursor-not-allowed'}`}>
                    Confirm
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminPanel;
