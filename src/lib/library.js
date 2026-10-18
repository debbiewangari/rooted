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

// The content "blocks" an entry can be built from — a user picks which of
// these apply to a given entry (CMS-style), rather than every entry having
// a single fixed body. Richtext blocks share one editor; scripture/prayer
// get their own structured editors.
export const SECTION_TYPES = [
  { id: 'notes', label: 'Notes', kind: 'richtext', placeholder: 'Write your notes…' },
  { id: 'scripture', label: 'Scriptures', kind: 'scripture' },
  { id: 'story', label: 'Bible Story', kind: 'richtext', placeholder: 'Tell the story…' },
  { id: 'declaration', label: 'Prophetic Declarations', kind: 'richtext', placeholder: 'Declare the word…' },
  { id: 'prayer', label: 'Prayer', kind: 'richtext', placeholder: "Write what you're praying through…" },
  { id: 'testimony', label: 'Testimony', kind: 'richtext', placeholder: 'Share what God has done…' },
]

export function sectionConfig(typeId) {
  return SECTION_TYPES.find((s) => s.id === typeId)
}

// Prayer sections used to be a fixed point-by-point list (add-only, no
// editing a saved point) — now they're an open field like any other
// richtext section. Entries saved under the old shape still have
// `data.items` instead of `data.html`; this renders them as a bullet list
// so that content keeps showing until the entry is next edited, at which
// point it's saved back as html like everything else.
export function legacyItemsToHtml(items) {
  if (!items?.length) return ''
  const escape = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<ul>${items.map((i) => `<li>${escape(i.text)}</li>`).join('')}</ul>`
}

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

// Entries created before sections existed just have a plain `body`; newer
// ones are built from `sections` blocks instead. This flattens either into
// one searchable/previewable string.
export function entryText(entry) {
  if (entry.sections?.length) {
    return entry.sections
      .map((s) => {
        if (s.type === 'scripture') return (s.data.verses || []).map((v) => v.reference).join(', ')
        if (s.data?.items) return s.data.items.map((i) => i.text).join(' ') // legacy prayer shape
        return stripHtml(s.data?.html)
      })
      .join(' ')
  }
  return stripHtml(entry.body)
}

export function matchesSearch(entry, query) {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    entry.title.toLowerCase().includes(q) ||
    entryText(entry).toLowerCase().includes(q) ||
    (entry.reference || '').toLowerCase().includes(q) ||
    (entry.tags || []).some((t) => t.toLowerCase().includes(q))
  )
}

export function plainPreview(text, maxLen = 140) {
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text
}
