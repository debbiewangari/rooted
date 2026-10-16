import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { OutlinedButton } from '../components/Button'
import { TYPE_ICONS } from '../components/LibraryIcons'
import { VerseList } from '../components/VerseList'
import { DEFAULT_TRANSLATION, TRANSLATIONS, fetchPassage } from '../lib/bible'
import { typeConfig } from '../lib/library'
import { getTheme, listEntriesByTag } from '../lib/db'

function formatShortDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TRANSLATION_KEY = 'rooted:translation'

export function ThemeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [theme, setTheme] = useState(null)
  const [passage, setPassage] = useState(null)
  const [status, setStatus] = useState('loading') // loading | idle | error | not-found
  const [error, setError] = useState('')
  const [entries, setEntries] = useState(null)

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
          <Card>
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

            <div className="mt-4">
              <OutlinedButton
                to={`/journal/new?ref=${encodeURIComponent(
                  `${passage.reference} (${translationName})`,
                )}&tag=${encodeURIComponent(theme.title)}`}
                className="w-full text-xs"
              >
                Reflect in journal
              </OutlinedButton>
            </div>
          </Card>
        )}

        {entries && entries.length > 0 && (
          <Card className="mt-4">
            <p className="font-display text-base font-semibold text-ink-black">Entries for {theme.title}</p>
            <div className="mt-3 flex flex-col">
              {entries.map((entry) => {
                const cfg = typeConfig(entry.type || 'reflection')
                const Icon = TYPE_ICONS[entry.type || 'reflection']
                return (
                  <Link
                    key={entry.id}
                    to={`/journal/${entry.id}`}
                    className="flex items-center gap-3 border-b border-black/8 py-3 first:pt-0 last:border-0 last:pb-0"
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
