import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/bible', label: 'Bible', icon: BibleIcon },
  { to: '/journal', label: 'Journal', icon: JournalIcon },
  { to: '/events', label: 'Encounters', icon: EventsIcon },
]

export function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-black/10 bg-pure-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[480px] items-center justify-around py-2">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-pill px-3 py-2 font-label text-[10px] uppercase tracking-label ${
                isActive ? 'text-deep-indigo' : 'text-black/40'
              }`
            }
          >
            {({ isActive } = {}) => (
              <>
                <Icon active={isActive} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#234386' : 'rgba(0,0,0,0.4)'} strokeWidth="1.8">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9h13v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EventsIcon({ active }) {
  const stroke = active ? '#234386' : 'rgba(0,0,0,0.4)'
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 11.2c-1.4-1.3-2.6-2.3-2.6-3.6a1.7 1.7 0 0 1 2.6-1.4 1.7 1.7 0 0 1 2.6 1.4c0 1.3-1.2 2.3-2.6 3.6z" />
      <path d="M3.5 13.5c0-.9.7-1.5 1.6-1.5.6 0 1.1.3 1.4.8l1 1.7" />
      <path d="M3.5 13.5v2.3c0 1.5 1.2 2.7 2.7 2.7h3.3c.6 0 1.1-.2 1.5-.6l2.3-2.1" />
      <path d="M20.5 13.5c0-.9-.7-1.5-1.6-1.5-.6 0-1.1.3-1.4.8l-1 1.7" />
      <path d="M20.5 13.5v2.3c0 1.5-1.2 2.7-2.7 2.7h-3.3c-.6 0-1.1-.2-1.5-.6l-.7-.6" />
    </svg>
  )
}

function JournalIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#234386' : 'rgba(0,0,0,0.4)'} strokeWidth="1.8">
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" strokeLinecap="round" />
    </svg>
  )
}

function BibleIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#234386' : 'rgba(0,0,0,0.4)'} strokeWidth="1.8">
      <path d="M4 5.5c2.5-1 5-1 8 0v14c-3-1-5.5-1-8 0z" strokeLinejoin="round" />
      <path d="M20 5.5c-2.5-1-5-1-8 0v14c3-1 5.5-1 8 0z" strokeLinejoin="round" />
    </svg>
  )
}
