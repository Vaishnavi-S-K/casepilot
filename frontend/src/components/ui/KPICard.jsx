import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function KPICard({ title, value, icon: Icon, topColor, trend, trendLabel, subtitle }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayVal(value);
      return;
    }
    const duration = 600;
    const start = Date.now();
    const end = start + duration;
    const step = () => {
      const now = Date.now();
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayVal(Math.round(eased * value));
      if (now < end) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  const borderColorMap = {
    indigo: 'border-t-indigo-600',
    teal: 'border-t-teal-600',
    warning: 'border-t-amber-500',
    success: 'border-t-emerald-600',
    violet: 'border-t-violet-600',
    danger: 'border-t-rose-600',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`card card-hover p-4 border-t-4 ${borderColorMap[topColor] || 'border-t-indigo-600'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-gray-50">
          {Icon && <Icon size={20} className="text-gray-500" />}
        </div>
        {trend != null && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-badge ${
              trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-heading font-bold text-gray-900">{displayVal}</p>
      <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </motion.div>
  );
}
