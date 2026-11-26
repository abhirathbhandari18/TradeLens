/**
 * TradeLens Frontend API Client
 * Connects to Java HTTP Server at /api
 */

const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('tradelens_token') || 'demo-token-12345';
}

export function setToken(token) {
  if (token) localStorage.setItem('tradelens_token', token);
  else localStorage.removeItem('tradelens_token');
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `HTTP ${response.status}: ${response.statusText}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.errorCode = data?.errorCode;
    throw err;
  }
  return data;
}

export const api = {
  // Health & User
  getHealth: () => request('/health'),
  getAccount: () => request('/account'),
  depositFunds: (amount) => request('/account/deposit', { method: 'POST', body: JSON.stringify({ amount: String(amount) }) }),

  // Stocks
  getStocks: (keyword = '', sector = '') => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (sector && sector !== 'ALL') params.append('sector', sector);
    return request(`/stocks?${params.toString()}`);
  },
  getStockDetail: (symbol) => request(`/stocks/detail?symbol=${encodeURIComponent(symbol)}`),

  // Holdings & Orders (Arnav's Handlers)
  getHoldings: () => request('/holdings'),
  getOrders: () => request('/orders'),

  // Watchlist (Arnav's Handlers)
  getWatchlist: () => request('/watchlist'),
  addToWatchlist: (symbol) => request('/watchlist', { method: 'POST', body: JSON.stringify({ symbol }) }),
  removeFromWatchlist: (symbol) => request(`/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: 'DELETE' }),

  // Trading
  buyStock: (symbol, quantity, orderMode = 'MARKET') =>
    request('/trade/buy', { method: 'POST', body: JSON.stringify({ symbol, quantity: String(quantity), orderMode }) }),
  sellStock: (symbol, quantity, orderMode = 'MARKET') =>
    request('/trade/sell', { method: 'POST', body: JSON.stringify({ symbol, quantity: String(quantity), orderMode }) }),

  // Java Concepts Lab & File I/O
  runThreadSimulation: () => request('/lab/threads'),
  runStreamLab: () => request('/lab/streams'),
  getCollectionsMatrix: () => request('/lab/collections'),
  exportOrdersCsv: () => '/api/export/csv',

  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  signup: (username, email, password) => request('/auth/signup', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};
