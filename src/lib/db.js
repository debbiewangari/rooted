import { openDB } from 'idb'

const DB_NAME = 'rooted'
const DB_VERSION = 7
const ENTRIES_STORE = 'journalEntries'
const PASSAGES_STORE = 'bibleCache'
const HIGHLIGHTS_STORE = 'highlights'
const THEMES_STORE = 'themes'
const EVENTS_STORE = 'calendarEvents'
const EVENT_NOTES_STORE = 'eventNotes'
const PRAYER_CARDS_STORE = 'prayerCards'

function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    // Every store creation is guarded by `contains()` rather than relying
    // purely on oldVersion, so a dev-mode HMR reload that marked the DB at
    // a given version without finishing its upgrade can't permanently strand
    // a missing store — bumping DB_VERSION always re-runs this and fills gaps.
    upgrade(db) {
      if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
        const entries = db.createObjectStore(ENTRIES_STORE, { keyPath: 'id' })
        entries.createIndex('by-updatedAt', 'updatedAt')
      }
      if (!db.objectStoreNames.contains(PASSAGES_STORE)) {
        db.createObjectStore(PASSAGES_STORE, { keyPath: 'reference' })
      }
      if (!db.objectStoreNames.contains(HIGHLIGHTS_STORE)) {
        // keyed by `${book_id}:${chapter}:${verse}` so a highlight survives
        // switching translations, since the verse identity doesn't change.
        db.createObjectStore(HIGHLIGHTS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(THEMES_STORE)) {
        const themes = db.createObjectStore(THEMES_STORE, { keyPath: 'id' })
        themes.createIndex('by-createdAt', 'createdAt')
      }
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        const events = db.createObjectStore(EVENTS_STORE, { keyPath: 'id' })
        events.createIndex('by-startDate', 'startDate')
      }
      if (!db.objectStoreNames.contains(EVENT_NOTES_STORE)) {
        // keyed by `${eventId}:${date}` so each day of a challenge holds one note
        const eventNotes = db.createObjectStore(EVENT_NOTES_STORE, { keyPath: 'id' })
        eventNotes.createIndex('by-eventId', 'eventId')
      }
      if (!db.objectStoreNames.contains(PRAYER_CARDS_STORE)) {
        // standing prayer lists for an event (e.g. "Prayer Requests"), not
        // tied to any single day of the challenge
        const prayerCards = db.createObjectStore(PRAYER_CARDS_STORE, { keyPath: 'id' })
        prayerCards.createIndex('by-eventId', 'eventId')
      }
    },
  })
}

function makeId() {
  return crypto.randomUUID()
}

