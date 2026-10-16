import { Link } from 'react-router-dom'
import { categoryHex } from '../lib/calendar'
import { formatShortRange } from '../lib/calendarUtils'

const STATUS_PREFIX = { ongoing: 'Ongoing · ', completed: 'Completed · ', upcoming: '' }

export function EventCard({ event, status }) {
  return (
    <Link to={`/events/${event.id}`}>
      <div className="flex items-start gap-3 rounded-card border border-black/10 bg-pure-white px-4 py-3">
        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryHex(event) }} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-medium text-ink-black">{event.title}</p>
          <p className="font-label text-[10px] uppercase tracking-label text-black/40">
            {STATUS_PREFIX[status] || ''}
            {formatShortRange(event.startDate, event.endDate)}
          </p>
          {event.notes && <p className="mt-1 line-clamp-2 font-body text-xs text-black/60">{event.notes}</p>}
        </div>
        <span className="mt-1.5 shrink-0 font-label text-[10px] uppercase tracking-label text-deep-indigo">
          View →
        </span>
      </div>
    </Link>
  )
}
