import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  Active: '#059669',
  Pending: '#D97706',
  'On Hold': '#0284C7',
  Closed: '#6B7280',
  Appeal: '#7C3AED',
};

const DEFAULT_COLORS = ['#4F46E5', '#0D9488', '#7C3AED', '#D97706', '#059669', '#DC2626', '#0284C7'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-cp-border rounded-lg shadow-dropdown px-3 py-2">
      <p className="text-sm font-semibold text-gray-900">{payload[0].name}</p>
      <p className="text-xs text-gray-500">{payload[0].value} ({((payload[0].percent || 0) * 100).toFixed(1)}%)</p>
    </div>
  );
};

export default function StatusPieChart({ data = [], colorMap, title }) {
  const colors = colorMap || COLORS;

  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={colors[entry.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <p className="text-2xl font-heading font-bold text-gray-900">{total}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
      </div>
    </div>
  );
}
