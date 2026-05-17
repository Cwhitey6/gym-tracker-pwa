// src/pages/ProgressPage.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import WeightChart from '@/components/charts/WeightChart'
import VolumeChart from '@/components/charts/VolumeChart'
import OneRMChart  from '@/components/charts/OneRMChart'
import { TrendingUp, BarChart3, Zap, Calendar } from 'lucide-react'
import { getExercises, getProgress, getWeeklySummary } from '@/db'

export default function ProgressPage() {
  const { user } = useAuth()

  const [exercises,      setExercises]      = useState([])
  const [selectedEx,     setSelectedEx]     = useState(null)
  const [progressData,   setProgressData]   = useState([])
  const [weeklySummary,  setWeeklySummary]  = useState([])
  const [loading,        setLoading]        = useState(true)
  const [chartLoading,   setChartLoading]   = useState(false)

  // Load exercises and weekly summary on mount
  useEffect(() => {
    async function load() {
      try {
        const [exRes, weekRes] = await Promise.all([
          getExercises(),
          getWeeklySummary(user.id),
        ])
        if (exRes?.success)   setExercises(exRes.data)
        if (weekRes?.success) setWeeklySummary(weekRes.data)
      } catch (err) {
        console.error('ProgressPage load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id])

  // Load chart data when exercise selection changes
  useEffect(() => {
    if (!selectedEx) return
    async function loadProgress() {
      setChartLoading(true)
      try {
        const res = await getProgress({
          userId:     user.id,
          exerciseId: selectedEx.id,
        })
        if (res?.success) setProgressData(res.data)
        else setProgressData([])
      } catch (err) {
        console.error('Progress load error:', err)
        setProgressData([])
      } finally {
        setChartLoading(false)
      }
    }
    loadProgress()
  }, [selectedEx, user.id])

  // Group exercises by muscle group for the selector
  const grouped = exercises.reduce((acc, ex) => {
    if (!acc[ex.groupName]) acc[ex.groupName] = []
    acc[ex.groupName].push(ex)
    return acc
  }, {})

  // Weekly summary stats
  const thisWeek  = weeklySummary[0]
  const lastWeek  = weeklySummary[1]
  const volumeDiff = thisWeek && lastWeek
    ? Math.round(((thisWeek.totalVolume - lastWeek.totalVolume)
        / lastWeek.totalVolume) * 100)
    : null

  return (
    <Layout>
      <div className="p-4 sm:p-8 page-enter">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Progress</h1>
          <p className="text-gym-muted text-sm">
            Track your gains over time
          </p>
        </div>

        {/* Weekly summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SummaryCard
            icon={<Calendar size={16} className="text-gym-accent"/>}
            label="Sessions this week"
            value={thisWeek?.sessionCount ?? 0}
          />
          <SummaryCard
            icon={<BarChart3 size={16} className="text-blue-400"/>}
            label="Sets this week"
            value={thisWeek?.totalSets ?? 0}
          />
          <SummaryCard
            icon={<TrendingUp size={16} className="text-green-400"/>}
            label="Volume this week"
            value={thisWeek?.totalVolume
              ? `${Math.round(thisWeek.totalVolume / 1000 * 10) / 10}k lbs`
              : '0 lbs'}
          />
          <SummaryCard
            icon={<Zap size={16} className="text-yellow-400"/>}
            label="vs last week"
            value={volumeDiff !== null
              ? `${volumeDiff > 0 ? '+' : ''}${volumeDiff}%`
              : '—'}
            valueColor={volumeDiff > 0
              ? 'text-green-400'
              : volumeDiff < 0
              ? 'text-red-400'
              : 'text-white'}
          />
        </div>

        {/* Exercise selector + charts */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* Left — exercise selector */}
          <div className="card overflow-auto max-h-[600px]">
            <h2 className="text-sm font-semibold text-white mb-4">
              Select Exercise
            </h2>

            {loading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i}
                       className="h-8 bg-gym-bg rounded-lg animate-pulse"/>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([groupName, exs]) => (
                  <div key={groupName}>
                    <p className="text-xs font-medium text-gym-muted
                                  uppercase tracking-widest mb-2">
                      {groupName}
                    </p>
                    <div className="space-y-1">
                      {exs.map(ex => (
                        <button
                          key={ex.id}
                          onClick={() => setSelectedEx(ex)}
                          className={`w-full text-left px-3 py-2 rounded-lg
                                      text-sm transition-all duration-150
                                      ${selectedEx?.id === ex.id
                                        ? 'bg-gym-accent/10 text-gym-accent font-medium'
                                        : 'text-gym-muted hover:text-white hover:bg-white/5'
                                      }`}
                        >
                          {ex.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — charts */}
          <div className="space-y-6">
            {!selectedEx ? (
              <div className="card flex items-center justify-center h-64">
                <div className="text-center">
                  <TrendingUp size={32} className="text-gym-muted mx-auto mb-3"/>
                  <p className="text-white font-medium mb-1">
                    Select an exercise
                  </p>
                  <p className="text-gym-muted text-sm">
                    Choose an exercise from the left to see your progress charts
                  </p>
                </div>
              </div>
            ) : chartLoading ? (
              <div className="card flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-gym-accent
                                border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : (
              <>
                {/* Weight over time */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Weight Over Time
                      </h3>
                      <p className="text-xs text-gym-muted mt-0.5">
                        Max weight per session — {selectedEx.name}
                      </p>
                    </div>
                    <span className="text-xs bg-gym-accent/10 text-gym-accent
                                     px-2.5 py-1 rounded-lg">
                      {progressData.length} sessions
                    </span>
                  </div>
                  <WeightChart data={progressData} color="#e85d04"/>
                </div>

                {/* Volume per session */}
                <div className="card">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-white">
                      Volume Per Session
                    </h3>
                    <p className="text-xs text-gym-muted mt-0.5">
                      Total lbs moved (sets × reps × weight)
                    </p>
                  </div>
                  <VolumeChart data={progressData} color="#6366f1"/>
                </div>

                {/* Estimated 1RM */}
                <div className="card">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-white">
                      Estimated 1-Rep Max
                    </h3>
                    <p className="text-xs text-gym-muted mt-0.5">
                      Calculated using the Epley formula
                    </p>
                  </div>
                  <OneRMChart data={progressData} color="#22c55e"/>
                </div>

                {/* No data state */}
                {progressData.length === 0 && (
                  <div className="card text-center py-12">
                    <TrendingUp size={32}
                                className="text-gym-muted mx-auto mb-3"/>
                    <p className="text-white font-medium mb-1">
                      No data for {selectedEx.name} yet
                    </p>
                    <p className="text-gym-muted text-sm">
                      Log a workout for this exercise to see your charts
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Weekly history table */}
        {weeklySummary.length > 0 && (
          <div className="card mt-6">
            <h2 className="text-sm font-semibold text-white mb-4">
              Weekly Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {['Week', 'Sessions', 'Total sets', 'Volume'].map(h => (
                <span key={h}
                      className="text-xs font-medium text-gym-muted
                                 uppercase tracking-wide">
                  {h}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              {weeklySummary.map((week, i) => {
                const [year, weekNum] = week.week.split('-')
                return (
                  <div key={week.week}
                       className={`grid grid-cols-4 gap-2 py-2.5 px-3
                                   rounded-xl transition-colors
                                   ${i === 0
                                     ? 'bg-gym-accent/5 border border-gym-accent/20'
                                     : 'hover:bg-white/5'
                                   }`}>
                    <span className="text-sm text-white">
                      {i === 0 ? 'This week' : i === 1 ? 'Last week' : `Week ${weekNum}`}
                    </span>
                    <span className="text-sm text-white">
                      {week.sessionCount}
                    </span>
                    <span className="text-sm text-white">
                      {week.totalSets}
                    </span>
                    <span className="text-sm text-gym-accent font-medium">
                      {week.totalVolume
                        ? `${Math.round(week.totalVolume).toLocaleString()} lbs`
                        : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

function SummaryCard({ icon, label, value, valueColor = 'text-white' }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gym-muted">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}