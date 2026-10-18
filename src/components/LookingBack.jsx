import { useEffect, useState } from 'react'
import { BotanicalSprig } from './BotanicalLine'
import { FilledButton } from './Button'
import { getEventProgress, enumerateDates } from '../lib/calendarUtils'
import { entryText, plainPreview, typeConfig } from '../lib/library'
import { listCalendarEvents, listEntries } from '../lib/db'

const DEFAULT_IMAGE = '/hero-sunset.jpg'
const DISMISSED_KEY = 'rooted:lookingBack:dismissed'
const LAST_SHOWN_KEY = 'rooted:lookingBack:last'
const MIN_ENTRY_AGE_DAYS = 14

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date - start) / 86400000)
}

function timeAgoLabel(timestamp) {
  const days = Math.floor((Date.now() - timestamp) / 86400000)
  if (days < 1) return 'Today'
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`
  if (days < 60) {
    const weeks = Math.round(days / 7)
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  }
  const months = Math.round(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

function readDismissed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function addDismissed(key) {
  const set = readDismissed()
  set.add(key)
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]))
}

// A realistic stand-in shown only when the account has nothing old enough
// to resurface yet — never written to the database, purely a visual
// preview of what this section looks like once it has real content to draw
// on.
const SAMPLE_ITEM = {
  key: 'sample',
  isSample: true,
  imageUrl: DEFAULT_IMAGE,
  eyebrow: 'Completed Encounter',
  timeAgo: '2 months ago',
  title: 'Hallelujah Challenge',
  subtitle: 'The Lord Reigns',
  description: 'Revisit the Scriptures, prayer points and notes you recorded during this season.',
  badge: '25 days',
  ctaLabel: 'Revisit this season',
  href: '/events',
}

function buildCandidates(events, entries) {
  const candidates = []

  events.forEach((event) => {
    const progress = getEventProgress(event)
    if (progress.status !== 'completed') return
    const totalDays = enumerateDates(event.startDate, event.endDate).length
    const endTimestamp = new Date(`${event.endDate}T00:00:00`).getTime()
    candidates.push({
      key: `encounter:${event.id}`,
      imageUrl: event.coverImageUrl || DEFAULT_IMAGE,
      eyebrow: 'Completed Encounter',
      timeAgo: timeAgoLabel(endTimestamp),
      title: event.title,
      subtitle: event.theme || '',
      description: 'Revisit the Scriptures, prayer points and notes you recorded during this season.',
      badge: `${totalDays} day${totalDays === 1 ? '' : 's'}`,
      ctaLabel: 'Revisit this season',
      href: `/events/${event.id}`,
    })
  })

  entries.forEach((entry) => {
    if (!entry.entryDate) return
    const [y, m, d] = entry.entryDate.split('-').map(Number)
    const entryTimestamp = new Date(y, m - 1, d).getTime()
    const ageDays = Math.floor((Date.now() - entryTimestamp) / 86400000)
    if (ageDays < MIN_ENTRY_AGE_DAYS) return
    const cfg = typeConfig(entry.type || 'reflection')
    const excerpt = plainPreview(entryText(entry), 120)
    candidates.push({
      key: `entry:${entry.id}`,
      imageUrl: DEFAULT_IMAGE,
      eyebrow: cfg.singular,
      timeAgo: timeAgoLabel(entryTimestamp),
      title: entry.title,
      subtitle: entry.reference || '',
      description: excerpt || 'Revisit what you recorded.',
      badge: null,
      ctaLabel: `Revisit this ${cfg.singular.toLowerCase()}`,
      href: `/journal/${entry.id}`,
    })
  })

  return candidates
}

// Gently resurfaces one past item at a time — a completed encounter, an
// older journal entry of any type — rather than a list, so it reads as an
// invitation to look back, not another feed to scroll. Picks deterministically
// by day-of-year (changes daily, stable within a day) and skips whatever it
// showed last time it can, so the same thing doesn't sit here for long.
export function LookingBack() {
  const [item, setItem] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [events, entries] = await Promise.all([listCalendarEvents(), listEntries()])
    const dismissed = readDismissed()
    const eligible = buildCandidates(events, entries).filter((c) => !dismissed.has(c.key))

    if (eligible.length === 0) {
      setItem(SAMPLE_ITEM)
      return
    }

    const lastShown = localStorage.getItem(LAST_SHOWN_KEY)
    let index = dayOfYear(new Date()) % eligible.length
    if (eligible.length > 1 && eligible[index].key === lastShown) {
      index = (index + 1) % eligible.length
    }
    const chosen = eligible[index]
    localStorage.setItem(LAST_SHOWN_KEY, chosen.key)
    setItem(chosen)
  }

  function handleDismiss() {
    if (!item || item.isSample) {
      setMenuOpen(false)
      return
    }
    addDismissed(item.key)
    setMenuOpen(false)
    load()
  }

  if (!item) return null

  return (
    <section className="relative z-10 mt-8 px-6 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon />
          <h2 className="font-display text-xl font-semibold text-ink-black">Looking Back</h2>
        </div>
        {!item.isSample && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Options"
              className="flex h-8 w-8 items-center justify-center font-display text-lg text-black/40"
            >
              ⋯
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-card border border-black/8 bg-pure-white shadow-xl-2">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="block w-full px-3 py-2.5 text-left font-label text-[10px] uppercase tracking-label text-black/50"
                  >
                    Dismiss this suggestion
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <p className="mt-1 font-body text-xs text-black/60">Some moments are worth returning to.</p>

      <div className="mt-4 overflow-hidden rounded-card border border-black/8 bg-pure-white shadow-xl-2">
        <div className="relative h-36 w-full overflow-hidden bg-warm-sand">
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5" />
          {item.badge && (
            <span className="absolute right-3 top-3 rounded-pill bg-pure-white/90 px-3 py-1 font-label text-[10px] uppercase tracking-label text-deep-indigo">
              {item.badge}
            </span>
          )}
        </div>

        <div className="relative px-5 py-5">
          <BotanicalSprig
            className="pointer-events-none absolute bottom-3 right-3 h-14 w-14 opacity-[0.07]"
            color="var(--color-deep-indigo)"
          />
          <p className="font-label text-[10px] uppercase tracking-label text-black/40">
            {item.eyebrow} · {item.timeAgo}
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-ink-black">{item.title}</p>
          {item.subtitle && <p className="font-body text-sm italic text-black/50">{item.subtitle}</p>}
          <p className="relative mt-2 font-body text-sm text-black/60">{item.description}</p>
          <FilledButton to={item.href} className="relative mt-4 w-full">
            {item.ctaLabel} <span aria-hidden="true">→</span>
          </FilledButton>
        </div>
      </div>
    </section>
  )
}
