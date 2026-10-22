import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BotanicalSprig } from '../components/BotanicalLine'
import { StudyIcon } from '../components/LibraryIcons'
import { listEntries, listStudySeries } from '../lib/db'

// entryDate is the date the user picked for the entry, separate from
// updatedAt — same parsing used across Library/Themes so a backdated entry
// can't shift a day across a UTC boundary.
function formatEntryDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function SeriesList() {
  const [series, setSeries] = useState(null)
  const [studies, setStudies] = useState(null)

  useEffect(() => {
    listStudySeries().then(setSeries)
    listEntries().then((all) => setStudies(all.filter((e) => (e.type || 'reflection') === 'study')))
  }, [])

  const standalone = useMemo(() => (studies || []).filter((s) => !s.seriesId), [studies])

  const chapterCounts = useMemo(() => {
    const counts = {}
    ;(studies || []).forEach((s) => {
      if (s.seriesId) counts[s.seriesId] = (counts[s.seriesId] || 0) + 1
    })
    return counts
  }, [studies])

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <Link to="/journal" className="font-label text-[11px] uppercase tracking-label text-deep-indigo">
        ← Back to Journal
      </Link>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink-black">Study Series</h1>
        <Link to="/series/new" className="shrink-0 font-label text-[11px] uppercase tracking-label text-deep-indigo">
          + New series
        </Link>
      </div>
      <p className="mt-1 font-body text-xs text-black/60">
        Deep, multi-chapter studies — organised like a book you can read straight through or dig into.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {series === null && <p className="font-body text-sm text-black/50">Loading…</p>}
        {series?.length === 0 && (
          <p className="font-body text-sm text-black/40">No study series yet — start one above.</p>
        )}
        {series?.map((s) => (
          <Link
            key={s.id}
            to={`/series/${s.id}`}
            className="flex items-center gap-3 rounded-card border border-black/10 bg-pure-white px-4 py-3"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-card bg-warm-sand">
              {s.imageUrl ? (
                <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <BotanicalSprig className="h-7 w-7 opacity-50" color="var(--color-deep-indigo)" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-medium text-ink-black">{s.title}</p>
              <p className="mt-0.5 font-body text-xs text-black/50">
                {chapterCounts[s.id] || 0} chapter{(chapterCounts[s.id] || 0) === 1 ? '' : 's'}
                {s.theme ? ` · ${s.theme}` : ''}
              </p>
            </div>
            <span className="shrink-0 text-black/30">›</span>
          </Link>
        ))}
      </div>

      {standalone.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold text-ink-black">Standalone studies</h2>
          <div className="mt-3 flex flex-col gap-3">
            {standalone.map((entry) => (
              <Link
                key={entry.id}
                to={`/journal/${entry.id}`}
                className="flex items-center gap-3 rounded-card border border-black/10 bg-pure-white px-4 py-3"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-[#d2b68c33]">
                  <StudyIcon color="#234386" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-medium text-ink-black">{entry.title}</p>
                  <p className="mt-0.5 font-body text-xs text-black/50">
                    Standalone study · {formatEntryDate(entry.entryDate)}
                  </p>
                </div>
                <span className="shrink-0 text-black/30">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
