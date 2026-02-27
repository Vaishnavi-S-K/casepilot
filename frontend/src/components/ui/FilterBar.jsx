import { Search, X } from 'lucide-react';

export default function FilterBar({ filters, values, onChange, onClear }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          value={values.search || ''}
          onChange={(e) => onChange('search', e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {/* Dropdown filters */}
      {filters.map((f) => (
        <select
          key={f.key}
          value={values[f.key] || ''}
          onChange={(e) => onChange(f.key, e.target.value)}
          className="select-field w-auto min-w-[130px]"
        >
          <option value="">{f.label}</option>
          {f.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ))}

      {/* Clear */}
      {Object.values(values).some(Boolean) && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-input transition-colors"
        >
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
}
