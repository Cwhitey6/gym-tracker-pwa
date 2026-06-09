/**
 * database.js
 * 
 * Every single database function the app uses lives here.
 * This talks to Supabase (a cloud PostgreSQL database) so 
 * data syncs across mobile and laptop automatically.
 * 
 * Every function follows the same pattern:
 * - returns { success: true, data: ... } when it works
 * - returns { success: false, error: ... } when something goes wrong
 * - wrapped in try/catch so a failed DB call never crashes the whole app
 */

import { supabase } from './supabase.js'

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

// creates a new account in Supabase
// Usernames as "(user)@gymtracker.local" since Supabase auth
// requires an email format a fake domain is used
export async function createUser({ username, password }) {
  try {
    const email = `${username.toLowerCase()}@gymtracker.local`
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      if (error.message.includes('already registered')) {
        return { success: false, error: 'Username already taken' }
      }
      return { success: false, error: error.message }
    }
    return { success: true, user: { id: data.user.id, username } }
  } catch {
    return { success: false, error: 'Failed to create account' }
  }
}

// signs in with an existing account
// strips the fake email domain before returning the username
export async function loginUser({ username, password }) {
  try {
    const email = `${username.toLowerCase()}@gymtracker.local`
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: 'Incorrect username or password' }
    return { success: true, user: { id: data.user.id, username } }
  } catch {
    return { success: false, error: 'Login failed' }
  }
}

// signs out of Supabase - clears the session from localStorage
export async function logoutUser() {
  await supabase.auth.signOut()
}

// ─────────────────────────────────────────────────────────────────────────────
// MUSCLE GROUPS & EXERCISES
// ─────────────────────────────────────────────────────────────────────────────

