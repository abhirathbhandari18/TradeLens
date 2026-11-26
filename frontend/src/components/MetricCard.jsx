import React from 'react';

export default function MetricCard({ title, value, change, isPositive, subtitle, icon: Icon, badgeText }) {
  const isNeutral = change === undefined || change === null;
  const isUp = isPositive ?? (typeof change === 'number' ? change >= 0 : !String(change).startsWith('-'));

  return (
    <div className="bg-[#161F30] border border-[#1F293D] rounded-xl p-5 hover:border-[#2E3D59] transition-all duration-200 glow-card relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[#111827] border border-[#1F293D] flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
          {value}
        </h3>
        {badgeText && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {badgeText}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {!isNeutral && (
          <span className={`font-mono font-medium flex items-center px-1.5 py-0.5 rounded ${
            isUp 
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
              : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
          }`}>
            {isUp ? '▲ +' : '▼ '}{change}
          </span>
        )}
        {subtitle && (
          <span className="text-slate-400 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
