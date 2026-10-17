import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BotanicalSprig } from '../components/BotanicalLine'
import { HamburgerMenu } from '../components/HamburgerMenu'
import { Logo } from '../components/Logo'
import { formatShortRange, getEventProgress } from '../lib/calendarUtils'
import { getProfile, listCalendarEvents } from '../lib/db'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Past' },
]

const STATUS_LABEL = { upcoming: 'Upcoming', ongoing: 'Ongoing', completed: 'Completed' }
const DEFAULT_HERO_IMAGE = '/hero-sunset.jpg'

function SearchIcon({ className = '' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  )
}

function CalendarGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9h16M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}

export function Events() {
  const [events, setEvents] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [heroImageUrl, setHeroImageUrl] = useState(DEFAULT_HERO_IMAGE)

  useEffect(() => {
    listCalendarEvents().then((rows) => {
      setEvents(rows.map((e) => ({ ...e, status: getEventProgress(e).status })))
    })
    getProfile()
      .then((p) => {
        if (p.heroImageUrl) setHeroImageUrl(`${p.heroImageUrl}?t=${p.heroImageUpdatedAt || 0}`)
      })
      .catch(() => {})
  }, [])

  const q = query.trim().toLowerCase()
  const filtered =
    events?.filter((e) => (filter === 'all' || e.status === filter) && (!q || e.title.toLowerCase().includes(q))) ||
    []

  return (
    <div className="min-h-screen pb-6">
      <div className="relative h-56 w-full overflow-hidden bg-deep-indigo">
        <img src={heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/0 to-black/10" />
        <BotanicalSprig className="absolute bottom-2 right-8 h-20 w-20 opacity-25" color="var(--color-pure-white)" />

        <header className="relative z-10 flex items-center justify-between px-6 pt-8">
          <Link to="/" className="text-pure-white">
            <Logo size={20} />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/calendar"
              aria-label="View in calendar"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-pure-white/15"
            >
              <CalendarGlyph />
            </Link>
            <HamburgerMenu light />
          </div>
        </header>

        <div className="relative z-10 px-6 pt-6">
          <h1 className="font-display text-2xl font-semibold text-ink-black">Experiences</h1>
          <p className="mt-1 font-body text-xs text-black/70">Track your challenges, fasts and journeys of faith.</p>
        </div>
      </div>

      <div className="px-6">
        <div className="relative z-10 mt-5 flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search experiences…"
              className="w-full rounded-card border border-black/10 bg-pure-white py-3 pl-10 pr-4 font-body text-sm focus:outline-none"
            />
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              aria-label="Filter experiences"
              className="flex h-full w-11 items-center justify-center rounded-card border border-black/10 bg-pure-white"
            >
              <FilterIcon />
            </button>

            {filterOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 top-full z-40 mt-2 w-36 overflow-hidden rounded-card border border-black/8 bg-pure-white shadow-xl-2">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setFilter(f.id)
                        setFilterOpen(false)
                      }}
                      className={`block w-full px-4 py-3 text-left font-label text-[11px] uppercase tracking-label ${
                        filter === f.id ? 'text-deep-indigo' : 'text-black/50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
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
    </div>
  )
}
