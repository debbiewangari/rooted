import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { FilledButton, OutlinedButton } from '../components/Button'
import { BotanicalLeaf } from '../components/BotanicalLine'
import { VerseList } from '../components/VerseList'
import { DEFAULT_TRANSLATION, QUICK_PICKS, TRANSLATIONS, fetchPassage } from '../lib/bible'
import { NEW_TESTAMENT, OLD_TESTAMENT } from '../lib/bibleBooks'

const TRANSLATION_KEY = 'rooted:translation'

export function Bible() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('ref') || '')
  const [translation, setTranslation] = useState(
    () => localStorage.getItem(TRANSLATION_KEY) || DEFAULT_TRANSLATION,
  )
  const [passage, setPassage] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [error, setError] = useState('')
  const [fromCache, setFromCache] = useState(false)

  const [testament, setTestament] = useState('OT')
  const [activeBook, setActiveBook] = useState(null)

  useEffect(() => {
    localStorage.setItem(TRANSLATION_KEY, translation)
  }, [translation])

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) load(ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function load(reference, version = translation) {
    setStatus('loading')
    setError('')
    try {
      const { data, fromCache } = await fetchPassage(reference, version)
      setPassage(data)
      setFromCache(fromCache)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Could not load that passage.')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (query.trim()) load(query)
  }

  function handleTranslationChange(e) {
    const next = e.target.value
    setTranslation(next)
    if (query.trim()) load(query, next)
  }

  function openChapter(bookName, chapter) {
    const reference = `${bookName} ${chapter}`
    setQuery(reference)
    load(reference)
  }

  const activeTranslation = TRANSLATIONS.find((t) => t.id === translation)
  const books = testament === 'OT' ? OLD_TESTAMENT : NEW_TESTAMENT

  return (
    <div className="relative min-h-screen overflow-hidden px-6 pt-10">
      <BotanicalLeaf className="absolute -right-8 top-2 h-36 w-28 opacity-50" rotate={-12} />

      <p className="font-label text-xs uppercase tracking-label text-deep-indigo">Scripture</p>
      <h1 className="font-display text-4xl uppercase text-deep-indigo">Bible</h1>

      <form onSubmit={handleSubmit} className="relative z-10 mt-5 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. John 3:16"
          className="flex-1 rounded-card border border-black/10 bg-pure-white px-4 py-3 font-body text-sm focus:outline-none"
        />
        <FilledButton type="submit" className="px-6 py-3 text-[11px]">
          Go
        </FilledButton>
      </form>

      <div className="relative z-10 mt-3 flex items-center gap-2">
        <label htmlFor="translation" className="font-label text-[11px] uppercase tracking-label text-black/40">
          Version
        </label>
        <select
          id="translation"
          value={translation}
          onChange={handleTranslationChange}
          className="rounded-tag border border-black/10 bg-pure-white px-3 py-1.5 font-label text-[11px] uppercase tracking-label text-deep-indigo focus:outline-none"
        >
          {TRANSLATIONS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="relative z-10 mt-4 flex flex-wrap gap-2">
        {QUICK_PICKS.map((ref) => (
          <button
            key={ref}
            type="button"
            onClick={() => {
              setQuery(ref)
              load(ref)
            }}
            className="rounded-tag border border-black/10 bg-pure-white px-3 py-1.5 font-label text-[11px] uppercase tracking-label text-deep-indigo"
          >
            {ref}
          </button>
        ))}
      </div>

      <section className="relative z-10 mt-6">
        <h2 className="font-display text-2xl uppercase text-deep-indigo">Browse</h2>

        <div className="mt-3 flex rounded-pill border border-black/10 bg-pure-white p-1">
          {[
            ['OT', 'Old Testament'],
            ['NT', 'New Testament'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTestament(id)
                setActiveBook(null)
              }}
              className={`flex-1 rounded-pill py-2 font-label text-[11px] uppercase tracking-label transition-colors ${
                testament === id ? 'bg-deep-indigo text-pure-white' : 'text-deep-indigo'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {!activeBook && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {books.map((book) => (
              <button
                key={book.name}
                type="button"
                onClick={() => setActiveBook(book)}
                className="rounded-card border border-black/10 bg-pure-white px-3 py-2.5 text-left font-label text-xs uppercase tracking-label text-deep-indigo"
              >
                {book.name}
              </button>
            ))}
          </div>
        )}

        {activeBook && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setActiveBook(null)}
              className="font-label text-[11px] uppercase tracking-label text-burnt-orange"
            >
              ← Back to books
            </button>

            <p className="mt-3 font-display text-xl uppercase text-deep-indigo">{activeBook.name}</p>
            <div className="mt-3 grid grid-cols-6 gap-2">
              {Array.from({ length: activeBook.chapters }, (_, i) => i + 1).map((chapter) => (
                <button
                  key={chapter}
                  type="button"
                  onClick={() => openChapter(activeBook.name, chapter)}
                  className="rounded-card border border-black/10 bg-pure-white py-2 text-center font-label text-xs text-deep-indigo"
                >
                  {chapter}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="relative z-10 mt-8 pb-6">
        {status === 'loading' && <p className="font-body text-sm text-black/50">Loading…</p>}
        {status === 'error' && <p className="font-body text-sm text-burnt-orange">{error}</p>}

        {passage && status !== 'loading' && (
          <Card>
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-xl uppercase text-deep-indigo">{passage.reference}</p>
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
              className="mt-3 flex max-h-[50vh] flex-col gap-1 overflow-y-auto"
            />

            <div className="mt-4">
              <OutlinedButton
                to={`/journal/new?ref=${encodeURIComponent(`${passage.reference} (${activeTranslation?.name})`)}`}
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
