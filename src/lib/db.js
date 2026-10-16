import { supabase } from './supabase'

const COVERS_BUCKET = 'covers'

function makeId() {
  return crypto.randomUUID()
}

async function getUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user.id
}

function toMs(iso) {
  return iso ? new Date(iso).getTime() : null
}

function todayDateString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function publicCoverUrl(path) {
  if (!path) return null
  const { data } = supabase.storage.from(COVERS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function uploadCover(path, blob) {
  const { error } = await supabase.storage
    .from(COVERS_BUCKET)
    .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true })
  if (error) throw error
}

async function removeCover(path) {
  if (!path) return
  await supabase.storage.from(COVERS_BUCKET).remove([path])
}

// Journal / Library entries -------------------------------------------------
function fromEntryRow(row) {
  return {
    id: row.id,
    title: row.title,
    sections: row.sections || [],
    reference: row.reference,
    type: row.type,
    tags: row.tags || [],
    entryDate: row.entry_date,
    entryTime: row.entry_time || '',
    createdAt: toMs(row.created_at),
    updatedAt: toMs(row.updated_at),
  }
}

export async function listEntries() {
  const { data, error } = await supabase.from('journal_entries').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data.map(fromEntryRow)
}

export async function getEntry(id) {
  const { data, error } = await supabase.from('journal_entries').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? fromEntryRow(data) : null
}

export async function createEntry({ title, reference, type, tags, sections, entryDate, entryTime }) {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: userId,
      title: title?.trim() || 'Untitled',
      sections: Array.isArray(sections) ? sections : [],
      reference: reference || null,
      type: type || 'reflection',
      tags: Array.isArray(tags) ? tags : [],
      entry_date: entryDate || todayDateString(),
      entry_time: entryTime || '',
    })
    .select()
    .single()
  if (error) throw error
  return fromEntryRow(data)
}

export async function updateEntry(id, changes) {
  const payload = { updated_at: new Date().toISOString() }
  if (changes.title !== undefined) payload.title = changes.title?.trim() || 'Untitled'
  if (changes.sections !== undefined) payload.sections = changes.sections
  if (changes.reference !== undefined) payload.reference = changes.reference || null
  if (changes.type !== undefined) payload.type = changes.type
  if (changes.tags !== undefined) payload.tags = changes.tags
  if (changes.entryDate !== undefined) payload.entry_date = changes.entryDate || todayDateString()
  if (changes.entryTime !== undefined) payload.entry_time = changes.entryTime || ''

  const { data, error } = await supabase.from('journal_entries').update(payload).eq('id', id).select().single()
  if (error) throw error
  return fromEntryRow(data)
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('journal_entries').delete().eq('id', id)
  if (error) throw error
}

// Library tags ----------------------------------------------------------
export async function listTags() {
  const { data, error } = await supabase.from('library_tags').select('*').order('name')
  if (error) throw error
  return data.map((row) => ({ id: row.id, name: row.name, createdAt: toMs(row.created_at) }))
}

export async function createTag(name) {
  const trimmed = name.trim()
  const existing = await listTags()
  const match = existing.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
  if (match) {
    await ensureThemeForTag(trimmed)
    return match
  }

  const userId = await getUserId()
  const { data, error } = await supabase
    .from('library_tags')
    .insert({ user_id: userId, name: trimmed })
    .select()
    .single()
  if (error) throw error
  await ensureThemeForTag(trimmed)
  return { id: data.id, name: data.name, createdAt: toMs(data.created_at) }
}

export async function deleteTag(id) {
  const { error } = await supabase.from('library_tags').delete().eq('id', id)
  if (error) throw error
}

// Themes ------------------------------------------------------------------
function fromThemeRow(row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || '',
    reference: row.reference || '',
    imageUrl: publicCoverUrl(row.image_path),
    createdAt: toMs(row.created_at),
  }
}

export async function listThemes() {
  const { data, error } = await supabase.from('themes').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data.map(fromThemeRow)
}

export async function getTheme(id) {
  const { data, error } = await supabase.from('themes').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? fromThemeRow(data) : null
}

