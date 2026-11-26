import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  History,
  Eye,
  BookOpen,
  ArrowUpRight,
  Database,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
  { name: 'Market Stocks (StockDAO)', path: '/app/stocks', icon: TrendingUp, tag: 'Arnav' },
  { name: 'My Holdings', path: '/app/portfolio', icon: PieChart, tag: 'Arnav' },
  { name: 'Order History', path: '/app/orders', icon: History, tag: 'Arnav' },
  { name: 'Watchlist (WatchlistDAO)', path: '/app/watchlist', icon: Eye, tag: 'Arnav' },
  { name: 'Java Syllabus Lab', path: '/app/lab', icon: Code2, badge: 'Demo' },
  { name: 'Java Viva Guide', path: '/app/viva', icon: BookOpen, badge: 'Syllabus' },
];

export default function Sidebar({ onOpenTradeModal }) {
  return (
    <aside className="w-64 border-r border-[#1F293D] bg-[#0B0F19] flex flex-col justify-between p-4 shrink-0 hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <button
          onClick={() => onOpenTradeModal && onOpenTradeModal()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-medium text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Quick Trade (Buy / Sell)</span>
        </button>

        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-[#161F30]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.tag && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    {item.tag}
                  </span>
                )}
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-[#161F30]/70 border border-[#1F293D] text-xs space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Arnav's Architecture</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Integrated with MySQL 8.0, PreparedStatement security, WatchlistHandler & OrdersHandler.
        </p>
        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-[#1F293D]">
          <span>Database</span>
          <span className="text-emerald-400 font-semibold">tradelens_db</span>
        </div>
      </div>
    </aside>
  );
}
