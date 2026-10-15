import { useState } from 'react'
import { EventVerseList } from './EventVerseList'
import { RichTextEditor } from './RichTextEditor'
import { SECTION_TYPES, sectionConfig } from '../lib/library'

function makeId() {
  return crypto.randomUUID()
}

const DEFAULT_DATA = {
  scripture: { verses: [] },
  prayer: { items: [] },
}

// A CMS-style block list: a Library entry is built from whichever sections
// the user chooses (Notes, Scriptures, Bible Story, Prophetic Declarations,
// Prayer, Testimony) — add the ones a given entry needs, remove the rest.
export function EntrySections({ sections, onChange }) {
  const [addingType, setAddingType] = useState(false)

  const usedTypes = new Set(sections.map((s) => s.type))
  const availableTypes = SECTION_TYPES.filter((t) => !usedTypes.has(t.id))

  function addSection(typeId) {
    const data = DEFAULT_DATA[typeId] ? { ...DEFAULT_DATA[typeId] } : { html: '' }
    onChange([...sections, { id: makeId(), type: typeId, data }])
    setAddingType(false)
  }

  function updateSection(id, data) {
    onChange(sections.map((s) => (s.id === id ? { ...s, data } : s)))
  }

  function removeSection(id) {
    onChange(sections.filter((s) => s.id !== id))
  }

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => {
        const cfg = sectionConfig(section.type)
        return (
          <div key={section.id}>
            <div className="flex items-baseline justify-between">
              <span className="font-label text-[11px] uppercase tracking-label text-black/40">{cfg?.label}</span>
              <button
                type="button"
                onClick={() => removeSection(section.id)}
                className="font-label text-[10px] uppercase tracking-label text-black/30"
              >
                Remove
              </button>
            </div>

            {cfg?.kind === 'scripture' && (
              <div className="mt-1">
                <EventVerseList
                  verses={section.data.verses}
                  onAdd={(reference) =>
                    updateSection(section.id, { verses: [...section.data.verses, { id: makeId(), reference }] })
                  }
                  onRemove={(verseId) =>
                    updateSection(section.id, { verses: section.data.verses.filter((v) => v.id !== verseId) })
                  }
                />
              </div>
            )}

            {cfg?.kind === 'prayer' && (
              <PrayerItemsEditor
                items={section.data.items}
                onAdd={(text) => updateSection(section.id, { items: [...section.data.items, { id: makeId(), text }] })}
                onRemove={(itemId) =>
                  updateSection(section.id, { items: section.data.items.filter((i) => i.id !== itemId) })
                }
              />
            )}

            {cfg?.kind === 'richtext' && (
              <div className="mt-1">
                <RichTextEditor
                  value={section.data.html}
                  onChange={(html) => updateSection(section.id, { html })}
                  placeholder={cfg.placeholder}
                />
              </div>
            )}
          </div>
        )
      })}

      {sections.length === 0 && (
        <p className="font-body text-sm text-black/40">
          No sections yet — add one below to start building this entry.
        </p>
      )}

      {addingType ? (
        <div className="flex flex-wrap items-center gap-2">
          {availableTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => addSection(t.id)}
              className="rounded-pill border border-black/10 bg-pure-white px-3 py-1.5 font-label text-[10px] uppercase tracking-label text-deep-indigo"
            >
              {t.label}
            </button>
          ))}
          {availableTypes.length === 0 && (
            <p className="font-body text-xs text-black/40">All section types added.</p>
          )}
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

function PrayerItemsEditor({ items, onAdd, onRemove }) {
  const [text, setText] = useState('')

  function handleAdd() {
    if (!text.trim()) return
    onAdd(text.trim())
    setText('')
  }

  return (
    <div className="mt-1">
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-deep-indigo" />
            <span className="flex-1 font-body text-sm text-black/80">{item.text}</span>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="font-label text-[10px] text-black/30"
              aria-label="Remove point"
            >
              ✕
            </button>
          </li>
        ))}
        {items.length === 0 && <p className="font-body text-sm text-black/40">No points yet.</p>}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="Add a point…"
          className="flex-1 rounded-card border border-black/10 bg-cream-paper px-3 py-2 font-body text-sm focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="font-label text-[10px] uppercase tracking-label text-deep-indigo"
        >
          Add
        </button>
      </div>
    </div>
  )
}