export async function createTheme({ title, subtitle, reference, imageBlob }) {
  const userId = await getUserId()
  const id = makeId()
  let imagePath = null
  if (imageBlob) {
    imagePath = `${userId}/theme-${id}.jpg`
    await uploadCover(imagePath, imageBlob)
  }
  const { data, error } = await supabase
    .from('themes')
    .insert({
      id,
      user_id: userId,
      title: title.trim(),
      subtitle: subtitle?.trim() || '',
      reference: reference?.trim() || '',
      image_path: imagePath,
    })
    .select()
    .single()
  if (error) throw error
  return fromThemeRow(data)
}

// `imageBlob` (a freshly picked file) replaces the cover; `removeImage`
// clears it; omitting both leaves the existing cover untouched.
export async function updateTheme(id, { title, subtitle, reference, imageBlob, removeImage }) {
  const userId = await getUserId()
  const payload = {}
  if (title !== undefined) payload.title = title.trim()
  if (subtitle !== undefined) payload.subtitle = subtitle?.trim() || ''
  if (reference !== undefined) payload.reference = reference?.trim() || ''

  if (imageBlob) {
    const imagePath = `${userId}/theme-${id}.jpg`
    await uploadCover(imagePath, imageBlob)
    payload.image_path = imagePath
  } else if (removeImage) {
    const { data: row } = await supabase.from('themes').select('image_path').eq('id', id).maybeSingle()
    await removeCover(row?.image_path)
    payload.image_path = null
  }

  const { data, error } = await supabase.from('themes').update(payload).eq('id', id).select().single()
  if (error) throw error
  return fromThemeRow(data)
}

// A tag and a theme are the same idea now — tagging an entry "Provision"
// should always have a themed card to open, even for tags created before
// this existed. Looked up case-insensitively since tag names are too.
export async function ensureThemeForTag(name, knownThemes) {
  const trimmed = name.trim()
  const all = knownThemes || (await listThemes())
  const existing = all.find((t) => t.title.toLowerCase() === trimmed.toLowerCase())
  if (existing) return existing

  const userId = await getUserId()
  const { data, error } = await supabase
    .from('themes')
    .insert({ user_id: userId, title: trimmed, subtitle: '', reference: '' })
    .select()
    .single()
  if (error) throw error
  return fromThemeRow(data)
}

// Self-healing backfill for tags created before themes/tags were unified —
// cheap to call on every Home load since it's a no-op once caught up.
export async function backfillThemesFromTags() {
  const [tags, themes] = await Promise.all([listTags(), listThemes()])
  for (const tag of tags) {
    const created = await ensureThemeForTag(tag.name, themes)
    if (!themes.some((t) => t.id === created.id)) themes.push(created)
  }
}

// Everything (any Library type) tagged with a given theme's name, newest
// first — powers the "Prayers for X" / "Studies for X" groups on a theme's
// detail page.
export async function listEntriesByTag(tagName) {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .contains('tags', [tagName])
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data.map(fromEntryRow)
}

export async function deleteTheme(id) {
  const { data: row } = await supabase.from('themes').select('image_path').eq('id', id).maybeSingle()
  if (row?.image_path) await removeCover(row.image_path)
  const { error } = await supabase.from('themes').delete().eq('id', id)
  if (error) throw error
}

// Calendar events -----------------------------------------------------------
function fromEventRow(row) {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes || '',
    category: row.category,
    customCategory: row.custom_category || '',
    startDate: row.start_date,
    endDate: row.end_date,
    anchorVerse: row.anchor_verse || '',
    startTime: row.start_time || '',
    endTime: row.end_time || '',
    theme: row.theme || '',
    coverImageUrl: publicCoverUrl(row.cover_image_path),
    createdAt: toMs(row.created_at),
  }
}

export async function listCalendarEvents() {
  const { data, error } = await supabase.from('calendar_events').select('*').order('start_date')
  if (error) throw error
  return data.map(fromEventRow)
}

export async function getCalendarEvent(id) {
  const { data, error } = await supabase.from('calendar_events').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? fromEventRow(data) : null
}

