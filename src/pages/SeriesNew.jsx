import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilledButton } from '../components/Button'
import { createStudySeries } from '../lib/db'
import { resizeImage } from '../lib/image'

export function SeriesNew() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState('')
  const [anchorReference, setAnchorReference] = useState('')
  const [imageBlob, setImageBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      const resized = await resizeImage(file)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setImageBlob(resized)
      setPreviewUrl(URL.createObjectURL(resized))
    } catch {
      setError('Could not use that image — try a different file.')
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setSaving(true)
    const created = await createStudySeries({ title, description, theme, anchorReference, imageBlob })
    navigate(`/series/${created.id}`)
  }

  return (
    <form onSubmit={handleSave} className="flex min-h-screen flex-col px-6 pt-10 pb-6">
      <p className="font-label text-xs uppercase tracking-label text-black/40">New study series</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink-black">Start a series</h1>

      <label className="mt-6 block">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">Cover image (optional)</span>
        <div className="mt-2 flex h-40 w-full items-center justify-center overflow-hidden rounded-card border border-dashed border-black/20 bg-pure-white">
          {previewUrl ? (
            <img src={previewUrl} alt="Cover preview" className="h-full w-full object-cover" />
          ) : (
            <span className="font-label text-xs uppercase tracking-label text-black/30">Tap to upload</span>
          )}
        </div>
        <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
      </label>

      <label className="mt-5 block">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. The Lord Reigns"
          className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
        />
      </label>

      <label className="mt-4 block">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">Description (optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this study explores…"
          rows={3}
          className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
        />
      </label>

      <div className="mt-4 flex gap-3">
        <label className="flex-1">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">Theme (optional)</span>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. God's sovereignty"
            className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
          />
        </label>
        <label className="flex-1">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">
            Anchor scripture (optional)
          </span>
          <input
            value={anchorReference}
            onChange={(e) => setAnchorReference(e.target.value)}
            placeholder="e.g. Psalm 97:1"
            className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-label text-xs uppercase tracking-label text-deep-indigo focus:outline-none"
          />
        </label>
      </div>

      {error && <p className="mt-3 font-body text-sm text-burnt-orange">{error}</p>}

      <div className="mt-8 flex-1" />

      <FilledButton type="submit" disabled={saving} className="w-full">
        {saving ? 'Creating…' : 'Create series'}
      </FilledButton>
    </form>
  )
}
