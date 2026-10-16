import { Link } from 'react-router-dom'
import { BotanicalSprig } from './BotanicalLine'
import { categoryHex } from '../lib/calendar'
import { formatShortRange } from '../lib/calendarUtils'

function daysUntil(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((start - today) / 86400000)
}

function StatusPill({ event, progress }) {
  if (progress.status === 'ongoing') {
    return (
      <span className="inline-block rounded-pill bg-sky-blue/10 px-2 py-0.5 font-label text-[9px] uppercase tracking-label text-deep-indigo/70">
        In progress
      </span>
    )
  }
  if (progress.status === 'completed') {
    return (
      <span className="inline-block rounded-pill bg-black/5 px-2 py-0.5 font-label text-[9px] uppercase tracking-label text-black/40">
        Completed
      </span>
    )
  }
  const inDays = daysUntil(event.startDate)
  if (inDays <= 14) {
    return (
      <span className="inline-block rounded-pill bg-burnt-orange/8 px-2 py-0.5 font-label text-[9px] uppercase tracking-label text-burnt-orange/70">
        Starts in {inDays} day{inDays === 1 ? '' : 's'}
      </span>
    )
  }
  return (
    <span className="inline-block rounded-pill bg-black/5 px-2 py-0.5 font-label text-[9px] uppercase tracking-label text-black/40">
      Upcoming
    </span>
  )
}

export function EventCard({ event, progress }) {
  return (
    <Link to={`/events/${event.id}`}>
      <div className="flex items-center gap-3 rounded-card border border-black/10 bg-pure-white px-4 py-3">
        <BotanicalSprig className="mt-0.5 h-4 w-4 shrink-0 self-start" color={categoryHex(event)} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-medium text-ink-black">{event.title}</p>
          <p className="font-label text-[10px] uppercase tracking-label text-black/40">
            {formatShortRange(event.startDate, event.endDate)}
          </p>
          {progress.status === 'ongoing' && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 w-36 overflow-hidden rounded-pill bg-black/8">
                <div
                  className="h-full rounded-pill bg-deep-indigo transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <span className="font-label text-[10px] uppercase tracking-label text-black/40">
                {progress.dayIndex}/{progress.totalDays}
              </span>
            </div>
          )}
          <div className="mt-2">
            <StatusPill event={event} progress={progress} />
          </div>
        </div>
        <span className="shrink-0 font-label text-[10px] uppercase tracking-label text-deep-indigo">→</span>
      </div>
    </Link>
  )
}
