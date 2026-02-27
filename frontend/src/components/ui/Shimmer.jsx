export function ShimmerCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

export function ShimmerRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-16" />
      <div className="h-4 bg-gray-200 rounded w-40" />
      <div className="h-4 bg-gray-200 rounded w-20" />
      <div className="h-4 bg-gray-200 rounded w-24" />
      <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
    </div>
  );
}

export function ShimmerTable({ rows = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-cp-border animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-40" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <ShimmerRow key={i} />
      ))}
    </div>
  );
}

export function ShimmerText({ width = 'w-32', height = 'h-4' }) {
  return <div className={`${width} ${height} bg-gray-200 rounded animate-pulse`} />;
}

export function ShimmerChart() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
      <div className="h-48 bg-gray-100 rounded" />
    </div>
  );
}
