const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  id: String,
  type: String,
  amount: Number,
  status: String,
  date: Date,
  reference: String,
  utr: String,
  submittedAt: Number
});

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String, required: true },
  avatar: String,
  level: { type: Number, default: 1 },
  vip: { type: String, default: 'Bronze' },
  wallet: {
    balance: { type: Number, default: 0 },
    transactions: [transactionSchema]
  }
});

module.exports = mongoose.model('User', userSchema);
