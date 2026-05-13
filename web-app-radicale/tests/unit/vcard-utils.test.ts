import { describe, it, expect } from 'vitest'
import { generateVCard, parseVCard, generateUID } from '../../src/carddav/vcard-utils'

describe('vcard-utils', () => {
  describe('generateUID', () => {
    it('generates a unique ID', () => {
      const uid1 = generateUID()
      const uid2 = generateUID()
      expect(uid1).not.toBe(uid2)
      expect(uid1).toContain('@radicale')
    })
  })

  describe('generateVCard', () => {
    it('generates a valid vCard 3.0', () => {
      const vcard = generateVCard({
        fn: 'John Doe',
        email: ['john@example.com'],
        tel: ['+1234567890'],
        organization: 'Acme Inc',
        addressbookHref: '/contacts/user/'
      })

      expect(vcard).toContain('BEGIN:VCARD')
      expect(vcard).toContain('VERSION:3.0')
      expect(vcard).toContain('FN:John Doe')
      expect(vcard).toContain('EMAIL:john@example.com')
      expect(vcard).toContain('TEL:+1234567890')
      expect(vcard).toContain('ORG:Acme Inc')
      expect(vcard).toContain('END:VCARD')
    })

    it('handles multiple emails and phones', () => {
      const vcard = generateVCard({
        fn: 'Jane Doe',
        email: ['jane@work.com', 'jane@home.com'],
        tel: ['+1111111111', '+2222222222'],
        addressbookHref: '/contacts/user/'
      })

      expect(vcard).toContain('EMAIL:jane@work.com')
      expect(vcard).toContain('EMAIL:jane@home.com')
      expect(vcard).toContain('TEL:+1111111111')
      expect(vcard).toContain('TEL:+2222222222')
    })

    it('handles optional fields', () => {
      const vcard = generateVCard({
        fn: 'Test User',
        title: 'Developer',
        note: 'Some notes',
        addressbookHref: '/contacts/user/'
      })

      expect(vcard).toContain('TITLE:Developer')
      expect(vcard).toContain('NOTE:Some notes')
    })

    it('escapes special characters', () => {
      const vcard = generateVCard({
        fn: 'Test; Name',
        email: ['test@example.com'],
        addressbookHref: '/contacts/user/'
      })

      expect(vcard).toContain('FN:Test\\; Name')
    })
  })

  describe('parseVCard', () => {
    it('parses a simple vCard', () => {
      const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
EMAIL:john@example.com
TEL:+1234567890
ORG:Acme Inc
UID:contact-123
END:VCARD`

      const contact = parseVCard(vcardData, '/contacts/user/contact-123.vcf', 'etag-123')

      expect(contact).not.toBeNull()
      expect(contact?.fn).toBe('John Doe')
      expect(contact?.email).toEqual(['john@example.com'])
      expect(contact?.tel).toEqual(['+1234567890'])
      expect(contact?.organization).toBe('Acme Inc')
      expect(contact?.uid).toBe('contact-123')
      expect(contact?.href).toBe('/contacts/user/contact-123.vcf')
      expect(contact?.etag).toBe('etag-123')
    })

    it('returns null for invalid vCard', () => {
      const contact = parseVCard('INVALID DATA', '/contacts/user/test.vcf', 'etag-1')
      expect(contact).toBeNull()
    })

    it('handles multiple values', () => {
      const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:Multi Contact
EMAIL:one@test.com
EMAIL:two@test.com
TEL:111
TEL:222
UID:multi-123
END:VCARD`

      const contact = parseVCard(vcardData, '/contacts/user/multi.vcf', 'etag-456')

      expect(contact?.email).toEqual(['one@test.com', 'two@test.com'])
      expect(contact?.tel).toEqual(['111', '222'])
    })
  })
})