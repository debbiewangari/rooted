import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TYPE_ICONS } from './LibraryIcons'
import { categoryHex } from '../lib/calendar'
import { getEventProgress, enumerateDates } from '../lib/calendarUtils'
import { entryText, plainPreview, typeConfig } from '../lib/library'
import { listCalendarEvents, listEntries } from '../lib/db'

const DISMISSED_KEY = 'rooted:lookingBack:dismissed'
const LAST_SHOWN_KEY = 'rooted:lookingBack:last'
const MIN_ENTRY_AGE_DAYS = 14
const SAMPLE_HEX = '#ffc400'

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9.5h16M8 3v4M16 3v4" strokeLinecap="round" />
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
  iconHex: SAMPLE_HEX,
  isEncounter: true,
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
      iconHex: categoryHex(event),
      isEncounter: true,
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
      iconHex: cfg.hex,
      entryType: entry.type,
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

  const Icon = item.isEncounter ? CalendarIcon : TYPE_ICONS[item.entryType || 'reflection']

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

      <div className="mt-4 rounded-card border border-black/8 bg-pure-white px-5 py-5 shadow-xl-2">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card"
            style={{ backgroundColor: `${item.iconHex}33` }}
          >
            <Icon color="#234386" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="font-label text-[11px] uppercase tracking-label text-black/40">
                {item.eyebrow} · {item.timeAgo}
              </p>
              {item.badge && (
                <span className="rounded-pill bg-mist px-2 py-0.5 font-label text-[9px] uppercase tracking-label text-deep-indigo">
                  {item.badge}
                </span>
              )}
            </div>
            <p className="mt-1 font-display text-base font-semibold text-ink-black">{item.title}</p>
            {item.subtitle && <p className="font-body text-xs text-black/50">{item.subtitle}</p>}
          </div>
        </div>

        <p className="mt-3 font-body text-sm leading-relaxed text-black/70">{item.description}</p>

        <div className="mt-3 border-t border-black/8 pt-3">
          <Link
            to={item.href}
            className="inline-flex items-center gap-1 font-label text-[11px] uppercase tracking-label text-deep-indigo"
          >
            {item.ctaLabel} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
