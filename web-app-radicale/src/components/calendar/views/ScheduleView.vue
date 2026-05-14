<template>
  <div class="schedule-view">
    <div class="schedule-header">{{ headerTitle }}</div>
    <template v-for="group in groupedEvents" :key="group.dateStr">
      <div class="schedule-date-header" @click="$emit('goToDay', group.dateObj)">
        <span class="schedule-day-num">{{ group.dayNum }}</span>
        <span class="schedule-month">{{ group.monthStr }}</span>
        <span class="schedule-weekday">{{ group.weekdayStr }}</span>
      </div>
      <div
        v-for="event in group.events"
        :key="event.uid + event.start.getTime()"
        class="schedule-item"
        @click="$emit('openEvent', event)"
      >
        <span class="schedule-dot" :style="{ backgroundColor: event.color }"></span>
        <span class="schedule-time">{{ event.allDay ? t('All Day') : formatTime(event.start) }}</span>
        <strong class="schedule-title">{{ event.summary }}</strong>
        <span v-if="event.isRecurring" class="schedule-recurring" :title="t('Recurring event')">↻</span>
      </div>
    </template>
    <div v-if="events.length === 0" class="schedule-empty">{{ t('No events') }}</div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '../../../types/calendar'
import { t as translate } from '../../../composables/useLanguage'

const t = translate

defineProps<{
  headerTitle: string
  groupedEvents: Array<{
    dateStr: string
    dateObj: Date
    dayNum: number
    monthStr: string
    weekdayStr: string
    events: CalendarEvent[]
  }>
  events: CalendarEvent[]
}>()

defineEmits<{
  openEvent: [event: CalendarEvent]
  goToDay: [date: Date]
}>()

function formatTime(date: Date): string {
  return date.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.schedule-view {
  max-width: 700px;
}
.schedule-header {
  padding: 12px 16px;
  font-size: 1em;
  font-weight: 600;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.schedule-date-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--oc-role-surface-container-low, #fbfcfe);
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  cursor: pointer;
  font-weight: 600;
}
.schedule-date-header:hover {
  background: var(--oc-role-surface-container, #f6f8fa);
}
.schedule-day-num {
  font-size: 1.5em;
  color: var(--oc-role-primary, #0061a5);
}
.schedule-month {
  font-size: 0.85em;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.schedule-weekday {
  font-size: 0.75em;
  color: var(--oc-role-on-surface-variant, #40484c);
  margin-left: auto;
}
.schedule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  cursor: pointer;
}
.schedule-item:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.schedule-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.schedule-time {
  min-width: 120px;
  font-size: 0.8em;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.schedule-title {
  flex: 1;
  font-size: 0.9em;
}
.schedule-recurring {
  color: var(--oc-role-primary, #0061a5);
  font-size: 0.9em;
}
.schedule-empty {
  text-align: center;
  padding: 48px 16px;
  color: var(--oc-role-on-surface-variant, #40484c);
}
</style>
