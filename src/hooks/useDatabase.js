/**
 * useDatabase.js
 * 
 * A reusable hook that wraps any database call with loading and error state.
 * Instead of writing the same try/catch and loading logic in every single
 * page its handled by this hook.
 * 
 * Usage in any component:
 * const { call, loading, error } = useDatabase()
 * const result = await call(getSessions, user.id)
 */

import { useState, useCallback } from 'react'

export function useDatabase() {
  // true while a database call is in progress
  const [loading, setLoading] = useState(false)
  // holds any error message if the call failed, null if everything is fine
  const [error,   setError]   = useState(null)

  // "call" is the function you use to make a database call
  // it takes any database function as its first argument, then passes
  // the rest of the arguments straight through to that function
  // useCallback makes sure this function reference stays stable
  // between renders so it doesn't cause unnecessary re-renders
  const call = useCallback(async (fn, ...args) => {
    setLoading(true)
    setError(null)

    try {
      const result = await fn(...args)

      // database functions return { success: false, error: '...' }
      // when something goes wrong which is checked here
      if (result && result.success === false) {
        setError(result.error || 'Unknown error')
        return null
      }

      return result
    } catch (err) {
      // something threw an actual exception - store the message
      setError(err.message)
      return null
    } finally {
      // turn off loading for when call finished no matter what
      setLoading(false)
    }
  }, [])

  return { call, loading, error }
}