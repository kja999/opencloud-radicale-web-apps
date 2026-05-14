export interface Calendar {
  href: string
  displayName: string
  color: string
  ctag: string
  description?: string
  visible: boolean
}

export interface CalendarEvent {
  uid: string
  calendarHref: string
  href: string
  etag: string
  summary: string
  start: Date
  end: Date
  allDay: boolean
  description?: string
  location?: string
  icsData?: string
  isRecurring: boolean
  rrule?: RecurrenceRule
  recurrenceId?: string
  color?: string
}

export interface RecurrenceRule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval?: number
  until?: Date
  count?: number
  byDay?: string[]
  byMonthDay?: number[]
  byMonth?: number[]
}

export interface DateRange {
  start: Date
  end: Date
}

export interface EventFormData {
  uid?: string
  summary: string
  start: Date
  end: Date
  allDay: boolean
  description?: string
  location?: string
  color?: string
  calendarHref: string
  recurrence?: RecurrenceRule
}

export interface CreateCalendarData {
  displayName: string
  description?: string
  color?: string
}