export async function createCalendarEvent({
  title,
  notes,
  category,
  startDate,
  endDate,
  anchorVerse,
  startTime,
  endTime,
  customCategory,
  theme,
  coverImage,
}) {
  const userId = await getUserId()
  const id = makeId()
  let coverPath = null
  if (coverImage) {
    coverPath = `${userId}/event-${id}.jpg`
    await uploadCover(coverPath, coverImage)
  }
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      id,
      user_id: userId,
      title: title.trim(),
      notes: notes?.trim() || '',
      category: category || 'event',
      custom_category: category === 'other' ? customCategory?.trim() || '' : '',
      start_date: startDate,
      end_date: endDate && endDate >= startDate ? endDate : startDate,
      anchor_verse: anchorVerse?.trim() || '',
      start_time: startTime || '',
      end_time: endTime || '',
      theme: theme?.trim() || '',
      cover_image_path: coverPath,
    })
    .select()
    .single()
  if (error) throw error
  return fromEventRow(data)
}

// `coverImage` (a freshly picked file) replaces the cover; `removeImage`
// clears it; omitting both leaves the existing cover untouched.
export async function updateCalendarEvent(id, changes) {
  const userId = await getUserId()
  const payload = {}
  if (changes.title !== undefined) payload.title = changes.title.trim()
  if (changes.notes !== undefined) payload.notes = changes.notes?.trim() || ''
  if (changes.category !== undefined) payload.category = changes.category || 'event'
  if (changes.category !== undefined || changes.customCategory !== undefined) {
    payload.custom_category = changes.category === 'other' ? changes.customCategory?.trim() || '' : ''
  }
  if (changes.startDate !== undefined) payload.start_date = changes.startDate
  if (changes.endDate !== undefined) payload.end_date = changes.endDate
  if (payload.start_date && payload.end_date && payload.end_date < payload.start_date) {
    payload.end_date = payload.start_date
  }
  if (changes.anchorVerse !== undefined) payload.anchor_verse = changes.anchorVerse?.trim() || ''
  if (changes.startTime !== undefined) payload.start_time = changes.startTime || ''
  if (changes.endTime !== undefined) payload.end_time = changes.endTime || ''
  if (changes.theme !== undefined) payload.theme = changes.theme?.trim() || ''

  if (changes.coverImage) {
    const coverPath = `${userId}/event-${id}.jpg`
    await uploadCover(coverPath, changes.coverImage)
    payload.cover_image_path = coverPath
  } else if (changes.removeImage) {
    const { data: row } = await supabase.from('calendar_events').select('cover_image_path').eq('id', id).maybeSingle()
    await removeCover(row?.cover_image_path)
    payload.cover_image_path = null
  }

  const { data, error } = await supabase.from('calendar_events').update(payload).eq('id', id).select().single()
  if (error) throw error
  return fromEventRow(data)
}

export async function deleteCalendarEvent(id) {
  const { data: row } = await supabase.from('calendar_events').select('cover_image_path').eq('id', id).maybeSingle()
  if (row?.cover_image_path) await removeCover(row.cover_image_path)
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) throw error
}

// Per-day event notes ---------------------------------------------------
function fromEventNoteRow(row) {
  return {
    eventId: row.event_id,
    date: row.date,
    sections: row.sections || [],
    updatedAt: toMs(row.updated_at),
  }
}

export async function getEventNote(eventId, date) {
  const { data, error } = await supabase
    .from('event_notes')
    .select('*')
    .eq('event_id', eventId)
    .eq('date', date)
    .maybeSingle()
  if (error) throw error
  return data ? fromEventNoteRow(data) : null
}

