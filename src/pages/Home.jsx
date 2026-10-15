import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { HamburgerMenu } from '../components/HamburgerMenu'
import { Logo } from '../components/Logo'
import { UpcomingEvents } from '../components/UpcomingEvents'
import { fetchDailyVerse } from '../lib/dailyVerse'
import { tagColor } from '../lib/library'
import { getGreeting, getName } from '../lib/profile'
import { listTags, listThemes } from '../lib/db'

const THEME_CARD_WIDTH = 176 + 16 // w-44 + gap-4
const MAX_HOME_TAGS = 3

export function Home() {
  const [themes, setThemes] = useState([])
  const [activeTheme, setActiveTheme] = useState(0)
  const [tags, setTags] = useState([])
  const [verse, setVerse] = useState(null)
  const [verseError, setVerseError] = useState(false)
  const objectUrlsRef = useRef([])
  const scrollRef = useRef(null)

  useEffect(() => {
    listThemes().then((rows) => {
      const withUrls = rows.map((theme) => {
        const imageUrl = theme.imageBlob ? URL.createObjectURL(theme.imageBlob) : null
        if (imageUrl) objectUrlsRef.current.push(imageUrl)
        return { ...theme, imageUrl }
      })
      setThemes(withUrls)
    })
    listTags().then(setTags)
    fetchDailyVerse()
      .then(setVerse)
      .catch(() => setVerseError(true))
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
    }
  }, [])

  function handleThemeScroll() {
    const el = scrollRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / THEME_CARD_WIDTH)
    setActiveTheme(Math.min(Math.max(index, 0), combined.length - 1))
  }

  // One combined row: curated scripture-card Themes plus Library tags,
  // rendered with the same card shape so "Explore by Themes" isn't split
  // across two homepage sections.
  const combined = [
    ...themes.map((t) => ({
      kind: 'theme',
      key: `theme-${t.id}`,
      link: `/themes/${t.id}`,
      title: t.title,
      subtitle: t.subtitle,
      reference: t.reference,
      imageUrl: t.imageUrl,
    })),
    ...tags.slice(0, MAX_HOME_TAGS).map((t, i) => ({
      kind: 'tag',
      key: `tag-${t.id}`,
      link: `/journal?tag=${encodeURIComponent(t.name)}`,
      title: t.name,
      color: tagColor(i),
    })),
  ]

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 pt-8">
        <Link to="/" className="text-deep-indigo">
          <Logo size={22} />
        </Link>
        <HamburgerMenu />
      </header>

      <div className="px-6 pt-8">
        <h1 className="font-display text-2xl font-medium text-ink-black">
          {getGreeting()}, {getName()}
        </h1>
      </div>

      <div className="mt-6 px-6">
        <div className="rounded-card border border-black/8 bg-mist px-5 py-6">
          <p className="font-label text-[11px] uppercase tracking-label text-black/40">Daily bread</p>
          {verse && (
            <>
              <p className="mt-3 font-display text-lg leading-snug text-ink-black">“{verse.text}”</p>
              <p className="mt-3 font-label text-[11px] uppercase tracking-label text-deep-indigo">
                {verse.reference} · {verse.translation}
              </p>
            </>
          )}
          {!verse && !verseError && <p className="mt-3 font-body text-sm text-black/40">Loading…</p>}
          {verseError && (
            <p className="mt-3 font-body text-sm text-black/40">Could not load today's verse — check your connection.</p>
          )}
        </div>
      </div>

      <UpcomingEvents />

      <section className="relative z-10 mt-8 pb-10">
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
        >
          {combined.length === 0 && (
            <Link
              to="/themes"
              className="flex h-64 w-44 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-card border border-dashed border-black/15 bg-white"
            >
              <span className="font-display text-2xl text-deep-indigo">+</span>
              <span className="font-label text-[11px] uppercase tracking-label text-black/40">Add a theme</span>
            </Link>
          )}

          {combined.map((item, i) => (
            <Link key={item.key} to={item.link} className="w-44 shrink-0 snap-start">
              <div
                className="relative h-64 w-44 overflow-hidden rounded-card bg-mist shadow-xl"
                style={item.kind === 'tag' ? { backgroundColor: item.color } : undefined}
              >
                {item.kind === 'theme' && item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute left-3 top-3 rounded-pill bg-black/35 px-2 py-0.5 font-label text-[10px] text-pure-white">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <p className="mt-2 font-display text-base font-medium text-ink-black">{item.title}</p>
              {item.subtitle && <p className="font-body text-xs text-black/50">{item.subtitle}</p>}
              {item.reference && (
                <p className="mt-1 font-label text-[10px] uppercase tracking-label text-deep-indigo">
                  {item.reference}
                </p>
              )}
            </Link>
          ))}
        </div>

        {combined.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {combined.map((item, i) => (
              <span
                key={item.key}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === activeTheme ? 'bg-deep-indigo' : 'bg-black/15'
                }`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
