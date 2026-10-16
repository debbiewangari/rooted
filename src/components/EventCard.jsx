import { Link } from 'react-router-dom'
import { categoryHex } from '../lib/calendar'
import { formatShortRange } from '../lib/calendarUtils'

function daysUntil(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((start - today) / 86400000)
}

function Cta({ event, progress }) {
  if (progress.status === 'ongoing') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-deep-indigo px-3 py-1 font-label text-[10px] uppercase tracking-label text-pure-white">
        Continue <span aria-hidden="true">›</span>
      </span>
    )
  }
  if (progress.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-black/5 px-3 py-1 font-label text-[10px] uppercase tracking-label text-black/40">
        Completed <span aria-hidden="true">›</span>
      </span>
    )
  }
  const inDays = daysUntil(event.startDate)
  if (inDays <= 14) {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-burnt-orange/10 px-3 py-1 font-label text-[10px] uppercase tracking-label text-burnt-orange">
        Starts in {inDays} day{inDays === 1 ? '' : 's'} <span aria-hidden="true">›</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-sky-blue/10 px-3 py-1 font-label text-[10px] uppercase tracking-label text-deep-indigo">
      Upcoming <span aria-hidden="true">›</span>
    </span>
  )
}

export function EventCard({ event, progress }) {
  return (
    <Link to={`/events/${event.id}`}>
      <div className="flex items-start gap-3 rounded-card border border-black/10 bg-pure-white px-4 py-3">
        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryHex(event) }} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-medium text-ink-black">{event.title}</p>
          <p className="font-label text-[10px] uppercase tracking-label text-black/40">
            {progress.status === 'ongoing' ? `Day ${progress.dayIndex} of ${progress.totalDays} · ` : ''}
            {formatShortRange(event.startDate, event.endDate)}
          </p>
          {progress.status === 'ongoing' && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-cream-paper">
              <div
                className="h-full rounded-pill bg-deep-indigo transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          )}
          <div className="mt-2">
            <Cta event={event} progress={progress} />
          </div>
        </div>
      </div>
    </Link>
  )
}
