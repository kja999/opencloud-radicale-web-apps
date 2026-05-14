<template>
  <div class="day-view">
    <div class="day-header">{{ dayTitle }}</div>
    <div v-if="allDayEvents.length > 0" class="day-allday">
      <EventChip
        v-for="event in allDayEvents"
        :key="event.uid"
        :title="event.summary"
        :color="event.color"
        :all-day="true"
        :show-time="false"
        :start="event.start"
        @click="$emit('openEvent', event)"
      />
    </div>
    <div class="day-hours">
      <div v-for="slot in hourSlots" :key="slot.hour" class="day-hour-row">
        <div class="day-hour-label">{{ slot.hour.toString().padStart(2, '0') }}:00</div>
        <div class="day-hour-events">
          <EventChip
            v-for="event in slot.events"
            :key="event.uid"
            :title="event.summary"
            :color="event.color"
            :all-day="false"
            :show-time="true"
            :start="event.start"
            @click="$emit('openEvent', event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '../../../types/calendar'
import EventChip from './EventChip.vue'

defineProps<{
  dayTitle: string
  allDayEvents: CalendarEvent[]
  hourSlots: Array<{ hour: number; events: CalendarEvent[] }>
}>()

defineEmits<{
  openEvent: [event: CalendarEvent]
}>()
</script>

<style scoped>
.day-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.day-header {
  padding: 12px 16px;
  font-size: 1.1em;
  font-weight: 600;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.day-allday {
  padding: 8px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.day-hours {
  flex: 1;
  overflow-y: auto;
}
.day-hour-row {
  display: flex;
  min-height: 48px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.day-hour-label {
  width: 60px;
  padding: 4px 8px;
  font-size: 0.75em;
  color: var(--oc-role-on-surface-variant, #40484c);
  text-align: right;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  flex-shrink: 0;
}
.day-hour-events {
  flex: 1;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
