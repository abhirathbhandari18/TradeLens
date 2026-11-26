import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../api/tradelensApi';

export default function BuySellModal({ isOpen, onClose, initialStock, initialAction = 'BUY', onSuccess }) {
  const [action, setAction] = useState(initialAction); // 'BUY' or 'SELL'
  const [stocks, setStocks] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [orderMode, setOrderMode] = useState('MARKET');
  const [userHoldings, setUserHoldings] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      setAction(initialAction);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, initialAction]);

  useEffect(() => {
    if (initialStock) {
      setSelectedSymbol(initialStock.symbol || initialStock);
    }
  }, [initialStock]);

  const loadInitialData = async () => {
    try {
      const [stocksData, holdingsData, accountData] = await Promise.all([
        api.getStocks(),
        api.getHoldings(),
        api.getAccount(),
      ]);
      setStocks(stocksData || []);
      setUserHoldings(holdingsData || []);
      setWalletBalance(accountData?.walletBalance || 0);

      if (!selectedSymbol && stocksData?.length > 0) {
        setSelectedSymbol(stocksData[0].symbol);
      }
    } catch (err) {
      console.error('Error loading modal data:', err);
    }
  };

  if (!isOpen) return null;

  const currentStock = stocks.find((s) => s.symbol === selectedSymbol) || {};
  const currentPrice = currentStock.currentPrice || 0;
  const estimatedTotal = Number(quantity || 0) * Number(currentPrice);

  const ownedHolding = userHoldings.find((h) => h.symbol === selectedSymbol);
  const ownedQuantity = ownedHolding ? ownedHolding.quantity : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setErrorMsg('Please enter a valid positive quantity greater than 0.');
      return;
    }

    if (action === 'SELL' && qty > ownedQuantity) {
      setErrorMsg(`Cannot sell ${qty} shares. You only own ${ownedQuantity} shares of ${selectedSymbol}.`);
      return;
    }

    if (action === 'BUY' && estimatedTotal > walletBalance) {
      setErrorMsg(`Insufficient funds! Total is ₹${estimatedTotal.toLocaleString()}, but wallet balance is ₹${Number(walletBalance).toLocaleString()}.`);
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (action === 'BUY') {
        result = await api.buyStock(selectedSymbol, qty, orderMode);
      } else {
        result = await api.sellStock(selectedSymbol, qty, orderMode);
      }

      setSuccessMsg(result.message || `Successfully executed ${action} order!`);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || `Failed to execute ${action} order.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#161F30] border border-[#1F293D] rounded-2xl p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F293D]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg text-white">Execute Trade</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              OrdersHandler
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1F293D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toggle (BUY / SELL) */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-[#111827] rounded-xl border border-[#1F293D]">
          <button
            type="button"
            onClick={() => { setAction('BUY'); setErrorMsg(''); }}
            className={`py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
              action === 'BUY'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>BUY SHARES</span>
          </button>

          <button
            type="button"
            onClick={() => { setAction('SELL'); setErrorMsg(''); }}
            className={`py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
              action === 'SELL'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>SELL SHARES</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {/* Stock Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Select Stock
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-[#1F293D] text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {stocks.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} - {s.companyName} (₹{s.currentPrice})
                </option>
              ))}
            </select>
          </div>

          {/* Current Market Price & Holdings Info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#111827]/70 border border-[#1F293D] text-xs font-mono">
            <div>
              <span className="text-slate-400 block">Current Price</span>
              <span className="text-white font-bold text-sm">₹{Number(currentPrice).toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">You Currently Own</span>
              <span className="text-emerald-400 font-bold text-sm">{ownedQuantity} shares</span>
            </div>
          </div>

          {/* Quantity & Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-[#1F293D] text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Order Type
              </label>
              <select
                value={orderMode}
                onChange={(e) => setOrderMode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-[#1F293D] text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="MARKET">MARKET</option>
                <option value="LIMIT">LIMIT</option>
              </select>
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-[#111827] border border-[#1F293D] space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Estimated Total Amount:</span>
              <span className="text-white font-mono font-bold text-sm">
                ₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Available Cash Balance:</span>
              <span className="text-emerald-400 font-mono">
                ₹{Number(walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Notifications */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
              action === 'BUY'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/25'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>Confirm {action} Order</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}


