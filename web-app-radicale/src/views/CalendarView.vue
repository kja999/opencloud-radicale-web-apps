<template>
  <div class="h-full flex flex-col bg-white">
    <div class="flex items-center justify-between p-4 border-b">
      <div class="flex items-center gap-2">
        <button
          v-for="v in ['month', 'week', 'day', 'list']"
          :key="v"
          @click="currentView = v"
          class="px-3 py-1.5 text-sm rounded"
          :class="currentView === v ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        >
          {{ t(v.charAt(0).toUpperCase() + v.slice(1)) }}
        </button>
      </div>
      <div class="flex items-center gap-4">
        <button @click="goToday" class="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200">
          {{ t('Today') }}
        </button>
        <div class="flex items-center gap-2">
          <button @click="prev" class="p-1 hover:bg-gray-100 rounded">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="text-lg font-medium min-w-[150px] text-center">{{ currentTitle }}</span>
          <button @click="next" class="p-1 hover:bg-gray-100 rounded">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="w-64 border-r p-4 overflow-y-auto">
        <h3 class="font-medium mb-3">{{ t('Calendar') }}</h3>
        <div v-for="cal in calendars" :key="cal.href" class="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            :checked="cal.visible"
            @change="toggleCalendar(cal)"
            class="rounded"
          />
          <span
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: cal.color }"
          ></span>
          <span class="text-sm truncate">{{ cal.displayName }}</span>
        </div>
        <div v-if="loading" class="text-sm text-gray-500">{{ t('Loading...') }}</div>
        <div v-if="error" class="text-sm text-red-500">{{ t('Error loading data') }}</div>
      </div>

      <div class="flex-1 overflow-auto p-4">
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="text-gray-500">{{ t('Loading...') }}</div>
        </div>
        <div v-else-if="currentView === 'month'" class="grid grid-cols-7 gap-px bg-gray-200">
          <div
            v-for="day in weekDays"
            :key="day"
            class="bg-gray-50 p-2 text-center text-sm font-medium"
          >
            {{ day }}
          </div>
          <div
            v-for="(day, idx) in monthDays"
            :key="idx"
            class="bg-white min-h-[100px] p-1"
            :class="{ 'bg-gray-50': !day.isCurrentMonth }"
          >
            <div class="text-sm mb-1" :class="day.isToday ? 'bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''">
              {{ day.date }}
            </div>
            <div
              v-for="event in day.events"
              :key="event.uid"
              class="text-xs p-1 mb-1 rounded truncate cursor-pointer"
              :style="{ backgroundColor: event.color + '20', borderLeft: `3px solid ${event.color}` }"
              @click="openEvent(event)"
            >
              {{ event.summary }}
            </div>
          </div>
        </div>
        <div v-else-if="currentView === 'week'">
          <div class="grid grid-cols-7 gap-px bg-gray-200">
            <div
              v-for="day in weekDays"
              :key="day"
              class="bg-gray-50 p-2 text-center text-sm font-medium"
            >
              {{ day }}
            </div>
          </div>
          <div class="grid grid-cols-7 gap-px bg-gray-200">
            <div
              v-for="(day, idx) in weekDaysData"
              :key="idx"
              class="bg-white min-h-[400px] p-1"
            >
              <div class="text-sm mb-2" :class="day.isToday ? 'bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''">
                {{ day.date }}
              </div>
              <div
                v-for="event in day.events"
                :key="event.uid"
                class="text-xs p-1 mb-1 rounded"
                :style="{ backgroundColor: event.color + '20', borderLeft: `3px solid ${event.color}` }"
                @click="openEvent(event)"
              >
                <div class="font-medium">{{ event.summary }}</div>
                <div v-if="!event.allDay">{{ formatTime(event.start) }} - {{ formatTime(event.end) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="currentView === 'list'" class="space-y-2">
          <div
            v-for="event in allEvents"
            :key="event.uid"
            class="p-3 border rounded hover:bg-gray-50 cursor-pointer"
            @click="openEvent(event)"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: event.color }"
              ></span>
              <span class="font-medium">{{ event.summary }}</span>
            </div>
            <div class="text-sm text-gray-500 mt-1">
              {{ formatDate(event.start) }} {{ event.allDay ? t('All Day') : formatTime(event.start) + ' - ' + formatTime(event.end) }}
            </div>
          </div>
          <div v-if="allEvents.length === 0" class="text-center text-gray-500 py-8">
            {{ t('No events') }}
          </div>
        </div>
      </div>
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
import type { Calendar, CalendarEvent } from '../types/calendar'
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
    days.push({
      date: date.getDate(),
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
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString(),
      events: getEventsForDate(date)
    })
  }

  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date: i,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(date)
    })
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

  const visibleCalendars = calendars.value.filter((c) => c.visible)
  return events.value
    .filter((e) => visibleCalendars.some((c) => c.href === e.calendarHref))
    .filter((e) => e.start >= start && e.start <= end)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
})

function getEventsForDate(date: Date): CalendarEvent[] {
  const visibleCalendars = calendars.value.filter((c) => c.visible)
  return events.value
    .filter((e) => visibleCalendars.some((c) => c.href === e.calendarHref))
    .filter((e) => {
      const start = e.start
      const end = e.end
      if (e.allDay) {
        return date.toDateString() >= start.toDateString() && date.toDateString() <= end.toDateString()
      }
      return date.toDateString() === start.toDateString()
    })
    .map((e) => ({
      ...e,
      color: calendars.value.find((c) => c.href === e.calendarHref)?.color || '#3788d8'
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
  if (currentView.value === 'month') {
    d.setMonth(d.getMonth() - 1)
  } else if (currentView.value === 'week') {
    d.setDate(d.getDate() - 7)
  } else {
    d.setDate(d.getDate() - 1)
  }
  currentDate.value = d
}

function next() {
  const d = new Date(currentDate.value)
  if (currentView.value === 'month') {
    d.setMonth(d.getMonth() + 1)
  } else if (currentView.value === 'week') {
    d.setDate(d.getDate() + 7)
  } else {
    d.setDate(d.getDate() + 1)
  }
  currentDate.value = d
}

function goToday() {
  currentDate.value = new Date()
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

async function saveEvent(formData: any) {
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