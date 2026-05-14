import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { useCalendarEvents } from '../../src/composables/calendar/useCalendarEvents'
import type { CalendarEvent, Calendar } from '../../src/types/calendar'

function createMockRefs(
  events: CalendarEvent[],
  calendars: Calendar[],
  currentDate: Date,
  getMondayStart: (date: Date) => Date
) {
  return {
    events: ref(events) as unknown as { value: CalendarEvent[] },
    calendars: ref(calendars) as unknown as { value: Calendar[] },
    currentDate: ref(currentDate) as unknown as { value: Date },
    getMondayStart
  }
}

describe('useCalendarEvents', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 5, 15))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('structure', () => {
    it('returns all expected functions and computed properties', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      expect(typeof env.getEventsForDate).toBe('function')
      expect(env.monthDays).toBeDefined()
      expect(env.weekDaysData).toBeDefined()
      expect(env.dayHours).toBeDefined()
      expect(env.dayAllDayEvents).toBeDefined()
      expect(env.weekAllDayCols).toBeDefined()
      expect(env.weekHours).toBeDefined()
      expect(env.fourWeeksDays).toBeDefined()
      expect(env.scheduleEvents).toBeDefined()
      expect(env.scheduleGroupedEvents).toBeDefined()
      expect(env.yearMonths).toBeDefined()
      expect(env.yearMonthsFormatted).toBeDefined()
    })
  })

  describe('monthDays', () => {
    it('returns 42 days for month view', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      expect(env.monthDays.value).toHaveLength(42)
    })

    it('includes days from previous and next months', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      const prevMonthDays = env.monthDays.value.filter(d => !d.isCurrentMonth)
      expect(prevMonthDays.length).toBeGreaterThan(0)
    })

    it('includes days from current month', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      const currentMonthDays = env.monthDays.value.filter(d => d.isCurrentMonth)
      expect(currentMonthDays.length).toBeGreaterThan(0)
    })
  })

  describe('weekDaysData', () => {
    it('returns 7 days for week', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      expect(env.weekDaysData.value).toHaveLength(7)
    })

    it('starts week on Monday', () => {
      const getMondayStartReal = (d: Date) => {
        const day = d.getDay()
        const diff = day === 0 ? -6 : 1 - day
        const monday = new Date(d)
        monday.setDate(d.getDate() + diff)
        return monday
      }
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), getMondayStartReal)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      expect(env.weekDaysData.value[0].dateObj.getDay()).toBe(1)
    })
  })

  describe('dayHours', () => {
    it('returns 24 hours', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      expect(env.dayHours.value).toHaveLength(24)
    })
  })

  describe('weekAllDayCols', () => {
    it('returns 7 columns for week days', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      expect(env.weekAllDayCols.value).toHaveLength(7)
    })
  })

  describe('weekHours', () => {
    it('returns 24 hour rows', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      expect(env.weekHours.value).toHaveLength(24)
    })

    it('each row has 7 day columns', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      expect(env.weekHours.value[0].dayCols).toHaveLength(7)
    })
  })

  describe('fourWeeksDays', () => {
    it('returns 28 days', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      expect(env.fourWeeksDays.value).toHaveLength(28)
    })
  })

  describe('yearMonths', () => {
    it('returns 12 months', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      expect(env.yearMonths.value).toHaveLength(12)
    })

    it('each month has 42 days', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      env.yearMonths.value.forEach(month => {
        expect(month.days).toHaveLength(42)
      })
    })
  })

  describe('yearMonthsFormatted', () => {
    it('includes formatted month titles', () => {
      const mocks = createMockRefs([], [], new Date(2024, 5, 15), (d: Date) => d)
      const env = useCalendarEvents(mocks.events, mocks.calendars, mocks.currentDate, mocks.getMondayStart)
      expect(env.yearMonthsFormatted.value[0].title).toBe('Jan')
      expect(env.yearMonthsFormatted.value[5].title).toBe('Jun')
    })
  })
})