export async function setEventNote(eventId, date, { sections }) {
  const userId = await getUserId()
  const { error } = await supabase.from('event_notes').upsert(
    {
      user_id: userId,
      event_id: eventId,
      date,
      sections: Array.isArray(sections) ? sections : [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'event_id,date' },
  )
  if (error) throw error
}

export async function listEventNotes(eventId) {
  const { data, error } = await supabase.from('event_notes').select('*').eq('event_id', eventId)
  if (error) throw error
  return data.map(fromEventNoteRow)
}

// A day's note is built from sections the same way a Library entry is —
// built-in types (Today's Focus, Minister, Bible Verses, Notes, Prayer
// Points) are always offered; custom ones a user names are saved here so
// they're reusable across every day/event, the same way tags are.
const BUILT_IN_DAY_SECTION_TYPES = [
  { id: 'focus', name: "Today's Focus", kind: 'text', builtIn: true },
  { id: 'minister', name: 'Minister', kind: 'text', builtIn: true },
  { id: 'verses', name: 'Bible Verses', kind: 'scripture', builtIn: true },
  { id: 'notes', name: 'Notes', kind: 'richtext', builtIn: true },
  { id: 'prayer', name: 'Prayer Points', kind: 'richtext', builtIn: true },
]

export function builtInDaySectionTypes() {
  return BUILT_IN_DAY_SECTION_TYPES
}

export async function listDaySectionTypes() {
  const { data, error } = await supabase.from('day_section_types').select('*').order('name')
  if (error) throw error
  return data.map((row) => ({ id: row.id, name: row.name, kind: row.kind, builtIn: false }))
}

export async function createDaySectionType(name, kind = 'richtext') {
  const trimmed = name.trim()
  const existingCustom = await listDaySectionTypes()
  const match = [...BUILT_IN_DAY_SECTION_TYPES, ...existingCustom].find(
    (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
  )
  if (match) return match

  const userId = await getUserId()
  const { data, error } = await supabase
    .from('day_section_types')
    .insert({ user_id: userId, name: trimmed, kind })
    .select()
    .single()
  if (error) throw error
  return { id: data.id, name: data.name, kind: data.kind, builtIn: false }
}

// Standing prayer lists -------------------------------------------------
function fromPrayerCardRow(row) {
  return { id: row.id, eventId: row.event_id, title: row.title, notes: row.notes || '', createdAt: toMs(row.created_at) }
}

export async function listPrayerCards(eventId) {
  const { data, error } = await supabase.from('prayer_cards').select('*').eq('event_id', eventId).order('created_at')
  if (error) throw error
  return data.map(fromPrayerCardRow)
}

export async function createPrayerCard(eventId, title) {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('prayer_cards')
    .insert({ user_id: userId, event_id: eventId, title: title.trim(), notes: '' })
    .select()
    .single()
  if (error) throw error
  return fromPrayerCardRow(data)
}

// Free-form notebook content for a prayer list — same shape as any other
// autosaved richtext field, no per-point "Add" step required.
export async function updatePrayerCardNotes(cardId, notes) {
  const { data, error } = await supabase.from('prayer_cards').update({ notes }).eq('id', cardId).select().single()
  if (error) throw error
  return fromPrayerCardRow(data)
}

export async function deletePrayerCard(cardId) {
  const { error } = await supabase.from('prayer_cards').delete().eq('id', cardId)
  if (error) throw error
}

// Verse highlights --------------------------------------------------------
export async function setHighlight(id, { color, reference, text }) {
  const userId = await getUserId()
  const { error } = await supabase
    .from('highlights')
    .upsert({ id, user_id: userId, color, reference, text, updated_at: new Date().toISOString() }, { onConflict: 'user_id,id' })
  if (error) throw error
}

export async function removeHighlight(id) {
  const { error } = await supabase.from('highlights').delete().eq('id', id)
  if (error) throw error
}

export async function listHighlights() {
  const { data, error } = await supabase.from('highlights').select('*')
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    color: row.color,
    reference: row.reference,
    text: row.text,
    updatedAt: toMs(row.updated_at),
  }))
}

// Backup / restore + local-data migration ----------------------------------
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function urlToBase64(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  return blobToBase64(blob)
}

async function base64ToBlob(dataUrl) {
  const res = await fetch(dataUrl)
  return res.blob()
}

// Everything a person authored, in the same portable shape the old
// IndexedDB-only version used — so a backup file (or the legacy local data)
// can round-trip into this account. Cover images are inlined as base64.
export async function exportAllData() {
  const [entries, highlights, themes, events, tags] = await Promise.all([
    listEntries(),
    listHighlights(),
    listThemes(),
    listCalendarEvents(),
    listTags(),
  ])

  const eventNotes = (await Promise.all(events.map((e) => listEventNotes(e.id)))).flat()
  const prayerCards = (await Promise.all(events.map((e) => listPrayerCards(e.id)))).flat()

  const themesPortable = await Promise.all(
    themes.map(async ({ imageUrl, ...t }) => ({
      ...t,
      imageBlob: imageUrl ? await urlToBase64(imageUrl) : null,
    })),
  )
  const eventsPortable = await Promise.all(
    events.map(async ({ coverImageUrl, ...e }) => ({
      ...e,
      coverImage: coverImageUrl ? await urlToBase64(coverImageUrl) : null,
    })),
  )

  return {
    app: 'rooted',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    journalEntries: entries,
    highlights,
    themes: themesPortable,
    calendarEvents: eventsPortable,
    eventNotes,
    prayerCards,
    libraryTags: tags,
  }
}

