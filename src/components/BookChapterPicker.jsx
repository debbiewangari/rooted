import { useState } from 'react'
import { NEW_TESTAMENT, OLD_TESTAMENT } from '../lib/bibleBooks'

// Testament toggle + expandable book list with a chapter grid — the same
// browse pattern used on the Bible tab's own Browse section, reused here
// (inside a Drawer) so a reader can jump books/chapters without leaving
// the passage they're on.
export function BookChapterPicker({ onSelectChapter, initialBook }) {
  const [testament, setTestament] = useState(() =>
    initialBook && NEW_TESTAMENT.some((b) => b.name === initialBook) ? 'NT' : 'OT',
  )
  const [expandedBook, setExpandedBook] = useState(initialBook || null)
  const books = testament === 'OT' ? OLD_TESTAMENT : NEW_TESTAMENT

  return (
    <div>
      <div className="flex rounded-pill border border-black/10 bg-pure-white p-1">
        {[
          ['OT', 'Old Testament'],
          ['NT', 'New Testament'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTestament(id)
              setExpandedBook(null)
            }}
            className={`flex-1 rounded-pill py-2 font-label text-[11px] uppercase tracking-label transition-colors ${
              testament === id ? 'bg-deep-indigo text-pure-white' : 'text-deep-indigo'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {books.map((book) => {
          const expanded = expandedBook === book.name
          return (
            <div key={book.name} className="overflow-hidden rounded-card border border-black/10 bg-pure-white">
              <button
                type="button"
                onClick={() => setExpandedBook(expanded ? null : book.name)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 text-left">
                  <p className="font-display text-base font-medium text-ink-black">{book.name}</p>
                  <p className="font-label text-[10px] uppercase tracking-label text-black/40">
                    {book.chapters} chapter{book.chapters === 1 ? '' : 's'}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-label text-base text-deep-indigo transition-transform ${
                    expanded ? 'rotate-90' : ''
                  }`}
                >
                  ›
                </span>
              </button>

              {expanded && (
                <div className="grid grid-cols-9 gap-1.5 border-t border-black/8 px-4 py-3">
                  {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => (
                    <button
                      key={chapter}
                      type="button"
                      onClick={() => onSelectChapter(book.name, chapter)}
                      className="aspect-square rounded-[10px] border border-black/10 font-label text-[10px] text-deep-indigo"
                    >
                      {chapter}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
