// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from '@/context/AuthContext'
import ProtectedRoute    from '@/components/ProtectedRoute'
import LoginPage         from '@/pages/LoginPage'
import DashboardPage     from '@/pages/DashboardPage'
import MuscleGroupPage   from '@/pages/MuscleGroupPage'
import ExercisePage      from '@/pages/ExercisePage'
import ProgressPage      from '@/pages/ProgressPage'
import HistoryPage       from '@/pages/HistoryPage'
import ExercisesPage     from '@/pages/ExercisesPage'
import SettingsPage      from '@/pages/SettingsPage'
import LiveWorkoutPage from '@/pages/LiveWorkoutPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        <Route path="/" element={<LoginPage/>}/>

        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage/></ProtectedRoute>
        }/>
        <Route path="/group/:id" element={
          <ProtectedRoute><MuscleGroupPage/></ProtectedRoute>
        }/>
        <Route path="/exercise/:id" element={
          <ProtectedRoute><ExercisePage/></ProtectedRoute>
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
        <Route path="/live-workout" element={
          <ProtectedRoute><LiveWorkoutPage/></ProtectedRoute>
        }/>

        <Route path="*" element={<Navigate to="/" replace/>}/>

      </Routes>
    </AuthProvider>
  )
}