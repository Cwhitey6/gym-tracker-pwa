// src/pages/ExercisePage.jsx
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import SetRow from '@/components/SetRow'
import WorkoutHistory from '@/components/WorkoutHistory'
import { ArrowLeft, Plus, Save, Trophy, Zap, BarChart3 } from 'lucide-react'
import { getExercises, getPersonalRecord, getSessions,
         getSets, createSession, createSet,
         updatePersonalRecord, deleteSession } from '@/db'

// One-rep max formula (Epley)
const calc1RM = (weight, reps) =>
  reps === 1 ? weight : Math.round(weight * (1 + reps / 30))

export default function ExercisePage() {
  const { id }   = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // ── State ────────────────────────────────────────────────────────────────
  const [exercise,  setExercise]  = useState(null)
  const [pr,        setPr]        = useState(null)
  const [sessions,  setSessions]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')

  // Today's log state
  const [date,      setDate]      = useState(
    new Date().toISOString().split('T')[0]
  )
  const [notes,     setNotes]     = useState('')
  const [sets,      setSets]      = useState([
    { weight: '', reps: '' },
    { weight: '', reps: '' },
    { weight: '', reps: '' },
  ])

  // ── Load data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const exId = Number(id)

      // Load all exercises to find this one
      const exRes = await getExercises()
      if (exRes?.success) {
        const found = exRes.data.find(e => e.id === exId)
        setExercise(found)
      }

      // Load PR
      const prRes = await getPersonalRecord({
        userId: user.id, exerciseId: exId
      })
      if (prRes?.success) setPr(prRes.data)

      // Load all sessions for this exercise
      const allSessions = await getSessions(user.id)
      if (allSessions?.success) {
        const filtered = allSessions.data.filter(
          s => s.exerciseName === exRes?.data?.find(e => e.id === exId)?.name
        )

        // Load sets for each session
        const withSets = await Promise.all(
          filtered.map(async session => {
            const setsRes = await getSets(session.id)
            return {
              ...session,
              sets: setsRes?.success ? setsRes.data : []
            }
          })
        )
        setSessions(withSets)
      }
    } catch (err) {
      console.error('ExercisePage load error:', err)
    } finally {
      setLoading(false)
    }
  }, [id, user.id])

  useEffect(() => { loadData() }, [loadData])

  // ── Set management ───────────────────────────────────────────────────────
  function handleSetChange(index, field, value) {
    setSets(prev => prev.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    ))
  }

  function addSet() {
    // Copy weight from last set as a convenience
    const last = sets[sets.length - 1]
    setSets(prev => [...prev, { weight: last?.weight || '', reps: '' }])
  }

  function deleteSet(index) {
    if (sets.length === 1) return // keep at least one row
    setSets(prev => prev.filter((_, i) => i !== index))
  }

  // ── Save workout ─────────────────────────────────────────────────────────
  async function handleSave() {
    setError('')

    // Validate — at least one set with data
    const validSets = sets.filter(
      s => s.weight > 0 && s.reps > 0
    )
    if (validSets.length === 0) {
      setError('Add at least one set with weight and reps before saving.')
      return
    }

    setSaving(true)
    try {
      // 1. Create the session
      const sessionRes = await createSession({
        userId:     user.id,
        exerciseId: Number(id),
        date,
        notes,
      })

      if (!sessionRes?.success) {
        setError('Failed to create session. Please try again.')
        return
      }

      const sessionId = sessionRes.id

      // 2. Save each set
      for (let i = 0; i < validSets.length; i++) {
        await createSet({
          sessionId,
          setNumber: i + 1,
          reps:      validSets[i].reps,
          weight:    validSets[i].weight,
        })
      }

      // 3. Check and update personal record
      const maxWeight = Math.max(...validSets.map(s => s.weight))
      const maxSet    = validSets.find(s => s.weight === maxWeight)
      await updatePersonalRecord({
        userId:     user.id,
        exerciseId: Number(id),
        weight:     maxWeight,
        reps:       maxSet.reps,
      })

      // 4. Success — reset form and reload
      setSets([
        { weight: '', reps: '' },
        { weight: '', reps: '' },
        { weight: '', reps: '' },
      ])
      setNotes('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await loadData()

    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete session ───────────────────────────────────────────────────────
  async function handleDeleteSession(sessionId) {
    try {
      await deleteSession(sessionId)
      await loadData()
    } catch (err) {
      console.error('Delete session error:', err)
    }
  }

  // ── Computed stats ───────────────────────────────────────────────────────
  const best1RM = sets
    .filter(s => s.weight > 0 && s.reps > 0)
    .reduce((best, s) => {
      const rm = calc1RM(Number(s.weight), Number(s.reps))
      return rm > best ? rm : best
    }, 0)

  const todayVolume = sets
    .filter(s => s.weight > 0 && s.reps > 0)
    .reduce((sum, s) => sum + Number(s.weight) * Number(s.reps), 0)

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-2 border-gym-accent border-t-transparent
                          rounded-full animate-spin"/>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 page-enter">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gym-muted hover:text-white
                     text-sm mb-6 transition-colors duration-150"
        >
          <ArrowLeft size={16}/>
          Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{
                 background: (exercise?.color ?? '#e85d04') + '22',
                 border:     `1px solid ${exercise?.color ?? '#e85d04'}44`,
               }}>
            <span className="text-2xl">🏋️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {exercise?.name ?? 'Exercise'}
            </h1>
            <p className="text-gym-muted text-sm">
              {exercise?.groupName} · {sessions.length} session
              {sessions.length !== 1 ? 's' : ''} logged
            </p>
          </div>
        </div>

        {/* PR stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={14} className="text-yellow-400"/>
              <span className="text-xs font-medium text-gym-muted uppercase
                               tracking-wide">
                Best Weight
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {pr?.weight ? `${pr.weight} lbs` : '—'}
            </p>
            {pr?.achievedAt && (
              <p className="text-xs text-gym-muted mt-1">
                {new Date(pr.achievedAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric'
                })}
              </p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-gym-accent"/>
              <span className="text-xs font-medium text-gym-muted uppercase
                               tracking-wide">
                Est. 1RM
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {pr?.weight
                ? `${calc1RM(pr.weight, pr.reps)} lbs`
                : '—'}
            </p>
            <p className="text-xs text-gym-muted mt-1">Epley formula</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-blue-400"/>
              <span className="text-xs font-medium text-gym-muted uppercase
                               tracking-wide">
                Sessions
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{sessions.length}</p>
            <p className="text-xs text-gym-muted mt-1">Total logged</p>
          </div>
        </div>

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left — Log workout */}
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4">
                Log Today's Workout
              </h2>

              {/* Date picker */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gym-muted mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="input-dark text-sm"
                />
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[24px_1fr_16px_1fr_64px_20px]
                              gap-3 mb-2 px-0">
                <span/>
                <span className="text-xs text-gym-muted text-center">Weight</span>
                <span/>
                <span className="text-xs text-gym-muted text-center">Reps</span>
                <span className="text-xs text-gym-muted text-right">Vol.</span>
                <span/>
              </div>

              {/* Set rows */}
              <div className="space-y-2 mb-4">
                {sets.map((set, i) => (
                  <SetRow
                    key={i}
                    set={set}
                    index={i}
                    onChange={handleSetChange}
                    onDelete={deleteSet}
                  />
                ))}
              </div>

              {/* Live stats */}
              {todayVolume > 0 && (
                <div className="flex justify-between text-xs mb-4
                                bg-gym-bg rounded-xl px-4 py-2.5
                                border border-gym-border animate-fade-in">
                  <span className="text-gym-muted">Today's volume</span>
                  <span className="text-white font-medium">
                    {Math.round(todayVolume).toLocaleString()} lbs
                  </span>
                  {best1RM > 0 && (
                    <>
                      <span className="text-gym-muted">Est. 1RM</span>
                      <span className="text-gym-accent font-medium">
                        {best1RM} lbs
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Add set */}
              <button
                onClick={addSet}
                className="flex items-center justify-center gap-2 w-full
                           py-2.5 rounded-xl border border-dashed
                           border-gym-border text-gym-muted text-sm
                           hover:border-gym-accent hover:text-gym-accent
                           transition-all duration-150 mb-4"
              >
                <Plus size={14}/>
                Add set
              </button>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gym-muted mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="How did it feel? Any cues to remember..."
                  rows={2}
                  className="input-dark text-sm resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-950/50 border border-red-900 rounded-xl
                                px-4 py-3 text-sm text-red-400 mb-4
                                animate-fade-in">
                  {error}
                </div>
              )}

              {/* Success */}
              {saved && (
                <div className="bg-green-950/50 border border-green-900
                                rounded-xl px-4 py-3 text-sm text-green-400
                                mb-4 animate-fade-in">
                  ✅ Workout saved successfully!
                </div>
              )}

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full flex items-center
                           justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30
                                     border-t-white rounded-full animate-spin"/>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={15}/>
                    Save workout
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right — History */}
          <div className="card overflow-auto max-h-[600px]">
            <h2 className="text-sm font-semibold text-white mb-4">
              Workout History
            </h2>
            <WorkoutHistory
              sessions={sessions}
              onDelete={handleDeleteSession}
            />
          </div>

        </div>
      </div>
    </Layout>
  )
}