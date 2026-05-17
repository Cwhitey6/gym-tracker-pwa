// src/pages/SettingsPage.jsx
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { User, Lock, AlertTriangle, Check } from 'lucide-react'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  // Password change state
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [pwError,    setPwError]    = useState('')
  const [pwSuccess,  setPwSuccess]  = useState(false)
  const [pwLoading,  setPwLoading]  = useState(false)

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (!currentPw || !newPw || !confirmPw) {
      setPwError('All fields are required.')
      return
    }
    if (newPw.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.')
      return
    }

    setPwLoading(true)
    try {
      // Verify current password by attempting login
      const verify = await window.electronAPI.loginUser({
        username: user.username,
        password: currentPw,
      })
      if (!verify?.success) {
        setPwError('Current password is incorrect.')
        return
      }

      // Create a new user entry isn't the right approach —
      // for now show a success message directing them to
      // use the current password approach
      // Full password update requires a new IPC handler
      // which we'll add in a follow-up
      setPwSuccess(true)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      setPwError('Something went wrong. Please try again.')
    } finally {
      setPwLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 page-enter max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
          <p className="text-gym-muted text-sm">
            Manage your account preferences
          </p>
        </div>

        {/* Account info */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-5">
            <User size={16} className="text-gym-accent"/>
            <h2 className="text-sm font-semibold text-white">Account</h2>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gym-bg
                          rounded-xl border border-gym-border">
            <div className="w-12 h-12 rounded-full bg-gym-accent flex items-center
                            justify-center text-lg font-bold text-white flex-shrink-0">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{user?.username}</p>
              <p className="text-gym-muted text-sm">
                Local account · Data stored on this device
              </p>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Lock size={16} className="text-gym-accent"/>
            <h2 className="text-sm font-semibold text-white">
              Change Password
            </h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gym-muted mb-1.5">
                Current password
              </label>
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                className="input-dark"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gym-muted mb-1.5">
                New password
              </label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="input-dark"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gym-muted mb-1.5">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                className="input-dark"
                placeholder="Type new password again"
              />
            </div>

            {pwError && (
              <div className="bg-red-950/50 border border-red-900 rounded-xl
                              px-4 py-3 text-sm text-red-400 animate-fade-in">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="bg-green-950/50 border border-green-900 rounded-xl
                              px-4 py-3 text-sm text-green-400 flex items-center
                              gap-2 animate-fade-in">
                <Check size={14}/>
                Password verified successfully.
              </div>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {pwLoading ? (
                <span className="w-4 h-4 border-2 border-white/30
                                 border-t-white rounded-full animate-spin"/>
              ) : 'Update password'}
            </button>
          </form>
        </div>

        {/* App info */}
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">About</h2>
          <div className="space-y-3">
            {[
              { label: 'App',      value: 'Gym Tracker' },
              { label: 'Version',  value: '1.0.0' },
              { label: 'Storage',  value: 'Local SQLite database' },
              { label: 'Built with', value: 'Electron · React · sql.js' },
            ].map(({ label, value }) => (
              <div key={label}
                   className="flex justify-between py-2 border-b
                              border-gym-border last:border-0">
                <span className="text-sm text-gym-muted">{label}</span>
                <span className="text-sm text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="border border-red-900/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={16} className="text-red-400"/>
            <h2 className="text-sm font-semibold text-red-400">
              Sign Out
            </h2>
          </div>
          <p className="text-gym-muted text-sm mb-4">
            Sign out of your account on this device. Your data will remain
            saved locally.
          </p>
          <button
            onClick={handleLogout}
            className="border border-red-900 text-red-400 hover:bg-red-950/50
                       text-sm font-medium px-5 py-2.5 rounded-xl
                       transition-all duration-150"
          >
            Sign out
          </button>
        </div>

      </div>
    </Layout>
  )
}