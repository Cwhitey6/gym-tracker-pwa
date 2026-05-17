// src/pages/HistoryPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import { Search, Calendar, Dumbbell, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { getSessions, getSets, deleteSession } from '@/db'

export default function HistoryPage() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [sessions,  setSessions]  = useState([])
  const [filtered,  setFiltered]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [expanded,  setExpanded]  = useState(null)

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    try {
      const res = await getSessions(user.id)
      if (res?.success) {
        // Load sets for each session
        const withSets = await Promise.all(
          res.data.map(async s => {
            const setsRes = await getSets(s.id)
            return { ...s, sets: setsRes?.success ? setsRes.data : [] }
          })
        )
        setSessions(withSets)
        setFiltered(withSets)
      }
    } catch (err) {
      console.error('HistoryPage load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter by search
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(sessions)
      return
    }
    const q = search.toLowerCase()
    setFiltered(sessions.filter(s =>
      s.exerciseName.toLowerCase().includes(q) ||
      s.groupName.toLowerCase().includes(q) ||
      s.date.includes(q)
    ))
  }, [search, sessions])

  async function handleDelete(sessionId) {
    await deleteSession(sessionId)
    await loadSessions()
  }

  // Group sessions by date
  const grouped = filtered.reduce((acc, s) => {
    const date = s.date
    if (!acc[date]) acc[date] = []
    acc[date].push(s)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) =>
    new Date(b) - new Date(a)
  )

  const totalVolume = sessions.reduce((sum, s) =>
    sum + s.sets.reduce((sv, set) => sv + set.weight * set.reps, 0), 0
  )

  return (
    <Layout>
      <div className="p-4 sm:p-8 page-enter">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">History</h1>
            <p className="text-gym-muted text-sm">
              {sessions.length} sessions · {Math.round(totalVolume).toLocaleString()} lbs total volume
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2
                             text-gym-muted pointer-events-none"/>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by exercise or muscle group..."
            className="input-dark pl-10"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gym-surface rounded-2xl animate-pulse"/>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Dumbbell size={36} className="text-gym-muted mx-auto mb-3"/>
            <p className="text-white font-medium mb-1">
              {search ? 'No results found' : 'No workouts logged yet'}
            </p>
            <p className="text-gym-muted text-sm">
              {search
                ? 'Try a different search term'
                : 'Start logging workouts to see your history here'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => {
              const dateObj   = new Date(date)
              const isToday   = dateObj.toDateString() === new Date().toDateString()
              const isYest    = dateObj.toDateString() ===
                new Date(Date.now() - 86400000).toDateString()
              const dateLabel = isToday ? 'Today'
                : isYest ? 'Yesterday'
                : dateObj.toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric'
                  })

              return (
                <div key={date}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar size={13} className="text-gym-muted"/>
                    <span className="text-sm font-semibold text-white">
                      {dateLabel}
                    </span>
                    <div className="flex-1 h-px bg-gym-border"/>
                    <span className="text-xs text-gym-muted">
                      {grouped[date].length} exercise
                      {grouped[date].length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Sessions for this date */}
                  <div className="space-y-2">
                    {grouped[date].map(session => {
                      const isOpen  = expanded === session.id
                      const volume  = session.sets.reduce(
                        (sum, s) => sum + s.weight * s.reps, 0
                      )

                      return (
                        <div key={session.id}
                             className="border border-gym-border rounded-xl
                                        overflow-hidden">
                          <button
                            onClick={() => setExpanded(isOpen ? null : session.id)}
                            className="w-full flex items-center gap-4 px-5 py-4
                                       hover:bg-white/5 transition-colors duration-150"
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center
                                            justify-center flex-shrink-0 bg-gym-bg
                                            border border-gym-border">
                              <Dumbbell size={15} className="text-gym-accent"/>
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-white">
                                {session.exerciseName}
                              </p>
                              <p className="text-xs text-gym-muted mt-0.5">
                                {session.groupName} · {session.sets.length} sets
                                {volume > 0 && ` · ${Math.round(volume).toLocaleString()} lbs`}
                              </p>
                            </div>
                            {session.notes && (
                              <span className="text-xs text-gym-muted
                                               hidden md:block max-w-32 truncate">
                                {session.notes}
                              </span>
                            )}
                            {isOpen
                              ? <ChevronUp size={14} className="text-gym-muted flex-shrink-0"/>
                              : <ChevronDown size={14} className="text-gym-muted flex-shrink-0"/>
                            }
                          </button>

                          {isOpen && (
                            <div className="border-t border-gym-border bg-gym-bg
                                            px-5 py-4 animate-fade-in">
                              <div className="grid grid-cols-4 gap-3 mb-2">
                                {['Set', 'Weight', 'Reps', 'Volume'].map(h => (
                                  <span key={h}
                                        className="text-xs font-medium text-gym-muted">
                                    {h}
                                  </span>
                                ))}
                              </div>
                              {session.sets.map((s, i) => (
                                <div key={s.id}
                                     className="grid grid-cols-4 gap-3 py-2
                                                border-t border-gym-border/50">
                                  <span className="text-xs text-gym-muted">{i + 1}</span>
                                  <span className="text-xs text-white">{s.weight} lbs</span>
                                  <span className="text-xs text-white">{s.reps}</span>
                                  <span className="text-xs text-gym-accent">
                                    {Math.round(s.weight * s.reps).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                              {session.notes && (
                                <p className="text-xs text-gym-muted italic mt-3">
                                  "{session.notes}"
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-4">
                                <button
                                  onClick={() => navigate(`/exercise/${
                                    sessions.find(s => s.id === session.id)?.id
                                  }`)}
                                  className="text-xs text-gym-accent hover:underline"
                                >
                                  View exercise →
                                </button>
                                <button
                                  onClick={() => handleDelete(session.id)}
                                  className="flex items-center gap-1.5 text-xs
                                             text-red-500 hover:text-red-400
                                             transition-colors duration-150"
                                >
                                  <Trash2 size={12}/>
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}