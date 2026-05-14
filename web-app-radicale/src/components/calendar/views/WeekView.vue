<template>
  <div class="week-view">
    <div class="week-header-row">
      <div class="time-gutter"></div>
      <div v-for="(day, idx) in weekDaysData" :key="idx" class="week-day-header">
        <span :class="{ today: day.isToday }">{{ weekDays[idx] }} {{ day.date }}</span>
      </div>
    </div>
    <div v-if="hasAllDayEvents" class="week-allday-row">
      <div class="time-gutter"></div>
      <div v-for="(dayAlldayEvents, dayIdx) in allDayCols" :key="dayIdx" class="week-allday-cell">
        <EventChip
          v-for="event in dayAlldayEvents"
          :key="event.uid"
          :title="event.summary"
          :color="event.color"
          :all-day="true"
          :show-time="false"
          :start="event.start"
          @click="$emit('openEvent', event)"
        />
      </div>
    </div>
    <div class="week-body">
      <div v-for="slot in hourSlots" :key="slot.hour" class="week-hour-row">
        <div class="time-gutter">{{ slot.hour.toString().padStart(2, '0') }}:00</div>
        <div v-for="(col, idx) in slot.dayCols" :key="idx" class="week-cell">
          <EventChip
            v-for="event in col.events"
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

const props = defineProps<{
  weekDaysData: Array<{ date: number; dateObj: Date; isToday: boolean; events: CalendarEvent[] }>
  weekDays: string[]
  allDayCols: Array<CalendarEvent[]>
  hourSlots: Array<{ hour: number; dayCols: Array<{ day: { dateObj: Date }; events: CalendarEvent[] }> }>
}>()

defineEmits<{
  openEvent: [event: CalendarEvent]
}>()

const hasAllDayEvents = props.allDayCols.some(col => col.length > 0)
</script>

<style scoped>
.week-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.week-header-row {
  display: flex;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.week-day-header {
  flex: 1;
  padding: 8px 4px;
  text-align: center;
  font-size: 0.75em;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.week-day-header span.today {
  background: var(--oc-role-primary, #0061a5);
  color: var(--oc-role-on-primary, #ffffff);
  border-radius: 4px;
  padding: 2px 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.week-allday-row {
  display: flex;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.time-gutter {
  width: 60px;
  flex-shrink: 0;
  padding: 4px 8px;
  font-size: 0.7em;
  color: var(--oc-role-on-surface-variant, #40484c);
  text-align: right;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.week-allday-cell {
  flex: 1;
  padding: 4px;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  min-height: 24px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.week-body {
  flex: 1;
  overflow-y: auto;
}
.week-hour-row {
  display: flex;
  min-height: 48px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.week-cell {
  flex: 1;
  padding: 4px;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
