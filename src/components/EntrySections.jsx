import { useState } from 'react'
import { EventVerseList } from './EventVerseList'
import { RichTextEditor } from './RichTextEditor'
import { SECTION_TYPES, legacyItemsToHtml, sectionConfig } from '../lib/library'

function makeId() {
  return crypto.randomUUID()
}

const DEFAULT_DATA = {
  scripture: { verses: [] },
}

// A CMS-style block list: a Library entry is built from whichever sections
// the user chooses (Notes, Scriptures, Bible Story, Prophetic Declarations,
// Prayer, Testimony) — add the ones a given entry needs, remove the rest.
export function EntrySections({ sections, onChange, onLink }) {
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

            {cfg?.kind === 'richtext' && (
              <div className="mt-1">
                <RichTextEditor
                  value={section.data.html ?? (section.data.items ? legacyItemsToHtml(section.data.items) : '')}
                  onChange={(html) => updateSection(section.id, { html })}
                  placeholder={cfg.placeholder}
                  onLink={onLink}
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
