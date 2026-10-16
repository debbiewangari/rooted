import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { TYPE_ICONS } from '../components/LibraryIcons'
import { VerseList } from '../components/VerseList'
import { DEFAULT_TRANSLATION, TRANSLATIONS, fetchPassage } from '../lib/bible'
import { matchesSearch, typeConfig } from '../lib/library'
import { getTheme, listEntriesByTag } from '../lib/db'

function formatShortDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  )
}

const ENTRY_SORTS = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'az', label: 'A–Z' },
]

const TRANSLATION_KEY = 'rooted:translation'

export function ThemeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [theme, setTheme] = useState(null)
  const [passage, setPassage] = useState(null)
  const [status, setStatus] = useState('loading') // loading | idle | error | not-found
  const [error, setError] = useState('')
  const [entries, setEntries] = useState(null)
  const [entryQuery, setEntryQuery] = useState('')
  const [entrySort, setEntrySort] = useState('newest')
  const [entryFilterOpen, setEntryFilterOpen] = useState(false)

  useEffect(() => {
    getTheme(id).then((row) => {
      if (!row) {
        setStatus('not-found')
        return
      }
      setTheme(row)

      listEntriesByTag(row.title).then(setEntries)

      if (!row.reference) {
        setStatus('no-reference')
        return
      }

      const translation = localStorage.getItem(TRANSLATION_KEY) || DEFAULT_TRANSLATION
      fetchPassage(row.reference, translation)
        .then(({ data }) => {
          setPassage(data)
          setStatus('idle')
        })
        .catch((err) => {
          setStatus('error')
          setError(err.message || 'Could not load that passage.')
        })
    })
  }, [id])

  useEffect(() => {
    if (status === 'not-found') navigate('/themes', { replace: true })
  }, [status, navigate])

  const filteredEntries = useMemo(() => {
    if (!entries) return []
    const q = entryQuery.trim()
    const matches = q ? entries.filter((e) => matchesSearch(e, q)) : entries
    const sorted = matches.slice()
    if (entrySort === 'newest') sorted.sort((a, b) => b.updatedAt - a.updatedAt)
    else if (entrySort === 'oldest') sorted.sort((a, b) => a.updatedAt - b.updatedAt)
    else if (entrySort === 'az') sorted.sort((a, b) => a.title.localeCompare(b.title))
    return sorted
  }, [entries, entryQuery, entrySort])

  if (status === 'not-found') {
    return null
  }

  if (!theme) {
    return <p className="px-6 pt-10 font-body text-sm text-black/50">Loading…</p>
  }

  const translationId = localStorage.getItem(TRANSLATION_KEY) || DEFAULT_TRANSLATION
  const translationName = TRANSLATIONS.find((t) => t.id === translationId)?.name

  return (
    <div className="min-h-screen pb-6">
      <div className="relative h-72 w-full overflow-hidden bg-warm-sand">
        {theme.imageUrl && <img src={theme.imageUrl} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-cream-paper via-transparent to-black/10" />
        <Link
          to="/themes"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-pill bg-pure-white/90 font-label text-deep-indigo"
          aria-label="Back to themes"
        >
          ←
        </Link>
        <Link
          to={`/themes/${id}/edit`}
          className="absolute right-4 top-4 rounded-pill bg-pure-white/90 px-4 py-2 font-label text-[11px] uppercase tracking-label text-deep-indigo"
        >
          Edit
        </Link>
      </div>

      <div className="-mt-10 px-6">
        <Card>
          <p className="font-display text-xl font-semibold text-ink-black">{theme.title}</p>
          {theme.subtitle && <p className="mt-0.5 font-body text-sm text-black/60">{theme.subtitle}</p>}
          {theme.reference && (
            <p className="mt-2 font-label text-[11px] uppercase tracking-label text-deep-indigo">
              {theme.reference}
            </p>
          )}
        </Card>
      </div>

      <div className="mt-6 px-6">
        {status === 'loading' && <p className="font-body text-sm text-black/50">Loading passage…</p>}
        {status === 'error' && <p className="font-body text-sm text-burnt-orange">{error}</p>}
        {status === 'no-reference' && (
          <p className="font-body text-sm text-black/50">
            No scripture reference set — tap Edit to add one.
          </p>
        )}

        {passage && status === 'idle' && (
          <div className="rounded-card border border-black/8 bg-pure-white px-5 py-5 shadow-xl-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-lg font-semibold text-ink-black">{passage.reference}</p>
              <p className="font-label text-[10px] uppercase tracking-label text-black/40 whitespace-nowrap">
                {translationName}
              </p>
            </div>

            <VerseList
              verses={passage.verses}
              fallbackText={passage.text}
              className="mt-3 flex max-h-[45vh] flex-col gap-1 overflow-y-auto"
            />

            <div className="mt-4 border-t border-black/8 pt-4">
              <Link
                to={`/journal/new?ref=${encodeURIComponent(
                  `${passage.reference} (${translationName})`,
                )}&tag=${encodeURIComponent(theme.title)}`}
                className="inline-flex items-center gap-1 font-label text-[11px] uppercase tracking-label text-deep-indigo"
              >
                Reflect in journal <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}

        {entries && entries.length > 0 && (
          <Card className="mt-4">
            <div className="relative flex items-center gap-2">
              <input
                value={entryQuery}
                onChange={(e) => setEntryQuery(e.target.value)}
                placeholder="Search entries…"
                className="flex-1 rounded-card border border-black/10 bg-pure-white px-3 py-2 font-body text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setEntryFilterOpen((o) => !o)}
                aria-label="Sort entries"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-black/10 bg-pure-white"
              >
                <FilterIcon />
              </button>

              {entryFilterOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setEntryFilterOpen(false)} />
                  <div className="absolute right-0 top-full z-40 mt-2 w-32 overflow-hidden rounded-card border border-black/8 bg-pure-white shadow-xl-2">
                    {ENTRY_SORTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setEntrySort(s.id)
                          setEntryFilterOpen(false)
                        }}
                        className={`block w-full px-3 py-2.5 text-left font-label text-[10px] uppercase tracking-label ${
                          entrySort === s.id ? 'text-deep-indigo' : 'text-black/50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {filteredEntries.length === 0 && (
              <p className="mt-3 font-body text-xs text-black/50">No entries match “{entryQuery}”.</p>
            )}

            <div className="mt-1 flex flex-col">
              {filteredEntries.map((entry) => {
                const cfg = typeConfig(entry.type || 'reflection')
                const Icon = TYPE_ICONS[entry.type || 'reflection']
                return (
                  <Link
                    key={entry.id}
                    to={`/journal/${entry.id}`}
                    className="flex items-center gap-3 border-b border-black/8 py-3 last:border-0 last:pb-0"
                  >
                    <Icon color="#234386" size={20} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base font-medium text-ink-black">{entry.title}</p>
                      <p className="mt-0.5 font-body text-xs text-black/50">
                        {cfg.singular} · {formatShortDate(entry.updatedAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-black/30">›</span>
                  </Link>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
