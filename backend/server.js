const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database File Paths
const dbPath = path.join(__dirname, 'data', 'db.json');
const usersPath = path.join(__dirname, 'data', 'users.json');

// Helpers to read/write DB
const readDB = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const readUsers = () => JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
const writeUsers = (data) => fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));

// --- AUTH ROUTES ---

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    
    const users = readUsers();
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = {
      id: `u_${Date.now()}`,
      username,
      password,
      avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
      level: 1,
      vip: 'Bronze',
      wallet: { balance: 100, transactions: [] } // 100 bonus on signup
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
