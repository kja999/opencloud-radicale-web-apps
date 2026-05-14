<template>
  <div class="cal-root">
    <div class="cal-header">
      <div class="cal-nav-group">
        <button
          v-for="v in ['year', 'month', 'week', '4weeks', 'day', 'schedule']"
          :key="v"
          class="cal-view-btn"
          :class="{ active: currentView === v }"
          @click="currentView = v"
        >
          {{ t(v === '4weeks' ? '4 Weeks' : v.charAt(0).toUpperCase() + v.slice(1)) }}
        </button>
      </div>
      <div class="cal-nav-group">
        <button class="cal-btn" @click="goToday">{{ t('Today') }}</button>
        <button class="cal-btn cal-btn-icon" @click="prev">&larr;</button>
        <span class="cal-title">{{ currentTitle }}</span>
        <button class="cal-btn cal-btn-icon" @click="next">&rarr;</button>
        <button class="cal-btn cal-btn-primary" @click="openNewEvent">+ {{ t('Event') }}</button>
      </div>
    </div>

    <div class="cal-body">
      <main class="cal-main">
        <div v-if="saveError" class="cal-save-error">
          {{ t('Failed to save: ') + saveError }}
          <button class="cal-save-error-dismiss" @click="saveError = null">{{ t('Dismiss') }}</button>
        </div>
        <div v-if="loading" class="cal-loading">{{ t('Loading...') }}</div>

        <div v-else-if="currentView === 'month'" class="cal-month">
          <div class="cal-month-header">
            <div v-for="day in weekDays" :key="day" class="cal-month-header-cell">{{ day }}</div>
          </div>
          <div class="cal-month-grid">
            <div
              v-for="(day, idx) in monthDays"
              :key="idx"
              class="cal-month-cell"
              :class="{ 'other-month': !day.isCurrentMonth }"
            >
              <div class="cal-day-num" :class="{ today: day.isToday }" @click="openNewEvent(day.dateObj)">
                {{ day.date }}
              </div>
              <div
                v-for="event in day.events.slice(0, 3)"
                :key="event.uid"
                class="cal-event-chip"
                :class="{ 'all-day': event.allDay }"
                :style="{
                  backgroundColor: event.allDay ? event.color : event.color + '18',
                  borderLeftColor: event.color
                }"
                @click="openEvent(event)"
              >
                <span v-if="!event.allDay" class="event-time">{{ formatTime(event.start) }}</span>
                <span class="event-title">{{ event.summary }}</span>
              </div>
              <div v-if="day.events.length > 3" class="cal-more">+{{ day.events.length - 3 }} more</div>
            </div>
          </div>
        </div>

        <div v-else-if="currentView === 'week'" class="cal-week">
          <div class="cal-week-header-row">
            <div class="cal-week-time-gutter"></div>
            <div v-for="(day, idx) in weekDaysData" :key="idx" class="cal-week-day-header">
              <span :class="{ today: day.isToday }">{{ weekDays[idx] }} {{ day.date }}</span>
            </div>
          </div>
          <div v-if="weekAllDayCols.some(col => col.length > 0)" class="cal-week-allday-row">
            <div class="cal-week-time-gutter"></div>
            <div v-for="(dayAlldayEvents, dayIdx) in weekAllDayCols" :key="dayIdx" class="cal-week-allday-cell">
              <div
                v-for="event in dayAlldayEvents"
                :key="event.uid"
                class="cal-event-chip all-day"
                :style="{ backgroundColor: event.color, borderLeftColor: event.color }"
                @click="openEvent(event)"
              >
                <span class="event-title">{{ event.summary }}</span>
              </div>
            </div>
          </div>
          <div class="cal-week-body">
            <div v-for="slot in weekHours" :key="slot.hour" class="cal-week-hour-row">
              <div class="cal-week-time-gutter">{{ slot.hour.toString().padStart(2, '0') }}:00</div>
              <div v-for="(col, idx) in slot.dayCols" :key="idx" class="cal-week-cell">
                <div
                  v-for="event in col.events"
                  :key="event.uid"
                  class="cal-event-chip"
                  :style="{
                    backgroundColor: event.color + '18',
                    borderLeftColor: event.color
                  }"
                  @click="openEvent(event)"
                >
                  <span class="event-time">{{ formatTime(event.start) }}</span>
                  <span class="event-title">{{ event.summary }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="currentView === 'list'" class="cal-list">
          <div v-for="event in allEvents" :key="event.uid" class="cal-list-item" @click="openEvent(event)">
            <span class="cal-dot" :style="{ backgroundColor: event.color }"></span>
            <div class="cal-list-item-content">
              <strong>{{ event.summary }}</strong>
              <span v-if="event.isRecurring" class="cal-recurring-badge" :title="t('Recurring event')">↻</span>
              <span class="cal-list-date">
                {{ formatDate(event.start) }}
                {{ event.allDay ? t('All Day') : formatTime(event.start) + ' - ' + formatTime(event.end) }}
              </span>
            </div>
          </div>
          <div v-if="allEvents.length === 0" class="cal-empty">{{ t('No events') }}</div>
        </div>

        <div v-else-if="currentView === 'day'" class="cal-day">
          <div class="cal-day-header">
            {{ currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' }) }}
          </div>
          <div v-if="dayAllDayEvents.length > 0" class="cal-day-allday">
            <div
              v-for="event in dayAllDayEvents"
              :key="event.uid"
              class="cal-event-chip all-day"
              :style="{ backgroundColor: event.color, borderLeftColor: event.color }"
              @click="openEvent(event)"
            >
              <span class="event-title">{{ event.summary }}</span>
            </div>
          </div>
          <div class="cal-day-hours">
            <div v-for="slot in dayHours" :key="slot.hour" class="cal-day-hour-row">
              <div class="cal-day-hour-label">{{ slot.hour.toString().padStart(2, '0') }}:00</div>
              <div class="cal-day-hour-events">
                <div
                  v-for="event in slot.events"
                  :key="event.uid"
                  class="cal-event-chip"
                  :style="{
                    backgroundColor: event.color + '18',
                    borderLeftColor: event.color
                  }"
                  @click="openEvent(event)"
                >
                  <span class="event-time">{{ formatTime(event.start) }}</span>
                  <span class="event-title">{{ event.summary }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="currentView === '4weeks'" class="cal-4weeks">
          <div class="cal-4weeks-header">
            <div v-for="day in weekDays" :key="day" class="cal-4weeks-header-cell">{{ day }}</div>
          </div>
          <div class="cal-4weeks-grid">
            <div
              v-for="(day, idx) in fourWeeksDays"
              :key="idx"
              class="cal-4weeks-cell"
              :class="{ 'other-month': day.dateObj.getMonth() !== currentDate.getMonth() }"
            >
              <div class="cal-day-num" :class="{ today: day.isToday }" @click="openNewEvent(day.dateObj)">
                {{ day.date }}
              </div>
              <div
                v-for="event in day.events.slice(0, 2)"
                :key="event.uid"
                class="cal-event-chip"
                :class="{ 'all-day': event.allDay }"
                :style="{
                  backgroundColor: event.allDay ? event.color : event.color + '18',
                  borderLeftColor: event.color
                }"
                @click="openEvent(event)"
              >
                <span v-if="!event.allDay" class="event-time">{{ formatTime(event.start) }}</span>
                <span class="event-title">{{ event.summary }}</span>
              </div>
              <div v-if="day.events.length > 2" class="cal-more">+{{ day.events.length - 2 }}</div>
            </div>
          </div>
        </div>

        <div v-else-if="currentView === 'schedule'" class="cal-schedule">
          <div class="cal-schedule-header">
            {{ t('Next 60 days') }}
          </div>
          <template v-for="group in scheduleGroupedEvents" :key="group.dateStr">
            <div class="cal-schedule-date-header" @click="goToDayView(group.dateObj)">
              <span class="cal-schedule-day-num">{{ group.dayNum }}</span>
              <span class="cal-schedule-month">{{ group.monthStr }}</span>
              <span class="cal-schedule-weekday">{{ group.weekdayStr }}</span>
            </div>
            <div
              v-for="event in group.events"
              :key="event.uid + event.start.getTime()"
              class="cal-schedule-item"
              @click="openEvent(event)"
            >
              <span class="cal-dot" :style="{ backgroundColor: event.color }"></span>
              <span class="cal-schedule-time">{{
                event.allDay ? t('All Day') : formatTime(event.start) + (event.end ? ' - ' + formatTime(event.end) : '')
              }}</span>
              <strong class="cal-schedule-title">{{ event.summary }}</strong>
              <span v-if="event.isRecurring" class="cal-recurring-badge" :title="t('Recurring event')">↻</span>
            </div>
          </template>
          <div v-if="scheduleEvents.length === 0" class="cal-empty">{{ t('No events') }}</div>
        </div>

        <div v-else-if="currentView === 'year'" class="cal-year">
          <div class="cal-year-grid">
            <div v-for="(month, idx) in yearMonths" :key="idx" class="cal-year-month">
              <div
                class="cal-year-month-title"
                @click="goToMonthView(month.year, month.month)"
              >
                {{ new Date(month.year, month.month, 1).toLocaleDateString('default', { month: 'short' }) }}
              </div>
              <div class="cal-year-month-grid">
                <div
                  v-for="(day, dayIdx) in month.days"
                  :key="dayIdx"
                  class="cal-year-day"
                  :class="{ 'other-month': !day.isCurrentMonth, today: day.isToday }"
                  @click="openNewEvent(day.dateObj)"
                >
                  {{ day.date }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <EventModal
      v-if="showEventModal"
      :event="selectedEvent"
      :calendar-href="selectedCalendar"
      :initial-date="prefillDate"
      @close="closeEventModal"
      @save="saveEvent"
      @delete="deleteEvent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getCalDAVClient } from '../caldav/client'
import type { Calendar, CalendarEvent, EventFormData } from '../types/calendar'
import { t as translate } from '../composables/useLanguage'
import EventModal from '../components/calendar/EventModal.vue'

const t = translate

const client = getCalDAVClient()

const calendars = ref<Calendar[]>([])
const events = ref<CalendarEvent[]>([])
const loading = ref(true)
const error = ref(false)
const saveError = ref<string | null>(null)
const currentView = ref('month')
const currentDate = ref(new Date())
const showEventModal = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)
const selectedCalendar = ref('')
const prefillDate = ref<Date | undefined>(undefined)

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

const fetchRange = computed(() => {
  const range = visibleRange.value
  const start = new Date(range.start)
  start.setMonth(start.getMonth() - 1)
  const end = new Date(range.end)
  end.setMonth(end.getMonth() + 3)
  return { start, end }
})

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
  let currentGroup: {
    dateStr: string
    dateObj: Date
    dayNum: number
    monthStr: string
    weekdayStr: string
    events: CalendarEvent[]
  } | null = null
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

const allEvents = computed(() => {
  const d = currentDate.value
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)

  const visibleCalendars = calendars.value.filter(c => c.visible)
  const filtered = events.value
    .filter(e => visibleCalendars.some(c => c.href === e.calendarHref))
    .filter(e => e.start >= start && e.start <= end)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  console.log('[CalendarView] allEvents:', filtered.length, 'from', events.value.length, 'total')
  return filtered
})

function getEventsForDate(date: Date): CalendarEvent[] {
  const dateMs = date.getTime()
  const visibleCalendars = calendars.value.filter(c => c.visible)
  const filtered = events.value
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
  return filtered
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })
}

