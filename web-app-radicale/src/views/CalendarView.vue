<template>
  <div class="cal-root">
    <div class="cal-header">
      <div class="cal-nav-group">
        <button
          v-for="v in ['year', 'month', 'week', '4weeks', 'day', 'schedule']"
          :key="v"
          class="cal-view-btn"
          :class="{ active: currentView === v }"
          @click="goToView(v as CalendarViewType)"
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

        <MonthView
          v-else-if="currentView === 'month'"
          :days="monthDays"
          :week-days="weekDays"
          @open-event="openEvent"
          @new-event="openNewEvent"
        />

        <WeekView
          v-else-if="currentView === 'week'"
          :week-days-data="weekDaysData"
          :week-days="weekDays"
          :all-day-cols="weekAllDayCols"
          :hour-slots="weekHours"
          @open-event="openEvent"
        />

        <DayView
          v-else-if="currentView === 'day'"
          :day-title="currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })"
          :all-day-events="dayAllDayEvents"
          :hour-slots="dayHours"
          @open-event="openEvent"
        />

        <FourWeeksView
          v-else-if="currentView === '4weeks'"
          :days="fourWeeksDays"
          :week-days="weekDays"
          :current-month="currentDate.getMonth()"
          @open-event="openEvent"
          @new-event="openNewEvent"
        />

        <ScheduleView
          v-else-if="currentView === 'schedule'"
          :header-title="t('Next 60 days')"
          :grouped-events="scheduleGroupedEvents"
          :events="scheduleEvents"
          @open-event="openEvent"
          @go-to-day="goToDayView"
        />

        <YearView
          v-else-if="currentView === 'year'"
          :months="yearMonthsFormatted"
          @go-to-month="goToMonthView"
          @new-event="openNewEvent"
        />
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
import { useCalendarNavigation, type CalendarViewType } from '../composables/calendar/useCalendarNavigation'
import { useCalendarEvents } from '../composables/calendar/useCalendarEvents'
import MonthView from '../components/calendar/views/MonthView.vue'
import WeekView from '../components/calendar/views/WeekView.vue'
import DayView from '../components/calendar/views/DayView.vue'
import FourWeeksView from '../components/calendar/views/FourWeeksView.vue'
import ScheduleView from '../components/calendar/views/ScheduleView.vue'
import YearView from '../components/calendar/views/YearView.vue'

const t = translate

const client = getCalDAVClient()

const {
  currentView,
  currentDate,
  currentTitle,
  weekDays,
  prev,
  next,
  goToday,
  goToDayView,
  goToMonthView,
  goToView,
  getMondayStart,
  visibleRange
} = useCalendarNavigation()

const calendars = ref<Calendar[]>([])
const events = ref<CalendarEvent[]>([])
const loading = ref(true)
const error = ref(false)
const saveError = ref<string | null>(null)
const showEventModal = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)
const selectedCalendar = ref('')
const prefillDate = ref<Date | undefined>(undefined)

const {
  monthDays,
  weekDaysData,
  dayHours,
  dayAllDayEvents,
  weekAllDayCols,
  weekHours,
  fourWeeksDays,
  scheduleEvents,
  scheduleGroupedEvents,
  yearMonthsFormatted
} = useCalendarEvents(events, calendars, currentDate, getMondayStart)

const fetchRange = computed(() => {
  const range = visibleRange.value
  const start = new Date(range.start)
  start.setMonth(start.getMonth() - 1)
  const end = new Date(range.end)
  end.setMonth(end.getMonth() + 3)
  return { start, end }
})

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

async function loadData(range?: { start: Date; end: Date }) {
  const fetchRangeVal =
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
    const newEvents = await client.fetchAllEvents(calendars.value, fetchRangeVal)

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
    lastFetchKey = `${fetchRange.value.start.toISOString()}-${fetchRange.value.end.toISOString()}`
  }
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
.cal-view-btn {
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85em;
  border-radius: 4px;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.cal-view-btn:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.cal-view-btn.active {
  background: var(--oc-role-primary-container, #d4e5f7);
  color: var(--oc-role-on-primary-container, #001f2b);
  font-weight: 600;
}
.cal-title {
  font-size: 1em;
  font-weight: 600;
  padding: 0 12px;
}
.cal-btn {
  padding: 8px 12px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  background: var(--oc-role-surface, #ffffff);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
}
.cal-btn:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.cal-btn-icon {
  padding: 8px 12px;
}
.cal-btn-primary {
  background: var(--oc-role-primary, #0061a5);
  color: var(--oc-role-on-primary, #ffffff);
  border: none;
}
.cal-btn-primary:hover {
  background: #004880;
}
.cal-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.cal-main {
  flex: 1;
  overflow: auto;
  padding: 0;
}
.cal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
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
</style>
