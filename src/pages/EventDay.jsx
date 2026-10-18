import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BotanicalSprig } from '../components/BotanicalLine'
import { DaySections } from '../components/DaySections'
import { EntryLinks } from '../components/EntryLinks'
import { enumerateDates, formatLongDate } from '../lib/calendarUtils'
import {
  builtInDaySectionTypes,
  createDaySectionType,
  getCalendarEvent,
  getEventNote,
  listDaySectionTypes,
  setEventNote,
} from '../lib/db'

// A brand-new day starts with these three pre-added (still empty, so they
// autosave nothing until actually edited) rather than a blank page the
// user has to build up from scratch every time.
const DEFAULT_SECTION_TYPES = [
  { typeId: 'focus', data: { value: '' } },
  { typeId: 'verses', data: { verses: [] } },
  { typeId: 'prayer', data: { html: '' } },
]

function defaultSections() {
  return DEFAULT_SECTION_TYPES.map((s) => ({ id: crypto.randomUUID(), typeId: s.typeId, data: { ...s.data } }))
}

const EMPTY_SECTIONS = []

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
  const [sections, setSections] = useState(EMPTY_SECTIONS)
  const [typeDefs, setTypeDefs] = useState(builtInDaySectionTypes())
  const [savedAt, setSavedAt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [noteId, setNoteId] = useState(null)
  // The sections value as loaded, so the autosave effect can tell a real
  // edit apart from merely opening a day — comparing against a remembered
  // reference (rather than a one-shot "skip the next run" flag) can't miss
  // an edit or fire early regardless of effect ordering or how many times
  // an effect happens to re-run (e.g. React StrictMode's double-invoke).
  const loadedSectionsRef = useRef(EMPTY_SECTIONS)

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

  // Section types are reusable across every day/event for this account, so
  // they're loaded once rather than per day.
  useEffect(() => {
    listDaySectionTypes().then((custom) => setTypeDefs([...builtInDaySectionTypes(), ...custom]))
  }, [])

  useEffect(() => {
    let cancelled = false
    getEventNote(id, date).then((row) => {
      // Guards against a stale load finishing after a newer one started
      // (fast prev/next taps, or an effect re-run) — without this, a
      // second resolution could follow the first and look like a real
      // edit to the autosave effect below, saving unintended defaults.
      if (cancelled) return
      // Only a day that's never been saved at all gets the defaults — once
      // a row exists, an empty sections list means the user cleared it on
      // purpose, so leave it alone.
      const loaded = row ? row.sections || EMPTY_SECTIONS : defaultSections()
      loadedSectionsRef.current = loaded
      setSections(loaded)
      setSavedAt(row?.updatedAt || null)
      setNoteId(row?.id || null)
    })
    return () => {
      cancelled = true
    }
  }, [id, date])

  const dates = useMemo(() => (event ? enumerateDates(event.startDate, event.endDate) : []), [event])
  const dayIndex = dates.indexOf(date)

  async function persist(next) {
    const savedId = await setEventNote(id, date, { sections: next })
    setSavedAt(Date.now())
    setSaving(false)
    setNoteId(savedId)
    return savedId
  }

  // The Link drawer needs a stable id to point a link at — a day that's
  // never been touched has no row yet, so this creates one (persist is an
  // upsert, so it's harmless to call even if a row already exists).
  async function ensureNoteId() {
    if (noteId) return noteId
    return persist(sections)
  }

  // Debounced autosave — the single source of truth for persisting this
  // day's note, so typing never depends on an onBlur firing at the right
  // moment (that was the bug: a blur handler's closure could race a
  // just-typed keystroke and save a stale, emptier value).
  useEffect(() => {
    if (sections === loadedSectionsRef.current) return
    setSaving(true)
    const timeout = setTimeout(() => {
      persist(sections)
      loadedSectionsRef.current = sections
    }, 700)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections])

  function goToDate(d) {
    persist(sections)
    navigate(`/events/${id}/day/${d}`)
  }

  async function handleCreateType(name) {
    const type = await createDaySectionType(name)
    setTypeDefs((prev) => (prev.some((t) => t.id === type.id) ? prev : [...prev, type]))
    return type
  }

  if (notFound) return null
  if (!event || dayIndex === -1) {
    return <p className="px-6 pt-10 font-body text-sm text-black/50">Loading…</p>
  }

  const prevDate = dayIndex > 0 ? dates[dayIndex - 1] : null
  const nextDate = dayIndex < dates.length - 1 ? dates[dayIndex + 1] : null

  return (
    <div className="min-h-screen pb-6">
      <div className="relative h-40 w-full overflow-hidden bg-warm-sand">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BotanicalSprig className="h-14 w-14 opacity-50" color="var(--color-deep-indigo)" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cream-paper via-transparent to-black/10" />
        <Link
          to={`/events/${id}`}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-pill bg-pure-white/90 font-display text-lg text-deep-indigo"
          aria-label="Back to event"
        >
          ←
        </Link>
        <Link
          to={`/calendar/${date}`}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-pill bg-pure-white/90"
          aria-label="Open in calendar"
        >
          <CalendarGlyph />
        </Link>
      </div>

      <div className="px-6 pt-4">
        <div className="text-center">
          <p className="font-display text-base font-semibold text-ink-black">{event.title}</p>
          <p className="font-label text-[10px] uppercase tracking-label text-black/40">
            Day {dayIndex + 1} of {dates.length}
          </p>
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

        <div className="mt-6">
          <DaySections sections={sections} typeDefs={typeDefs} onChange={setSections} onCreateType={handleCreateType} />
        </div>

        <EntryLinks selfType="day_note" selfId={noteId} ensureSelfId={ensureNoteId} />

        <div className="mt-4">
          {saving && <p className="font-label text-[10px] uppercase tracking-label text-black/30">Saving…</p>}
          {!saving && savedAt && (
            <p className="font-label text-[10px] uppercase tracking-label text-black/30">
              Saved {new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
