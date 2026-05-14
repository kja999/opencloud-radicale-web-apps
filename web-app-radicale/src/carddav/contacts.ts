import { CardDAVError, AuthenticationError, NotFoundError, ConflictError } from './errors'
import { buildAddressbookQuery } from './xml-builder'
import { parseContacts } from './xml-parser'
import { parseVCard, generateVCard, generateUID } from './vcard-utils'
import { authenticatedFetch } from './auth'
import type { Contact, ContactFormData } from '../types/contacts'

async function report(url: string, body: string): Promise<string> {
  const response = await authenticatedFetch(url, {
    method: 'REPORT',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '1'
    },
    body
  })

  if (response.status === 401) {
    throw new AuthenticationError()
  }
  if (response.status === 404) {
    throw new NotFoundError(`Addressbook not found: ${url}`)
  }
  if (!response.ok && response.status !== 207) {
    throw new CardDAVError(`REPORT failed: ${response.statusText}`, response.status)
  }

  return response.text()
}

export async function fetchContacts(addressbookHref: string): Promise<Contact[]> {
  const xml = await report(addressbookHref, buildAddressbookQuery())
  const contactData = parseContacts(xml)

  console.log('[CardDAV] Raw contacts from XML:', contactData.length)

  const contacts: Contact[] = []
  for (const data of contactData) {
    const parsed = parseVCard(data.vcardData, data.href, data.etag)
    if (parsed) {
      contacts.push(parsed)
    }
  }

  console.log('[CardDAV] Parsed contacts:', contacts.length)
  return contacts
}

export async function createContact(formData: ContactFormData, retryCount = 0): Promise<Contact> {
  const uid = generateUID()
  const vcardData = generateVCard({ ...formData, uid })
  const contactHref = `${formData.addressbookHref}${uid}.vcf`

  console.log('[CardDAV] Creating contact at:', contactHref)
  console.log('[CardDAV] vCard data:', vcardData)

  const response = await authenticatedFetch(contactHref, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'If-None-Match': '*'
    },
    body: vcardData
  })

  console.log('[CardDAV] Create contact response:', response.status, response.statusText)

  if (response.status === 401) {
    throw new AuthenticationError()
  }
  if (response.status === 412) {
    throw new ConflictError('Contact already exists')
  }
  if (response.status === 409) {
    const body = await response.text().catch(() => '')
    console.log('[CardDAV] UID conflict, retrying (attempt', retryCount + 1, '):', body)
    if (retryCount < 3) {
      return createContact(formData, retryCount + 1)
    }
    throw new CardDAVError(
      `Failed to create contact: UID conflict after retries (${response.status}): ${response.statusText || body}`,
      response.status
    )
  }
  if (!response.ok && response.status !== 201) {
    const body = await response.text().catch(() => '')
    console.log('[CardDAV] Create contact error body:', body)
    throw new CardDAVError(
      `Failed to create contact (HTTP ${response.status}): ${response.statusText || body}`,
      response.status
    )
  }

  const etag = response.headers.get('ETag')?.replace(/"/g, '') || ''

  return {
    uid,
    href: contactHref,
    etag,
    vcardData,
    fn: formData.fn,
    email: formData.email,
    tel: formData.tel,
    address: formData.address,
    organization: formData.organization,
    title: formData.title,
    photo: formData.photo,
    note: formData.note
  }
}

export async function updateContact(contact: Contact, formData: ContactFormData): Promise<Contact> {
  const vcardData = generateVCard({ ...formData, uid: contact.uid })

  console.log('[CardDAV] Updating contact at:', contact.href)
  console.log('[CardDAV] vCard data:', vcardData)

  const response = await authenticatedFetch(contact.href, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'If-Match': `"${contact.etag}"`
    },
    body: vcardData
  })

  console.log('[CardDAV] Update contact response:', response.status, response.statusText)

  if (response.status === 401) {
    throw new AuthenticationError()
  }
  if (response.status === 404) {
    throw new NotFoundError('Contact not found')
  }
  if (response.status === 412) {
    throw new ConflictError('Contact was modified by another client', contact.etag)
  }
  if (!response.ok && response.status !== 204) {
    const body = await response.text().catch(() => '')
    console.log('[CardDAV] Update contact error body:', body)
    throw new CardDAVError(
      `Failed to update contact (HTTP ${response.status}): ${response.statusText || body}`,
      response.status
    )
  }
  if (response.status === 404) {
    throw new NotFoundError('Contact not found')
  }
  if (response.status === 412) {
    throw new ConflictError('Contact was modified by another client', contact.etag)
  }
  if (!response.ok && response.status !== 204) {
    throw new CardDAVError(`Failed to update contact: ${response.statusText}`, response.status)
  }

  const etag = response.headers.get('ETag')?.replace(/"/g, '') || contact.etag

  return {
    ...contact,
    fn: formData.fn,
    email: formData.email,
    tel: formData.tel,
    address: formData.address,
    organization: formData.organization,
    title: formData.title,
    photo: formData.photo,
    note: formData.note,
    etag,
    vcardData
  }
}

export async function deleteContact(contact: Contact): Promise<void> {
  const response = await authenticatedFetch(contact.href, {
    method: 'DELETE',
    headers: {
      'If-Match': `"${contact.etag}"`
    }
  })

  if (response.status === 401) {
    throw new AuthenticationError()
  }
  if (response.status === 404) {
    return
  }
  if (response.status === 412) {
    throw new ConflictError('Contact was modified by another client')
  }
  if (!response.ok && response.status !== 204) {
    throw new CardDAVError(`Failed to delete contact: ${response.statusText}`, response.status)
  }
}

export async function fetchSingleContact(href: string): Promise<Contact | null> {
  const response = await authenticatedFetch(href, {
    method: 'GET',
    headers: {
      Accept: 'text/vcard'
    }
  })

  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new CardDAVError(`Failed to fetch contact: ${response.statusText}`, response.status)
  }

  const vcardData = await response.text()
  const etag = response.headers.get('ETag')?.replace(/"/g, '') || ''

  return parseVCard(vcardData, href, etag)
}
