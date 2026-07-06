const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Database File Paths
const dbPath = path.join(__dirname, 'data', 'db.json');
const usersPath = path.join(__dirname, 'data', 'users.json');

const readDB = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const readUsers = () => JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
const writeUsers = (data) => fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));

const adminPath = path.join(__dirname, 'data', 'admin.json');
const readAdmin = () => {
  if (!fs.existsSync(adminPath)) {
    fs.writeFileSync(adminPath, JSON.stringify({ totalWithdrawn: 0, transactions: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
};
const writeAdmin = (data) => fs.writeFileSync(adminPath, JSON.stringify(data, null, 2));

// Memory store for tracking online users via heartbeat
const activeUsers = new Map(); // userId -> lastSeenTimestamp

// --- AUTH ROUTES ---

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const trimmed = username.trim();
    const emailTrimmed = email.trim();

    // Email validation
    if (!/^\S+@\S+\.\S+$/.test(emailTrimmed)) return res.status(400).json({ error: 'Invalid email address.' });

    // Username validation
    if (trimmed.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    if (trimmed.length > 20) return res.status(400).json({ error: 'Username cannot be longer than 20 characters.' });
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores.' });

    // Password validation
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters long.' });

    const users = readUsers();
    // Case-insensitive duplicate check
    if (users.find(u => u.username.toLowerCase() === trimmed.toLowerCase())) {
      return res.status(400).json({ error: 'Username already exists. Please choose another.' });
    }

    const newUser = {
      id: `u_${Date.now()}`,
      username: trimmed,
      email: emailTrimmed,
      password,
      avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
      level: 1,
      vip: 'Bronze',
      wallet: { balance: 0, transactions: [] }
    };

    users.push(newUser);
    writeUsers(users);

    const { password: _, ...safeUser } = newUser;
    res.json({ message: 'Registration successful', user: safeUser });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const users = readUsers();
    
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const { password: _, ...safeUser } = user;
    res.json({ message: 'Login successful', user: safeUser });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const userId = req.headers['authorization']; // Extremely simple mock token auth
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const users = readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/heartbeat', (req, res) => {
  try {
    const userId = req.headers['authorization'];
    if (userId) {
      activeUsers.set(userId, Date.now());
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- GAME ROUTES ---

app.get('/api/games', (req, res) => {
  try {
    res.json(readDB().games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    res.json(readDB().leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// --- WALLET ROUTES ---

app.get('/api/wallet', (req, res) => {
  try {
    const userId = req.headers['authorization'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const users = readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    res.json(user.wallet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallet info' });
  }
});

app.post('/api/wallet/transaction', (req, res) => {
  try {
    const userId = req.headers['authorization'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { type, amount, reference } = req.body;
    if (!type || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid transaction details' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(401).json({ error: 'User not found' });

    let balance = users[userIndex].wallet.balance;

    if (['withdraw', 'transfer', 'game_fee'].includes(type)) {
      if (balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
      balance -= amount;
    } else if (type === 'deposit' || type === 'winnings') {
      balance += amount;
    } else {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    const newTx = {
      id: `tx_${Date.now()}`,
      type,
      amount,
      status: type === 'withdraw' ? 'Pending' : 'Success',
      date: new Date().toISOString(),
      reference: reference || type
    };

    users[userIndex].wallet.balance = balance;
    users[userIndex].wallet.transactions.unshift(newTx);
    writeUsers(users);

    res.json({ message: 'Transaction successful', balance, transaction: newTx });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process transaction' });
  }
});

// --- SECURE DEPOSIT FLOW ENDPOINTS ---

app.post('/api/wallet/deposit/request', (req, res) => {
  try {
    const userId = req.headers['authorization'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { amount } = req.body;
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(401).json({ error: 'User not found' });

    const newTx = {
      id: `tx_dep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'deposit',
      amount: parsedAmount,
      status: 'Pending',
      date: new Date().toISOString(),
      reference: 'Pending UTR Submission',
      utr: null,
      submittedAt: null
    };

    // Note: Do NOT add amount to wallet balance yet!
    users[userIndex].wallet.transactions.unshift(newTx);
    writeUsers(users);

    res.json({ message: 'Deposit request created', transaction: newTx });
  } catch (error) {
    res.status(500).json({ error: 'Failed to request deposit' });
  }
});

app.post('/api/wallet/deposit/submit-utr', (req, res) => {
  try {
    const userId = req.headers['authorization'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { transactionId, utr } = req.body;
    if (!transactionId || !utr || !/^\d{10,16}$/.test(utr)) {
      return res.status(400).json({ error: 'Please enter a valid UTR number (10-16 digits)' });
    }

    const users = readUsers();
    
    // Check if UTR is already used by anyone
    const utrExists = users.some(u => 
      u.wallet.transactions.some(tx => tx.utr === utr && tx.status !== 'Failed')
    );
    if (utrExists) {
      return res.status(400).json({ error: 'This UPI Transaction Reference (UTR) has already been used.' });
    }

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(401).json({ error: 'User not found' });

    const txIndex = users[userIndex].wallet.transactions.findIndex(t => t.id === transactionId);
    if (txIndex === -1) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = users[userIndex].wallet.transactions[txIndex];
    if (tx.status !== 'Pending') {
      return res.status(400).json({ error: 'Transaction is already processed' });
    }

    tx.utr = utr;
    tx.reference = `Pending Verification (UTR: ${utr})`;
    tx.submittedAt = Date.now();

    writeUsers(users);
    res.json({ message: 'UTR submitted for verification', transaction: tx });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit UTR' });
  }
});

app.get('/api/wallet/deposit/status/:txId', (req, res) => {
  try {
    const userId = req.headers['authorization'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const txId = req.params.txId;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(401).json({ error: 'User not found' });

    const txIndex = users[userIndex].wallet.transactions.findIndex(t => t.id === txId);
    if (txIndex === -1) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = users[userIndex].wallet.transactions[txIndex];

    // NOTE: Removed the automatic 8-second auto-approval timer.
    // Manual deposits now remain Pending until approved/rejected by Admin.

    res.json({ status: tx.status, transaction: tx, balance: users[userIndex].wallet.balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check transaction status' });
  }
});

app.post('/api/wallet/deposit/razorpay-success', (req, res) => {
  try {
    const userId = req.headers['authorization'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { paymentId, amount } = req.body;
    const parsedAmount = parseInt(amount);
    if (!paymentId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid payment parameters' });
    }

    const users = readUsers();

    // Check if this payment ID has already been used
    const paymentExists = users.some(u => 
      u.wallet.transactions.some(tx => tx.utr === paymentId && tx.status === 'Success')
    );
    if (paymentExists) {
      return res.status(400).json({ error: 'This payment has already been credited to a wallet.' });
    }

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(401).json({ error: 'User not found' });

    const newTx = {
      id: `tx_rzp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'deposit',
      amount: parsedAmount,
      status: 'Success',
      date: new Date().toISOString(),
      reference: `Razorpay Ref: ${paymentId}`,
      utr: paymentId
    };

    users[userIndex].wallet.balance += parsedAmount;
    users[userIndex].wallet.transactions.unshift(newTx);
    writeUsers(users);

    res.json({ message: 'Razorpay deposit credited successfully', balance: users[userIndex].wallet.balance, transaction: newTx });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify Razorpay deposit' });
  }
});

// --- ADMIN SYSTEM ENDPOINTS ---

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ZooboAdmin@2026';

const adminAuth = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (!token || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized Admin Access' });
  }
  next();
};

app.post('/api/admin/verify', adminAuth, (req, res) => {
  res.json({ message: 'Admin verified successfully' });
});

app.get('/api/admin/stats', adminAuth, (req, res) => {
  try {
    const users = readUsers();
    const adminData = readAdmin();
    let totalUsers = users.length;
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let pendingDeposits = 0;
    let pendingWithdrawals = 0;
    let totalUserBalances = 0;

    users.forEach(u => {
      totalUserBalances += u.wallet.balance;
      u.wallet.transactions.forEach(tx => {
        // Real deposits shouldn't include game winnings ("Cash Out")
        if (tx.type === 'deposit' && tx.status === 'Success' && !tx.reference.includes('Cash Out')) {
          totalDeposits += tx.amount;
        } else if (tx.type === 'withdraw' && tx.status === 'Success') {
          totalWithdrawals += tx.amount;
        } else if (tx.type === 'deposit' && tx.status === 'Pending' && tx.utr) {
          pendingDeposits++;
        } else if (tx.type === 'withdraw' && tx.status === 'Pending') {
          pendingWithdrawals++;
        }
      });
    });

    // Total Cash Platform holds = Deposits - Withdrawals
    const platformBankCash = totalDeposits - totalWithdrawals;
    const availableProfit = platformBankCash - totalUserBalances - adminData.totalWithdrawn;

    // Calculate online users (active in the last 60 seconds)
    const now = Date.now();
    let onlineUsers = 0;
    activeUsers.forEach((lastSeen, userId) => {
      // If seen in the last 60 seconds (60000 ms), consider online
      if (now - lastSeen < 60000) {
        onlineUsers++;
      } else {
        // Cleanup old entries
        activeUsers.delete(userId);
      }
    });

    res.json({
      totalUsers,
      onlineUsers,
      offlineUsers: totalUsers - onlineUsers,
      totalDeposits,
      totalWithdrawals,
      pendingDeposits,
      pendingWithdrawals,
      totalUserBalances,
      platformBankCash,
      withdrawnProfit: adminData.totalWithdrawn,
      availableProfit
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

app.get('/api/admin/users', adminAuth, (req, res) => {
  try {
    const users = readUsers();
    const safeUsers = users.map(u => {
      const { password, ...safe } = u;
      return safe;
    });
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

app.get('/api/admin/transactions', adminAuth, (req, res) => {
  try {
    const users = readUsers();
    let allTx = [];

    users.forEach(u => {
      u.wallet.transactions.forEach(tx => {
        allTx.push({
          ...tx,
          userId: u.id,
          username: u.username
        });
      });
    });

    // Sort descending by date
    allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(allTx);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin transactions' });
  }
});

app.post('/api/admin/deposit/approve', adminAuth, (req, res) => {
  try {
    const { userId, transactionId } = req.body;
    if (!userId || !transactionId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    const txIndex = users[userIndex].wallet.transactions.findIndex(tx => tx.id === transactionId);
    if (txIndex === -1) return res.status(404).json({ error: 'Transaction not found' });

    const tx = users[userIndex].wallet.transactions[txIndex];
    if (tx.status !== 'Pending') {
      return res.status(400).json({ error: 'Transaction is already processed' });
    }

    // Approve the transaction and credit balance
    tx.status = 'Success';
    tx.reference = `UPI Ref: ${tx.utr || 'Approved by Admin'}`;
    users[userIndex].wallet.balance += tx.amount;

    writeUsers(users);
    res.json({ message: 'Transaction approved successfully', balance: users[userIndex].wallet.balance, transaction: tx });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve transaction' });
  }
});

app.post('/api/admin/deposit/reject', adminAuth, (req, res) => {
  try {
    const { userId, transactionId } = req.body;
    if (!userId || !transactionId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    const txIndex = users[userIndex].wallet.transactions.findIndex(tx => tx.id === transactionId);
    if (txIndex === -1) return res.status(404).json({ error: 'Transaction not found' });

    const tx = users[userIndex].wallet.transactions[txIndex];
    if (tx.status !== 'Pending') {
      return res.status(400).json({ error: 'Transaction is already processed' });
    }

    // Reject the transaction (do not credit money)
    tx.status = 'Failed';
    tx.reference = `Rejected by Admin: ${tx.utr || 'Manual UTR invalid'}`;

    writeUsers(users);
    res.json({ message: 'Transaction rejected successfully', balance: users[userIndex].wallet.balance, transaction: tx });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject transaction' });
  }
});

app.post('/api/admin/withdraw/approve', adminAuth, (req, res) => {
  try {
    const { userId, transactionId } = req.body;
    if (!userId || !transactionId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    const txIndex = users[userIndex].wallet.transactions.findIndex(tx => tx.id === transactionId);
    if (txIndex === -1) return res.status(404).json({ error: 'Transaction not found' });

    const tx = users[userIndex].wallet.transactions[txIndex];
    if (tx.status !== 'Pending') {
      return res.status(400).json({ error: 'Transaction is already processed' });
    }

    // Approve the withdrawal (funds were already deducted from user balance upon request)
    tx.status = 'Success';
    tx.reference = `Withdraw approved: ${tx.reference}`;

    writeUsers(users);
    res.json({ message: 'Withdrawal approved successfully', balance: users[userIndex].wallet.balance, transaction: tx });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

app.post('/api/admin/withdraw/reject', adminAuth, (req, res) => {
  try {
    const { userId, transactionId } = req.body;
    if (!userId || !transactionId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    const txIndex = users[userIndex].wallet.transactions.findIndex(tx => tx.id === transactionId);
    if (txIndex === -1) return res.status(404).json({ error: 'Transaction not found' });

    const tx = users[userIndex].wallet.transactions[txIndex];
    if (tx.status !== 'Pending') {
      return res.status(400).json({ error: 'Transaction is already processed' });
    }

    // Reject the withdrawal and REFUND the amount to user's wallet balance
    tx.status = 'Failed';
    tx.reference = `Withdraw rejected (Refunded): ${tx.reference}`;
    users[userIndex].wallet.balance += tx.amount;

    writeUsers(users);
    res.json({ message: 'Withdrawal rejected and refunded successfully', balance: users[userIndex].wallet.balance, transaction: tx });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

app.post('/api/admin/user/update-balance', adminAuth, (req, res) => {
  try {
    const { userId, amount } = req.body;
    const parsedAmount = parseInt(amount);
    if (!userId || isNaN(parsedAmount)) {
      return res.status(400).json({ error: 'Invalid update parameters' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    const isCredit = parsedAmount >= 0;
    const absAmount = Math.abs(parsedAmount);

    if (!isCredit && users[userIndex].wallet.balance < absAmount) {
      return res.status(400).json({ error: 'Insufficient balance to deduct.' });
    }

    const newTx = {
      id: `tx_adj_${Date.now()}`,
      type: isCredit ? 'deposit' : 'withdraw',
      amount: absAmount,
      status: 'Success',
      date: new Date().toISOString(),
      reference: 'Admin Adjustment',
      utr: 'ADMIN'
    };

    users[userIndex].wallet.balance += parsedAmount;
    users[userIndex].wallet.transactions.unshift(newTx);

    writeUsers(users);
    res.json({ message: 'User balance updated successfully', balance: users[userIndex].wallet.balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user balance' });
  }
});

app.post('/api/admin/system/withdraw', adminAuth, (req, res) => {
  try {
    const { amount, reference } = req.body;
    const parsedAmount = parseInt(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const users = readUsers();
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalUserBalances = 0;

    users.forEach(u => {
      totalUserBalances += u.wallet.balance;
      u.wallet.transactions.forEach(tx => {
        if (tx.type === 'deposit' && tx.status === 'Success' && !tx.reference.includes('Cash Out')) {
          totalDeposits += tx.amount;
        } else if (tx.type === 'withdraw' && tx.status === 'Success') {
          totalWithdrawals += tx.amount;
        }
      });
    });

    const adminData = readAdmin();
    const platformBankCash = totalDeposits - totalWithdrawals;
    const availableProfit = platformBankCash - totalUserBalances - adminData.totalWithdrawn;

    if (parsedAmount > availableProfit) {
      return res.status(400).json({ error: 'Insufficient available platform profit' });
    }

    const newTx = {
      id: `admin_tx_${Date.now()}`,
      amount: parsedAmount,
      date: new Date().toISOString(),
      reference: reference || 'Admin Profit Withdrawal'
    };

    adminData.totalWithdrawn += parsedAmount;
    adminData.transactions.unshift(newTx);
    writeAdmin(adminData);

    res.json({ message: 'Profit withdrawn successfully', withdrawnProfit: adminData.totalWithdrawn, availableProfit: availableProfit - parsedAmount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to withdraw profit' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
