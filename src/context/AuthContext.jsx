/**
 * AuthContext.jsx
 * 
 * The AuthProvider component that wraps the entire app and holds
 * the logged in state. Any component inside the provider can access
 * the current user, login function, and logout function via useAuth().
 * 
 * Uses Supabase's built in auth system so the session persists
 * across page refreshes and app restarts automatically.
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/db/supabase'
import { AuthContext } from './AuthContextDef'

// "children" is the entire app that gets wrapped in this in main.jsx
export function AuthProvider({ children }) {
  // null when logged out, { id, username } when logged in
  const [user, setUser] = useState(null)
  // true while we're checking for an existing session on app load
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // check if there's already an active session when the app loads
    // this is what keeps you logged in when you reopen the app
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // strip the fake email domain to get back just the username
        const username = session.user.email.replace('@gymtracker.local', '').replace(/^\w/, c => c.toUpperCase())
        setUser({ id: session.user.id, username })
      }
      setLoading(false)
    })

    // listen for auth changes while the app is open
    // fires when you log in, log out, or the token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const username = session.user.email.replace('@gymtracker.local', '').replace(/^\w/, c => c.toUpperCase())
          setUser({ id: session.user.id, username })
        } else {
          // session ended - clear the user
          setUser(null)
        }
      }
    )

    // stop listening when the component unmounts
    return () => subscription.unsubscribe()
  }, [])

  // called after a successful sign in from LoginPage
  const login = (userData) => setUser(userData)

  // signs out of Supabase and clears the local user state
  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}