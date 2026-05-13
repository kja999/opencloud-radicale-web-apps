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
        const principal = prop['d:current-user-principal'] as Record<string, unknown> | undefined
        if (typeof principal === 'object' && principal?.['d:href']) {
          return principal['d:href'] as string
        }
        return String(principal)
      }
    }
    return null
  } catch {
    return null
  }
}

export function parseCalendarHomeSet(xml: string): string | null {
  try {
    const result = parser.parse(xml) as PropfindResponse
    const responses = result['d:multistatus']?.['d:response']
    if (!responses) return null

    const items = Array.isArray(responses) ? responses : [responses]
    for (const item of items) {
      const prop = extractProp(item['d:propstat'])
      if (prop && prop['c:calendar-home-set']) {
        const homeSet = prop['c:calendar-home-set'] as Record<string, unknown> | undefined
        if (typeof homeSet === 'object' && homeSet?.['d:href']) {
          return homeSet['d:href'] as string
        }
        return String(homeSet)
      }
    }
    return null
  } catch {
    return null
  }
}

interface CalendarData {
  href: string
  displayName?: string
  color?: string
  ctag?: string
  description?: string
}

export function parseCalendars(xml: string): CalendarData[] {
  const calendars: CalendarData[] = []

  try {
    const result = parser.parse(xml) as PropfindResponse
    const responses = result['d:multistatus']?.['d:response']
    if (!responses) return calendars

    const items = Array.isArray(responses) ? responses : [responses]

    for (const item of items) {
      const href = item['d:href']
      if (!href) continue

      const prop = extractProp(item['d:propstat'])
      if (!prop) continue

      const resourcetype = prop['d:resourcetype']
      let isCalendar = false
      if (resourcetype) {
        if (typeof resourcetype === 'object') {
          isCalendar = 'c:calendar' in resourcetype || 'cal:calendar' in resourcetype
        }
      }
      if (!isCalendar) continue

      const displayName = prop['d:displayname'] as string | undefined
      const color = prop['c:calendar-color'] as string | undefined
      const ctag = prop['c:ctag'] as string | undefined
      const description = prop['c:calendar-description'] as string | undefined

      calendars.push({
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

  return calendars
}

interface EventData {
  href: string
  etag: string
  calendarData: string
}

export function parseEvents(xml: string): EventData[] {
  const events: EventData[] = []

  try {
    const result = parser.parse(xml) as PropfindResponse
    const responses = result['d:multistatus']?.['d:response']
    if (!responses) return events

    const items = Array.isArray(responses) ? responses : [responses]

    for (const item of items) {
      const href = item['d:href']
      if (!href) continue

      const prop = extractProp(item['d:propstat'])
      if (!prop) continue

      const etag = prop['d:getetag'] as string | undefined
      const calendarData = prop['c:calendar-data'] as string | undefined

      if (calendarData) {
        events.push({
          href,
          etag: etag?.replace(/"/g, '') || '',
          calendarData
        })
      }
    }
  } catch {
    // Return empty array on parse error
  }

  return events
}