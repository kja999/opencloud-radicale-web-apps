<template>
  <div class="cal-root">
    <div class="cal-header">
      <div class="cal-nav-group">
        <button
          v-for="v in ['month', 'week', 'list']"
          :key="v"
          class="cal-view-btn"
          :class="{ active: currentView === v }"
          @click="currentView = v"
        >
          {{ t(v.charAt(0).toUpperCase() + v.slice(1)) }}
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
      <aside class="cal-sidebar">
        <h3 class="cal-sidebar-title">{{ t('Calendars') }}</h3>
        <div v-for="cal in calendars" :key="cal.href" class="cal-sidebar-item">
          <input type="checkbox" :checked="cal.visible" @change="toggleCalendar(cal)" />
          <span class="cal-dot" :style="{ backgroundColor: cal.color }"></span>
          <span class="cal-sidebar-label">{{ cal.displayName }}</span>
        </div>
        <div v-if="loading" class="cal-info">{{ t('Loading...') }}</div>
        <div v-if="error" class="cal-error">{{ t('Error loading data') }}</div>
      </aside>

      <main class="cal-main">
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
              <div class="cal-day-num" :class="{ today: day.isToday }">{{ day.date }}</div>
              <div
                v-for="event in day.events.slice(0, 3)"
                :key="event.uid"
                class="cal-event-chip"
                :style="{ borderLeftColor: event.color, backgroundColor: event.color + '18' }"
                @click="openEvent(event)"
              >
                {{ event.summary }}
              </div>
              <div v-if="day.events.length > 3" class="cal-more">+{{ day.events.length - 3 }} more</div>
            </div>
          </div>
        </div>

        <div v-else-if="currentView === 'week'" class="cal-week">
          <div class="cal-month-header">
            <div v-for="(day, idx) in weekDaysData" :key="idx" class="cal-month-header-cell">
              <span :class="{ today: day.isToday }">{{ weekDays[idx] }} {{ day.date }}</span>
            </div>
          </div>
          <div class="cal-week-grid">
            <div v-for="(day, idx) in weekDaysData" :key="idx" class="cal-week-cell">
              <div
                v-for="event in day.events"
                :key="event.uid"
                class="cal-event-chip"
                :style="{ borderLeftColor: event.color, backgroundColor: event.color + '18' }"
                @click="openEvent(event)"
              >
                <strong>{{ event.summary }}</strong>
                <span v-if="!event.allDay">{{ formatTime(event.start) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="currentView === 'list'" class="cal-list">
          <div
            v-for="event in allEvents"
            :key="event.uid"
            class="cal-list-item"
            @click="openEvent(event)"
          >
            <span class="cal-dot" :style="{ backgroundColor: event.color }"></span>
            <div class="cal-list-item-content">
              <strong>{{ event.summary }}</strong>
              <span class="cal-list-date">
                {{ formatDate(event.start) }}
                {{ event.allDay ? t('All Day') : formatTime(event.start) + ' - ' + formatTime(event.end) }}
              </span>
            </div>
          </div>
          <div v-if="allEvents.length === 0" class="cal-empty">{{ t('No events') }}</div>
        </div>
      </main>
    </div>

    <EventModal
      v-if="showEventModal"
      :event="selectedEvent"
      :calendar-href="selectedCalendar"
      @close="closeEventModal"
      @save="saveEvent"
      @delete="deleteEvent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
const currentView = ref('month')
const currentDate = ref(new Date())
const showEventModal = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)
const selectedCalendar = ref('')

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const currentTitle = computed(() => {
  const d = currentDate.value
  if (currentView.value === 'month') {
    return d.toLocaleDateString('default', { month: 'long', year: 'numeric' })
  } else if (currentView.value === 'week') {
    const start = new Date(d)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  return d.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })
})

const monthDays = computed(() => {
  const d = new Date(currentDate.value)
  const year = d.getFullYear()
  const month = d.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Array<{ date: number; isCurrentMonth: boolean; isToday: boolean; events: CalendarEvent[] }> = []

  const startDay = firstDay.getDay()
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({ date: date.getDate(), isCurrentMonth: false, isToday: false, events: getEventsForDate(date) })
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    const today = new Date()
    days.push({
      date: i,
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString(),
      events: getEventsForDate(date)
    })
  }

  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    days.push({ date: i, isCurrentMonth: false, isToday: false, events: getEventsForDate(date) })
  }

  return days
})

const weekDaysData = computed(() => {
  const d = new Date(currentDate.value)
  const day = d.getDay()
  const days: Array<{ date: number; isToday: boolean; events: CalendarEvent[] }> = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(d)
    date.setDate(d.getDate() - day + i)
    const today = new Date()
    days.push({
      date: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      events: getEventsForDate(date)
    })
  }

  return days
})

const allEvents = computed(() => {
  const d = new Date(currentDate.value)
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)

  const visibleCalendars = calendars.value.filter(c => c.visible)
  return events.value
    .filter(e => visibleCalendars.some(c => c.href === e.calendarHref))
    .filter(e => e.start >= start && e.start <= end)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
})

function getEventsForDate(date: Date): CalendarEvent[] {
  const visibleCalendars = calendars.value.filter(c => c.visible)
  return events.value
    .filter(e => visibleCalendars.some(c => c.href === e.calendarHref))
    .filter(e => {
      if (e.allDay) {
        return date.toDateString() >= e.start.toDateString() && date.toDateString() <= e.end.toDateString()
      }
      return date.toDateString() === e.start.toDateString()
    })
    .map(e => ({
      ...e,
      color: calendars.value.find(c => c.href === e.calendarHref)?.color || '#3788d8'
    }))
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })
}

