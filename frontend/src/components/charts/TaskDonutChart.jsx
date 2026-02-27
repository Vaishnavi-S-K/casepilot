import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STAGE_COLORS = {
  Backlog: '#6B7280',
  Todo: '#0284C7',
  'In Progress': '#4F46E5',
  Review: '#D97706',
  Done: '#059669',
  Dropped: '#9CA3AF',
};

const DEFAULT_COLORS = ['#4F46E5', '#0D9488', '#7C3AED', '#D97706', '#059669'];

export default function TaskDonutChart({ data = [], colorMap }) {
  const colors = colorMap || STAGE_COLORS;
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={colors[entry.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-white border border-cp-border rounded-lg shadow-dropdown px-3 py-2">
                  <p className="text-sm font-semibold text-gray-900">{payload[0].name}</p>
                  <p className="text-xs text-gray-500">{payload[0].value} tasks</p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span className="text-xs text-gray-600">{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <p className="text-2xl font-heading font-bold text-gray-900">{total}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tasks</p>
      </div>
    </div>
  );
}
