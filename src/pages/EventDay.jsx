import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BotanicalSprig } from '../components/BotanicalLine'
import { Card } from '../components/Card'
import { EventVerseList } from '../components/EventVerseList'
import { RichTextEditor } from '../components/RichTextEditor'
import { enumerateDates, formatLongDate } from '../lib/calendarUtils'
import { getCalendarEvent, getEventNote, listEventNotes, setEventNote } from '../lib/db'

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
  const [fields, setFields] = useState(EMPTY_FIELDS)
  const [savedAt, setSavedAt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editingFocus, setEditingFocus] = useState(false)
  const [editingMinister, setEditingMinister] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [editingPrayerPoints, setEditingPrayerPoints] = useState(false)
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
      setEditingNotes(!hasText(row?.notes))
      setEditingPrayerPoints(!hasText(row?.prayerPoints))
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
          aria-label="Back to challenge"
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

        <div className="no-scrollbar mt-4 flex items-center justify-center gap-1.5 overflow-x-auto py-1">
          {dates.map((d) => {
            const hasNote = notedDates.has(d)
            const selected = d === date
            return (
              <button
                key={d}
                type="button"
                onClick={() => goToDate(d)}
                aria-label={`Day ${dates.indexOf(d) + 1}`}
                className={`shrink-0 rounded-pill transition-all ${
                  selected ? 'h-2.5 w-6 bg-deep-indigo' : hasNote ? 'h-2.5 w-2.5 bg-burnt-orange/70' : 'h-2.5 w-2.5 bg-black/15'
                }`}
              />
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

      <div className="mt-6 flex flex-col gap-4">
        <Card>
          <p className="font-label text-[11px] uppercase tracking-label text-black/40">Today's Focus</p>
          {editingFocus ? (
            <textarea
              autoFocus
              value={fields.focus}
              onChange={(e) => setFields((f) => ({ ...f, focus: e.target.value }))}
              onBlur={() => setEditingFocus(false)}
              placeholder="What's the focus for today?"
              rows={2}
              className="mt-2 w-full resize-none rounded-card border border-black/10 bg-pure-white px-3 py-2 font-body text-sm text-black/80 placeholder:text-black/30 focus:outline-none"
            />
          ) : (
            <button type="button" onClick={() => setEditingFocus(true)} className="mt-2 block w-full text-left">
              {fields.focus ? (
                <span className="font-display text-base font-medium text-ink-black">{fields.focus}</span>
              ) : (
                <span className="font-body text-sm text-black/30">What's the focus for today?</span>
              )}
            </button>
          )}
        </Card>

        <Card>
          <p className="font-label text-[11px] uppercase tracking-label text-black/40">Minister</p>
          {editingMinister ? (
            <input
              autoFocus
              value={fields.minister}
              onChange={(e) => setFields((f) => ({ ...f, minister: e.target.value }))}
              onBlur={() => setEditingMinister(false)}
              placeholder="e.g. Pastor Nathaniel Bassey"
              className="mt-2 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2 font-body text-sm placeholder:text-black/30 focus:outline-none"
            />
          ) : (
            <button type="button" onClick={() => setEditingMinister(true)} className="mt-2 block w-full text-left">
              {fields.minister ? (
                <span className="font-display text-base font-medium text-ink-black">{fields.minister}</span>
              ) : (
                <span className="font-body text-sm text-black/30">e.g. Pastor Nathaniel Bassey</span>
              )}
            </button>
          )}
        </Card>

        <Card>
          <p className="font-label text-[11px] uppercase tracking-label text-black/40">Bible Verses</p>
          <div className="mt-2">
            <EventVerseList verses={fields.verses} onAdd={handleAddVerse} onRemove={handleRemoveVerse} />
          </div>
        </Card>

        <Card>
          <p className="font-label text-[11px] uppercase tracking-label text-black/40">Notes</p>
          {editingNotes ? (
            <div className="mt-2">
              <RichTextEditor
                value={fields.notes}
                onChange={(html) => setFields((f) => ({ ...f, notes: html }))}
                onBlur={() => setEditingNotes(false)}
                placeholder="Write your notes, reflections or what stood out to you today…"
              />
            </div>
          ) : (
            <button type="button" onClick={() => setEditingNotes(true)} className="mt-2 block w-full text-left">
              {hasText(fields.notes) ? (
                <span
                  className="rich-text-editor font-body text-sm text-black/80"
                  dangerouslySetInnerHTML={{ __html: fields.notes }}
                />
              ) : (
                <span className="font-body text-sm text-black/30">
                  Write your notes, reflections or what stood out to you today…
                </span>
              )}
            </button>
          )}
        </Card>

        <Card>
          <p className="font-label text-[11px] uppercase tracking-label text-black/40">Prayer Points</p>
          {editingPrayerPoints ? (
            <div className="mt-2">
              <RichTextEditor
                value={fields.prayerPoints}
                onChange={(html) => setFields((f) => ({ ...f, prayerPoints: html }))}
                onBlur={() => setEditingPrayerPoints(false)}
                placeholder="What to pray for…"
              />
            </div>
          ) : (
            <button type="button" onClick={() => setEditingPrayerPoints(true)} className="mt-2 block w-full text-left">
              {hasText(fields.prayerPoints) ? (
                <span
                  className="rich-text-editor font-body text-sm text-black/80"
                  dangerouslySetInnerHTML={{ __html: fields.prayerPoints }}
                />
              ) : (
                <span className="font-body text-sm text-black/30">What to pray for…</span>
              )}
            </button>
          )}
        </Card>

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
