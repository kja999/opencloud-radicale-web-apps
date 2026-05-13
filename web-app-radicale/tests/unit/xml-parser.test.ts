import { describe, it, expect } from 'vitest'
import { parseCurrentUserPrincipal, parseCalendarHomeSet, parseCalendars, parseEvents } from '../../src/caldav/xml-parser'

describe('xml-parser', () => {
  describe('parseCurrentUserPrincipal', () => {
    it('parses current-user-principal from PROPFIND response', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/principals/users/testuser/</d:href>
    <d:propstat>
      <d:prop>
        <d:current-user-principal>
          <d:href>/principals/users/testuser/</d:href>
        </d:current-user-principal>
      </d:propstat>
    </d:response>
  </d:multistatus>`

      const principal = parseCurrentUserPrincipal(xml)
      expect(principal).toBe('/principals/users/testuser/')
    })

    it('returns null for invalid XML', () => {
      expect(parseCurrentUserPrincipal('invalid')).toBeNull()
      expect(parseCurrentUserPrincipal('')).toBeNull()
    })
  })

  describe('parseCalendars', () => {
    it('parses calendar collection from PROPFIND response', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/calendars/user/personal/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Personal</d:displayname>
        <d:resourcetype>
          <d:collection/>
          <c:calendar/>
        </d:resourcetype>
        <c:calendar-color>#3788d8</c:calendar-color>
        <c:ctag>abc123</c:ctag>
      </d:propstat>
    </d:response>
  </d:multistatus>`

      const calendars = parseCalendars(xml)
      expect(calendars).toHaveLength(1)
      expect(calendars[0].href).toBe('/calendars/user/personal/')
      expect(calendars[0].displayName).toBe('Personal')
      expect(calendars[0].color).toBe('#3788d8')
      expect(calendars[0].ctag).toBe('abc123')
    })

    it('returns empty array for invalid XML', () => {
      expect(parseCalendars('invalid')).toEqual([])
      expect(parseCalendars('')).toEqual([])
    })

    it('ignores non-calendar resources', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/some/folder/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Not a Calendar</d:displayname>
        <d:resourcetype>
          <d:collection/>
        </d:resourcetype>
      </d:propstat>
    </d:response>
  </d:multistatus>`

      const calendars = parseCalendars(xml)
      expect(calendars).toHaveLength(0)
    })
  })

  describe('parseCalendarHomeSet', () => {
    it('parses calendar-home-set from PROPFIND response', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/principals/users/testuser/</d:href>
    <d:propstat>
      <d:prop>
        <c:calendar-home-set>
          <d:href>/calendars/user/testuser/</d:href>
        </c:calendar-home-set>
      </d:propstat>
    </d:response>
  </d:multistatus>`

      const homeSet = parseCalendarHomeSet(xml)
      expect(homeSet).toBe('/calendars/user/testuser/')
    })

    it('returns null for invalid XML', () => {
      expect(parseCalendarHomeSet('invalid')).toBeNull()
      expect(parseCalendarHomeSet('')).toBeNull()
    })
  })

  describe('parseEvents', () => {
    it('parses calendar events from REPORT response', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/calendars/user/event1.ics</d:href>
    <d:propstat>
      <d:prop>
        <d:getetag>"abc123"</d:getetag>
        <c:calendar-data>BEGIN:VCALENDAR&#10;VERSION:2.0&#10;BEGIN:VEVENT&#10;DTSTART:20240115T100000&#10;DTEND:20240115T110000&#10;SUMMARY:Test Event&#10;UID:event1&#10;END:VEVENT&#10;END:VCALENDAR</c:calendar-data>
      </d:propstat>
    </d:response>
  </d:multistatus>`

      const events = parseEvents(xml)
      expect(events).toHaveLength(1)
      expect(events[0].href).toBe('/calendars/user/event1.ics')
      expect(events[0].etag).toBe('abc123')
      expect(events[0].calendarData).toContain('BEGIN:VEVENT')
    })

    it('returns empty array for invalid XML', () => {
      expect(parseEvents('invalid')).toEqual([])
      expect(parseEvents('')).toEqual([])
    })

    it('ignores responses without calendar-data', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/calendars/user/no-data.ics</d:href>
    <d:propstat>
      <d:prop>
        <d:getetag>"etag123"</d:getetag>
      </d:propstat>
    </d:response>
  </d:multistatus>`

      const events = parseEvents(xml)
      expect(events).toHaveLength(0)
    })
  })
})
