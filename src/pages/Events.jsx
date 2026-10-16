import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BotanicalSprig } from '../components/BotanicalLine'
import { formatShortRange, getEventProgress, todayKey } from '../lib/calendarUtils'
import { listCalendarEvents } from '../lib/db'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Past' },
]

const STATUS_LABEL = { upcoming: 'Upcoming', ongoing: 'Ongoing', completed: 'Completed' }

function CalendarGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9h16M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}

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
          <p className="font-label text-xs uppercase tracking-label text-black/40">Challenges</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink-black">Events</h1>
        </div>
        <Link
          to="/calendar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-black/10 bg-pure-white"
          aria-label="View in calendar"
        >
          <CalendarGlyph />
        </Link>
      </div>

      <Link
        to={`/calendar/${todayKey()}`}
        className="mt-3 inline-block font-label text-[11px] uppercase tracking-label text-deep-indigo"
      >
        + Add new
      </Link>

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

      {events === null && <p className="mt-8 font-body text-sm text-black/50">Loading…</p>}
      {events && filtered.length === 0 && (
        <p className="mt-8 font-body text-sm text-black/50">Nothing here yet.</p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4">
        {filtered.map((e) => (
          <Link key={e.id} to={`/events/${e.id}`}>
            <div className="relative h-56 w-full overflow-hidden rounded-card bg-warm-sand shadow-xl-2">
              {e.coverImageUrl ? (
                <img src={e.coverImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BotanicalSprig className="h-14 w-14 opacity-60" color="var(--color-deep-indigo)" />
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-pill bg-black/35 px-2 py-0.5 font-label text-[10px] uppercase tracking-label text-pure-white">
                {STATUS_LABEL[e.status]}
              </span>
            </div>
            <p className="mt-2 truncate font-display text-base font-medium text-ink-black">{e.title}</p>
            <p className="mt-1 font-label text-[10px] uppercase tracking-label text-deep-indigo">
              {formatShortRange(e.startDate, e.endDate)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
