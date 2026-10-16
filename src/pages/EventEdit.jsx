import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FilledButton, OutlinedButton } from '../components/Button'
import { EVENT_CATEGORIES } from '../lib/calendar'
import { deleteCalendarEvent, getCalendarEvent, updateCalendarEvent } from '../lib/db'
import { resizeImage } from '../lib/image'

export function EventEdit() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState('event')
  const [customCategory, setCustomCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [anchorVerse, setAnchorVerse] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [theme, setTheme] = useState('')
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [newCoverImage, setNewCoverImage] = useState(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCalendarEvent(id).then((row) => {
      if (!row) {
        setNotFound(true)
        return
      }
      setTitle(row.title)
      setNotes(row.notes || '')
      setCategory(row.category || 'event')
      setCustomCategory(row.customCategory || '')
      setStartDate(row.startDate)
      setEndDate(row.endDate)
      setAnchorVerse(row.anchorVerse || '')
      setStartTime(row.startTime || '')
      setEndTime(row.endTime || '')
      setTheme(row.theme || '')
      setExistingImageUrl(row.coverImageUrl || null)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (notFound) navigate('/calendar', { replace: true })
  }, [notFound, navigate])

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  const previewUrl = localPreviewUrl || (!imageRemoved ? existingImageUrl : null)

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const resized = await resizeImage(file)
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    setNewCoverImage(resized)
    setLocalPreviewUrl(URL.createObjectURL(resized))
    setImageRemoved(false)
  }

  function handleRemoveImage() {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    setNewCoverImage(null)
    setLocalPreviewUrl(null)
    setImageRemoved(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await updateCalendarEvent(id, {
      title: title.trim(),
      notes: notes.trim(),
      category,
      customCategory: category === 'other' ? customCategory.trim() : '',
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
      anchorVerse: anchorVerse.trim(),
      startTime,
      endTime,
      theme: theme.trim(),
      coverImage: newCoverImage,
      removeImage: imageRemoved,
    })
    navigate(`/events/${id}`)
  }

  async function handleDelete() {
    await deleteCalendarEvent(id)
    navigate('/calendar')
  }

  if (notFound) return null
  if (loading) {
    return <p className="px-6 pt-10 font-body text-sm text-black/50">Loading…</p>
  }

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <p className="font-label text-xs uppercase tracking-label text-black/40">Edit</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink-black">Event details</h1>

      <form onSubmit={handleSave} className="mt-6 flex flex-col gap-4">
        <label className="block">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">Cover image</span>
          <div className="mt-1 flex h-40 w-full items-center justify-center overflow-hidden rounded-card border border-dashed border-black/20 bg-pure-white">
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

        <label className="block">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hallelujah Challenge"
            className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">Description</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-none rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">Theme</span>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. Gratitude, Breakthrough, Restoration"
            className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">Anchor verse</span>
          <input
            value={anchorVerse}
            onChange={(e) => setAnchorVerse(e.target.value)}
            placeholder="e.g. Psalm 23"
            className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm text-ink-black focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-label text-xs uppercase tracking-label text-deep-indigo focus:outline-none"
          >
            {EVENT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        {category === 'other' && (
          <label className="block">
            <span className="font-label text-[11px] uppercase tracking-label text-black/40">Custom category</span>
            <input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g. Fellowship"
              className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
            />
          </label>
        )}

        <div className="flex gap-3">
          <label className="flex-1">
            <span className="font-label text-[11px] uppercase tracking-label text-black/40">Starts</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
            />
          </label>
          <label className="flex-1">
            <span className="font-label text-[11px] uppercase tracking-label text-black/40">Start time</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex-1">
            <span className="font-label text-[11px] uppercase tracking-label text-black/40">Ends</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
            />
          </label>
          <label className="flex-1">
            <span className="font-label text-[11px] uppercase tracking-label text-black/40">End time</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-4 flex gap-3">
          <FilledButton type="submit" disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Save changes'}
          </FilledButton>
          <OutlinedButton type="button" onClick={handleDelete} className="flex-1">
            Delete
          </OutlinedButton>
        </div>
      </form>
    </div>
  )
}
