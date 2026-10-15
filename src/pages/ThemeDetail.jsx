import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { OutlinedButton } from '../components/Button'
import { VerseList } from '../components/VerseList'
import { DEFAULT_TRANSLATION, TRANSLATIONS, fetchPassage } from '../lib/bible'
import { getTheme } from '../lib/db'

const TRANSLATION_KEY = 'rooted:translation'

export function ThemeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [theme, setTheme] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [passage, setPassage] = useState(null)
  const [status, setStatus] = useState('loading') // loading | idle | error | not-found
  const [error, setError] = useState('')

  useEffect(() => {
    let url = null
    getTheme(id).then((row) => {
      if (!row) {
        setStatus('not-found')
        return
      }
      setTheme(row)
      if (row.imageBlob) {
        url = URL.createObjectURL(row.imageBlob)
        setImageUrl(url)
      }

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
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
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
        {imageUrl && <img src={imageUrl} alt="" className="h-full w-full object-cover" />}
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
                to={`/journal/new?title=${encodeURIComponent(theme.title)}&ref=${encodeURIComponent(
                  `${passage.reference} (${translationName})`,
                )}`}
                className="w-full text-xs"
              >
                Reflect in journal
              </OutlinedButton>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
