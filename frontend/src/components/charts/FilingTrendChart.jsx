import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-cp-border rounded-lg shadow-dropdown px-3 py-2">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{payload[0].value} cases filed</p>
    </div>
  );
};

export default function FilingTrendChart({ data = [] }) {
  const avg = data.length ? Math.round(data.reduce((a, b) => a + b.count, 0) / data.length) : 0;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="filingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#6B7280' }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6B7280' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={avg}
          stroke="#0D9488"
          strokeDasharray="5 5"
          label={{ value: `Avg: ${avg}`, position: 'right', fontSize: 10, fill: '#0D9488' }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#4F46E5"
          strokeWidth={2}
          fill="url(#filingGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
