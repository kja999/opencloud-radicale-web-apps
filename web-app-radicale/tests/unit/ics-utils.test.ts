import { describe, it, expect } from 'vitest'
import { generateICS, generateUID, parseICS, addExceptionToICS, updateSeriesICS } from '../../src/caldav/ics-utils'
import type { EventFormData, DateRange } from '../../src/types/calendar'

describe('ics-utils', () => {
  describe('generateUID', () => {
    it('generates a unique ID', () => {
      const uid1 = generateUID()
      const uid2 = generateUID()
      expect(uid1).not.toBe(uid2)
      expect(uid1).toContain('@webapp')
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

      expect(ics).toContain('RRULE:FREQ=MONTHLY;UNTIL=20241231')
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

    it('parses event with recurrence rule and expands occurrences', () => {
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
        end: new Date('2024-03-31')
      }

      const events = parseICS(icsData, '/calendars/user/recurring.ics', 'etag-2', range)

      expect(events.length).toBeGreaterThan(1)
      expect(events.every(e => e.summary === 'Recurring Event')).toBe(true)
      expect(events.every(e => e.isRecurring)).toBe(true)
    })

    it('returns empty array for invalid ICS data', () => {
      const range: DateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      }

      expect(parseICS('invalid', '/test.ics', 'etag', range)).toEqual([])
      expect(parseICS('', '/test.ics', 'etag', range)).toEqual([])
    })

    it('parses event with byMonthDay recurrence and expands occurrences', () => {
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
        end: new Date('2024-06-30')
      }

      const events = parseICS(icsData, '/test.ics', 'etag', range)

      expect(events.length).toBeGreaterThan(1)
      expect(events.every(e => e.summary === 'Monthly Day Event')).toBe(true)
    })

    it('parses event with infinite recurrence (no COUNT, no UNTIL) starting years ago', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20220115
DTEND;VALUE=DATE:20220116
SUMMARY:Infinite Weekly Event
UID:infinite-weekly-event
RRULE:FREQ=WEEKLY;BYDAY=MO
END:VEVENT
END:VCALENDAR`

      const range: DateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31')
      }

      const events = parseICS(icsData, '/test.ics', 'etag', range)

      expect(events.length).toBeGreaterThan(6)
      expect(events.every(e => e.summary === 'Infinite Weekly Event')).toBe(true)
      expect(events.every(e => e.isRecurring)).toBe(true)
      expect(events.length).toBe(13)
    })

    it('handles infinite recurrence with 6-month fetch range from years-ago start', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20200101
DTEND;VALUE=DATE:20200102
SUMMARY:Old Weekly Event
UID:old-weekly-event
RRULE:FREQ=WEEKLY;BYDAY=TU
END:VEVENT
END:VCALENDAR`

      const range: DateRange = {
        start: new Date('2024-04-01'),
        end: new Date('2024-09-30')
      }

      const events = parseICS(icsData, '/test.ics', 'etag', range)

      expect(events.length).toBeGreaterThan(6)
      console.log('Found events count:', events.length)
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

  describe('generateICS with color', () => {
    it('includes COLOR property when provided', () => {
      const formData: EventFormData = {
        summary: 'Colored Event',
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        allDay: false,
        calendarHref: '/cal/',
        color: '#F44336'
      }

      const ics = generateICS(formData)

      expect(ics).toContain('COLOR:#F44336')
    })

    it('does not include COLOR when not provided', () => {
      const formData: EventFormData = {
        summary: 'Normal Event',
        start: new Date('2024-01-15'),
        end: new Date('2024-01-16'),
        allDay: true,
        calendarHref: '/cal/'
      }

      const ics = generateICS(formData)

      expect(ics).not.toContain('COLOR:')
    })
  })

  describe('parseICS with color', () => {
    it('parses COLOR property from ICS', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20240115T100000
DTEND:20240115T110000
SUMMARY:Colored Event
UID:colored-event
COLOR:#E91E63
END:VEVENT
END:VCALENDAR`

      const range: DateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      }

      const events = parseICS(icsData, '/cal/colored-event.ics', 'etag-1', range)

      expect(events).toHaveLength(1)
      expect(events[0].color).toBe('#E91E63')
    })

    it('returns undefined color when not present', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20240115
DTEND;VALUE=DATE:20240116
SUMMARY:Plain Event
UID:plain-event
END:VEVENT
END:VCALENDAR`

      const range: DateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      }

      const events = parseICS(icsData, '/cal/plain-event.ics', 'etag-2', range)

      expect(events).toHaveLength(1)
      expect(events[0].color).toBeFalsy()
    })
  })

  describe('generateICS with recurrence', () => {
    it('generates RRULE with count', () => {
      const formData: EventFormData = {
        summary: 'Limited Event',
        start: new Date('2024-01-15'),
        end: new Date('2024-01-16'),
        allDay: true,
        calendarHref: '/cal/',
        recurrence: {
          freq: 'DAILY',
          count: 5
        }
      }

      const ics = generateICS(formData)

      expect(ics).toContain('RRULE:FREQ=DAILY;COUNT=5')
    })

    it('generates RRULE with until date', () => {
      const formData: EventFormData = {
        summary: 'Event Until',
        start: new Date('2024-01-15'),
        end: new Date('2024-01-16'),
        allDay: true,
        calendarHref: '/cal/',
        recurrence: {
          freq: 'WEEKLY',
          until: new Date('2024-03-15')
        }
      }

      const ics = generateICS(formData)

      expect(ics).toContain('RRULE:FREQ=WEEKLY;UNTIL=20240315')
    })

    it('omits interval when undefined', () => {
      const formData: EventFormData = {
        summary: 'Weekly Event',
        start: new Date('2024-01-15'),
        end: new Date('2024-01-16'),
        allDay: true,
        calendarHref: '/cal/',
        recurrence: {
          freq: 'WEEKLY'
        }
      }

      const ics = generateICS(formData)

      expect(ics).toContain('RRULE:FREQ=WEEKLY')
      expect(ics).not.toContain('INTERVAL')
    })
  })
})
