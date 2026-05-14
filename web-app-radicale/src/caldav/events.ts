import { CalDAVError, AuthenticationError, NotFoundError, ConflictError } from './errors'
import { buildCalendarQuery } from './xml-builder'
import { parseEvents } from './xml-parser'
import { parseICS, generateICS, generateUID, addExceptionToICS, updateSeriesICS } from './ics-utils'
import { authenticatedFetch } from './auth'
import type { CalendarEvent, EventFormData, DateRange } from '../types/calendar'

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
    throw new NotFoundError(`Calendar not found: ${url}`)
  }
  if (!response.ok && response.status !== 207) {
    throw new CalDAVError(`REPORT failed: ${response.statusText}`, response.status)
  }

  return response.text()
}

export async function fetchEvents(calendarHref: string, range: DateRange): Promise<CalendarEvent[]> {
  const xml = await report(calendarHref, buildCalendarQuery(range.start, range.end))
  console.log('[CalDAV] REPORT response length:', xml.length, 'for', calendarHref)
  const eventData = parseEvents(xml)
  console.log('[CalDAV] Parsed events from XML:', eventData.length)

  const events: CalendarEvent[] = []
  for (const data of eventData) {
    const parsed = parseICS(data.calendarData, data.href, data.etag, range)
    for (const event of parsed) {
      event.calendarHref = calendarHref
    }
    events.push(...parsed)
  }

  console.log('[CalDAV] Total parsed ICS events:', events.length)
  return events
}

export async function createEvent(formData: EventFormData, retryCount = 0): Promise<CalendarEvent> {
  const uid = generateUID()
  const icsData = generateICS({ ...formData, uid })
  const eventHref = `${formData.calendarHref}${uid}.ics`

  console.log('[CalDAV] Creating event at:', eventHref)
  console.log('[CalDAV] ICS data:', icsData)

  const response = await authenticatedFetch(eventHref, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'If-None-Match': '*'
    },
    body: icsData
  })

  console.log('[CalDAV] Create event response:', response.status, response.statusText)

  if (response.status === 401) {
    throw new AuthenticationError()
  }
  if (response.status === 412) {
    throw new ConflictError('Event already exists')
  }
  if (response.status === 409) {
    const body = await response.text().catch(() => '')
    console.log('[CalDAV] UID conflict, retrying (attempt', retryCount + 1, '):', body)
    if (retryCount < 3) {
      return createEvent(formData, retryCount + 1)
    }
    throw new CalDAVError(
      `Failed to create event: UID conflict after retries (${response.status}): ${response.statusText || body}`,
      response.status
    )
  }
  if (!response.ok && response.status !== 201) {
    const body = await response.text().catch(() => '')
    console.log('[CalDAV] Create event error body:', body)
    throw new CalDAVError(
      `Failed to create event (HTTP ${response.status}): ${response.statusText || body}`,
      response.status
    )
  }

  const etag = response.headers.get('ETag')?.replace(/"/g, '') || ''

  return {
    uid,
    calendarHref: formData.calendarHref,
    href: eventHref,
    etag,
    summary: formData.summary,
    start: formData.start,
    end: formData.end,
    allDay: formData.allDay,
    description: formData.description || undefined,
    location: formData.location || undefined,
    icsData,
    isRecurring: !!formData.recurrence,
    rrule: undefined
  }
}

export async function updateEvent(event: CalendarEvent, formData: EventFormData): Promise<CalendarEvent> {
  const icsData = generateICS({ ...formData, uid: event.uid })

  console.log('[CalDAV] Updating event at:', event.href)
  console.log('[CalDAV] ICS data:', icsData)

  const response = await authenticatedFetch(event.href, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'If-Match': `"${event.etag}"`
    },
    body: icsData
  })

  console.log('[CalDAV] Update event response:', response.status, response.statusText)

  if (response.status === 401) {
    throw new AuthenticationError()
  }
  if (response.status === 404) {
    throw new NotFoundError('Event not found')
  }
  if (response.status === 412) {
    throw new ConflictError('Event was modified by another client', event.etag)
  }
  if (!response.ok && response.status !== 204) {
    const body = await response.text().catch(() => '')
    console.log('[CalDAV] Update event error body:', body)
    throw new CalDAVError(
      `Failed to update event (HTTP ${response.status}): ${response.statusText || body}`,
      response.status
    )
  }

  const etag = response.headers.get('ETag')?.replace(/"/g, '') || event.etag

  return {
    ...event,
    summary: formData.summary,
    start: formData.start,
    end: formData.end,
    allDay: formData.allDay,
    description: formData.description || undefined,
    location: formData.location || undefined,
    etag,
    icsData,
    isRecurring: !!formData.recurrence || event.isRecurring
  }
}

export async function deleteEvent(event: CalendarEvent): Promise<void> {
  const response = await authenticatedFetch(event.href, {
    method: 'DELETE',
    headers: {
      'If-Match': `"${event.etag}"`
    }
  })

  if (response.status === 401) {
    throw new AuthenticationError()
  }
  if (response.status === 404) {
    return
  }
  if (response.status === 412) {
    throw new ConflictError('Event was modified by another client')
  }
  if (!response.ok && response.status !== 204) {
    throw new CalDAVError(`Failed to delete event: ${response.statusText}`, response.status)
  }
}

export async function updateEventOccurrence(
  event: CalendarEvent,
  recurrenceId: string,
  formData: EventFormData
): Promise<void> {
  const updatedICS = addExceptionToICS(event.icsData, recurrenceId, formData)

  const response = await authenticatedFetch(event.href, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'If-Match': `"${event.etag}"`
    },
    body: updatedICS
  })

  if (response.status === 401) throw new AuthenticationError()
  if (response.status === 412) throw new ConflictError('Event was modified by another client', event.etag)
  if (!response.ok && response.status !== 204) {
    throw new CalDAVError(`Failed to update occurrence: ${response.statusText}`, response.status)
  }
}

export async function deleteEventOccurrence(event: CalendarEvent, recurrenceId: string): Promise<void> {
  const updatedICS = addExceptionToICS(event.icsData, recurrenceId)

  const response = await authenticatedFetch(event.href, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'If-Match': `"${event.etag}"`
    },
    body: updatedICS
  })

  if (response.status === 401) throw new AuthenticationError()
  if (response.status === 412) throw new ConflictError('Event was modified by another client', event.etag)
  if (!response.ok && response.status !== 204) {
    throw new CalDAVError(`Failed to delete occurrence: ${response.statusText}`, response.status)
  }
}

export async function updateEventSeries(event: CalendarEvent, formData: EventFormData): Promise<void> {
  const updatedICS = updateSeriesICS(event.icsData, formData)

  const response = await authenticatedFetch(event.href, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'If-Match': `"${event.etag}"`
    },
    body: updatedICS
  })

  if (response.status === 401) throw new AuthenticationError()
  if (response.status === 412) throw new ConflictError('Event was modified by another client', event.etag)
  if (!response.ok && response.status !== 204) {
    throw new CalDAVError(`Failed to update series: ${response.statusText}`, response.status)
  }
}

export async function fetchSingleEvent(href: string): Promise<CalendarEvent | null> {
  const response = await authenticatedFetch(href, {
    method: 'GET',
    headers: {
      Accept: 'text/calendar'
    }
  })

  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new CalDAVError(`Failed to fetch event: ${response.statusText}`, response.status)
  }

  const icsData = await response.text()
  const etag = response.headers.get('ETag')?.replace(/"/g, '') || ''

  const range = { start: new Date(0), end: new Date() }
  const events = parseICS(icsData, href, etag, range)
  return events.length > 0 ? events[0] : null
}
