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
      if (p.prop) {
        return p.prop as Record<string, unknown>
      }
    }
    return null
  }
  if (typeof propstat === 'object' && 'prop' in propstat) {
    return (propstat.prop as Record<string, unknown>) || null
  }
  return null
}

export function parseCurrentUserPrincipal(xml: string): string | null {
  try {
    const result = parser.parse(xml) as PropfindResponse
    const responses = result.multistatus?.response
    if (!responses) return null

    const items = Array.isArray(responses) ? responses : [responses]
    for (const item of items) {
      const prop = extractProp(item.propstat)
      if (prop && prop['current-user-principal']) {
        const principal = prop['current-user-principal'] as Record<string, unknown> | undefined
        if (typeof principal === 'object' && principal?.href) {
          return principal.href as string
        }
        return String(principal)
      }
    }
    return null
  } catch (e) {
    console.error('[CalDAV] Parse error:', e)
    return null
  }
}

export function parseCalendarHomeSet(xml: string): string | null {
  try {
    const result = parser.parse(xml) as PropfindResponse
    const responses = result.multistatus?.response
    if (!responses) return null

    const items = Array.isArray(responses) ? responses : [responses]
    for (const item of items) {
      const prop = extractProp(item.propstat)
      if (prop && prop['calendar-home-set']) {
        const homeSet = prop['calendar-home-set'] as Record<string, unknown> | undefined
        if (typeof homeSet === 'object' && homeSet?.href) {
          return homeSet.href as string
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
    const responses = result.multistatus?.response
    if (!responses) return calendars

    const items = Array.isArray(responses) ? responses : [responses]

    for (const item of items) {
      const href = item.href
      if (!href) continue

      const prop = extractProp(item.propstat)
      if (!prop) continue

      const resourcetype = prop.resourcetype
      let isCalendar = false
      if (resourcetype) {
        if (typeof resourcetype === 'object') {
          isCalendar = 'calendar' in resourcetype
        }
      }
      if (!isCalendar) continue

      const displayName = prop.displayname as string | undefined
      const color = prop['calendar-color'] as string | undefined
      const ctag = prop.ctag as string | undefined
      const description = prop['calendar-description'] as string | undefined

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
    const responses = result.multistatus?.response
    if (!responses) return events

    const items = Array.isArray(responses) ? responses : [responses]

    for (const item of items) {
      const href = item.href
      if (!href) continue

      const prop = extractProp(item.propstat)
      if (!prop) continue

      const etag = prop.getetag as string | undefined
      const calendarData = prop['calendar-data'] as string | undefined

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
