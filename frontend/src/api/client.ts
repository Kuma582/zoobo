const BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('zoobo_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': token })
  };
};

export const registerUser = async (username, password) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to register');
  return data;
};

export const loginUser = async (username, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
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
