import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'cyan' | 'green' | 'amber' | 'red';
  trend?: { value: number; isPositive: boolean };
}

const colorMap = {
  blue: { bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50', border: 'border-blue-300/60', icon: 'text-blue-600', glow: 'shadow-xl shadow-blue-200/50 hover:shadow-2xl hover:shadow-blue-300/60', iconBg: 'bg-blue-100' },
  cyan: { bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50', border: 'border-cyan-300/60', icon: 'text-cyan-600', glow: 'shadow-xl shadow-cyan-200/50 hover:shadow-2xl hover:shadow-cyan-300/60', iconBg: 'bg-cyan-100' },
  green: { bg: 'bg-gradient-to-br from-green-50 to-green-100/50', border: 'border-green-300/60', icon: 'text-green-600', glow: 'shadow-xl shadow-green-200/50 hover:shadow-2xl hover:shadow-green-300/60', iconBg: 'bg-green-100' },
  amber: { bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50', border: 'border-amber-300/60', icon: 'text-amber-600', glow: 'shadow-xl shadow-amber-200/50 hover:shadow-2xl hover:shadow-amber-300/60', iconBg: 'bg-amber-100' },
  red: { bg: 'bg-gradient-to-br from-red-50 to-red-100/50', border: 'border-red-300/60', icon: 'text-red-600', glow: 'shadow-xl shadow-red-200/50 hover:shadow-2xl hover:shadow-red-300/60', iconBg: 'bg-red-100' },
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, trend }) => {
  const colors = colorMap[color];

  return (
    <div className={`card p-6 ${colors.bg} border-2 ${colors.border} ${colors.glow} animate-fade-in transition-all duration-300 hover:scale-105 cursor-default`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-700 text-sm font-semibold tracking-wide uppercase">{label}</p>
          <p className="text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent mt-2 drop-shadow-sm">{value}</p>
          {trend && (
            <p className={`text-xs font-bold mt-3 px-2 py-1 rounded-full inline-block ${trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className={`w-16 h-16 ${colors.iconBg} rounded-2xl flex items-center justify-center ${colors.icon} text-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
