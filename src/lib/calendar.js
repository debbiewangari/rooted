// Warm accent washes only, matching the highlight palette — categories are
// a visual tag, never a filled button, so they stay in the system's lanes.
export const EVENT_CATEGORIES = [
  { id: 'fasting', label: 'Fasting', hex: '#ed7328' },
  { id: 'prayer', label: 'Prayer', hex: '#6aa8dc' },
  { id: 'event', label: 'Event', hex: '#ffc400' },
  { id: 'other', label: 'Other', hex: '#a2d3a6' },
]

export function categoryHex(event) {
  return EVENT_CATEGORIES.find((c) => c.id === event.category)?.hex || EVENT_CATEGORIES[2].hex
}

export function categoryLabel(event) {
  if (event.category === 'other' && event.customCategory) return event.customCategory
  return EVENT_CATEGORIES.find((c) => c.id === event.category)?.label || 'Other'
}
