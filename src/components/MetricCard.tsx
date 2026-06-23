import React from 'react';
import { motion } from 'motion/react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  color?: string;
}

export default function MetricCard({ title, value, subtext, icon, color = 'blue' }: MetricCardProps) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl p-5 border border-slate-100 shadow-xs flex items-center justify-between`}
    >
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className="text-2xl font-bold font-sans text-slate-800">{value}</div>
        <p className="text-xs text-slate-400 font-medium">{subtext}</p>
      </div>
      <div className={`p-3 rounded-xl ${scheme.bg} ${scheme.text} border ${scheme.border} flex items-center justify-center`}>
        {icon}
      </div>
    </motion.div>
  );
}
