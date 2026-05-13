import { CalDAVError, AuthenticationError } from './errors'
import { authenticatedFetch } from './auth'
import type { Calendar } from '../types/calendar'

export interface CreateCalendarData {
  displayName: string
  description?: string
  color?: string
}

export async function createCalendar(
  calendarHomeUrl: string,
  data: CreateCalendarData
): Promise<Calendar> {
  const calendarUrl = calendarHomeUrl + encodeURIComponent(data.displayName) + '/'

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<D:mkcol xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:set>
    <D:prop>
      <D:resourcetype>
        <D:collection />
        <C:calendar />
      </D:resourcetype>
      <D:displayname>${escapeXml(data.displayName)}</D:displayname>
      ${data.description ? `<C:calendar-description>${escapeXml(data.description)}</C:calendar-description>` : ''}
      ${data.color ? `<C:calendar-color>${escapeXml(data.color)}</C:calendar-color>` : ''}
    </D:prop>
  </D:set>
</D:mkcol>`

  const response = await authenticatedFetch(calendarUrl, {
    method: 'MKCOL',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    },
    body
  })

  if (response.status === 401) {
    throw new AuthenticationError()
  }
  if (!response.ok && response.status !== 201) {
    throw new CalDAVError(`Failed to create calendar: ${response.statusText}`, response.status)
  }

  return {
    href: calendarUrl,
    displayName: data.displayName,
    color: data.color || '#3788d8',
    ctag: '',
    description: data.description,
    visible: true
  }
}

export async function deleteCalendar(calendarHref: string): Promise<void> {
  const response = await authenticatedFetch(calendarHref, {
    method: 'DELETE'
  })

  if (response.status === 401) {
    throw new AuthenticationError()
  }
  if (!response.ok && response.status !== 204) {
    throw new CalDAVError(`Failed to delete calendar: ${response.statusText}`, response.status)
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}