import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { FilledButton } from '../components/Button'
import { BotanicalSprig } from '../components/BotanicalLine'
import { PrayerCards } from '../components/PrayerCards'
import { DEFAULT_TRANSLATION, fetchPassage } from '../lib/bible'
import { getEventProgress } from '../lib/calendarUtils'
import { getCalendarEvent } from '../lib/db'

const TRANSLATION_KEY = 'rooted:translation'

const STATUS_LABEL = { upcoming: 'Upcoming', ongoing: 'Ongoing', completed: 'Completed' }

export function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [anchorQuote, setAnchorQuote] = useState('')

  useEffect(() => {
    getCalendarEvent(id).then((row) => {
      if (!row) {
        setNotFound(true)
        return
      }
      setEvent(row)
    })
  }, [id])

  useEffect(() => {
    if (!event?.anchorVerse) {
      setAnchorQuote('')
      return
    }
    const translation = localStorage.getItem(TRANSLATION_KEY) || DEFAULT_TRANSLATION
    fetchPassage(event.anchorVerse, translation)
      .then(({ data }) => setAnchorQuote((data.text || '').trim()))
      .catch(() => setAnchorQuote(''))
  }, [event?.anchorVerse])

  useEffect(() => {
    if (notFound) navigate('/calendar', { replace: true })
  }, [notFound, navigate])

  if (notFound) return null
  if (!event) {
    return <p className="px-6 pt-10 font-body text-sm text-black/50">Loading…</p>
  }

  const progress = getEventProgress(event)
  const ctaLabel =
    progress.status === 'upcoming'
      ? 'Start Day 1'
      : progress.status === 'completed'
        ? `Review Day ${progress.totalDays}`
        : `Continue to Day ${progress.dayIndex}`

  return (
    <div className="min-h-screen pb-6">
      <div className="relative h-64 w-full overflow-hidden bg-warm-sand">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BotanicalSprig className="h-20 w-20 opacity-50" color="var(--color-deep-indigo)" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
        <Link
          to="/calendar"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-pill bg-pure-white/90 font-display text-lg text-deep-indigo"
          aria-label="Back to calendar"
        >
          ←
        </Link>
        <Link
          to={`/events/${id}/edit`}
          className="absolute right-4 top-4 rounded-pill bg-pure-white/90 px-4 py-2 font-label text-[11px] uppercase tracking-label text-deep-indigo"
        >
          Edit
        </Link>
        <span className="absolute bottom-4 left-4 rounded-pill bg-black/45 px-3 py-1 font-label text-[10px] uppercase tracking-label text-pure-white">
          {STATUS_LABEL[progress.status]}
        </span>
      </div>

      <div className="px-6 pt-5">
        <h1 className="font-display text-2xl font-semibold text-ink-black">{event.title}</h1>
        <p className="mt-1 font-label text-[11px] uppercase tracking-label text-black/40">
          {progress.totalDays} day{progress.totalDays === 1 ? '' : 's'} · {event.startDate}
          {event.startTime ? ` ${event.startTime}` : ''} – {event.endDate}
          {event.endTime ? ` ${event.endTime}` : ''}
        </p>

        {event.theme && (
          <div className="mt-4">
            <p className="font-label text-[10px] uppercase tracking-label text-black/40">Theme</p>
            <p className="font-display text-base font-medium text-ink-black">{event.theme}</p>
          </div>
        )}

        {event.anchorVerse && (
          <div className="mt-4">
            <p className="font-label text-[10px] uppercase tracking-label text-black/40">Anchor Verse</p>
            <p className="font-display text-base font-medium text-ink-black">{event.anchorVerse}</p>
            {anchorQuote && <p className="mt-1 font-body text-sm text-black/60">“{anchorQuote}”</p>}
          </div>
        )}

        {event.notes && (
          <div className="mt-4">
            <p className="font-label text-[10px] uppercase tracking-label text-black/40">About this event</p>
            <p className="mt-1 font-body text-sm text-black/70">{event.notes}</p>
          </div>
        )}

        <Card className="mt-6">
          <p className="font-label text-[10px] uppercase tracking-label text-black/40">Your Progress</p>
          <p className="mt-1 font-display text-lg font-semibold text-ink-black">
            {progress.status === 'upcoming' ? `Starts ${event.startDate}` : `Day ${progress.dayIndex} of ${progress.totalDays}`}
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-cream-paper">
            <div
              className="h-full rounded-pill bg-deep-indigo transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <FilledButton to={`/events/${id}/day/${progress.currentDate}`} className="mt-4 w-full">
            {ctaLabel}
          </FilledButton>
        </Card>

        <PrayerCards eventId={id} />
      </div>
    </div>
  )
}
