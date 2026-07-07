const mongoose = require('mongoose');

const adminStatsSchema = new mongoose.Schema({
  totalWithdrawn: { type: Number, default: 0 },
  transactions: { type: Array, default: [] }
});

module.exports = mongoose.model('AdminStats', adminStatsSchema);