// Journal entries are modeled to be sync-ready: `synced` and `remoteId`
// stay null until a backend exists, so a future sync layer can diff on them
// without migrating existing local data.
export async function listEntries() {
  const db = await getDb()
  const entries = await db.getAllFromIndex(ENTRIES_STORE, 'by-updatedAt')
  return entries.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getEntry(id) {
  const db = await getDb()
  return db.get(ENTRIES_STORE, id)
}

export async function createEntry({ title, body, reference }) {
  const db = await getDb()
  const now = Date.now()
  const entry = {
    id: makeId(),
    title: title?.trim() || 'Untitled',
    body: body || '',
    reference: reference || null,
    createdAt: now,
    updatedAt: now,
    synced: false,
    remoteId: null,
  }
  await db.put(ENTRIES_STORE, entry)
  return entry
}

export async function updateEntry(id, changes) {
  const db = await getDb()
  const existing = await db.get(ENTRIES_STORE, id)
  if (!existing) throw new Error(`Entry ${id} not found`)
  const updated = {
    ...existing,
    ...changes,
    updatedAt: Date.now(),
    synced: false,
  }
  await db.put(ENTRIES_STORE, updated)
  return updated
}

export async function deleteEntry(id) {
  const db = await getDb()
  await db.delete(ENTRIES_STORE, id)
}

export async function cachePassage(reference, data) {
  const db = await getDb()
  await db.put(PASSAGES_STORE, { reference, data, cachedAt: Date.now() })
}

export async function getCachedPassage(reference) {
  const db = await getDb()
  const row = await db.get(PASSAGES_STORE, reference)
  return row?.data ?? null
}

export async function listCachedPassages() {
  const db = await getDb()
  const rows = await db.getAll(PASSAGES_STORE)
  return rows.sort((a, b) => b.cachedAt - a.cachedAt)
}

export async function setHighlight(id, { color, reference, text }) {
  const db = await getDb()
  await db.put(HIGHLIGHTS_STORE, { id, color, reference, text, updatedAt: Date.now() })
}

export async function removeHighlight(id) {
  const db = await getDb()
  await db.delete(HIGHLIGHTS_STORE, id)
}

export async function listHighlights() {
  const db = await getDb()
  return db.getAll(HIGHLIGHTS_STORE)
}

export async function listThemes() {
  const db = await getDb()
  return db.getAllFromIndex(THEMES_STORE, 'by-createdAt')
}

export async function getTheme(id) {
  const db = await getDb()
  return db.get(THEMES_STORE, id)
}

export async function createTheme({ title, subtitle, reference, imageBlob }) {
  const db = await getDb()
  const theme = {
    id: makeId(),
    title: title.trim(),
    subtitle: subtitle?.trim() || '',
    reference: reference.trim(),
    imageBlob: imageBlob || null,
    createdAt: Date.now(),
  }
  await db.put(THEMES_STORE, theme)
  return theme
}

export async function listCalendarEvents() {
  const db = await getDb()
  return db.getAllFromIndex(EVENTS_STORE, 'by-startDate')
}

export async function createCalendarEvent({
  title,
  notes,
  category,
  startDate,
  endDate,
  anchorVerse,
  time,
  customCategory,
  theme,
  coverImage,
}) {
  const db = await getDb()
  const event = {
    id: makeId(),
    title: title.trim(),
    notes: notes?.trim() || '',
    category: category || 'event',
    customCategory: category === 'other' ? customCategory?.trim() || '' : '',
    startDate,
    endDate: endDate && endDate >= startDate ? endDate : startDate,
    anchorVerse: anchorVerse?.trim() || '',
    time: time || '',
    theme: theme?.trim() || '',
    coverImage: coverImage || null,
    createdAt: Date.now(),
  }
  await db.put(EVENTS_STORE, event)
  return event
}

export async function updateCalendarEvent(id, changes) {
  const db = await getDb()
  const existing = await db.get(EVENTS_STORE, id)
  if (!existing) throw new Error(`Event ${id} not found`)
  const updated = { ...existing, ...changes }
  if (updated.endDate < updated.startDate) updated.endDate = updated.startDate
  await db.put(EVENTS_STORE, updated)
  return updated
}

export async function deleteCalendarEvent(id) {
  const db = await getDb()
  await db.delete(EVENTS_STORE, id)
}

export async function getCalendarEvent(id) {
  const db = await getDb()
  return db.get(EVENTS_STORE, id)
}

export async function getEventNote(eventId, date) {
  const db = await getDb()
  return db.get(EVENT_NOTES_STORE, `${eventId}:${date}`)
}

export async function setEventNote(eventId, date, { focus, minister, verses, notes, prayerPoints }) {
  const db = await getDb()
  await db.put(EVENT_NOTES_STORE, {
    id: `${eventId}:${date}`,
    eventId,
    date,
    focus: focus || '',
    minister: minister || '',
    verses: Array.isArray(verses) ? verses : [],
    notes: notes || '',
    prayerPoints: prayerPoints || '',
    updatedAt: Date.now(),
  })
}

export async function listEventNotes(eventId) {
  const db = await getDb()
  return db.getAllFromIndex(EVENT_NOTES_STORE, 'by-eventId', eventId)
}

export async function listPrayerCards(eventId) {
  const db = await getDb()
  return db.getAllFromIndex(PRAYER_CARDS_STORE, 'by-eventId', eventId)
}

export async function createPrayerCard(eventId, title) {
  const db = await getDb()
  const card = { id: makeId(), eventId, title: title.trim(), items: [], createdAt: Date.now() }
  await db.put(PRAYER_CARDS_STORE, card)
  return card
}

export async function addPrayerItem(cardId, text) {
  const db = await getDb()
  const card = await db.get(PRAYER_CARDS_STORE, cardId)
  if (!card) throw new Error(`Prayer card ${cardId} not found`)
  const updated = { ...card, items: [...card.items, { id: makeId(), text: text.trim() }] }
  await db.put(PRAYER_CARDS_STORE, updated)
  return updated
}

export async function removePrayerItem(cardId, itemId) {
  const db = await getDb()
  const card = await db.get(PRAYER_CARDS_STORE, cardId)
  if (!card) return
  const updated = { ...card, items: card.items.filter((item) => item.id !== itemId) }
  await db.put(PRAYER_CARDS_STORE, updated)
  return updated
}

export async function deletePrayerCard(cardId) {
  const db = await getDb()
  await db.delete(PRAYER_CARDS_STORE, cardId)
}
