const common = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function StudyIcon({ color = '#234386', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...common}>
      <path d="M4 5.5c2.5-1 5-1 8 0v14c-3-1-5.5-1-8 0z" />
      <path d="M20 5.5c-2.5-1-5-1-8 0v14c3-1 5.5-1 8 0z" />
    </svg>
  )
}

export function SermonIcon({ color = '#234386', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...common}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21M9 21h6" />
    </svg>
  )
}

export function ScriptureIcon({ color = '#234386', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...common}>
      <path d="M6 3.5h12v17l-6-3.5-6 3.5z" />
    </svg>
  )
}

export function ReflectionIcon({ color = '#234386', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...common}>
      <path d="M12 3c4.5 3 6 6.5 6 10a6 6 0 1 1-12 0c0-3.5 1.5-7 6-10Z" />
      <path d="M12 9v11" />
    </svg>
  )
}

export function PrayerIcon({ color = '#234386', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...common}>
      <path d="M12 20.5s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.5a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10Z" />
    </svg>
  )
}

export function TestimonyIcon({ color = '#234386', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...common}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.5 12H2M22 12h-2.5M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
    </svg>
  )
}

export const TYPE_ICONS = {
  study: StudyIcon,
  sermon: SermonIcon,
  scripture: ScriptureIcon,
  reflection: ReflectionIcon,
  prayer: PrayerIcon,
  testimony: TestimonyIcon,
}
