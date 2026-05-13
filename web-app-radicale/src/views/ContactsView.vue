<template>
  <div class="contacts-root">
    <div class="contacts-header">
      <h2 class="contacts-title">{{ t('Contacts') }}</h2>
      <button class="contacts-btn-primary" @click="openNewContact">+ {{ t('New Contact') }}</button>
    </div>

    <div class="contacts-body">
      <aside class="contacts-sidebar">
        <h3 class="contacts-sidebar-title">{{ t('Address Books') }}</h3>
        <div v-for="ab in addressbooks" :key="ab.href" class="contacts-sidebar-item">
          <input type="checkbox" :checked="ab.visible" @change="toggleAddressbook(ab)" />
          <span class="contacts-dot" :style="{ backgroundColor: ab.color }"></span>
          <span class="contacts-sidebar-label">{{ ab.displayName }}</span>
        </div>
        <div v-if="loading" class="contacts-info">{{ t('Loading...') }}</div>
        <div v-if="error" class="contacts-error">{{ t('Error loading data') }}</div>
      </aside>

      <main class="contacts-main">
        <div v-if="loading" class="contacts-loading">{{ t('Loading...') }}</div>
        <div v-else-if="allContacts.length === 0" class="contacts-empty">{{ t('No contacts') }}</div>
        <div v-else class="contacts-grid">
          <div
            v-for="contact in allContacts"
            :key="contact.uid"
            class="contact-card"
            @click="openContact(contact)"
          >
            <div class="contact-avatar" :style="{ backgroundColor: getContactColor(contact) }">
              {{ contact.fn.charAt(0).toUpperCase() }}
            </div>
            <div class="contact-info">
              <div class="contact-name">{{ contact.fn }}</div>
              <div v-if="contact.organization" class="contact-org">{{ contact.organization }}</div>
              <div v-if="contact.email?.length" class="contact-email">{{ contact.email[0] }}</div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <ContactModal
      v-if="showContactModal"
      :contact="selectedContact"
      :addressbook-href="selectedAddressbook"
      @close="closeContactModal"
      @save="saveContact"
      @delete="deleteContact"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCardDAVClient } from '../carddav/client'
import type { Addressbook, Contact, ContactFormData } from '../types/contacts'
import { t as translate } from '../composables/useLanguage'
import ContactModal from '../components/contacts/ContactModal.vue'

const t = translate

const client = getCardDAVClient()

const addressbooks = ref<Addressbook[]>([])
const contacts = ref<Contact[]>([])
const loading = ref(true)
const error = ref(false)
const showContactModal = ref(false)
const selectedContact = ref<Contact | null>(null)
const selectedAddressbook = ref('')

const allContacts = computed(() => {
  const visibleAddressbooks = addressbooks.value.filter(ab => ab.visible)
  return contacts.value
    .filter(c => visibleAddressbooks.some(ab => ab.href === getAddressbookHref(c)))
    .sort((a, b) => a.fn.localeCompare(b.fn))
})

function getAddressbookHref(contact: Contact): string {
  const parts = contact.href.split('/')
  parts.pop()
  return parts.join('/') + '/'
}

function getContactColor(contact: Contact): string {
  const href = getAddressbookHref(contact)
  const ab = addressbooks.value.find(a => a.href === href)
  return ab?.color || '#e74c3c'
}

async function loadData() {
  loading.value = true
  error.value = false
  try {
    addressbooks.value = await client.discoverAddressbooks()
    contacts.value = await client.fetchAllContacts(addressbooks.value)
  } catch (e) {
    console.error('Failed to load contacts:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

function toggleAddressbook(ab: Addressbook) {
  ab.visible = !ab.visible
}

function openNewContact() {
  selectedContact.value = null
  selectedAddressbook.value = addressbooks.value.find(ab => ab.visible)?.href || addressbooks.value[0]?.href || ''
  showContactModal.value = true
}

function openContact(contact: Contact) {
  selectedContact.value = contact
  selectedAddressbook.value = getAddressbookHref(contact)
  showContactModal.value = true
}

function closeContactModal() {
  showContactModal.value = false
  selectedContact.value = null
}

async function saveContact(formData: ContactFormData) {
  try {
    if (selectedContact.value) {
      await client.updateContact(selectedContact.value, formData)
    } else {
      await client.createContact({ ...formData, addressbookHref: selectedAddressbook.value })
    }
    await loadData()
    closeContactModal()
  } catch (e) {
    console.error('Failed to save contact:', e)
  }
}

async function deleteContact(contact: Contact) {
  try {
    await client.deleteContact(contact)
    await loadData()
    closeContactModal()
  } catch (e) {
    console.error('Failed to delete contact:', e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.contacts-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: inherit;
  color: var(--oc-color-text-default, #333);
  background: var(--oc-color-background-default, #fff);
}
.contacts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--oc-color-border, #e2e8f0);
}
.contacts-title {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0;
}
.contacts-btn-primary {
  padding: 8px 16px;
  background: var(--oc-color-swatch-primary-default, #0070f3);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}
.contacts-btn-primary:hover {
  background: var(--oc-color-swatch-primary-hover, #005bb5);
}
.contacts-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.contacts-sidebar {
  width: 200px;
  border-right: 1px solid var(--oc-color-border, #e2e8f0);
  padding: 12px;
  overflow-y: auto;
}
.contacts-sidebar-title {
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 0.9em;
}
.contacts-sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.85em;
}
.contacts-sidebar-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.contacts-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.contacts-info {
  font-size: 0.8em;
  color: var(--oc-color-text-muted, #6b7280);
}
.contacts-error {
  font-size: 0.8em;
  color: var(--oc-color-swatch-danger-default, #dc2626);
}
.contacts-main {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
.contacts-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--oc-color-text-muted, #6b7280);
}
.contacts-empty {
  text-align: center;
  padding: 48px 16px;
  color: var(--oc-color-text-muted, #6b7280);
}
.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.contact-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--oc-color-border, #e2e8f0);
  border-radius: 8px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.contact-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.contact-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.1em;
  font-weight: 600;
  flex-shrink: 0;
}
.contact-info {
  min-width: 0;
  flex: 1;
}
.contact-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.contact-org {
  font-size: 0.85em;
  color: var(--oc-color-text-muted, #6b7280);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.contact-email {
  font-size: 0.85em;
  color: var(--oc-color-text-muted, #6b7280);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
