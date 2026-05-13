import ICAL from 'ical.js'
import type { CalendarEvent, EventFormData, RecurrenceRule } from '../types/calendar'
import type { DateRange } from '../types/calendar'

export function parseICS(icsData: string, href: string, etag: string, _range: DateRange): CalendarEvent[] {
  try {
    const jcalData = ICAL.parse(icsData)
    const comp = new ICAL.Component(jcalData)
    const vevents = comp.getAllSubcomponents('vevent')

    return vevents.map(vevent => {
      const event = new ICAL.Event(vevent)
      const uid = event.uid
      const summary = event.summary || ''
      const description = event.description
      const location = event.location

      const startDate = event.startDate
      const endDate = event.endDate
      const allDay = startDate.isDate

      let start: Date
      let end: Date

      if (allDay) {
        start = startDate.toJSDate()
        end = endDate.toJSDate()
      } else {
        start = startDate.toJSDate()
        end = endDate.toJSDate()
      }

      const rruleRaw = event.recurrenceId ? undefined : (event as unknown as { rrule?: unknown }).rrule
      let recRule: RecurrenceRule | undefined

      if (rruleRaw && typeof rruleRaw === 'object') {
        const rrule = rruleRaw as Record<string, unknown>
        recRule = {
          freq: rrule.freq as string as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
          interval: rrule.interval as number | undefined,
          until: rrule.until ? (rrule.until as { toJSDate(): Date }).toJSDate() : undefined,
          count: rrule.count as number | undefined,
          byDay: rrule.byDay as string[] | undefined,
          byMonthDay: rrule.byMonthDay as number[] | undefined,
          byMonth: rrule.byMonth as number[] | undefined
        }
      }

      return {
        uid,
        calendarHref: '',
        href,
        etag,
        summary,
        start,
        end,
        allDay,
        description,
        location,
        icsData,
        isRecurring: !!rruleRaw,
        rrule: recRule
      }
    })
  } catch {
    return []
  }
}

export function generateICS(formData: EventFormData): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Web App Radicale//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]

  if (formData.allDay) {
    const startStr = formatDateOnly(formData.start)
    const endStr = formatDateOnly(formData.end)
    lines.push(`DTSTART;VALUE=DATE:${startStr}`)
    lines.push(`DTEND;VALUE=DATE:${endStr}`)
  } else {
    lines.push(`DTSTART:${formatDateTime(formData.start)}`)
    lines.push(`DTEND:${formatDateTime(formData.end)}`)
  }

  lines.push(`UID:${formData.uid || generateUID()}`)
  lines.push(`SUMMARY:${escapeICSText(formData.summary)}`)

  if (formData.description) {
    lines.push(`DESCRIPTION:${escapeICSText(formData.description)}`)
  }

  if (formData.location) {
    lines.push(`LOCATION:${escapeICSText(formData.location)}`)
  }

  if (formData.recurrence) {
    const rrule = formData.recurrence
    let rruleStr = `RRULE:FREQ=${rrule.freq}`
    if (rrule.interval) rruleStr += `;INTERVAL=${rrule.interval}`
    if (rrule.until) rruleStr += `;UNTIL=${formatDateTime(rrule.until)}`
    if (rrule.count) rruleStr += `;COUNT=${rrule.count}`
    if (rrule.byDay && rrule.byDay.length > 0) rruleStr += `;BYDAY=${rrule.byDay.join(',')}`
    if (rrule.byMonthDay && rrule.byMonthDay.length > 0) rruleStr += `;BYMONTHDAY=${rrule.byMonthDay.join(',')}`
    if (rrule.byMonth && rrule.byMonth.length > 0) rruleStr += `;BYMONTH=${rrule.byMonth.join(',')}`
    lines.push(rruleStr)
  }

  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

export function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@radicale`
}

export function addExceptionToICS(icsData: string, recurrenceId: string, formData?: EventFormData): string {
  try {
    const jcalData = ICAL.parse(icsData)
    const comp = new ICAL.Component(jcalData)
    const vevent = comp.getFirstSubcomponent('vevent')

    if (!vevent) return icsData

    const recId = ICAL.Time.fromString(recurrenceId, { ical: 'UTC' })
    const exception = new ICAL.Component('VEVENT')

    if (formData) {
      exception.addPropertyWithValue(
        'dtstart',
        formData.allDay ? ICAL.Time.fromJSDate(formData.start, true) : ICAL.Time.fromJSDate(formData.start, false)
      )
      exception.addPropertyWithValue(
        'dtend',
        formData.allDay ? ICAL.Time.fromJSDate(formData.end, true) : ICAL.Time.fromJSDate(formData.end, false)
      )
      exception.addPropertyWithValue('summary', formData.summary)
      if (formData.description) {
        exception.addPropertyWithValue('description', formData.description)
      }
      if (formData.location) {
        exception.addPropertyWithValue('location', formData.location)
      }
    }

    exception.addPropertyWithValue('recurrence-id', recId)
    exception.addPropertyWithValue('uid', vevent.getFirstPropertyValue('uid'))

    comp.addSubcomponent(exception)
    return comp.toString()
  } catch {
    return icsData
  }
}

export function updateSeriesICS(icsData: string, formData: EventFormData): string {
  try {
    const jcalData = ICAL.parse(icsData)
    const comp = new ICAL.Component(jcalData)
    const vevent = comp.getFirstSubcomponent('vevent')

    if (!vevent) return icsData

    if (formData.allDay) {
      vevent.updatePropertyWithValue('dtstart', ICAL.Time.fromJSDate(formData.start, true))
      vevent.updatePropertyWithValue('dtend', ICAL.Time.fromJSDate(formData.end, true))
    } else {
      vevent.updatePropertyWithValue('dtstart', ICAL.Time.fromJSDate(formData.start, false))
      vevent.updatePropertyWithValue('dtend', ICAL.Time.fromJSDate(formData.end, false))
    }

    vevent.updatePropertyWithValue('summary', formData.summary)

    if (formData.description) {
      vevent.updatePropertyWithValue('description', formData.description)
    } else {
      vevent.removeProperty('description')
    }

    if (formData.location) {
      vevent.updatePropertyWithValue('location', formData.location)
    } else {
      vevent.removeProperty('location')
    }

    return comp.toString()
  } catch {
    return icsData
  }
}

function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}`
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function escapeICSText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}
