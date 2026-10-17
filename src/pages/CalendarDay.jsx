import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { FilledButton } from '../components/Button'
import { EVENT_CATEGORIES, categoryHex, categoryLabel } from '../lib/calendar'
import { formatLongDate } from '../lib/calendarUtils'
import { createCalendarEvent, deleteCalendarEvent, listCalendarEvents } from '../lib/db'

export function CalendarDay() {
  const { date } = useParams()

  const [events, setEvents] = useState([])
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState('event')
  const [customCategory, setCustomCategory] = useState('')
  const [endDate, setEndDate] = useState(date)
  const [anchorVerse, setAnchorVerse] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [theme, setTheme] = useState('')

  async function refresh() {
    const all = await listCalendarEvents()
    setEvents(all.filter((e) => date >= e.startDate && date <= e.endDate))
  }

  useEffect(() => {
    refresh()
    setEndDate(date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  async function handleAdd(e) {
    e.preventDefault()
    if (!title.trim()) return
    await createCalendarEvent({
      title,
      notes,
      category,
      startDate: date,
      endDate,
      anchorVerse,
      startTime,
      endTime,
      customCategory,
      theme,
    })
    setTitle('')
    setNotes('')
    setCategory('event')
    setCustomCategory('')
    setEndDate(date)
    setAnchorVerse('')
    setStartTime('')
    setEndTime('')
    setTheme('')
    refresh()
  }

  async function handleDelete(id) {
    await deleteCalendarEvent(id)
    refresh()
  }

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <Link to="/calendar" className="font-label text-[11px] uppercase tracking-label text-deep-indigo">
        ← Back to Calendar
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink-black">{formatLongDate(date)}</h1>

      <div className="mt-6 flex flex-col gap-3">
        {events.length === 0 && (
          <p className="font-body text-sm text-black/50">Nothing planned for this day yet.</p>
        )}
        {events.map((e) => {
          return (
            <Card key={e.id}>
              <Link to={`/events/${e.id}`} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-medium text-ink-black">{e.title}</p>
                  {(e.startDate !== e.endDate || e.startTime) && (
                    <p className="font-label text-[10px] uppercase tracking-label text-black/40">
                      {e.startDate !== e.endDate ? `${e.startDate} – ${e.endDate}` : null}
                      {e.startDate !== e.endDate && e.startTime ? ' · ' : null}
                      {e.startTime}
                      {e.endTime ? `–${e.endTime}` : ''}
                    </p>
                  )}
                  {e.notes && <p className="mt-1 font-body text-sm text-black/70">{e.notes}</p>}
                </div>
                <span className="mt-1 flex shrink-0 items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryHex(e) }} />
                  <span className="font-label text-[10px] uppercase tracking-label text-black/40">
                    {categoryLabel(e)}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(e.id)}
                className="mt-2 font-label text-[10px] uppercase tracking-label text-black/40"
              >
                Remove
              </button>
            </Card>
          )
        })}
      </div>

      <form onSubmit={handleAdd} className="mt-8 flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-ink-black">Add to this day</h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Hallelujah Challenge"
          className="w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
        />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={3}
          className="w-full resize-none rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
        />

        <input
          value={anchorVerse}
          onChange={(e) => setAnchorVerse(e.target.value)}
          placeholder="Anchor verse (optional, e.g. Psalm 23)"
          className="w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm text-ink-black focus:outline-none"
        />

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
          <input
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Custom category name, e.g. Fellowship"
            className="w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
          />
        )}

        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="Theme (optional, e.g. Gratitude)"
          className="w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
        />

        <div className="flex gap-3">
          <label className="flex-1">
            <span className="font-label text-[11px] uppercase tracking-label text-black/40">Starts</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
            />
          </label>
          <label className="flex-1">
            <span className="font-label text-[11px] uppercase tracking-label text-black/40">Ends</span>
            <input
              type="date"
              value={endDate}
              min={date}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
            />
          </label>
        </div>

        <label className="block">
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">End time (optional)</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
          />
        </label>

        <FilledButton type="submit" className="mt-2">
          Save
        </FilledButton>
      </form>
    </div>
  )
}
