import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  trimValues: true
})

interface PropfindResponse {
  'd:multistatus'?: {
    'd:response'?: PropfindResponseItem | PropfindResponseItem[]
  }
}

interface PropfindResponseItem {
  'd:href': string
  'd:propstat'?: {
    'd:prop': Record<string, unknown>
  } | {
    'd:prop': Record<string, unknown>
  }[]
}

function extractProp(propstat: unknown): Record<string, unknown> | null {
  if (!propstat) return null
  if (Array.isArray(propstat)) {
    for (const p of propstat) {
      if (p['d:prop']) {
        return p['d:prop'] as Record<string, unknown>
      }
    }
    return null
  }
  if (typeof propstat === 'object' && 'd:prop' in propstat) {
    return (propstat['d:prop'] as Record<string, unknown>) || null
  }
  return null
}

export function parseCurrentUserPrincipal(xml: string): string | null {
  try {
    const result = parser.parse(xml) as PropfindResponse
    const responses = result['d:multistatus']?.['d:response']
    if (!responses) return null

    const items = Array.isArray(responses) ? responses : [responses]
    for (const item of items) {
      const prop = extractProp(item['d:propstat'])
      if (prop && prop['d:current-user-principal']) {
        const principal = prop['d:current-user-principal']
        if (typeof principal === 'object' && principal?.['d:href']) {
          return (principal as Record<string, unknown>)['d:href'] as string
        }
        return principal as string
      }
    }
    return null
  } catch {
    return null
  }
}

export function parseAddressbookHomeSet(xml: string): string | null {
  try {
    const result = parser.parse(xml) as PropfindResponse
    const responses = result['d:multistatus']?.['d:response']
    if (!responses) return null

    const items = Array.isArray(responses) ? responses : [responses]
    for (const item of items) {
      const prop = extractProp(item['d:propstat'])
      if (prop && prop['ca:addressbook-home-set']) {
        const homeSet = prop['ca:addressbook-home-set']
        if (typeof homeSet === 'object' && homeSet?.['d:href']) {
          return (homeSet as Record<string, unknown>)['d:href'] as string
        }
        return homeSet as string
      }
    }
    return null
  } catch {
    return null
  }
}

interface AddressbookData {
  href: string
  displayName?: string
  color?: string
  ctag?: string
  description?: string
}

export function parseAddressbooks(xml: string): AddressbookData[] {
  const addressbooks: AddressbookData[] = []

  try {
    const result = parser.parse(xml) as PropfindResponse
    const responses = result['d:multistatus']?.['d:response']
    if (!responses) return addressbooks

    const items = Array.isArray(responses) ? responses : [responses]

    for (const item of items) {
      const href = item['d:href']
      if (!href) continue

      const prop = extractProp(item['d:propstat'])
      if (!prop) continue

      const resourcetype = prop['d:resourcetype']
      let isAddressbook = false
      if (resourcetype) {
        if (typeof resourcetype === 'object') {
          isAddressbook = 'ca:addressbook' in resourcetype || 'card:addressbook' in resourcetype
        }
      }
      if (!isAddressbook) continue

      const displayName = prop['d:displayname'] as string | undefined
      const color = prop['ca:addressbook-color'] as string | undefined
      const ctag = prop['c:ctag'] as string | undefined
      const description = prop['ca:addressbook-description'] as string | undefined

      addressbooks.push({
        href,
        displayName,
        color,
        ctag,
        description
      })
    }
  } catch {
    // Return empty array on parse error
  }

  return addressbooks
}

interface ContactData {
  href: string
  etag: string
  vcardData: string
}

export function parseContacts(xml: string): ContactData[] {
  const contacts: ContactData[] = []

  try {
    const result = parser.parse(xml) as PropfindResponse
    const responses = result['d:multistatus']?.['d:response']
    if (!responses) return contacts

    const items = Array.isArray(responses) ? responses : [responses]

    for (const item of items) {
      const href = item['d:href']
      if (!href) continue

      const prop = extractProp(item['d:propstat'])
      if (!prop) continue

      const etag = prop['d:getetag'] as string | undefined
      const vcardData = prop['ca:address-data'] as string | undefined

      if (vcardData) {
        contacts.push({
          href,
          etag: etag?.replace(/"/g, '') || '',
          vcardData
        })
      }
    }
  } catch {
    // Return empty array on parse error
  }

  return contacts
}