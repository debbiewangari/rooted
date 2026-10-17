import { Link } from 'react-router-dom'
import { Calendar } from '../components/Calendar'
import { todayKey } from '../lib/calendarUtils'

export function CalendarPage() {
  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <Link to="/events" className="font-label text-[11px] uppercase tracking-label text-deep-indigo">
        ← Back to Encounters
      </Link>

      <div className="mt-4 flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink-black">Calendar</h1>
        <Link
          to={`/calendar/${todayKey()}`}
          className="font-label text-xs uppercase tracking-label text-deep-indigo"
        >
          + Add new
        </Link>
      </div>

      <div className="mt-6">
        <Calendar />
      </div>
    </div>
  )
}
