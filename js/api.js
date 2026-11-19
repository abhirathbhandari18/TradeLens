/**
 * TradeLens — Frontend API & Storage Adapter
 *
 * Currently runs purely on the frontend (no backend required):
 * - Auth, Wishlist, Settings, and Account persist in localStorage.
 * - Live Stock Data uses your API key (Finnhub / Alpha Vantage / Twelve Data)
 *   directly from the browser, or falls back to local demo data.
 *
 * To connect your Java + MySQL backend later:
 * Replace the localStorage methods below with fetch() calls to your Java REST endpoints
 * (e.g. POST /api/auth/login, GET /api/wishlist, etc.).
 */

window.TradeLensAPI = (() => {
  const KEYS = {
    USERS: "tradelens_users",
    SESSION: "tradelens_session",
    WISHLIST: "tradelens_wishlist",
    SETTINGS: "tradelens_settings",
  };

  const DEFAULT_SETTINGS = {
    provider: "finnhub", // "finnhub" | "alphavantage" | "twelvedata"
    apiKey: "",
    backendUrl: "http://localhost:8080/api",
    currency: "USD",
    defaultTimeframe: "1M",
    defaultChartType: "area", // "area" | "candle"
    priceAlerts: true,
    autoRefresh: false,
  };

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
    const sessionUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      tradingStyle: found.tradingStyle || "Swing Trader",
      joinedAt: found.joinedAt,
    };
    writeJSON(KEYS.SESSION, sessionUser);
    return sessionUser;
  }

  function signup({ name, email, password, tradingStyle }) {
    // TODO (Java + MySQL): POST `${settings.backendUrl}/auth/signup`
    const users = readJSON(KEYS.USERS, []);
    const exists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      throw new Error("An account with this email already exists.");
    }
    const newUser = {
      id: "usr_" + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      tradingStyle: tradingStyle || "Swing Trader",
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    users.push(newUser);
    writeJSON(KEYS.USERS, users);

    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      tradingStyle: newUser.tradingStyle,
      joinedAt: newUser.joinedAt,
    };
    writeJSON(KEYS.SESSION, sessionUser);

    // Seed initial wishlist for new users
    if (!localStorage.getItem(KEYS.WISHLIST)) {
      writeJSON(KEYS.WISHLIST, [
        { symbol: "AAPL", targetPrice: "240.00", note: "Watch earnings breakout" },
        { symbol: "NVDA", targetPrice: "155.00", note: "AI chip demand" },
        { symbol: "MSFT", targetPrice: "430.00", note: "Long-term core hold" },
      ]);
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

    const updatedSession = {
      ...session,
      name: updates.name !== undefined ? updates.name : session.name,
      email: updates.email !== undefined ? updates.email : session.email,
      tradingStyle:
        updates.tradingStyle !== undefined ? updates.tradingStyle : session.tradingStyle,
    };
    writeJSON(KEYS.SESSION, updatedSession);
    return updatedSession;
  }

  // ---------------- Wishlist ----------------
  function getWishlist() {
    // TODO (Java + MySQL): GET `${settings.backendUrl}/wishlist`
    return readJSON(KEYS.WISHLIST, [
      { symbol: "AAPL", targetPrice: "240.00", note: "Watch earnings breakout" },
      { symbol: "NVDA", targetPrice: "155.00", note: "AI chip demand" },
      { symbol: "MSFT", targetPrice: "430.00", note: "Long-term core hold" },
    ]);
  }

  function saveWishlist(list) {
    // TODO (Java + MySQL): POST/DELETE `${settings.backendUrl}/wishlist`
    writeJSON(KEYS.WISHLIST, list);
    return list;
  }

  // ---------------- Settings ----------------
  function getSettings() {
    return { ...DEFAULT_SETTINGS, ...readJSON(KEYS.SETTINGS, {}) };
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
        name: symbol + " Corp.",
        exchange: "NASDAQ",
        sector: "Equity",
        price: 150.0,
        change: 1.25,
        changePercent: 0.84,
        open: 148.9,
        high: 151.1,
        low: 148.2,
        volume: "12.4M",
        marketCap: "—",
        peRatio: "—",
      };

    if (!apiKey) {
      return { ...fallbackStock, isLive: false };
    }

    try {
      if (settings.provider === "finnhub") {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`
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
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`
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
        const res = await fetch(
          `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`
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
    getWishlist,
    saveWishlist,
    getSettings,
    saveSettings,
    fetchLiveQuote,
  };
})();

