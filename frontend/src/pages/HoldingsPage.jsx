import React, { useState, useEffect } from 'react';
import { PieChart, ArrowUpRight, TrendingUp, DollarSign, Layers } from 'lucide-react';
import { api } from '../api/tradelensApi';
import StockBadge from '../components/StockBadge';
import MetricCard from '../components/MetricCard';

export default function HoldingsPage({ onOpenTradeModal }) {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHoldings();
  }, []);

  const loadHoldings = async () => {
    try {
      setLoading(true);
      const data = await api.getHoldings();
      setHoldings(data || []);
    } catch (err) {
      console.error('Failed to load holdings:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalInvested = holdings.reduce((sum, h) => sum + Number(h.totalInvested || 0), 0);
  const currentTotalVal = holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0);
  const totalPL = currentTotalVal - totalInvested;
  const overallReturn = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Portfolio Holdings</h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              OrdersHandler: GET /api/holdings
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Weighted-average cost basis and unrealized gain/loss tracking per stock holding.
          </p>
        </div>
        <button
          onClick={() => onOpenTradeModal && onOpenTradeModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Buy More Shares</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Current Holdings Value"
          value={`₹${currentTotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change={overallReturn}
          subtitle="Real-time market valuation"
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Capital Cost Basis"
          value={`₹${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`Across ${holdings.length} equities`}
          icon={Layers}
        />
        <MetricCard
          title="Unrealized Gain / Loss"
          value={`₹${totalPL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          isPositive={totalPL >= 0}
          subtitle={totalPL >= 0 ? 'Paper profits' : 'Paper losses'}
          icon={DollarSign}
        />
      </div>

      {/* Holdings Detailed Table */}
      <div className="bg-[#161F30] border border-[#1F293D] rounded-2xl p-5 glow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1F293D] text-slate-400 font-semibold uppercase">
                <th className="pb-3">Stock Symbol</th>
                <th className="pb-3">Company</th>
                <th className="pb-3 text-right">Shares Held</th>
                <th className="pb-3 text-right">Avg Purchase Price</th>
                <th className="pb-3 text-right">Market Price</th>
                <th className="pb-3 text-right">Total Invested</th>
                <th className="pb-3 text-right">Current Value</th>
                <th className="pb-3 text-right">Unrealized P/L</th>
                <th className="pb-3 text-right">Return %</th>
                <th className="pb-3 text-center">Trade Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]/50 font-mono">
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">
                    No active holdings found for this account.
                  </td>
                </tr>
              ) : (
                holdings.map((h) => {
                  const pl = Number(h.unrealizedProfitLoss || 0);
                  const isGain = pl >= 0;
                  return (
                    <tr key={h.symbol} className="hover:bg-[#111827]/40 transition-colors">
                      <td className="py-3 font-bold text-white text-sm">{h.symbol}</td>
                      <td className="py-3 text-slate-300 font-sans max-w-[160px] truncate">{h.companyName}</td>
                      <td className="py-3 text-right text-slate-300">{h.quantity}</td>
                      <td className="py-3 text-right text-slate-400">₹{Number(h.avgBuyPrice).toLocaleString()}</td>
                      <td className="py-3 text-right text-white">₹{Number(h.currentPrice).toLocaleString()}</td>
                      <td className="py-3 text-right text-slate-400">₹{Number(h.totalInvested).toLocaleString()}</td>
                      <td className="py-3 text-right font-bold text-white">₹{Number(h.currentValue).toLocaleString()}</td>
                      <td className={`py-3 text-right font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain ? '+' : ''}₹{pl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right">
                        <StockBadge value={h.returnPercentage} />
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => onOpenTradeModal && onOpenTradeModal(h.symbol, 'BUY')}
                            className="px-2 py-1 rounded bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/25 text-[10px] font-semibold transition-all"
                          >
                            Buy More
                          </button>
                          <button
                            onClick={() => onOpenTradeModal && onOpenTradeModal(h.symbol, 'SELL')}
                            className="px-2 py-1 rounded bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/25 text-[10px] font-semibold transition-all"
                          >
                            Sell
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


