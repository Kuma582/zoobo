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

const { Pool } = require('pg');

// PostgreSQL Connection
const DATABASE_URL = process.env.DATABASE_URL;
let pgPool = null;

if (DATABASE_URL) {
  pgPool = new Pool({
    connectionString: DATABASE_URL,
  });
}

async function initDB() {
  if (!DATABASE_URL) {
    console.warn('WARNING: DATABASE_URL is not set. Database initialization skipped.');
    return;
  }

  try {
    const client = await pgPool.connect();
    console.log('Connected to PostgreSQL');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar TEXT,
        level INT DEFAULT 1,
        vip VARCHAR(50) DEFAULT 'Bronze',
        balance FLOAT DEFAULT 0
      )
    `);

    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        amount FLOAT NOT NULL,
        status VARCHAR(50) NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reference VARCHAR(255),
        utr VARCHAR(255),
        submitted_at TIMESTAMP
      )
    `);

    // Create admin stats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_stats (
        id INT PRIMARY KEY DEFAULT 1,
        total_withdrawn FLOAT DEFAULT 0
      )
    `);

    // Create admin transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_transactions (
        id VARCHAR(255) PRIMARY KEY,
        amount FLOAT NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reference VARCHAR(255)
      )
    `);

    // Create games/leaderboard table
    await client.query(`
      CREATE TABLE IF NOT EXISTS games_db (
        key VARCHAR(255) PRIMARY KEY,
        games JSONB,
        leaderboard JSONB
      )
    `);

    // Initialize admin_stats
    const adminRes = await client.query("SELECT * FROM admin_stats WHERE id = 1");
    if (adminRes.rowCount === 0) {
      await client.query("INSERT INTO admin_stats (id, total_withdrawn) VALUES (1, 0)");
    }

    // Initialize games_db with local JSON fallback if empty
    const dbRes = await client.query("SELECT * FROM games_db WHERE key = 'main'");
    if (dbRes.rowCount === 0) {
      let games = [];
      let leaderboard = [];
      try {
        const localDb = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'db.json'), 'utf8'));
        games = localDb.games || [];
        leaderboard = localDb.leaderboard || [];
      } catch (err) {}
      await client.query("INSERT INTO games_db (key, games, leaderboard) VALUES ('main', $1, $2)", [JSON.stringify(games), JSON.stringify(leaderboard)]);
      console.log('Initialized games_db with local data');
    }

    // Migration from old `blobs` table to new tables (Optional/Best Effort)
    try {
      const blobRes = await client.query("SELECT * FROM blobs WHERE key = 'main'");
      if (blobRes.rowCount > 0 && blobRes.rows[0].users) {
        const users = blobRes.rows[0].users;
        const admin = blobRes.rows[0].admin;
        
        console.log(`Migrating ${users.length} users from blobs to relational tables...`);
        for (const u of users) {
           // Insert user (ignore if exists)
           await client.query(`
             INSERT INTO users (id, username, email, password, avatar, level, vip, balance) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING
           `, [u.id, u.username, u.email, u.password, u.avatar, u.level, u.vip, u.wallet ? u.wallet.balance : 0]);
           
           if (u.wallet && u.wallet.transactions) {
             for (const tx of u.wallet.transactions) {
                await client.query(`
                  INSERT INTO transactions (id, user_id, type, amount, status, date, reference, utr, submitted_at)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                  ON CONFLICT (id) DO NOTHING
                `, [tx.id, u.id, tx.type, tx.amount, tx.status, tx.date, tx.reference, tx.utr, tx.submittedAt]);
             }
           }
        }
        
        if (admin && admin.transactions) {
          await client.query("UPDATE admin_stats SET total_withdrawn = $1 WHERE id = 1", [admin.totalWithdrawn || 0]);
          for (const tx of admin.transactions) {
             await client.query(`
                INSERT INTO admin_transactions (id, amount, date, reference)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO NOTHING
             `, [tx.id, tx.amount, tx.date, tx.reference]);
          }
        }
        console.log("Migration complete. Deleting blobs table.");
        await client.query("DROP TABLE blobs");
      }
    } catch (err) {
      // Blobs table might not exist or migration already done, ignore
    }

    client.release();
  } catch (error) {
    console.error('PostgreSQL connection/initialization error:', error);
  }
}

// Initialize database on startup
initDB();

