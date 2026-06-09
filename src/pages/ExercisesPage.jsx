/**
 * ExercisesPage.jsx
 * 
 * Shows all exercises in a grid with search and filter by muscle group.
 * You can add new exercises via the modal in the top right and delete
 * existing ones by hovering a card and clicking the trash icon.
 * 
 * Each card shows the exercise name muscle group tag and whether it
 * tracks weight x reps or time in seconds.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Search, Dumbbell, Plus, Trash2, X, Check } from 'lucide-react'
import { getExercises, getMuscleGroups, addExercise, deleteExercise } from '@/db'

// fallback colors in case an exercise doesn't have a color from the database
const GROUP_COLORS = {
  'Shoulders & Neck':        '#6366f1',
  'Back, Biceps & Forearms': '#06b6d4',
  'Chest & Triceps':         '#e85d04',
  'Legs':                    '#22c55e',
  'Cardio & Abs':            '#f59e0b',
}

export default function ExercisesPage() {
  const navigate = useNavigate()

  const [exercises,   setExercises]   = useState([])
  const [groups,      setGroups]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [activeGroup, setActiveGroup] = useState('All')

  // add exercise modal state
  const [showAdd,    setShowAdd]    = useState(false)
  const [newName,    setNewName]    = useState('')
  const [newGroupId, setNewGroupId] = useState('')
  const [newType,    setNewType]    = useState('weight')
  const [addError,   setAddError]   = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // which exercise id is pending deletion (shows confirm modal)
  const [deleteId, setDeleteId] = useState(null)

  // load on mount
  useEffect(() => {
    async function load() {
      try {
        const [exRes, grRes] = await Promise.all([
          getExercises(),
          getMuscleGroups(),
        ])
        if (exRes?.success) setExercises(exRes.data)
        if (grRes?.success) {
          setGroups(grRes.data)
          // pre-select the first group in the add modal dropdown
          // we set it unconditionally here since this only runs once on mount
          if (grRes.data.length) {
            setNewGroupId(String(grRes.data[0].id))
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // called after adding or deleting to refresh the list
  // separate from the initial load since we don't need the loading spinner
  async function reload() {
    const [exRes, grRes] = await Promise.all([
      getExercises(),
      getMuscleGroups(),
    ])
    if (exRes?.success) setExercises(exRes.data)
    if (grRes?.success) setGroups(grRes.data)
  }

  // filtering is just a calculation based on existing state
  const filtered = exercises
    .filter(e => activeGroup === 'All' || e.groupName === activeGroup)
    .filter(e => !search.trim() || e.name.toLowerCase().includes(search.toLowerCase()))

  // open the add modal with a clean slate
  function openAdd() {
    setNewName('')
    setNewType('weight')
    setAddError('')
    setShowAdd(true)
  }

  // close the add modal and reset all its state
  function closeAdd() {
    setShowAdd(false)
    setNewName('')
    setNewType('weight')
    setAddError('')
  }

  // save the new exercise to the database
  async function handleAdd() {
    setAddError('')
    if (!newName.trim()) {
      setAddError('Exercise name is required.')
      return
    }
    if (!newGroupId) {
      setAddError('Select a muscle group.')
      return
    }
    setAddLoading(true)
    try {
      const res = await addExercise({
        name:          newName.trim(),
        muscleGroupId: Number(newGroupId),
        type:          newType,
      })
      if (res?.success) {
        closeAdd()
        await reload()
      } else {
        setAddError(res?.error ?? 'Failed to add exercise.')
      }
    } finally {
      setAddLoading(false)
    }
  }

  // permanently delete an exercise and reload the list
  async function handleDelete(id) {
    await deleteExercise(id)
    setDeleteId(null)
    await reload()
  }

  // "All" plus the 5 muscle group names for the filter pills
  const groupNames = ['All', ...Object.keys(GROUP_COLORS)]

  return (
    <Layout>
      <div className="p-4 sm:p-8 page-enter">

        {/* page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Exercises</h1>
            <p className="text-gym-muted text-sm">
              {exercises.length} exercises · click any to log a workout
            </p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16}/> Add exercise
          </button>
        </div>

        {/* add exercise modal */}
        {showAdd && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center
                        justify-center z-50 animate-fade-in p-4"
            onClick={e => { if (e.target === e.currentTarget) closeAdd() }}
          >
            <div className="bg-gym-surface border border-gym-border
                            rounded-2xl p-6 w-full max-w-md animate-slide-up">

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Add Exercise</h2>
                <button
                  onClick={closeAdd}
                  className="text-gym-muted hover:text-white transition-colors
                             w-8 h-8 flex items-center justify-center
                             rounded-lg hover:bg-white/10"
                >
                  <X size={16}/>
                </button>
              </div>

              <div className="space-y-4">

                {/* exercise name input */}
                <div>
                  <label className="block text-xs font-medium text-gym-muted mb-1.5">
                    Exercise name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="e.g. Cable Fly"
                    className="input-dark"
                    autoFocus
                  />
                </div>

                {/* muscle group dropdown */}
                <div>
                  <label className="block text-xs font-medium text-gym-muted mb-1.5">
                    Muscle group
                  </label>
                  <select
                    value={newGroupId}
                    onChange={e => setNewGroupId(e.target.value)}
                    className="input-dark"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                {/* weight vs time toggle */}
                <div>
                  <label className="block text-xs font-medium text-gym-muted mb-1.5">
                    Tracking type
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'weight', label: '🏋️ Weight & reps' },
                      { value: 'time',   label: '⏱ Time-based'    },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setNewType(opt.value)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium
                                    transition-all duration-150 border
                                    ${newType === opt.value
                                      ? 'bg-gym-accent/10 border-gym-accent text-gym-accent'
                                      : 'border-gym-border text-gym-muted hover:text-white'
                                    }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {/* description of what each type means */}
                  <p className="text-xs text-gym-muted mt-2">
                    {newType === 'time'
                      ? 'Sets will be logged in seconds (e.g. planks, cardio)'
                      : 'Sets will be logged as weight x reps'}
                  </p>
                </div>

                {/* error message */}
                {addError && (
                  <div className="bg-red-950/50 border border-red-900
                                  rounded-xl px-4 py-3 text-sm text-red-400
                                  animate-fade-in">
                    {addError}
                  </div>
                )}

                {/* cancel and confirm buttons */}
                <div className="flex gap-3 pt-2">
                  <button onClick={closeAdd} className="btn-ghost flex-1">
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={addLoading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {addLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30
                                       border-t-white rounded-full animate-spin"/>
                    ) : (
                      <><Check size={15}/> Add exercise</>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* delete confirm modal */}
        {deleteId && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center
                        justify-center z-50 animate-fade-in p-4"
            onClick={e => { if (e.target === e.currentTarget) setDeleteId(null) }}
          >
            <div className="bg-gym-surface border border-gym-border
                            rounded-2xl p-6 w-full max-w-sm animate-slide-up">
              <h2 className="text-lg font-bold text-white mb-2">
                Delete exercise?
              </h2>
              <p className="text-gym-muted text-sm mb-6">
                This will also delete all logged sessions for this exercise.
                This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white
                             font-medium px-5 py-2.5 rounded-xl
                             transition-all duration-150 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* search bar */}
        <div className="relative mb-4">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2
                       text-gym-muted pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="input-dark pl-10"
          />
        </div>

        {/* muscle group filter pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {groupNames.map(g => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium
                          transition-all duration-150
                          ${activeGroup === g
                            ? 'bg-gym-accent text-white'
                            : 'bg-gym-surface border border-gym-border text-gym-muted hover:text-white'
                          }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* exercise grid */}
        {loading ? (
          // skeleton loaders while fetching
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-28 bg-gym-surface rounded-2xl animate-pulse"/>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          // empty state when search returns nothing
          <div className="card text-center py-16">
            <Search size={32} className="text-gym-muted mx-auto mb-3"/>
            <p className="text-white font-medium mb-1">No exercises found</p>
            <p className="text-gym-muted text-sm">
              Try a different search or add a new exercise
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(ex => {
              const color  = ex.color ?? GROUP_COLORS[ex.groupName] ?? '#e85d04'
              const isTime = ex.type === 'time'

              return (
                <div key={ex.id} className="relative group">

                  {/* exercise card navigates to the exercise detail page */}
                  <button
                    onClick={() => navigate(`/exercise/${ex.id}`)}
                    className="card text-left w-full hover:border-gym-muted
                               transition-all duration-150 active:scale-95"
                  >
                    {/* colored icon */}
                    <div
                      className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center"
                      style={{ background: color + '22' }}
                    >
                      <Dumbbell size={16} style={{ color }}/>
                    </div>

                    {/* exercise name */}
                    <p className="text-sm font-medium text-white mb-2
                                  group-hover:text-gym-accent transition-colors
                                  pr-6 leading-snug">
                      {ex.name}
                    </p>

                    {/* muscle group and type tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: color + '22', color }}
                      >
                        {ex.groupName}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                        ${isTime
                                          ? 'bg-blue-500/20 text-blue-400'
                                          : 'bg-white/5 text-gym-muted'
                                        }`}>
                        {isTime ? '⏱ time' : '🏋️ weight'}
                      </span>
                    </div>
                  </button>

                  {/* trash icon appears on hover to trigger the delete modal */}
                  <button
                    onClick={() => setDeleteId(ex.id)}
                    className="absolute top-3 right-3 opacity-0
                               group-hover:opacity-100 text-gym-muted
                               hover:text-red-400 transition-all duration-150
                               p-1.5 rounded-lg hover:bg-red-400/10"
                  >
                    <Trash2 size={13}/>
                  </button>

                </div>
              )
            })}
          </div>
        )}

      </div>
    </Layout>
  )
}