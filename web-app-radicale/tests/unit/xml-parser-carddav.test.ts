import { describe, it, expect } from 'vitest'
import {
  parseCurrentUserPrincipal,
  parseAddressbookHomeSet,
  parseAddressbooks,
  parseContacts
} from '../../src/carddav/xml-parser'

describe('xml-parser (carddav)', () => {
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

  describe('parseAddressbookHomeSet', () => {
    it('parses addressbook-home-set from PROPFIND response', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:ca="urn:ietf:params:xml:ns:carddav">
  <d:response>
    <d:href>/principals/users/testuser/</d:href>
    <d:propstat>
      <d:prop>
        <ca:addressbook-home-set>
          <d:href>/addressbooks/user/testuser/</d:href>
        </ca:addressbook-home-set>
      </d:propstat>
    </d:response>
  </d:multistatus>`

      const homeSet = parseAddressbookHomeSet(xml)
      expect(homeSet).toBe('/addressbooks/user/testuser/')
    })

    it('returns null for invalid XML', () => {
      expect(parseAddressbookHomeSet('invalid')).toBeNull()
      expect(parseAddressbookHomeSet('')).toBeNull()
    })
  })

  describe('parseAddressbooks', () => {
    it('parses addressbook collection from PROPFIND response', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:ca="urn:ietf:params:xml:ns:carddav">
  <d:response>
    <d:href>/addressbooks/user/contacts/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Contacts</d:displayname>
        <d:resourcetype>
          <d:collection/>
          <ca:addressbook/>
        </d:resourcetype>
        <ca:addressbook-color>#ff0000</ca:addressbook-color>
        <c:ctag>def456</c:ctag>
      </d:propstat>
    </d:response>
  </d:multistatus>`

      const addressbooks = parseAddressbooks(xml)
      expect(addressbooks).toHaveLength(1)
      expect(addressbooks[0].href).toBe('/addressbooks/user/contacts/')
      expect(addressbooks[0].displayName).toBe('Contacts')
      expect(addressbooks[0].color).toBe('#ff0000')
      expect(addressbooks[0].ctag).toBe('def456')
    })

    it('returns empty array for invalid XML', () => {
      expect(parseAddressbooks('invalid')).toEqual([])
      expect(parseAddressbooks('')).toEqual([])
    })

    it('ignores non-addressbook resources', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:ca="urn:ietf:params:xml:ns:carddav">
  <d:response>
    <d:href>/some/folder/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Not an Addressbook</d:displayname>
        <d:resourcetype>
          <d:collection/>
        </d:resourcetype>
      </d:propstat>
    </d:response>
  </d:multistatus>`

      const addressbooks = parseAddressbooks(xml)
      expect(addressbooks).toHaveLength(0)
    })
  })

  describe('parseContacts', () => {
    it('parses contacts from REPORT response', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:ca="urn:ietf:params:xml:ns:carddav">
  <d:response>
    <d:href>/addressbooks/user/contacts/john-doe.vcf</d:href>
    <d:propstat>
      <d:prop>
        <d:getetag>"abc123"</d:getetag>
        <ca:address-data>BEGIN:VCARD&#10;VERSION:3.0&#10;FN:John Doe&#10;TEL:+1234567890&#10;END:VCARD</ca:address-data>
      </d:propstat>
    </d:response>
  </d:multistatus>`

      const contacts = parseContacts(xml)
      expect(contacts).toHaveLength(1)
      expect(contacts[0].href).toBe('/addressbooks/user/contacts/john-doe.vcf')
      expect(contacts[0].etag).toBe('abc123')
      expect(contacts[0].vcardData).toContain('BEGIN:VCARD')
    })

    it('returns empty array for invalid XML', () => {
      expect(parseContacts('invalid')).toEqual([])
      expect(parseContacts('')).toEqual([])
    })

    it('ignores responses without address-data', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/addressbooks/user/no-data.vcf</d:href>
    <d:propstat>
      <d:prop>
        <d:getetag>"etag123"</d:getetag>
      </d:propstat>
    </d:response>
  </d:multistatus>`

      const contacts = parseContacts(xml)
      expect(contacts).toHaveLength(0)
    })
  })
})
