import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EVENT_CATEGORIES } from '../lib/calendar'
import {
  MONTH_NAMES,
  WEEKDAY_LABELS,
  dateKey,
  formatWeekRange,
  getMonthMatrix,
  getWeekRow,
  todayKey,
} from '../lib/calendarUtils'
import { listCalendarEvents } from '../lib/db'

const VIEWS = ['day', 'week', 'month']

export function Calendar() {
  const [cursor, setCursor] = useState(() => new Date())
  const [view, setView] = useState('month')
  const [events, setEvents] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear())

  useEffect(() => {
    listCalendarEvents().then(setEvents)
  }, [])

  const today = todayKey()

  const weeks = useMemo(() => getMonthMatrix(cursor.getFullYear(), cursor.getMonth()), [cursor])
  const weekRow = useMemo(() => getWeekRow(cursor), [cursor])

  function eventsForDay(key) {
    return events.filter((e) => key >= e.startDate && key <= e.endDate)
  }

  function categoriesForDay(key) {
    const ids = new Set(eventsForDay(key).map((e) => e.category))
    return EVENT_CATEGORIES.filter((c) => ids.has(c.id))
  }

  function shift(delta) {
    setCursor((d) => {
      const next = new Date(d)
      if (view === 'month') {
        next.setDate(1)
        next.setMonth(next.getMonth() + delta)
      } else if (view === 'week') {
        next.setDate(next.getDate() + delta * 7)
      } else {
        next.setDate(next.getDate() + delta)
      }
      return next
    })
  }

  function togglePicker() {
    setPickerYear(cursor.getFullYear())
    setPickerOpen((o) => !o)
  }

  function goToday() {
    setCursor(new Date())
    setPickerOpen(false)
  }

  function pickMonth(monthIndex) {
    setCursor(new Date(pickerYear, monthIndex, 1))
    setPickerOpen(false)
  }

  const headerLabel =
    view === 'month'
      ? `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`
      : view === 'week'
        ? formatWeekRange(weekRow)
        : `${MONTH_NAMES[cursor.getMonth()].slice(0, 3)} ${cursor.getDate()}`

  const cursorKey = dateKey(cursor)
  const dayEvents = events
    .filter((e) => cursorKey >= e.startDate && cursorKey <= e.endDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  const isViewingToday =
    view === 'day'
      ? cursorKey === today
      : view === 'week'
        ? weekRow.some((d) => dateKey(d) === today)
        : cursor.getFullYear() === new Date().getFullYear() && cursor.getMonth() === new Date().getMonth()

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border border-black/10 bg-pure-white font-display text-sm text-deep-indigo"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border border-black/10 bg-pure-white font-display text-sm text-deep-indigo"
          >
            ›
          </button>
          <button
            type="button"
            onClick={togglePicker}
            className="min-w-0 truncate pl-1 font-display text-[15px] font-semibold text-ink-black"
          >
            {headerLabel}
          </button>
          {!isViewingToday && (
            <button
              type="button"
              onClick={goToday}
              className="shrink-0 font-label text-[10px] uppercase tracking-label text-deep-indigo"
            >
              Today
            </button>
          )}
        </div>

        <div className="flex shrink-0 rounded-pill border border-black/10 bg-pure-white p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-pill px-3 py-1.5 font-label text-[9px] uppercase tracking-label transition-colors ${
                view === v ? 'bg-deep-indigo text-pure-white' : 'text-deep-indigo'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {pickerOpen && (
        <div className="mt-3 rounded-card border border-black/10 bg-cream-paper p-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPickerYear((y) => y - 1)}
              aria-label="Previous year"
              className="flex h-7 w-7 items-center justify-center rounded-pill bg-pure-white font-display text-deep-indigo"
            >
              ‹
            </button>
            <p className="font-display text-lg text-deep-indigo">{pickerYear}</p>
            <button
              type="button"
              onClick={() => setPickerYear((y) => y + 1)}
              aria-label="Next year"
              className="flex h-7 w-7 items-center justify-center rounded-pill bg-pure-white font-display text-deep-indigo"
            >
              ›
            </button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {MONTH_NAMES.map((name, i) => {
              const selected = pickerYear === cursor.getFullYear() && i === cursor.getMonth()
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => pickMonth(i)}
                  className={`rounded-card py-2 font-label text-[10px] uppercase tracking-label ${
                    selected ? 'bg-deep-indigo text-pure-white' : 'bg-pure-white text-deep-indigo'
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {view === 'month' && (
        <>
          <div className="mt-8 grid grid-cols-7">
            {WEEKDAY_LABELS.map((w, i) => (
              <span key={i} className="text-center font-label text-[10px] uppercase tracking-label text-black/40">
                {w}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {weeks.map((week, weekIndex) => {
              // A week with nothing in it at all shouldn't reserve the same
              // dot/title space a busy week needs — that's what was reading
              // as a gap: Sep 27–Oct 3 sat at full height with nothing to
              // show in it, pushing the next row down for no reason.
              const weekHasEvents = week.some((date) => eventsForDay(dateKey(date)).length > 0)
              return (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((date) => {
                    const key = dateKey(date)
                    const inMonth = date.getMonth() === cursor.getMonth()
                    const cats = categoriesForDay(key)
                    const dayEvts = eventsForDay(key)
                    const isToday = key === today
                    return (
                      <Link
                        key={key}
                        to={`/calendar/${key}`}
                        className={`flex ${weekHasEvents ? 'min-h-[64px]' : 'min-h-[40px]'} flex-col items-center gap-0.5 rounded-card px-0.5 pt-1.5 ${
                          isToday ? 'bg-deep-indigo text-pure-white' : inMonth ? 'text-black/80' : 'text-black/25'
                        }`}
                      >
                        <span className="font-body text-xs">{date.getDate()}</span>
                        {weekHasEvents && (
                          <>
                            <span className="flex h-1 items-center gap-0.5">
                              {cats.slice(0, 3).map((c) => (
                                <span
                                  key={c.id}
                                  className="h-1 w-1 rounded-full"
                                  style={{ backgroundColor: isToday ? '#ffffff' : c.hex }}
                                />
                              ))}
                            </span>
                            <span className="flex h-4 w-full flex-col items-stretch gap-px">
                              {dayEvts.length > 0 && (
                                <>
                                  {dayEvts.slice(0, 2).map((e) => (
                                    <span
                                      key={e.id}
                                      className={`truncate text-center font-label text-[6px] leading-tight ${
                                        isToday ? 'text-pure-white/80' : 'text-black/45'
                                      }`}
                                    >
                                      {e.title}
                                    </span>
                                  ))}
                                  {dayEvts.length > 2 && (
                                    <span
                                      className={`text-center font-label text-[6px] leading-tight ${
                                        isToday ? 'text-pure-white/70' : 'text-black/35'
                                      }`}
                                    >
                                      +{dayEvts.length - 2}
                                    </span>
                                  )}
                                </>
                              )}
                            </span>
                          </>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </>
      )}

      {view === 'week' && (
        <div className="mt-8 grid grid-cols-7 gap-1">
          {weekRow.map((date) => {
            const key = dateKey(date)
            const isToday = key === today
            const dayEvts = events
              .filter((e) => key >= e.startDate && key <= e.endDate)
              .sort((a, b) => a.startDate.localeCompare(b.startDate))
            return (
              <Link
                key={key}
                to={`/calendar/${key}`}
                className={`flex flex-col items-center gap-1 rounded-card px-0.5 py-2 ${isToday ? 'bg-mist' : ''}`}
              >
                <span className="font-label text-[9px] uppercase tracking-label text-black/40">
                  {WEEKDAY_LABELS[date.getDay()]}
                </span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-display text-xs ${
                    isToday ? 'bg-deep-indigo text-pure-white' : 'text-ink-black'
                  }`}
                >
                  {date.getDate()}
                </span>
                <span className="flex w-full flex-col items-stretch gap-0.5">
                  {dayEvts.slice(0, 2).map((e) => {
                    const cat = EVENT_CATEGORIES.find((c) => c.id === e.category)
                    return (
                      <span
                        key={e.id}
                        className="truncate rounded-[3px] px-0.5 py-[1px] text-center font-label text-[7px] leading-tight text-ink-black"
                        style={{ backgroundColor: `${cat?.hex}33` }}
                      >
                        {e.title}
                      </span>
                    )
                  })}
                  {dayEvts.length > 2 && (
                    <span className="text-center font-label text-[7px] leading-tight text-black/40">
                      +{dayEvts.length - 2}
                    </span>
                  )}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {view === 'day' && (
        <div className="mt-8">
          <div className="flex flex-col gap-2">
            {dayEvents.length === 0 && (
              <p className="font-body text-sm text-black/50">Nothing planned for this day.</p>
            )}
            {dayEvents.map((e) => {
              const cat = EVENT_CATEGORIES.find((c) => c.id === e.category)
              return (
                <Link
                  key={e.id}
                  to={`/events/${e.id}`}
                  className="flex items-start gap-2 rounded-card border border-black/10 bg-pure-white px-3 py-2"
                >
                  {e.startTime && (
                    <span className="w-12 shrink-0 pt-0.5 font-label text-[10px] uppercase tracking-label text-black/40">
                      {e.startTime}
                    </span>
                  )}
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cat?.hex }} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-medium text-ink-black">{e.title}</p>
                    {e.notes && <p className="truncate font-body text-xs text-black/60">{e.notes}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
