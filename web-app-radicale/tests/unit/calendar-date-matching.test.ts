import type { CalendarEvent } from '../../src/types/calendar'

function getEventsForDate(
  date: Date,
  events: CalendarEvent[],
  calendars: Array<{ href: string; visible: boolean }>
): CalendarEvent[] {
  const visibleCalendars = calendars.filter(c => c.visible)
  const dateMs = date.getTime()
  return events
    .filter(e => visibleCalendars.some(c => c.href === e.calendarHref))
    .filter(e => {
      if (e.allDay) {
        return dateMs >= e.start.getTime() && dateMs < e.end.getTime()
      }
      return date.toDateString() === e.start.toDateString()
    })
}

describe('getEventsForDate', () => {
  const baseCalendar = { href: '/cal/', displayName: 'Test', visible: true, color: '#000' }

  const mayEvent: CalendarEvent = {
    uid: 'may',
    calendarHref: '/cal/',
    href: '/cal/may.ics',
    etag: '1',
    summary: 'May Event',
    start: new Date(Date.UTC(2026, 4, 15)),
    end: new Date(Date.UTC(2026, 4, 16)),
    allDay: true,
    isRecurring: false
  }

  const juneEvent: CalendarEvent = {
    uid: 'june',
    calendarHref: '/cal/',
    href: '/cal/june.ics',
    etag: '1',
    summary: 'June Event',
    start: new Date(Date.UTC(2026, 5, 1)),
    end: new Date(Date.UTC(2026, 5, 2)),
    allDay: true,
    isRecurring: false
  }

  const multiDayEvent: CalendarEvent = {
    uid: 'multiday',
    calendarHref: '/cal/',
    href: '/cal/multi.ics',
    etag: '1',
    summary: 'Multi Day',
    start: new Date(Date.UTC(2026, 4, 10)),
    end: new Date(Date.UTC(2026, 4, 13)),
    allDay: true,
    isRecurring: false
  }

  const timedEvent: CalendarEvent = {
    uid: 'timed',
    calendarHref: '/cal/',
    href: '/cal/timed.ics',
    etag: '1',
    summary: 'Timed Event',
    start: new Date(Date.UTC(2026, 4, 15, 14, 0)),
    end: new Date(Date.UTC(2026, 4, 15, 15, 0)),
    allDay: false,
    isRecurring: false
  }

  it('matches all-day event on its start date', () => {
    const date = new Date(Date.UTC(2026, 4, 15))
    const result = getEventsForDate(date, [mayEvent], [baseCalendar])
    expect(result.map(e => e.summary)).toContain('May Event')
  })

  it('does not match all-day event on a different date', () => {
    const date = new Date(Date.UTC(2026, 5, 6))
    const result = getEventsForDate(date, [mayEvent], [baseCalendar])
    expect(result).toHaveLength(0)
  })

  it('does not match June event in May', () => {
    const date = new Date(Date.UTC(2026, 4, 20))
    const result = getEventsForDate(date, [juneEvent], [baseCalendar])
    expect(result).toHaveLength(0)
  })

  it('matches all-day event on every day within its range', () => {
    const dates = [new Date(Date.UTC(2026, 4, 10)), new Date(Date.UTC(2026, 4, 11)), new Date(Date.UTC(2026, 4, 12))]
    for (const date of dates) {
      const result = getEventsForDate(date, [multiDayEvent], [baseCalendar])
      expect(result.map(e => e.summary)).toContain('Multi Day')
    }
  })

  it('does not match all-day event on the exclusive end date', () => {
    const date = new Date(Date.UTC(2026, 4, 13))
    const result = getEventsForDate(date, [multiDayEvent], [baseCalendar])
    expect(result).toHaveLength(0)
  })

  it('matches timed event only on its exact date', () => {
    const matchDate = new Date(Date.UTC(2026, 4, 15, 10, 0))
    const noMatchDate = new Date(Date.UTC(2026, 4, 16, 10, 0))
    expect(getEventsForDate(matchDate, [timedEvent], [baseCalendar]).length).toBe(1)
    expect(getEventsForDate(noMatchDate, [timedEvent], [baseCalendar]).length).toBe(0)
  })

  it('does not match hidden calendar events', () => {
    const hiddenCal = { ...baseCalendar, visible: false }
    const date = new Date(Date.UTC(2026, 4, 15))
    const result = getEventsForDate(date, [mayEvent], [hiddenCal])
    expect(result).toHaveLength(0)
  })
})
