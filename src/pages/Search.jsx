import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TYPE_ICONS } from '../components/LibraryIcons'
import { NEW_TESTAMENT, OLD_TESTAMENT } from '../lib/bibleBooks'
import { listCalendarEvents, listEntries, listHighlights, listThemes } from '../lib/db'
import { formatShortRange } from '../lib/calendarUtils'
import { matchesSearch, typeConfig } from '../lib/library'

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT]
const RESULT_LIMIT = 5

export function Search() {
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState([])
  const [themes, setThemes] = useState([])
  const [events, setEvents] = useState([])
  const [highlights, setHighlights] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      listEntries().catch(() => []),
      listThemes().catch(() => []),
      listCalendarEvents().catch(() => []),
      listHighlights().catch(() => []),
    ]).then(([e, t, ev, h]) => {
      setEntries(e)
      setThemes(t)
      setEvents(ev)
      setHighlights(h)
      setLoaded(true)
    })
  }, [])

  const q = query.trim().toLowerCase()

  const matchedEntries = useMemo(
    () => (q ? entries.filter((e) => matchesSearch(e, q)).slice(0, RESULT_LIMIT) : []),
    [entries, q],
  )
  const matchedThemes = useMemo(
    () =>
      q
        ? themes
            .filter((t) => [t.title, t.subtitle, t.reference].some((v) => (v || '').toLowerCase().includes(q)))
            .slice(0, RESULT_LIMIT)
        : [],
    [themes, q],
  )
  const matchedEvents = useMemo(
    () =>
      q
        ? events
            .filter((e) => [e.title, e.notes].some((v) => (v || '').toLowerCase().includes(q)))
            .slice(0, RESULT_LIMIT)
        : [],
    [events, q],
  )
  const matchedVerses = useMemo(
    () =>
      q
        ? highlights
            .filter((h) => [h.reference, h.text].some((v) => (v || '').toLowerCase().includes(q)))
            .slice(0, RESULT_LIMIT)
        : [],
    [highlights, q],
  )
  const matchedBooks = useMemo(
    () => (q ? ALL_BOOKS.filter((b) => b.name.toLowerCase().includes(q)).slice(0, RESULT_LIMIT) : []),
    [q],
  )

  const totalResults =
    matchedEntries.length + matchedThemes.length + matchedEvents.length + matchedVerses.length + matchedBooks.length

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <Link to="/" className="font-label text-[11px] uppercase tracking-label text-deep-indigo">
        ← Back home
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold text-ink-black">Search</h1>

      <div className="relative mt-4">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search journal, themes, encounters, verses, the Bible…"
          className="w-full rounded-card border border-black/10 bg-pure-white py-3 pl-10 pr-4 font-body text-sm focus:outline-none"
        />
      </div>

      {!q && (
        <p className="mt-8 font-body text-sm text-black/50">
          Search across your journal, themes, encounters, saved verses and the Bible.
        </p>
      )}

      {q && !loaded && <p className="mt-8 font-body text-sm text-black/50">Loading…</p>}

      {q && loaded && totalResults === 0 && (
        <p className="mt-8 font-body text-sm text-black/50">No results for “{query}”.</p>
      )}

      {q && loaded && totalResults > 0 && (
        <div className="mt-6 flex flex-col gap-6">
          {matchedEntries.length > 0 && (
            <section>
              <p className="font-label text-[11px] uppercase tracking-label text-black/40">Journal</p>
              <div className="mt-2 flex flex-col gap-2">
                {matchedEntries.map((entry) => {
                  const cfg = typeConfig(entry.type || 'reflection')
                  const Icon = TYPE_ICONS[entry.type || 'reflection']
                  return (
                    <Link
                      key={entry.id}
                      to={`/journal/${entry.id}`}
                      className="flex items-center gap-3 rounded-card border border-black/10 bg-pure-white px-4 py-3"
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card"
                        style={{ backgroundColor: `${cfg.hex}33` }}
                      >
                        <Icon color="#234386" size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base font-medium text-ink-black">{entry.title}</p>
                        <p className="mt-0.5 font-body text-xs text-black/50">{cfg.singular}</p>
                      </div>
                      <span className="shrink-0 text-black/30">›</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {matchedThemes.length > 0 && (
            <section>
              <p className="font-label text-[11px] uppercase tracking-label text-black/40">Themes</p>
              <div className="mt-2 flex flex-col gap-2">
                {matchedThemes.map((theme) => (
                  <Link
                    key={theme.id}
                    to={`/themes/${theme.id}`}
                    className="flex items-center justify-between gap-3 rounded-card border border-black/10 bg-pure-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-medium text-ink-black">{theme.title}</p>
                      {theme.reference && (
                        <p className="mt-0.5 font-label text-[10px] uppercase tracking-label text-deep-indigo">
                          {theme.reference}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-black/30">›</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {matchedEvents.length > 0 && (
            <section>
              <p className="font-label text-[11px] uppercase tracking-label text-black/40">Encounters</p>
              <div className="mt-2 flex flex-col gap-2">
                {matchedEvents.map((e) => (
                  <Link
                    key={e.id}
                    to={`/events/${e.id}`}
                    className="flex items-center justify-between gap-3 rounded-card border border-black/10 bg-pure-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-medium text-ink-black">{e.title}</p>
                      <p className="mt-0.5 font-label text-[10px] uppercase tracking-label text-black/40">
                        {formatShortRange(e.startDate, e.endDate)}
                      </p>
                    </div>
                    <span className="shrink-0 text-black/30">›</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {matchedVerses.length > 0 && (
            <section>
              <p className="font-label text-[11px] uppercase tracking-label text-black/40">Saved verses</p>
              <div className="mt-2 flex flex-col gap-2">
                {matchedVerses.map((h) => (
                  <Link
                    key={h.id}
                    to={`/bible/read?ref=${encodeURIComponent(h.reference)}`}
                    className="rounded-card border border-black/10 bg-pure-white px-4 py-3"
                  >
                    <p className="font-label text-[11px] uppercase tracking-label text-deep-indigo">{h.reference}</p>
                    <p className="mt-1 truncate font-body text-sm text-black/70">{h.text}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {matchedBooks.length > 0 && (
            <section>
              <p className="font-label text-[11px] uppercase tracking-label text-black/40">Bible</p>
              <div className="mt-2 flex flex-col gap-2">
                {matchedBooks.map((b) => (
                  <Link
                    key={b.name}
                    to={`/bible/read?ref=${encodeURIComponent(`${b.name} 1`)}`}
                    className="flex items-center justify-between gap-3 rounded-card border border-black/10 bg-pure-white px-4 py-3"
                  >
                    <p className="font-display text-base font-medium text-ink-black">{b.name}</p>
                    <span className="shrink-0 text-black/30">›</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
