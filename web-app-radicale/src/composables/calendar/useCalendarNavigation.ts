import { ref, computed, onMounted, onUnmounted } from 'vue'

export type CalendarViewType = 'year' | 'month' | 'week' | '4weeks' | 'day' | 'schedule'

function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches
}

export function useCalendarNavigation() {
  const currentView = ref<CalendarViewType>(isMobile() ? 'schedule' : 'month')
  const currentDate = ref(new Date())

  function updateViewForScreenSize() {
    if (isMobile() && currentView.value === 'month') {
      currentView.value = 'schedule'
    }
  }

  let resizeTimeout: ReturnType<typeof setTimeout> | null = null
  function handleResize() {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(updateViewForScreenSize, 100)
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize)
    }
    if (resizeTimeout) clearTimeout(resizeTimeout)
  })

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  function getMondayDay(date: Date): number {
    const d = date.getDay()
    return d === 0 ? 6 : d - 1
  }

  function getMondayStart(date: Date): Date {
    const d = new Date(date)
    d.setDate(d.getDate() - getMondayDay(d))
    return d
  }

  const currentTitle = computed(() => {
    const d = currentDate.value
    if (currentView.value === 'month' || currentView.value === 'year') {
      return d.toLocaleDateString('default', { month: 'long', year: 'numeric' })
    } else if (currentView.value === 'week') {
      const start = getMondayStart(d)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else if (currentView.value === 'day') {
      return d.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    } else if (currentView.value === '4weeks') {
      const start = getMondayStart(d)
      const end = new Date(start)
      end.setDate(end.getDate() + 27)
      return `${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else if (currentView.value === 'schedule') {
      const start = new Date()
      const end = new Date()
      end.setDate(end.getDate() + 60)
      return `${start.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return d.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })
  })

  const visibleRange = computed(() => {
    const d = currentDate.value
    if (currentView.value === 'month' || currentView.value === 'year') {
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      return { start, end }
    } else if (currentView.value === 'week') {
      const start = getMondayStart(d)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return { start, end }
    } else if (currentView.value === 'day') {
      const start = new Date(d)
      start.setHours(0, 0, 0, 0)
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    } else if (currentView.value === '4weeks') {
      const start = getMondayStart(d)
      const end = new Date(start)
      end.setDate(end.getDate() + 27)
      return { start, end }
    } else if (currentView.value === 'schedule') {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setDate(end.getDate() + 60)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    const start = new Date(d)
    start.setHours(0, 0, 0, 0)
    const end = new Date(d)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  })

  function prev() {
    const d = new Date(currentDate.value)
    if (currentView.value === 'month' || currentView.value === 'year') d.setMonth(d.getMonth() - 1)
    else if (currentView.value === 'week') d.setDate(d.getDate() - 7)
    else if (currentView.value === 'day') d.setDate(d.getDate() - 1)
    else if (currentView.value === '4weeks') d.setDate(d.getDate() - 28)
    else if (currentView.value === 'schedule') d.setDate(d.getDate() - 30)
    currentDate.value = d
  }

  function next() {
    const d = new Date(currentDate.value)
    if (currentView.value === 'month' || currentView.value === 'year') d.setMonth(d.getMonth() + 1)
    else if (currentView.value === 'week') d.setDate(d.getDate() + 7)
    else if (currentView.value === 'day') d.setDate(d.getDate() + 1)
    else if (currentView.value === '4weeks') d.setDate(d.getDate() + 28)
    else if (currentView.value === 'schedule') d.setDate(d.getDate() + 30)
    currentDate.value = d
  }

  function goToday() {
    currentDate.value = new Date()
  }

  function goToDayView(date: Date) {
    currentDate.value = date
    currentView.value = 'day'
  }

  function goToMonthView(year: number, month: number) {
    currentDate.value = new Date(year, month, 1)
    currentView.value = 'month'
  }

  function goToView(view: CalendarViewType) {
    currentView.value = view
  }

  return {
    currentView,
    currentDate,
    currentTitle,
    visibleRange,
    weekDays,
    prev,
    next,
    goToday,
    goToDayView,
    goToMonthView,
    goToView,
    getMondayStart
  }
}
