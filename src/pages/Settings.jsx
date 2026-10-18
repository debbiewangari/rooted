import { useEffect, useRef, useState } from 'react'
import { FilledButton, OutlinedButton } from '../components/Button'
import { GoogleIcon } from '../components/GoogleIcon'
import { exportAllData, getProfile, importAllData, removeHeroImage, setHeroImage } from '../lib/db'
import { resizeImage } from '../lib/image'
import * as legacyDb from '../lib/legacyDb'
import { getName, setName } from '../lib/profile'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'

export function Settings() {
  const { user } = useAuth()
  const fileRef = useRef(null)
  const heroFileRef = useRef(null)
  const [status, setStatus] = useState('')
  const [migrateStatus, setMigrateStatus] = useState('idle') // idle | loading | done | error
  const [name, setNameInput] = useState(getName())
  const [nameSaved, setNameSaved] = useState(false)
  const [heroImageUrl, setHeroImageUrl] = useState(null)
  const [heroBusy, setHeroBusy] = useState(false)
  const [heroError, setHeroError] = useState('')
  const [googleBusy, setGoogleBusy] = useState(false)
  const [googleError, setGoogleError] = useState('')

  const hasGoogle = Boolean(user?.identities?.some((i) => i.provider === 'google'))

  async function handleConnectGoogle() {
    setGoogleError('')
    setGoogleBusy(true)
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/settings` },
    })
    if (error) {
      setGoogleError(error.message)
      setGoogleBusy(false)
    }
    // On success the browser navigates to Google and back — nothing more
    // to do here.
  }

  useEffect(() => {
    getProfile()
      .then((p) => {
        setHeroImageUrl(p.heroImageUrl ? `${p.heroImageUrl}?t=${p.heroImageUpdatedAt || 0}` : null)
      })
      .catch(() => {})
  }, [])

  async function handleHeroImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setHeroError('')
    setHeroBusy(true)
    try {
      const resized = await resizeImage(file, 1600)
      const profile = await setHeroImage(resized)
      setHeroImageUrl(`${profile.heroImageUrl}?t=${profile.heroImageUpdatedAt || 0}`)
    } catch {
      setHeroError('Could not update the hero image — try a different file.')
    }
    setHeroBusy(false)
    e.target.value = ''
  }

  async function handleRemoveHeroImage() {
    setHeroError('')
    setHeroBusy(true)
    try {
      await removeHeroImage()
      setHeroImageUrl(null)
    } catch {
      setHeroError('Could not remove the hero image — try again.')
    }
    setHeroBusy(false)
  }

  function handleNameBlur() {
    setName(name)
    setNameInput(getName())
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 1500)
  }

  async function handleExport() {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rooted-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('Importing…')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAllData(data)
      setStatus('Import complete. Reload the app to see everything.')
    } catch {
      setStatus('Could not import that file — make sure it is a Rooted backup JSON.')
    }
    e.target.value = ''
  }

  async function handleMigrateLocalData() {
    setMigrateStatus('loading')
    try {
      const data = await legacyDb.exportAllData()
      await importAllData(data)
      setMigrateStatus('done')
    } catch {
      setMigrateStatus('error')
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <p className="font-label text-xs uppercase tracking-label text-black/40">Settings</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink-black">Account</h1>

      {user && (
        <div className="mt-5 flex items-center justify-between rounded-card border border-black/10 bg-mist px-4 py-3">
          <div className="min-w-0">
            <p className="font-label text-[10px] uppercase tracking-label text-black/40">Signed in as</p>
            <p className="truncate font-body text-sm text-ink-black">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 font-label text-xs uppercase tracking-label text-deep-indigo"
          >
            Sign out
          </button>
        </div>
      )}

      {user && (
        <div className="mt-3 flex items-center justify-between rounded-card border border-black/10 bg-pure-white px-4 py-3">
          <div className="flex items-center gap-2.5">
            <GoogleIcon />
            <p className="font-body text-sm text-ink-black">
              {hasGoogle ? 'Google connected' : 'Sign in with Google'}
            </p>
          </div>
          {!hasGoogle && (
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={googleBusy}
              className="shrink-0 font-label text-xs uppercase tracking-label text-deep-indigo disabled:opacity-50"
            >
              {googleBusy ? 'Redirecting…' : 'Connect'}
            </button>
          )}
        </div>
      )}
      {googleError && <p className="mt-2 font-body text-sm text-burnt-orange">{googleError}</p>}

      <div className="mt-6">
        <label className="font-label text-[11px] uppercase tracking-label text-black/40">Display name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={handleNameBlur}
          className="mt-2 w-full rounded-card border border-black/10 bg-white px-4 py-3 font-body text-sm text-ink-black outline-none focus:border-deep-indigo"
          placeholder="Debbie"
        />
        {nameSaved && <p className="mt-1 font-body text-xs text-deep-indigo">Saved</p>}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink-black">Homepage hero image</h2>
        <p className="mt-1 font-body text-sm text-black/60">Shown behind the greeting at the top of the home page.</p>

        <label className="mt-3 block">
          <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-card border border-dashed border-black/20 bg-pure-white">
            <img
              src={heroImageUrl || '/hero-sunset.jpg'}
              alt="Hero preview"
              className={`h-full w-full object-cover ${heroBusy ? 'opacity-50' : ''}`}
            />
          </div>
          <input
            ref={heroFileRef}
            type="file"
            accept="image/*"
            onChange={handleHeroImageChange}
            disabled={heroBusy}
            className="sr-only"
          />
        </label>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={() => heroFileRef.current?.click()}
            disabled={heroBusy}
            className="font-label text-[11px] uppercase tracking-label text-deep-indigo disabled:opacity-50"
          >
            {heroBusy ? 'Uploading…' : 'Upload image'}
          </button>
          {heroImageUrl && (
            <button
              type="button"
              onClick={handleRemoveHeroImage}
              disabled={heroBusy}
              className="font-label text-[11px] uppercase tracking-label text-black/40 disabled:opacity-50"
            >
              Use default
            </button>
          )}
        </div>
        {heroError && <p className="mt-2 font-body text-sm text-burnt-orange">{heroError}</p>}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink-black">Import local data</h2>
        <p className="mt-1 font-body text-sm text-black/60">
          Bring over studies, themes and events saved on this device before you signed in.
        </p>
        <FilledButton
          type="button"
          onClick={handleMigrateLocalData}
          disabled={migrateStatus === 'loading'}
          className="mt-3 w-full"
        >
          {migrateStatus === 'loading' ? 'Importing…' : 'Import my local data'}
        </FilledButton>
        {migrateStatus === 'done' && (
          <p className="mt-2 font-body text-sm text-deep-indigo">Done — reload the app to see everything.</p>
        )}
        {migrateStatus === 'error' && (
          <p className="mt-2 font-body text-sm text-burnt-orange">Something went wrong — try again.</p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink-black">Backup &amp; restore</h2>
        <p className="mt-1 font-body text-sm text-black/60">
          Export a backup of your account's data, or restore one into it.
        </p>

        <div className="mt-3 flex flex-col gap-3">
          <FilledButton type="button" onClick={handleExport}>
            Export data
          </FilledButton>

          <OutlinedButton type="button" onClick={() => fileRef.current?.click()}>
            Import data
          </OutlinedButton>
          <input ref={fileRef} type="file" accept="application/json" onChange={handleImportFile} className="sr-only" />

          {status && <p className="font-body text-sm text-black/60">{status}</p>}
        </div>
      </div>
    </div>
  )
}
