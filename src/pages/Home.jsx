import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Blob } from '../components/Blob'
import { BotanicalLeaf, BotanicalSprig } from '../components/BotanicalLine'
import { UpcomingEvents } from '../components/UpcomingEvents'
import { listThemes } from '../lib/db'

const THEME_CARD_WIDTH = 176 + 16 // w-44 + gap-4

export function Home() {
  const [themes, setThemes] = useState([])
  const [activeTheme, setActiveTheme] = useState(0)
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
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
    }
  }, [])

  function handleThemeScroll() {
    const el = scrollRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / THEME_CARD_WIDTH)
    setActiveTheme(Math.min(Math.max(index, 0), themes.length - 1))
  }

  return (
    <div className="relative overflow-hidden">
      <BotanicalLeaf className="absolute -right-6 top-4 h-40 w-32 opacity-80" rotate={8} />
      <BotanicalSprig className="absolute left-0 top-40 h-24 w-24 opacity-60" rotate={-10} />

      <header className="relative px-6 pt-10 pb-6">
        <Link
          to="/settings"
          aria-label="Backup & restore"
          className="absolute right-6 top-10 flex h-9 w-9 items-center justify-center rounded-pill border border-black/10 bg-pure-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 13a7.7 7.7 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L15 3.5h-4l-.3 2.5a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.7 7.7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <p className="font-label text-xs uppercase tracking-label text-deep-indigo">Welcome back</p>
        <h1 className="mt-1 font-display text-5xl uppercase text-deep-indigo">Rooted</h1>
        <p className="mt-2 font-script text-3xl text-deep-indigo">Grow quietly, daily.</p>
      </header>

      <div className="relative -mt-2 mb-6 h-16">
        <Blob color="gold" className="absolute left-6 h-20 w-20" />
        <Blob color="sage" className="absolute left-16 top-6 h-14 w-14" />
      </div>

      <UpcomingEvents />

      <section className="relative z-10 mt-10 pb-6">
        <div className="flex items-baseline justify-between px-6">
          <h2 className="font-display text-2xl uppercase text-deep-indigo">Themes</h2>
          <Link to="/themes" className="font-label text-xs uppercase tracking-label text-burnt-orange">
            See all
          </Link>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleThemeScroll}
          className="no-scrollbar mt-4 flex snap-x gap-4 overflow-x-auto px-6"
        >
          {themes.length === 0 && (
            <Link
              to="/themes"
              className="flex h-64 w-44 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-card border border-dashed border-black/20 bg-pure-white"
            >
              <span className="font-display text-3xl text-deep-indigo">+</span>
              <span className="font-label text-[11px] uppercase tracking-label text-black/40">Add a theme</span>
            </Link>
          )}

          {themes.map((theme, i) => (
            <Link key={theme.id} to={`/themes/${theme.id}`} className="w-44 shrink-0 snap-start">
              <div className="relative h-64 w-44 overflow-hidden rounded-card bg-warm-sand shadow-xl-2">
                {theme.imageUrl ? (
                  <img src={theme.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BotanicalSprig className="h-16 w-16 opacity-60" color="var(--color-deep-indigo)" />
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-pill bg-black/35 px-2 py-0.5 font-label text-[10px] text-pure-white">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <p className="mt-2 font-display text-lg text-deep-indigo">{theme.title}</p>
              {theme.subtitle && <p className="font-body text-xs italic text-black/50">{theme.subtitle}</p>}
              <p className="mt-1 font-label text-[10px] uppercase tracking-label text-burnt-orange">
                {theme.reference}
              </p>
            </Link>
          ))}
        </div>

        {themes.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {themes.map((theme, i) => (
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
    </div>
  )
}
