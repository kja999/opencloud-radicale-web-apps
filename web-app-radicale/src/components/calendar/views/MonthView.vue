<template>
  <div class="month-view">
    <div class="month-header">
      <div v-for="day in weekDays" :key="day" class="month-header-cell">{{ day }}</div>
    </div>
    <div class="month-grid">
      <div v-for="(day, idx) in days" :key="idx" class="month-cell" :class="{ 'other-month': !day.isCurrentMonth }">
        <div class="day-num" :class="{ today: day.isToday }" @click="$emit('newEvent', day.dateObj)">
          {{ day.date }}
        </div>
        <EventChip
          v-for="event in day.events.slice(0, 3)"
          :key="event.uid"
          :title="event.summary"
          :color="event.color"
          :all-day="event.allDay"
          :show-time="true"
          :start="event.start"
          @click="$emit('openEvent', event)"
        />
        <div v-if="day.events.length > 3" class="more-events">+{{ day.events.length - 3 }} more</div>
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
    isCurrentMonth: boolean
    isToday: boolean
    events: CalendarEvent[]
  }>
  weekDays: string[]
}>()

defineEmits<{
  openEvent: [event: CalendarEvent]
  newEvent: [date: Date]
}>()
</script>

<style scoped>
.month-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.month-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.month-header-cell {
  padding: 8px;
  text-align: center;
  font-size: 0.75em;
  font-weight: 600;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  border-left: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.month-cell {
  min-height: 90px;
  padding: 4px;
  border-right: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  overflow: hidden;
}
.month-cell.other-month {
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

@media (max-width: 768px) {
  .month-header-cell {
    padding: 4px;
    font-size: 0.65em;
  }
  .month-cell {
    min-height: 60px;
    padding: 2px;
  }
  .day-num {
    font-size: 0.7em;
    width: 20px;
    height: 20px;
  }
}
</style>
