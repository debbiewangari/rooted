import { useState } from 'react'
import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/calendar', label: 'Calendar' },
  { to: '/themes', label: 'Themes' },
  { to: '/settings', label: 'Settings' },
]

export function HamburgerMenu({ light = false }) {
  const [open, setOpen] = useState(false)
  const barColor = light ? 'bg-pure-white' : 'bg-ink-black'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        className="flex h-9 w-9 items-center justify-center"
      >
        <span className="flex flex-col gap-1.5">
          <span className={`block h-[1.5px] w-5 ${barColor}`} />
          <span className={`block h-[1.5px] w-5 ${barColor}`} />
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-44 overflow-hidden rounded-card border border-black/8 bg-pure-white shadow-xl-2">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 font-body text-sm text-ink-black transition-colors hover:bg-mist"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
