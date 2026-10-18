import { cachePassage, getCachedPassage, listCachedPassages } from './bibleCache'

// bible-api.com only serves public-domain translations (no key required).
// Copyrighted versions (NIV, NKJV, AMP, ESV, ...) need a licensed provider
// such as API.Bible and are out of scope here.
export const TRANSLATIONS = [
  { id: 'kjv', name: 'KJV', label: 'King James Version' },
  { id: 'web', name: 'WEB', label: 'World English Bible' },
  { id: 'asv', name: 'ASV', label: 'American Standard Version' },
  { id: 'bbe', name: 'BBE', label: 'Bible in Basic English' },
  { id: 'darby', name: 'Darby', label: 'Darby Bible' },
  { id: 'dra', name: 'DRA', label: 'Douay-Rheims' },
  { id: 'ylt', name: 'YLT', label: "Young's Literal (NT only)" },
]

export const DEFAULT_TRANSLATION = 'kjv'

// Warm accent washes only — matches the design system's rule that these
// colors appear as highlights/accents, never as indigo or as solid UI fills.
export const HIGHLIGHT_COLORS = [
  { id: 'gold', hex: '#ffc400' },
  { id: 'orange', hex: '#ed7328' },
  { id: 'sage', hex: '#a2d3a6' },
  { id: 'sand', hex: '#d2b68c' },
  { id: 'sky', hex: '#6aa8dc' },
]

export function verseKey(v) {
  return `${v.book_id}:${v.chapter}:${v.verse}`
}

// A highlight's stored `color` is either one of the preset ids above or a
// literal "#rrggbb" from the custom color swatch — this resolves either
// form to the hex that's actually painted on screen. Returns null for
// anything else (e.g. the 'saved' bookmark marker, which intentionally
// has no color wash).
export function resolveHighlightHex(colorId) {
  if (!colorId) return null
  const preset = HIGHLIGHT_COLORS.find((c) => c.id === colorId)
  if (preset) return preset.hex
  return colorId.startsWith('#') ? colorId : null
}

function cacheKey(reference, translation) {
  return `${translation}:${reference}`
}

// Falls back to whatever was last cached for this reference + translation
// when offline, so previously read passages stay reachable without a
// network round trip.
export async function fetchPassage(reference, translation = DEFAULT_TRANSLATION) {
  const normalized = reference.trim()
  if (!normalized) throw new Error('Enter a reference, e.g. "John 3:16"')
  const key = cacheKey(normalized, translation)

  try {
    const res = await fetch(
      `https://bible-api.com/${encodeURIComponent(normalized)}?translation=${encodeURIComponent(translation)}`,
    )
    if (!res.ok) throw new Error('Reference not found')
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    await cachePassage(key, data)
    return { data, fromCache: false }
  } catch (err) {
    const cached = await getCachedPassage(key)
    if (cached) return { data: cached, fromCache: true }
    throw err
  }
}

export async function recentPassages(limit = 5) {
  const rows = await listCachedPassages()
  return rows.slice(0, limit)
}
