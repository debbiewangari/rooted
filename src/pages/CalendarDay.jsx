import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { FilledButton } from '../components/Button'
import { Drawer } from '../components/Drawer'
import { EVENT_CATEGORIES, categoryHex, categoryLabel } from '../lib/calendar'
import { formatLongDate, formatShortRange } from '../lib/calendarUtils'
import { createCalendarEvent, listCalendarEvents } from '../lib/db'

export function CalendarDay() {
  const { date } = useParams()

  const [events, setEvents] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
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
    setDrawerOpen(false)
    refresh()
  }

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <Link to="/calendar" className="font-label text-[11px] uppercase tracking-label text-deep-indigo">
        ← Back to Calendar
      </Link>

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h1 className="min-w-0 font-display text-lg font-semibold text-ink-black">{formatLongDate(date)}</h1>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="shrink-0 font-label text-xs uppercase tracking-label text-deep-indigo"
        >
          + Add new
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {events.length === 0 && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-full rounded-card border border-dashed border-black/15 bg-pure-white px-4 py-4 text-left"
          >
            <span className="font-display text-base font-semibold text-ink-black">Add to this day</span>
            <span className="mt-0.5 block font-body text-sm text-black/50">
              Tap to add a challenge, fast or event.
            </span>
          </button>
        )}
        {events.map((e) => {
          return (
            <Card key={e.id}>
              <Link to={`/events/${e.id}`} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-medium text-ink-black">{e.title}</p>
                  {(e.startDate !== e.endDate || e.startTime) && (
                    <p className="font-label text-[9px] uppercase tracking-label text-black/40">
                      {e.startDate !== e.endDate ? formatShortRange(e.startDate, e.endDate) : null}
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
            </Card>
          )
        })}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add to this day">
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
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
      </Drawer>
    </div>
  )
}
