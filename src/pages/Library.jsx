import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BotanicalSprig } from '../components/BotanicalLine'
import { FilledButton } from '../components/Button'
import { Drawer } from '../components/Drawer'
import { HamburgerMenu } from '../components/HamburgerMenu'
import { Logo } from '../components/Logo'
import { TYPE_ICONS } from '../components/LibraryIcons'
import { LIBRARY_TYPES, matchesSearch, typeConfig } from '../lib/library'
import { createEntry, getProfile, listEntries, listHighlights } from '../lib/db'

const DEFAULT_HERO_IMAGE = '/hero-sunset.jpg'
const RECENT_LIMIT = 3

const SORTS = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'az', label: 'A–Z' },
]

// entryDate is the date the user picked for the entry (e.g. backdating a
// reflection), separate from updatedAt — parsed from its own y/m/d parts
// rather than `new Date(dateStr)` so it can't shift a day across UTC.
function formatEntryDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function SearchIcon({ className = '' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  )
}

export function Library() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState(null)
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [sort, setSort] = useState('newest')
  const [filterOpen, setFilterOpen] = useState(false)
  const [showAllRecent, setShowAllRecent] = useState(false)
  const [heroImageUrl, setHeroImageUrl] = useState(DEFAULT_HERO_IMAGE)
  const [savedVerseCount, setSavedVerseCount] = useState(0)

  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('reflection')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    listEntries().then(setEntries)
    getProfile()
      .then((p) => {
        if (p.heroImageUrl) setHeroImageUrl(`${p.heroImageUrl}?t=${p.heroImageUpdatedAt || 0}`)
      })
      .catch(() => {})
    listHighlights()
      .then((rows) => setSavedVerseCount(rows.length))
      .catch(() => {})
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    const created = await createEntry({ title: newTitle, type: newType })
    setCreating(false)
    setAddDrawerOpen(false)
    setNewTitle('')
    setNewType('reflection')
    navigate(`/journal/${created.id}`)
  }

  const counts = useMemo(() => {
    const c = {}
    LIBRARY_TYPES.forEach((t) => (c[t.id] = 0))
    entries?.forEach((e) => {
      const type = e.type || 'reflection'
      c[type] = (c[type] || 0) + 1
    })
    return c
  }, [entries])

  const filtered = useMemo(() => {
    if (!entries) return []
    const matches = entries
      .filter((e) => activeType === 'all' || (e.type || 'reflection') === activeType)
      .filter((e) => matchesSearch(e, query))
    const sorted = matches.slice()
    if (sort === 'newest') sorted.sort((a, b) => b.updatedAt - a.updatedAt)
    else if (sort === 'oldest') sorted.sort((a, b) => a.updatedAt - b.updatedAt)
    else if (sort === 'az') sorted.sort((a, b) => a.title.localeCompare(b.title))
    return sorted
  }, [entries, activeType, query, sort])

  const hasFilter = activeType !== 'all' || query.trim()
  const visibleRecent = hasFilter || showAllRecent ? filtered : filtered.slice(0, RECENT_LIMIT)

  return (
    <div className="min-h-screen pb-6">
      <div className="relative h-56 w-full overflow-hidden bg-deep-indigo">
        <img src={heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/0 to-black/10" />
        <BotanicalSprig className="absolute bottom-2 right-8 h-20 w-20 opacity-25" color="var(--color-pure-white)" />

        <header className="relative z-10 flex items-center justify-between px-6 pt-8">
          <Link to="/" className="text-pure-white">
            <Logo size={20} />
          </Link>
          <HamburgerMenu light />
        </header>

        <div className="relative z-10 px-6 pt-6">
          <h1 className="font-display text-2xl font-semibold text-ink-black">Journal</h1>
          <p className="mt-1 font-body text-xs text-black/70">Capture what God is teaching you.</p>
        </div>
      </div>

      <div className="px-6">
        <div className="relative z-10 mt-5 flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search studies, sermons, prayers…"
              className="w-full rounded-card border border-black/10 bg-pure-white py-3 pl-10 pr-4 font-body text-sm focus:outline-none"
            />
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              aria-label="Sort entries"
              className="flex h-full w-11 items-center justify-center rounded-card border border-black/10 bg-pure-white"
            >
              <FilterIcon />
            </button>

            {filterOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 top-full z-40 mt-2 w-36 overflow-hidden rounded-card border border-black/8 bg-pure-white shadow-xl-2">
                  {SORTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSort(s.id)
                        setFilterOpen(false)
                      }}
                      className={`block w-full px-4 py-3 text-left font-label text-[11px] uppercase tracking-label ${
                        sort === s.id ? 'text-deep-indigo' : 'text-black/50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {!hasFilter && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {LIBRARY_TYPES.map((t) => {
              const Icon = TYPE_ICONS[t.id]
              // Scripture isn't a journal_entries type anyone actually
              // writes — it's the verses saved from the Bible tab, so this
              // tile points at that list instead of filtering entries.
              // Studies now have their own hierarchy (series -> chapters),
              // so that tile opens the series table of contents instead.
              const isScripture = t.id === 'scripture'
              const isStudy = t.id === 'study'
              const linksElsewhere = isScripture || isStudy
              const Tag = linksElsewhere ? Link : 'button'
              return (
                <Tag
                  key={t.id}
                  type={linksElsewhere ? undefined : 'button'}
                  to={isScripture ? '/bible/saved' : isStudy ? '/series' : undefined}
                  onClick={linksElsewhere ? undefined : () => setActiveType(t.id)}
                  className="flex items-center justify-between rounded-card p-3 text-left"
                  style={{ backgroundColor: `${t.hex}33` }}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon color="#234386" size={20} />
                    <span>
                      <span className="block font-display text-base font-medium text-ink-black">{t.label}</span>
                      <span className="block font-label text-[10px] uppercase tracking-label text-black/50">
                        {isScripture ? `${savedVerseCount} verses` : `${counts[t.id] || 0} entries`}
                      </span>
                    </span>
                  </span>
                  <span className="font-display text-lg text-deep-indigo">›</span>
                </Tag>
              )
            })}
          </div>
        )}

        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold text-ink-black">
              {hasFilter ? `Results (${filtered.length})` : 'Recently added'}
            </h2>
            {hasFilter ? (
              <button
                type="button"
                onClick={() => setAddDrawerOpen(true)}
                className="font-label text-xs uppercase tracking-label text-deep-indigo"
              >
                + Add new
              </button>
            ) : (
              filtered.length > RECENT_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAllRecent((v) => !v)}
                  className="font-label text-xs uppercase tracking-label text-deep-indigo"
                >
                  {showAllRecent ? 'Show less' : 'View all'}
                </button>
              )
            )}
          </div>

          <div className="mt-3 flex flex-col gap-3">
            {entries === null && <p className="py-4 font-body text-sm text-black/50">Loading…</p>}
            {entries && filtered.length === 0 && (
              <p className="py-4 font-body text-sm text-black/50">
                {hasFilter ? 'Nothing matches that filter.' : 'Nothing here yet — tap + Add new to start.'}
              </p>
            )}
            {visibleRecent.map((entry) => {
              const cfg = typeConfig(entry.type || 'reflection')
              const Icon = TYPE_ICONS[entry.type || 'reflection']
              return (
                <Link
                  key={entry.id}
                  to={`/journal/${entry.id}`}
                  className="flex items-center gap-3 rounded-card border border-black/10 bg-pure-white px-4 py-3"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card"
                    style={{ backgroundColor: `${cfg.hex}33` }}
                  >
                    <Icon color="#234386" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-medium text-ink-black">{entry.title}</p>
                    <p className="mt-0.5 font-body text-xs text-black/50">
                      {cfg.singular} · {formatEntryDate(entry.entryDate)}
                    </p>
                  </div>
                  <span className="shrink-0 text-black/30">›</span>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      <Drawer open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)} title="Add to your journal">
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. God's Faithfulness"
            autoFocus
            className="w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
          />

          <label className="block">
            <span className="font-label text-[11px] uppercase tracking-label text-black/40">Type</span>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-label text-xs uppercase tracking-label text-deep-indigo focus:outline-none"
            >
              {LIBRARY_TYPES.filter((t) => t.id !== 'scripture').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.singular}
                </option>
              ))}
            </select>
          </label>

          <FilledButton type="submit" disabled={creating} className="mt-2">
            {creating ? 'Creating…' : 'Create'}
          </FilledButton>
        </form>
      </Drawer>
    </div>
  )
}
