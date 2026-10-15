import { Calendar } from '../components/Calendar'

export function CalendarPage() {
  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <p className="font-label text-xs uppercase tracking-label text-black/40">Plan</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink-black">Calendar</h1>

      <div className="mt-6">
        <Calendar />
      </div>
    </div>
  )
}
