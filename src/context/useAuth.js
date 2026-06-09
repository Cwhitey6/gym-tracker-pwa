/**
 * useAuth.js
 * 
 * Custom hook that gives any component access to the auth state.
 * Kept in its own file so React's fast refresh works properly.
 * 
 * Usage in any component:
 * const { user, login, logout, loading } = useAuth()
 */

import { useContext } from 'react'
import { AuthContext } from './AuthContextDef'

// throws a clear error if you forget to wrap your app in AuthProvider
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}