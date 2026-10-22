import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Drawer } from './Drawer'
import { FilledButton } from './Button'
import { TYPE_ICONS } from './LibraryIcons'
import {
  createLink,
  listAllEventNotes,
  listAllPrayerCards,
  listCalendarEvents,
  listEntries,
  listLinksFor,
  listStudySeries,
  removeLink,
} from '../lib/db'
import { enumerateDates, formatShortDate } from '../lib/calendarUtils'
import { typeConfig } from '../lib/library'

function LinkGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#234386" strokeWidth="1.8">
      <path d="M9 15 15 9" strokeLinecap="round" />
      <path
        d="M10.5 6.5 12 5a4 4 0 0 1 5.66 5.66l-1.5 1.5M13.5 17.5 12 19a4 4 0 0 1-5.66-5.66l1.5-1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function targetKey(t) {
  return `${t.type}:${t.id}`
}

// Builds the lookup every linkable thing resolves against — a journal
// entry shows its own title; a day-note has none of its own, so it
// borrows its event's title plus which day it is.
async function loadAllTargets() {
  const [entries, notes, cards, events, series] = await Promise.all([
    listEntries(),
    listAllEventNotes(),
    listAllPrayerCards(),
    listCalendarEvents(),
    listStudySeries(),
  ])
  const eventById = Object.fromEntries(events.map((e) => [e.id, e]))

  const entryTargets = entries.map((e) => ({
    type: 'entry',
    id: e.id,
    title: e.title,
    subtitle: typeConfig(e.type).singular,
    searchText: `${e.title} ${e.reference || ''}`.toLowerCase(),
    href: `/journal/${e.id}`,
    iconHex: typeConfig(e.type).hex,
    entryType: e.type,
  }))

  const noteTargets = notes.map((n) => {
    const event = eventById[n.eventId]
    const dayNumber = event ? enumerateDates(event.startDate, n.date).length : null
    const title = event?.title || 'Event'
    const subtitle = dayNumber ? `Day ${dayNumber} · ${formatShortDate(n.date)}` : formatShortDate(n.date)
    return {
      type: 'day_note',
      id: n.id,
      title,
      subtitle,
      searchText: `${title} ${n.date}`.toLowerCase(),
      href: event ? `/events/${event.id}/day/${n.date}` : null,
    }
  })

  const cardTargets = cards.map((c) => {
    const event = eventById[c.eventId]
    const subtitle = event ? `Prayer list · ${event.title}` : 'Prayer list'
    return {
      type: 'prayer_card',
      id: c.id,
      title: c.title,
      subtitle,
      searchText: `${c.title} ${event?.title || ''}`.toLowerCase(),
      href: event ? `/events/${event.id}` : null,
    }
  })

  const seriesTargets = series.map((s) => ({
    type: 'study_series',
    id: s.id,
    title: s.title,
    subtitle: 'Study series',
    searchText: `${s.title} ${s.theme || ''}`.toLowerCase(),
    href: `/series/${s.id}`,
  }))

  return [...entryTargets, ...noteTargets, ...cardTargets, ...seriesTargets]
}

function TargetIcon({ target }) {
  if (target.type === 'entry') {
    const Icon = TYPE_ICONS[target.entryType || 'reflection']
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card"
        style={{ backgroundColor: `${target.iconHex}33` }}
      >
        <Icon color="#234386" size={16} />
      </div>
    )
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-deep-indigo/10">
      <LinkGlyph />
    </div>
  )
}

