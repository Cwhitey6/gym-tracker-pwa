// src/hooks/useDatabase.js
import { useState, useCallback } from 'react'

export function useDatabase() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const call = useCallback(async (fn, ...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn(...args)
      if (result && result.success === false) {
        setError(result.error || 'Unknown error')
        return null
      }
      return result
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { call, loading, error }
}