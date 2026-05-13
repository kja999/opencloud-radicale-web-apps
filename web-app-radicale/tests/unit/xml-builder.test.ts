import { describe, it, expect } from 'vitest'
import {
  buildPropfindCurrentUserPrincipal,
  buildPropfindCalendarHome,
  buildPropfindCalendars,
  buildCalendarQuery,
  buildPropfindAddressbookHome,
  buildPropfindAddressbooks,
  buildAddressbookQuery
} from '../../src/caldav/xml-builder'

describe('xml-builder (caldav)', () => {
  describe('buildPropfindCurrentUserPrincipal', () => {
    it('generates valid PROPFIND XML for current-user-principal', () => {
      const xml = buildPropfindCurrentUserPrincipal()
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('<D:propfind')
      expect(xml).toContain('<D:current-user-principal')
      expect(xml).toContain('xmlns:D="DAV:"')
    })
  })

  describe('buildPropfindCalendarHome', () => {
    it('generates valid PROPFIND XML for calendar-home-set', () => {
      const xml = buildPropfindCalendarHome()
      expect(xml).toContain('<C:calendar-home-set')
      expect(xml).toContain('xmlns:C="urn:ietf:params:xml:ns:caldav"')
    })
  })

  describe('buildPropfindCalendars', () => {
    it('generates valid PROPFIND XML for calendar properties', () => {
      const xml = buildPropfindCalendars()
      expect(xml).toContain('<D:displayname')
      expect(xml).toContain('<D:resourcetype')
      expect(xml).toContain('<C:calendar-description')
      expect(xml).toContain('<C:calendar-color')
      expect(xml).toContain('<C:ctag')
    })
  })

  describe('buildCalendarQuery', () => {
    it('generates valid calendar-query XML with date range', () => {
      const start = new Date('2024-01-01T00:00:00Z')
      const end = new Date('2024-01-31T23:59:59Z')
      const xml = buildCalendarQuery(start, end)

      expect(xml).toContain('<C:calendar-query')
      expect(xml).toContain('<C:comp-filter name="VCALENDAR"')
      expect(xml).toContain('<C:comp-filter name="VEVENT"')
      expect(xml).toContain('<C:time-range')
      expect(xml).toContain('start="20240101T000000Z"')
      expect(xml).toContain('end="20240131T235959Z"')
    })

    it('handles different date ranges', () => {
      const start = new Date('2024-06-15T12:00:00Z')
      const end = new Date('2024-06-15T14:00:00Z')
      const xml = buildCalendarQuery(start, end)

      expect(xml).toContain('start="20240615T120000Z"')
      expect(xml).toContain('end="20240615T140000Z"')
    })
  })

  describe('buildPropfindAddressbookHome', () => {
    it('generates valid PROPFIND XML for addressbook-home-set', () => {
      const xml = buildPropfindAddressbookHome()
      expect(xml).toContain('<CA:addressbook-home-set')
      expect(xml).toContain('xmlns:CA="urn:ietf:params:xml:ns:carddav"')
    })
  })

  describe('buildPropfindAddressbooks', () => {
    it('generates valid PROPFIND XML for addressbook properties', () => {
      const xml = buildPropfindAddressbooks()
      expect(xml).toContain('<D:displayname')
      expect(xml).toContain('<D:resourcetype')
      expect(xml).toContain('<CA:addressbook-description')
      expect(xml).toContain('<CA:addressbook-color')
      expect(xml).toContain('<C:ctag')
    })
  })

  describe('buildAddressbookQuery', () => {
    it('generates valid addressbook-query XML', () => {
      const xml = buildAddressbookQuery()
      expect(xml).toContain('<D:addressbook-query')
      expect(xml).toContain('<D:getetag')
      expect(xml).toContain('<CA:address-data')
      expect(xml).toContain('<CA:filter')
    })
  })
})