// Linking is separate from themes/tags — themes group entries by topic,
// this connects two specific things on purpose (the prayer that led to
// this testimony, the study that inspired that reflection). Works the
// same for a journal entry or a single day's event notes, since either
// can be a side of a link.
export const EntryLinks = forwardRef(function EntryLinks({ selfType, selfId, ensureSelfId }, ref) {
  const [resolvedSelfId, setResolvedSelfId] = useState(selfId || null)
  const [links, setLinks] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [allTargets, setAllTargets] = useState(null)
  const [selected, setSelected] = useState(() => new Set())
  const [linking, setLinking] = useState(false)

  useEffect(() => {
    setResolvedSelfId(selfId || null)
  }, [selfId])

  async function refresh(id) {
    const [refs, targets] = await Promise.all([
      listLinksFor(selfType, id),
      allTargets ? Promise.resolve(allTargets) : loadAllTargets(),
    ])
    if (!allTargets) setAllTargets(targets)
    setLinks(refs)
  }

  useEffect(() => {
    if (resolvedSelfId) refresh(resolvedSelfId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfType, resolvedSelfId])

  const linkedTargets = useMemo(() => {
    if (!links || !allTargets) return null
    const byKey = new Map(allTargets.map((t) => [targetKey(t), t]))
    return links
      .map((l) => {
        const target = byKey.get(`${l.type}:${l.id}`)
        return target ? { ...target, linkId: l.linkId } : null
      })
      .filter(Boolean)
  }, [links, allTargets])

  async function openDrawer() {
    let id = resolvedSelfId
    if (!id && ensureSelfId) {
      id = await ensureSelfId()
      setResolvedSelfId(id)
    }
    if (!id) return
    setSelected(new Set())
    setQuery('')
    setDrawerOpen(true)
    if (!allTargets) setAllTargets(await loadAllTargets())
  }

  // Lets a "Link" icon anywhere else on the page (e.g. inside a
  // RichTextEditor's toolbar) open this same drawer, instead of each
  // editor needing its own copy of the candidate-loading/search logic.
  useImperativeHandle(ref, () => ({ open: openDrawer }))

  const linkedKeys = useMemo(() => new Set((links || []).map((l) => `${l.type}:${l.id}`)), [links])

  const candidates = useMemo(() => {
    if (!allTargets) return []
    const q = query.trim().toLowerCase()
    return allTargets
      .filter((t) => !(t.type === selfType && t.id === resolvedSelfId))
      .filter((t) => !linkedKeys.has(targetKey(t)))
      .filter((t) => !q || t.searchText.includes(q))
      .slice(0, 8)
  }, [allTargets, query, selfType, resolvedSelfId, linkedKeys])

  function toggleSelected(target) {
    setSelected((prev) => {
      const next = new Set(prev)
      const key = targetKey(target)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleConfirmLink() {
    if (selected.size === 0 || !resolvedSelfId) return
    setLinking(true)
    try {
      const toLink = candidates.filter((c) => selected.has(targetKey(c)))
      for (const target of toLink) {
        await createLink(selfType, resolvedSelfId, target.type, target.id)
      }
      await refresh(resolvedSelfId)
      setDrawerOpen(false)
    } finally {
      setLinking(false)
    }
  }

  async function handleUnlink(linkId) {
    await removeLink(linkId)
    setLinks((prev) => (prev || []).filter((l) => l.linkId !== linkId))
  }

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-ink-black">Linked entries</h2>
        <button
          type="button"
          onClick={openDrawer}
          className="font-label text-[11px] uppercase tracking-label text-deep-indigo"
        >
          + Link an entry
        </button>
      </div>

      {resolvedSelfId && linkedTargets === null && (
        <p className="mt-2 font-body text-sm text-black/40">Loading…</p>
      )}
      {linkedTargets?.length === 0 && (
        <p className="mt-2 font-body text-sm text-black/40">
          No linked entries yet — connect this to a related study, prayer or testimony.
        </p>
      )}

      {linkedTargets && linkedTargets.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {linkedTargets.map((t) => (
            <div
              key={t.linkId}
              className="flex items-center gap-3 rounded-card border border-black/10 bg-pure-white px-4 py-3"
            >
              <Link to={t.href || '#'} className="flex min-w-0 flex-1 items-center gap-3">
                <TargetIcon target={t} />
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-medium text-ink-black">{t.title}</p>
                  <p className="mt-0.5 font-body text-xs text-black/50">{t.subtitle}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => handleUnlink(t.linkId)}
                className="shrink-0 font-label text-[10px] uppercase tracking-label text-black/30"
              >
                Unlink
              </button>
            </div>
          ))}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Link an entry">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search entries and day notes…"
          className="w-full rounded-card border border-black/10 bg-pure-white px-3 py-2.5 font-body text-sm focus:outline-none"
        />

        <div className="mt-3 flex max-h-[45vh] flex-col gap-2 overflow-y-auto">
          {allTargets === null && <p className="font-body text-sm text-black/40">Loading…</p>}
          {allTargets && candidates.length === 0 && (
            <p className="font-body text-sm text-black/40">Nothing matches “{query}”.</p>
          )}
          {candidates.map((c) => {
            const isSelected = selected.has(targetKey(c))
            return (
              <button
                key={targetKey(c)}
                type="button"
                onClick={() => toggleSelected(c)}
                className={`flex items-center gap-3 rounded-card border px-3 py-2.5 text-left ${
                  isSelected ? 'border-deep-indigo bg-mist' : 'border-black/10 bg-pure-white'
                }`}
              >
                <TargetIcon target={c} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-medium text-ink-black">{c.title}</p>
                  <p className="font-body text-xs text-black/50">{c.subtitle}</p>
                </div>
                {isSelected && <span className="shrink-0 font-display text-deep-indigo">✓</span>}
              </button>
            )
          })}
        </div>

        <FilledButton
          type="button"
          onClick={handleConfirmLink}
          disabled={selected.size === 0 || linking}
          className="mt-4 w-full"
        >
          {linking ? 'Linking…' : selected.size > 0 ? `Link ${selected.size}` : 'Link'}
        </FilledButton>
      </Drawer>
    </section>
  )
})
