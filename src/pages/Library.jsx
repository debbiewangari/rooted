import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FilledButton } from '../components/Button'
import { TYPE_ICONS } from '../components/LibraryIcons'
import { LIBRARY_TYPES, entryText, formatRelativeTime, matchesSearch, plainPreview, tagColor, typeConfig } from '../lib/library'
import { createTag, deleteEntry, listEntries, listTags } from '../lib/db'

export function Library() {
  const [searchParams] = useSearchParams()
  const [entries, setEntries] = useState(null)
  const [tags, setTags] = useState([])
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState(searchParams.get('type') || 'all')
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') || null)
  const [addingTag, setAddingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)

  function refresh() {
    listEntries().then(setEntries)
    listTags().then(setTags)
  }

  useEffect(() => {
    refresh()
  }, [])

  function selectType(id) {
    setActiveType(id)
    setActiveTag(null)
  }

  function selectTag(name) {
    setActiveTag(name)
    setActiveType('all')
  }

  async function handleAddTag(e) {
    e.preventDefault()
    if (!newTagName.trim()) return
    await createTag(newTagName)
    setNewTagName('')
    setAddingTag(false)
    listTags().then(setTags)
  }

  async function handleDelete(id) {
    await deleteEntry(id)
    setOpenMenuId(null)
    refresh()
  }

  const counts = useMemo(() => {
    const c = {}
    LIBRARY_TYPES.forEach((t) => (c[t.id] = 0))
    entries?.forEach((e) => {
      const type = e.type || 'reflection'
      c[type] = (c[type] || 0) + 1
    })
    return c
  }, [entries])

  const filtered = useMemo(() => {
    if (!entries) return []
    return entries
      .filter((e) => activeType === 'all' || (e.type || 'reflection') === activeType)
      .filter((e) => !activeTag || (e.tags || []).includes(activeTag))
      .filter((e) => matchesSearch(e, query))
  }, [entries, activeType, activeTag, query])

  const hasFilter = activeType !== 'all' || activeTag || query.trim()

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase text-deep-indigo">Library</h1>
          <p className="mt-1 font-body text-sm text-black/60">Everything you've gathered along the way.</p>
        </div>
        <FilledButton to="/journal/new" className="shrink-0 px-5 py-3 text-xl leading-none">
          +
        </FilledButton>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search studies, sermons, prayers…"
        className="mt-5 w-full rounded-card border border-black/10 bg-pure-white px-4 py-3 font-body text-sm focus:outline-none"
      />

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => selectType('all')}
          className={`shrink-0 rounded-pill px-4 py-2 font-label text-[11px] uppercase tracking-label ${
            activeType === 'all' && !activeTag
              ? 'bg-deep-indigo text-pure-white'
              : 'border border-black/10 bg-pure-white text-deep-indigo'
          }`}
        >
          All
        </button>
        {LIBRARY_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectType(t.id)}
            className={`shrink-0 rounded-pill px-4 py-2 font-label text-[11px] uppercase tracking-label ${
              activeType === t.id
                ? 'bg-deep-indigo text-pure-white'
                : 'border border-black/10 bg-pure-white text-deep-indigo'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!hasFilter && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {LIBRARY_TYPES.map((t) => {
            const Icon = TYPE_ICONS[t.id]
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectType(t.id)}
                className="flex items-center justify-between rounded-card p-3 text-left"
                style={{ backgroundColor: `${t.hex}33` }}
              >
                <span className="flex items-center gap-2.5">
                  <Icon color="#234386" size={20} />
                  <span>
                    <span className="block font-display text-base text-deep-indigo">{t.label}</span>
                    <span className="block font-label text-[10px] uppercase tracking-label text-black/50">
                      {counts[t.id] || 0} entries
                    </span>
                  </span>
                </span>
                <span className="font-display text-lg text-deep-indigo">›</span>
              </button>
            )
          })}
        </div>
      )}

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl uppercase text-deep-indigo">
            {hasFilter ? `Results (${filtered.length})` : 'Recently Added'}
          </h2>
          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                setActiveType('all')
                setActiveTag(null)
                setQuery('')
              }}
              className="font-label text-xs uppercase tracking-label text-burnt-orange"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-col">
          {entries === null && <p className="py-4 font-body text-sm text-black/50">Loading…</p>}
          {entries && filtered.length === 0 && (
            <p className="py-4 font-body text-sm text-black/50">
              {hasFilter ? 'Nothing matches that filter.' : 'Nothing here yet — tap + to add your first entry.'}
            </p>
          )}
          {(hasFilter ? filtered : filtered.slice(0, 5)).map((entry) => {
            const cfg = typeConfig(entry.type || 'reflection')
            const Icon = TYPE_ICONS[entry.type || 'reflection']
            return (
              <div key={entry.id} className="relative flex items-center gap-3 border-b border-black/10 py-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card"
                  style={{ backgroundColor: `${cfg.hex}33` }}
                >
                  <Icon color="#234386" size={18} />
                </div>
                <Link to={`/journal/${entry.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-display text-base text-deep-indigo">{entry.title}</p>
                  <p className="truncate font-label text-[10px] uppercase tracking-label text-black/40">
                    {cfg.singular}
                    {entry.reference ? ` · ${entry.reference}` : ''}
                  </p>
                  {entryText(entry) && (
                    <p className="mt-0.5 truncate font-body text-xs text-black/50">
                      {plainPreview(entryText(entry), 80)}
                    </p>
                  )}
                </Link>
                <span className="shrink-0 font-label text-[10px] uppercase tracking-label text-black/30">
                  {formatRelativeTime(entry.updatedAt)}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenMenuId(openMenuId === entry.id ? null : entry.id)}
                  className="shrink-0 px-1 font-display text-lg text-black/30"
                  aria-label="More options"
                >
                  ⋯
                </button>
                {openMenuId === entry.id && (
                  <div className="absolute right-0 top-10 z-10 flex flex-col overflow-hidden rounded-card border border-black/10 bg-pure-white shadow-xl-2">
                    <Link
                      to={`/journal/${entry.id}`}
                      className="px-4 py-2 font-label text-[11px] uppercase tracking-label text-deep-indigo"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="px-4 py-2 text-left font-label text-[11px] uppercase tracking-label text-burnt-orange"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl uppercase text-deep-indigo">Explore by Theme</h2>
          <button
            type="button"
            onClick={() => setAddingTag((v) => !v)}
            className="font-label text-xs uppercase tracking-label text-burnt-orange"
          >
            + New
          </button>
        </div>

        {addingTag && (
          <form onSubmit={handleAddTag} className="mt-3 flex gap-2">
            <input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="e.g. Provision"
              autoFocus
              className="flex-1 rounded-card border border-black/10 bg-pure-white px-3 py-2 font-body text-sm focus:outline-none"
            />
            <FilledButton type="submit" className="px-5 py-2 text-[11px]">
              Add
            </FilledButton>
          </form>
        )}

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {tags.length === 0 && !addingTag && (
            <p className="font-body text-sm text-black/40">No themes yet — tap + New to tag your content.</p>
          )}
          {tags.map((tag, i) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => selectTag(tag.name)}
              className={`flex shrink-0 items-center gap-2 rounded-pill px-4 py-2 font-label text-[11px] uppercase tracking-label ${
                activeTag === tag.name
                  ? 'bg-deep-indigo text-pure-white'
                  : 'border border-black/10 bg-pure-white text-deep-indigo'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tagColor(i) }} />
              {tag.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
