import { cachePassage, getCachedPassage, listCachedPassages } from './bibleCache'
import { NEW_TESTAMENT, OLD_TESTAMENT } from './bibleBooks'

const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT]

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

// Picks the book a reference like "2 Samuel 11" or "Psalm 23:1" starts
// with by matching against the known book list (longest name wins, so a
// reference starting with "1 John" isn't mistaken for "John"), then reads
// the chapter number right after it.
export function parseReference(reference) {
  const ref = (reference || '').trim()
  const lower = ref.toLowerCase()
  let matched = null
  for (const book of ALL_BOOKS) {
    const prefix = `${book.name.toLowerCase()} `
    if (lower.startsWith(prefix) && (!matched || book.name.length > matched.name.length)) {
      matched = book
    }
  }
  if (!matched) return null
  const rest = ref.slice(matched.name.length).trim()
  const chapterMatch = rest.match(/^(\d+)/)
  if (!chapterMatch) return null
  return { book: matched, chapter: parseInt(chapterMatch[1], 10) }
}

// The next (direction 1) or previous (direction -1) chapter's reference,
// rolling over into the next/previous book at a book's first/last chapter
// — null past Genesis 1 or Revelation 22, or if the reference can't be
// parsed at all (a keyword search rather than book+chapter, say).
export function adjacentChapterReference(reference, direction) {
  const parsed = parseReference(reference)
  if (!parsed) return null
  const { book, chapter } = parsed
  const nextChapter = chapter + direction
  if (nextChapter >= 1 && nextChapter <= book.chapters) {
    return `${book.name} ${nextChapter}`
  }
  const index = ALL_BOOKS.findIndex((b) => b.name === book.name)
  const nextBook = ALL_BOOKS[index + direction]
  if (!nextBook) return null
  return `${nextBook.name} ${direction > 0 ? 1 : nextBook.chapters}`
}
