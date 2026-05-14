import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ContactFormData } from '../../src/types/contacts'

vi.mock('../../src/carddav/auth', () => ({
  authenticatedFetch: vi.fn()
}))

import { authenticatedFetch } from '../../src/carddav/auth'
import { createContact, updateContact, deleteContact } from '../../src/carddav/contacts'
import { AuthenticationError, NotFoundError, ConflictError } from '../../src/carddav/errors'

const mockFetch = authenticatedFetch as unknown as ReturnType<typeof vi.fn>

describe('CardDAV Contacts CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createContact', () => {
    it('creates contact with correct vCard structure', async () => {
      const formData: ContactFormData = {
        fn: 'John Doe',
        email: ['john@example.com'],
        tel: ['+1234567890'],
        addressbookHref: '/addressbooks/user/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 201,
        headers: { get: () => '"etag123"' },
        ok: true
      } as Response)

      const result = await createContact(formData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\.vcf$/),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'text/vcard; charset=utf-8',
            'If-None-Match': '*'
          })
        })
      )
      expect(result.fn).toBe('John Doe')
      expect(result.etag).toBe('etag123')
    })

    it('creates contact with multiple emails', async () => {
      const formData: ContactFormData = {
        fn: 'Jane Smith',
        email: ['jane@example.com', 'jane.smith@work.com'],
        addressbookHref: '/addressbooks/user/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 201,
        headers: { get: () => '"etag456"' },
        ok: true
      } as Response)

      const result = await createContact(formData)

      const callArgs = mockFetch.mock.calls[0]
      const vcardBody = callArgs[1].body as string
      expect(vcardBody).toContain('FN:Jane Smith')
      expect(vcardBody).toMatch(/EMAIL.*jane@example.com/)
      expect(vcardBody).toMatch(/EMAIL.*jane.smith@work.com/)
    })

    it('creates contact with organization and title', async () => {
      const formData: ContactFormData = {
        fn: 'Bob Wilson',
        organization: 'Acme Corp',
        title: 'Software Engineer',
        addressbookHref: '/addressbooks/user/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 201,
        headers: { get: () => '"etag789"' },
        ok: true
      } as Response)

      const result = await createContact(formData)

      const callArgs = mockFetch.mock.calls[0]
      const vcardBody = callArgs[1].body as string
      expect(vcardBody).toContain('ORG:Acme Corp')
      expect(vcardBody).toContain('TITLE:Software Engineer')
    })

    it('throws AuthenticationError on 401', async () => {
      const formData: ContactFormData = {
        fn: 'Test User',
        addressbookHref: '/addressbooks/user/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 401
      } as Response)

      await expect(createContact(formData)).rejects.toThrow(AuthenticationError)
    })

    it('throws ConflictError on 412 (contact exists)', async () => {
      const formData: ContactFormData = {
        fn: 'Test User',
        addressbookHref: '/addressbooks/user/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 412
      } as Response)

      await expect(createContact(formData)).rejects.toThrow(ConflictError)
    })
  })

  describe('updateContact', () => {
    it('sends correct headers with If-Match', async () => {
      const existingContact = {
        uid: 'contact-123',
        href: '/addressbooks/user/contact-123.vcf',
        etag: 'etag-original',
        fn: 'Old Name',
        vcardData: 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Old Name\r\nEND:VCARD'
      }

      const formData: ContactFormData = {
        fn: 'New Name',
        email: ['new@example.com'],
        addressbookHref: '/addressbooks/user/'
      }

      mockFetch.mockResolvedValueOnce({
        status: 204,
        headers: { get: () => '"new-etag"' },
        ok: true
      } as Response)

      const result = await updateContact(existingContact as any, formData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/addressbooks/user/contact-123.vcf',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'If-Match': '"etag-original"'
          })
        })
      )
      expect(result.etag).toBe('new-etag')
      expect(result.fn).toBe('New Name')
    })

    it('throws NotFoundError on 404', async () => {
      const existingContact = {
        uid: 'contact-123',
        href: '/addressbooks/user/contact-123.vcf',
        etag: 'etag-original',
        fn: 'Test',
        vcardData: ''
      }

      mockFetch.mockResolvedValueOnce({
        status: 404
      } as Response)

      await expect(
        updateContact(existingContact as any, {
          fn: 'Test',
          addressbookHref: '/addressbooks/user/'
        })
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('deleteContact', () => {
    it('sends DELETE with correct etag', async () => {
      const existingContact = {
        uid: 'contact-123',
        href: '/addressbooks/user/contact-123.vcf',
        etag: 'etag-to-delete',
        fn: 'Test',
        vcardData: ''
      }

      mockFetch.mockResolvedValueOnce({
        status: 204,
        ok: true
      } as Response)

      await deleteContact(existingContact as any)

      expect(mockFetch).toHaveBeenCalledWith(
        '/addressbooks/user/contact-123.vcf',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'If-Match': '"etag-to-delete"'
          })
        })
      )
    })

    it('handles 404 gracefully (already deleted)', async () => {
      const existingContact = {
        uid: 'contact-123',
        href: '/addressbooks/user/contact-123.vcf',
        etag: 'etag',
        fn: 'Test',
        vcardData: ''
      }

      mockFetch.mockResolvedValueOnce({
        status: 404
      } as Response)

      await expect(deleteContact(existingContact as any)).resolves.toBeUndefined()
    })
  })
})
