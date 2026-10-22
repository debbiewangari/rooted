import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '../components/Card'
import { Drawer } from '../components/Drawer'
import { FilledButton, OutlinedButton } from '../components/Button'
import {
  createEntry,
  deleteStudySeries,
  getStudySeries,
  listChaptersForSeries,
  removeChapterFromSeries,
  reorderChapters,
  updateEntry,
  updateStudySeries,
} from '../lib/db'
import { resizeImage } from '../lib/image'

function DragHandle(props) {
  return (
    <span
      {...props}
      aria-label="Drag to reorder"
      className="cursor-grab touch-none select-none px-1 text-base leading-none text-black/25 active:cursor-grabbing"
    >
      ⠿
    </span>
  )
}

function ChapterRow({ chapter, index, onRename, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-card border border-black/10 bg-pure-white px-3 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-card bg-mist font-label text-[10px] text-deep-indigo">
        {String(index + 1).padStart(2, '0')}
      </span>
      <input
        defaultValue={chapter.title}
        onBlur={(e) => onRename(chapter.id, e.target.value)}
        placeholder="Untitled chapter"
        className="min-w-0 flex-1 border-none bg-transparent font-body text-sm text-ink-black focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onRemove(chapter.id)}
        className="shrink-0 font-label text-[10px] uppercase tracking-label text-black/30"
      >
        Remove
      </button>
      <DragHandle {...attributes} {...listeners} />
    </div>
  )
}

export function SeriesEdit() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState('')
  const [anchorReference, setAnchorReference] = useState('')
  const [imageBlob, setImageBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [chapters, setChapters] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addingChapter, setAddingChapter] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    getStudySeries(id).then((row) => {
      if (!row) {
        navigate('/series', { replace: true })
        return
      }
      setTitle(row.title)
      setDescription(row.description)
      setTheme(row.theme)
      setAnchorReference(row.anchorReference)
      setExistingImageUrl(row.imageUrl)
      setLoading(false)
    })
    listChaptersForSeries(id).then(setChapters)
  }, [id, navigate])

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
      setRemoveImage(false)
    } catch {
      setError('Could not use that image — try a different file.')
    }
  }

  function handleRemoveImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageBlob(null)
    setPreviewUrl(null)
    setExistingImageUrl(null)
    setRemoveImage(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setSaving(true)
    try {
      await updateStudySeries(id, { title, description, theme, anchorReference, imageBlob, removeImage })
      navigate(`/series/${id}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteStudySeries(id)
      navigate('/series')
    } finally {
      setDeleting(false)
    }
  }

  async function handleRename(chapterId, newTitle) {
    const trimmed = newTitle.trim()
    const current = chapters.find((c) => c.id === chapterId)
    if (!current || current.title === trimmed) return
    await updateEntry(chapterId, { title: trimmed })
    setChapters((prev) => prev.map((c) => (c.id === chapterId ? { ...c, title: trimmed || 'Untitled' } : c)))
  }

  async function handleRemoveChapter(chapterId) {
    await removeChapterFromSeries(chapterId)
    setChapters((prev) => prev.filter((c) => c.id !== chapterId))
  }

  async function handleAddChapter() {
    setAddingChapter(true)
    try {
      const created = await createEntry({
        title: '',
        type: 'study',
        seriesId: id,
        chapterOrder: chapters.length,
      })
      setChapters((prev) => [...prev, created])
    } finally {
      setAddingChapter(false)
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = chapters.findIndex((c) => c.id === active.id)
    const newIndex = chapters.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(chapters, oldIndex, newIndex)
    setChapters(reordered)
    reorderChapters(reordered.map((c) => c.id))
  }

  if (loading || chapters === null) {
    return <p className="px-6 pt-10 font-body text-sm text-black/50">Loading…</p>
  }

  const coverUrl = previewUrl || existingImageUrl

  return (
    <form onSubmit={handleSave} className="flex min-h-screen flex-col px-6 pt-10 pb-6">
      <p className="font-label text-xs uppercase tracking-label text-black/40">Edit study series</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink-black">{title || 'Edit series'}</h1>

      <label className="mt-6 block">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">Cover image</span>
        <div className="mt-2 flex h-40 w-full items-center justify-center overflow-hidden rounded-card border border-dashed border-black/20 bg-pure-white">
          {coverUrl ? (
            <img src={coverUrl} alt="Cover preview" className="h-full w-full object-cover" />
          ) : (
            <span className="font-label text-xs uppercase tracking-label text-black/30">Tap to upload</span>
          )}
        </div>
        <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
      </label>
      {coverUrl && (
        <button
          type="button"
          onClick={handleRemoveImage}
          className="mt-2 self-start font-label text-[10px] uppercase tracking-label text-black/30"
        >
          Remove cover image
        </button>
      )}

      <label className="mt-5 block">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
        />
      </label>

      <label className="mt-4 block">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
        />
      </label>

      <div className="mt-4 flex gap-3">
        <label className="flex-1">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">Theme</span>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
          />
        </label>
        <label className="flex-1">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">Anchor scripture</span>
          <input
            value={anchorReference}
            onChange={(e) => setAnchorReference(e.target.value)}
            className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-label text-xs uppercase tracking-label text-deep-indigo focus:outline-none"
          />
        </label>
      </div>

      {error && <p className="mt-3 font-body text-sm text-burnt-orange">{error}</p>}

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">
            Chapters ({chapters.length})
          </span>
          <button
            type="button"
            onClick={handleAddChapter}
            disabled={addingChapter}
            className="font-label text-[11px] uppercase tracking-label text-deep-indigo disabled:opacity-50"
          >
            {addingChapter ? 'Adding…' : '+ Add chapter'}
          </button>
        </div>

        {chapters.length === 0 ? (
          <p className="mt-2 font-body text-sm text-black/40">No chapters yet.</p>
        ) : (
          <div className="mt-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {chapters.map((chapter, i) => (
                    <ChapterRow
                      key={chapter.id}
                      chapter={chapter}
                      index={i}
                      onRename={handleRename}
                      onRemove={handleRemoveChapter}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
        <p className="mt-2 font-body text-xs text-black/40">
          Removing a chapter here unlinks it from the series — it isn't deleted, and can still be opened from the
          Journal.
        </p>
      </div>

      <div className="mt-8 flex-1" />

      <div className="flex gap-3">
        <FilledButton type="submit" disabled={saving} className="flex-1">
          {saving ? 'Saving…' : 'Save'}
        </FilledButton>
        <OutlinedButton type="button" onClick={() => setConfirmDelete(true)} className="flex-1">
          Delete series
        </OutlinedButton>
      </div>

      <Drawer open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this series?">
        <p className="font-body text-sm text-black/60">
          “{title}” and its {chapters.length} chapter{chapters.length === 1 ? '' : 's'} will be permanently deleted.
          This can't be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <OutlinedButton type="button" onClick={() => setConfirmDelete(false)} className="flex-1">
            Cancel
          </OutlinedButton>
          <FilledButton type="button" onClick={handleDelete} disabled={deleting} className="flex-1 !bg-burnt-orange">
            {deleting ? 'Deleting…' : 'Delete'}
          </FilledButton>
        </div>
      </Drawer>
    </form>
  )
}
