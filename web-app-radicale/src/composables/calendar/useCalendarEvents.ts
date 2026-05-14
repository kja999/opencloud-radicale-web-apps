import { computed } from 'vue'
import type { Calendar, CalendarEvent } from '../../types/calendar'

export function useCalendarEvents(
  events: { value: CalendarEvent[] },
  calendars: { value: Calendar[] },
  currentDate: { value: Date },
  getMondayStart: (date: Date) => Date
) {
  function getEventsForDate(date: Date): CalendarEvent[] {
    const dateMs = date.getTime()
    const visibleCalendars = calendars.value.filter(c => c.visible)
    return events.value
      .filter(e => visibleCalendars.some(c => c.href === e.calendarHref))
      .filter(e => {
        if (e.allDay) {
          return dateMs >= e.start.getTime() && dateMs < e.end.getTime()
        }
        return date.toDateString() === e.start.toDateString()
      })
      .map(e => ({
        ...e,
        color: e.color || calendars.value.find(c => c.href === e.calendarHref)?.color || '#3788d8'
      }))
  }

  const monthDays = computed(() => {
    const d = new Date(currentDate.value)
    const year = d.getFullYear()
    const month = d.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Array<{
      date: number
      dateObj: Date
      isCurrentMonth: boolean
      isToday: boolean
      events: CalendarEvent[]
    }> = []

    const startDayOffset = (firstDay.getDay() + 6) % 7
    for (let i = startDayOffset; i >= 1; i--) {
      const date = new Date(year, month, -i + 1)
      days.push({
        date: date.getDate(),
        dateObj: date,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(date)
      })
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      const today = new Date()
      days.push({
        date: i,
        dateObj: date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        events: getEventsForDate(date)
      })
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date: i, dateObj: date, isCurrentMonth: false, isToday: false, events: getEventsForDate(date) })
    }

    return days
  })

  const weekDaysData = computed(() => {
    const d = new Date(currentDate.value)
    const start = getMondayStart(d)
    const days: Array<{ date: number; dateObj: Date; isToday: boolean; events: CalendarEvent[] }> = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      const today = new Date()
      days.push({
        date: date.getDate(),
        dateObj: date,
        isToday: date.toDateString() === today.toDateString(),
        events: getEventsForDate(date)
      })
    }

    return days
  })

  const dayHours = computed(() => {
    const d = currentDate.value
    const hours: Array<{ hour: number; events: CalendarEvent[] }> = []
    for (let h = 0; h < 24; h++) {
      const hourStart = new Date(d)
      hourStart.setHours(h, 0, 0, 0)
      const hourEnd = new Date(d)
      hourEnd.setHours(h, 59, 59, 999)
      const hourEvents = events.value
        .filter(e => {
          const visibleCalendars = calendars.value.filter(c => c.visible)
          if (!visibleCalendars.some(c => c.href === e.calendarHref)) return false
          if (e.allDay) return false
          return e.start < hourEnd && e.end > hourStart
        })
        .map(e => ({
          ...e,
          color: e.color || calendars.value.find(c => c.href === e.calendarHref)?.color || '#3788d8'
        }))
      hours.push({ hour: h, events: hourEvents })
    }
    return hours
  })

  const dayAllDayEvents = computed(() => {
    const d = currentDate.value
    const dateMs = d.getTime()
    const visibleCalendars = calendars.value.filter(c => c.visible)
    return events.value
      .filter(e => visibleCalendars.some(c => c.href === e.calendarHref))
      .filter(e => e.allDay && dateMs >= e.start.getTime() && dateMs < e.end.getTime())
      .map(e => ({
        ...e,
        color: e.color || calendars.value.find(c => c.href === e.calendarHref)?.color || '#3788d8'
      }))
  })

  const weekAllDayCols = computed(() => {
    const d = currentDate.value
    const start = getMondayStart(d)
    const cols: Array<CalendarEvent[]> = []
    const visibleCalendars = calendars.value.filter(c => c.visible)
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(start)
      dayDate.setDate(start.getDate() + i)
      const dayMs = dayDate.getTime()
      const dayEvents = events.value
        .filter(e => visibleCalendars.some(c => c.href === e.calendarHref))
        .filter(e => e.allDay)
        .filter(e => dayMs >= e.start.getTime() && dayMs < e.end.getTime())
        .map(e => ({
          ...e,
          color: e.color || calendars.value.find(c => c.href === e.calendarHref)?.color || '#3788d8'
        }))
      cols.push(dayEvents)
    }
    return cols
  })

  const weekHours = computed(() => {
    const d = currentDate.value
    const start = getMondayStart(d)
    const days: Array<{ date: number; dateObj: Date; isToday: boolean; events: CalendarEvent[] }> = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      days.push({
        date: date.getDate(),
        dateObj: date,
        isToday: date.toDateString() === new Date().toDateString(),
        events: getEventsForDate(date)
      })
    }

    const hours: Array<{ hour: number; dayCols: Array<{ day: (typeof days)[0]; events: CalendarEvent[] }> }> = []
    for (let h = 0; h < 24; h++) {
      const dayCols = days.map(day => {
        const hourStart = new Date(day.dateObj)
        hourStart.setHours(h, 0, 0, 0)
        const hourEnd = new Date(day.dateObj)
        hourEnd.setHours(h, 59, 59, 999)
        const hourEvents = events.value
          .filter(e => {
            const visibleCalendars = calendars.value.filter(c => c.visible)
            if (!visibleCalendars.some(c => c.href === e.calendarHref)) return false
            if (e.allDay) return false
            return e.start < hourEnd && e.end > hourStart
          })
          .map(e => ({
            ...e,
            color: e.color || calendars.value.find(c => c.href === e.calendarHref)?.color || '#3788d8'
          }))
        return { day, events: hourEvents }
      })
      hours.push({ hour: h, dayCols })
    }
    return hours
  })

  const fourWeeksDays = computed(() => {
    const d = currentDate.value
    const start = getMondayStart(d)
    const days: Array<{ date: number; dateObj: Date; isToday: boolean; events: CalendarEvent[] }> = []
    for (let i = 0; i < 28; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      const today = new Date()
      days.push({
        date: date.getDate(),
        dateObj: date,
        isToday: date.toDateString() === today.toDateString(),
        events: getEventsForDate(date)
      })
    }
    return days
  })

  const scheduleEvents = computed(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setDate(end.getDate() + 60)
    end.setHours(23, 59, 59, 999)
    const visibleCalendars = calendars.value.filter(c => c.visible)
    return events.value
      .filter(e => visibleCalendars.some(c => c.href === e.calendarHref))
      .filter(e => e.start >= start && e.start <= end)
      .sort((a, b) => {
        const dateDiff = a.start.toDateString().localeCompare(b.start.toDateString())
        if (dateDiff !== 0) return dateDiff
        return a.summary.localeCompare(b.summary)
      })
  })

  const scheduleGroupedEvents = computed(() => {
    const groups: Array<{
      dateStr: string
      dateObj: Date
      dayNum: number
      monthStr: string
      weekdayStr: string
      events: CalendarEvent[]
    }> = []
    let currentDate = ''
    let currentGroup: (typeof groups)[0] | null = null
    for (const event of scheduleEvents.value) {
      const dateStr = event.start.toDateString()
      if (dateStr !== currentDate) {
        if (currentGroup) groups.push(currentGroup)
        currentDate = dateStr
        const d = event.start
        currentGroup = {
          dateStr,
          dateObj: new Date(d),
          dayNum: d.getDate(),
          monthStr: d.toLocaleDateString('default', { month: 'short' }),
          weekdayStr: d.toLocaleDateString('default', { weekday: 'short' }),
          events: []
        }
      }
      currentGroup!.events.push(event)
    }
    if (currentGroup) groups.push(currentGroup)
    return groups
  })

  const yearMonths = computed(() => {
    const d = currentDate.value
    const months: Array<{
      month: number
      year: number
      days: Array<{ date: number; dateObj: Date; isCurrentMonth: boolean; isToday: boolean; events: CalendarEvent[] }>
    }> = []
    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(d.getFullYear(), m, 1)
      const lastDay = new Date(d.getFullYear(), m + 1, 0)
      const days: Array<{
        date: number
        dateObj: Date
        isCurrentMonth: boolean
        isToday: boolean
        events: CalendarEvent[]
      }> = []
      const startDayOffset = (firstDay.getDay() + 6) % 7
      for (let i = startDayOffset; i >= 1; i--) {
        const date = new Date(d.getFullYear(), m, -i + 1)
        days.push({
          date: date.getDate(),
          dateObj: date,
          isCurrentMonth: false,
          isToday: false,
          events: getEventsForDate(date)
        })
      }
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(d.getFullYear(), m, i)
        const today = new Date()
        days.push({
          date: i,
          dateObj: date,
          isCurrentMonth: true,
          isToday: date.toDateString() === today.toDateString(),
          events: getEventsForDate(date)
        })
      }
      const remaining = 42 - days.length
      for (let i = 1; i <= remaining; i++) {
        const date = new Date(d.getFullYear(), m + 1, i)
        days.push({ date: i, dateObj: date, isCurrentMonth: false, isToday: false, events: getEventsForDate(date) })
      }
      months.push({ month: m, year: d.getFullYear(), days })
    }
    return months
  })

  const yearMonthsFormatted = computed(() =>
    yearMonths.value.map(m => ({
      year: m.year,
      month: m.month,
      title: new Date(m.year, m.month, 1).toLocaleDateString('default', { month: 'short' }),
      days: m.days.map(d => ({
        date: d.date,
        dateObj: d.dateObj,
        isCurrentMonth: d.isCurrentMonth,
        isToday: d.isToday
      }))
    }))
  )

  return {
    getEventsForDate,
    monthDays,
    weekDaysData,
    dayHours,
    dayAllDayEvents,
    weekAllDayCols,
    weekHours,
    fourWeeksDays,
    scheduleEvents,
    scheduleGroupedEvents,
    yearMonths,
    yearMonthsFormatted
  }
}
