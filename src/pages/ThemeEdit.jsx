import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FilledButton, OutlinedButton } from '../components/Button'
import { deleteTheme, getTheme, updateTheme } from '../lib/db'
import { resizeImage } from '../lib/image'

export function ThemeEdit() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [reference, setReference] = useState('')
  const [imageBlob, setImageBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getTheme(id).then((row) => {
      if (!row) {
        setNotFound(true)
        return
      }
      setTitle(row.title)
      setSubtitle(row.subtitle || '')
      setReference(row.reference || '')
      if (row.imageBlob) {
        setImageBlob(row.imageBlob)
        setPreviewUrl(URL.createObjectURL(row.imageBlob))
      }
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (notFound) navigate('/themes', { replace: true })
  }, [notFound, navigate])

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

  function handleRemoveImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageBlob(null)
    setPreviewUrl(null)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setSaving(true)
    await updateTheme(id, {
      title: title.trim(),
      subtitle: subtitle.trim(),
      reference: reference.trim(),
      imageBlob,
    })
    navigate(`/themes/${id}`)
  }

  async function handleDelete() {
    await deleteTheme(id)
    navigate('/themes')
  }

  if (notFound) return null
  if (loading) {
    return <p className="px-6 pt-10 font-body text-sm text-black/50">Loading…</p>
  }

  return (
    <form onSubmit={handleSave} className="flex min-h-screen flex-col px-6 pt-10 pb-6">
      <p className="font-label text-xs uppercase tracking-label text-black/40">Edit</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink-black">Theme details</h1>

      <label className="mt-6 block">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">Cover image</span>
        <div className="mt-2 flex h-48 w-full items-center justify-center overflow-hidden rounded-card border border-dashed border-black/20 bg-pure-white">
          {previewUrl ? (
            <img src={previewUrl} alt="Cover preview" className="h-full w-full object-cover" />
          ) : (
            <span className="font-label text-xs uppercase tracking-label text-black/30">Tap to upload</span>
          )}
        </div>
        <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
      </label>
      {previewUrl && (
        <button
          type="button"
          onClick={handleRemoveImage}
          className="-mt-2 self-start font-label text-[10px] uppercase tracking-label text-black/40"
        >
          Remove image
        </button>
      )}

      <label className="mt-5 block">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. I Shall Not Lack"
          className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
        />
      </label>

      <label className="mt-4 block">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">Subtitle (optional)</span>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="e.g. Trusting His Provision"
          className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
        />
      </label>

      <label className="mt-4 block">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">
          Scripture reference (optional)
        </span>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. Psalm 23"
          className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm text-ink-black focus:outline-none"
        />
      </label>

      {error && <p className="mt-3 font-body text-sm text-burnt-orange">{error}</p>}

      <div className="mt-8 flex-1" />

      <div className="flex gap-3">
        <FilledButton type="submit" disabled={saving} className="flex-1">
          {saving ? 'Saving…' : 'Save changes'}
        </FilledButton>
        <OutlinedButton type="button" onClick={handleDelete} className="flex-1">
          Delete
        </OutlinedButton>
      </div>
    </form>
  )
}
