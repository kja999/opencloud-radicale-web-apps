<template>
  <div class="year-view">
    <div class="year-grid">
      <div v-for="(month, idx) in months" :key="idx" class="year-month">
        <div class="year-month-title" @click="$emit('goToMonth', month.year, month.month)">
          {{ month.title }}
        </div>
        <div class="year-month-grid">
          <div
            v-for="(day, dayIdx) in month.days"
            :key="dayIdx"
            class="year-day"
            :class="{ 'other-month': !day.isCurrentMonth, today: day.isToday }"
            @click="$emit('newEvent', day.dateObj)"
          >
            {{ day.date }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  months: Array<{
    year: number
    month: number
    title: string
    days: Array<{
      date: number
      dateObj: Date
      isCurrentMonth: boolean
      isToday: boolean
    }>
  }>
}>()

defineEmits<{
  goToMonth: [year: number, month: number]
  newEvent: [date: Date]
}>()
</script>

<style scoped>
.year-view {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}
.year-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.year-month {
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  padding: 8px;
}
.year-month-title {
  text-align: center;
  font-size: 0.85em;
  font-weight: 600;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
}
.year-month-title:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.year-month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}
.year-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65em;
  cursor: pointer;
  border-radius: 50%;
}
.year-day:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}
.year-day.other-month {
  color: var(--oc-role-on-surface-variant, #40484c);
  opacity: 0.5;
}
.year-day.today {
  background: var(--oc-role-primary, #0061a5);
  color: var(--oc-role-on-primary, #ffffff);
}
</style>
