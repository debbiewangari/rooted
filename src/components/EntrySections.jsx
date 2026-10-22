import { useState } from 'react'
import { Card } from './Card'
import { EventVerseList } from './EventVerseList'
import { RichTextEditor } from './RichTextEditor'
import { legacyItemsToHtml } from '../lib/library'

function makeId() {
  return crypto.randomUUID()
}

const DEFAULT_DATA = {
  scripture: { verses: [] },
}

function hasValue(section, kind) {
  if (kind === 'scripture') return (section.data?.verses || []).length > 0
  return Boolean(section.data?.html && section.data.html.replace(/<[^>]*>/g, '').trim())
}

// A single block — Notes, Scriptures, a custom type, whatever — matching
// the read/edit toggle event-day sections use: scripture has no controls
// (remove, add a verse) visible until you tap in, so a saved entry reads
// as plain bullets instead of a permanently "open" editor.
function EntrySectionBlock({ section, typeDef, onUpdateData, onRemove, onLink }) {
  const isScripture = typeDef.kind === 'scripture'
  const [editing, setEditing] = useState(!hasValue(section, typeDef.kind))

  return (
    <div>
      <div className="flex items-baseline justify-between">
        {isScripture ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setEditing((e) => !e)}
            className="font-label text-[11px] uppercase tracking-label text-black/40"
          >
            {typeDef.label}
          </button>
        ) : (
          <span className="font-label text-[11px] uppercase tracking-label text-black/40">{typeDef.label}</span>
        )}
        {(!isScripture || editing) && (
          <button
            type="button"
            onClick={onRemove}
            className="font-label text-[10px] uppercase tracking-label text-black/30"
          >
            Remove
          </button>
        )}
      </div>

      {typeDef.kind === 'scripture' &&
        (editing ? (
          <div className="mt-1">
            <EventVerseList
              verses={section.data?.verses || []}
              onAdd={(reference) =>
                onUpdateData({ verses: [...(section.data?.verses || []), { id: makeId(), reference }] })
              }
              onRemove={(verseId) =>
                onUpdateData({ verses: (section.data?.verses || []).filter((v) => v.id !== verseId) })
              }
            />
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="mt-1 block w-full text-left">
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

      {typeDef.kind === 'richtext' && (
        <div className="mt-1">
          <RichTextEditor
            value={section.data?.html ?? (section.data?.items ? legacyItemsToHtml(section.data.items) : '')}
            onChange={(html) => onUpdateData({ html })}
            placeholder={`Write ${typeDef.label.toLowerCase()}…`}
            onLink={onLink}
          />
        </div>
      )}
    </div>
  )
}

// A CMS-style block list: a Library entry is built from whichever sections
// the user chooses — built-in types (Notes, Scriptures, Bible Story,
// Prophetic Declarations, Prayer, Testimony) are always offered, and a
// user can name a brand new one or add another of a type already in use
// (two separate Notes sections, say), the same reusable-registry idea
// event day-notes use.
export function EntrySections({ sections, onChange, onLink, typeDefs, onCreateType }) {
  const [addingType, setAddingType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')

  function typeDefFor(typeId) {
    return typeDefs.find((t) => t.id === typeId) || { id: typeId, label: 'Section', kind: 'richtext' }
  }

  function addSection(typeDef) {
    const data = DEFAULT_DATA[typeDef.kind] ? { ...DEFAULT_DATA[typeDef.kind] } : { html: '' }
    onChange([...sections, { id: makeId(), type: typeDef.id, data }])
    setAddingType(false)
  }

  async function handleCreateNew() {
    if (!newTypeName.trim()) return
    const type = await onCreateType(newTypeName)
    setNewTypeName('')
    addSection(type)
  }

  function updateSection(id, data) {
    onChange(sections.map((s) => (s.id === id ? { ...s, data: { ...s.data, ...data } } : s)))
  }

  function removeSection(id) {
    onChange(sections.filter((s) => s.id !== id))
  }

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <Card key={section.id}>
          <EntrySectionBlock
            section={section}
            typeDef={typeDefFor(section.type)}
            onUpdateData={(data) => updateSection(section.id, data)}
            onRemove={() => removeSection(section.id)}
            onLink={onLink}
          />
        </Card>
      ))}

      {sections.length === 0 && (
        <p className="font-body text-sm text-black/40">
          No sections yet — add one below to start building this entry.
        </p>
      )}

      {addingType ? (
        <div className="flex flex-wrap items-center gap-2">
          {typeDefs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => addSection(t)}
              className="rounded-pill border border-black/10 bg-pure-white px-3 py-1.5 font-label text-[10px] uppercase tracking-label text-deep-indigo"
            >
              {t.label}
            </button>
          ))}
          <div className="flex w-full items-center gap-2">
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
            onClick={() => setAddingType(false)}
            className="font-label text-[10px] uppercase tracking-label text-black/30"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingType(true)}
          className="self-start font-label text-[11px] uppercase tracking-label text-deep-indigo"
        >
          + Add section
        </button>
      )}
    </div>
  )
}
