// src/context/AuthContext.jsx
// Context is React's way of sharing data across the entire app
// without passing it as props through every component.
// Think of it as a global variable, but done the React way.

import { createContext, useContext, useState, useEffect } from 'react'

// 1. Create the context object
const AuthContext = createContext(null)

// 2. The Provider wraps your whole app and holds the state
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // null = not logged in
  const [loading, setLoading] = useState(true) // true while we check storage

  // On app startup, check if the user was already logged in
  // (We save to sessionStorage so login persists through hot-reloads in dev)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gym-tracker-user')
      if (saved) {
        setUser(JSON.parse(saved))
      }
    } catch {
      // Corrupted storage — just stay logged out
    } finally {
      setLoading(false)
    }
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('gym-tracker-user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('gym-tracker-user')
  }

  // Expose user, login, logout to any component in the app
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// 3. Custom hook — components call this to access auth state
// Usage:  const { user, login, logout } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}