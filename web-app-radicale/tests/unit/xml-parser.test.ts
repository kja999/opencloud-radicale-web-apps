import { describe, it, expect } from 'vitest'
import { parseCurrentUserPrincipal, parseCalendars } from '../../src/caldav/xml-parser'

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
})
