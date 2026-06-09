/**
 * DashboardPage.jsx
 * 
 * The first thing you see after logging in. Shows a greeting, three
 * stat cards, your recent workouts, a quick tip, and the muscle group
 * selector on the right. Also has the Start Workout button that takes
 * you into live workout mode.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'
import Layout from '@/components/Layout'
import BodyDiagram from '@/components/BodyDiagram'
import { Dumbbell, Flame, Trophy, Zap } from 'lucide-react'
import { getSessions, getWeeklySummary, getWorkoutDays } from '@/db'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [sessions,    setSessions]    = useState([])
  const [summary,     setSummary]     = useState(null)
  const [workoutDays, setWorkoutDays] = useState([])
  const [loading,     setLoading]     = useState(true)

  // load all dashboard data when the page mounts
  // runs all three requests at the same time so it's faster
  useEffect(() => {
    async function load() {
      try {
        const [sessRes, sumRes, daysRes] = await Promise.all([
          getSessions(user.id),
          getWeeklySummary(user.id),
          getWorkoutDays(user.id),
        ])
        // filter to only sessions from the most recent workout day
        if (sessRes?.success) {
          const allSessions = sessRes.data
          if (allSessions.length > 0) {
            const lastDate = allSessions[0].date
            setSessions(allSessions.filter(s => s.date === lastDate))
          }
        }
        // grab just the current week's summary (first item in the array)
        if (sumRes?.success && sumRes.data.length > 0) setSummary(sumRes.data[0])
        if (daysRes?.success)  setWorkoutDays(daysRes.data)
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id])

  // pull out the stats we need for the three cards
  const weekSessions = summary?.sessionCount ?? 0
  const weekVolume   = summary ? Math.round(summary.totalVolume).toLocaleString() : '0'

  // figure out the right greeting based on time of day
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // format today's date for the subtitle
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  return (
    <Layout>
      <div className="p-4 sm:p-8 page-enter">

        {/* header - greeting on the left, start workout button on the right */}
        <div className="flex flex-col sm:flex-row sm:items-center
                        sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-gym-muted text-sm mb-1">{today}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {greeting}, {user?.username} 👋
            </h1>
          </div>
          <button
            onClick={() => navigate('/live-workout')}
            className="btn-primary flex items-center gap-2 text-sm px-6 py-3"
          >
            <Zap size={16}/> Start Workout
          </button>
        </div>

        {/* main content - stacks vertically on mobile, side by side on desktop */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* left column - stats, recent workouts, tip */}
          <div className="flex-1 space-y-6 min-w-0">

            {/* three stat cards */}
            <div className="grid grid-cols-3 gap-3">
              {/* total workouts - counts unique days not individual exercises */}
              <StatCard
                icon={<Dumbbell size={16} className="text-gym-accent"/>}
                value={workoutDays.length}
                label="Workouts"
              />
              {/* how many times you worked out this week */}
              <StatCard
                icon={<Flame size={16} className="text-orange-400"/>}
                value={weekSessions}
                label="This week"
              />
              {/* total lbs moved this week across all exercises */}
              <StatCard
                icon={<Trophy size={16} className="text-yellow-400"/>}
                value={weekVolume}
                label="lbs/week"
              />
            </div>

            {/* last workout list */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  Last Workout
                </h2>
              </div>

              {/* show skeleton loaders while data is being fetched */}
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-gym-bg rounded-xl animate-pulse"/>
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <EmptyState/>
              ) : (
                <div className="space-y-2">
                  {sessions.map(s => (
                    <SessionRow key={s.id} session={s}/>
                  ))}
                </div>
              )}
            </div>

            {/* quick tip banner */}
            <div className="border border-gym-accent/20 bg-gym-accent/5
                            rounded-2xl px-5 py-4">
              <p className="text-xs text-gym-accent font-medium mb-1">
                💡 Quick tip
              </p>
              <p className="text-sm text-gym-muted">
                Click any muscle group on the body diagram to log a workout
                or view your exercise history for that group.
              </p>
            </div>

          </div>

          {/* right column - body diagram, full width on mobile */}
          <div className="w-full lg:w-64 lg:flex-shrink-0">
            <div className="card h-full">
              <BodyDiagram/>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

// one of the three stat cards at the top of the dashboard
function StatCard({ icon, value, label }) {
  return (
    <div className="card flex flex-col items-center justify-center
                    text-center py-4 px-2 gap-1">
      <div className="w-8 h-8 rounded-xl bg-gym-bg flex items-center
                      justify-center mb-1">
        {icon}
      </div>
      <div className="text-xl sm:text-2xl font-bold text-white leading-none">
        {value}
      </div>
      <div className="text-[10px] sm:text-xs text-gym-muted leading-tight">
        {label}
      </div>
    </div>
  )
}

// calculated once when the file is imported instead of every render
const TODAY_STR     = new Date().toDateString()
const YESTERDAY_STR = new Date(
  new Date().setDate(new Date().getDate() - 1)
).toDateString()

// a single row in the last workout list
function SessionRow({ session }) {
  const date = new Date(session.date)

  const isToday     = date.toDateString() === TODAY_STR
  const isYesterday = date.toDateString() === YESTERDAY_STR

  const dateLabel = isToday     ? 'Today'
    : isYesterday ? 'Yesterday'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gym-bg
                    rounded-xl border border-gym-border hover:border-gym-muted
                    transition-colors duration-150">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-2 h-2 rounded-full bg-gym-accent flex-shrink-0"/>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{session.exerciseName}</p>
          <p className="text-xs text-gym-muted truncate">{session.groupName}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="text-xs text-gym-muted">{dateLabel}</p>
        <p className="text-xs text-white mt-0.5">{session.setCount} sets</p>
      </div>
    </div>
  )
}

// shown when there are no workouts logged yet
function EmptyState() {
  return (
    <div className="text-center py-10">
      <div className="text-4xl mb-3">🏋️</div>
      <p className="text-white font-medium mb-1">No workouts yet</p>
      <p className="text-gym-muted text-sm">
        Click a muscle group on the body diagram to get started
      </p>
    </div>
  )
}