async function loadData(range?: { start: Date; end: Date }) {
  const fetchRange =
    range ||
    (() => {
      const start = new Date()
      start.setMonth(start.getMonth() - 3)
      const end = new Date()
      end.setMonth(end.getMonth() + 9)
      return { start, end }
    })()

  isFetching = true
  loading.value = true
  error.value = false
  try {
    if (calendars.value.length === 0) {
      calendars.value = await client.discoverCalendars()
    }
    const newEvents = await client.fetchAllEvents(calendars.value, fetchRange)

    const existingMap = new Map<string, CalendarEvent>()
    for (const e of events.value) {
      const key = e.isRecurring ? `${e.href}_${e.start.getTime()}` : e.href
      existingMap.set(key, e)
    }
    for (const e of newEvents) {
      const key = e.isRecurring ? `${e.href}_${e.start.getTime()}` : e.href
      existingMap.set(key, e)
    }
    const mergedEvents = Array.from(existingMap.values())
    console.log('[CalendarView] Merged events count:', mergedEvents.length)
    events.value = mergedEvents
  } catch (e) {
    console.error('Failed to load calendars:', e)
    error.value = true
  } finally {
    loading.value = false
    isFetching = false
    lastFetchKey = `${fetchRange.start.toISOString()}-${fetchRange.end.toISOString()}`
  }
}

