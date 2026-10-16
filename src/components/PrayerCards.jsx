import { useEffect, useRef, useState } from 'react'
import { Card } from './Card'
import { FilledButton } from './Button'
import { RichTextEditor } from './RichTextEditor'
import { createPrayerCard, deletePrayerCard, listPrayerCards, updatePrayerCardNotes } from '../lib/db'

function hasText(html) {
  return Boolean(html && html.replace(/<[^>]*>/g, '').trim())
}

// Standing prayer lists for a challenge — e.g. a gratitude list or ongoing
// requests — separate from the per-day notes since they aren't tied to a
// single date and get prayed through repeatedly across the whole event.
// Each list is a free-form notebook page: open it (the dropdown) and write,
// no per-point "Add" step.
export function PrayerCards({ eventId }) {
  const [cards, setCards] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [addingCard, setAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [draftNotes, setDraftNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [saving, setSaving] = useState(false)
  // The notes value as loaded, so the autosave effect can tell a real edit
  // apart from merely opening a list — comparing against a remembered
  // baseline (rather than a one-shot "skip the next run" flag) means it
  // can't miss an edit just because the opened list started out empty and
  // stayed empty for that one render (an unchanged '' never re-runs a
  // string-keyed effect, so a flag expecting that run never gets consumed).
  const baselineNotesRef = useRef('')

  function refresh() {
    return listPrayerCards(eventId).then(setCards)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  function toggleCard(id) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    const card = cards.find((c) => c.id === id)
    baselineNotesRef.current = card?.notes || ''
    setDraftNotes(card?.notes || '')
    setEditingNotes(!hasText(card?.notes))
    setExpandedId(id)
  }

  useEffect(() => {
    if (!expandedId || draftNotes === baselineNotesRef.current) return
    setSaving(true)
    const timeout = setTimeout(async () => {
      await updatePrayerCardNotes(expandedId, draftNotes)
      baselineNotesRef.current = draftNotes
      setCards((prev) => (prev ? prev.map((c) => (c.id === expandedId ? { ...c, notes: draftNotes } : c)) : prev))
      setSaving(false)
    }, 700)
    return () => clearTimeout(timeout)
  }, [draftNotes, expandedId])

  async function handleCreateCard() {
    if (!newCardTitle.trim()) return
    const card = await createPrayerCard(eventId, newCardTitle)
    setNewCardTitle('')
    setAddingCard(false)
    await refresh()
    baselineNotesRef.current = ''
    setDraftNotes('')
    setEditingNotes(true)
    setExpandedId(card.id)
  }

  async function handleDeleteCard(cardId) {
    await deletePrayerCard(cardId)
    if (expandedId === cardId) setExpandedId(null)
    refresh()
  }

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-ink-black">Prayer Lists</h2>
        <button
          type="button"
          onClick={() => setAddingCard((v) => !v)}
          className="font-label text-[11px] uppercase tracking-label text-deep-indigo"
        >
          + Add new
        </button>
      </div>

      {addingCard && (
        <div className="mt-3 flex gap-2">
          <input
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreateCard()
              }
            }}
            placeholder="e.g. Prayer Requests"
            autoFocus
            className="flex-1 rounded-card border border-black/10 bg-pure-white px-3 py-2 font-body text-sm focus:outline-none"
          />
          <FilledButton type="button" onClick={handleCreateCard} className="px-5 py-2 text-[11px]">
            Add
          </FilledButton>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-3">
        {cards?.length === 0 && !addingCard && (
          <p className="font-body text-sm text-black/50">
            No prayer lists yet — add one for points you want to keep praying through the whole challenge.
          </p>
        )}

        {cards?.map((card) => {
          const expanded = expandedId === card.id
          return (
            <Card key={card.id}>
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleCard(card.id)}
                  className="font-label text-[11px] uppercase tracking-label text-black/40"
                >
                  {card.title}
                </button>
                {expanded && editingNotes && (
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card.id)}
                      className="font-label text-[10px] uppercase tracking-label text-black/30"
                    >
                      Delete list
                    </button>
                  </div>
                )}
              </div>

              {expanded && (
                <div className="mt-2">
                  {editingNotes ? (
                    <RichTextEditor
                      value={draftNotes}
                      onChange={setDraftNotes}
                      onBlur={() => setEditingNotes(false)}
                      placeholder="Write what you're praying through…"
                    />
                  ) : (
                    <button type="button" onClick={() => setEditingNotes(true)} className="block w-full text-left">
                      {hasText(draftNotes) ? (
                        <span
                          className="rich-text-editor font-body text-sm text-black/80"
                          dangerouslySetInnerHTML={{ __html: draftNotes }}
                        />
                      ) : (
                        <span className="font-body text-sm text-black/30">Write what you're praying through…</span>
                      )}
                    </button>
                  )}

                  {saving && (
                    <p className="mt-2 font-label text-[10px] uppercase tracking-label text-black/30">Saving…</p>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}
