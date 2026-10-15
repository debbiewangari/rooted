import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EVENT_CATEGORIES } from '../lib/calendar'
import {
  MONTH_NAMES,
  WEEKDAY_LABELS,
  dateKey,
  formatHeaderDate,
  formatWeekRange,
  getMonthMatrix,
  getWeekRow,
  todayKey,
} from '../lib/calendarUtils'
import { listCalendarEvents } from '../lib/db'

const VIEWS = ['month', 'week', 'day']

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

  function categoriesForDay(key) {
    const ids = new Set(events.filter((e) => key >= e.startDate && key <= e.endDate).map((e) => e.category))
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

  function pickMonth(monthIndex) {
    setCursor(new Date(pickerYear, monthIndex, 1))
    setPickerOpen(false)
  }

  const headerLabel =
    view === 'month'
      ? `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`
      : view === 'week'
        ? formatWeekRange(weekRow)
        : formatHeaderDate(cursor)

  const cursorKey = dateKey(cursor)
  const dayEvents = events
    .filter((e) => cursorKey >= e.startDate && cursorKey <= e.endDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Previous"
          className="flex h-8 w-8 items-center justify-center rounded-pill border border-black/10 bg-pure-white font-display text-lg text-deep-indigo"
        >
          ‹
        </button>
        <button type="button" onClick={togglePicker} className="font-display text-xl uppercase text-deep-indigo">
          {headerLabel}
        </button>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next"
          className="flex h-8 w-8 items-center justify-center rounded-pill border border-black/10 bg-pure-white font-display text-lg text-deep-indigo"
        >
          ›
        </button>
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

      <div className="mt-3 flex rounded-pill border border-black/10 bg-pure-white p-1">
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`flex-1 rounded-pill py-1.5 font-label text-[10px] uppercase tracking-label transition-colors ${
              view === v ? 'bg-deep-indigo text-pure-white' : 'text-deep-indigo'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'month' && (
        <>
          <div className="mt-3 grid grid-cols-7">
            {WEEKDAY_LABELS.map((w, i) => (
              <span key={i} className="text-center font-label text-[10px] uppercase tracking-label text-black/40">
                {w}
              </span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {weeks.flat().map((date) => {
              const key = dateKey(date)
              const inMonth = date.getMonth() === cursor.getMonth()
              const cats = categoriesForDay(key)
              const isToday = key === today
              return (
                <Link
                  key={key}
                  to={`/calendar/${key}`}
                  className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-card ${
                    isToday ? 'bg-deep-indigo text-pure-white' : inMonth ? 'text-black/80' : 'text-black/25'
                  }`}
                >
                  <span className="font-body text-xs">{date.getDate()}</span>
                  {cats.length > 0 && (
                    <span className="flex gap-0.5">
                      {cats.slice(0, 3).map((c) => (
                        <span
                          key={c.id}
                          className="h-1 w-1 rounded-full"
                          style={{ backgroundColor: isToday ? '#ffffff' : c.hex }}
                        />
                      ))}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </>
      )}

      {view === 'week' && (
        <div className="mt-3 grid grid-cols-7 gap-1">
          {weekRow.map((date) => {
            const key = dateKey(date)
            const cats = categoriesForDay(key)
            const isToday = key === today
            return (
              <Link
                key={key}
                to={`/calendar/${key}`}
                className={`flex flex-col items-center gap-1 rounded-card py-2 ${
                  isToday ? 'bg-deep-indigo text-pure-white' : 'text-black/80'
                }`}
              >
                <span className="font-label text-[9px] uppercase tracking-label opacity-60">
                  {WEEKDAY_LABELS[date.getDay()]}
                </span>
                <span className="font-display text-base">{date.getDate()}</span>
                <span className="flex h-1.5 gap-0.5">
                  {cats.slice(0, 3).map((c) => (
                    <span
                      key={c.id}
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: isToday ? '#ffffff' : c.hex }}
                    />
                  ))}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {view === 'day' && (
        <div className="mt-4">
          <div className="flex flex-col gap-2">
            {dayEvents.length === 0 && (
              <p className="font-body text-sm text-black/50">Nothing planned for this day.</p>
            )}
            {dayEvents.map((e) => {
              const cat = EVENT_CATEGORIES.find((c) => c.id === e.category)
              return (
                <div key={e.id} className="flex items-start gap-2 rounded-card border border-black/10 bg-pure-white px-3 py-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cat?.hex }} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm text-deep-indigo">{e.title}</p>
                    {e.notes && <p className="truncate font-body text-xs text-black/60">{e.notes}</p>}
                  </div>
                </div>
              )
            })}
          </div>
          <Link
            to={`/calendar/${cursorKey}`}
            className="mt-3 inline-block font-label text-[11px] uppercase tracking-label text-burnt-orange"
          >
            + Add / manage day →
          </Link>
        </div>
      )}
    </div>
  )
}
