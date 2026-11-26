import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, RefreshCw, BookOpen, Wallet, CheckCircle } from 'lucide-react';
import { api } from '../api/tradelensApi';

export default function Navbar({ onRefresh, walletBalance, userName }) {
  const [serverHealth, setServerHealth] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const data = await api.getHealth();
      setServerHealth(data);
    } catch (err) {
      setServerHealth({ status: 'DOWN', database: 'DISCONNECTED' });
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await checkHealth();
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="h-16 border-b border-[#1F293D] bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-[1.5px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                TradeLens
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MySQL 8.0 & JDBC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              See Your Investments Clearly.
            </p>
          </div>
        </Link>

        {/* Backend Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#161F30] border border-[#1F293D] text-xs">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              serverHealth?.status === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              serverHealth?.status === 'UP' ? 'bg-emerald-500' : 'bg-rose-500'
            }`} />
          </span>
          <span className="text-slate-300 font-mono">
            {serverHealth?.status === 'UP' ? 'MySQL & Java REST: Connected' : 'Server Disconnected'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {walletBalance !== undefined && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111827] border border-[#1F293D] text-xs">
            <Wallet className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Cash:</span>
            <span className="font-mono font-bold text-emerald-400">
              ₹{Number(walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <button
          onClick={handleManualRefresh}
          title="Refresh Data from Java Server"
          className="p-2 rounded-lg bg-[#161F30] border border-[#1F293D] text-slate-300 hover:text-white hover:border-[#2E3D59] transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>

        <Link
          to="/app/viva"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Arnav's Viva Guide</span>
        </Link>

        <div className="flex items-center gap-2 pl-2 border-l border-[#1F293D]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-[#1F293D]">
            AM
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-white leading-tight">{userName || 'Arnav M.'}</div>
            <div className="text-[10px] text-emerald-400 font-mono leading-tight">Member 4 • Active</div>
          </div>
        </div>
      </div>
    </header>
  );
}
