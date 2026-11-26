import React, { useState, useEffect } from 'react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, Layers, PieChart } from 'lucide-react';
import { api } from '../api/tradelensApi';
import MetricCard from '../components/MetricCard';
import StockBadge from '../components/StockBadge';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#E11D48'];

export default function DashboardPage({ onOpenTradeModal }) {
  const [account, setAccount] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [acc, hold, ord] = await Promise.all([
        api.getAccount(),
        api.getHoldings(),
        api.getOrders(),
      ]);
      setAccount(acc);
      setHoldings(hold || []);
      setOrders(ord || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentPortfolioValue = Number(account?.currentPortfolioValue || 0);
  const totalInvested = Number(account?.totalInvested || 0);
  const netProfitLoss = Number(account?.netProfitLoss || 0);
  const returnPercentage = Number(account?.returnPercentage || 0);
  const walletBalance = Number(account?.walletBalance || 0);

  // Prepare chart data
  const chartData = holdings.map((h) => ({
    name: h.symbol,
    value: Number(h.currentValue || 0),
  }));

  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Investment Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time portfolio analytics powered by MySQL 8.0 & Java REST API.
          </p>
        </div>
        <button
          onClick={() => onOpenTradeModal && onOpenTradeModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>New Buy / Sell Order</span>
        </button>
      </div>

      {/* Top 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Portfolio Value"
          value={`₹${currentPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change={returnPercentage}
          subtitle="Net return on holdings"
          icon={TrendingUp}
        />
        <MetricCard
          title="Available Cash"
          value={`₹${walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Unallocated liquidity"
          icon={Wallet}
        />
        <MetricCard
          title="Total Capital Invested"
          value={`₹${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`${holdings.length} active stock positions`}
          icon={Layers}
        />
        <MetricCard
          title="Net Profit / Loss"
          value={`₹${netProfitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          isPositive={netProfitLoss >= 0}
          subtitle={netProfitLoss >= 0 ? 'Overall capital gain' : 'Unrealized loss'}
          icon={PieChart}
        />
      </div>

      {/* Middle Row: Allocation Pie Chart & Quick Holdings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Allocation Chart */}
        <div className="bg-[#161F30] border border-[#1F293D] rounded-2xl p-5 glow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Asset Allocation</h3>
            <span className="text-[10px] text-slate-400 font-mono">By Current Value</span>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1F293D', borderRadius: '12px' }}
                    itemStyle={{ color: '#F9FAFB', fontFamily: 'monospace' }}
                    formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs mt-2">
                {chartData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-300 font-mono">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <PieChart className="w-8 h-8 mb-2 opacity-30" />
              <span>No active holdings to display</span>
            </div>
          )}
        </div>

        {/* Quick Holdings Preview Table */}
        <div className="lg:col-span-2 bg-[#161F30] border border-[#1F293D] rounded-2xl p-5 glow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Portfolio Holdings</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  OrdersHandler.java
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{holdings.length} Equities</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1F293D] text-slate-400 font-semibold uppercase">
                    <th className="pb-3">Stock</th>
                    <th className="pb-3 text-right">Shares</th>
                    <th className="pb-3 text-right">Avg Cost</th>
                    <th className="pb-3 text-right">Market Price</th>
                    <th className="pb-3 text-right">Current Value</th>
                    <th className="pb-3 text-right">P/L (%)</th>
                    <th className="pb-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F293D]/50 font-mono">
                  {holdings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        You have not bought any shares yet. Click 'Quick Trade' to start!
                      </td>
                    </tr>
                  ) : (
                    holdings.map((h) => {
                      const isGain = Number(h.unrealizedProfitLoss || 0) >= 0;
                      return (
                        <tr key={h.symbol} className="hover:bg-[#111827]/40 transition-colors">
                          <td className="py-3 font-bold text-white">
                            <div>{h.symbol}</div>
                            <div className="text-[10px] text-slate-400 font-sans font-normal truncate max-w-[120px]">{h.companyName}</div>
                          </td>
                          <td className="py-3 text-right text-slate-300">{h.quantity}</td>
                          <td className="py-3 text-right text-slate-400">₹{Number(h.avgBuyPrice).toLocaleString()}</td>
                          <td className="py-3 text-right text-white">₹{Number(h.currentPrice).toLocaleString()}</td>
                          <td className="py-3 text-right font-bold text-white">₹{Number(h.currentValue).toLocaleString()}</td>
                          <td className="py-3 text-right">
                            <StockBadge value={h.returnPercentage} />
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => onOpenTradeModal && onOpenTradeModal(h.symbol, 'SELL')}
                              className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-sans font-medium transition-colors"
                            >
                              Sell
                            </button>
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
      </div>

      {/* Bottom Section: Recent Orders Audit Table */}
      <div className="bg-[#161F30] border border-[#1F293D] rounded-2xl p-5 glow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Executed Orders</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              GET /api/orders
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Sorted Newest First</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1F293D] text-slate-400 font-semibold uppercase font-sans">
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Symbol</th>
                <th className="pb-3 text-right">Quantity</th>
                <th className="pb-3 text-right">Execution Price</th>
                <th className="pb-3 text-right">Gross Total</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]/50">
              {orders.slice(0, 5).map((o) => (
                <tr key={o.orderId} className="hover:bg-[#111827]/40 transition-colors">
                  <td className="py-3 text-blue-400">{o.orderId}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      o.type === 'BUY'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {o.type}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-white">{o.symbol}</td>
                  <td className="py-3 text-right text-slate-300">{o.quantity}</td>
                  <td className="py-3 text-right text-slate-300">₹{Number(o.price).toLocaleString()}</td>
                  <td className="py-3 text-right font-bold text-white">₹{Number(o.totalValue).toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-400 text-[11px] font-sans">{o.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


