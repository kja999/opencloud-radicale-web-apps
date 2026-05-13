import { describe, it, expect } from 'vitest'
import { generateICS, generateUID, parseICS, addExceptionToICS, updateSeriesICS } from '../../src/caldav/ics-utils'
import type { EventFormData, DateRange } from '../../src/types/calendar'

describe('ics-utils', () => {
  describe('generateUID', () => {
    it('generates a unique ID', () => {
      const uid1 = generateUID()
      const uid2 = generateUID()
      expect(uid1).not.toBe(uid2)
      expect(uid1).toContain('@radicale')
    })
  })

  describe('generateICS', () => {
    it('generates a valid iCalendar for all-day event', () => {
      const formData: EventFormData = {
        summary: 'Test Event',
        start: new Date('2024-01-15'),
        end: new Date('2024-01-16'),
        allDay: true,
        calendarHref: '/calendars/user/',
        uid: 'test-uid'
      }

      const ics = generateICS(formData)

      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('VERSION:2.0')
      expect(ics).toContain('DTSTART;VALUE=DATE:20240115')
      expect(ics).toContain('DTEND;VALUE=DATE:20240116')
      expect(ics).toContain('SUMMARY:Test Event')
      expect(ics).toContain('UID:test-uid')
      expect(ics).toContain('END:VCALENDAR')
    })

    it('generates a valid iCalendar for timed event', () => {
      const formData: EventFormData = {
        summary: 'Meeting',
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        allDay: false,
        calendarHref: '/calendars/user/',
        description: 'Important meeting',
        location: 'Conference Room'
      }

      const ics = generateICS(formData)

      expect(ics).toContain('DTSTART:20240115T100000')
      expect(ics).toContain('DTEND:20240115T110000')
      expect(ics).toContain('SUMMARY:Meeting')
      expect(ics).toContain('DESCRIPTION:Important meeting')
      expect(ics).toContain('LOCATION:Conference Room')
    })

    it('escapes special characters in text', () => {
      const formData: EventFormData = {
        summary: 'Test; with, special\nchars',
        start: new Date('2024-01-15'),
        end: new Date('2024-01-16'),
        allDay: true,
        calendarHref: '/calendars/user/'
      }

      const ics = generateICS(formData)

      expect(ics).toContain('SUMMARY:Test\\; with\\, special\\nchars')
    })

    it('generates ICS with recurrence rule (WEEKLY)', () => {
      const formData: EventFormData = {
        summary: 'Weekly Meeting',
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        allDay: false,
        calendarHref: '/calendars/user/',
        recurrence: {
          freq: 'WEEKLY',
          interval: 1,
          byDay: ['MO', 'WE', 'FR']
        }
      }

      const ics = generateICS(formData)

      expect(ics).toContain('RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR')
    })

    it('generates ICS with recurrence rule (MONTHLY) with until', () => {
      const formData: EventFormData = {
        summary: 'Monthly Event',
        start: new Date('2024-01-15'),
        end: new Date('2024-01-16'),
        allDay: true,
        calendarHref: '/calendars/user/',
        recurrence: {
          freq: 'MONTHLY',
          until: new Date('2024-12-31T23:59:59Z')
        }
      }

      const ics = generateICS(formData)

      expect(ics).toContain('RRULE:FREQ=MONTHLY;UNTIL=20241231T235959')
    })

    it('generates ICS with recurrence rule with count', () => {
      const formData: EventFormData = {
        summary: 'Limited Event',
        start: new Date('2024-01-15'),
        end: new Date('2024-01-16'),
        allDay: true,
        calendarHref: '/calendars/user/',
        recurrence: {
          freq: 'DAILY',
          count: 10
        }
      }

      const ics = generateICS(formData)

      expect(ics).toContain('RRULE:FREQ=DAILY;COUNT=10')
    })
  })

  describe('parseICS', () => {
    it('parses a simple event', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
DTSTART;VALUE=DATE:20240115
DTEND;VALUE=DATE:20240116
SUMMARY:Test Event
UID:test-event-123
DESCRIPTION:Description here
LOCATION:Location here
END:VEVENT
END:VCALENDAR`

      const range: DateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      }

      const events = parseICS(icsData, '/calendars/user/test-event-123.ics', 'etag-123', range)

      expect(events).toHaveLength(1)
      expect(events[0].summary).toBe('Test Event')
      expect(events[0].uid).toBe('test-event-123')
      expect(events[0].description).toBe('Description here')
      expect(events[0].location).toBe('Location here')
    })

    it('parses all-day event', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20240115
DTEND;VALUE=DATE:20240116
SUMMARY:All Day Event
UID:allday-event
END:VEVENT
END:VCALENDAR`

      const range: DateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      }

      const events = parseICS(icsData, '/calendars/user/allday.ics', 'etag-1', range)

      expect(events).toHaveLength(1)
      expect(events[0].summary).toBe('All Day Event')
    })

    it('parses event with recurrence rule', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20240115
DTEND;VALUE=DATE:20240116
SUMMARY:Recurring Event
UID:recurring-event
RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE
END:VEVENT
END:VCALENDAR`

      const range: DateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      }

      const events = parseICS(icsData, '/calendars/user/recurring.ics', 'etag-2', range)

      expect(events).toHaveLength(1)
      expect(events[0].summary).toBe('Recurring Event')
    })

    it('returns empty array for invalid ICS data', () => {
      const range: DateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      }

      expect(parseICS('invalid', '/test.ics', 'etag', range)).toEqual([])
      expect(parseICS('', '/test.ics', 'etag', range)).toEqual([])
    })

    it('parses event with byMonthDay recurrence', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20240101
DTEND;VALUE=DATE:20240102
SUMMARY:Monthly Day Event
UID:monthly-day-event
RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15
END:VEVENT
END:VCALENDAR`

      const range: DateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      }

      const events = parseICS(icsData, '/test.ics', 'etag', range)

      expect(events).toHaveLength(1)
      expect(events[0].summary).toBe('Monthly Day Event')
    })

    it('parses event with byMonth recurrence', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20240301
DTEND;VALUE=DATE:20240302
SUMMARY:Annual Event
UID:annual-event
RRULE:FREQ=YEARLY;BYMONTH=3
END:VEVENT
END:VCALENDAR`

      const range: DateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      }

      const events = parseICS(icsData, '/test.ics', 'etag', range)

      expect(events).toHaveLength(1)
      expect(events[0].summary).toBe('Annual Event')
    })
  })

  describe('addExceptionToICS', () => {
    it('returns original when VEVENT not found', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
END:VCALENDAR`

      const result = addExceptionToICS(icsData, '20240120T100000')

      expect(result).toBe(icsData)
    })

    it('returns original on parse error', () => {
      const result = addExceptionToICS('invalid', '20240120T100000')

      expect(result).toBe('invalid')
    })
  })

  describe('updateSeriesICS', () => {
    it('updates all properties of existing event', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20240115T100000
DTEND:20240115T110000
SUMMARY:Old Title
UID:test-event
DESCRIPTION:Old description
LOCATION:Old location
END:VEVENT
END:VCALENDAR`

      const formData: EventFormData = {
        summary: 'New Title',
        start: new Date('2024-02-20T09:00:00Z'),
        end: new Date('2024-02-20T10:00:00Z'),
        allDay: false,
        calendarHref: '/calendars/user/',
        description: 'New description',
        location: 'New location'
      }

      const result = updateSeriesICS(icsData, formData)

      expect(result).toContain('SUMMARY:New Title')
      expect(result).toContain('DESCRIPTION:New description')
      expect(result).toContain('LOCATION:New location')
    })

    it('removes description and location when not provided', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20240115T100000
DTEND:20240115T110000
SUMMARY:Event
UID:test-event
DESCRIPTION:To be removed
LOCATION:To be removed
END:VEVENT
END:VCALENDAR`

      const formData: EventFormData = {
        summary: 'Event',
        start: new Date('2024-01-15T10:00:00Z'),
        end: new Date('2024-01-15T11:00:00Z'),
        allDay: false,
        calendarHref: '/calendars/user/'
      }

      const result = updateSeriesICS(icsData, formData)

      expect(result).not.toContain('DESCRIPTION')
      expect(result).not.toContain('LOCATION')
    })

    it('returns original when VEVENT not found', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
END:VCALENDAR`

      const formData: EventFormData = {
        summary: 'Test',
        start: new Date(),
        end: new Date(),
        allDay: false,
        calendarHref: '/'
      }

      const result = updateSeriesICS(icsData, formData)

      expect(result).toBe(icsData)
    })

    it('returns original on parse error', () => {
      const formData: EventFormData = {
        summary: 'Test',
        start: new Date(),
        end: new Date(),
        allDay: false,
        calendarHref: '/'
      }

      const result = updateSeriesICS('invalid', formData)

      expect(result).toBe('invalid')
    })
  })
})