// Helper to construct user object with wallet
async function fetchFullUser(userId) {
  const userRes = await pgPool.query("SELECT * FROM users WHERE id = $1", [userId]);
  if (userRes.rowCount === 0) return null;
  const user = userRes.rows[0];
  
  const txRes = await pgPool.query("SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC", [userId]);
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    level: user.level,
    vip: user.vip,
    wallet: {
      balance: user.balance,
      transactions: txRes.rows
    }
  };
}

// Memory store for tracking online users via heartbeat
const activeUsers = new Map(); // userId -> lastSeenTimestamp

// --- PUBLIC ROUTES ---
app.get('/api/games', async (req, res) => {
  try {
    const dbRes = await pgPool.query("SELECT games FROM games_db WHERE key = 'main'");
    res.json(dbRes.rows[0]?.games || []);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch games' }); }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const dbRes = await pgPool.query("SELECT leaderboard FROM games_db WHERE key = 'main'");
    res.json(dbRes.rows[0]?.leaderboard || []);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch leaderboard' }); }
});

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
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

    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters long.' });

    const newId = `u_${Date.now()}`;
    const avatar = `https://i.pravatar.cc/150?u=${Date.now()}`;
    
    try {
      await pgPool.query(`
        INSERT INTO users (id, username, email, password, avatar, level, vip, balance)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [newId, trimmed, emailTrimmed, password, avatar, 1, 'Bronze', 0]);
    } catch (dbErr) {
      if (dbErr.code === '23505') { // unique violation
        if (dbErr.constraint === 'users_username_key') {
          return res.status(400).json({ error: 'Username already exists. Please login instead.' });
        }
        if (dbErr.constraint === 'users_email_key') {
          return res.status(400).json({ error: 'Email already registered. Please login instead.' });
        }
        return res.status(400).json({ error: 'Username or Email already exists.' });
      }
      throw dbErr;
    }

    const safeUser = {
      id: newId,
      username: trimmed,
      email: emailTrimmed,
      avatar,
      level: 1,
      vip: 'Bronze',
      wallet: { balance: 0, transactions: [] }
    };

    res.json({ message: 'Registration successful', user: safeUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const userRes = await pgPool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
    if (userRes.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const fullUser = await fetchFullUser(userRes.rows[0].id);
    res.json({ message: 'Login successful', user: fullUser });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const userId = req.headers['authorization']; 
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fullUser = await fetchFullUser(userId);
    if (!fullUser) return res.status(401).json({ error: 'User not found' });

    res.json(fullUser);
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

// --- WALLET ROUTES ---

app.get('/api/wallet', async (req, res) => {
  try {
    const userId = req.headers['authorization'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fullUser = await fetchFullUser(userId);
    if (!fullUser) return res.status(401).json({ error: 'User not found' });

    res.json(fullUser.wallet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallet info' });
  }
});

app.post('/api/wallet/transaction', async (req, res) => {
  try {
    const userId = req.headers['authorization'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { type, amount, reference } = req.body;
    if (!type || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid transaction details' });
    }

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const userRes = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
      if (userRes.rowCount === 0) throw new Error('User not found');
      
      let balance = userRes.rows[0].balance;

      if (['withdraw', 'transfer', 'game_fee'].includes(type)) {
        if (balance < amount) throw new Error('Insufficient balance');
        balance -= amount;
      } else if (type === 'deposit' || type === 'winnings') {
        balance += amount;
      } else {
        throw new Error('Invalid transaction type');
      }

      await client.query('UPDATE users SET balance = $1 WHERE id = $2', [balance, userId]);

      const txId = `tx_${Date.now()}`;
      const status = type === 'withdraw' ? 'Pending' : 'Success';
      const ref = reference || type;
      
      await client.query(`
        INSERT INTO transactions (id, user_id, type, amount, status, reference)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [txId, userId, type, amount, status, ref]);

      await client.query('COMMIT');

      // Fetch transaction for response
      const txRes = await client.query('SELECT * FROM transactions WHERE id = $1', [txId]);

      res.json({ message: 'Transaction successful', balance, transaction: txRes.rows[0] });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: e.message || 'Failed to process transaction' });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to process transaction' });
  }
});

// --- SECURE DEPOSIT FLOW ENDPOINTS ---

