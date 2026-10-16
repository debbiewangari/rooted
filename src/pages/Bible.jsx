import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BotanicalSprig } from '../components/BotanicalLine'
import { HamburgerMenu } from '../components/HamburgerMenu'
import { Logo } from '../components/Logo'
import { DEFAULT_TRANSLATION, TRANSLATIONS, recentPassages } from '../lib/bible'
import { NEW_TESTAMENT, OLD_TESTAMENT } from '../lib/bibleBooks'
import { getProfile, listHighlights } from '../lib/db'

const TRANSLATION_KEY = 'rooted:translation'
const DEFAULT_HERO_IMAGE = '/hero-sunset.jpg'

function SearchIcon({ className = '' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BookOpenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
      <path d="M4 5.5c2.5-1 5-1 8 0v14c-3-1-5.5-1-8 0z" />
      <path d="M20 5.5c-2.5-1-5-1-8 0v14c3-1 5.5-1 8 0z" />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
      <path d="M6 4h12v16l-6-4-6 4z" strokeLinejoin="round" />
    </svg>
  )
}

export function Bible() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [translation, setTranslation] = useState(
    () => localStorage.getItem(TRANSLATION_KEY) || DEFAULT_TRANSLATION,
  )
  const [versionOpen, setVersionOpen] = useState(false)

  const [testament, setTestament] = useState('OT')
  const [expandedBook, setExpandedBook] = useState(null)

  const [heroImageUrl, setHeroImageUrl] = useState(DEFAULT_HERO_IMAGE)
  const [continueReading, setContinueReading] = useState(null)
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    localStorage.setItem(TRANSLATION_KEY, translation)
  }, [translation])

  useEffect(() => {
    getProfile()
      .then((p) => {
        if (p.heroImageUrl) setHeroImageUrl(`${p.heroImageUrl}?t=${p.heroImageUpdatedAt || 0}`)
      })
      .catch(() => {})
    recentPassages(1)
      .then((rows) => setContinueReading(rows[0] || null))
      .catch(() => {})
    listHighlights()
      .then((rows) => setSavedCount(rows.length))
      .catch(() => {})
  }, [])

  function goToPassage(reference, version = translation) {
    navigate(`/bible/read?ref=${encodeURIComponent(reference)}&v=${encodeURIComponent(version)}`)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (query.trim()) goToPassage(query)
  }

  function handleTranslationChange(next) {
    setTranslation(next)
    setVersionOpen(false)
  }

  function openChapter(bookName, chapter) {
    goToPassage(`${bookName} ${chapter}`)
  }

  const activeTranslation = TRANSLATIONS.find((t) => t.id === translation)
  const books = testament === 'OT' ? OLD_TESTAMENT : NEW_TESTAMENT

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
          <h1 className="font-display text-2xl font-semibold text-ink-black">Bible</h1>
          <p className="mt-1 font-body text-xs text-black/70">Read, explore, and grow in God's Word.</p>
        </div>
      </div>

      <div className="px-6">
        <form onSubmit={handleSubmit} className="relative z-10 mt-5 flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by book, chapter or keyword…"
              className="w-full rounded-card border border-black/10 bg-pure-white py-3 pl-10 pr-4 font-body text-sm focus:outline-none"
            />
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setVersionOpen((o) => !o)}
              className="flex h-full items-center gap-1 rounded-card border border-black/10 bg-pure-white px-3 font-label text-[11px] uppercase tracking-label text-deep-indigo"
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
        </form>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            to={continueReading ? `/bible/read?ref=${encodeURIComponent(continueReading.data.reference)}` : '#'}
            className="rounded-card border border-black/10 bg-pure-white px-4 py-3"
          >
            <BookOpenIcon />
            <p className="mt-2 font-label text-[10px] uppercase tracking-label text-black/40">Continue Reading</p>
            <p className="mt-0.5 truncate font-display text-sm font-medium text-ink-black">
              {continueReading ? continueReading.data.reference : 'Start reading'}
            </p>
          </Link>
          <Link to="/bible/saved" className="rounded-card border border-black/10 bg-pure-white px-4 py-3">
            <BookmarkIcon />
            <p className="mt-2 font-label text-[10px] uppercase tracking-label text-black/40">Saved Verses</p>
            <p className="mt-0.5 font-display text-sm font-medium text-ink-black">
              {savedCount} verse{savedCount === 1 ? '' : 's'}
            </p>
          </Link>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink-black">Browse</h2>

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
                  setExpandedBook(null)
                }}
                className={`flex-1 rounded-pill py-2 font-label text-[11px] uppercase tracking-label transition-colors ${
                  testament === id ? 'bg-deep-indigo text-pure-white' : 'text-deep-indigo'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {books.map((book) => {
              const expanded = expandedBook === book.name
              return (
                <div key={book.name} className="overflow-hidden rounded-card border border-black/10 bg-pure-white">
                  <button
                    type="button"
                    onClick={() => setExpandedBook(expanded ? null : book.name)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 text-left">
                      <p className="font-display text-base font-medium text-ink-black">{book.name}</p>
                      <p className="font-label text-[10px] uppercase tracking-label text-black/40">
                        {book.chapters} chapter{book.chapters === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-label text-base text-deep-indigo transition-transform ${
                        expanded ? 'rotate-90' : ''
                      }`}
                    >
                      ›
                    </span>
                  </button>

                  {expanded && (
                    <div className="grid grid-cols-9 gap-1.5 border-t border-black/8 px-4 py-3">
                      {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => (
                        <button
                          key={chapter}
                          type="button"
                          onClick={() => openChapter(book.name, chapter)}
                          className="aspect-square rounded-[10px] border border-black/10 font-label text-[10px] text-deep-indigo"
                        >
                          {chapter}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
