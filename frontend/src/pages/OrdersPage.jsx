import React, { useState, useEffect } from 'react';
import { History, Search, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { api } from '../api/tradelensApi';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesType = filterType === 'ALL' || o.type === filterType;
    const matchesSearch = !searchTerm || o.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Order Execution History</h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              OrdersHandler: GET /api/orders
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audit ledger of all market orders placed by your account, sorted newest first.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono self-start sm:self-auto">
          {filteredOrders.length} Executed Trades
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Symbol (e.g. TCS) or Order ID (e.g. ORD-1001)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#161F30] border border-[#1F293D] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'BUY', 'SELL'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterType === type
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-[#161F30] border border-[#1F293D] text-slate-400 hover:text-white'
              }`}
            >
              {type} ORDERS
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#161F30] border border-[#1F293D] rounded-2xl p-5 glow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1F293D] text-slate-400 font-semibold uppercase font-sans">
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Mode</th>
                <th className="pb-3">Stock Symbol</th>
                <th className="pb-3 text-right">Shares</th>
                <th className="pb-3 text-right">Execution Price</th>
                <th className="pb-3 text-right">Gross Amount</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Execution Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]/50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-sans">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-[#111827]/40 transition-colors">
                    <td className="py-3 text-blue-400 font-bold">{o.orderId}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                        o.type === 'BUY'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {o.type === 'BUY' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {o.type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 font-sans">{o.orderMode}</td>
                    <td className="py-3 font-bold text-white text-sm">{o.symbol}</td>
                    <td className="py-3 text-right text-slate-300">{o.quantity}</td>
                    <td className="py-3 text-right text-slate-300">₹{Number(o.price).toLocaleString()}</td>
                    <td className="py-3 text-right font-bold text-white">₹{Number(o.totalValue).toLocaleString()}</td>
                    <td className="py-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400 text-[11px] font-sans">{o.timestamp}</td>
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

