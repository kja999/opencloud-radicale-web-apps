<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
      <h2 class="text-xl font-semibold mb-4">
        {{ event ? t('Edit Event') : t('New Event') }}
      </h2>

      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('Title') }}</label>
          <input v-model="form.summary" type="text" class="w-full border rounded px-3 py-2" required />
        </div>

        <div class="flex items-center gap-2">
          <input v-model="form.allDay" type="checkbox" id="allDay" class="rounded" />
          <label for="allDay" class="text-sm">{{ t('All Day') }}</label>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('Start') }}</label>
            <input v-model="form.startDate" type="date" class="w-full border rounded px-3 py-2" required />
            <input
              v-if="!form.allDay"
              v-model="form.startTime"
              type="time"
              class="w-full border rounded px-3 py-2 mt-2"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('End') }}</label>
            <input v-model="form.endDate" type="date" class="w-full border rounded px-3 py-2" required />
            <input
              v-if="!form.allDay"
              v-model="form.endTime"
              type="time"
              class="w-full border rounded px-3 py-2 mt-2"
              required
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">{{ t('Location') }}</label>
          <input v-model="form.location" type="text" class="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">{{ t('Description') }}</label>
          <textarea v-model="form.description" rows="3" class="w-full border rounded px-3 py-2"></textarea>
        </div>

        <div class="flex justify-between pt-4">
          <button
            v-if="event"
            type="button"
            @click="$emit('delete', event)"
            class="px-4 py-2 text-red-600 hover:bg-red-50 rounded"
          >
            {{ t('Delete') }}
          </button>
          <div class="flex gap-2 ml-auto">
            <button type="button" @click="$emit('close')" class="px-4 py-2 border rounded hover:bg-gray-50">
              {{ t('Cancel') }}
            </button>
            <button type="submit" class="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600">
              {{ t('Save') }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CalendarEvent, EventFormData } from '../../types/calendar'
import { t as translate } from '../../composables/useLanguage'

const t = translate

const props = defineProps<{
  event: CalendarEvent | null
  calendarHref: string
}>()

const emit = defineEmits<{
  close: []
  save: [formData: EventFormData]
  delete: [event: CalendarEvent]
}>()

const form = ref({
  summary: '',
  allDay: true,
  startDate: '',
  startTime: '09:00',
  endDate: '',
  endTime: '10:00',
  location: '',
  description: ''
})

watch(
  () => props.event,
  ev => {
    if (ev) {
      form.value = {
        summary: ev.summary,
        allDay: ev.allDay,
        startDate: formatDateInput(ev.start),
        startTime: formatTimeInput(ev.start),
        endDate: formatDateInput(ev.end),
        endTime: formatTimeInput(ev.end),
        location: ev.location || '',
        description: ev.description || ''
      }
    } else {
      const now = new Date()
      const later = new Date(now)
      later.setHours(later.getHours() + 1)
      form.value = {
        summary: '',
        allDay: true,
        startDate: formatDateInput(now),
        startTime: '09:00',
        endDate: formatDateInput(later),
        endTime: '10:00',
        location: '',
        description: ''
      }
    }
  },
  { immediate: true }
)

function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatTimeInput(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

function save() {
  let start: Date
  let end: Date

  if (form.value.allDay) {
    start = new Date(form.value.startDate)
    end = new Date(form.value.endDate)
    end.setDate(end.getDate() + 1)
  } else {
    start = new Date(`${form.value.startDate}T${form.value.startTime}`)
    end = new Date(`${form.value.endDate}T${form.value.endTime}`)
  }

  emit('save', {
    summary: form.value.summary,
    start,
    end,
    allDay: form.value.allDay,
    location: form.value.location || undefined,
    description: form.value.description || undefined,
    calendarHref: props.calendarHref
  })
}
</script>
