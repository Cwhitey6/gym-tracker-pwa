/**
 * LiveWorkoutPage.jsx
 * 
 * Lets you log a workout two ways
 * Live mode runs a stopwatch in real time while youre actually at the gym
 * Log past workout mode lets you pick a date plus a start and end time
 * for a workout you already did and forgot to log
 * 
 * Everything else works the same in both modes. Add exercises one by one
 * via the picker modal then log sets in real time. Each set has a checkmark
 * button to mark it as done which turns it green. When the workout is over there is 
 * a Finish button which shows a summary and saves everything to the database.
 * 
 * Only sets marked as done get saved so sets can be added in advance
 * without worrying about empty ones being logged.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'
import Layout from '@/components/Layout'
import {
  Plus, Trash2, Check, X,
  Timer, Dumbbell, Calendar, Clock
} from 'lucide-react'
import { getExercises, getMuscleGroups, createSession,
         createSet, updatePersonalRecord } from '@/db'

// A custom hook that runs a timer from the moment its activated.
// Returns a formatted time string like "05:23" or "1:02:45" for longer sessions.
// Only ticks while "active" is true so it can be paused when youre in past mode.
function useStopwatch(active) {
  const [seconds, setSeconds] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (active) {
      // tick every second
      ref.current = setInterval(() => setSeconds(s => s + 1), 1000)
    }
    // clear the interval when the component unmounts or active changes
    return () => clearInterval(ref.current)
  }, [active])

  // format seconds into h:mm:ss or mm:ss
  const fmt = (s) => {
    const h   = Math.floor(s / 3600)
    const m   = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return fmt(seconds)
}

// fallback colors in case an exercise doesnt have one from the database
const GROUP_COLORS = {
  'Shoulders & Neck':        '#6366f1',
  'Back, Biceps & Forearms': '#06b6d4',
  'Chest & Triceps':         '#e85d04',
  'Legs':                    '#22c55e',
  'Cardio & Abs':            '#f59e0b',
}

// turns a start and end time like "14:30" and "15:15" into a readable
// duration like "45 min" or "1h 30m". used in log past workout mode
// since theres no live stopwatch running to track the duration
function calcDurationLabel(start, end) {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let minutes = (eh * 60 + em) - (sh * 60 + sm)
  if (minutes < 0) minutes += 24 * 60  // handles workouts that cross midnight
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}

export default function LiveWorkoutPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // 'live' or 'past' - decides which header controls and time inputs show
  const [mode, setMode] = useState('live')

  // live mode runs the stopwatch, past mode does not
  const liveTime = useStopwatch(mode === 'live')

  // past mode uses a manually picked date plus a start and end time
  // defaults to today since most past logs are still from the same day
  // start and end time default to whatever was used last time since
  // most people work out around the same time most days
  const [pastDate,  setPastDate]  = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState(
    () => localStorage.getItem('lastWorkoutStartTime') || ''
  )
  const [endTime,   setEndTime]   = useState(
    () => localStorage.getItem('lastWorkoutEndTime') || ''
)

  // all exercises and groups loaded from the database for the picker
  const [allExercises, setAllExercises] = useState([])
  const [groups,       setGroups]       = useState([])

  // the list of exercise blocks currently in this workout
  // each block has an exercise and a list of sets
  const [blocks, setBlocks] = useState([])

  // exercise picker modal state
  const [showPicker,   setShowPicker]   = useState(false)
  const [pickerFilter, setPickerFilter] = useState('All')
  const [pickerSearch, setPickerSearch] = useState('')

  // finish modal state
  const [showFinish, setShowFinish] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)

  // the date used when saving to the database
  // todays date in live mode, whatever was picked in past mode
  const sessionDate = mode === 'live'
    ? new Date().toISOString().split('T')[0]
    : pastDate

  // the duration shown in the finish summary
  // the running stopwatch in live mode, the calculated gap in past mode
  const durationLabel = mode === 'live' ? liveTime : calcDurationLabel(startTime, endTime)

  // load exercises and groups when the page opens
  useEffect(() => {
    async function load() {
      const [exRes, grRes] = await Promise.all([
        getExercises(),
        getMuscleGroups(),
      ])
      if (exRes?.success) setAllExercises(exRes.data)
      if (grRes?.success) setGroups(grRes.data)
    }
    load()
  }, [])

  // filter the exercise picker list based on search and selected group
  // plain calculation not a useEffect since its just derived from existing state
  const pickerExercises = allExercises.filter(ex => {
    const groupMatch  = pickerFilter === 'All' || ex.groupName === pickerFilter
    const searchMatch = !pickerSearch.trim() ||
      ex.name.toLowerCase().includes(pickerSearch.toLowerCase())
    return groupMatch && searchMatch
  })

  // add an exercise to the workout as a new block with one empty set
  function addExerciseToWorkout(ex) {
    setBlocks(prev => [...prev, {
      exerciseId:   ex.id,
      exerciseName: ex.name,
      groupName:    ex.groupName,
      color:        ex.color ?? GROUP_COLORS[ex.groupName] ?? '#e85d04',
      type:         ex.type ?? 'weight',
      sets: [{ weight: '', reps: '', duration: '', done: false }],
    }])
    setShowPicker(false)
    setPickerSearch('')
  }

  // remove an entire exercise block from the workout
  function removeBlock(blockIdx) {
    setBlocks(prev => prev.filter((_, i) => i !== blockIdx))
  }

  // add a new set to a block pre-filling the weight from the previous set
  function addSet(blockIdx) {
    setBlocks(prev => prev.map((b, i) => {
      if (i !== blockIdx) return b
      const last = b.sets[b.sets.length - 1]
      return {
        ...b,
        sets: [...b.sets, {
          weight:   last?.weight || '',
          reps:     last?.reps   || '',
          duration: '',
          done:     false,
        }]
      }
    }))
  }

  // update a single field on a single set within a block
  function updateSet(blockIdx, setIdx, field, value) {
    setBlocks(prev => prev.map((b, i) => {
      if (i !== blockIdx) return b
      return {
        ...b,
        sets: b.sets.map((s, si) =>
          si === setIdx ? { ...s, [field]: value } : s
        )
      }
    }))
  }

  // toggle a set between done and not done
  // done sets turn green and their inputs get disabled
  function toggleSetDone(blockIdx, setIdx) {
    setBlocks(prev => prev.map((b, i) => {
      if (i !== blockIdx) return b
      return {
        ...b,
        sets: b.sets.map((s, si) =>
          si === setIdx ? { ...s, done: !s.done } : s
        )
      }
    }))
  }

  // delete a single set row - always keeps at least one set per block
  function deleteSet(blockIdx, setIdx) {
    setBlocks(prev => prev.map((b, i) => {
      if (i !== blockIdx) return b
      if (b.sets.length === 1) return b
      return { ...b, sets: b.sets.filter((_, si) => si !== setIdx) }
    }))
  }

  // live stats shown in the header
  // only counts sets that have been marked as done
  const totalSets = blocks.reduce(
    (sum, b) => sum + b.sets.filter(s => s.done).length, 0
  )
  const totalVolume = blocks.reduce(
    (sum, b) => sum + b.sets
      .filter(s => s.done && s.weight && s.reps)
      .reduce((sv, s) => sv + Number(s.weight) * Number(s.reps), 0)
  , 0)

  // saves the workout when you tap Finish
  // only saves sets that are marked as done
  // skips PR updates for time-based exercises since theres no weight to compare
  async function handleFinish() {
    setSaving(true)

    // remember the start and end time for next time, only in past mode
    // since live mode doesnt use these fields at all
    if (mode === 'past' && startTime && endTime) {
      localStorage.setItem('lastWorkoutStartTime', startTime)
      localStorage.setItem('lastWorkoutEndTime', endTime)
    }

    try {
      for (const block of blocks) {
        const isTime = block.type === 'time'

        // filter to only completed sets with valid data
        const validSets = block.sets.filter(s => {
          if (!s.done) return false
          if (isTime) return Number(s.duration) > 0
          return Number(s.weight) > 0 && Number(s.reps) > 0
        })

        if (validSets.length === 0) continue

        // create a session for this exercise using the date from
        // whichever mode is currently active
        const sessionRes = await createSession({
          userId:     user.id,
          exerciseId: block.exerciseId,
          date:       sessionDate,
          notes:      '',
        })
        if (!sessionRes?.success) continue

        // save each completed set
        for (let i = 0; i < validSets.length; i++) {
          await createSet({
            sessionId: sessionRes.id,
            setNumber: i + 1,
            reps:      isTime ? 0 : Number(validSets[i].reps),
            weight:    isTime ? 0 : Number(validSets[i].weight),
            duration:  isTime ? Number(validSets[i].duration) : 0,
          })
        }

        // update the PR if this was a weight-based exercise
        if (!isTime) {
          const maxWeight = Math.max(...validSets.map(s => Number(s.weight)))
          const maxSet    = validSets.find(s => Number(s.weight) === maxWeight)
          await updatePersonalRecord({
            userId:     user.id,
            exerciseId: block.exerciseId,
            weight:     maxWeight,
            reps:       Number(maxSet.reps),
          })
        }
      }

      // show success state then redirect to dashboard
      setSaved(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      console.error('Workout save error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 page-enter max-w-3xl">

        {/* page header with title timer or duration and live stats */}
        <div className="flex flex-col gap-4 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center
                          sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {mode === 'live' ? 'Live Workout' : 'Log Workout'}
              </h1>

              {/* live mode shows the running stopwatch */}
              {mode === 'live' ? (
                <div className="flex items-center gap-2 mt-1">
                  <Timer size={13} className="text-gym-accent"/>
                  <span className="text-gym-accent font-mono text-sm font-medium">
                    {liveTime}
                  </span>
                </div>
              ) : (
                // past mode shows the calculated duration once both times are set
                durationLabel && (
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={13} className="text-gym-accent"/>
                    <span className="text-gym-accent text-sm font-medium">
                      {durationLabel}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* live set count volume and action buttons */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xl font-bold text-white">{totalSets}</p>
                <p className="text-xs text-gym-muted">sets done</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">
                  {totalVolume > 0
                    ? `${Math.round(totalVolume).toLocaleString()}`
                    : '0'}
                </p>
                <p className="text-xs text-gym-muted">lbs volume</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="btn-ghost flex items-center gap-2 text-sm"
                >
                  <X size={14}/> Cancel
                </button>
                {/* finish button is disabled until at least one set is done */}
                <button
                  onClick={() => setShowFinish(true)}
                  disabled={totalSets === 0}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Check size={14}/> Finish
                </button>
              </div>
            </div>
          </div>

          {/* mode toggle - live workout vs logging a past workout */}
          <div className="flex bg-gym-bg rounded-xl p-1 w-fit">
            <button
              onClick={() => setMode('live')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150
                          ${mode === 'live'
                            ? 'bg-gym-surface text-white shadow-sm'
                            : 'text-gym-muted hover:text-white'
                          }`}
            >
              Live workout
            </button>
            <button
              onClick={() => setMode('past')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150
                          ${mode === 'past'
                            ? 'bg-gym-surface text-white shadow-sm'
                            : 'text-gym-muted hover:text-white'
                          }`}
            >
              Log past workout
            </button>
          </div>

          {/* date and time pickers - only shown in past mode */}
          {mode === 'past' && (
            <div className="card flex flex-col sm:flex-row gap-4 animate-fade-in">
              <div className="flex-1">
                <label className="flex items-center gap-1.5 text-xs font-medium
                                  text-gym-muted mb-1.5">
                  <Calendar size={12}/> Date
                </label>
                <input
                  type="date"
                  value={pastDate}
                  onChange={e => setPastDate(e.target.value)}
                  className="input-dark text-sm py-3 [color-scheme:dark]"
                />
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-1.5 text-xs font-medium
                                  text-gym-muted mb-1.5">
                  <Clock size={12}/> Start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="input-dark text-sm py-3 [color-scheme:dark]"
                />
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-1.5 text-xs font-medium
                                  text-gym-muted mb-1.5">
                  <Clock size={12}/> End time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="input-dark text-sm py-3 [color-scheme:dark]"
                />
              </div>
            </div>
          )}

        </div>

        {/* empty state when no exercises have been added yet */}
        {blocks.length === 0 && (
          <div className="card text-center py-16 mb-6">
            <Dumbbell size={36} className="text-gym-muted mx-auto mb-3"/>
            <p className="text-white font-medium mb-1">No exercises added yet</p>
            <p className="text-gym-muted text-sm mb-6">
              Add exercises to start tracking your workout
            </p>
            <button
              onClick={() => setShowPicker(true)}
              className="btn-primary mx-auto flex items-center gap-2"
            >
              <Plus size={15}/> Add exercise
            </button>
          </div>
        )}

        {/* exercise blocks - one card per exercise */}
        <div className="space-y-4">
          {blocks.map((block, blockIdx) => (
            <div key={blockIdx} className="card">

              {/* block header shows exercise name and a remove button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center
                                justify-center flex-shrink-0"
                    style={{ background: block.color + '22' }}
                  >
                    <Dumbbell size={14} style={{ color: block.color }}/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {block.exerciseName}
                    </p>
                    <p className="text-xs text-gym-muted">{block.groupName}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeBlock(blockIdx)}
                  className="text-gym-muted hover:text-red-400
                             transition-colors duration-150 p-1"
                >
                  <X size={14}/>
                </button>
              </div>

              {/* column headers */}
              <div className="grid grid-cols-[32px_1fr_1fr_40px_32px] gap-2 mb-2">
                <span className="text-xs text-gym-muted text-center">Set</span>
                <span className="text-xs text-gym-muted text-center">Weight</span>
                <span className="text-xs text-gym-muted text-center">Reps</span>
                <span className="text-xs text-gym-muted text-center">Done</span>
                <span/>
              </div>

              {/* set rows */}
              <div className="space-y-2 mb-3">
                {block.sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className={`flex items-center gap-2 rounded-xl px-2 py-1.5
                                transition-colors duration-150
                                ${set.done
                                  ? 'bg-green-950/30 border border-green-900/30'
                                  : ''
                                }`}
                  >
                    {/* set number */}
                    <span className="text-xs text-gym-muted w-5 text-center flex-shrink-0">
                      {setIdx + 1}
                    </span>

                    {block.type === 'time' ? (
                      // time-based input - shows seconds with a minutes conversion helper
                      <div className="flex-1 flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            value={set.duration}
                            onChange={e => updateSet(blockIdx, setIdx, 'duration',
                              parseInt(e.target.value) || '')}
                            placeholder="0"
                            className={`input-dark text-center py-2 text-sm pr-10
                                        ${set.done ? 'opacity-60' : ''}`}
                            disabled={set.done}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2
                                           text-xs text-gym-muted pointer-events-none">
                            sec
                          </span>
                        </div>
                        {/* shows "1m 30s" style conversion for longer durations */}
                        {set.duration > 0 && (
                          <span className="text-xs text-gym-muted flex-shrink-0">
                            {set.duration >= 60
                              ? `${Math.floor(set.duration / 60)}m ${set.duration % 60}s`
                              : `${set.duration}s`}
                          </span>
                        )}
                      </div>
                    ) : (
                      // weight and reps inputs for standard exercises
                      <>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            step="2.5"
                            value={set.weight}
                            onChange={e => updateSet(blockIdx, setIdx, 'weight',
                              parseFloat(e.target.value) || '')}
                            placeholder="lbs"
                            className={`input-dark text-center py-2 text-sm pr-8
                                        ${set.done ? 'opacity-60' : ''}`}
                            disabled={set.done}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2
                                           text-xs text-gym-muted pointer-events-none">
                            lbs
                          </span>
                        </div>
                        <span className="text-gym-muted text-xs flex-shrink-0">×</span>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={set.reps}
                            onChange={e => updateSet(blockIdx, setIdx, 'reps',
                              parseInt(e.target.value) || '')}
                            placeholder="reps"
                            className={`input-dark text-center py-2 text-sm pr-10
                                        ${set.done ? 'opacity-60' : ''}`}
                            disabled={set.done}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2
                                           text-xs text-gym-muted pointer-events-none">
                            reps
                          </span>
                        </div>
                      </>
                    )}

                    {/* checkmark button - turns green when tapped and locks the inputs */}
                    <button
                      onClick={() => toggleSetDone(blockIdx, setIdx)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center
                                  flex-shrink-0 transition-all duration-150
                                  ${set.done
                                    ? 'bg-green-500 text-white'
                                    : 'border border-gym-border text-gym-muted hover:border-green-500 hover:text-green-500'
                                  }`}
                    >
                      <Check size={13}/>
                    </button>

                    {/* delete this set row */}
                    <button
                      onClick={() => deleteSet(blockIdx, setIdx)}
                      className="text-gym-muted hover:text-red-400 transition-colors
                                 duration-150 w-7 h-7 flex items-center justify-center
                                 flex-shrink-0"
                    >
                      <Trash2 size={12}/>
                    </button>

                  </div>
                ))}
              </div>

              {/* add another set to this block */}
              <button
                onClick={() => addSet(blockIdx)}
                className="flex items-center justify-center gap-2 w-full py-2
                           rounded-xl border border-dashed border-gym-border
                           text-gym-muted text-xs hover:border-gym-accent
                           hover:text-gym-accent transition-all duration-150"
              >
                <Plus size={12}/> Add set
              </button>

            </div>
          ))}
        </div>

        {/* add another exercise button shown below the blocks */}
        {blocks.length > 0 && (
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center justify-center gap-2 w-full mt-4
                       py-3 rounded-2xl border border-dashed border-gym-border
                       text-gym-muted hover:border-gym-accent hover:text-gym-accent
                       transition-all duration-150 font-medium text-sm"
          >
            <Plus size={15}/> Add exercise
          </button>
        )}

        {/* exercise picker modal
            slides up from the bottom on mobile centers on desktop */}
        {showPicker && (
          <div
            className="fixed inset-0 bg-black/60 flex items-end sm:items-center
                        justify-center z-50 animate-fade-in p-0 sm:p-4"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowPicker(false) }}
          >
            <div
              className="bg-gym-surface border border-gym-border rounded-t-2xl
                          sm:rounded-2xl w-full max-w-lg flex flex-col animate-slide-up"
              style={{ maxHeight: '70vh', height: '70vh' }}
            >
              {/* modal header */}
              <div className="flex items-center justify-between px-5 py-4
                              border-b border-gym-border flex-shrink-0">
                <h2 className="text-base font-bold text-white">Add Exercise</h2>
                <button
                  onClick={() => setShowPicker(false)}
                  className="text-gym-muted hover:text-white transition-colors
                             w-8 h-8 flex items-center justify-center
                             rounded-lg hover:bg-white/10"
                >
                  <X size={16}/>
                </button>
              </div>

              {/* search input */}
              <div className="px-4 py-3 border-b border-gym-border flex-shrink-0">
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  placeholder="Search exercises..."
                  className="input-dark text-sm py-2.5"
                  autoFocus
                />
              </div>

              {/* horizontally scrollable muscle group filter pills
                  scrollbar is hidden on all browsers for a cleaner look */}
              <div className="flex gap-2 px-4 py-2.5 overflow-x-auto flex-shrink-0
                              border-b border-gym-border
                              [-ms-overflow-style:none]
                              [scrollbar-width:none]
                              [&::-webkit-scrollbar]:hidden">
                {['All', ...groups.map(g => g.name)].map(g => (
                  <button
                    key={g}
                    onClick={() => setPickerFilter(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium
                                whitespace-nowrap flex-shrink-0 transition-all duration-150
                                ${pickerFilter === g
                                  ? 'bg-gym-accent text-white'
                                  : 'bg-gym-bg border border-gym-border text-gym-muted hover:text-white'
                                }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* scrollable exercise list */}
              <div className="overflow-y-auto py-2" style={{ flex: '1 1 0', minHeight: 0 }}>
                {pickerExercises.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gym-muted text-sm">No exercises found</p>
                  </div>
                ) : (
                  <div>
                    {pickerExercises.map(ex => {
                      const color       = ex.color ?? GROUP_COLORS[ex.groupName] ?? '#e85d04'
                      const alreadyAdded = blocks.some(b => b.exerciseId === ex.id)
                      const isTime      = ex.type === 'time'

                      return (
                        <button
                          key={ex.id}
                          onClick={() => !alreadyAdded && addExerciseToWorkout(ex)}
                          disabled={alreadyAdded}
                          className={`w-full flex items-center gap-3 px-4 py-3
                                      text-left transition-all duration-150
                                      ${alreadyAdded
                                        ? 'opacity-40 cursor-not-allowed'
                                        : 'hover:bg-white/5 active:bg-white/10'
                                      }`}
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center
                                        justify-center flex-shrink-0"
                            style={{ background: color + '22' }}
                          >
                            <Dumbbell size={16} style={{ color }}/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {ex.name}
                            </p>
                            <p className="text-xs text-gym-muted">{ex.groupName}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* badge showing whether this is a weight or time exercise */}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                              ${isTime
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-gym-accent/20 text-gym-accent'
                                              }`}>
                              {isTime ? '⏱ time' : '🏋️ weight'}
                            </span>
                            {alreadyAdded && (
                              <span className="text-xs text-gym-muted">Added</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* finish workout modal */}
        {showFinish && (
          <div className="fixed inset-0 bg-black/60 flex items-center
                          justify-center z-50 animate-fade-in p-4">
            <div className="bg-gym-surface border border-gym-border
                            rounded-2xl p-6 w-full max-w-sm animate-slide-up">

              {/* success state shown after saving */}
              {saved ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-green-500/20
                                  flex items-center justify-center mx-auto mb-4">
                    <Check size={28} className="text-green-400"/>
                  </div>
                  <p className="text-white font-bold text-lg mb-1">Workout saved!</p>
                  <p className="text-gym-muted text-sm">Redirecting to dashboard...</p>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-white mb-2">
                    Finish workout?
                  </h2>

                  {/* workout summary */}
                  <div className="bg-gym-bg rounded-xl p-4 mb-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gym-muted">Duration</span>
                      <span className="text-white font-medium">{durationLabel ?? '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gym-muted">Exercises</span>
                      <span className="text-white font-medium">{blocks.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gym-muted">Sets completed</span>
                      <span className="text-white font-medium">{totalSets}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gym-muted">Total volume</span>
                      <span className="text-gym-accent font-medium">
                        {Math.round(totalVolume).toLocaleString()} lbs
                      </span>
                    </div>
                  </div>

                  <p className="text-gym-muted text-xs mb-5">
                    Only sets marked as done will be saved.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFinish(false)}
                      className="btn-ghost flex-1"
                    >
                      Keep going
                    </button>
                    <button
                      onClick={handleFinish}
                      disabled={saving}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <span className="w-4 h-4 border-2 border-white/30
                                         border-t-white rounded-full animate-spin"/>
                      ) : (
                        <><Check size={14}/> Save</>
                      )}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}