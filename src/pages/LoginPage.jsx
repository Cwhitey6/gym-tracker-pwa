/**
 * LoginPage.jsx
 * 
 * The first screen you see when you open the app.
 * Has two tabs - sign in and create account - that share the same form.
 * Switching tabs clears the form and swaps the heading and button text.
 * 
 * Passwords are never stored in plain text. Supabase handles all the
 * auth and hashing.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'
import { createUser, loginUser } from '@/db'

// the two possible tab states
const TABS = { SIGNIN: 'signin', SIGNUP: 'signup' }

export default function LoginPage() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [tab,      setTab]      = useState(TABS.SIGNIN)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')  // only shown on the signup tab
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // clears the form and error when switching between sign in and create account
  function switchTab(newTab) {
    setTab(newTab)
    setError('')
    setUsername('')
    setPassword('')
    setConfirm('')
  }

  // runs before submitting to catch obvious issues before hitting the database
  function validate() {
    if (!username.trim())              return 'Username is required'
    if (username.trim().length < 3)    return 'Username must be at least 3 characters'
    if (!password)                     return 'Password is required'
    if (password.length < 6)           return 'Password must be at least 6 characters'
    if (tab === TABS.SIGNUP && password !== confirm) return 'Passwords do not match'
    return null  // no errors
  }

  // handles both sign in and create account depending on the active tab
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const result = tab === TABS.SIGNIN
        ? await loginUser({ username: username.trim(), password })
        : await createUser({ username: username.trim(), password })

      if (result.success) {
        // store the user in AuthContext then go to the dashboard
        login(result.user)
        navigate('/dashboard')
      } else {
        setError(result.error || 'Something went wrong')
      }
    } catch {
      setError('Could not connect. Please check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gym-bg flex items-center justify-center p-4 pt-safe">
      <div className="w-full max-w-sm">

        {/* app logo and name */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gym-accent rounded-xl flex items-center
                          justify-center text-xl">
            🏋️
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">
            Gym Tracker
          </span>
        </div>

        {/* main card */}
        <div className="card animate-fade-in">

          {/* sign in / create account tab switcher */}
          <div className="flex bg-gym-bg rounded-xl p-1 mb-6">
            <button
              onClick={() => switchTab(TABS.SIGNIN)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg
                          transition-all duration-150
                          ${tab === TABS.SIGNIN
                            ? 'bg-gym-surface text-white shadow-sm'
                            : 'text-gym-muted hover:text-white'
                          }`}
            >
              Sign in
            </button>
            <button
              onClick={() => switchTab(TABS.SIGNUP)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg
                          transition-all duration-150
                          ${tab === TABS.SIGNUP
                            ? 'bg-gym-surface text-white shadow-sm'
                            : 'text-gym-muted hover:text-white'
                          }`}
            >
              Create account
            </button>
          </div>

          {/* heading changes based on the active tab */}
          <h1 className="text-2xl font-bold text-white mb-1">
            {tab === TABS.SIGNIN ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gym-muted text-sm mb-6">
            {tab === TABS.SIGNIN
              ? 'Sign in to continue tracking your progress'
              : 'Start tracking your gains today'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* username field */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. Colin"
                className="input-dark"
                autoFocus
                autoComplete="username"
              />
            </div>

            {/* password field */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input-dark"
                autoComplete={tab === TABS.SIGNIN ? 'current-password' : 'new-password'}
              />
            </div>

            {/* confirm password only shows on the create account tab */}
            {tab === TABS.SIGNUP && (
              <div className="animate-slide-up">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Type your password again"
                  className="input-dark"
                  autoComplete="new-password"
                />
              </div>
            )}

            {/* error message */}
            {error && (
              <div className="bg-red-950/50 border border-red-900 rounded-xl
                              px-4 py-3 text-sm text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            {/* submit button shows a spinner while loading */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin"/>
                  {tab === TABS.SIGNIN ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                tab === TABS.SIGNIN ? 'Sign in' : 'Create account'
              )}
            </button>

          </form>
        </div>

        {/* footer note */}
        <p className="text-center text-xs text-gym-muted mt-6">
          Your data is synced securely via Supabase
        </p>

      </div>
    </div>
  )
}