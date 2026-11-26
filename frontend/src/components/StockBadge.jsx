import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StockBadge({ value, showIcon = true, size = 'sm' }) {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace('%', ''));
  const isPositive = num >= 0;

  const sizeClasses = size === 'lg' ? 'text-sm px-2.5 py-1' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded border ${sizeClasses} ${
        isPositive
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      }`}
    >
      {showIcon && (
        isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
      )}
      <span>{isPositive ? '+' : ''}{typeof value === 'number' ? num.toFixed(2) : value}%</span>
    </span>
  );
}
