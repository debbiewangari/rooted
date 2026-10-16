import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BotanicalSprig } from '../components/BotanicalLine'
import { listThemes } from '../lib/db'

const SORTS = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'az', label: 'A–Z' },
]

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  )
}

export function Themes() {
  const [themes, setThemes] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    listThemes().then(setThemes)
  }, [])

  const filtered = useMemo(() => {
    if (!themes) return []
    const q = query.trim().toLowerCase()
    const matches = q
      ? themes.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.subtitle?.toLowerCase().includes(q) ||
            t.reference.toLowerCase().includes(q),
        )
      : themes

    const sorted = matches.slice()
    if (sort === 'newest') sorted.sort((a, b) => b.createdAt - a.createdAt)
    else if (sort === 'oldest') sorted.sort((a, b) => a.createdAt - b.createdAt)
    else if (sort === 'az') sorted.sort((a, b) => a.title.localeCompare(b.title))
    return sorted
  }, [themes, query, sort])

  return (
    <div className="relative min-h-screen px-6 pt-10 pb-6">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-label text-xs uppercase tracking-label text-black/40">Browse</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink-black">Themes</h1>
        </div>
        <Link to="/themes/new" className="font-label text-xs uppercase tracking-label text-deep-indigo">
          + Add new
        </Link>
      </div>

      <div className="relative mt-5 flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search themes…"
          className="flex-1 rounded-card border border-black/10 bg-pure-white px-4 py-3 font-body text-sm focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setFilterOpen((o) => !o)}
          aria-label="Sort themes"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-black/10 bg-pure-white"
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

      {themes === null && <p className="mt-8 font-body text-sm text-black/50">Loading…</p>}

      {themes?.length === 0 && (
        <Link
          to="/themes/new"
          className="mt-8 flex h-56 w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-black/20 bg-pure-white"
        >
          <span className="font-display text-3xl text-deep-indigo">+</span>
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">Add your first theme</span>
        </Link>
      )}

      {themes && themes.length > 0 && filtered.length === 0 && (
        <p className="mt-8 font-body text-sm text-black/50">No themes match “{query}”.</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        {filtered.map((theme, i) => (
          <Link key={theme.id} to={`/themes/${theme.id}`}>
            <div className="relative h-56 w-full overflow-hidden rounded-card bg-warm-sand shadow-xl-2">
              {theme.imageUrl ? (
                <img src={theme.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BotanicalSprig className="h-14 w-14 opacity-60" color="var(--color-deep-indigo)" />
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-pill bg-black/35 px-2 py-0.5 font-label text-[10px] text-pure-white">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <p className="mt-2 font-display text-base font-medium text-ink-black">{theme.title}</p>
            {theme.subtitle && <p className="font-body text-xs text-black/50">{theme.subtitle}</p>}
            <p className="mt-1 font-label text-[10px] uppercase tracking-label text-deep-indigo">
              {theme.reference}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
