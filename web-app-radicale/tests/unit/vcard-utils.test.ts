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
        email: [{ value: 'john@example.com', label: 'work' }],
        tel: [{ value: '+1234567890', label: 'cell' }],
        organization: 'Acme Inc',
        addressbookHref: '/contacts/user/'
      })

      expect(vcard).toContain('BEGIN:VCARD')
      expect(vcard).toContain('VERSION:3.0')
      expect(vcard).toContain('FN:John Doe')
      expect(vcard).toContain('EMAIL;TYPE=WORK:john@example.com')
      expect(vcard).toContain('TEL;TYPE=CELL:+1234567890')
      expect(vcard).toContain('ORG:Acme Inc')
      expect(vcard).toContain('END:VCARD')
    })

    it('handles multiple emails and phones', () => {
      const vcard = generateVCard({
        fn: 'Jane Doe',
        email: [{ value: 'jane@work.com' }, { value: 'jane@home.com', label: 'home' }],
        tel: [{ value: '+1111111111' }, { value: '+2222222222', label: 'cell' }],
        addressbookHref: '/contacts/user/'
      })

      expect(vcard).toContain('EMAIL:jane@work.com')
      expect(vcard).toContain('EMAIL;TYPE=HOME:jane@home.com')
      expect(vcard).toContain('TEL:+1111111111')
      expect(vcard).toContain('TEL;TYPE=CELL:+2222222222')
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
        email: [{ value: 'test@example.com' }],
        addressbookHref: '/contacts/user/'
      })

      expect(vcard).toContain('FN:Test\\; Name')
    })
  })

  describe('parseVCard', () => {
    it('parses a simple vCard', () => {
      const vcardData =
        'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:John Doe\r\nEMAIL:john@example.com\r\nTEL:+1234567890\r\nORG:Acme Inc\r\nUID:contact-123\r\nEND:VCARD'

      const contact = parseVCard(vcardData, '/contacts/user/contact-123.vcf', 'etag-123')

      expect(contact).not.toBeNull()
      expect(contact?.fn).toBe('John Doe')
      expect(contact?.email).toEqual([{ value: 'john@example.com' }])
      expect(contact?.tel).toEqual([{ value: '+1234567890' }])
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
      const vcardData =
        'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Multi Contact\r\nEMAIL:one@test.com\r\nEMAIL;TYPE=WORK:two@test.com\r\nTEL:111\r\nTEL;TYPE=CELL:222\r\nUID:multi-123\r\nEND:VCARD'

      const contact = parseVCard(vcardData, '/contacts/user/multi.vcf', 'etag-456')

      expect(contact?.email).toEqual([{ value: 'one@test.com' }, { value: 'two@test.com', label: 'work' }])
      expect(contact?.tel).toEqual([{ value: '111' }, { value: '222', label: 'cell' }])
    })
  })
})
