// src/components/ProtectedRoute.jsx
// This component wraps any page that requires login.
// If the user isn't logged in, it redirects them to the login page.
// If they ARE logged in, it renders the page normally.

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // While we're checking sessionStorage, show nothing
  // (avoids a flash of the login page on refresh)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gym-bg">
        <div className="w-8 h-8 border-2 border-gym-accent border-t-transparent
                        rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in — send to login page
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Logged in — render the actual page
  return children
}