// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import BodyDiagram from '@/components/BodyDiagram'
import { Dumbbell, Flame, Trophy, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getSessions, getWeeklySummary } from '@/db'

export default function DashboardPage() {
  const { user }  = useAuth()
  const [sessions,  setSessions]  = useState([])
  const [summary,   setSummary]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [sessRes, sumRes] = await Promise.all([
          getSessions(user.id),
          getWeeklySummary(user.id),
        ])
        if (sessRes?.success)  setSessions(sessRes.data.slice(0, 5))
        if (sumRes?.success && sumRes.data.length > 0) setSummary(sumRes.data[0])
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id])

  const weekSessions = summary?.sessionCount ?? 0
  const weekVolume   = summary ? Math.round(summary.totalVolume).toLocaleString() : '0'

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today    = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  return (
    <Layout>
      <div className="p-8 page-enter">

        {/* Header */}
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

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left column */}
          <div className="flex-1 space-y-6 min-w-0">

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={<Dumbbell size={16} className="text-gym-accent"/>}
                value={sessions.length}
                label="Workouts"
              />
              <StatCard
                icon={<Flame size={16} className="text-orange-400"/>}
                value={weekSessions}
                label="This week"
              />
              <StatCard
                icon={<Trophy size={16} className="text-yellow-400"/>}
                value={weekVolume}
                label="lbs/week"
              />
            </div>

            {/* Recent sessions */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  Recent Workouts
                </h2>
                <span className="text-xs text-gym-muted">Last 5 sessions</span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}
                         className="h-12 bg-gym-bg rounded-xl animate-pulse"/>
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

            {/* Tip banner */}
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

          {/* Right column — body diagram */}
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

function SessionRow({ session }) {
  const date        = new Date(session.date)
  const isToday     = date.toDateString() === new Date().toDateString()
  const isYesterday = date.toDateString() ===
    new Date(Date.now() - 86400000).toDateString()
  const dateLabel   = isToday ? 'Today'
    : isYesterday   ? 'Yesterday'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gym-bg
                    rounded-xl border border-gym-border hover:border-gym-muted
                    transition-colors duration-150">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-gym-accent flex-shrink-0"/>
        <div>
          <p className="text-sm font-medium text-white">{session.exerciseName}</p>
          <p className="text-xs text-gym-muted">{session.groupName}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-gym-muted">{dateLabel}</p>
        <p className="text-xs text-white mt-0.5">{session.setCount} sets</p>
      </div>
    </div>
  )
}

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