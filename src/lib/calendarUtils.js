export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function dateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayKey() {
  return dateKey(new Date())
}

// Always 6 weeks (42 days) so the grid height never shifts between months.
export function getMonthMatrix(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const start = new Date(year, month, 1 - firstOfMonth.getDay())
  const weeks = []
  const cursor = new Date(start)
  for (let w = 0; w < 6; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

export function formatLongDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function monthAbbr(monthIndex) {
  return MONTH_NAMES[monthIndex].slice(0, 3)
}

export function getWeekRow(date) {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

export function formatWeekRange(days) {
  const start = days[0]
  const end = days[days.length - 1]
  if (start.getFullYear() !== end.getFullYear()) {
    return `${monthAbbr(start.getMonth())} ${start.getDate()}, ${start.getFullYear()} – ${monthAbbr(end.getMonth())} ${end.getDate()}, ${end.getFullYear()}`
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${monthAbbr(start.getMonth())} ${start.getDate()} – ${monthAbbr(end.getMonth())} ${end.getDate()}, ${end.getFullYear()}`
  }
  return `${monthAbbr(start.getMonth())} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`
}

export function formatHeaderDate(date) {
  return `${monthAbbr(date.getMonth())} ${date.getDate()}, ${date.getFullYear()}`
}

export function formatShortDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return `${monthAbbr(m - 1)} ${d}`
}

export function formatShortRange(startKey, endKey) {
  if (startKey === endKey) return formatShortDate(startKey)
  const startMonth = startKey.slice(0, 7)
  const endMonth = endKey.slice(0, 7)
  if (startMonth === endMonth) {
    const endDay = Number(endKey.slice(8, 10))
    return `${formatShortDate(startKey)}–${endDay}`
  }
  return `${formatShortDate(startKey)} – ${formatShortDate(endKey)}`
}

// Inclusive list of date keys from startKey to endKey, used to break a
// multi-day event into its Day 1..N sequence.
export function enumerateDates(startKey, endKey) {
  const [sy, sm, sd] = startKey.split('-').map(Number)
  const [ey, em, ed] = endKey.split('-').map(Number)
  const cursor = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  const dates = []
  while (cursor <= end) {
    dates.push(dateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

// Where an event stands today: upcoming / ongoing / completed, which day
// that is, and what date a "continue" CTA should land on.
export function getEventProgress(event) {
  const dates = enumerateDates(event.startDate, event.endDate)
  const totalDays = dates.length
  const today = todayKey()

  if (today < event.startDate) {
    return { status: 'upcoming', dayIndex: 0, totalDays, percent: 0, currentDate: dates[0] }
  }
  if (today > event.endDate) {
    return { status: 'completed', dayIndex: totalDays, totalDays, percent: 100, currentDate: dates[totalDays - 1] }
  }
  const idx = dates.indexOf(today)
  return {
    status: 'ongoing',
    dayIndex: idx + 1,
    totalDays,
    percent: Math.round(((idx + 1) / totalDays) * 100),
    currentDate: today,
  }
}