app.post('/api/wallet/deposit/submit-utr', async (req, res) => {
  try {
    const userId = req.headers['authorization'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { amount, utr } = req.body;
    const parsedAmount = parseInt(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }
    
    if (!utr || !/^\d{10,16}$/.test(utr)) {
      return res.status(400).json({ error: 'Please enter a valid UTR number (10-16 digits)' });
    }

    // Check UTR duplicate
    const utrCheck = await pgPool.query("SELECT id FROM transactions WHERE utr = $1 AND status != 'Failed'", [utr]);
    if (utrCheck.rowCount > 0) {
      return res.status(400).json({ error: 'This UPI Transaction Reference (UTR) has already been used.' });
    }

    const txId = `tx_dep_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    
    await pgPool.query(`
      INSERT INTO transactions (id, user_id, type, amount, status, reference, utr, submitted_at)
      VALUES ($1, $2, 'deposit', $3, 'Pending', 'Manual UPI Deposit', $4, $5)
    `, [txId, userId, parsedAmount, utr, now]);

    const txRes = await pgPool.query('SELECT * FROM transactions WHERE id = $1', [txId]);
    res.json({ message: 'Deposit verification submitted', transaction: txRes.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit UTR' });
  }
});

app.get('/api/wallet/deposit/status/:txId', async (req, res) => {
  try {
    const userId = req.headers['authorization'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const txId = req.params.txId;
    
    const txRes = await pgPool.query("SELECT * FROM transactions WHERE id = $1 AND user_id = $2", [txId, userId]);
    if (txRes.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const userRes = await pgPool.query("SELECT balance FROM users WHERE id = $1", [userId]);

    res.json({ status: txRes.rows[0].status, transaction: txRes.rows[0], balance: userRes.rows[0].balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check transaction status' });
  }
});

app.post('/api/wallet/deposit/razorpay-success', async (req, res) => {
  try {
    const userId = req.headers['authorization'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { paymentId, amount } = req.body;
    const parsedAmount = parseInt(amount);
    if (!paymentId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid payment parameters' });
    }

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      
      const utrCheck = await client.query("SELECT id FROM transactions WHERE utr = $1 AND status = 'Success'", [paymentId]);
      if (utrCheck.rowCount > 0) {
        throw new Error('This payment has already been credited to a wallet.');
      }

      const txId = `tx_rzp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await client.query(`
        INSERT INTO transactions (id, user_id, type, amount, status, reference, utr)
        VALUES ($1, $2, 'deposit', $3, 'Success', $4, $5)
      `, [txId, userId, parsedAmount, `Razorpay Ref: ${paymentId}`, paymentId]);

      const updateRes = await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance", [parsedAmount, userId]);
      
      await client.query('COMMIT');
      
      const txRes = await client.query('SELECT * FROM transactions WHERE id = $1', [txId]);

      res.json({ message: 'Razorpay deposit credited successfully', balance: updateRes.rows[0].balance, transaction: txRes.rows[0] });
    } catch(e) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: e.message || 'Failed to verify Razorpay deposit' });
    } finally {
      client.release();
    }
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

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const usersCountRes = await pgPool.query("SELECT COUNT(*) as count, SUM(balance) as total_balances FROM users");
    const totalUsers = parseInt(usersCountRes.rows[0].count) || 0;
    const totalUserBalances = parseFloat(usersCountRes.rows[0].total_balances) || 0;

    const txStatsRes = await pgPool.query(`
      SELECT 
        SUM(CASE WHEN type = 'deposit' AND status = 'Success' AND reference NOT LIKE '%Cash Out%' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN type = 'withdraw' AND status = 'Success' THEN amount ELSE 0 END) as total_withdrawals,
        COUNT(CASE WHEN type = 'deposit' AND status = 'Pending' AND utr IS NOT NULL THEN 1 END) as pending_deposits,
        COUNT(CASE WHEN type = 'withdraw' AND status = 'Pending' THEN 1 END) as pending_withdrawals
      FROM transactions
    `);
    
    const totalDeposits = parseFloat(txStatsRes.rows[0].total_deposits) || 0;
    const totalWithdrawals = parseFloat(txStatsRes.rows[0].total_withdrawals) || 0;
    const pendingDeposits = parseInt(txStatsRes.rows[0].pending_deposits) || 0;
    const pendingWithdrawals = parseInt(txStatsRes.rows[0].pending_withdrawals) || 0;

    const adminStatsRes = await pgPool.query("SELECT total_withdrawn FROM admin_stats WHERE id = 1");
    const withdrawnProfit = parseFloat(adminStatsRes.rows[0]?.total_withdrawn) || 0;

    const platformBankCash = totalDeposits - totalWithdrawals;
    const availableProfit = platformBankCash - totalUserBalances - withdrawnProfit;

    const now = Date.now();
    let onlineUsers = 0;
    activeUsers.forEach((lastSeen, userId) => {
      if (now - lastSeen < 60000) {
        onlineUsers++;
      } else {
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
      withdrawnProfit,
      availableProfit
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const usersRes = await pgPool.query("SELECT id, username, email, avatar, level, vip, balance FROM users");
    res.json(usersRes.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

app.get('/api/admin/transactions', adminAuth, async (req, res) => {
  try {
    const txRes = await pgPool.query(`
      SELECT t.*, u.username 
      FROM transactions t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.date DESC
    `);
    // Map user_id to userId to match frontend expectations
    const mapped = txRes.rows.map(tx => ({
      ...tx,
      userId: tx.user_id,
      submittedAt: tx.submitted_at
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin transactions' });
  }
});

app.post('/api/admin/deposit/approve', adminAuth, async (req, res) => {
  try {
    const { userId, transactionId } = req.body;
    if (!userId || !transactionId) return res.status(400).json({ error: 'Missing parameters' });

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const txRes = await client.query("SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE", [transactionId, userId]);
      if (txRes.rowCount === 0) throw new Error('Transaction not found');
      
      const tx = txRes.rows[0];
      if (tx.status !== 'Pending') throw new Error('Transaction is already processed');

      const ref = `UPI Ref: ${tx.utr || 'Approved by Admin'}`;
      await client.query("UPDATE transactions SET status = 'Success', reference = $1 WHERE id = $2", [ref, transactionId]);
      
      const userRes = await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance", [tx.amount, userId]);
      
      await client.query('COMMIT');
      
      const updatedTx = await client.query("SELECT * FROM transactions WHERE id = $1", [transactionId]);
      res.json({ message: 'Approved', balance: userRes.rows[0].balance, transaction: updatedTx.rows[0] });
    } catch(e) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: e.message });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve' });
  }
});

app.post('/api/admin/deposit/reject', adminAuth, async (req, res) => {
  try {
    const { userId, transactionId } = req.body;
    
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const txRes = await client.query("SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE", [transactionId, userId]);
      if (txRes.rowCount === 0) throw new Error('Transaction not found');
      
      const tx = txRes.rows[0];
      if (tx.status !== 'Pending') throw new Error('Transaction is already processed');

      const ref = `Rejected by Admin: ${tx.utr || 'Manual UTR invalid'}`;
      await client.query("UPDATE transactions SET status = 'Failed', reference = $1 WHERE id = $2", [ref, transactionId]);
      
      const userRes = await client.query("SELECT balance FROM users WHERE id = $1", [userId]);
      
      await client.query('COMMIT');
      const updatedTx = await client.query("SELECT * FROM transactions WHERE id = $1", [transactionId]);
      res.json({ message: 'Rejected', balance: userRes.rows[0].balance, transaction: updatedTx.rows[0] });
    } catch(e) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: e.message });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject' });
  }
});

app.post('/api/admin/withdraw/approve', adminAuth, async (req, res) => {
  try {
    const { userId, transactionId } = req.body;
    
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const txRes = await client.query("SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE", [transactionId, userId]);
      if (txRes.rowCount === 0) throw new Error('Transaction not found');
      
      const tx = txRes.rows[0];
      if (tx.status !== 'Pending') throw new Error('Transaction is already processed');

      const ref = `Withdraw approved: ${tx.reference}`;
      await client.query("UPDATE transactions SET status = 'Success', reference = $1 WHERE id = $2", [ref, transactionId]);
      
      const userRes = await client.query("SELECT balance FROM users WHERE id = $1", [userId]);
      
      await client.query('COMMIT');
      const updatedTx = await client.query("SELECT * FROM transactions WHERE id = $1", [transactionId]);
      res.json({ message: 'Withdrawal approved', balance: userRes.rows[0].balance, transaction: updatedTx.rows[0] });
    } catch(e) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: e.message });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

app.post('/api/admin/withdraw/reject', adminAuth, async (req, res) => {
  try {
    const { userId, transactionId } = req.body;
    
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const txRes = await client.query("SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE", [transactionId, userId]);
      if (txRes.rowCount === 0) throw new Error('Transaction not found');
      
      const tx = txRes.rows[0];
      if (tx.status !== 'Pending') throw new Error('Transaction is already processed');

      const ref = `Withdraw rejected (Refunded): ${tx.reference}`;
      await client.query("UPDATE transactions SET status = 'Failed', reference = $1 WHERE id = $2", [ref, transactionId]);
      
      // Refund
      const userRes = await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance", [tx.amount, userId]);
      
      await client.query('COMMIT');
      const updatedTx = await client.query("SELECT * FROM transactions WHERE id = $1", [transactionId]);
      res.json({ message: 'Withdrawal rejected and refunded', balance: userRes.rows[0].balance, transaction: updatedTx.rows[0] });
    } catch(e) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: e.message });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

app.post('/api/admin/user/update-balance', adminAuth, async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const parsedAmount = parseInt(amount);
    if (!userId || isNaN(parsedAmount)) return res.status(400).json({ error: 'Invalid parameters' });

    const isCredit = parsedAmount >= 0;
    const absAmount = Math.abs(parsedAmount);

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const userRes = await client.query("SELECT balance FROM users WHERE id = $1 FOR UPDATE", [userId]);
      if (userRes.rowCount === 0) throw new Error('User not found');
      
      if (!isCredit && userRes.rows[0].balance < absAmount) {
        throw new Error('Insufficient balance to deduct');
      }

      const txId = `tx_adj_${Date.now()}`;
      const type = isCredit ? 'deposit' : 'withdraw';
      await client.query(`
        INSERT INTO transactions (id, user_id, type, amount, status, reference, utr)
        VALUES ($1, $2, $3, $4, 'Success', 'Admin Adjustment', 'ADMIN')
      `, [txId, userId, type, absAmount]);

      const updatedUserRes = await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance", [parsedAmount, userId]);
      
      await client.query('COMMIT');
      res.json({ message: 'User balance updated successfully', balance: updatedUserRes.rows[0].balance });
    } catch(e) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: e.message });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user balance' });
  }
});

