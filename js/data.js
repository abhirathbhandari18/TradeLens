/**
 * TradeLens — Indian Equity Market Seed Data & Formatters (NSE / BSE)
 * Used as immediate preview data when no live API key is configured,
 * and as fallback if an external API rate limit is reached.
 */

window.TradeLensData = (() => {
  const STOCKS = [
    {
      symbol: "RELIANCE",
      apiSymbol: "RELIANCE.NS",
      name: "Reliance Industries Ltd.",
      exchange: "NSE",
      sector: "Energy & Telecom",
      price: 1284.50,
      change: 18.40,
      changePercent: 1.45,
      open: 1269.00,
      high: 1291.20,
      low: 1265.40,
      volume: "8.42M",
      marketCap: "₹17.38L Cr",
      peRatio: "25.4",
    },
    {
      symbol: "TCS",
      apiSymbol: "TCS.NS",
      name: "Tata Consultancy Services Ltd.",
      exchange: "NSE",
      sector: "IT Services",
      price: 4142.80,
      change: 36.25,
      changePercent: 0.88,
      open: 4110.00,
      high: 4158.90,
      low: 4102.15,
      volume: "2.18M",
      marketCap: "₹14.98L Cr",
      peRatio: "31.2",
    },
    {
      symbol: "HDFCBANK",
      apiSymbol: "HDFCBANK.NS",
      name: "HDFC Bank Ltd.",
      exchange: "NSE",
      sector: "Banking",
      price: 1742.30,
      change: -11.60,
      changePercent: -0.66,
      open: 1755.00,
      high: 1760.40,
      low: 1736.80,
      volume: "11.65M",
      marketCap: "₹13.28L Cr",
      peRatio: "19.8",
    },
    {
      symbol: "INFY",
      apiSymbol: "INFY.NS",
      name: "Infosys Ltd.",
      exchange: "NSE",
      sector: "IT Services",
      price: 1865.75,
      change: 24.10,
      changePercent: 1.31,
      open: 1844.00,
      high: 1872.00,
      low: 1839.50,
      volume: "5.94M",
      marketCap: "₹7.74L Cr",
      peRatio: "28.1",
    },
    {
      symbol: "ICICIBANK",
      apiSymbol: "ICICIBANK.NS",
      name: "ICICI Bank Ltd.",
      exchange: "NSE",
      sector: "Banking",
      price: 1298.40,
      change: 14.85,
      changePercent: 1.16,
      open: 1285.00,
      high: 1304.00,
      low: 1281.20,
      volume: "9.31M",
      marketCap: "₹9.15L Cr",
      peRatio: "18.9",
    },
    {
      symbol: "SBIN",
      apiSymbol: "SBIN.NS",
      name: "State Bank of India",
      exchange: "NSE",
      sector: "Banking",
      price: 814.60,
      change: -6.30,
      changePercent: -0.77,
      open: 821.50,
      high: 824.00,
      low: 810.40,
      volume: "14.20M",
      marketCap: "₹7.27L Cr",
      peRatio: "10.6",
    },
    {
      symbol: "BHARTIARTL",
      apiSymbol: "BHARTIARTL.NS",
      name: "Bharti Airtel Ltd.",
      exchange: "NSE",
      sector: "Telecom",
      price: 1592.15,
      change: 22.90,
      changePercent: 1.46,
      open: 1571.00,
      high: 1598.50,
      low: 1568.00,
      volume: "4.75M",
      marketCap: "₹9.06L Cr",
      peRatio: "52.4",
    },
    {
      symbol: "ITC",
      apiSymbol: "ITC.NS",
      name: "ITC Ltd.",
      exchange: "NSE",
      sector: "FMCG",
      price: 478.25,
      change: 3.15,
      changePercent: 0.66,
      open: 475.50,
      high: 480.10,
      low: 474.20,
      volume: "12.80M",
      marketCap: "₹5.98L Cr",
      peRatio: "28.7",
    },
    {
      symbol: "TATAMOTORS",
      apiSymbol: "TATAMOTORS.NS",
      name: "Tata Motors Ltd.",
      exchange: "NSE",
      sector: "Automotive",
      price: 786.90,
      change: -14.20,
      changePercent: -1.77,
      open: 801.00,
      high: 804.50,
      low: 783.10,
      volume: "16.40M",
      marketCap: "₹2.89L Cr",
      peRatio: "9.4",
    },
    {
      symbol: "LT",
      apiSymbol: "LT.NS",
      name: "Larsen & Toubro Ltd.",
      exchange: "NSE",
      sector: "Infrastructure",
      price: 3588.40,
      change: 41.20,
      changePercent: 1.16,
      open: 3550.00,
      high: 3599.00,
      low: 3542.50,
      volume: "1.95M",
      marketCap: "₹4.93L Cr",
      peRatio: "36.2",
    },
    {
      symbol: "AXISBANK",
      apiSymbol: "AXISBANK.NS",
      name: "Axis Bank Ltd.",
      exchange: "NSE",
      sector: "Banking",
      price: 1154.20,
      change: 9.80,
      changePercent: 0.86,
      open: 1146.00,
      high: 1161.40,
      low: 1141.50,
      volume: "7.85M",
      marketCap: "₹3.57L Cr",
      peRatio: "13.4",
    },
    {
      symbol: "KOTAKBANK",
      apiSymbol: "KOTAKBANK.NS",
      name: "Kotak Mahindra Bank Ltd.",
      exchange: "NSE",
      sector: "Banking",
      price: 1768.90,
      change: -8.45,
      changePercent: -0.48,
      open: 1778.00,
      high: 1784.00,
      low: 1762.10,
      volume: "4.12M",
      marketCap: "₹3.51L Cr",
      peRatio: "18.2",
    },
    {
      symbol: "WIPRO",
      apiSymbol: "WIPRO.NS",
      name: "Wipro Ltd.",
      exchange: "NSE",
      sector: "IT Services",
      price: 564.35,
      change: 7.90,
      changePercent: 1.42,
      open: 557.20,
      high: 567.80,
      low: 555.90,
      volume: "6.40M",
      marketCap: "₹2.95L Cr",
      peRatio: "24.8",
    },
    {
      symbol: "HINDUNILVR",
      apiSymbol: "HINDUNILVR.NS",
      name: "Hindustan Unilever Ltd.",
      exchange: "NSE",
      sector: "FMCG",
      price: 2418.60,
      change: -15.30,
      changePercent: -0.63,
      open: 2435.00,
      high: 2441.00,
      low: 2411.25,
      volume: "1.64M",
      marketCap: "₹5.68L Cr",
      peRatio: "55.1",
    },
    {
      symbol: "SUNPHARMA",
      apiSymbol: "SUNPHARMA.NS",
      name: "Sun Pharmaceutical Ind.",
      exchange: "NSE",
      sector: "Pharma",
      price: 1812.45,
      change: 26.70,
      changePercent: 1.50,
      open: 1789.00,
      high: 1819.90,
      low: 1785.40,
      volume: "2.31M",
      marketCap: "₹4.35L Cr",
      peRatio: "39.4",
    },
    {
      symbol: "MARUTI",
      apiSymbol: "MARUTI.NS",
      name: "Maruti Suzuki India Ltd.",
      exchange: "NSE",
      sector: "Automotive",
      price: 11240.00,
      change: 132.50,
      changePercent: 1.19,
      open: 11125.00,
      high: 11295.00,
      low: 11090.00,
      volume: "4.82L",
      marketCap: "₹3.53L Cr",
      peRatio: "25.9",
    },
    {
      symbol: "BAJFINANCE",
      apiSymbol: "BAJFINANCE.NS",
      name: "Bajaj Finance Ltd.",
      exchange: "NSE",
      sector: "Financials",
      price: 6785.50,
      change: -54.20,
      changePercent: -0.79,
      open: 6842.00,
      high: 6860.00,
      low: 6755.00,
      volume: "1.12M",
      marketCap: "₹4.20L Cr",
      peRatio: "27.6",
    },
    {
      symbol: "TATASTEEL",
      apiSymbol: "TATASTEEL.NS",
      name: "Tata Steel Ltd.",
      exchange: "NSE",
      sector: "Metals",
      price: 144.85,
      change: 2.35,
      changePercent: 1.65,
      open: 142.80,
      high: 145.60,
      low: 142.10,
      volume: "28.40M",
      marketCap: "₹1.81L Cr",
      peRatio: "38.2",
    },
    {
      symbol: "ASIANPAINT",
      apiSymbol: "ASIANPAINT.NS",
      name: "Asian Paints Ltd.",
      exchange: "NSE",
      sector: "Consumer",
      price: 2496.15,
      change: -21.85,
      changePercent: -0.87,
      open: 2518.00,
      high: 2524.50,
      low: 2489.00,
      volume: "1.38M",
      marketCap: "₹2.39L Cr",
      peRatio: "49.5",
    },
    {
      symbol: "ADANIENT",
      apiSymbol: "ADANIENT.NS",
      name: "Adani Enterprises Ltd.",
      exchange: "NSE",
      sector: "Conglomerate",
      price: 2842.70,
      change: 48.90,
      changePercent: 1.75,
      open: 2801.00,
      high: 2864.00,
      low: 2792.50,
      volume: "3.15M",
      marketCap: "₹3.28L Cr",
      peRatio: "64.2",
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
      "6M": { points: 48, volatility: 0.027, labelStep: "week" },
      "1Y": { points: 52, volatility: 0.032, labelStep: "week" },
      "5Y": { points: 60, volatility: 0.048, labelStep: "month" },
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
      const volume = Math.round((0.8 + rand() * 8.5) * 1000000);

      let label = "";
      if (config.labelStep === "intraday") {
        // NSE market hours: 09:15 to 15:30 IST
        const minutesFromOpen = (config.points - 1 - i) * 12;
        const hr = 9 + Math.floor((15 + minutesFromOpen) / 60);
        const min = (15 + minutesFromOpen) % 60;
        label = `${String(hr).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      } else if (config.labelStep === "month") {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      } else {
        const d = new Date(now);
        const daysBack = config.labelStep === "week" ? i * 7 : i;
        d.setDate(d.getDate() - daysBack);
        label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
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

    const last = points[points.length - 1];
    last.close = Number(basePrice.toFixed(2));
    last.high = Math.max(last.high, last.close);
    last.low = Math.min(last.low, last.close);

    return points;
  }

  function formatCurrency(value, currency = "INR") {
    const num = Number(value) || 0;
    if (currency === "USD") {
      const usdVal = num / 84.2;
      return `$${usdVal.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `₹${num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatCompactVolume(num) {
    if (typeof num === "string") return num;
    if (num >= 1e7) return (num / 1e7).toFixed(2) + " Cr";
    if (num >= 1e5) return (num / 1e5).toFixed(2) + " L";
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
