import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/bible', label: 'Bible', icon: BibleIcon },
  { to: '/journal', label: 'Library', icon: JournalIcon },
  { to: '/events', label: 'Events', icon: EventsIcon },
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
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#234386' : 'rgba(0,0,0,0.4)'} strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9.5h16M8 3v4M16 3v4" strokeLinecap="round" />
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
