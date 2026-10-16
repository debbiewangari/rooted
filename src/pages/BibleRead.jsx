import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { VerseList } from '../components/VerseList'
import { DEFAULT_TRANSLATION, TRANSLATIONS, fetchPassage } from '../lib/bible'

const TRANSLATION_KEY = 'rooted:translation'

export function BibleRead() {
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('ref') || ''
  const translation = searchParams.get('v') || localStorage.getItem(TRANSLATION_KEY) || DEFAULT_TRANSLATION

  const [passage, setPassage] = useState(null)
  const [status, setStatus] = useState('loading') // loading | idle | error
  const [error, setError] = useState('')
  const [fromCache, setFromCache] = useState(false)

  useEffect(() => {
    if (!reference) {
      setStatus('error')
      setError('No reference given.')
      return
    }
    setStatus('loading')
    setError('')
    fetchPassage(reference, translation)
      .then(({ data, fromCache }) => {
        setPassage(data)
        setFromCache(fromCache)
        setStatus('idle')
      })
      .catch((err) => {
        setStatus('error')
        setError(err.message || 'Could not load that passage.')
      })
  }, [reference, translation])

  const activeTranslation = TRANSLATIONS.find((t) => t.id === translation)

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <Link to="/bible" className="font-label text-[11px] uppercase tracking-label text-deep-indigo">
        ← Back to Bible
      </Link>

      {status === 'loading' && <p className="mt-6 font-body text-sm text-black/50">Loading…</p>}
      {status === 'error' && <p className="mt-6 font-body text-sm text-burnt-orange">{error}</p>}

      {passage && status === 'idle' && (
        <div className="mt-4 rounded-card border border-black/8 bg-pure-white px-5 py-5 shadow-xl-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-lg font-semibold text-ink-black">{passage.reference}</p>
            <p className="font-label text-[10px] uppercase tracking-label text-black/40 whitespace-nowrap">
              {activeTranslation?.name}
            </p>
          </div>
          {fromCache && (
            <p className="mt-1 font-label text-[10px] uppercase tracking-label text-black/40">
              Shown from offline cache
            </p>
          )}

          <VerseList
            verses={passage.verses}
            fallbackText={passage.text}
            className="no-scrollbar mt-3 flex max-h-[65vh] flex-col gap-1 overflow-y-auto"
          />

          <div className="mt-4 border-t border-black/8 pt-4">
            <Link
              to={`/journal/new?ref=${encodeURIComponent(`${passage.reference} (${activeTranslation?.name})`)}`}
              className="inline-flex items-center gap-1 font-label text-[11px] uppercase tracking-label text-deep-indigo"
            >
              Reflect in journal <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