async function loadData() {
  loading.value = true
  error.value = false
  try {
    calendars.value = await client.discoverCalendars()
    const start = new Date()
    start.setMonth(start.getMonth() - 1)
    const end = new Date()
    end.setMonth(end.getMonth() + 2)
    events.value = await client.fetchAllEvents(calendars.value, { start, end })
  } catch (e) {
    console.error('Failed to load calendars:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

function toggleCalendar(cal: Calendar) {
  cal.visible = !cal.visible
}

function prev() {
  const d = new Date(currentDate.value)
  if (currentView.value === 'month') d.setMonth(d.getMonth() - 1)
  else if (currentView.value === 'week') d.setDate(d.getDate() - 7)
  else d.setDate(d.getDate() - 1)
  currentDate.value = d
}

function next() {
  const d = new Date(currentDate.value)
  if (currentView.value === 'month') d.setMonth(d.getMonth() + 1)
  else if (currentView.value === 'week') d.setDate(d.getDate() + 7)
  else d.setDate(d.getDate() + 1)
  currentDate.value = d
}

function goToday() {
  currentDate.value = new Date()
}

function openNewEvent() {
  selectedEvent.value = null
  selectedCalendar.value = calendars.value.find(c => c.visible)?.href || calendars.value[0]?.href || ''
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
}

async function saveEvent(formData: EventFormData) {
  try {
    if (selectedEvent.value) {
      await client.updateEvent(selectedEvent.value, formData)
    } else {
      await client.createEvent({ ...formData, calendarHref: selectedCalendar.value })
    }
    await loadData()
    closeEventModal()
  } catch (e) {
    console.error('Failed to save event:', e)
  }
}

async function deleteEvent(event: CalendarEvent) {
  try {
    await client.deleteEvent(event)
    await loadData()
    closeEventModal()
  } catch (e) {
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
  color: var(--oc-color-text-default, #333);
  background: var(--oc-color-background-default, #fff);
}
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--oc-color-border, #e2e8f0);
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
  border: 1px solid var(--oc-color-border, #d1d5db);
  border-radius: 4px;
  background: var(--oc-color-background-default, #fff);
  cursor: pointer;
  font-size: 0.85em;
}
.cal-btn:hover {
  background: var(--oc-color-background-hover, #f3f4f6);
}
.cal-btn-icon {
  padding: 6px 10px;
  font-size: 1em;
}
.cal-btn-primary {
  background: var(--oc-color-swatch-primary-default, #0070f3);
  color: #fff;
  border-color: var(--oc-color-swatch-primary-default, #0070f3);
}
.cal-btn-primary:hover {
  background: var(--oc-color-swatch-primary-hover, #005bb5);
}
.cal-view-btn {
  padding: 6px 12px;
  border: 1px solid var(--oc-color-border, #d1d5db);
  border-radius: 4px;
  background: var(--oc-color-background-default, #fff);
  cursor: pointer;
  font-size: 0.85em;
}
.cal-view-btn.active {
  background: var(--oc-color-swatch-primary-default, #0070f3);
  color: #fff;
  border-color: var(--oc-color-swatch-primary-default, #0070f3);
}
.cal-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.cal-sidebar {
  width: 200px;
  border-right: 1px solid var(--oc-color-border, #e2e8f0);
  padding: 12px;
  overflow-y: auto;
}
.cal-sidebar-title {
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 0.9em;
}
.cal-sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.85em;
}
.cal-sidebar-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cal-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cal-info {
  font-size: 0.8em;
  color: var(--oc-color-text-muted, #6b7280);
}
.cal-error {
  font-size: 0.8em;
  color: var(--oc-color-swatch-danger-default, #dc2626);
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
  color: var(--oc-color-text-muted, #6b7280);
}
.cal-month {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.cal-month-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--oc-color-border, #e2e8f0);
}
.cal-month-header-cell {
  padding: 8px 4px;
  text-align: center;
  font-size: 0.8em;
  font-weight: 600;
  color: var(--oc-color-text-muted, #6b7280);
}
.cal-month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  border-left: 1px solid var(--oc-color-border, #e2e8f0);
}
.cal-month-cell {
  min-height: 90px;
  padding: 4px;
  border-right: 1px solid var(--oc-color-border, #e2e8f0);
  border-bottom: 1px solid var(--oc-color-border, #e2e8f0);
}
.cal-month-cell.other-month {
  background: var(--oc-color-background-muted, #f9fafb);
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
  background: var(--oc-color-swatch-primary-default, #0070f3);
  color: #fff;
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
}
.cal-event-chip:hover {
  opacity: 0.8;
}
.cal-more {
  font-size: 0.7em;
  color: var(--oc-color-text-muted, #6b7280);
}
.cal-week {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.cal-week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  border-left: 1px solid var(--oc-color-border, #e2e8f0);
}
.cal-week-cell {
  min-height: 300px;
  padding: 4px;
  border-right: 1px solid var(--oc-color-border, #e2e8f0);
  border-bottom: 1px solid var(--oc-color-border, #e2e8f0);
}
.cal-list {
  max-width: 600px;
}
.cal-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--oc-color-border, #e2e8f0);
  cursor: pointer;
}
.cal-list-item:hover {
  background: var(--oc-color-background-hover, #f3f4f6);
}
.cal-list-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cal-list-date {
  font-size: 0.8em;
  color: var(--oc-color-text-muted, #6b7280);
}
.cal-empty {
  text-align: center;
  padding: 48px 16px;
  color: var(--oc-color-text-muted, #6b7280);
}
</style>
