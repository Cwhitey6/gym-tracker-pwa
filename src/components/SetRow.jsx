// src/components/SetRow.jsx
import { Trash2 } from 'lucide-react'

export default function SetRow({ set, index, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-3 group">

      {/* Set number */}
      <span className="text-xs font-medium text-gym-muted w-6 text-center
                       flex-shrink-0">
        {index + 1}
      </span>

      {/* Weight input */}
      <div className="flex-1">
        <div className="relative">
          <input
            type="number"
            min="0"
            step="2.5"
            value={set.weight}
            onChange={e => onChange(index, 'weight', parseFloat(e.target.value) || 0)}
            className="input-dark text-center pr-10 py-2.5 text-sm"
            placeholder="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2
                           text-xs text-gym-muted pointer-events-none">
            lbs
          </span>
        </div>
      </div>

      <span className="text-gym-muted text-sm flex-shrink-0">×</span>

      {/* Reps input */}
      <div className="flex-1">
        <div className="relative">
          <input
            type="number"
            min="0"
            step="1"
            value={set.reps}
            onChange={e => onChange(index, 'reps', parseInt(e.target.value) || 0)}
            className="input-dark text-center pr-12 py-2.5 text-sm"
            placeholder="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2
                           text-xs text-gym-muted pointer-events-none">
            reps
          </span>
        </div>
      </div>

      {/* Volume preview */}
      <span className="text-xs text-gym-muted w-16 text-right flex-shrink-0">
        {set.weight && set.reps
          ? `${(set.weight * set.reps).toLocaleString()} lbs`
          : '—'}
      </span>

      {/* Delete button */}
      <button
        onClick={() => onDelete(index)}
        className="opacity-0 group-hover:opacity-100 text-gym-muted
                   hover:text-red-400 transition-all duration-150 flex-shrink-0"
      >
        <Trash2 size={14}/>
      </button>
    </div>
  )
}