/**
 * SettingsPage.jsx
 * 
 * Account settings and app info. Has three sections:
 * - Account: shows your username and avatar
 * - Change password: lets you update your Supabase password
 * - About: app version and tech stack info
 * - Sign out button at the bottom
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'
import { loginUser } from '@/db'
import Layout from '@/components/Layout'
import { User, Lock, AlertTriangle, Check } from 'lucide-react'
import { supabase } from '@/db/supabase'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  // password change form state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError,   setPwError]   = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  // handles the password change form submission
  // first verifies the current password then updates it via Supabase
  async function handlePasswordChange(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    // basic validation before hitting the database
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
      // verify the current password is correct before allowing the change
      const verify = await loginUser({
        username: user.username,
        password: currentPw,
      })
      if (!verify?.success) {
        setPwError('Current password is incorrect.')
        return
      }

      // update the password in Supabase
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) {
        setPwError('Failed to update password. Please try again.')
        return
      }

      // success - clear the form
      setPwSuccess(true)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch {
      setPwError('Something went wrong. Please try again.')
    } finally {
      setPwLoading(false)
    }
  }

  // signs out and redirects to the login screen
  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 page-enter max-w-2xl">

        {/* page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
          <p className="text-gym-muted text-sm">Manage your account preferences</p>
        </div>

        {/* account info card */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-5">
            <User size={16} className="text-gym-accent"/>
            <h2 className="text-sm font-semibold text-white">Account</h2>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gym-bg
                          rounded-xl border border-gym-border">
            {/* avatar using first letter of username */}
            <div className="w-12 h-12 rounded-full bg-gym-accent flex items-center
                            justify-center text-lg font-bold text-white flex-shrink-0">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{user?.username}</p>
              <p className="text-gym-muted text-sm">
                Synced via Supabase
              </p>
            </div>
          </div>
        </div>

        {/* change password card */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Lock size={16} className="text-gym-accent"/>
            <h2 className="text-sm font-semibold text-white">Change Password</h2>
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

            {/* error message */}
            {pwError && (
              <div className="bg-red-950/50 border border-red-900 rounded-xl
                              px-4 py-3 text-sm text-red-400 animate-fade-in">
                {pwError}
              </div>
            )}

            {/* success message */}
            {pwSuccess && (
              <div className="bg-green-950/50 border border-green-900 rounded-xl
                              px-4 py-3 text-sm text-green-400 flex items-center
                              gap-2 animate-fade-in">
                <Check size={14}/>
                Password updated successfully
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

        {/* sign out section */}
        <div className="border border-red-900/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={16} className="text-red-400"/>
            <h2 className="text-sm font-semibold text-red-400">Sign Out</h2>
          </div>
          <p className="text-gym-muted text-sm mb-4">
            Sign out of your account on this device. Your data stays
            saved in Supabase and will be there when you log back in.
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