app.post('/api/admin/system/withdraw', adminAuth, async (req, res) => {
  try {
    const { amount, reference } = req.body;
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const usersCountRes = await pgPool.query("SELECT SUM(balance) as total_balances FROM users");
    const totalUserBalances = parseFloat(usersCountRes.rows[0].total_balances) || 0;

    const txStatsRes = await pgPool.query(`
      SELECT 
        SUM(CASE WHEN type = 'deposit' AND status = 'Success' AND reference NOT LIKE '%Cash Out%' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN type = 'withdraw' AND status = 'Success' THEN amount ELSE 0 END) as total_withdrawals
      FROM transactions
    `);
    const totalDeposits = parseFloat(txStatsRes.rows[0].total_deposits) || 0;
    const totalWithdrawals = parseFloat(txStatsRes.rows[0].total_withdrawals) || 0;

    const adminStatsRes = await pgPool.query("SELECT total_withdrawn FROM admin_stats WHERE id = 1 FOR UPDATE");
    const withdrawnProfit = parseFloat(adminStatsRes.rows[0]?.total_withdrawn) || 0;

    const platformBankCash = totalDeposits - totalWithdrawals;
    const availableProfit = platformBankCash - totalUserBalances - withdrawnProfit;

    if (parsedAmount > availableProfit) {
      return res.status(400).json({ error: 'Insufficient available platform profit' });
    }

    const txId = `admin_tx_${Date.now()}`;
    await pgPool.query(`
      INSERT INTO admin_transactions (id, amount, reference) VALUES ($1, $2, $3)
    `, [txId, parsedAmount, reference || 'Admin Profit Withdrawal']);

    const newWithdrawn = withdrawnProfit + parsedAmount;
    await pgPool.query("UPDATE admin_stats SET total_withdrawn = $1 WHERE id = 1", [newWithdrawn]);

    res.json({ message: 'Profit withdrawn successfully', withdrawnProfit: newWithdrawn, availableProfit: availableProfit - parsedAmount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to withdraw profit' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
