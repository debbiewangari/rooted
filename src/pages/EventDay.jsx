import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EventVerseList } from '../components/EventVerseList'
import { RichTextEditor } from '../components/RichTextEditor'
import { enumerateDates, formatLongDate } from '../lib/calendarUtils'
import { getCalendarEvent, getEventNote, listEventNotes, setEventNote } from '../lib/db'

const TABS = [
  { id: 'verses', label: 'Bible Verses' },
  { id: 'notes', label: 'Notes' },
  { id: 'prayerPoints', label: 'Prayer Points' },
]

const EMPTY_FIELDS = { focus: '', minister: '', verses: [], notes: '', prayerPoints: '' }

function hasText(html) {
  return Boolean(html && html.replace(/<[^>]*>/g, '').trim())
}

function hasContent(row) {
  return Boolean(row.focus || row.minister || row.verses?.length || hasText(row.notes) || hasText(row.prayerPoints))
}

function CalendarGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9h16M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}

export function EventDay() {
  const { id, date } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [notedDates, setNotedDates] = useState(new Set())
  const [activeTab, setActiveTab] = useState('verses')
  const [fields, setFields] = useState(EMPTY_FIELDS)
  const [savedAt, setSavedAt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editingFocus, setEditingFocus] = useState(false)
  const [editingMinister, setEditingMinister] = useState(false)
  // Guards the autosave effect below from firing the instant a day's note
  // loads — only real edits (which flip this false) should trigger a save.
  const skipAutosaveRef = useRef(true)

  useEffect(() => {
    getCalendarEvent(id).then((row) => {
      if (!row) {
        setNotFound(true)
        return
      }
      setEvent(row)
    })
  }, [id])

  useEffect(() => {
    if (notFound) navigate('/calendar', { replace: true })
  }, [notFound, navigate])

  function refreshNoted() {
    listEventNotes(id).then((rows) => {
      setNotedDates(new Set(rows.filter(hasContent).map((r) => r.date)))
    })
  }

  useEffect(() => {
    refreshNoted()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    skipAutosaveRef.current = true
    getEventNote(id, date).then((row) => {
      setFields({
        focus: row?.focus || '',
        minister: row?.minister || '',
        verses: Array.isArray(row?.verses) ? row.verses : [],
        notes: row?.notes || '',
        prayerPoints: row?.prayerPoints || '',
      })
      setSavedAt(row?.updatedAt || null)
      setEditingFocus(!row?.focus)
      setEditingMinister(!row?.minister)
    })
  }, [id, date])

  const dates = useMemo(() => (event ? enumerateDates(event.startDate, event.endDate) : []), [event])
  const dayIndex = dates.indexOf(date)

  async function persist(next) {
    await setEventNote(id, date, next)
    setSavedAt(Date.now())
    setSaving(false)
    refreshNoted()
  }

  // Debounced autosave — the single source of truth for persisting this
  // day's note, so typing never depends on an onBlur firing at the right
  // moment (that was the bug: a blur handler's closure could race a
  // just-typed keystroke and save a stale, emptier value).
  useEffect(() => {
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false
      return
    }
    setSaving(true)
    const timeout = setTimeout(() => {
      persist(fields)
    }, 700)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields])

  function switchTab(tabId) {
    persist(fields)
    setActiveTab(tabId)
  }

  function goToDate(d) {
    persist(fields)
    navigate(`/events/${id}/day/${d}`)
  }

  async function handleAddVerse(reference) {
    const next = { ...fields, verses: [...fields.verses, { id: crypto.randomUUID(), reference }] }
    setFields(next)
    skipAutosaveRef.current = true
    await persist(next)
  }

  async function handleRemoveVerse(verseId) {
    const next = { ...fields, verses: fields.verses.filter((v) => v.id !== verseId) }
    setFields(next)
    skipAutosaveRef.current = true
    await persist(next)
  }

  if (notFound) return null
  if (!event || dayIndex === -1) {
    return <p className="px-6 pt-10 font-body text-sm text-black/50">Loading…</p>
  }

  const prevDate = dayIndex > 0 ? dates[dayIndex - 1] : null
  const nextDate = dayIndex < dates.length - 1 ? dates[dayIndex + 1] : null

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/events/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-pill border border-black/10 bg-pure-white font-display text-lg text-deep-indigo"
          aria-label="Back to challenge"
        >
          ←
        </Link>
        <div className="text-center">
          <p className="font-display text-base font-semibold text-ink-black">{event.title}</p>
          <p className="font-label text-[10px] uppercase tracking-label text-black/40">
            Day {dayIndex + 1} of {dates.length}
          </p>
        </div>
        <Link
          to={`/calendar/${date}`}
          className="flex h-9 w-9 items-center justify-center rounded-pill border border-black/10 bg-pure-white"
          aria-label="Open in calendar"
        >
          <CalendarGlyph />
        </Link>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {dates.map((d, i) => {
          const hasNote = notedDates.has(d)
          const selected = d === date
          return (
            <button
              key={d}
              type="button"
              onClick={() => goToDate(d)}
              className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-pill font-display text-sm ${
                selected ? 'bg-deep-indigo text-pure-white' : 'border border-black/10 bg-pure-white text-deep-indigo'
              }`}
            >
              {i + 1}
              {hasNote && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-burnt-orange" />}
            </button>
          )
        })}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          disabled={!prevDate}
          onClick={() => prevDate && goToDate(prevDate)}
          className="font-display text-xl text-deep-indigo disabled:opacity-20"
          aria-label="Previous day"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="font-display text-xl font-semibold text-ink-black">Day {dayIndex + 1}</p>
          <p className="font-label text-[11px] uppercase tracking-label text-black/40">{formatLongDate(date)}</p>
        </div>
        <button
          type="button"
          disabled={!nextDate}
          onClick={() => nextDate && goToDate(nextDate)}
          className="font-display text-xl text-deep-indigo disabled:opacity-20"
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <p className="font-label text-[10px] uppercase tracking-label text-black/40">Daily Focus</p>
          {editingFocus ? (
            <textarea
              autoFocus
              value={fields.focus}
              onChange={(e) => setFields((f) => ({ ...f, focus: e.target.value }))}
              onBlur={() => setEditingFocus(false)}
              placeholder="What's the focus for today?"
              rows={2}
              className="mt-1 w-full resize-none rounded-card border border-black/10 bg-pure-white px-3 py-2 font-body text-sm text-black/80 placeholder:text-black/30 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingFocus(true)}
              className="mt-1 block w-full text-left font-display text-base font-medium text-ink-black"
            >
              {fields.focus}
            </button>
          )}
        </div>

        <div>
          <p className="font-label text-[10px] uppercase tracking-label text-black/40">Minister</p>
          {editingMinister ? (
            <input
              autoFocus
              value={fields.minister}
              onChange={(e) => setFields((f) => ({ ...f, minister: e.target.value }))}
              onBlur={() => setEditingMinister(false)}
              placeholder="e.g. Pastor Nathaniel Bassey"
              className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2 font-body text-sm placeholder:text-black/30 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingMinister(true)}
              className="mt-1 block w-full text-left font-display text-base font-medium text-ink-black"
            >
              {fields.minister}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex border-b border-black/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchTab(tab.id)}
            className={`flex-1 pb-2 font-label text-[11px] uppercase tracking-label ${
              activeTab === tab.id ? 'border-b-2 border-deep-indigo text-deep-indigo' : 'text-black/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === 'verses' && (
          <EventVerseList verses={fields.verses} onAdd={handleAddVerse} onRemove={handleRemoveVerse} />
        )}

        {activeTab === 'notes' && (
          <RichTextEditor
            value={fields.notes}
            onChange={(html) => setFields((f) => ({ ...f, notes: html }))}
            placeholder="Write your notes, reflections or what stood out to you today…"
          />
        )}

        {activeTab === 'prayerPoints' && (
          <RichTextEditor
            value={fields.prayerPoints}
            onChange={(html) => setFields((f) => ({ ...f, prayerPoints: html }))}
            placeholder="What to pray for…"
          />
        )}

        {saving && (
          <p className="mt-2 font-label text-[10px] uppercase tracking-label text-black/30">Saving…</p>
        )}
        {!saving && savedAt && (
          <p className="mt-2 font-label text-[10px] uppercase tracking-label text-black/30">
            Saved {new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}
