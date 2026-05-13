import { describe, it, expect } from 'vitest'
import {
  buildPropfindCurrentUserPrincipal,
  buildPropfindAddressbookHome,
  buildPropfindAddressbooks,
  buildAddressbookQuery
} from '../../src/carddav/xml-builder'

describe('xml-builder (carddav)', () => {
  describe('buildPropfindCurrentUserPrincipal', () => {
    it('generates valid PROPFIND XML for current-user-principal', () => {
      const xml = buildPropfindCurrentUserPrincipal()
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('<D:propfind')
      expect(xml).toContain('<D:current-user-principal')
      expect(xml).toContain('xmlns:D="DAV:"')
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
