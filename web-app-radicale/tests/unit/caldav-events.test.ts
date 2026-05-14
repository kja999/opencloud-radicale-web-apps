import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { EventFormData, CalendarEvent } from '../../src/types/calendar'

vi.mock('../../src/caldav/auth', () => ({
  authenticatedFetch: vi.fn()
}))

import { authenticatedFetch } from '../../src/caldav/auth'
import {
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventOccurrence,
  updateEventSeries
} from '../../src/caldav/events'
import { AuthenticationError, NotFoundError, ConflictError } from '../../src/caldav/errors'

const mockFetch = authenticatedFetch as unknown as ReturnType<typeof vi.fn>

describe('CalDAV Events CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createEvent', () => {
    it('creates event with correct ICS structure', async () => {
      const formData: EventFormData = {
        summary: 'Test Event',
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        allDay: false,
        calendarHref: '/calendars/user/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 201,
        headers: { get: () => '"etag123"' },
        ok: true
      } as Response)

      const result = await createEvent(formData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\.ics$/),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'text/calendar; charset=utf-8',
            'If-None-Match': '*'
          })
        })
      )
      expect(result.summary).toBe('Test Event')
      expect(result.etag).toBe('etag123')
    })

    it('creates all-day event with DATE format', async () => {
      const formData: EventFormData = {
        summary: 'All Day Event',
        start: new Date('2024-01-15'),
        end: new Date('2024-01-16'),
        allDay: true,
        calendarHref: '/calendars/user/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 201,
        headers: { get: () => '"etag456"' },
        ok: true
      } as Response)

      const result = await createEvent(formData)

      const callArgs = mockFetch.mock.calls[0]
      const icsBody = callArgs[1].body as string
      expect(icsBody).toContain('DTSTART;VALUE=DATE:20240115')
      expect(icsBody).toContain('DTEND;VALUE=DATE:20240116')
      expect(result.allDay).toBe(true)
    })

    it('throws AuthenticationError on 401', async () => {
      const formData: EventFormData = {
        summary: 'Test',
        start: new Date(),
        end: new Date(),
        allDay: false,
        calendarHref: '/cal/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 401
      } as Response)

      await expect(createEvent(formData)).rejects.toThrow(AuthenticationError)
    })

    it('throws ConflictError on 412 (event exists)', async () => {
      const formData: EventFormData = {
        summary: 'Test',
        start: new Date(),
        end: new Date(),
        allDay: false,
        calendarHref: '/cal/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 412
      } as Response)

      await expect(createEvent(formData)).rejects.toThrow(ConflictError)
    })
  })

  describe('updateEvent', () => {
    it('sends correct headers with If-Match', async () => {
      const existingEvent = {
        uid: 'event-123',
        calendarHref: '/cal/',
        href: '/cal/event-123.ics',
        etag: 'etag-original',
        summary: 'Old Title',
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        allDay: false,
        isRecurring: false
      }

      const formData: EventFormData = {
        summary: 'New Title',
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        allDay: false,
        calendarHref: '/cal/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 204,
        headers: { get: () => '"new-etag"' },
        ok: true
      } as Response)

      const result = await updateEvent(existingEvent as CalendarEvent, formData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/cal/event-123.ics',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'If-Match': '"etag-original"'
          })
        })
      )
      expect(result.etag).toBe('new-etag')
      expect(result.summary).toBe('New Title')
    })

    it('throws NotFoundError on 404', async () => {
      const existingEvent = {
        uid: 'event-123',
        calendarHref: '/cal/',
        href: '/cal/event-123.ics',
        etag: 'etag-original',
        summary: 'Test',
        start: new Date(),
        end: new Date(),
        allDay: false,
        isRecurring: false
      }

      mockFetch.mockResolvedValueOnce({
        status: 404
      } as Response)

      await expect(
        updateEvent(existingEvent as CalendarEvent, {
          summary: 'Test',
          start: new Date(),
          end: new Date(),
          allDay: false,
          calendarHref: '/cal/'
        })
      ).rejects.toThrow(NotFoundError)
    })

    it('throws ConflictError on 412 (etag mismatch)', async () => {
      const existingEvent = {
        uid: 'event-123',
        calendarHref: '/cal/',
        href: '/cal/event-123.ics',
        etag: 'old-etag',
        summary: 'Test',
        start: new Date(),
        end: new Date(),
        allDay: false,
        isRecurring: false
      }

      mockFetch.mockResolvedValueOnce({
        status: 412
      } as Response)

      await expect(
        updateEvent(existingEvent as CalendarEvent, {
          summary: 'Test',
          start: new Date(),
          end: new Date(),
          allDay: false,
          calendarHref: '/cal/'
        })
      ).rejects.toThrow(ConflictError)
    })
  })

  describe('deleteEvent', () => {
    it('sends DELETE with correct etag', async () => {
      const existingEvent = {
        uid: 'event-123',
        calendarHref: '/cal/',
        href: '/cal/event-123.ics',
        etag: 'etag-to-delete',
        summary: 'Test',
        start: new Date(),
        end: new Date(),
        allDay: false,
        isRecurring: false
      }

      mockFetch.mockResolvedValueOnce({
        status: 204,
        ok: true
      } as Response)

      await deleteEvent(existingEvent as CalendarEvent)

      expect(mockFetch).toHaveBeenCalledWith(
        '/cal/event-123.ics',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'If-Match': '"etag-to-delete"'
          })
        })
      )
    })

    it('handles 404 gracefully (already deleted)', async () => {
      const existingEvent = {
        uid: 'event-123',
        calendarHref: '/cal/',
        href: '/cal/event-123.ics',
        etag: 'etag',
        summary: 'Test',
        start: new Date(),
        end: new Date(),
        allDay: false,
        isRecurring: false
      }

      mockFetch.mockResolvedValueOnce({
        status: 404
      } as Response)

      await expect(deleteEvent(existingEvent as CalendarEvent)).resolves.toBeUndefined()
    })
  })

  describe('updateEventOccurrence', () => {
    it('sends PUT request with If-Match for occurrence update', async () => {
      const existingEvent = {
        uid: 'event-123',
        calendarHref: '/cal/',
        href: '/cal/event-123.ics',
        etag: 'etag-original',
        summary: 'Recurring Event',
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        allDay: false,
        isRecurring: true,
        icsData:
          'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:event-123\r\nRRULE:FREQ=WEEKLY\r\nDTSTART:20240115T100000\r\nDTEND:20240115T110000\r\nSUMMARY:Weekly Event\r\nEND:VEVENT\r\nEND:VCALENDAR'
      }

      const formData: EventFormData = {
        summary: 'Modified Occurrence',
        start: new Date('2024-01-22T10:00:00'),
        end: new Date('2024-01-22T11:00:00'),
        allDay: false,
        calendarHref: '/cal/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 204,
        ok: true
      } as Response)

      await updateEventOccurrence(existingEvent as CalendarEvent, '20240122T100000', formData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/cal/event-123.ics',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'If-Match': '"etag-original"'
          })
        })
      )
    })
  })

  describe('updateEventSeries', () => {
    it('updates all events in series', async () => {
      const existingEvent = {
        uid: 'event-123',
        calendarHref: '/cal/',
        href: '/cal/event-123.ics',
        etag: 'etag-original',
        summary: 'Recurring Event',
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        allDay: false,
        isRecurring: true,
        icsData: 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:event-123\r\nRRULE:FREQ=WEEKLY\r\nEND:VEVENT\r\nEND:VCALENDAR'
      }

      const formData: EventFormData = {
        summary: 'Updated Series Title',
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        allDay: false,
        calendarHref: '/cal/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 204,
        ok: true
      } as Response)

      await updateEventSeries(existingEvent as CalendarEvent, formData)

      const callArgs = mockFetch.mock.calls[0]
      const icsBody = callArgs[1].body as string
      expect(icsBody).toContain('SUMMARY:Updated Series Title')
    })
  })
})
