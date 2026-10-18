import { useState } from 'react'
import { Logo } from '../components/Logo'
import { FilledButton, OutlinedButton } from '../components/Button'
import { GoogleIcon } from '../components/GoogleIcon'
import { supabase, supabaseConfigured } from '../lib/supabase'

export function Login() {
  const [mode, setMode] = useState('sign-in') // sign-in | sign-up
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | error | check-email
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (oauthError) {
      setError(oauthError.message)
      setStatus('error')
      setGoogleLoading(false)
    }
    // On success the browser navigates away to Google, so there's nothing
    // more to do here — it lands back on this app already signed in.
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setStatus('loading')
    setError('')

    if (mode === 'sign-up') {
      const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password })
      if (signUpError) {
        setStatus('error')
        setError(signUpError.message)
        return
      }
      setStatus('check-email')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (signInError) {
      setStatus('error')
      setError(signInError.message)
      return
    }
    setStatus('idle')
  }

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Logo size={28} className="text-deep-indigo" />
        <p className="mt-6 font-body text-sm text-black/60">
          Supabase isn't configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file and restart
          the app.
        </p>
      </div>
    )
  }

  if (status === 'check-email') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Logo size={28} className="text-deep-indigo" />
        <h1 className="mt-6 font-display text-xl font-semibold text-ink-black">Check your email</h1>
        <p className="mt-2 font-body text-sm text-black/60">
          We sent a confirmation link to {email}. Follow it, then come back and sign in.
        </p>
        <button
          type="button"
          onClick={() => {
            setMode('sign-in')
            setStatus('idle')
          }}
          className="mt-6 font-label text-xs uppercase tracking-label text-deep-indigo"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <Logo size={26} className="text-deep-indigo" />
        <h1 className="mt-6 font-display text-2xl font-semibold text-ink-black">
          {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-1 font-body text-sm text-black/60">
          {mode === 'sign-in'
            ? 'Sign in to pick up where you left off.'
            : 'Your studies, prayers and journal will be saved to this account.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <label className="block">
            <span className="font-label text-[11px] uppercase tracking-label text-black/40">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-card border border-black/10 bg-white px-3 py-2.5 font-body text-sm focus:outline-none focus:border-deep-indigo"
            />
          </label>

          <label className="block">
            <span className="font-label text-[11px] uppercase tracking-label text-black/40">Password</span>
            <input
              type="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="mt-1 w-full rounded-card border border-black/10 bg-white px-3 py-2.5 font-body text-sm focus:outline-none focus:border-deep-indigo"
            />
          </label>

          {status === 'error' && <p className="font-body text-sm text-burnt-orange">{error}</p>}

          <FilledButton type="submit" disabled={status === 'loading'} className="mt-2 w-full">
            {status === 'loading' ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
          </FilledButton>
        </form>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10" />
          <span className="font-label text-[10px] uppercase tracking-label text-black/30">or</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <OutlinedButton
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="mt-5 w-full"
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </OutlinedButton>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'))
            setStatus('idle')
            setError('')
          }}
          className="mt-5 w-full text-center font-body text-sm text-black/60"
        >
          {mode === 'sign-in' ? (
            <>
              New here? <span className="font-semibold text-deep-indigo">Create an account</span>
            </>
          ) : (
            <>
              Already have an account? <span className="font-semibold text-deep-indigo">Sign in</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
