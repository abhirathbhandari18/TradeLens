import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, ArrowUpRight, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { api } from '../api/tradelensApi';
import StockBadge from '../components/StockBadge';

export default function StocksPage({ onOpenTradeModal }) {
  const [stocks, setStocks] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [sector, setSector] = useState('ALL');
  const [watchlistSymbols, setWatchlistSymbols] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    loadStocks();
    loadWatchlist();
  }, []);

  const loadStocks = async () => {
    try {
      setLoading(true);
      const data = await api.getStocks(keyword, sector);
      setStocks(data || []);
    } catch (err) {
      console.error('Failed to load stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWatchlist = async () => {
    try {
      const data = await api.getWatchlist();
      const set = new Set((data || []).map((item) => item.symbol));
      setWatchlistSymbols(set);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadStocks();
  };

  const handleAddToWatchlist = async (symbol) => {
    try {
      const res = await api.addToWatchlist(symbol);
      setWatchlistSymbols((prev) => new Set([...prev, symbol]));
      showToast(`Added ${symbol} to watchlist! (WatchlistDAO)`);
    } catch (err) {
      showToast(err.message || `Failed to add ${symbol}`, true);
    }
  };

  const showToast = (msg, isError = false) => {
    setToastMsg({ text: msg, isError });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const sectors = ['ALL', 'Energy', 'Technology', 'Banking & Finance', 'Automobile', 'Telecommunications', 'Consumer Goods', 'Healthcare'];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold animate-slide-up ${
          toastMsg.isError ? 'bg-rose-950/90 border-rose-500 text-rose-300' : 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
        }`}>
          {toastMsg.isError ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">NSE Market Equities</h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              StockDAO.java
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse and monitor real-time prices for top 20 National Stock Exchange equities.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono self-start sm:self-auto">
          {stocks.length} Listed Equities
        </span>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Symbol (e.g. INFY) or Company (e.g. Reliance)..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#161F30] border border-[#1F293D] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => { setSector(s); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                sector === s
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-[#161F30] border border-[#1F293D] text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-[#161F30] border border-[#1F293D] rounded-2xl p-5 glow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1F293D] text-slate-400 font-semibold uppercase">
                <th className="pb-3">Symbol</th>
                <th className="pb-3">Company Name</th>
                <th className="pb-3">Sector</th>
                <th className="pb-3 text-right">Current Price</th>
                <th className="pb-3 text-right">Day High</th>
                <th className="pb-3 text-right">Day Low</th>
                <th className="pb-3 text-right">24h Change</th>
                <th className="pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]/50 font-mono">
              {stocks.map((s) => {
                const inWatchlist = watchlistSymbols.has(s.symbol);
                return (
                  <tr key={s.symbol} className="hover:bg-[#111827]/40 transition-colors">
                    <td className="py-3 font-bold text-white text-sm">{s.symbol}</td>
                    <td className="py-3 text-slate-300 font-sans max-w-[200px] truncate">{s.companyName}</td>
                    <td className="py-3 text-slate-400 font-sans">
                      <span className="px-2 py-0.5 rounded bg-[#111827] border border-[#1F293D] text-[10px]">
                        {s.sector}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-white text-sm">
                      ₹{Number(s.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right text-slate-400">₹{Number(s.dayHigh).toLocaleString()}</td>
                    <td className="py-3 text-right text-slate-400">₹{Number(s.dayLow).toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <StockBadge value={s.changePercentage} />
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2 font-sans">
                        <button
                          onClick={() => onOpenTradeModal && onOpenTradeModal(s.symbol, 'BUY')}
                          className="px-2.5 py-1 rounded bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-[11px] font-medium transition-all"
                        >
                          Trade
                        </button>
                        <button
                          onClick={() => handleAddToWatchlist(s.symbol)}
                          disabled={inWatchlist}
                          className={`p-1 rounded text-xs transition-colors ${
                            inWatchlist
                              ? 'text-emerald-400 bg-emerald-500/10 cursor-default'
                              : 'text-slate-400 hover:text-white hover:bg-[#1F293D]'
                          }`}
                          title={inWatchlist ? 'Already in Watchlist' : 'Add to Watchlist'}
                        >
                          {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

