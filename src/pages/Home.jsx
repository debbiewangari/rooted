import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BotanicalSprig } from '../components/BotanicalLine'
import { HamburgerMenu } from '../components/HamburgerMenu'
import { Logo } from '../components/Logo'
import { UpcomingEvents } from '../components/UpcomingEvents'
import { fetchDailyVerse } from '../lib/dailyVerse'
import { getGreeting, getName } from '../lib/profile'
import { isVerseSaved, toggleSavedVerse } from '../lib/savedVerses'
import { backfillThemesFromTags, getProfile, listThemes } from '../lib/db'

const DEFAULT_HERO_IMAGE = '/hero-sunset.jpg'

const THEME_CARD_WIDTH = 176 + 16 // w-44 + gap-4
const MAX_HOME_THEMES = 3

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

function BookmarkIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M6 4h12v16l-6-4-6 4z" strokeLinejoin="round" />
    </svg>
  )
}

export function Home() {
  const [themes, setThemes] = useState([])
  const [activeTheme, setActiveTheme] = useState(0)
  const [verse, setVerse] = useState(null)
  const [verseError, setVerseError] = useState(false)
  const [verseSaved, setVerseSaved] = useState(false)
  const [heroImageUrl, setHeroImageUrl] = useState(DEFAULT_HERO_IMAGE)
  const scrollRef = useRef(null)

  useEffect(() => {
    // A tag and a theme are the same thing now — this catches any tag made
    // before that was true, so it still shows up here with its own card.
    // Backfilling is best-effort: if it fails for any reason, still show
    // whatever themes already exist rather than leaving the section blank.
    backfillThemesFromTags()
      .catch((err) => console.error('backfillThemesFromTags failed', err))
      .finally(() => listThemes().then(setThemes))
    fetchDailyVerse()
      .then((v) => {
        setVerse(v)
        setVerseSaved(isVerseSaved(v.reference))
      })
      .catch(() => setVerseError(true))
    getProfile()
      .then((p) => {
        if (p.heroImageUrl) setHeroImageUrl(`${p.heroImageUrl}?t=${p.heroImageUpdatedAt || 0}`)
      })
      .catch(() => {})
  }, [])

  const homeThemes = themes.slice(0, MAX_HOME_THEMES)

  function handleThemeScroll() {
    const el = scrollRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / THEME_CARD_WIDTH)
    setActiveTheme(Math.min(Math.max(index, 0), homeThemes.length - 1))
  }

  function handleToggleSaved() {
    if (!verse) return
    setVerseSaved(toggleSavedVerse(verse.reference))
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-64 w-full overflow-hidden bg-deep-indigo">
        <img src={heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/10" />
        <BotanicalSprig className="absolute bottom-2 right-8 h-24 w-24 opacity-30" color="var(--color-pure-white)" />

        <header className="relative z-10 flex items-center justify-between px-6 pt-8">
          <Link to="/" className="text-pure-white">
            <Logo size={20} />
          </Link>
          <div className="flex items-center gap-4 text-pure-white">
            <Link to="/bible" aria-label="Search the Bible">
              <SearchIcon />
            </Link>
            <HamburgerMenu light />
          </div>
        </header>

        <div className="relative z-10 px-6 pt-5">
          <p className="font-label text-[10px] uppercase tracking-label text-black/60">{getGreeting()},</p>
          <h1 className="mt-0.5 font-display text-xl font-semibold text-ink-black">{getName()}</h1>
          <p className="mt-1 font-body text-xs text-black/70">Take a moment to be still in His presence.</p>
        </div>
      </div>

      <div className="relative z-10 -mt-10 px-6">
        <div className="rounded-card border border-black/8 bg-pure-white px-5 py-5 shadow-xl-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-label text-[11px] uppercase tracking-label text-black/40">Daily bread</p>
            {verse && (
              <button
                type="button"
                onClick={handleToggleSaved}
                aria-label={verseSaved ? 'Remove bookmark' : 'Bookmark this verse'}
                className={verseSaved ? 'text-deep-indigo' : 'text-black/30'}
              >
                <BookmarkIcon filled={verseSaved} />
              </button>
            )}
          </div>
          {verse && (
            <>
              <p className="mt-2 line-clamp-3 font-body text-sm leading-relaxed text-ink-black">“{verse.text}”</p>
              <p className="mt-2 font-label text-[11px] uppercase tracking-label text-deep-indigo">
                {verse.reference} · {verse.translation}
              </p>
              <div className="mt-3 border-t border-black/8 pt-3">
                <Link
                  to={`/bible/read?ref=${encodeURIComponent(verse.reference)}`}
                  className="inline-flex items-center gap-1 font-label text-[11px] uppercase tracking-label text-deep-indigo"
                >
                  Read and reflect <span aria-hidden="true">→</span>
                </Link>
              </div>
            </>
          )}
          {!verse && !verseError && <p className="mt-3 font-body text-sm text-black/40">Loading…</p>}
          {verseError && (
            <p className="mt-3 font-body text-sm text-black/40">Could not load today's verse — check your connection.</p>
          )}
        </div>
      </div>

      <section className="relative z-10 mt-[72px] pb-10">
        <div className="flex items-baseline justify-between px-6">
          <h2 className="font-display text-xl font-semibold text-ink-black">Explore by Themes</h2>
          <Link to="/themes" className="font-label text-xs uppercase tracking-label text-deep-indigo">
            See all
          </Link>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleThemeScroll}
          className="no-scrollbar mt-4 flex snap-x gap-4 overflow-x-auto px-6"
          style={{ scrollPaddingLeft: 24, scrollPaddingRight: 24 }}
        >
          {homeThemes.length === 0 && (
            <Link
              to="/themes"
              className="flex h-64 w-44 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-card border border-dashed border-black/15 bg-white"
            >
              <span className="font-display text-2xl text-deep-indigo">+</span>
              <span className="font-label text-[11px] uppercase tracking-label text-black/40">Add a theme</span>
            </Link>
          )}

          {homeThemes.map((theme, i) => (
            <Link key={theme.id} to={`/themes/${theme.id}`} className="w-44 shrink-0 snap-start">
              <div className="relative h-64 w-44 overflow-hidden rounded-card bg-mist shadow-xl">
                {theme.imageUrl && <img src={theme.imageUrl} alt="" className="h-full w-full object-cover" />}
                <span className="absolute left-3 top-3 rounded-pill bg-black/35 px-2 py-0.5 font-label text-[10px] text-pure-white">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <p className="mt-2 font-display text-base font-medium text-ink-black">{theme.title}</p>
              {theme.subtitle && <p className="font-body text-xs text-black/50">{theme.subtitle}</p>}
              {theme.reference && (
                <p className="mt-1 font-label text-[10px] uppercase tracking-label text-deep-indigo">
                  {theme.reference}
                </p>
              )}
            </Link>
          ))}
        </div>

        {homeThemes.length > 1 && (
          <div className="mt-6 flex justify-center gap-1.5">
            {homeThemes.map((theme, i) => (
              <span
                key={theme.id}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === activeTheme ? 'bg-deep-indigo' : 'bg-black/15'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      <UpcomingEvents />

      <div className="pb-10" />
    </div>
  )
}
