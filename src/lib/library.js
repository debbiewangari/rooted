// Warm accent washes only, matching the highlight/category palette used
// elsewhere — never the indigo, which stays reserved for type/headline text.
export const LIBRARY_TYPES = [
  { id: 'study', label: 'Studies', singular: 'Study', hex: '#d2b68c' },
  { id: 'sermon', label: 'Sermons', singular: 'Sermon', hex: '#6aa8dc' },
  { id: 'scripture', label: 'Scripture', singular: 'Scripture', hex: '#a2d3a6' },
  { id: 'reflection', label: 'Reflections', singular: 'Reflection', hex: '#ffc400' },
  { id: 'prayer', label: 'Prayers', singular: 'Prayer', hex: '#ed7328' },
  { id: 'testimony', label: 'Testimonies', singular: 'Testimony', hex: '#d2b68c' },
]

export const TAG_COLORS = ['#ffc400', '#ed7328', '#a2d3a6', '#d2b68c', '#6aa8dc']

export function typeConfig(typeId) {
  return LIBRARY_TYPES.find((t) => t.id === typeId) || LIBRARY_TYPES[3]
}

export function tagColor(index) {
  return TAG_COLORS[index % TAG_COLORS.length]
}

export function formatRelativeTime(timestamp) {
  const diffMs = Date.now() - timestamp
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').trim()
}

export function matchesSearch(entry, query) {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    entry.title.toLowerCase().includes(q) ||
    stripHtml(entry.body).toLowerCase().includes(q) ||
    (entry.reference || '').toLowerCase().includes(q) ||
    (entry.tags || []).some((t) => t.toLowerCase().includes(q))
  )
}

export function plainPreview(html, maxLen = 140) {
  const text = stripHtml(html)
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text
}
