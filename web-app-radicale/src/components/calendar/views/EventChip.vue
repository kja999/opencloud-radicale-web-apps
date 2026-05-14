<template>
  <div
    class="event-chip"
    :class="{ 'all-day': allDay }"
    :style="{
      backgroundColor: allDay ? color : color + '18',
      borderLeftColor: color
    }"
    @click="$emit('click')"
  >
    <span v-if="showTime && !allDay" class="event-chip-time">{{ formatTime(start) }}</span>
    <span class="event-chip-title">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  color: string
  allDay: boolean
  showTime: boolean
  start: Date
}>()

defineEmits<{
  click: []
}>()

function formatTime(date: Date): string {
  return date.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.event-chip {
  font-size: 0.75em;
  padding: 2px 4px;
  margin-bottom: 2px;
  border-left: 3px solid;
  border-radius: 2px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}
.event-chip:hover {
  opacity: 0.85;
}
.event-chip.all-day {
  white-space: normal;
  font-weight: 500;
}
.event-chip-time {
  font-size: 0.85em;
  opacity: 0.8;
  flex-shrink: 0;
}
.event-chip-title {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
