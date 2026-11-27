/**
 * TradeLens — Java Backend API Client (with Automatic Offline Fallback)
 * - Uses the Core Java HttpServer (http://localhost:8080/api) when running.
 * - Automatically falls back to local browser storage if the Java server is offline
 *   (e.g. when opening index.html directly via file://), so login & UI always work.
 */

window.TradeLensAPI = (() => {
  const DEFAULT_BACKEND_URL = "http://localhost:8080/api";
  const SESSION_KEY = "tradelens_auth";
  const SETTINGS_KEY = "tradelens_ui_settings";
  const LOCAL_PREFIX = "tradelens_local_";

  const DEFAULT_SETTINGS = {
    settingsVersion: 2,
    provider: "tapetide",
    apiKey: "",
    backendUrl: DEFAULT_BACKEND_URL,
    currency: "INR",
    defaultTimeframe: "1M",
    defaultChartType: "area",
    priceAlerts: true,
    autoRefresh: true,
  };

  function readLocal(name, fallback) {
    try {
      const raw = localStorage.getItem(LOCAL_PREFIX + name);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeLocal(name, val) {
    try {
      localStorage.setItem(LOCAL_PREFIX + name, JSON.stringify(val));
    } catch {
      // Ignore storage quota errors
    }
  }

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

// Model normalizers for Java JSON responses
  function normalizeStock(s) {
    if (!s) return s;
    const price = Number(s.currentPrice ?? s.price ?? 0);
    const open = Number(s.previousClose ?? s.open ?? price);
    const change = Number(s.priceChange ?? s.change ?? (price - open));
    const changePercent = Number(
      s.changePercentage ?? s.changePercent ?? (open > 0 ? (change / open) * 100 : 0)
    );
    return {
      symbol: s.symbol,
      name: s.companyName || s.name || s.symbol + " Ltd.",
      exchange: s.exchange || "NSE",
      sector: s.sector || "Equity",
      price: Number(price.toFixed(2)),
      open: Number(open.toFixed(2)),
      high: Number((s.dayHigh ?? s.high ?? price).toFixed(2)),
      low: Number((s.dayLow ?? s.low ?? price).toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: s.volume || "2.4M",
      marketCap: s.marketCap || "—",
      peRatio: s.peRatio || "—",
      isLive: true,
    };
  }

  function normalizeHolding(h) {
    return {
      symbol: h.symbol,
      name: h.companyName || h.name,
      qty: Number(h.quantity ?? h.qty ?? 0),
      avgPrice: Number(h.avgBuyPrice ?? h.avgPrice ?? 0),
      ltp: h.currentPrice != null ? Number(h.currentPrice) : undefined,
    };
  }

  function normalizeOrder(o) {
    return {
      orderId: o.orderId,
      time: o.timestamp || o.time || "Just now",
      symbol: o.symbol,
      side: o.type || o.side || "BUY",
      orderType: o.orderMode || o.orderType || "MARKET",
      qty: Number(o.quantity ?? o.qty ?? 0),
      price: Number(o.price ?? 0),
      status: o.status || "COMPLETED",
    };
  }

  function isNetworkError(err) {
    return err instanceof TypeError || /load failed|failed to fetch|networkerror/i.test(err?.message || "");
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
      const serverErr = new Error(data.error || `Request failed (${res.status})`);
      serverErr.isHttpError = true;
      throw serverErr;
    }
    return data;
  }

  // Local fallback data
  function ensureLocalSeeds() {
    if (!localStorage.getItem(LOCAL_PREFIX + "cash")) {
      writeLocal("cash", 145000.0);
    }
    if (!localStorage.getItem(LOCAL_PREFIX + "holdings")) {
      writeLocal("holdings", [
        { symbol: "RELIANCE", qty: 15, avgPrice: 1210.0 },
        { symbol: "TCS", qty: 5, avgPrice: 3980.0 },
        { symbol: "HDFCBANK", qty: 12, avgPrice: 1690.0 },
        { symbol: "ITC", qty: 40, avgPrice: 452.5 },
      ]);
    }
    if (!localStorage.getItem(LOCAL_PREFIX + "orders")) {
      writeLocal("orders", [
        { orderId: "ORD-90412", time: "Today, 10:14 AM", symbol: "RELIANCE", side: "BUY", orderType: "MARKET", qty: 5, price: 1280.4, status: "COMPLETED" },
        { orderId: "ORD-90388", time: "Yesterday, 02:45 PM", symbol: "ITC", side: "BUY", orderType: "LIMIT", qty: 20, price: 472.0, status: "COMPLETED" },
      ]);
    }
    if (!localStorage.getItem(LOCAL_PREFIX + "watchlist")) {
      writeLocal("watchlist", [
        { symbol: "RELIANCE", targetPrice: "1350.00", note: "Energy & Telecom · NSE" },
        { symbol: "TCS", targetPrice: "4250.00", note: "IT Services · NSE" },
        { symbol: "INFY", targetPrice: "1920.00", note: "IT Services · NSE" },
      ]);
    }
  }

  // Auth & Account
  async function login(email, password) {
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuthData(data.token, data.user);
      return data.user;
    } catch (err) {
      if (!isNetworkError(err)) throw err;

      // Offline fallback when Java server isn't running
      const users = readLocal("users", []);
      const cleanEmail = email.trim().toLowerCase();
      let found = users.find((u) => u.email === cleanEmail && u.password === password);
      if (!found && cleanEmail === "demo@tradelens.in" && password === "demo1234") {
        found = {
          id: 1,
          tradeId: "TL-849201",
          name: "Abhirath Bhandari",
          email: "demo@tradelens.in",
          panCard: "ABCDE1234F",
          phone: "+91 98765 43210",
          dob: "2000-01-15",
          kycStatus: "Verified",
          tradingStyle: "Swing Trader",
          bankName: "HDFC Bank",
          accountNumber: "50100482910482",
          ifscCode: "HDFC0001245",
          accountType: "Savings",
          dematId: "1208160048291042",
          cashBalance: 145000.0,
        };
      }
      if (!found) {
        throw new Error("Java server offline & invalid local credentials. Use Demo Account or Sign Up.");
      }
      ensureLocalSeeds();
      setAuthData("offline-demo-token", found);
      return found;
    }
  }

  async function signup({ name, email, password, tradingStyle, panCard }) {
    try {
      const data = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password, tradingStyle, panCard }),
      });
      setAuthData(data.token, data.user);
      return data.user;
    } catch (err) {
      if (!isNetworkError(err)) throw err;

      const users = readLocal("users", []);
      const cleanEmail = email.trim().toLowerCase();
      if (users.some((u) => u.email === cleanEmail)) {
        throw new Error("An account with this email already exists.");
      }
      const newUser = {
        id: Math.floor(100 + Math.random() * 900),
        tradeId: "TL-" + Math.floor(100000 + Math.random() * 899999),
        name: name.trim(),
        email: cleanEmail,
        password,
        panCard: (panCard || "ABCDE1234F").trim().toUpperCase(),
        phone: "+91 98765 43210",
        dob: "2000-01-15",
        kycStatus: "Verified",
        tradingStyle: tradingStyle || "Swing Trader",
        bankName: "HDFC Bank",
        accountNumber: "50100482910482",
        ifscCode: "HDFC0001245",
        accountType: "Savings",
        dematId: "1208160048291042",
        cashBalance: 145000.0,
      };
      users.push(newUser);
      writeLocal("users", users);
      ensureLocalSeeds();
      const safeUser = { ...newUser };
      delete safeUser.password;
      setAuthData("offline-demo-token", safeUser);
      return safeUser;
    }
  }

  async function logout() {
    try {
      if (getToken() && getToken() !== "offline-demo-token") {
        await apiFetch("/auth/logout", { method: "POST" });
      }
    } catch {
      // Ignore network errors on sign out
    } finally {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  async function getAccount() {
    try {
      const data = await apiFetch("/account", { method: "GET" });
      const user = data.user || data;
      setAuthData(getToken(), user);
      return user;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      return getSession();
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
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      const updatedUser = { ...getSession(), ...updates };
      setAuthData(getToken(), updatedUser);
      return updatedUser;
    }
  }

  // Portfolio, Holdings, Orders & Cash
  async function getPortfolio() {
    try {
      const data = await apiFetch("/portfolio", { method: "GET" });
      return {
        cash: Number(data.cash ?? 0),
        holdings: (data.holdings || []).map(normalizeHolding),
        orders: (data.orders || []).map(normalizeOrder),
      };
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      ensureLocalSeeds();
      return {
        cash: readLocal("cash", 145000.0),
        holdings: readLocal("holdings", []),
        orders: readLocal("orders", []),
      };
    }
  }

  async function addFunds(amount) {
    try {
      const data = await apiFetch("/portfolio/deposit", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) }),
      });
      return Number(data.cash);
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      ensureLocalSeeds();
      const next = Number((readLocal("cash", 145000.0) + Number(amount)).toFixed(2));
      writeLocal("cash", next);
      return next;
    }
  }

  async function placeOrder({ symbol, side, orderType, qty, price }) {
    try {
      const endpoint = side === "SELL" ? "/sell" : "/buy";
      const payload = {
        symbol,
        quantity: parseInt(qty, 10),
        orderMode: (orderType || "MARKET").toUpperCase(),
      };
      if (payload.orderMode === "LIMIT" && Number(price) > 0) {
        payload.limitPrice = Number(price);
      }
      const tradeRes = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const portfolio = await getPortfolio();
      return {
        ...portfolio,
        cash: tradeRes.walletBalance != null ? Number(tradeRes.walletBalance) : portfolio.cash,
        order: tradeRes.order
          ? normalizeOrder(tradeRes.order)
          : {
              side,
              qty: payload.quantity,
              symbol,
              status: payload.orderMode === "LIMIT" ? "PENDING" : "COMPLETED",
            },
      };
    } catch (err) {
      if (!isNetworkError(err)) throw err;

      // Offline trade execution fallback
      ensureLocalSeeds();
      const quantity = parseInt(qty, 10);
      const execPrice = Number(price);
      const total = quantity * execPrice;
      let cash = readLocal("cash", 145000.0);
      const holdings = readLocal("holdings", []);
      const orders = readLocal("orders", []);
      const idx = holdings.findIndex((h) => h.symbol === symbol);

      if (side === "BUY") {
        if (cash < total) throw new Error("Insufficient available margin.");
        cash = Number((cash - total).toFixed(2));
        if (idx !== -1) {
          const prev = holdings[idx];
          const newQty = prev.qty + quantity;
          holdings[idx] = {
            symbol,
            qty: newQty,
            avgPrice: Number(((prev.qty * prev.avgPrice + total) / newQty).toFixed(2)),
          };
        } else {
          holdings.push({ symbol, qty: quantity, avgPrice: Number(execPrice.toFixed(2)) });
        }
      } else {
        if (idx === -1 || holdings[idx].qty < quantity) {
          throw new Error(`You do not have ${quantity} shares of ${symbol} to sell.`);
        }
        cash = Number((cash + total).toFixed(2));
        if (holdings[idx].qty === quantity) holdings.splice(idx, 1);
        else holdings[idx].qty -= quantity;
      }

      const order = {
        orderId: "ORD-" + Math.floor(10000 + Math.random() * 89999),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        symbol,
        side,
        orderType: orderType || "MARKET",
        qty: quantity,
        price: Number(execPrice.toFixed(2)),
        status: "COMPLETED",
      };
      orders.unshift(order);
      writeLocal("cash", cash);
      writeLocal("holdings", holdings);
      writeLocal("orders", orders);
      return { cash, holdings, orders, order };
    }
  }

  // Watchlist
  async function getWatchlist() {
    try {
      const data = await apiFetch("/watchlist", { method: "GET" });
      const list = Array.isArray(data) ? data : data.watchlist || [];
      return list.map((item) => ({
        symbol: item.symbol,
        targetPrice: item.targetPrice || "—",
        note: item.note || (item.sector ? `${item.sector} · NSE` : "Watching"),
      }));
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      ensureLocalSeeds();
      return readLocal("watchlist", []);
    }
  }

  async function addToWatchlist(symbol) {
    try {
      await apiFetch("/watchlist", {
        method: "POST",
        body: JSON.stringify({ symbol }),
      });
      return getWatchlist();
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      ensureLocalSeeds();
      const list = readLocal("watchlist", []);
      if (!list.some((w) => w.symbol === symbol)) {
        list.push({ symbol, targetPrice: "—", note: "Added to Watchlist" });
        writeLocal("watchlist", list);
      }
      return list;
    }
  }

  async function removeFromWatchlist(symbol) {
    try {
      await apiFetch(`/watchlist?symbol=${encodeURIComponent(symbol)}`, {
        method: "DELETE",
      });
      return getWatchlist();
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      ensureLocalSeeds();
      const next = readLocal("watchlist", []).filter((w) => w.symbol !== symbol);
      writeLocal("watchlist", next);
      return next;
    }
  }

  // Live Market Data
  async function fetchAllStocks() {
    try {
      const rawList = await apiFetch("/stocks", { method: "GET" });
      const normalized = Array.isArray(rawList) ? rawList.map(normalizeStock) : [];
      if (normalized.length > 0 && window.TradeLensData) {
        normalized.forEach((live) => {
          const target = window.TradeLensData.STOCKS.find((s) => s.symbol === live.symbol);
          if (target) Object.assign(target, live);
          else window.TradeLensData.STOCKS.push(live);
        });
      }
      return normalized;
    } catch {
      // Simulate subtle live ticks when Java server is offline so graphs still move
      if (window.TradeLensData) {
        window.TradeLensData.STOCKS.forEach((s) => {
          const delta = (Math.random() - 0.495) * s.price * 0.0025;
          s.price = Number(Math.max(10, s.price + delta).toFixed(2));
          s.change = Number((s.price - s.open).toFixed(2));
          s.changePercent = s.open > 0 ? Number(((s.change / s.open) * 100).toFixed(2)) : 0;
          s.high = Math.max(s.high, s.price);
          s.low = Math.min(s.low, s.price);
        });
      }
      return window.TradeLensData ? window.TradeLensData.STOCKS : [];
    }
  }

  async function fetchLiveQuote(symbol) {
    try {
      const raw = await apiFetch(`/stocks?symbol=${encodeURIComponent(symbol)}`, {
        method: "GET",
      });
      const normalized = normalizeStock(raw);
      if (window.TradeLensData) {
        const target = window.TradeLensData.STOCKS.find((s) => s.symbol === normalized.symbol);
        if (target) Object.assign(target, normalized);
      }
      return normalized;
    } catch {
      const stock = window.TradeLensData.STOCKS.find((s) => s.symbol === symbol);
      if (stock) {
        const delta = (Math.random() - 0.495) * stock.price * 0.0025;
        stock.price = Number(Math.max(10, stock.price + delta).toFixed(2));
        stock.change = Number((stock.price - stock.open).toFixed(2));
        stock.changePercent = stock.open > 0 ? Number(((stock.change / stock.open) * 100).toFixed(2)) : 0;
        stock.high = Math.max(stock.high, stock.price);
        stock.low = Math.min(stock.low, stock.price);
        return { ...stock, isLive: false };
      }
      return {
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
        isLive: false,
      };
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
    addToWatchlist,
    removeFromWatchlist,
    getSettings,
    saveSettings,
    fetchAllStocks,
    fetchLiveQuote,
  };
})();
