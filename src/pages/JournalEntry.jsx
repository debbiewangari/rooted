import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BotanicalSprig } from '../components/BotanicalLine'
import { Card } from '../components/Card'
import { FilledButton, OutlinedButton } from '../components/Button'
import { EntryLinks } from '../components/EntryLinks'
import { EntrySections } from '../components/EntrySections'
import { EventVerseList } from '../components/EventVerseList'
import { DEFAULT_TRANSLATION, fetchPassage } from '../lib/bible'
import { LIBRARY_TYPES, legacyItemsToHtml, sectionConfig, typeConfig } from '../lib/library'
import { createEntry, createTag, deleteEntry, getEntry, listTags, updateEntry } from '../lib/db'

const TRANSLATION_KEY = 'rooted:translation'

function todayLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatEntryDate(dateStr, timeStr) {
  if (!dateStr) return ''
  const date = new Date(`${dateStr}T00:00:00`)
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return timeStr ? `${formatted} · ${timeStr}` : formatted
}

export function JournalEntry() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [entryId, setEntryId] = useState(id || null)
  const [editing, setEditing] = useState(!id)
  const [title, setTitle] = useState(searchParams.get('title') || '')
  const [sections, setSections] = useState([])
  const [reference, setReference] = useState(searchParams.get('ref') || '')
  const [type, setType] = useState(searchParams.get('type') || 'reflection')
  const [tags, setTags] = useState(() => {
    const tag = searchParams.get('tag')
    return tag ? [tag] : []
  })
  const [entryDate, setEntryDate] = useState(todayLocal())
  const [entryTime, setEntryTime] = useState('')
  const [allTags, setAllTags] = useState([])
  const [newTagName, setNewTagName] = useState('')
  const [referenceQuote, setReferenceQuote] = useState('')
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  // Guards the autosave effect from firing the instant an existing entry
  // loads — only real edits (which flip this false) should trigger a save.
  const skipAutosaveRef = useRef(Boolean(id))

  useEffect(() => {
    listTags().then(setAllTags)
  }, [])

  useEffect(() => {
    if (!id) return
    skipAutosaveRef.current = true
    getEntry(id).then((entry) => {
      if (!entry) {
        navigate('/journal', { replace: true })
        return
      }
      setEntryId(entry.id)
      setTitle(entry.title)
      setSections(entry.sections || [])
      setReference(entry.reference || '')
      setType(entry.type || 'reflection')
      setTags(entry.tags || [])
      setEntryDate(entry.entryDate || todayLocal())
      setEntryTime(entry.entryTime || '')
      setLoading(false)
    })
  }, [id, navigate])

  useEffect(() => {
    if (!reference.trim()) {
      setReferenceQuote('')
      return
    }
    const translation = localStorage.getItem(TRANSLATION_KEY) || DEFAULT_TRANSLATION
    fetchPassage(reference, translation)
      .then(({ data }) => setReferenceQuote((data.text || '').trim()))
      .catch(() => setReferenceQuote(''))
  }, [reference])

  // Autosave — creates the entry on the first meaningful edit (a title or a
  // section), then updates it on every edit after that. No explicit Save
  // tap is required for content to be kept.
  async function autosave(current) {
    if (entryId) {
      await updateEntry(entryId, current)
      setSavedAt(Date.now())
      return
    }
    if (!current.title.trim() && current.sections.length === 0) return
    const created = await createEntry(current)
    setEntryId(created.id)
    setSavedAt(Date.now())
    navigate(`/journal/${created.id}`, { replace: true })
  }

  useEffect(() => {
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false
      return
    }
    setSaving(true)
    const timeout = setTimeout(() => {
      autosave({ title, sections, reference: reference || null, type, tags, entryDate, entryTime }).finally(() =>
        setSaving(false),
      )
    }, 700)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, sections, reference, type, tags, entryDate, entryTime])

  function toggleTag(name) {
    setTags((t) => (t.includes(name) ? t.filter((x) => x !== name) : [...t, name]))
  }

  async function handleAddTag() {
    if (!newTagName.trim()) return
    const tag = await createTag(newTagName)
    setAllTags((t) => (t.some((x) => x.id === tag.id) ? t : [...t, tag]))
    setTags((t) => (t.includes(tag.name) ? t : [...t, tag.name]))
    setNewTagName('')
  }

  async function handleSave(e) {
    e.preventDefault()
    await autosave({ title, sections, reference: reference || null, type, tags, entryDate, entryTime })
    if (entryId) {
      setEditing(false)
    } else {
      navigate('/journal')
    }
  }

  async function handleDelete() {
    if (!entryId) {
      navigate('/journal')
      return
    }
    await deleteEntry(entryId)
    navigate('/journal')
  }

  if (loading) {
    return <p className="px-6 pt-10 font-body text-sm text-black/50">Loading…</p>
  }

  if (!editing) {
    const cfg = typeConfig(type)
    return (
      <div className="min-h-screen pb-6">
        <div className="relative h-40 w-full overflow-hidden bg-warm-sand">
          <div className="flex h-full items-center justify-center">
            <BotanicalSprig className="h-14 w-14 opacity-50" color="var(--color-deep-indigo)" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-cream-paper via-transparent to-black/10" />
          <Link
            to="/journal"
            className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-pill bg-pure-white/90 font-display text-lg text-deep-indigo"
            aria-label="Back to library"
          >
            ←
          </Link>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="absolute right-4 top-4 rounded-pill bg-pure-white/90 px-4 py-2 font-label text-[11px] uppercase tracking-label text-deep-indigo"
          >
            Edit
          </button>
        </div>

        <div className="px-6 pt-4">
          <p className="font-label text-[11px] uppercase tracking-label text-black/40">
            {cfg.singular} · {formatEntryDate(entryDate, entryTime)}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink-black">{title}</h1>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-pill bg-mist px-3 py-1 font-label text-[10px] uppercase tracking-label text-deep-indigo"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {reference && (
          <div className="px-6">
            <Card className="mt-4">
              <p className="font-label text-[11px] uppercase tracking-label text-deep-indigo">{reference}</p>
              {referenceQuote && <p className="mt-1 font-body text-sm text-black/60">“{referenceQuote}”</p>}
            </Card>
          </div>
        )}

        <div className="px-6 mt-4 flex flex-col gap-4">
          {sections.length === 0 && <p className="font-body text-sm text-black/40">No sections yet.</p>}
          {sections.map((section) => {
            const sCfg = sectionConfig(section.type)
            return (
              <Card key={section.id}>
                <p className="font-label text-[11px] uppercase tracking-label text-black/40">{sCfg?.label}</p>

                {sCfg?.kind === 'scripture' && (
                  <div className="mt-2">
                    <EventVerseList verses={section.data.verses || []} readOnly />
                  </div>
                )}

                {sCfg?.kind === 'richtext' &&
                  (() => {
                    const html = section.data?.html ?? (section.data?.items ? legacyItemsToHtml(section.data.items) : '')
                    return html ? (
                      <div
                        className="rich-text-editor mt-2 font-body text-sm text-black/80"
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    ) : (
                      <p className="mt-2 font-body text-sm text-black/40">Nothing written yet.</p>
                    )
                  })()}
              </Card>
            )
          })}
        </div>

        <div className="px-6">
          <EntryLinks selfType="entry" selfId={entryId} />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="flex min-h-screen flex-col px-6 pt-10 pb-6">
      <p className="font-label text-xs uppercase tracking-label text-black/40">
        {entryId ? 'Edit entry' : 'New entry'}
      </p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="mt-2 w-full border-none bg-transparent font-display text-2xl font-semibold text-ink-black placeholder:text-black/25 focus:outline-none"
      />

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {LIBRARY_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`shrink-0 rounded-pill px-4 py-2 font-label text-[11px] uppercase tracking-label ${
              type === t.id ? 'bg-deep-indigo text-pure-white' : 'border border-black/10 bg-pure-white text-deep-indigo'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <label className="flex-1">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">Date</span>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2 font-body text-sm focus:outline-none"
          />
        </label>
        <label className="flex-1">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">Time (optional)</span>
          <input
            type="time"
            value={entryTime}
            onChange={(e) => setEntryTime(e.target.value)}
            className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2 font-body text-sm focus:outline-none"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">
          Reference (optional)
        </span>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. John 3:16"
          className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2 font-label text-xs uppercase tracking-label text-deep-indigo placeholder:text-black/30 focus:outline-none"
        />
      </label>
      {referenceQuote && (
        <p className="mt-1 font-body text-sm italic text-black/60">“{referenceQuote}”</p>
      )}

      <div className="mt-4">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">Themes</span>
        <div className="no-scrollbar mt-1.5 flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.name)}
              className={`rounded-pill px-3 py-1.5 font-label text-[10px] uppercase tracking-label ${
                tags.includes(tag.name)
                  ? 'bg-deep-indigo text-pure-white'
                  : 'border border-black/10 bg-pure-white text-deep-indigo'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
            placeholder="New theme name…"
            className="flex-1 rounded-card border border-black/10 bg-pure-white px-3 py-1.5 font-body text-xs focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="font-label text-[10px] uppercase tracking-label text-deep-indigo"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-6 flex-1">
        <EntrySections sections={sections} onChange={setSections} />
      </div>

      <div className="mt-2">
        {saving && <p className="font-label text-[10px] uppercase tracking-label text-black/30">Saving…</p>}
        {!saving && savedAt && (
          <p className="font-label text-[10px] uppercase tracking-label text-black/30">
            Saved {new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <FilledButton type="submit" className="flex-1">
          Done
        </FilledButton>
        {entryId && (
          <OutlinedButton type="button" onClick={handleDelete} className="flex-1">
            Delete
          </OutlinedButton>
        )}
      </div>
    </form>
  )
}
