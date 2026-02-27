const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDateShort(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatCurrency(n) {
  if (n == null || isNaN(n)) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now - d) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const monthsDiff = Math.floor(days / 30);
  return `${monthsDiff}mo ago`;
}

export function initials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function urgencyColor(u) {
  const map = {
    Critical: 'bg-red-100 text-red-700',
    High: 'bg-rose-100 text-rose-700',
    Standard: 'bg-amber-100 text-amber-700',
    Low: 'bg-emerald-100 text-emerald-700',
  };
  return map[u] || 'bg-gray-100 text-gray-600';
}

export function statusColor(s) {
  const map = {
    Active: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700',
    'On Hold': 'bg-sky-100 text-sky-700',
    Closed: 'bg-gray-100 text-gray-600',
    Appeal: 'bg-violet-100 text-violet-700',
    // Document review statuses
    Draft: 'bg-gray-100 text-gray-600',
    Submitted: 'bg-sky-100 text-sky-700',
    'Under Review': 'bg-amber-100 text-amber-700',
    Approved: 'bg-teal-100 text-teal-700',
    Filed: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-rose-100 text-rose-700',
    // Task stages
    Backlog: 'bg-gray-100 text-gray-600',
    Todo: 'bg-sky-100 text-sky-700',
    'In Progress': 'bg-indigo-100 text-indigo-700',
    Review: 'bg-amber-100 text-amber-700',
    Done: 'bg-emerald-100 text-emerald-700',
    Dropped: 'bg-gray-100 text-gray-500',
    // Client
    Inactive: 'bg-gray-100 text-gray-500',
  };
  return map[s] || 'bg-gray-100 text-gray-600';
}

export function tierColor(t) {
  const map = {
    VIP: 'bg-amber-100 text-amber-700 border-amber-300',
    Premium: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    Standard: 'bg-teal-100 text-teal-700 border-teal-300',
  };
  return map[t] || 'bg-gray-100 text-gray-600';
}

export function avatarColor(name) {
  const colors = [
    'bg-indigo-600', 'bg-teal-600', 'bg-violet-600', 'bg-rose-600',
    'bg-amber-600', 'bg-emerald-600', 'bg-sky-600', 'bg-pink-600',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
