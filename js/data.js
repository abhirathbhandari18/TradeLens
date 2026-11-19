/**
 * TradeLens — Market Seed Data & Formatters
 * Used as immediate preview data when no live API key is configured,
 * and as fallback if an external API rate limit is reached.
 */

window.TradeLensData = (() => {
  const STOCKS = [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      exchange: "NASDAQ",
      sector: "Technology",
      price: 228.45,
      change: 3.12,
      changePercent: 1.38,
      open: 225.80,
      high: 229.40,
      low: 225.10,
      volume: "48.2M",
      marketCap: "3.48T",
      peRatio: "34.6",
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corp.",
      exchange: "NASDAQ",
      sector: "Technology",
      price: 417.90,
      change: 4.55,
      changePercent: 1.10,
      open: 414.20,
      high: 419.50,
      low: 413.10,
      volume: "21.4M",
      marketCap: "3.11T",
      peRatio: "35.2",
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corp.",
      exchange: "NASDAQ",
      sector: "Semiconductors",
      price: 141.25,
      change: -2.18,
      changePercent: -1.52,
      open: 143.90,
      high: 144.60,
      low: 140.15,
      volume: "194.6M",
      marketCap: "3.46T",
      peRatio: "54.8",
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      exchange: "NASDAQ",
      sector: "Communication",
      price: 176.80,
      change: 1.94,
      changePercent: 1.11,
      open: 175.10,
      high: 177.45,
      low: 174.60,
      volume: "19.8M",
      marketCap: "2.18T",
      peRatio: "23.4",
    },
    {
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      exchange: "NASDAQ",
      sector: "Consumer Cyclical",
      price: 205.60,
      change: 2.85,
      changePercent: 1.41,
      open: 203.10,
      high: 206.40,
      low: 202.45,
      volume: "33.7M",
      marketCap: "2.16T",
      peRatio: "44.1",
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc.",
      exchange: "NASDAQ",
      sector: "Automotive",
      price: 338.15,
      change: -6.40,
      changePercent: -1.86,
      open: 345.00,
      high: 346.90,
      low: 335.80,
      volume: "76.5M",
      marketCap: "1.08T",
      peRatio: "89.3",
    },
    {
      symbol: "META",
      name: "Meta Platforms Inc.",
      exchange: "NASDAQ",
      sector: "Communication",
      price: 584.30,
      change: 7.20,
      changePercent: 1.25,
      open: 578.00,
      high: 586.50,
      low: 576.40,
      volume: "12.9M",
      marketCap: "1.47T",
      peRatio: "27.8",
    },
    {
      symbol: "JPM",
      name: "JPMorgan Chase & Co.",
      exchange: "NYSE",
      sector: "Financials",
      price: 242.10,
      change: 1.05,
      changePercent: 0.44,
      open: 241.00,
      high: 243.20,
      low: 240.30,
      volume: "8.4M",
      marketCap: "684B",
      peRatio: "13.1",
    },
  ];

  // Deterministic pseudo-random generator so each symbol + timeframe renders consistently
  function seededRandom(seedStr) {
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return function () {
      h += 0x6d2b79f5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function generateSeries(symbol, basePrice, timeframe) {
    const config = {
      "1D": { points: 32, volatility: 0.004, labelStep: "intraday" },
      "1W": { points: 35, volatility: 0.009, labelStep: "day" },
      "1M": { points: 30, volatility: 0.015, labelStep: "day" },
      "3M": { points: 45, volatility: 0.022, labelStep: "day" },
      "1Y": { points: 52, volatility: 0.032, labelStep: "week" },
    }[timeframe] || { points: 30, volatility: 0.015, labelStep: "day" };

    const rand = seededRandom(symbol + "_" + timeframe);
    const points = [];
    let current = basePrice * (0.94 + rand() * 0.08);
    const now = new Date();

    for (let i = config.points - 1; i >= 0; i--) {
      const drift = (basePrice - current) / (i + 3);
      const shock = (rand() - 0.49) * basePrice * config.volatility;
      const open = current;
      const close = Math.max(1, open + drift + shock);
      const spread = Math.abs(close - open) + basePrice * config.volatility * 0.45 * rand();
      const high = Math.max(open, close) + spread * rand();
      const low = Math.max(0.5, Math.min(open, close) - spread * rand());
      const volume = Math.round((8 + rand() * 42) * 1000000);

      let label = "";
      if (config.labelStep === "intraday") {
        const minutesFromOpen = (config.points - 1 - i) * 12;
        const hr = 9 + Math.floor((30 + minutesFromOpen) / 60);
        const min = (30 + minutesFromOpen) % 60;
        label = `${String(hr).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      } else {
        const d = new Date(now);
        const daysBack = config.labelStep === "week" ? i * 7 : i;
        d.setDate(d.getDate() - daysBack);
        label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }

      points.push({
        label,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
      });

      current = close;
    }

    // Anchor final close to the stock's current price
    const last = points[points.length - 1];
    last.close = Number(basePrice.toFixed(2));
    last.high = Math.max(last.high, last.close);
    last.low = Math.min(last.low, last.close);

    return points;
  }

  function formatCurrency(value, currency = "USD") {
    const rate = currency === "INR" ? 84.2 : 1;
    const symbol = currency === "INR" ? "₹" : "$";
    return `${symbol}${(Number(value) * rate).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatCompactVolume(num) {
    if (typeof num === "string") return num;
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return String(num);
  }

  return {
    STOCKS,
    generateSeries,
    formatCurrency,
    formatCompactVolume,
  };
})();

