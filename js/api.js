/**
 * TradeLens — Frontend API & Storage Adapter
 *
 * Currently runs purely on the frontend (no backend required):
 * - Auth, Watchlist, Holdings, Orders, Portfolio, Settings, and Account persist in localStorage.
 * - Live Stock Data uses your API key (Finnhub / Alpha Vantage / Twelve Data)
 *   directly from the browser, or falls back to local NSE/BSE preview data.
 *
 * To connect your Java + MySQL backend later:
 * Replace the localStorage methods below with fetch() calls to your Java REST endpoints.
 */

window.TradeLensAPI = (() => {
  const KEYS = {
    USERS: "tradelens_users",
    SESSION: "tradelens_session",
    WATCHLIST: "tradelens_watchlist",
    HOLDINGS: "tradelens_holdings",
    ORDERS: "tradelens_orders",
    CASH: "tradelens_cash",
    SETTINGS: "tradelens_settings",
  };

  const DEFAULT_SETTINGS = {
    settingsVersion: 2,
    provider: "finnhub",
    apiKey: "",
    backendUrl: "http://localhost:8080/api",
    currency: "INR",
    defaultTimeframe: "1M",
    defaultChartType: "area",
    priceAlerts: true,
    autoRefresh: false,
  };

  const DEFAULT_WATCHLIST = [
    { symbol: "RELIANCE", targetPrice: "1350.00", note: "Watch Q3 retail & Jio margins" },
    { symbol: "TCS", targetPrice: "4250.00", note: "IT large-cap support level" },
    { symbol: "INFY", targetPrice: "1920.00", note: "Breakout above 50-DMA" },
  ];

  const DEFAULT_HOLDINGS = [
    { symbol: "RELIANCE", qty: 15, avgPrice: 1210.00 },
    { symbol: "TCS", qty: 5, avgPrice: 3980.00 },
    { symbol: "HDFCBANK", qty: 12, avgPrice: 1690.00 },
    { symbol: "ITC", qty: 40, avgPrice: 452.50 },
  ];

  const DEFAULT_ORDERS = [
    {
      orderId: "ORD-90412",
      time: "Today, 10:14 AM",
      symbol: "RELIANCE",
      side: "BUY",
      orderType: "MARKET",
      qty: 5,
      price: 1280.40,
      status: "EXECUTED",
    },
    {
      orderId: "ORD-90388",
      time: "Yesterday, 02:45 PM",
      symbol: "ITC",
      side: "BUY",
      orderType: "LIMIT",
      qty: 20,
      price: 472.00,
      status: "EXECUTED",
    },
    {
      orderId: "ORD-90311",
      time: "17 Nov, 11:20 AM",
      symbol: "TATAMOTORS",
      side: "SELL",
      orderType: "MARKET",
      qty: 10,
      price: 802.50,
      status: "EXECUTED",
    },
  ];

  const DEFAULT_CASH = 145000.0;

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function buildSessionUser(userObj) {
    return {
      id: userObj.id,
      tradeId: userObj.tradeId || "TL-" + String(userObj.id).slice(-6),
      name: userObj.name,
      email: userObj.email,
      phone: userObj.phone || "+91 98765 43210",
      panCard: userObj.panCard || "ABCDE1234F",
      dob: userObj.dob || "1999-06-15",
      kycStatus: userObj.kycStatus || "Verified",
      tradingStyle: userObj.tradingStyle || "Swing Trader",
      joinedAt: userObj.joinedAt,
      bankName: userObj.bankName || "HDFC Bank",
      accountNumber: userObj.accountNumber || "50100482910482",
      ifscCode: userObj.ifscCode || "HDFC0001245",
      accountType: userObj.accountType || "Savings",
      dematId: userObj.dematId || "1208160048291042",
    };
  }

  // ---------------- Auth & Account ----------------
  function getSession() {
    return readJSON(KEYS.SESSION, null);
  }

  function login(email, password) {
    // TODO (Java + MySQL): POST `${settings.backendUrl}/auth/login`
    const users = readJSON(KEYS.USERS, []);
    const found = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (!found) {
      throw new Error("Invalid email or password.");
    }
    const sessionUser = buildSessionUser(found);
    writeJSON(KEYS.SESSION, sessionUser);
    return sessionUser;
  }

  function signup({ name, email, password, tradingStyle, panCard }) {
    // TODO (Java + MySQL): POST `${settings.backendUrl}/auth/signup`
    const users = readJSON(KEYS.USERS, []);
    const exists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      throw new Error("An account with this email already exists.");
    }
    const nowId = Date.now();
    const newUser = {
      id: "USR-" + String(nowId).slice(-6),
      tradeId: "TL-" + String(Math.floor(100000 + (nowId % 900000))),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      panCard: (panCard || "ABCDE1234F").trim().toUpperCase(),
      phone: "+91 98765 43210",
      dob: "2000-01-15",
      kycStatus: "Verified",
      tradingStyle: tradingStyle || "Swing Trader",
      joinedAt: new Date().toISOString().slice(0, 10),
      bankName: "HDFC Bank",
      accountNumber: "50100482910482",
      ifscCode: "HDFC0001245",
      accountType: "Savings",
      dematId: "1208160048291042",
    };
    users.push(newUser);
    writeJSON(KEYS.USERS, users);

    const sessionUser = buildSessionUser(newUser);
    writeJSON(KEYS.SESSION, sessionUser);

    if (!localStorage.getItem(KEYS.WATCHLIST)) {
      writeJSON(KEYS.WATCHLIST, DEFAULT_WATCHLIST);
    }
    if (!localStorage.getItem(KEYS.HOLDINGS)) {
      writeJSON(KEYS.HOLDINGS, DEFAULT_HOLDINGS);
    }
    if (!localStorage.getItem(KEYS.ORDERS)) {
      writeJSON(KEYS.ORDERS, DEFAULT_ORDERS);
    }
    if (!localStorage.getItem(KEYS.CASH)) {
      writeJSON(KEYS.CASH, DEFAULT_CASH);
    }

    return sessionUser;
  }

  function logout() {
    localStorage.removeItem(KEYS.SESSION);
  }

  function updateAccount(updates) {
    // TODO (Java + MySQL): PUT `${settings.backendUrl}/account`
    const session = getSession();
    if (!session) throw new Error("Not authenticated.");

    const users = readJSON(KEYS.USERS, []);
    const idx = users.findIndex((u) => u.id === session.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      writeJSON(KEYS.USERS, users);
    }

    const updatedSession = buildSessionUser({ ...session, ...updates });
    writeJSON(KEYS.SESSION, updatedSession);
    return updatedSession;
  }

  // ---------------- Watchlist ----------------
  function getWatchlist() {
    return readJSON(KEYS.WATCHLIST, DEFAULT_WATCHLIST);
  }

  function saveWatchlist(list) {
    writeJSON(KEYS.WATCHLIST, list);
    return list;
  }

  // ---------------- Holdings, Orders & Cash ----------------
  function getHoldings() {
    return readJSON(KEYS.HOLDINGS, DEFAULT_HOLDINGS);
  }

  function getOrders() {
    return readJSON(KEYS.ORDERS, DEFAULT_ORDERS);
  }

  function getCashBalance() {
    const val = readJSON(KEYS.CASH, DEFAULT_CASH);
    return typeof val === "number" ? val : DEFAULT_CASH;
  }

  function addFunds(amount) {
    const num = Number(amount);
    if (!num || num <= 0) throw new Error("Enter a valid amount.");
    const next = getCashBalance() + num;
    writeJSON(KEYS.CASH, next);
    return next;
  }

  function placeOrder({ symbol, side, orderType, qty, price }) {
    // TODO (Java + MySQL): POST `${settings.backendUrl}/orders`
    const quantity = parseInt(qty, 10);
    const execPrice = Number(price);
    if (!symbol || !quantity || quantity <= 0 || !execPrice || execPrice <= 0) {
      throw new Error("Invalid order quantity or price.");
    }

    const totalCost = quantity * execPrice;
    let cash = getCashBalance();
    const holdings = [...getHoldings()];
    const existingIdx = holdings.findIndex((item) => item.symbol === symbol);

    if (side === "BUY") {
      if (cash < totalCost) {
        throw new Error("Insufficient available margin.");
      }
      cash -= totalCost;
      if (existingIdx !== -1) {
        const prev = holdings[existingIdx];
        const newQty = prev.qty + quantity;
        const newAvg = (prev.qty * prev.avgPrice + totalCost) / newQty;
        holdings[existingIdx] = {
          symbol,
          qty: newQty,
          avgPrice: Number(newAvg.toFixed(2)),
        };
      } else {
        holdings.push({
          symbol,
          qty: quantity,
          avgPrice: Number(execPrice.toFixed(2)),
        });
      }
    } else if (side === "SELL") {
      if (existingIdx === -1 || holdings[existingIdx].qty < quantity) {
        throw new Error(`You do not have ${quantity} shares of ${symbol} to sell.`);
      }
      cash += totalCost;
      const remaining = holdings[existingIdx].qty - quantity;
      if (remaining === 0) {
        holdings.splice(existingIdx, 1);
      } else {
        holdings[existingIdx] = { ...holdings[existingIdx], qty: remaining };
      }
    }

    const newOrder = {
      orderId: "ORD-" + String(Math.floor(10000 + Math.random() * 89999)),
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      symbol,
      side,
      orderType: orderType || "MARKET",
      qty: quantity,
      price: Number(execPrice.toFixed(2)),
      status: "EXECUTED",
    };

    const orders = [newOrder, ...getOrders()];
    writeJSON(KEYS.CASH, Number(cash.toFixed(2)));
    writeJSON(KEYS.HOLDINGS, holdings);
    writeJSON(KEYS.ORDERS, orders);

    return { order: newOrder, cash: Number(cash.toFixed(2)), holdings, orders };
  }

  // ---------------- Settings ----------------
  function getSettings() {
    const saved = readJSON(KEYS.SETTINGS, {});
    // Migrate older v1 settings so default currency becomes INR (₹)
    if (!saved.settingsVersion || saved.settingsVersion < 2) {
      const migrated = { ...DEFAULT_SETTINGS, ...saved, currency: "INR", settingsVersion: 2 };
      writeJSON(KEYS.SETTINGS, migrated);
      return migrated;
    }
    return { ...DEFAULT_SETTINGS, ...saved };
  }

  function saveSettings(next) {
    const merged = { ...getSettings(), ...next };
    writeJSON(KEYS.SETTINGS, merged);
    return merged;
  }

  // ---------------- Live Market Data (API Key) ----------------
  async function fetchLiveQuote(symbol) {
    const settings = getSettings();
    const apiKey = (settings.apiKey || "").trim();
    const fallbackStock =
      window.TradeLensData.STOCKS.find((s) => s.symbol === symbol) || {
        symbol,
        apiSymbol: symbol.includes(".") ? symbol : symbol + ".NS",
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

    if (!apiKey) {
      return { ...fallbackStock, isLive: false };
    }

    const querySymbol = fallbackStock.apiSymbol || (symbol.includes(".") ? symbol : `${symbol}.NS`);

    try {
      if (settings.provider === "finnhub") {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(querySymbol)}&token=${encodeURIComponent(apiKey)}`
        );
        const data = await res.json();
        if (data && typeof data.c === "number" && data.c > 0) {
          return {
            ...fallbackStock,
            price: Number(data.c.toFixed(2)),
            change: Number((data.d || 0).toFixed(2)),
            changePercent: Number((data.dp || 0).toFixed(2)),
            open: Number((data.o || fallbackStock.open).toFixed(2)),
            high: Number((data.h || fallbackStock.high).toFixed(2)),
            low: Number((data.l || fallbackStock.low).toFixed(2)),
            isLive: true,
          };
        }
      } else if (settings.provider === "alphavantage") {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(querySymbol)}&apikey=${encodeURIComponent(apiKey)}`
        );
        const json = await res.json();
        const q = json["Global Quote"];
        if (q && q["05. price"]) {
          const price = parseFloat(q["05. price"]);
          const change = parseFloat(q["09. change"] || "0");
          const changePct = parseFloat((q["10. change percent"] || "0").replace("%", ""));
          return {
            ...fallbackStock,
            price: Number(price.toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(changePct.toFixed(2)),
            open: Number(parseFloat(q["02. open"] || price).toFixed(2)),
            high: Number(parseFloat(q["03. high"] || price).toFixed(2)),
            low: Number(parseFloat(q["04. low"] || price).toFixed(2)),
            volume: window.TradeLensData.formatCompactVolume(parseInt(q["06. volume"] || "0", 10)),
            isLive: true,
          };
        }
      } else if (settings.provider === "twelvedata") {
        const tdSymbol = `${symbol}:NSE`;
        const res = await fetch(
          `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(tdSymbol)}&apikey=${encodeURIComponent(apiKey)}`
        );
        const d = await res.json();
        if (d && d.close) {
          return {
            ...fallbackStock,
            name: d.name || fallbackStock.name,
            exchange: d.exchange || fallbackStock.exchange,
            price: Number(parseFloat(d.close).toFixed(2)),
            change: Number(parseFloat(d.change || 0).toFixed(2)),
            changePercent: Number(parseFloat(d.percent_change || 0).toFixed(2)),
            open: Number(parseFloat(d.open || d.close).toFixed(2)),
            high: Number(parseFloat(d.high || d.close).toFixed(2)),
            low: Number(parseFloat(d.low || d.close).toFixed(2)),
            volume: d.volume
              ? window.TradeLensData.formatCompactVolume(parseInt(d.volume, 10))
              : fallbackStock.volume,
            isLive: true,
          };
        }
      }
    } catch (err) {
      console.warn("Live API fetch failed, using fallback data:", err);
    }

    return { ...fallbackStock, isLive: false };
  }

  return {
    getSession,
    login,
    signup,
    logout,
    updateAccount,
    getWatchlist,
    saveWatchlist,
    getHoldings,
    getOrders,
    getCashBalance,
    addFunds,
    placeOrder,
    getSettings,
    saveSettings,
    fetchLiveQuote,
  };
})();
