import { useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from './Card'
import { EventVerseList } from './EventVerseList'
import { RichTextEditor } from './RichTextEditor'

function hasText(html) {
  return Boolean(html && html.replace(/<[^>]*>/g, '').trim())
}

function hasValue(section, kind) {
  if (kind === 'scripture') return (section.data?.verses || []).length > 0
  if (kind === 'text') return Boolean(section.data?.value)
  return hasText(section.data?.html)
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

function SortableSection({ section, typeDef, onUpdateData, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const [editing, setEditing] = useState(!hasValue(section, typeDef.kind))

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
            // Without this, clicking the label while the field below is
            // focused blurs it first (closing edit mode), then this
            // button's own click re-opens it — net effect, tapping to
            // close does nothing. Blocking the mousedown's default stops
            // the blur so only one toggle happens.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setEditing((e) => !e)}
            className="font-label text-[11px] uppercase tracking-label text-black/40"
          >
            {typeDef.name}
          </button>
          {/* Remove/reorder are editing actions, not something to see while
              just reading this card. */}
          {editing && (
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={onRemove}
                className="font-label text-[10px] uppercase tracking-label text-black/30"
              >
                Remove
              </button>
              <DragHandle {...attributes} {...listeners} />
            </div>
          )}
        </div>

        {typeDef.kind === 'text' &&
          (editing ? (
            <input
              autoFocus
              value={section.data?.value || ''}
              onChange={(e) => onUpdateData({ value: e.target.value })}
              onBlur={() => setEditing(false)}
              placeholder={`Add ${typeDef.name.toLowerCase()}…`}
              className="mt-2 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2 font-body text-sm placeholder:text-black/30 focus:outline-none"
            />
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="mt-2 block w-full text-left">
              {section.data?.value ? (
                <span className="font-display text-base font-medium text-ink-black">{section.data.value}</span>
              ) : (
                <span className="font-body text-sm text-black/30">Add {typeDef.name.toLowerCase()}…</span>
              )}
            </button>
          ))}

        {typeDef.kind === 'scripture' &&
          (editing ? (
            <div className="mt-2">
              <EventVerseList
                verses={section.data?.verses || []}
                onAdd={(reference) =>
                  onUpdateData({ verses: [...(section.data?.verses || []), { id: crypto.randomUUID(), reference }] })
                }
                onRemove={(verseId) =>
                  onUpdateData({ verses: (section.data?.verses || []).filter((v) => v.id !== verseId) })
                }
              />
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="mt-2 block w-full text-left">
              {(section.data?.verses || []).length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {section.data.verses.map((v) => (
                    <li key={v.id} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-deep-indigo" />
                      <span className="font-body text-sm text-black/80">{v.reference}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="font-body text-sm text-black/30">Add verses…</span>
              )}
            </button>
          ))}

        {typeDef.kind === 'richtext' &&
          (editing ? (
            <div className="mt-2">
              <RichTextEditor
                value={section.data?.html || ''}
                onChange={(html) => onUpdateData({ html })}
                onBlur={() => setEditing(false)}
                placeholder={`Write ${typeDef.name.toLowerCase()}…`}
              />
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="mt-2 block w-full text-left">
              {hasText(section.data?.html) ? (
                <span
                  className="rich-text-editor font-body text-sm text-black/80"
                  dangerouslySetInnerHTML={{ __html: section.data.html }}
                />
              ) : (
                <span className="font-body text-sm text-black/30">Write {typeDef.name.toLowerCase()}…</span>
              )}
            </button>
          ))}
      </Card>
    </div>
  )
}

const DEFAULT_DATA = { scripture: { verses: [] }, text: { value: '' } }

// A day's note built from sections, same CMS idea as a Library entry —
// built-in types are always offered, and a user can name a brand new type
// which is then saved and reusable on any other day. Press-and-drag
// (no arrows) reorders the cards.
export function DaySections({ sections, typeDefs, onChange, onCreateType }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function typeDefFor(typeId) {
    return typeDefs.find((t) => t.id === typeId) || { id: typeId, name: 'Section', kind: 'richtext' }
  }

  function updateSectionData(id, data) {
    onChange(sections.map((s) => (s.id === id ? { ...s, data: { ...s.data, ...data } } : s)))
  }

  function removeSection(id) {
    onChange(sections.filter((s) => s.id !== id))
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    onChange(arrayMove(sections, oldIndex, newIndex))
  }

  const usedTypeIds = new Set(sections.map((s) => s.typeId))
  const availableToAdd = typeDefs.filter((t) => !usedTypeIds.has(t.id))

  function addExisting(typeDef) {
    const data = DEFAULT_DATA[typeDef.kind] ? { ...DEFAULT_DATA[typeDef.kind] } : { html: '' }
    onChange([...sections, { id: crypto.randomUUID(), typeId: typeDef.id, data }])
    setPickerOpen(false)
  }

  async function handleCreateNew() {
    if (!newTypeName.trim()) return
    const type = await onCreateType(newTypeName)
    setNewTypeName('')
    onChange([...sections, { id: crypto.randomUUID(), typeId: type.id, data: { html: '' } }])
    setPickerOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              typeDef={typeDefFor(section.typeId)}
              onUpdateData={(data) => updateSectionData(section.id, data)}
              onRemove={() => removeSection(section.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {pickerOpen ? (
        <Card>
          <p className="font-label text-[11px] uppercase tracking-label text-black/40">Add a section</p>
          {availableToAdd.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {availableToAdd.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => addExisting(t)}
                  className="rounded-pill border border-black/10 bg-pure-white px-3 py-1.5 font-label text-[10px] uppercase tracking-label text-deep-indigo"
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <input
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreateNew()
                }
              }}
              placeholder="New section name…"
              autoFocus
              className="flex-1 rounded-card border border-black/10 bg-pure-white px-3 py-1.5 font-body text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCreateNew}
              className="font-label text-[10px] uppercase tracking-label text-deep-indigo"
            >
              Create
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(false)}
            className="mt-3 font-label text-[10px] uppercase tracking-label text-black/30"
          >
            Cancel
          </button>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="self-start font-label text-[11px] uppercase tracking-label text-deep-indigo"
        >
          + Add new section
        </button>
      )}
    </div>
  )
}
