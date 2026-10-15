import { useEffect, useState } from 'react'
import { EventCard } from '../components/EventCard'
import { FilledButton } from '../components/Button'
import { getEventProgress } from '../lib/calendarUtils'
import { listCalendarEvents } from '../lib/db'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Past' },
]

export function Events() {
  const [events, setEvents] = useState(null)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    listCalendarEvents().then((rows) => {
      setEvents(rows.map((e) => ({ ...e, status: getEventProgress(e).status })))
    })
  }, [])

  const filtered = events?.filter((e) => tab === 'all' || e.status === tab) || []

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label text-xs uppercase tracking-label text-deep-indigo">Challenges</p>
          <h1 className="font-display text-4xl uppercase text-deep-indigo">Events</h1>
        </div>
        <FilledButton to="/calendar" className="shrink-0 px-5 py-3 text-[11px]">
          View in Calendar
        </FilledButton>
      </div>

      <div className="mt-5 flex rounded-pill border border-black/10 bg-pure-white p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-pill py-2 font-label text-[10px] uppercase tracking-label transition-colors ${
              tab === t.id ? 'bg-deep-indigo text-pure-white' : 'text-deep-indigo'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {events === null && <p className="font-body text-sm text-black/50">Loading…</p>}
        {events && filtered.length === 0 && <p className="font-body text-sm text-black/50">Nothing here yet.</p>}
        {filtered.map((e) => (
          <EventCard key={e.id} event={e} status={e.status} />
        ))}
      </div>
    </div>
  )
}
