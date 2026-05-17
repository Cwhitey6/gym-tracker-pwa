// src/db/database.js
// Dexie.js wraps IndexedDB with a clean API very similar to what we had
// with sql.js. IndexedDB is built into every browser including Safari on iPhone.
// Data persists across sessions just like the SQLite file did on desktop.

import Dexie from 'dexie'
import bcrypt from 'bcryptjs'

// Create and define the database schema
const db = new Dexie('GymTrackerDB')

// Version 1 — our full schema
// The ++ means auto-increment primary key
// & means unique index
// * means multi-entry index
db.version(1).stores({
  users:            '++id, &username',
  muscle_groups:    '++id, &name',
  exercises:        '++id, name, muscle_group_id, type',
  workout_sessions: '++id, user_id, exercise_id, date',
  sets:             '++id, session_id, set_number',
  personal_records: '++id, [user_id+exercise_id]',
})

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA — runs once when the database is first created
// ─────────────────────────────────────────────────────────────────────────────
async function seedIfEmpty() {
  const count = await db.muscle_groups.count()
  if (count > 0) return

  console.log('🌱 Seeding data...')

  const groupIds = await db.muscle_groups.bulkAdd([
    { name: 'Shoulders & Traps',       color: '#6366f1' },
    { name: 'Back, Biceps & Forearms', color: '#06b6d4' },
    { name: 'Chest & Triceps',         color: '#e85d04' },
    { name: 'Legs',                    color: '#22c55e' },
    { name: 'Cardio',                  color: '#f59e0b' },
  ], { allKeys: true })

  const [shoulders, back, chest, legs, cardio] = groupIds

  await db.exercises.bulkAdd([
    { name: 'Shoulder Press',         muscle_group_id: shoulders, type: 'weight' },
    { name: 'Lateral Raise',          muscle_group_id: shoulders, type: 'weight' },
    { name: 'Rear Delt Fly',          muscle_group_id: shoulders, type: 'weight' },
    { name: 'Shrugs',                 muscle_group_id: shoulders, type: 'weight' },
    { name: 'Front Raise',            muscle_group_id: shoulders, type: 'weight' },
    { name: 'Face Pull',              muscle_group_id: shoulders, type: 'weight' },
    { name: 'Pull-Ups',               muscle_group_id: back,      type: 'weight' },
    { name: 'Lat Pulldown',           muscle_group_id: back,      type: 'weight' },
    { name: 'Barbell Row',            muscle_group_id: back,      type: 'weight' },
    { name: 'Seated Cable Row',       muscle_group_id: back,      type: 'weight' },
    { name: 'Dumbbell Curl',          muscle_group_id: back,      type: 'weight' },
    { name: 'Hammer Curl',            muscle_group_id: back,      type: 'weight' },
    { name: 'Wrist Curls',            muscle_group_id: back,      type: 'weight' },
    { name: 'Bench Press',            muscle_group_id: chest,     type: 'weight' },
    { name: 'Incline Dumbbell Press', muscle_group_id: chest,     type: 'weight' },
    { name: 'Chest Fly',              muscle_group_id: chest,     type: 'weight' },
    { name: 'Cable Crossover',        muscle_group_id: chest,     type: 'weight' },
    { name: 'Tricep Pushdown',        muscle_group_id: chest,     type: 'weight' },
    { name: 'Skull Crushers',         muscle_group_id: chest,     type: 'weight' },
    { name: 'Dips',                   muscle_group_id: chest,     type: 'weight' },
    { name: 'Squat',                  muscle_group_id: legs,      type: 'weight' },
    { name: 'Leg Press',              muscle_group_id: legs,      type: 'weight' },
    { name: 'Romanian Deadlift',      muscle_group_id: legs,      type: 'weight' },
    { name: 'Leg Curl',               muscle_group_id: legs,      type: 'weight' },
    { name: 'Leg Extension',          muscle_group_id: legs,      type: 'weight' },
    { name: 'Calf Raise',             muscle_group_id: legs,      type: 'weight' },
    { name: 'Hip Thrust',             muscle_group_id: legs,      type: 'weight' },
    { name: 'Running',                muscle_group_id: cardio,    type: 'time'   },
    { name: 'Biking',                 muscle_group_id: cardio,    type: 'time'   },
    { name: 'Stairmaster',            muscle_group_id: cardio,    type: 'time'   },
    { name: 'Rowing',                 muscle_group_id: cardio,    type: 'time'   },
    { name: 'Jump Rope',              muscle_group_id: cardio,    type: 'time'   },
    { name: 'Plank',                  muscle_group_id: cardio,    type: 'time'   },
  ])

  console.log('✅ Seed complete')
}

