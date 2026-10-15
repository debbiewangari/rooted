import { Calendar } from '../components/Calendar'

export function CalendarPage() {
  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <p className="font-label text-xs uppercase tracking-label text-deep-indigo">Plan</p>
      <h1 className="font-display text-4xl uppercase text-deep-indigo">Calendar</h1>

      <div className="mt-6">
        <Calendar />
      </div>
    </div>
  )
}
