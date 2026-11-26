/**
 * TradeLens — Java Backend API Client
 * Connects the React frontend to the Core Java HttpServer (http://localhost:8080/api).
 * Sends the user's Bearer token in the Authorization header on protected requests.
 */

window.TradeLensAPI = (() => {
  const DEFAULT_BACKEND_URL = "http://localhost:8080/api";
  const SESSION_KEY = "tradelens_auth";
  const SETTINGS_KEY = "tradelens_ui_settings";

  const DEFAULT_SETTINGS = {
    settingsVersion: 2,
    provider: "finnhub",
    apiKey: "",
    backendUrl: DEFAULT_BACKEND_URL,
    currency: "INR",
    defaultTimeframe: "1M",
    defaultChartType: "area",
    priceAlerts: true,
    autoRefresh: true,
  };

  function getSettings() {
    try {
      const raw = sessionStorage.getItem(SETTINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(next) {
    const merged = { ...getSettings(), ...next };
    sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  }

  function getBaseUrl() {
    return (getSettings().backendUrl || DEFAULT_BACKEND_URL).replace(/\/+$/, "");
  }

  function getAuthData() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setAuthData(token, user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
  }

  function getToken() {
    const auth = getAuthData();
    return auth ? auth.token : null;
  }

  function getSession() {
    const auth = getAuthData();
    return auth ? auth.user : null;
  }

  async function apiFetch(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${getBaseUrl()}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  // ---------------- Auth & Account ----------------
  async function login(email, password) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuthData(data.token, data.user);
    return data.user;
  }

  async function signup({ name, email, password, tradingStyle, panCard }) {
    const data = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, tradingStyle, panCard }),
    });
    setAuthData(data.token, data.user);
    return data.user;
  }

  async function logout() {
    try {
      if (getToken()) {
        await apiFetch("/auth/logout", { method: "POST" });
      }
    } catch {
      // Ignore network errors on sign out
    } finally {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  async function updateAccount(updates) {
    try {
      const data = await apiFetch("/account", {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      const updatedUser = data.user || { ...getSession(), ...updates };
      setAuthData(getToken(), updatedUser);
      return updatedUser;
    } catch {
      // If Person 3's /api/account isn't registered yet, keep UI responsive
      const updatedUser = { ...getSession(), ...updates };
      setAuthData(getToken(), updatedUser);
      return updatedUser;
    }
  }

  // ---------------- Portfolio, Holdings, Orders & Cash ----------------
  async function getPortfolio() {
    return apiFetch("/portfolio", { method: "GET" });
  }

  async function addFunds(amount) {
    const data = await apiFetch("/portfolio/deposit", {
      method: "POST",
      body: JSON.stringify({ amount: Number(amount) }),
    });
    return data.cash;
  }

  async function placeOrder({ symbol, side, orderType, qty, price }) {
    const endpoint = side === "SELL" ? "/sell" : "/buy";
    return apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        symbol,
        side,
        orderType: orderType || "MARKET",
        qty: parseInt(qty, 10),
        price: Number(price),
      }),
    });
  }

  // ---------------- Watchlist ----------------
  async function getWatchlist() {
    try {
      const data = await apiFetch("/watchlist", { method: "GET" });
      return Array.isArray(data) ? data : data.watchlist || [];
    } catch {
      // Fallback until Person 4's WatchlistHandler is registered
      return [
        { symbol: "RELIANCE", targetPrice: "1350.00", note: "Watch Q3 retail & Jio margins" },
        { symbol: "TCS", targetPrice: "4250.00", note: "IT large-cap support level" },
        { symbol: "INFY", targetPrice: "1920.00", note: "Breakout above 50-DMA" },
      ];
    }
  }

  async function saveWatchlist(list) {
    try {
      await apiFetch("/watchlist", {
        method: "POST",
        body: JSON.stringify({ watchlist: list }),
      });
    } catch {
      // Fallback until Person 4's WatchlistHandler is registered
    }
    return list;
  }

  // ---------------- Live Market Data from Java Backend ----------------
  async function fetchAllStocks() {
    const list = await apiFetch("/stocks", { method: "GET" });
    if (Array.isArray(list) && list.length > 0 && window.TradeLensData) {
      // Sync shared STOCKS array in place so Watchlist/Holdings/Portfolio see live prices too
      list.forEach((live) => {
        const target = window.TradeLensData.STOCKS.find((s) => s.symbol === live.symbol);
        if (target) {
          Object.assign(target, live);
        }
      });
    }
    return list;
  }

  async function fetchLiveQuote(symbol) {
    try {
      const quote = await apiFetch(`/stocks?symbol=${encodeURIComponent(symbol)}`, {
        method: "GET",
      });
      return { ...quote, isLive: true };
    } catch {
      const fallbackStock =
        window.TradeLensData.STOCKS.find((s) => s.symbol === symbol) || {
          symbol,
          name: symbol + " Ltd.",
          exchange: "NSE",
          sector: "Equity",
          price: 1000.0,
          change: 8.5,
          changePercent: 0.86,
          open: 992.0,
          high: 1008.0,
          low: 989.5,
          volume: "1.20M",
          marketCap: "—",
          peRatio: "—",
        };
      return { ...fallbackStock, isLive: false };
    }
  }

  return {
    getSession,
    getToken,
    login,
    signup,
    logout,
    getAccount,
    updateAccount,
    getPortfolio,
    addFunds,
    placeOrder,
    getWatchlist,
    saveWatchlist,
    getSettings,
    saveSettings,
    fetchAllStocks,
    fetchLiveQuote,
  };
})();
