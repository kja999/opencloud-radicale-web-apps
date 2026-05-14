import { describe, it, expect } from 'vitest'
import { useCalendarNavigation } from '../../src/composables/calendar/useCalendarNavigation'

describe('useCalendarNavigation', () => {
  const {
    currentView,
    currentDate,
    weekDays,
    goToView,
    goToday,
    goToDayView,
    goToMonthView,
    prev,
    next,
    getMondayStart
  } = useCalendarNavigation()

  it('initializes with default view month', () => {
    expect(currentView.value).toBe('month')
  })

  it('initializes with current date', () => {
    const now = new Date()
    expect(currentDate.value.getDate()).toBe(now.getDate())
  })

  it('has week days starting with Monday', () => {
    expect(weekDays).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  })

  it('getMondayStart returns Monday for given date', () => {
    const wednesday = new Date(2024, 0, 10)
    const monday = getMondayStart(wednesday)
    expect(monday.getDay()).toBe(1)
    expect(monday.getDate()).toBe(8)
  })

  it('getMondayStart returns same day for Monday', () => {
    const monday = new Date(2024, 0, 8)
    const result = getMondayStart(monday)
    expect(result.getDate()).toBe(8)
  })

  it('getMondayStart returns previous Monday for Sunday', () => {
    const sunday = new Date(2024, 0, 14)
    const monday = getMondayStart(sunday)
    expect(monday.getDate()).toBe(8)
  })

  it('goToView changes currentView', () => {
    goToView('week')
    expect(currentView.value).toBe('week')
    goToView('day')
    expect(currentView.value).toBe('day')
    goToView('year')
    expect(currentView.value).toBe('year')
  })

  it('goToday sets currentDate to today', () => {
    goToday()
    const now = new Date()
    expect(currentDate.value.toDateString()).toBe(now.toDateString())
  })

  it('goToDayView sets date and view', () => {
    const date = new Date(2024, 5, 15)
    goToDayView(date)
    expect(currentDate.value.getFullYear()).toBe(2024)
    expect(currentDate.value.getMonth()).toBe(5)
    expect(currentDate.value.getDate()).toBe(15)
    expect(currentView.value).toBe('day')
  })

  it('goToMonthView sets date and view', () => {
    goToMonthView(2024, 9)
    expect(currentDate.value.getFullYear()).toBe(2024)
    expect(currentDate.value.getMonth()).toBe(9)
    expect(currentView.value).toBe('month')
  })

  it('prev navigates backward by month for month view', () => {
    currentView.value = 'month'
    currentDate.value = new Date(2024, 5, 15)
    prev()
    expect(currentDate.value.getMonth()).toBe(4)
  })

  it('prev navigates backward by week for week view', () => {
    currentView.value = 'week'
    currentDate.value = new Date(2024, 5, 15)
    prev()
    expect(currentDate.value.getDate()).toBe(8)
  })

  it('prev navigates backward by day for day view', () => {
    currentView.value = 'day'
    currentDate.value = new Date(2024, 5, 15)
    prev()
    expect(currentDate.value.getDate()).toBe(14)
  })

  it('next navigates forward by month for month view', () => {
    currentView.value = 'month'
    currentDate.value = new Date(2024, 5, 15)
    next()
    expect(currentDate.value.getMonth()).toBe(6)
  })

  it('next navigates forward by week for week view', () => {
    currentView.value = 'week'
    currentDate.value = new Date(2024, 5, 15)
    next()
    expect(currentDate.value.getDate()).toBe(22)
  })

  it('next navigates forward by day for day view', () => {
    currentView.value = 'day'
    currentDate.value = new Date(2024, 5, 15)
    next()
    expect(currentDate.value.getDate()).toBe(16)
  })

  it('prev navigates by 28 days for 4weeks view', () => {
    currentView.value = '4weeks'
    currentDate.value = new Date(2024, 5, 15)
    prev()
    expect(currentDate.value.getDate()).toBe(18)
  })

  it('prev navigates by 30 days for schedule view', () => {
    currentView.value = 'schedule'
    currentDate.value = new Date(2024, 5, 15)
    prev()
    expect(currentDate.value.getDate()).toBe(16)
  })
})
