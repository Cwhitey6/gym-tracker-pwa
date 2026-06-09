/**
 * App.jsx
 * 
 * The root of the app. Wraps everything in AuthProvider so any component
 * can access the logged in user via useAuth(). Defines all the routes and
 * which pages they render. Every page except the login screen is wrapped
 * in ProtectedRoute which redirects you to login if you're not signed in.
 * 
 * Route structure:
 * /                 login screen
 * /dashboard        main dashboard with body diagram and recent workouts
 * /group/:id        exercises for a specific muscle group
 * /exercise/:id     exercise detail page with logging and history
 * /live-workout     live workout mode with stopwatch
 * /progress         progress charts and weekly summary
 * /history          full workout history grouped by date
 * /exercises        browse and manage all exercises
 * /settings         account settings and sign out
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute   from '@/components/ProtectedRoute'
import LoginPage        from '@/pages/LoginPage'
import DashboardPage    from '@/pages/DashboardPage'
import MuscleGroupPage  from '@/pages/MuscleGroupPage'
import ExercisePage     from '@/pages/ExercisePage'
import ProgressPage     from '@/pages/ProgressPage'
import HistoryPage      from '@/pages/HistoryPage'
import ExercisesPage    from '@/pages/ExercisesPage'
import SettingsPage     from '@/pages/SettingsPage'
import LiveWorkoutPage  from '@/pages/LiveWorkoutPage'

export default function App() {
  return (
    // AuthProvider wraps the whole app so every page can access the current user
    <AuthProvider>
      <Routes>

        {/* public route - the only page you can reach without being logged in */}
        <Route path="/" element={<LoginPage/>}/>

        {/* protected routes - ProtectedRoute redirects to / if not logged in */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage/></ProtectedRoute>
        }/>
        <Route path="/group/:id" element={
          <ProtectedRoute><MuscleGroupPage/></ProtectedRoute>
        }/>
        <Route path="/exercise/:id" element={
          <ProtectedRoute><ExercisePage/></ProtectedRoute>
        }/>
        <Route path="/live-workout" element={
          <ProtectedRoute><LiveWorkoutPage/></ProtectedRoute>
        }/>
        <Route path="/progress" element={
          <ProtectedRoute><ProgressPage/></ProtectedRoute>
        }/>
        <Route path="/history" element={
          <ProtectedRoute><HistoryPage/></ProtectedRoute>
        }/>
        <Route path="/exercises" element={
          <ProtectedRoute><ExercisesPage/></ProtectedRoute>
        }/>
        <Route path="/settings" element={
          <ProtectedRoute><SettingsPage/></ProtectedRoute>
        }/>

        {/* catch-all redirect - any unknown URL goes back to login */}
        <Route path="*" element={<Navigate to="/" replace/>}/>

      </Routes>
    </AuthProvider>
  )
}