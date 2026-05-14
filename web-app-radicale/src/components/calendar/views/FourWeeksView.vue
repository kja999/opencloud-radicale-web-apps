<template>
  <div class="fourweeks-view">
    <div class="fourweeks-header">
      <div v-for="day in weekDays" :key="day" class="fourweeks-header-cell">{{ day }}</div>
    </div>
    <div class="fourweeks-grid">
      <div
        v-for="(day, idx) in days"
        :key="idx"
        class="fourweeks-cell"
        :class="{ 'other-month': day.dateObj.getMonth() !== currentMonth }"
      >
        <div class="day-num" :class="{ today: day.isToday }" @click="$emit('newEvent', day.dateObj)">
          {{ day.date }}
        </div>
        <EventChip
          v-for="event in day.events.slice(0, 2)"
          :key="event.uid"
          :title="event.summary"
          :color="event.color"
          :all-day="event.allDay"
          :show-time="true"
          :start="event.start"
          @click="$emit('openEvent', event)"
        />
        <div v-if="day.events.length > 2" class="more-events">+{{ day.events.length - 2 }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '../../../types/calendar'
import EventChip from './EventChip.vue'

defineProps<{
  days: Array<{
    date: number
    dateObj: Date
    isToday: boolean
    events: CalendarEvent[]
  }>
  weekDays: string[]
  currentMonth: number
}>()

defineEmits<{
  openEvent: [event: CalendarEvent]
  newEvent: [date: Date]
}>()
</script>

<style scoped>
.fourweeks-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.fourweeks-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.fourweeks-header-cell {
  padding: 8px;
  text-align: center;
  font-size: 0.75em;
  font-weight: 600;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.fourweeks-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
}
.fourweeks-cell {
  min-height: 70px;
  padding: 4px;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.fourweeks-cell.other-month {
  background: var(--oc-role-surface-container, #f6f8fa);
}
.day-num {
  font-size: 0.8em;
  margin-bottom: 2px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.day-num.today {
  background: var(--oc-role-primary, #0061a5);
  color: var(--oc-role-on-primary, #ffffff);
  border-radius: 50%;
}
.more-events {
  font-size: 0.7em;
  color: var(--oc-role-on-surface-variant, #40484c);
}
</style>
