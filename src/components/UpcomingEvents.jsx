import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from './EventCard'
import { getEventProgress, todayKey } from '../lib/calendarUtils'
import { listCalendarEvents } from '../lib/db'

export function UpcomingEvents({ limit = 3 }) {
  const [events, setEvents] = useState(null)

  useEffect(() => {
    listCalendarEvents().then((rows) => {
      const today = todayKey()
      const upcoming = rows
        .filter((e) => e.endDate >= today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, limit)
      setEvents(upcoming)
    })
  }, [limit])

  return (
    <section className="relative z-10 mt-8 px-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold text-ink-black">My Experiences</h2>
        <Link to="/events" className="font-label text-xs uppercase tracking-label text-deep-indigo">
          View all
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {events?.length === 0 && (
          <p className="font-body text-sm text-black/50">Nothing planned yet — tap View all to add dates.</p>
        )}
        {events?.map((e) => (
          <EventCard key={e.id} event={e} progress={getEventProgress(e)} />
        ))}
      </div>
    </section>
  )
}
