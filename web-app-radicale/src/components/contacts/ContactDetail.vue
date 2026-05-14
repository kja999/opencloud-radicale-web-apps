<template>
  <div class="contact-detail-overlay" @click.self="$emit('close')">
    <div class="contact-detail">
      <div class="contact-detail-header">
        <button class="contact-detail-back" @click="$emit('close')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="contact-detail-actions">
          <button class="contact-detail-btn-edit" @click="$emit('edit')">
            {{ t('Edit') }}
          </button>
        </div>
      </div>

      <div class="contact-detail-body">
        <div class="contact-detail-avatar" :style="{ backgroundColor: color }">
          {{ contact.fn.charAt(0).toUpperCase() }}
        </div>
        <h2 class="contact-detail-name">{{ contact.fn }}</h2>

        <div v-if="contact.organization" class="contact-detail-section">
          <div class="contact-detail-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
            </svg>
          </div>
          <div class="contact-detail-text">{{ contact.organization }}</div>
        </div>

        <div v-if="contact.title" class="contact-detail-section">
          <div class="contact-detail-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 3h-8v4h8V3z" />
            </svg>
          </div>
          <div class="contact-detail-text">{{ contact.title }}</div>
        </div>

        <div v-if="contact.email?.length" class="contact-detail-section">
          <div class="contact-detail-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 6l-10 7L2 6" />
            </svg>
          </div>
          <div class="contact-detail-text">
            <div v-for="(e, idx) in contact.email" :key="idx" class="contact-detail-labeled-item">
              <span v-if="e.label" class="contact-detail-label">{{ e.label }}</span>
              <a :href="`mailto:${e.value}`" class="contact-detail-link">{{ e.value }}</a>
            </div>
          </div>
        </div>

        <div v-if="contact.tel?.length" class="contact-detail-section">
          <div class="contact-detail-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
              />
            </svg>
          </div>
          <div class="contact-detail-text">
            <div v-for="(t, idx) in contact.tel" :key="idx" class="contact-detail-labeled-item">
              <span v-if="t.label" class="contact-detail-label">{{ t.label }}</span>
              <a :href="`tel:${t.value}`" class="contact-detail-link">{{ t.value }}</a>
            </div>
          </div>
        </div>

        <div v-if="contact.birthday" class="contact-detail-section">
          <div class="contact-detail-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8" />
              <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
              <path d="M2 21h20" />
              <path d="M7 8v2" />
              <path d="M12 8v2" />
              <path d="M17 8v2" />
              <path d="M7 4h.01" />
              <path d="M12 4h.01" />
              <path d="M17 4h.01" />
            </svg>
          </div>
          <div class="contact-detail-text">{{ formatBirthday(contact.birthday) }}</div>
        </div>

        <div v-if="contact.address?.length" class="contact-detail-section">
          <div class="contact-detail-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div class="contact-detail-text">
            <div v-for="(addr, idx) in contact.address" :key="idx" class="contact-detail-address">
              <div v-if="addr.street">{{ addr.street }}</div>
              <div v-if="addr.city || addr.region || addr.postcode">
                {{ [addr.postcode, addr.city, addr.region].filter(Boolean).join(', ') }}
              </div>
              <div v-if="addr.country">{{ addr.country }}</div>
            </div>
          </div>
        </div>

        <div v-if="contact.note" class="contact-detail-section contact-detail-section-note">
          <div class="contact-detail-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </div>
          <div class="contact-detail-text contact-detail-note">{{ contact.note }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Contact } from '../../types/contacts'
import { t as translate } from '../../composables/useLanguage'

const t = translate

defineProps<{
  contact: Contact
  color: string
}>()

defineEmits<{
  close: []
  edit: []
}>()

function formatBirthday(bday: string): string {
  if (!bday || bday.length !== 8) return bday
  const year = bday.substring(0, 4)
  const month = bday.substring(4, 6)
  const day = bday.substring(6, 8)
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<style scoped>
.contact-detail-overlay {
  position: fixed;
  inset: 0;
  background: var(--oc-role-surface, #ffffff);
  z-index: 50;
  overflow-y: auto;
}

.contact-detail {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px 32px;
}

.contact-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  position: sticky;
  top: 0;
  background: var(--oc-role-surface, #ffffff);
  z-index: 10;
}

.contact-detail-back {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: var(--oc-role-on-surface, #191c1d);
  border-radius: 20px;
}

.contact-detail-back:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}

.contact-detail-actions {
  display: flex;
  gap: 8px;
}

.contact-detail-btn-edit {
  padding: 8px 20px;
  background: var(--oc-role-primary, #00677f);
  color: var(--oc-role-on-primary, #ffffff);
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.contact-detail-btn-edit:hover {
  background: #004d5e;
}

.contact-detail-body {
  padding-top: 32px;
  text-align: center;
}

.contact-detail-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0 auto 16px;
}

.contact-detail-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--oc-role-on-surface, #191c1d);
  margin: 0 0 24px 0;
}

.contact-detail-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  text-align: left;
}

.contact-detail-section:last-child {
  border-bottom: none;
}

.contact-detail-section-note {
  align-items: flex-start;
}

.contact-detail-icon {
  color: var(--oc-role-on-surface-variant, #40484c);
  flex-shrink: 0;
  padding-top: 2px;
}

.contact-detail-text {
  color: var(--oc-role-on-surface, #191c1d);
  font-size: 0.95rem;
  line-height: 1.5;
}

.contact-detail-link {
  color: var(--oc-role-primary, #00677f);
  text-decoration: none;
  display: block;
}

.contact-detail-link:hover {
  text-decoration: underline;
}

.contact-detail-labeled-item {
  margin-bottom: 4px;
}

.contact-detail-labeled-item:last-child {
  margin-bottom: 0;
}

.contact-detail-label {
  display: inline-block;
  font-size: 0.75rem;
  text-transform: capitalize;
  padding: 2px 6px;
  background: var(--oc-role-surface-container-high, #f5f7f8);
  border-radius: 4px;
  margin-right: 6px;
  color: var(--oc-role-on-surface-variant, #40484c);
}

.contact-detail-address {
  margin-bottom: 4px;
}

.contact-detail-address:last-child {
  margin-bottom: 0;
}

.contact-detail-note {
  white-space: pre-wrap;
  color: var(--oc-role-on-surface-variant, #40484c);
}
</style>