// Initialize on import
seedIfEmpty().catch(console.error)

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export async function createUser({ username, password }) {
  try {
    const existing = await db.users.where('username').equals(username).first()
    if (existing) return { success: false, error: 'Username already taken' }
    const hash = await bcrypt.hash(password, 10)
    const id   = await db.users.add({ username, password: hash,
                                      created_at: new Date().toISOString() })
    return { success: true, user: { id, username } }
  } catch (err) {
    return { success: false, error: 'Failed to create account' }
  }
}

export async function loginUser({ username, password }) {
  try {
    const user = await db.users.where('username').equals(username).first()
    if (!user) return { success: false, error: 'Incorrect username or password' }
    const match = await bcrypt.compare(password, user.password)
    if (!match)  return { success: false, error: 'Incorrect username or password' }
    return { success: true, user: { id: user.id, username: user.username } }
  } catch (err) {
    return { success: false, error: 'Login failed' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MUSCLE GROUPS & EXERCISES
// ─────────────────────────────────────────────────────────────────────────────
export async function getMuscleGroups() {
  try {
    const data = await db.muscle_groups.orderBy('id').toArray()
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function getExercises(muscleGroupId) {
  try {
    const groups    = await db.muscle_groups.toArray()
    const groupMap  = Object.fromEntries(groups.map(g => [g.id, g]))

    const exercises = muscleGroupId
      ? await db.exercises.where('muscle_group_id').equals(muscleGroupId).toArray()
      : await db.exercises.toArray()

    const data = exercises
      .map(ex => ({
        ...ex,
        groupName: groupMap[ex.muscle_group_id]?.name  ?? '',
        color:     groupMap[ex.muscle_group_id]?.color ?? '#e85d04',
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function addExercise({ name, muscleGroupId, type = 'weight' }) {
  try {
    const existing = await db.exercises
      .where('muscle_group_id').equals(muscleGroupId)
      .filter(e => e.name === name)
      .first()
    if (existing) return { success: false, error: 'Exercise already exists in this group' }
    const id = await db.exercises.add({
      name, muscle_group_id: muscleGroupId, type,
      created_at: new Date().toISOString(),
    })
    return { success: true, id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function deleteExercise(id) {
  try {
    await db.exercises.delete(id)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT SESSIONS
// ─────────────────────────────────────────────────────────────────────────────
export async function getSessions(userId) {
  try {
    const sessions  = await db.workout_sessions
      .where('user_id').equals(userId).toArray()
    const exercises = await db.exercises.toArray()
    const groups    = await db.muscle_groups.toArray()
    const exMap     = Object.fromEntries(exercises.map(e => [e.id, e]))
    const grMap     = Object.fromEntries(groups.map(g => [g.id, g]))

    const data = await Promise.all(
      sessions.map(async s => {
        const sets     = await db.sets.where('session_id').equals(s.id).toArray()
        const ex       = exMap[s.exercise_id] ?? {}
        const gr       = grMap[ex.muscle_group_id] ?? {}
        const volume   = sets.reduce((sum, set) => sum + set.weight * set.reps, 0)
        return {
          id:           s.id,
          date:         s.date,
          notes:        s.notes,
          exerciseName: ex.name     ?? '',
          groupName:    gr.name     ?? '',
          setCount:     sets.length,
          volume,
        }
      })
    )

    return {
      success: true,
      data: data.sort((a, b) => new Date(b.date) - new Date(a.date)),
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function createSession({ userId, exerciseId, date, notes }) {
  try {
    const id = await db.workout_sessions.add({
      user_id: userId, exercise_id: exerciseId,
      date, notes: notes ?? '',
      created_at: new Date().toISOString(),
    })
    return { success: true, id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function updateSession({ id, date, notes }) {
  try {
    await db.workout_sessions.update(id, { date, notes })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function deleteSession(id) {
  try {
    await db.sets.where('session_id').equals(id).delete()
    await db.workout_sessions.delete(id)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SETS
// ─────────────────────────────────────────────────────────────────────────────
export async function getSets(sessionId) {
  try {
    const data = await db.sets
      .where('session_id').equals(sessionId)
      .sortBy('set_number')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function createSet({ sessionId, setNumber, reps, weight, rpe, duration }) {
  try {
    const id = await db.sets.add({
      session_id: sessionId, set_number: setNumber,
      reps: reps ?? 0, weight: weight ?? 0,
      duration: duration ?? 0, rpe: rpe ?? null,
      created_at: new Date().toISOString(),
    })
    return { success: true, id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function updateSet({ id, reps, weight, rpe, duration }) {
  try {
    await db.sets.update(id, {
      reps: reps ?? 0, weight: weight ?? 0,
      rpe: rpe ?? null, duration: duration ?? 0,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function deleteSet(id) {
  try {
    await db.sets.delete(id)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL RECORDS
// ─────────────────────────────────────────────────────────────────────────────
export async function getPersonalRecord({ userId, exerciseId }) {
  try {
    const pr = await db.personal_records
      .where('[user_id+exercise_id]').equals([userId, exerciseId]).first()
    return { success: true, data: pr ?? null }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function updatePersonalRecord({ userId, exerciseId, weight, reps }) {
  try {
    const existing = await db.personal_records
      .where('[user_id+exercise_id]').equals([userId, exerciseId]).first()

    if (!existing || weight > existing.weight) {
      if (existing) {
        await db.personal_records.update(existing.id, {
          weight, reps, achieved_at: new Date().toISOString()
        })
      } else {
        await db.personal_records.add({
          user_id: userId, exercise_id: exerciseId,
          weight, reps, achieved_at: new Date().toISOString(),
        })
      }
      return { success: true, newRecord: true }
    }
    return { success: true, newRecord: false }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS & SUMMARIES
// ─────────────────────────────────────────────────────────────────────────────
export async function getProgress({ userId, exerciseId }) {
  try {
    const sessions = await db.workout_sessions
      .where('user_id').equals(userId)
      .filter(s => s.exercise_id === exerciseId)
      .toArray()

    const data = await Promise.all(
      sessions.map(async s => {
        const sets = await db.sets.where('session_id').equals(s.id).toArray()
        if (!sets.length) return null
        const maxWeight   = Math.max(...sets.map(s => s.weight))
        const volume      = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
        const max1rm      = Math.max(...sets.map(s =>
          s.reps === 1 ? s.weight : s.weight * (1 + s.reps / 30)
        ))
        return {
          date:         s.date,
          maxWeight,
          volume,
          estimated1rm: Math.round(max1rm * 10) / 10,
        }
      })
    )

    return {
      success: true,
      data: data
        .filter(Boolean)
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function getRecentSessionForExercise({ userId, exerciseId }) {
  try {
    const sessions = await db.workout_sessions
      .where('user_id').equals(userId)
      .filter(s => s.exercise_id === exerciseId)
      .toArray()

    if (!sessions.length) return { success: true, data: null }

    const latest = sessions.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )[0]

    const sets = await db.sets
      .where('session_id').equals(latest.id)
      .sortBy('set_number')

    return {
      success: true,
      data: { sessionId: latest.id, date: latest.date, notes: latest.notes, sets },
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function getWeeklySummary(userId) {
  try {
    const sessions = await db.workout_sessions
      .where('user_id').equals(userId).toArray()

    const weekMap = {}
    await Promise.all(
      sessions.map(async s => {
        const d    = new Date(s.date)
        const year = d.getFullYear()
        const week = Math.ceil(
          ((d - new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7
        )
        const key  = `${year}-${String(week).padStart(2, '0')}`
        const sets = await db.sets.where('session_id').equals(s.id).toArray()
        const vol  = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)

        if (!weekMap[key]) {
          weekMap[key] = { week: key, sessionCount: 0, totalVolume: 0, totalSets: 0 }
        }
        weekMap[key].sessionCount++
        weekMap[key].totalVolume += vol
        weekMap[key].totalSets  += sets.length
      })
    )

    const data = Object.values(weekMap)
      .sort((a, b) => b.week.localeCompare(a.week))
      .slice(0, 12)

    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}