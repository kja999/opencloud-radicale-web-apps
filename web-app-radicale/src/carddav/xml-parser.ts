import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  trimValues: true,
  removeNSPrefix: true
})

interface PropfindResponse {
  multistatus?: {
    response?: PropfindResponseItem | PropfindResponseItem[]
  }
}

interface PropfindResponseItem {
  href: string
  propstat?:
    | {
        prop: Record<string, unknown>
      }
    | {
        prop: Record<string, unknown>
      }[]
}

function extractProp(propstat: unknown): Record<string, unknown> | null {
  if (!propstat) return null
  if (Array.isArray(propstat)) {
    for (const p of propstat) {
      if (p['prop']) {
        return p['prop'] as Record<string, unknown>
      }
    }
    return null
  }
  if (typeof propstat === 'object' && 'prop' in propstat) {
    return (propstat['prop'] as Record<string, unknown>) || null
  }
  return null
}

export function parseCurrentUserPrincipal(xml: string): string | null {
  try {
    const result = parser.parse(xml) as PropfindResponse
    const responses = result['multistatus']?.['response']
    if (!responses) return null

    const items = Array.isArray(responses) ? responses : [responses]
    for (const item of items) {
      const prop = extractProp(item['propstat'])
      if (prop && prop['current-user-principal']) {
        const principal = prop['current-user-principal'] as
          | Record<string, unknown>
          | undefined
        if (typeof principal === 'object' && principal?.['href']) {
          return principal['href'] as string
        }
        return String(principal)
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
    const responses = result['multistatus']?.['response']
    if (!responses) return null

    const items = Array.isArray(responses) ? responses : [responses]
    for (const item of items) {
      const prop = extractProp(item['propstat'])
      if (prop && prop['addressbook-home-set']) {
        const homeSet = prop['addressbook-home-set'] as
          | Record<string, unknown>
          | undefined
        if (typeof homeSet === 'object' && homeSet?.['href']) {
          return homeSet['href'] as string
        }
        return String(homeSet)
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
    const responses = result['multistatus']?.['response']
    if (!responses) return addressbooks

    const items = Array.isArray(responses) ? responses : [responses]

    for (const item of items) {
      const href = item['href']
      if (!href) continue

      const prop = extractProp(item['propstat'])
      if (!prop) continue

      const resourcetype = prop['resourcetype']
      let isAddressbook = false
      if (resourcetype) {
        if (typeof resourcetype === 'object') {
          isAddressbook = 'addressbook' in resourcetype
        }
      }
      if (!isAddressbook) continue

      const displayName = prop['displayname'] as string | undefined
      const color = prop['addressbook-color'] as string | undefined
      const ctag = prop['ctag'] as string | undefined
      const description = prop['addressbook-description'] as string | undefined

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
    const responses = result['multistatus']?.['response']
    if (!responses) return contacts

    const items = Array.isArray(responses) ? responses : [responses]

    for (const item of items) {
      const href = item['href']
      if (!href) continue

      const prop = extractProp(item['propstat'])
      if (!prop) continue

      const etag = prop['getetag'] as string | undefined
      const vcardData = prop['address-data'] as string | undefined

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
