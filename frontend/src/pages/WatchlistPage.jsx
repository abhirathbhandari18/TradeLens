import React, { useState, useEffect } from 'react';
import { Eye, Plus, Trash2, ArrowUpRight, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { api } from '../api/tradelensApi';
import StockBadge from '../components/StockBadge';

export default function WatchlistPage({ onOpenTradeModal }) {
  const [watchlist, setWatchlist] = useState([]);
  const [symbolInput, setSymbolInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const data = await api.getWatchlist();
      setWatchlist(data || []);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!symbolInput || !symbolInput.trim()) {
      setErrorMsg('Please enter a stock symbol (e.g. TCS).');
      return;
    }

    try {
      const res = await api.addToWatchlist(symbolInput.trim().toUpperCase());
      setSuccessMsg(res.message || `Added ${symbolInput.toUpperCase()} to your watchlist!`);
      setSymbolInput('');
      loadWatchlist();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add stock to watchlist.');
    }
  };

  const handleRemoveStock = async (symbol) => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.removeFromWatchlist(symbol);
      setSuccessMsg(res.message || `Removed ${symbol} from watchlist.`);
      setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
    } catch (err) {
      setErrorMsg(err.message || `Failed to remove ${symbol}.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Stock Watchlist</h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              WatchlistDAO & WatchlistHandler
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Personalized market radar with duplicate prevention and PreparedStatement security.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono self-start sm:self-auto">
          {watchlist.length} Tracked Equities
        </span>
      </div>

      {/* Quick Add Form */}
      <div className="bg-[#161F30] border border-[#1F293D] rounded-2xl p-5 glow-card">
        <form onSubmit={handleAddStock} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Enter Stock Symbol to track (e.g. BAJFINANCE, MARUTI, SUNPHARMA)..."
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#111827] border border-[#1F293D] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Watchlist</span>
          </button>
        </form>

        {/* Notifications */}
        {errorMsg && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Watchlist Table */}
      <div className="bg-[#161F30] border border-[#1F293D] rounded-2xl p-5 glow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1F293D] text-slate-400 font-semibold uppercase font-sans">
                <th className="pb-3">Symbol</th>
                <th className="pb-3">Company Name</th>
                <th className="pb-3">Sector</th>
                <th className="pb-3 text-right">Latest Price</th>
                <th className="pb-3 text-right">24h Movement</th>
                <th className="pb-3 text-right">Percentage</th>
                <th className="pb-3 text-center">Quick Trade</th>
                <th className="pb-3 text-center">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]/50">
              {watchlist.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 font-sans">
                    Your watchlist is currently empty. Add stocks above to start tracking!
                  </td>
                </tr>
              ) : (
                watchlist.map((item) => (
                  <tr key={item.symbol} className="hover:bg-[#111827]/40 transition-colors">
                    <td className="py-3 font-bold text-white text-sm">{item.symbol}</td>
                    <td className="py-3 text-slate-300 font-sans max-w-[180px] truncate">{item.companyName}</td>
                    <td className="py-3 text-slate-400 font-sans">
                      <span className="px-2 py-0.5 rounded bg-[#111827] border border-[#1F293D] text-[10px]">
                        {item.sector}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-white text-sm">
                      ₹{Number(item.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right text-slate-300">
                      {Number(item.priceChange) >= 0 ? '+' : ''}₹{Number(item.priceChange).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <StockBadge value={item.changePercentage} />
                    </td>
                    <td className="py-3 text-center font-sans">
                      <button
                        onClick={() => onOpenTradeModal && onOpenTradeModal(item.symbol, 'BUY')}
                        className="px-2.5 py-1 rounded bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/25 text-[11px] font-medium transition-all"
                      >
                        Trade
                      </button>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleRemoveStock(item.symbol)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