// fetches all 5 muscle groups in order
export async function getMuscleGroups() {
  try {
    const { data, error } = await supabase
      .from('muscle_groups')
      .select('*')
      .order('id')
    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// fetches exercises - either all of them or filtered by muscle group
// also pulls in the muscle group name and color via a join
export async function getExercises(muscleGroupId) {
  try {
    let query = supabase
      .from('exercises')
      .select('*, muscle_groups(name, color)')
      .order('name')

    // if a muscle group id was passed in, filter to just that group
    if (muscleGroupId) {
      query = query.eq('muscle_group_id', muscleGroupId)
    }

    const { data, error } = await query
    if (error) return { success: false, error: error.message }

    // flatten the nested muscle_groups object into top level fields
    // so components can just use ex.groupName and ex.color directly
    const formatted = data.map(ex => ({
      ...ex,
      groupName: ex.muscle_groups?.name  ?? '',
      color:     ex.muscle_groups?.color ?? '#e85d04',
    }))

    return { success: true, data: formatted }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// adds a new exercise to the database
// type is either 'weight' (tracks lbs × reps) or 'time' (tracks seconds)
export async function addExercise({ name, muscleGroupId, type = 'weight' }) {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .insert({ name, muscle_group_id: muscleGroupId, type })
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    return { success: true, id: data.id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// permanently deletes an exercise
// Supabase cascades the delete to any sessions logged for this exercise
export async function deleteExercise(id) {
  try {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

// fetches all sessions for a user, newest first
// also pulls in the exercise name, muscle group name, and all sets
// via nested selects (Supabase's version of SQL joins)
export async function getSessions(userId) {
  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        exercises (
          name,
          muscle_groups ( name )
        ),
        sets ( id, weight, reps, duration )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }

    // flatten the nested data and calculate volume for each session
    const formatted = data.map(s => {
      const volume = (s.sets ?? []).reduce(
        (sum, set) => sum + set.weight * set.reps, 0
      )
      return {
        id:           s.id,
        date:         s.date,
        notes:        s.notes,
        exerciseName: s.exercises?.name ?? '',
        groupName:    s.exercises?.muscle_groups?.name ?? '',
        setCount:     s.sets?.length ?? 0,
        volume,
        sets:         s.sets ?? [],
      }
    })

    return { success: true, data: formatted }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// groups sessions by date so we can count unique workout days
// used by the dashboard to show "X workouts" instead of counting
// every individual exercise session as a separate workout
export async function getWorkoutDays(userId) {
  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`id, date, exercise_id, sets ( weight, reps )`)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }

    // build a map where each key is a date and the value is
    // the combined stats for all exercises logged that day
    const dayMap = {}
    data.forEach(s => {
      const volume = (s.sets ?? []).reduce(
        (sum, set) => sum + set.weight * set.reps, 0
      )
      if (!dayMap[s.date]) {
        dayMap[s.date] = { date: s.date, exercises: [], setCount: 0, volume: 0 }
      }
      dayMap[s.date].exercises.push(s.exercise_id)
      dayMap[s.date].setCount += s.sets?.length ?? 0
      dayMap[s.date].volume   += volume
    })

    // convert the map to an array sorted newest first
    const result = Object.values(dayMap)
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// creates a new workout session for one exercise on one day
// returns the new session's id so we can attach sets to it right after
export async function createSession({ userId, exerciseId, date, notes }) {
  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({ user_id: userId, exercise_id: exerciseId, date, notes: notes ?? '' })
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    return { success: true, id: data.id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// updates the date or notes on an existing session
export async function updateSession({ id, date, notes }) {
  try {
    const { error } = await supabase
      .from('workout_sessions')
      .update({ date, notes })
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// permanently deletes a session
// Supabase cascades the delete to all sets in that session
export async function deleteSession(id) {
  try {
    const { error } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SETS
// ─────────────────────────────────────────────────────────────────────────────

// fetches all sets for a given session, ordered by set number
export async function getSets(sessionId) {
  try {
    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .eq('session_id', sessionId)
      .order('set_number')
    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// adds a new set to a session
// weight-based exercises use reps + weight, time-based use duration (in seconds)
// the unused fields default to 0 so the database stays consistent
export async function createSet({ sessionId, setNumber, reps, weight, rpe, duration }) {
  try {
    const { data, error } = await supabase
      .from('sets')
      .insert({
        session_id: sessionId,
        set_number: setNumber,
        reps:       reps     ?? 0,
        weight:     weight   ?? 0,
        duration:   duration ?? 0,
        rpe:        rpe      ?? null,
      })
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    return { success: true, id: data.id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// updates an existing set's reps, weight, rpe, or duration
export async function updateSet({ id, reps, weight, rpe, duration }) {
  try {
    const { error } = await supabase
      .from('sets')
      .update({
        reps:     reps     ?? 0,
        weight:   weight   ?? 0,
        rpe:      rpe      ?? null,
        duration: duration ?? 0,
      })
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// permanently deletes a single set
export async function deleteSet(id) {
  try {
    const { error } = await supabase.from('sets').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL RECORDS
// ─────────────────────────────────────────────────────────────────────────────

// fetches the current PR for a specific exercise
// PGRST116 just means "no row found" which means no PR yet
export async function getPersonalRecord({ userId, exerciseId }) {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .single()
    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message }
    }
    return { success: true, data: data ?? null }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// only updates the PR if the new weight is heavier than the current best
// upsert means "insert if it doesn't exist, update if it does"
export async function updatePersonalRecord({ userId, exerciseId, weight, reps }) {
  try {
    const existing = await getPersonalRecord({ userId, exerciseId })
    if (!existing.data || weight > existing.data.weight) {
      const { error } = await supabase
        .from('personal_records')
        .upsert({
          user_id:     userId,
          exercise_id: exerciseId,
          weight,
          reps,
          achieved_at: new Date().toISOString(),
        }, { onConflict: 'user_id,exercise_id' })
      if (error) return { success: false, error: error.message }
      return { success: true, newRecord: true }
    }
    // weight wasn't heavier - no update needed
    return { success: true, newRecord: false }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS & SUMMARIES
// ─────────────────────────────────────────────────────────────────────────────

// fetches progress data for a specific exercise over time
// used by the three charts on the Progress page
// calculates max weight, total volume, and estimated 1RM per session
export async function getProgress({ userId, exerciseId }) {
  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`date, sets ( weight, reps )`)
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .order('date')

    if (error) return { success: false, error: error.message }

    const result = data
      .filter(s => s.sets?.length > 0) // skip sessions with no sets
      .map(s => {
        const maxWeight = Math.max(...s.sets.map(x => x.weight))
        const volume    = s.sets.reduce((sum, x) => sum + x.weight * x.reps, 0)
        // Epley formula: weight × (1 + reps/30)
        // if it was a true 1RM (1 rep) just use the weight directly
        const max1rm    = Math.max(...s.sets.map(x =>
          x.reps === 1 ? x.weight : x.weight * (1 + x.reps / 30)
        ))
        return {
          date:         s.date,
          maxWeight,
          volume,
          estimated1rm: Math.round(max1rm * 10) / 10,
        }
      })

    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// fetches the most recent session for a specific exercise
// used on ExercisePage to show what you did last time
export async function getRecentSessionForExercise({ userId, exerciseId }) {
  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`id, date, notes, sets ( set_number, reps, weight, duration )`)
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .order('date', { ascending: false })
      .limit(1)
      .single()

    // PGRST116 means no sessions found yet 
    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message }
    }
    if (!data) return { success: true, data: null }

    return {
      success: true,
      data: {
        sessionId: data.id,
        date:      data.date,
        notes:     data.notes,
        sets:      data.sets ?? [],
      }
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// fetches a weekly training summary for the last 12 weeks
// groups sessions by week and counts unique workout days so that
// a live workout with 3 exercises still counts as 1 workout day
export async function getWeeklySummary(userId) {
  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`date, sets ( weight, reps )`)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }

    const weekMap = {}
    data.forEach(s => {
      // figure out which week of the year this date falls in
      const d    = new Date(s.date)
      const year = d.getFullYear()
      const week = Math.ceil(
        ((d - new Date(year, 0, 1)) / 86400000 +
          new Date(year, 0, 1).getDay() + 1) / 7
      )
      // key format: "2024-03" (year-weeknumber)
      const key = `${year}-${String(week).padStart(2, '0')}`
      const vol = (s.sets ?? []).reduce((sum, x) => sum + x.weight * x.reps, 0)

      if (!weekMap[key]) {
        weekMap[key] = {
          week:        key,
          sessionCount: 0,
          totalVolume:  0,
          totalSets:    0,
          // Set automatically deduplicates dates so 3 exercises on
          // the same day still counts as 1 workout day
          days: new Set()
        }
      }
      weekMap[key].days.add(s.date)
      weekMap[key].totalVolume += vol
      weekMap[key].totalSets  += s.sets?.length ?? 0
    })

    const result = Object.values(weekMap)
      .map(w => ({
        week:         w.week,
        sessionCount: w.days.size, // unique days, not session count
        totalVolume:  w.totalVolume,
        totalSets:    w.totalSets,
      }))
      .sort((a, b) => b.week.localeCompare(a.week))
      .slice(0, 12) // only show the last 12 weeks

    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: err.message }
  }
}