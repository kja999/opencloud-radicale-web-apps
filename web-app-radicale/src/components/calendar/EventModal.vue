<template>
  <div class="event-modal-overlay" @click.self="$emit('close')">
    <div class="event-modal">
      <h2 class="event-modal-title">
        {{ event ? t('Edit Event') : t('New Event') }}
      </h2>

      <form @submit.prevent="save" class="event-modal-form">
        <div class="event-modal-field">
          <label class="event-modal-label">{{ t('Title') }}</label>
          <input v-model="form.summary" type="text" class="event-modal-input" required />
        </div>

        <div class="event-modal-checkbox">
          <input v-model="form.allDay" type="checkbox" id="eventAllDay" class="event-modal-checkbox-input" />
          <label for="eventAllDay" class="event-modal-label-sm">{{ t('All Day') }}</label>
        </div>

        <div class="event-modal-row">
          <div class="event-modal-field">
            <label class="event-modal-label">{{ t('Start') }}</label>
            <input v-model="form.startDate" type="date" class="event-modal-input" required />
            <input v-if="!form.allDay" v-model="form.startTime" type="time" class="event-modal-input mt-2" required />
          </div>
          <div class="event-modal-field">
            <label class="event-modal-label">{{ t('End') }}</label>
            <input v-model="form.endDate" type="date" class="event-modal-input" required />
            <input v-if="!form.allDay" v-model="form.endTime" type="time" class="event-modal-input mt-2" required />
          </div>
        </div>

        <div v-if="validationError" class="event-modal-error">{{ validationError }}</div>

        <div class="event-modal-field">
          <label class="event-modal-label">{{ t('Location') }}</label>
          <div class="location-row">
            <input v-model="form.location" type="text" class="event-modal-input" />
            <a
              v-if="form.location"
              :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`"
              target="_blank"
              rel="noopener"
              class="maps-btn"
              :title="t('Search in Google Maps')"
              >📍</a
            >
          </div>
        </div>

        <div class="event-modal-field">
          <label class="event-modal-label">{{ t('Color') }}</label>
          <div class="color-swatches">
            <button
              v-for="c in presetColors"
              :key="c"
              type="button"
              class="color-swatch"
              :class="{ selected: form.color === c }"
              :style="{ backgroundColor: c }"
              @click="form.color = c"
            />
          </div>
        </div>

        <div class="event-modal-section">
          <div class="event-modal-checkbox">
            <input v-model="form.repeatEnabled" type="checkbox" id="eventRepeat" class="event-modal-checkbox-input" />
            <label for="eventRepeat" class="event-modal-label-sm">{{ t('Repeat') }}</label>
          </div>

          <div v-if="form.repeatEnabled" class="repeat-options">
            <div class="event-modal-row">
              <div class="event-modal-field">
                <label class="event-modal-label-sm">{{ t('Frequency') }}</label>
                <select v-model="form.repeatFreq" class="event-modal-select">
                  <option value="DAILY">{{ t('Daily') }}</option>
                  <option value="WEEKLY">{{ t('Weekly') }}</option>
                  <option value="MONTHLY">{{ t('Monthly') }}</option>
                  <option value="YEARLY">{{ t('Yearly') }}</option>
                </select>
              </div>
              <div class="event-modal-field">
                <label class="event-modal-label-sm">{{ t('Every') }}</label>
                <input v-model.number="form.repeatInterval" type="number" min="1" max="99" class="event-modal-input" />
              </div>
            </div>

            <div class="event-modal-field">
              <label class="event-modal-label-sm">{{ t('Ends') }}</label>
              <div class="repeat-end-options">
                <label class="repeat-end-option">
                  <input v-model="form.repeatEndType" type="radio" value="never" />
                  {{ t('Never') }}
                </label>
                <label class="repeat-end-option">
                  <input v-model="form.repeatEndType" type="radio" value="count" />
                  {{ t('After') }}
                  <input
                    v-if="form.repeatEndType === 'count'"
                    v-model.number="form.repeatEndCount"
                    type="number"
                    min="1"
                    max="999"
                    class="event-modal-input-inline"
                  />
                  <span v-if="form.repeatEndType === 'count'">{{ t('occurrences') }}</span>
                </label>
                <label class="repeat-end-option">
                  <input v-model="form.repeatEndType" type="radio" value="until" />
                  {{ t('On date') }}
                  <input
                    v-if="form.repeatEndType === 'until'"
                    v-model="form.repeatEndDate"
                    type="date"
                    class="event-modal-input-inline"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="event-modal-field">
          <label class="event-modal-label">{{ t('Description') }}</label>
          <textarea v-model="form.description" rows="3" class="event-modal-textarea"></textarea>
        </div>

        <div class="event-modal-actions">
          <button
            v-if="event"
            type="button"
            @click="$emit('delete', event)"
            class="event-modal-btn event-modal-btn-danger"
          >
            {{ t('Delete') }}
          </button>
          <div class="event-modal-actions-right">
            <button type="button" @click="$emit('close')" class="event-modal-btn event-modal-btn-cancel">
              {{ t('Cancel') }}
            </button>
            <div v-if="event?.isRecurring" class="save-dropdown">
              <button
                type="button"
                class="event-modal-btn event-modal-btn-save"
                @click="showScopeMenu = !showScopeMenu"
              >
                {{ t('Save') }} ▼
              </button>
              <div v-if="showScopeMenu" class="save-dropdown-menu">
                <button type="button" @click="saveWithScope('single')">{{ t('This event only') }}</button>
                <button type="button" @click="saveWithScope('future')">{{ t('This and future events') }}</button>
                <button type="button" @click="saveWithScope('all')">{{ t('All events in series') }}</button>
              </div>
            </div>
            <button v-else type="submit" class="event-modal-btn event-modal-btn-save">
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
  initialDate?: Date
}>()

const emit = defineEmits<{
  close: []
  save: [formData: EventFormData, scope?: 'single' | 'future' | 'all']
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
  description: '',
  color: '',
  repeatEnabled: false,
  repeatFreq: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  repeatInterval: 1,
  repeatEndType: 'never' as 'never' | 'count' | 'until',
  repeatEndCount: 10,
  repeatEndDate: '',
  repeatByDay: [] as string[]
})

const presetColors = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#FF9800',
  '#795548',
  '#607D8B'
]

const validationError = ref('')
const showScopeMenu = ref(false)

watch(
  () => props.event,
  ev => {
    if (ev) {
      const rrule = ev.rrule
      form.value = {
        summary: ev.summary,
        allDay: ev.allDay,
        startDate: formatDateInput(ev.start),
        startTime: formatTimeInput(ev.start),
        endDate: formatDateInput(ev.allDay ? new Date(ev.end.getTime() - 86400000) : ev.end),
        endTime: formatTimeInput(ev.end),
        location: ev.location || '',
        description: ev.description || '',
        color: ev.color || '',
        repeatEnabled: !!rrule,
        repeatFreq: rrule?.freq || 'WEEKLY',
        repeatInterval: rrule?.interval || 1,
        repeatEndType: rrule?.until ? 'until' : rrule?.count ? 'count' : 'never',
        repeatEndCount: rrule?.count || 10,
        repeatEndDate: rrule?.until
          ? formatDateInput(ev.allDay ? new Date(rrule.until.getTime() - 86400000) : rrule.until)
          : '',
        repeatByDay: rrule?.byDay || []
      }
    } else {
      const prefillDate = props.initialDate ? new Date(props.initialDate) : new Date()
      const later = new Date(prefillDate)
      later.setHours(later.getHours() + 1)
      form.value = {
        summary: '',
        allDay: true,
        startDate: formatDateInput(prefillDate),
        startTime: '09:00',
        endDate: formatDateInput(later),
        endTime: '10:00',
        location: '',
        description: '',
        color: '',
        repeatEnabled: false,
        repeatFreq: 'WEEKLY',
        repeatInterval: 1,
        repeatEndType: 'never',
        repeatEndCount: 10,
        repeatEndDate: '',
        repeatByDay: []
      }
    }
  },
  { immediate: true }
)

watch(
  () => form.value.startDate,
  newStartDate => {
    if (newStartDate && form.value.endDate) {
      form.value.endDate = newStartDate
    }
  }
)

function formatDateInput(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTimeInput(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

function save(scope?: 'single' | 'future' | 'all') {
  validationError.value = ''
  showScopeMenu.value = false

  let start: Date
  let end: Date

  if (form.value.allDay) {
    start = new Date(form.value.startDate + 'T00:00:00')
    const endBase = new Date(form.value.endDate + 'T00:00:00')
    endBase.setDate(endBase.getDate() + 1)
    end = endBase
  } else {
    start = new Date(`${form.value.startDate}T${form.value.startTime}`)
    end = new Date(`${form.value.endDate}T${form.value.endTime}`)
  }

  if (end <= start) {
    validationError.value = t('End must be after start')
    return
  }

  let recurrence:
    | { freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'; interval?: number; until?: Date; count?: number }
    | undefined
  if (form.value.repeatEnabled) {
    recurrence = {
      freq: form.value.repeatFreq,
      interval: form.value.repeatInterval > 1 ? form.value.repeatInterval : undefined
    }
    if (form.value.repeatEndType === 'count' && form.value.repeatEndCount > 0) {
      recurrence.count = form.value.repeatEndCount
    } else if (form.value.repeatEndType === 'until' && form.value.repeatEndDate) {
      recurrence.until = new Date(form.value.repeatEndDate + 'T00:00:00')
    }
  }

  emit(
    'save',
    {
      summary: form.value.summary,
      start,
      end,
      allDay: form.value.allDay,
      location: form.value.location || undefined,
      description: form.value.description || undefined,
      color: form.value.color || undefined,
      recurrence,
      calendarHref: props.calendarHref
    },
    scope
  )
}

function saveWithScope(scope: 'single' | 'future' | 'all') {
  save(scope)
}
</script>

<style scoped>
.event-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.event-modal {
  background: var(--oc-role-surface, #ffffff);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 448px;
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
}

.event-modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--oc-role-on-surface, #191c1d);
}

.event-modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.event-modal-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-modal-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--oc-role-on-surface, #191c1d);
}

.event-modal-label-sm {
  font-size: 0.85rem;
  color: var(--oc-role-on-surface, #191c1d);
}

.event-modal-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  font-size: 0.9rem;
  background: var(--oc-role-surface, #ffffff);
  color: var(--oc-role-on-surface, #191c1d);
  box-sizing: border-box;
}

.event-modal-input:focus {
  outline: none;
  border-color: var(--oc-role-primary, #00677f);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--oc-role-primary, #00677f) 15%, transparent);
}

.mt-2 {
  margin-top: 8px;
}

.event-modal-error {
  color: var(--oc-role-error, #ba1a1a);
  font-size: 0.85rem;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--oc-role-error-container, #ffdad6) 15%, transparent);
  border: 1px solid var(--oc-role-error, #ba1a1a);
  border-radius: 4px;
}

.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition:
    transform 0.15s,
    border-color 0.15s;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.selected {
  border-color: var(--oc-role-on-surface, #191c1d);
  box-shadow: 0 0 0 2px var(--oc-role-surface, #ffffff);
}

.location-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.location-row .event-modal-input {
  flex: 1;
}

.maps-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  background: var(--oc-role-surface, #ffffff);
  color: var(--oc-role-on-surface, #191c1d);
  text-decoration: none;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.15s;
}

.maps-btn:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}

.event-modal-section {
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  padding: 12px;
  background: var(--oc-role-surface-container-low, #f6f8fa);
}

.event-modal-section .event-modal-checkbox {
  margin-bottom: 8px;
}

.repeat-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.repeat-options .event-modal-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.repeat-options .event-modal-label-sm {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--oc-role-on-surface-variant, #40484c);
  margin-bottom: 4px;
}

.event-modal-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  font-size: 0.9rem;
  background: var(--oc-role-surface, #ffffff);
  color: var(--oc-role-on-surface, #191c1d);
  cursor: pointer;
}

.event-modal-select:focus {
  outline: none;
  border-color: var(--oc-role-primary, #00677f);
}

.repeat-end-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.repeat-end-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.repeat-end-option input[type='radio'] {
  accent-color: var(--oc-role-primary, #00677f);
}

.event-modal-input-inline {
  padding: 4px 8px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  font-size: 0.85rem;
  width: 80px;
}

.event-modal-input-inline:focus {
  outline: none;
  border-color: var(--oc-role-primary, #00677f);
}

.event-modal-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-modal-checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--oc-role-primary, #00677f);
}

.event-modal-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.event-modal-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
  background: var(--oc-role-surface, #ffffff);
  color: var(--oc-role-on-surface, #191c1d);
  resize: vertical;
  box-sizing: border-box;
}

.event-modal-textarea:focus {
  outline: none;
  border-color: var(--oc-role-primary, #00677f);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--oc-role-primary, #00677f) 15%, transparent);
}

.event-modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
}

.event-modal-actions-right {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.save-dropdown {
  position: relative;
}

.save-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--oc-role-surface, #ffffff);
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 180px;
  margin-top: 4px;
}

.save-dropdown-menu button {
  display: block;
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--oc-role-on-surface, #191c1d);
}

.save-dropdown-menu button:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}

.save-dropdown-menu button:first-child {
  border-radius: 4px 4px 0 0;
}

.save-dropdown-menu button:last-child {
  border-radius: 0 0 4px 4px;
}

.event-modal-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  background: var(--oc-role-surface, #ffffff);
  color: var(--oc-role-on-surface, #191c1d);
  font-weight: 500;
}

.event-modal-btn:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}

.event-modal-btn-save {
  background: var(--oc-role-primary, #00677f);
  color: var(--oc-role-on-primary, #ffffff);
  border-color: var(--oc-role-primary, #00677f);
}

.event-modal-btn-save:hover {
  background: #004d5e;
}

.event-modal-btn-danger {
  color: var(--oc-role-error, #ba1a1a);
  border-color: var(--oc-role-error, #ba1a1a);
}

.event-modal-btn-danger:hover {
  background: color-mix(in srgb, var(--oc-role-error-container, #ffdad6) 20%, transparent);
}
</style>
