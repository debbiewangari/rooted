import { useEffect, useRef, useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from './Card'
import { FilledButton } from './Button'
import { RichTextEditor } from './RichTextEditor'
import { createPrayerCard, deletePrayerCard, listPrayerCards, reorderPrayerCards, updatePrayerCardNotes } from '../lib/db'

function hasText(html) {
  return Boolean(html && html.replace(/<[^>]*>/g, '').trim())
}

function DragHandle(props) {
  return (
    <span
      {...props}
      aria-label="Drag to reorder"
      className="cursor-grab touch-none select-none px-1 pb-1 text-base leading-none text-black/25 active:cursor-grabbing"
    >
      ⠿
    </span>
  )
}

// Standing prayer lists for an event — e.g. a gratitude list or ongoing
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

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

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = cards.findIndex((c) => c.id === active.id)
    const newIndex = cards.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(cards, oldIndex, newIndex)
    setCards(reordered)
    reorderPrayerCards(reordered.map((c) => c.id))
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
            No prayer lists yet — add one for points you want to keep coming back to in prayer.
          </p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={(cards || []).map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {cards?.map((card) => (
              <SortablePrayerCard
                key={card.id}
                card={card}
                expanded={expandedId === card.id}
                editingNotes={editingNotes}
                draftNotes={draftNotes}
                saving={saving}
                onToggle={() => toggleCard(card.id)}
                onDraftChange={setDraftNotes}
                onStopEditing={() => setEditingNotes(false)}
                onStartEditing={() => setEditingNotes(true)}
                onDelete={() => handleDeleteCard(card.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </section>
  )
}

function SortablePrayerCard({
  card,
  expanded,
  editingNotes,
  draftNotes,
  saving,
  onToggle,
  onDraftChange,
  onStopEditing,
  onStartEditing,
  onDelete,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="font-label text-[11px] uppercase tracking-label text-black/40"
          >
            {card.title}
          </button>
          {expanded && editingNotes && (
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={onDelete}
                className="font-label text-[10px] uppercase tracking-label text-black/30"
              >
                Delete list
              </button>
              <DragHandle {...attributes} {...listeners} />
            </div>
          )}
        </div>

        {expanded && (
          <div className="mt-2">
            {editingNotes ? (
              <RichTextEditor
                value={draftNotes}
                onChange={onDraftChange}
                onBlur={onStopEditing}
                placeholder="Write what you're praying through…"
              />
            ) : (
              <button type="button" onClick={onStartEditing} className="block w-full text-left">
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

            {saving && <p className="mt-2 font-label text-[10px] uppercase tracking-label text-black/30">Saving…</p>}
          </div>
        )}
      </Card>
    </div>
  )
}
