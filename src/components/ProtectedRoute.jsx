/**
 * ProtectedRoute.jsx
 * 
 * A wrapper component that guards any page that requires you to be logged in.
 * If you try to visit a protected page without being logged in, it kicks you
 * back to the login screen automatically. If you are logged in, it just
 * renders the page like normal and gets out of the way.
 * 
 * Every page except the login screen is wrapped in this in App.jsx.
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'

// "children" is the page that gets passed in to be protected
// Example: <ProtectedRoute><DashboardPage/></ProtectedRoute>
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // shows a spinner while checking user credentials
  // this prevents a flash of the login page on refresh before
  // the auth state has had a chance to load
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gym-bg">
        <div className="w-8 h-8 border-2 border-gym-accent border-t-transparent
                        rounded-full animate-spin"/>
      </div>
    )
  }

  // if not logged in redirect to the login page
  // "replace" means it replaces the current history entry so hitting
  // the back button doesn't bring you back to the protected page
  if (!user) {
    return <Navigate to="/" replace/>
  }

  // logged in - render the actual page
  return children
}