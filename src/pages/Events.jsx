import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BotanicalSprig } from '../components/BotanicalLine'
import { FilledButton, OutlinedButton } from '../components/Button'
import { formatShortRange, getEventProgress, todayKey } from '../lib/calendarUtils'
import { listCalendarEvents } from '../lib/db'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Past' },
]

const STATUS_LABEL = { upcoming: 'Upcoming', ongoing: 'Ongoing', completed: 'Completed' }

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
      <div>
        <p className="font-label text-xs uppercase tracking-label text-black/40">Challenges</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink-black">Events</h1>
      </div>

      <div className="mt-4 flex gap-2">
        <FilledButton to={`/calendar/${todayKey()}`} className="px-4 py-2 text-xs">
          Add new
        </FilledButton>
        <OutlinedButton to="/calendar" className="px-4 py-2 text-xs">
          View in Calendar
        </OutlinedButton>
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
