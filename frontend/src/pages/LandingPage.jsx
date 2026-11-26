import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, TrendingUp, Database, ArrowRight, CheckCircle2, PieChart, Layers } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F9FAFB] flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <header className="h-20 border-b border-[#1F293D]/60 max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-[1.5px] shadow-lg shadow-blue-500/25">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">TradeLens</span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MySQL & JDBC
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">See Your Investments Clearly.</p>
          </div>
        </div>

        <Link
          to="/app"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all"
        >
          <span>Open Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex flex-col items-center text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161F30] border border-[#1F293D] text-xs font-medium text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>College Evaluation Edition • Core Java Backend & MySQL 8.0</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
          Intelligent Stock Portfolio Tracking & Analytics.
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Manage equities, monitor real-time NSE market movements, track weighted-average cost basis, and maintain personalized watchlists from a unified fintech dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <Link
            to="/app"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Launch Demo Portfolio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/app/viva"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#161F30] hover:bg-[#1C273C] border border-[#1F293D] text-slate-300 hover:text-white font-semibold text-sm transition-all"
          >
            Inspect Arnav's Viva Guide
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left w-full">
          <div className="bg-[#161F30]/80 border border-[#1F293D] rounded-2xl p-6 glow-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">StockDAO & MySQL Persistence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Arnav's StockDAO maps 20 prominent NSE stock rows into immutable Stock models via secure PreparedStatement queries.
            </p>
          </div>

          <div className="bg-[#161F30]/80 border border-[#1F293D] rounded-2xl p-6 glow-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">WatchlistDAO with Duplicate Shield</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              WatchlistDAO enforces strict validation, prevents duplicate tracking, and resolves ownership using authenticated session tokens.
            </p>
          </div>

          <div className="bg-[#161F30]/80 border border-[#1F293D] rounded-2xl p-6 glow-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">OrdersHandler & Holdings Valuation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates real-time unrealized capital gains and weighted-average cost basis per share across all active holdings.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1F293D]/60 py-6 text-center text-xs text-slate-500 font-mono">
        TradeLens &copy; 2026 • BE CSE College Project • Developed by Arnav (Member 4)
      </footer>
    </div>
  );
}
