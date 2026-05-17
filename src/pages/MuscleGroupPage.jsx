// src/pages/MuscleGroupPage.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import { getMuscleGroups, getExercises } from '@/db'

export default function MuscleGroupPage() {
  const { id }      = useParams()
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [group,     setGroup]     = useState(null)
  const [exercises, setExercises] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [groupsRes, exRes] = await Promise.all([
          getMuscleGroups(),
          getExercises(Number(id)),
        ])
        if (groupsRes?.success) {
          setGroup(groupsRes.data.find(g => g.id === Number(id)))
        }
        if (exRes?.success) setExercises(exRes.data)
      } catch(err) {
        console.error('MuscleGroupPage error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  return (
    <Layout>
      <div className="p-4 sm:p-8 page-enter">

        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gym-muted hover:text-white
                     text-sm mb-6 transition-colors duration-150"
        >
          <ArrowLeft size={16}/> Back to dashboard
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{
                 background: (group?.color ?? '#e85d04') + '22',
                 border: `1px solid ${group?.color ?? '#e85d04'}44`
               }}>
            <Dumbbell size={22} style={{ color: group?.color ?? '#e85d04' }}/>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {group?.name ?? 'Loading...'}
            </h1>
            <p className="text-gym-muted text-sm">
              {exercises.length} exercises
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i}
                   className="h-28 bg-gym-surface rounded-2xl animate-pulse"/>
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-white font-medium mb-1">No exercises found</p>
            <p className="text-gym-muted text-sm">
              Group ID: {id}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {exercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => navigate(`/exercise/${ex.id}`)}
                className="card text-left hover:border-gym-muted
                           transition-all duration-150 active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl mb-3 flex items-center
                                justify-center"
                     style={{ background: (group?.color ?? '#e85d04') + '22' }}>
                  <Dumbbell size={16}
                            style={{ color: group?.color ?? '#e85d04' }}/>
                </div>
                <p className="text-sm font-medium text-white
                              group-hover:text-gym-accent transition-colors">
                  {ex.name}
                </p>
                <p className="text-xs text-gym-muted mt-1">Tap to log →</p>
              </button>
            ))}
          </div>
        )}

      </div>
    </Layout>
  )
}