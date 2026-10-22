import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BookChapterPicker } from '../components/BookChapterPicker'
import { Drawer } from '../components/Drawer'
import { VerseList } from '../components/VerseList'
import {
  DEFAULT_TRANSLATION,
  TRANSLATIONS,
  adjacentChapterReference,
  fetchPassage,
  parseReference,
} from '../lib/bible'

const TRANSLATION_KEY = 'rooted:translation'

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BibleRead() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const reference = searchParams.get('ref') || ''
  const translation = searchParams.get('v') || localStorage.getItem(TRANSLATION_KEY) || DEFAULT_TRANSLATION

  const [passage, setPassage] = useState(null)
  const [status, setStatus] = useState('loading') // loading | idle | error
  const [error, setError] = useState('')
  const [fromCache, setFromCache] = useState(false)
  const [versionOpen, setVersionOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  // Scroll-to-advance should fire once per chapter, not repeatedly while
  // the reader lingers at the bottom (re-reading the last verse, using the
  // selection toolbar, momentum-scroll bounce, ...).
  const autoAdvancedRef = useRef(false)

  useEffect(() => {
    autoAdvancedRef.current = false
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

  useEffect(() => {
    localStorage.setItem(TRANSLATION_KEY, translation)
  }, [translation])

  function goTo(nextRef, version = translation) {
    if (!nextRef) return
    navigate(`/bible/read?ref=${encodeURIComponent(nextRef)}&v=${encodeURIComponent(version)}`)
  }

  function handleTranslationChange(next) {
    setVersionOpen(false)
    goTo(reference, next)
  }

  function handleVerseScroll(e) {
    if (autoAdvancedRef.current || !nextRef) return
    const el = e.target
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) {
      autoAdvancedRef.current = true
      goTo(nextRef)
    }
  }

  const activeTranslation = TRANSLATIONS.find((t) => t.id === translation)
  const parsed = parseReference(reference)
  const nextRef = adjacentChapterReference(reference, 1)
  const prevRef = adjacentChapterReference(reference, -1)

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/bible" className="font-label text-[11px] uppercase tracking-label text-deep-indigo">
          ← Back to Bible
        </Link>
        {nextRef && (
          <button
            type="button"
            onClick={() => goTo(nextRef)}
            className="font-label text-[11px] uppercase tracking-label text-deep-indigo"
          >
            Next chapter →
          </button>
        )}
      </div>

      {status === 'loading' && <p className="mt-6 font-body text-sm text-black/50">Loading…</p>}
      {status === 'error' && <p className="mt-6 font-body text-sm text-burnt-orange">{error}</p>}

      {passage && status === 'idle' && (
        <div className="mt-4 rounded-card border border-black/8 bg-pure-white px-5 py-5 shadow-xl-2">
          <div className="flex items-baseline justify-between gap-3">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex min-w-0 items-center gap-1 text-left"
            >
              <span className="truncate font-display text-lg font-semibold text-ink-black">{passage.reference}</span>
              <span className="shrink-0 text-black/40">
                <ChevronDown />
              </span>
            </button>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setVersionOpen((o) => !o)}
                className="flex items-center gap-1 font-label text-[10px] uppercase tracking-label text-black/40"
              >
                {activeTranslation?.name}
                <ChevronDown />
              </button>

              {versionOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setVersionOpen(false)} />
                  <div className="absolute right-0 top-full z-40 mt-2 w-40 overflow-hidden rounded-card border border-black/8 bg-pure-white shadow-xl-2">
                    {TRANSLATIONS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleTranslationChange(t.id)}
                        className={`block w-full px-3 py-2.5 text-left font-label text-[10px] uppercase tracking-label ${
                          translation === t.id ? 'text-deep-indigo' : 'text-black/50'
                        }`}
                      >
                        {t.name} — {t.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
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
            onScroll={handleVerseScroll}
          />

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/8 pt-4">
            <Link
              to={`/journal/new?ref=${encodeURIComponent(`${passage.reference} (${activeTranslation?.name})`)}`}
              className="inline-flex items-center gap-1 font-label text-[11px] uppercase tracking-label text-deep-indigo"
            >
              Reflect in journal <span aria-hidden="true">→</span>
            </Link>

            <div className="flex shrink-0 items-center gap-4">
              {prevRef && (
                <button
                  type="button"
                  onClick={() => goTo(prevRef)}
                  className="font-label text-[11px] uppercase tracking-label text-black/40"
                >
                  ← Prev
                </button>
              )}
              {nextRef && (
                <button
                  type="button"
                  onClick={() => goTo(nextRef)}
                  className="font-label text-[11px] uppercase tracking-label text-deep-indigo"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Drawer open={pickerOpen} onClose={() => setPickerOpen(false)} title="Jump to a chapter">
        <BookChapterPicker
          initialBook={parsed?.book.name}
          onSelectChapter={(bookName, chapter) => {
            setPickerOpen(false)
            goTo(`${bookName} ${chapter}`)
          }}
        />
      </Drawer>
    </div>
  )
}