// Upserts by id, so importing a backup (or migrating local data) merges
// into whatever is already in this account rather than duplicating it.
export async function importAllData(data) {
  const userId = await getUserId()

  for (const entry of data.journalEntries || []) {
    let sections = Array.isArray(entry.sections) ? entry.sections : []
    if (sections.length === 0 && entry.body) {
      sections = [{ id: makeId(), type: 'notes', data: { html: entry.body } }]
    }
    const { error } = await supabase.from('journal_entries').upsert({
      id: entry.id,
      user_id: userId,
      title: entry.title || 'Untitled',
      sections,
      reference: entry.reference || null,
      type: entry.type || 'reflection',
      tags: Array.isArray(entry.tags) ? entry.tags : [],
    })
    if (error) throw error
  }

  for (const tag of data.libraryTags || []) {
    const { error } = await supabase
      .from('library_tags')
      .upsert({ id: tag.id, user_id: userId, name: tag.name })
    if (error) throw error
  }

  for (const theme of data.themes || []) {
    let imagePath = null
    if (theme.imageBlob) {
      const blob = await base64ToBlob(theme.imageBlob)
      imagePath = `${userId}/theme-${theme.id}.jpg`
      await uploadCover(imagePath, blob)
    }
    const { error } = await supabase.from('themes').upsert({
      id: theme.id,
      user_id: userId,
      title: theme.title,
      subtitle: theme.subtitle || '',
      reference: theme.reference || '',
      image_path: imagePath,
    })
    if (error) throw error
  }

  for (const event of data.calendarEvents || []) {
    let coverPath = null
    if (event.coverImage) {
      const blob = await base64ToBlob(event.coverImage)
      coverPath = `${userId}/event-${event.id}.jpg`
      await uploadCover(coverPath, blob)
    }
    const { error } = await supabase.from('calendar_events').upsert({
      id: event.id,
      user_id: userId,
      title: event.title,
      notes: event.notes || '',
      category: event.category || 'event',
      custom_category: event.customCategory || '',
      start_date: event.startDate,
      end_date: event.endDate || event.startDate,
      anchor_verse: event.anchorVerse || '',
      time: event.time || '',
      theme: event.theme || '',
      cover_image_path: coverPath,
    })
    if (error) throw error
  }

  for (const note of data.eventNotes || []) {
    let sections = Array.isArray(note.sections) ? note.sections : []
    if (sections.length === 0) {
      if (note.focus) sections.push({ id: makeId(), typeId: 'focus', data: { value: note.focus } })
      if (note.minister) sections.push({ id: makeId(), typeId: 'minister', data: { value: note.minister } })
      if (Array.isArray(note.verses) && note.verses.length) {
        sections.push({ id: makeId(), typeId: 'verses', data: { verses: note.verses } })
      }
      if (note.notes) sections.push({ id: makeId(), typeId: 'notes', data: { html: note.notes } })
      if (note.prayerPoints) sections.push({ id: makeId(), typeId: 'prayer', data: { html: note.prayerPoints } })
    }
    const { error } = await supabase.from('event_notes').upsert(
      {
        user_id: userId,
        event_id: note.eventId,
        date: note.date,
        sections,
      },
      { onConflict: 'event_id,date' },
    )
    if (error) throw error
  }

  for (const card of data.prayerCards || []) {
    let notes = card.notes || ''
    if (!notes && Array.isArray(card.items) && card.items.length > 0) {
      notes = `<ul>${card.items.map((item) => `<li>${item.text}</li>`).join('')}</ul>`
    }
    const { error } = await supabase.from('prayer_cards').upsert({
      id: card.id,
      user_id: userId,
      event_id: card.eventId,
      title: card.title,
      notes,
    })
    if (error) throw error
  }

  for (const h of data.highlights || []) {
    const { error } = await supabase
      .from('highlights')
      .upsert({ id: h.id, user_id: userId, color: h.color, reference: h.reference, text: h.text }, { onConflict: 'user_id,id' })
    if (error) throw error
  }
}
