const BASE_URL = 'https://zoobo-1.onrender.com/api'; // Hardcoded to prevent env override

const getHeaders = () => {
  const token = localStorage.getItem('zoobo_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': token })
  };
};

export const registerUser = async (username, email, password) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Server is currently offline or deploying. Please try again in a minute.');
  }
  if (!res.ok) throw new Error(data.error || 'Failed to register');
  return data;
};

export const loginUser = async (username, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Server is currently offline or deploying. Please try again in a minute.');
  }
  if (!res.ok) throw new Error(data.error || 'Failed to login');
  return data;
};

export const fetchMe = async () => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
  return data;
};

export const fetchGames = async () => {
  const res = await fetch(`${BASE_URL}/games`);
  if (!res.ok) throw new Error('Failed to fetch games');
  return res.json();
};

export const fetchLeaderboard = async () => {
  const res = await fetch(`${BASE_URL}/leaderboard`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
};

export const fetchGameSettings = async () => {
  const res = await fetch(`${BASE_URL}/games/settings`);
  if (!res.ok) throw new Error('Failed to fetch game settings');
  return res.json();
};


export const sendHeartbeat = async () => {
  const res = await fetch(`${BASE_URL}/auth/heartbeat`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed heartbeat');
  return res.json();
};

export const fetchWallet = async () => {
  const res = await fetch(`${BASE_URL}/wallet`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch wallet info');
  return res.json();
};

export const postTransaction = async (type, amount, reference) => {
  const res = await fetch(`${BASE_URL}/wallet/transaction`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ type, amount, reference }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to process transaction');
  return data;
};

export const requestDeposit = async (amount: number) => {
  const res = await fetch(`${BASE_URL}/wallet/deposit/request`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to request deposit');
  return data;
};

export const submitDepositUtr = async (amount: number, utr: string) => {
  const res = await fetch(`${BASE_URL}/wallet/deposit/submit-utr`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount, utr })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit UTR');
  return data;
};

export const getDepositStatus = async (transactionId: string) => {
  const res = await fetch(`${BASE_URL}/wallet/deposit/status/${transactionId}`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch deposit status');
  return data;
};

export const verifyRazorpayDeposit = async (paymentId: string, amount: number) => {
  const res = await fetch(`${BASE_URL}/wallet/deposit/razorpay-success`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ paymentId, amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to verify Razorpay deposit');
  return data;
};

export const createCashfreeOrder = async (amount: number) => {
  const res = await fetch(`${BASE_URL}/wallet/deposit/cashfree-order`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create Cashfree order');
  return data; // returns { payment_session_id, order_id }
};

export const verifyCashfreeDeposit = async (orderId: string) => {
  const res = await fetch(`${BASE_URL}/wallet/deposit/cashfree-verify`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ orderId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to verify Cashfree deposit');
  return data; // returns updated balance
};

export const getAdminToken = () => localStorage.getItem('zoobo_admin_token');
export const setAdminToken = (token: string) => localStorage.setItem('zoobo_admin_token', token);
export const clearAdminToken = () => localStorage.removeItem('zoobo_admin_token');

const getAdminHeaders = () => {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'x-admin-token': token })
  };
};

export const verifyAdminPassword = async (password: string) => {
  const res = await fetch(`${BASE_URL}/admin/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': password
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invalid Admin Password');
  return data;
};

export const fetchAdminStats = async () => {
  const res = await fetch(`${BASE_URL}/admin/stats`, {
    headers: getAdminHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch admin stats');
  return res.json();
};

export const updateAdminSettings = async (winPercentage: number) => {
  const res = await fetch(`${BASE_URL}/admin/settings`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ winPercentage }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update settings');
  return data;
};

export const fetchAdminUsers = async () => {
  const res = await fetch(`${BASE_URL}/admin/users`, {
    headers: getAdminHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch admin users');
  return res.json();
};

export const fetchAdminTransactions = async () => {
  const res = await fetch(`${BASE_URL}/admin/transactions`, {
    headers: getAdminHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch admin transactions');
  return res.json();
};

export const approveDeposit = async (userId: string, transactionId: string) => {
  const res = await fetch(`${BASE_URL}/admin/deposit/approve`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ userId, transactionId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to approve deposit');
  return data;
};

export const rejectDeposit = async (userId: string, transactionId: string) => {
  const res = await fetch(`${BASE_URL}/admin/deposit/reject`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ userId, transactionId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reject deposit');
  return data;
};

export const updateUserBalance = async (userId: string, amount: number) => {
  const res = await fetch(`${BASE_URL}/admin/user/update-balance`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ userId, amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update user balance');
  return data;
};

export const approveWithdrawal = async (userId: string, transactionId: string) => {
  const res = await fetch(`${BASE_URL}/admin/withdraw/approve`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ userId, transactionId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to approve withdrawal');
  return data;
};

export const rejectWithdrawal = async (userId: string, transactionId: string) => {
  const res = await fetch(`${BASE_URL}/admin/withdraw/reject`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ userId, transactionId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reject withdrawal');
  return data;
};

export const withdrawSystemProfit = async (amount: number, reference: string) => {
  const res = await fetch(`${BASE_URL}/admin/system/withdraw`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ amount, reference }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to withdraw profit');
  return data;
};
