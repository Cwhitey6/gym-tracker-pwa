/**
 * SetRow.jsx
 * 
 * A single row in the workout logging form on ExercisePage.
 * Each row represents one set and has inputs for weight and reps,
 * a live volume preview that calculates as you type, and a trash
 * icon that appears on hover to delete the set.
 * 
 * This component doesn't manage its own state it just receives
 * values and fires callbacks up to ExercisePage when something changes.
 */

import { Trash2 } from 'lucide-react'

// props coming in from ExercisePage:
// - set: the current set object { weight, reps }
// - index: which set number this is (0-based, displayed as 1-based)
// - onChange: function to call when weight or reps changes
// - onDelete: function to call when the trash icon is clicked
export default function SetRow({ set, index, onChange, onDelete }) {
  return (
    // "group" lets child elements react to hover on this parent div
    <div className="flex items-center gap-3 group">

      {/* set number on the far left - add 1 so it shows 1, 2, 3 instead of 0, 1, 2 */}
      <span className="text-xs font-medium text-gym-muted w-6 text-center flex-shrink-0">
        {index + 1}
      </span>

      {/* weight input - steps by 2.5 since that's the smallest plate increment */}
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
          {/* "lbs" label positioned inside the right side of the input */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2
                           text-xs text-gym-muted pointer-events-none">
            lbs
          </span>
        </div>
      </div>

      {/* the × symbol between weight and reps */}
      <span className="text-gym-muted text-sm flex-shrink-0">×</span>

      {/* reps input - steps by 1 since reps are always whole numbers */}
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
          {/* "reps" label positioned inside the right side of the input */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2
                           text-xs text-gym-muted pointer-events-none">
            reps
          </span>
        </div>
      </div>

      {/* live volume preview - multiplies weight × reps as you type
          shows a dash if either field is empty */}
      <span className="text-xs text-gym-muted w-16 text-right flex-shrink-0">
        {set.weight && set.reps
          ? `${(set.weight * set.reps).toLocaleString()} lbs`
          : '-'}
      </span>

      {/* trash icon - hidden by default, appears when you hover the row
          "opacity-0 group-hover:opacity-100" is what makes it fade in on hover */}
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