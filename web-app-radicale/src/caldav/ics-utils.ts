import ICAL from 'ical.js'
import type { CalendarEvent, EventFormData, RecurrenceRule } from '../types/calendar'
import type { DateRange } from '../types/calendar'

function createCalendarEvent(
  vevent: ICAL.Component,
  start: Date,
  end: Date,
  allDay: boolean,
  href: string,
  etag: string,
  color?: string,
  rrule?: RecurrenceRule
): CalendarEvent {
  const event = new ICAL.Event(vevent)
  const uid = event.uid
  const summary = event.summary || ''
  const description = event.description
  const location = event.location

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
    color,
    icsData: '',
    isRecurring: !!rrule,
    rrule
  }
}

export function parseICS(icsData: string, href: string, etag: string, range: DateRange): CalendarEvent[] {
  try {
    const jcalData = ICAL.parse(icsData)
    const comp = new ICAL.Component(jcalData)
    const vevents = comp.getAllSubcomponents('vevent')
    const events: CalendarEvent[] = []

    for (const vevent of vevents) {
      try {
        const event = new ICAL.Event(vevent)
        const color = (vevent as ICAL.Component).getFirstPropertyValue('color') as string | undefined
        const allDay = event.startDate.isDate

        const rruleProp = (vevent as ICAL.Component).getFirstProperty('rrule')
        const rruleRaw = rruleProp ? (rruleProp as ICAL.Property).getFirstValue() : null
        let recRule: RecurrenceRule | undefined

        if (rruleRaw && typeof rruleRaw === 'object' && !Array.isArray(rruleRaw)) {
          const rrule = rruleRaw as unknown as Record<string, unknown>
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

        if (recRule && !event.recurrenceId) {
          try {
            const iterator = event.iterator()
            const baseStart = event.startDate
            const baseEnd = event.endDate

            const rangeStartTime = allDay
              ? new ICAL.Time(
                  {
                    year: range.start.getFullYear(),
                    month: range.start.getMonth() + 1,
                    day: range.start.getDate(),
                    isDate: true
                  },
                  null
                )
              : ICAL.Time.fromJSDate(range.start, false)
            const rangeEndTime = allDay
              ? new ICAL.Time(
                  {
                    year: range.end.getFullYear(),
                    month: range.end.getMonth() + 1,
                    day: range.end.getDate(),
                    isDate: true
                  },
                  null
                )
              : ICAL.Time.fromJSDate(range.end, false)

            const maxOccurrences = recRule.count || 1000

            let next: ICAL.Time | null = null
            let foundCount = 0
            let iterations = 0
            const maxIterations = 2000

            while ((next = iterator.next()) && iterations < maxIterations) {
              iterations++
              if (next.compare(rangeStartTime) >= 0 && next.compare(rangeEndTime) <= 0) {
                const occStart = allDay ? new Date(next.year, next.month - 1, next.day) : next.toJSDate()
                const duration = allDay ? 86400000 : baseEnd.toJSDate().getTime() - baseStart.toJSDate().getTime()
                const occEnd = new Date(occStart.getTime() + duration)
                events.push(createCalendarEvent(vevent, occStart, occEnd, allDay, href, etag, color, recRule))
                foundCount++
                if (foundCount >= maxOccurrences) break
              } else if (next.compare(rangeEndTime) > 0) {
                break
              }
            }
            console.log('[parseICS] Recurring expanded:', foundCount, 'events for', href.split('/').pop())
          } catch {
            const startDate = event.startDate
            const endDate = event.endDate
            const start = allDay ? new Date(startDate.year, startDate.month - 1, startDate.day) : startDate.toJSDate()
            const end = allDay ? new Date(endDate.year, endDate.month - 1, endDate.day) : endDate.toJSDate()
            console.log('[parseICS] Recurring fallback - recRule:', !!recRule, 'start:', start.toDateString())
            events.push(createCalendarEvent(vevent, start, end, allDay, href, etag, color, recRule))
          }
        } else {
          const startDate = event.startDate
          const endDate = event.endDate
          const start = allDay ? new Date(startDate.year, startDate.month - 1, startDate.day) : startDate.toJSDate()
          const end = allDay ? new Date(endDate.year, endDate.month - 1, endDate.day) : endDate.toJSDate()
          events.push(createCalendarEvent(vevent, start, end, allDay, href, etag, color, recRule))
        }
      } catch {
        // Skip malformed events
      }
    }

    console.log('[parseICS] Total events created:', events.length, 'from', href.split('/').pop())
    return events
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
    'METHOD:PUBLISH',
    'BEGIN:VEVENT'
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

  if (formData.color) {
    lines.push(`COLOR:${formData.color}`)
  }

  if (formData.recurrence) {
    const rrule = formData.recurrence
    let rruleStr = `RRULE:FREQ=${rrule.freq}`
    if (rrule.interval) rruleStr += `;INTERVAL=${rrule.interval}`
    if (rrule.until) rruleStr += `;UNTIL=${formData.allDay ? formatDateOnly(rrule.until) : formatDateTime(rrule.until)}`
    if (rrule.count) rruleStr += `;COUNT=${rrule.count}`
    if (rrule.byDay && rrule.byDay.length > 0) rruleStr += `;BYDAY=${rrule.byDay.join(',')}`
    if (rrule.byMonthDay && rrule.byMonthDay.length > 0) rruleStr += `;BYMONTHDAY=${rrule.byMonthDay.join(',')}`
    if (rrule.byMonth && rrule.byMonth.length > 0) rruleStr += `;BYMONTH=${rrule.byMonth.join(',')}`
    lines.push(rruleStr)
  }

  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

export function generateUID(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 12)
  const node = 'webapp'
  return `${timestamp}-${random}@${node}`
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
