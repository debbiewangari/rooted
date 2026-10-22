import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { FilledButton } from '../components/Button'
import { BotanicalSprig } from '../components/BotanicalLine'
import { EntryLinks } from '../components/EntryLinks'
import { DEFAULT_TRANSLATION, fetchPassage } from '../lib/bible'
import { createEntry, getStudySeries, listChaptersForSeries } from '../lib/db'

const TRANSLATION_KEY = 'rooted:translation'

export function SeriesDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [series, setSeries] = useState(null)
  const [chapters, setChapters] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [anchorQuote, setAnchorQuote] = useState('')
  const [addingChapter, setAddingChapter] = useState(false)
  const linksRef = useRef(null)

  useEffect(() => {
    getStudySeries(id).then((row) => {
      if (!row) {
        setNotFound(true)
        return
      }
      setSeries(row)
    })
    listChaptersForSeries(id).then(setChapters)
  }, [id])

  useEffect(() => {
    if (!series?.anchorReference) {
      setAnchorQuote('')
      return
    }
    const translation = localStorage.getItem(TRANSLATION_KEY) || DEFAULT_TRANSLATION
    fetchPassage(series.anchorReference, translation)
      .then(({ data }) => setAnchorQuote((data.text || '').trim()))
      .catch(() => setAnchorQuote(''))
  }, [series?.anchorReference])

  useEffect(() => {
    if (notFound) navigate('/series', { replace: true })
  }, [notFound, navigate])

  if (notFound) return null
  if (!series || chapters === null) {
    return <p className="px-6 pt-10 font-body text-sm text-black/50">Loading…</p>
  }

  const continueChapter = chapters.find((c) => c.id === series.lastOpenedChapterId) || chapters[0]
  const ctaLabel = series.lastOpenedChapterId && continueChapter ? 'Continue reading' : 'Start Chapter 1'

  async function handleAddChapter() {
    setAddingChapter(true)
    try {
      const created = await createEntry({
        title: '',
        type: 'study',
        seriesId: series.id,
        chapterOrder: chapters.length,
      })
      navigate(`/journal/${created.id}`)
    } finally {
      setAddingChapter(false)
    }
  }

  return (
    <div className="min-h-screen pb-6">
      <div className="relative h-56 w-full overflow-hidden bg-warm-sand">
        {series.imageUrl ? (
          <img src={series.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BotanicalSprig className="h-16 w-16 opacity-50" color="var(--color-deep-indigo)" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cream-paper via-transparent to-black/10" />
        <Link
          to="/series"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-pill bg-pure-white/90 font-display text-lg text-deep-indigo"
          aria-label="Back to study series"
        >
          ←
        </Link>
        <Link
          to={`/series/${id}/edit`}
          className="absolute right-4 top-4 rounded-pill bg-pure-white/90 px-4 py-2 font-label text-[11px] uppercase tracking-label text-deep-indigo"
        >
          Edit
        </Link>
      </div>

      <div className="-mt-10 px-6">
        <Card>
          <p className="font-label text-[11px] uppercase tracking-label text-deep-indigo">
            Study series{series.theme ? ` · ${series.theme}` : ''}
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-ink-black">{series.title}</p>
          {series.description && <p className="mt-1.5 font-body text-sm text-black/60">{series.description}</p>}
        </Card>
      </div>

      <div className="mt-6 px-6">
        {series.anchorReference && (
          <Card className="mb-4">
            <p className="font-label text-[11px] uppercase tracking-label text-black/40">Anchor Scripture</p>
            <p className="mt-2 font-display text-base font-medium text-ink-black">{series.anchorReference}</p>
            {anchorQuote && <p className="mt-1 font-body text-sm text-black/60">“{anchorQuote}”</p>}
          </Card>
        )}

        <Card>
          <div className="flex items-baseline justify-between">
            <p className="font-label text-[11px] uppercase tracking-label text-black/40">
              Chapters ({chapters.length})
            </p>
            <button
              type="button"
              onClick={handleAddChapter}
              disabled={addingChapter}
              className="font-label text-[11px] uppercase tracking-label text-deep-indigo disabled:opacity-50"
            >
              {addingChapter ? 'Adding…' : '+ Add chapter'}
            </button>
          </div>

          {chapters.length === 0 && (
            <p className="mt-3 font-body text-sm text-black/40">No chapters yet — add the first one above.</p>
          )}

          {chapters.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {chapters.map((chapter, i) => (
                <Link
                  key={chapter.id}
                  to={`/journal/${chapter.id}`}
                  className="flex items-center gap-3 rounded-card border border-black/10 bg-pure-white px-3 py-2.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-mist font-label text-[11px] text-deep-indigo">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-medium text-ink-black">
                      {chapter.title || 'Untitled chapter'}
                    </p>
                    {chapter.subtitle && <p className="truncate font-body text-xs text-black/50">{chapter.subtitle}</p>}
                  </div>
                  <span className="shrink-0 text-black/30">›</span>
                </Link>
              ))}
            </div>
          )}

          {chapters.length > 0 && continueChapter && (
            <FilledButton to={`/journal/${continueChapter.id}`} className="mt-4 w-full">
              {ctaLabel}
            </FilledButton>
          )}
        </Card>

        <div className="mt-4">
          <EntryLinks ref={linksRef} selfType="study_series" selfId={series.id} />
        </div>
      </div>
    </div>
  )
}