let lastFetchKey = ''
let isFetching = false

watch(
  fetchRange,
  newRange => {
    const key = `${newRange.start.toISOString()}-${newRange.end.toISOString()}`
    if (key !== lastFetchKey && !isFetching) {
      lastFetchKey = key
      loadData(newRange)
    }
  },
  { immediate: true }
)

onMounted(() => {
  lastFetchKey = `${fetchRange.value.start.toISOString()}-${fetchRange.value.end.toISOString()}`
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

function openNewEvent(date?: Date) {
  selectedEvent.value = null
  selectedCalendar.value = calendars.value[0]?.href || ''
  prefillDate.value = date
  showEventModal.value = true
}

function openEvent(event: CalendarEvent) {
  selectedEvent.value = event
  selectedCalendar.value = event.calendarHref
  showEventModal.value = true
}

function closeEventModal() {
  showEventModal.value = false
  selectedEvent.value = null
  prefillDate.value = undefined
}

async function saveEvent(formData: EventFormData, scope?: 'single' | 'future' | 'all') {
  try {
    if (selectedEvent.value) {
      if (selectedEvent.value.isRecurring && scope) {
        if (scope === 'single') {
          const recId = selectedEvent.value.start
            .toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d{3}/, '')
          await client.updateEventOccurrence(selectedEvent.value, recId, formData)
        } else if (scope === 'future') {
          await client.updateEventSeries(selectedEvent.value, formData)
        } else {
          await client.updateEvent(selectedEvent.value, formData)
        }
      } else {
        await client.updateEvent(selectedEvent.value, formData)
      }
    } else {
      await client.createEvent({ ...formData, calendarHref: selectedCalendar.value })
    }
    await loadData(fetchRange.value)
    closeEventModal()
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : String(e)
    console.error('Failed to save event:', e)
  }
}

async function deleteEvent(event: CalendarEvent) {
  try {
    await client.deleteEvent(event)
    await loadData(fetchRange.value)
    closeEventModal()
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : String(e)
    console.error('Failed to delete event:', e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.cal-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: inherit;
  color: var(--oc-role-on-surface, #191c1d);
  background: var(--oc-role-surface, #ffffff);
}
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  flex-wrap: wrap;
  gap: 8px;
}
.cal-nav-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cal-title {
  font-size: 1.1em;
  font-weight: 600;
  min-width: 180px;
  text-align: center;
}
.cal-btn {
  padding: 6px 12px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  background: var(--oc-role-surface, #ffffff);
  cursor: pointer;
  font-size: 0.85em;
  color: var(--oc-role-on-surface, #191c1d);
}
.cal-btn:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.cal-btn-icon {
  padding: 6px 10px;
  font-size: 1em;
}
.cal-btn-primary {
  background: var(--oc-role-primary, #00677f);
  color: var(--oc-role-on-primary, #ffffff);
  border-color: var(--oc-role-primary, #00677f);
}
.cal-btn-primary:hover {
  background: #004d5e;
}
.cal-view-btn {
  padding: 6px 12px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  background: var(--oc-role-surface, #ffffff);
  cursor: pointer;
  font-size: 0.85em;
  color: var(--oc-role-on-surface, #191c1d);
}
.cal-view-btn.active {
  background: var(--oc-role-primary, #00677f);
  color: var(--oc-role-on-primary, #ffffff);
  border-color: var(--oc-role-primary, #00677f);
}
.cal-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.cal-main {
  flex: 1;
  overflow: auto;
  padding: 12px;
}
.cal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.cal-month {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.cal-month-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-month-header-cell {
  padding: 8px 4px;
  text-align: center;
  font-size: 0.8em;
  font-weight: 600;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.cal-month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  border-left: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-month-cell {
  min-height: 90px;
  padding: 4px;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-month-cell.other-month {
  background: var(--oc-role-surface-container, #f6f8fa);
}
.cal-day-num {
  font-size: 0.8em;
  margin-bottom: 2px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cal-day-num.today {
  background: var(--oc-role-primary, #00677f);
  color: var(--oc-role-on-primary, #ffffff);
  border-radius: 50%;
}
.cal-event-chip {
  font-size: 0.75em;
  padding: 2px 4px;
  margin-bottom: 2px;
  border-left: 3px solid;
  border-radius: 2px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}
.cal-event-chip:hover {
  opacity: 0.85;
}
.cal-event-chip.all-day {
  white-space: normal;
  font-weight: 500;
}
.event-time {
  font-size: 0.85em;
  opacity: 0.8;
  flex-shrink: 0;
}
.event-title {
  overflow: hidden;
  text-overflow: ellipsis;
}
.cal-more {
  font-size: 0.7em;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.cal-week {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.cal-week-header-row {
  display: flex;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-week-day-header {
  flex: 1;
  padding: 8px 4px;
  text-align: center;
  font-size: 0.75em;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-week-day-header span.today {
  background: var(--oc-role-primary, #0061a5);
  color: var(--oc-role-on-primary, #ffffff);
  border-radius: 4px;
  padding: 2px 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.cal-week-allday-row {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.cal-week-time-gutter {
  width: 60px;
  flex-shrink: 0;
  padding: 4px 8px;
  font-size: 0.7em;
  color: var(--oc-role-on-surface-variant, #40484c);
  text-align: right;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-week-allday-cell {
  padding: 4px;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  min-height: 24px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cal-week-body {
  flex: 1;
  overflow-y: auto;
}
.cal-week-hour-row {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  min-height: 48px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-week-cell {
  flex: 1;
  padding: 4px;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-list {
  max-width: 600px;
}
.cal-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  cursor: pointer;
}
.cal-list-item:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.cal-list-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cal-list-date {
  font-size: 0.8em;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.cal-recurring-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  color: var(--oc-role-primary, #0061a5);
  font-size: 0.9em;
}
.cal-empty {
  text-align: center;
  padding: 48px 16px;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.cal-save-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  margin: 12px;
  background: color-mix(in srgb, var(--oc-role-error-container, #ffdad6) 15%, transparent);
  border: 1px solid var(--oc-role-error, #ba1a1a);
  border-radius: 4px;
  color: var(--oc-role-error, #ba1a1a);
  font-size: 0.85rem;
}
.cal-save-error-dismiss {
  padding: 4px 12px;
  border: 1px solid var(--oc-role-error, #ba1a1a);
  border-radius: 4px;
  background: transparent;
  color: var(--oc-role-error, #ba1a1a);
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}
.cal-save-error-dismiss:hover {
  background: var(--oc-role-error, #ba1a1a);
  color: var(--oc-role-on-error, #ffffff);
}
.cal-day {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.cal-day-header {
  padding: 12px 16px;
  font-size: 1.1em;
  font-weight: 600;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-day-allday {
  padding: 8px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.cal-day-hours {
  flex: 1;
  overflow-y: auto;
}
.cal-day-hour-row {
  display: flex;
  min-height: 48px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-day-hour-label {
  width: 60px;
  padding: 4px 8px;
  font-size: 0.75em;
  color: var(--oc-role-on-surface-variant, #40484c);
  text-align: right;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  flex-shrink: 0;
}
.cal-day-hour-events {
  flex: 1;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cal-4weeks {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.cal-4weeks-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-4weeks-header-cell {
  padding: 8px;
  text-align: center;
  font-size: 0.75em;
  font-weight: 600;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.cal-4weeks-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
}
.cal-4weeks-cell {
  min-height: 70px;
  padding: 4px;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-4weeks-cell.other-month {
  background: var(--oc-role-surface-container, #f6f8fa);
}
.cal-schedule {
  max-width: 700px;
}
.cal-schedule-header {
  padding: 12px 16px;
  font-size: 1em;
  font-weight: 600;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.cal-schedule-date-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--oc-role-surface-container-low, #fbfcfe);
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  cursor: pointer;
  font-weight: 600;
}
.cal-schedule-date-header:hover {
  background: var(--oc-role-surface-container, #f6f8fa);
}
.cal-schedule-day-num {
  font-size: 1.5em;
  color: var(--oc-role-primary, #0061a5);
}
.cal-schedule-month {
  font-size: 0.85em;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.cal-schedule-weekday {
  font-size: 0.75em;
  color: var(--oc-role-on-surface-variant, #40484c);
  margin-left: auto;
}
.cal-schedule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  cursor: pointer;
}
.cal-schedule-item:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.cal-schedule-time {
  min-width: 120px;
  font-size: 0.8em;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.cal-schedule-title {
  flex: 1;
  font-size: 0.9em;
}
.cal-year {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}
.cal-year-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.cal-year-month {
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  padding: 8px;
}
.cal-year-month-title {
  text-align: center;
  font-size: 0.85em;
  font-weight: 600;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
}
.cal-year-month-title:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.cal-year-month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}
.cal-year-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65em;
  cursor: pointer;
  border-radius: 50%;
}
.cal-year-day:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.cal-year-day.other-month {
  color: var(--oc-role-on-surface-variant, #40484c);
  opacity: 0.5;
}
.cal-year-day.today {
  background: var(--oc-role-primary, #0061a5);
  color: var(--oc-role-on-primary, #ffffff);
}
</style>
