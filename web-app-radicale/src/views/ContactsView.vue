<template>
  <div class="contacts-root">
    <div class="contacts-header">
      <h2 class="contacts-title">{{ t('Contacts') }}</h2>
      <input v-model="searchQuery" type="text" class="contacts-search" :placeholder="t('Search contacts...')" />
      <button class="contacts-btn-primary" @click="openNewContact">+ {{ t('New Contact') }}</button>
    </div>

    <div class="contacts-body">
      <main class="contacts-main">
        <div v-if="saveError" class="contacts-save-error">
          {{ t('Failed to save: ') + saveError }}
          <button class="contacts-save-error-dismiss" @click="saveError = null">{{ t('Dismiss') }}</button>
        </div>
        <div v-if="loading" class="contacts-loading">{{ t('Loading...') }}</div>
        <div v-else-if="allContacts.length === 0" class="contacts-empty">{{ t('No contacts') }}</div>
        <div v-else class="contacts-grid">
          <div class="contacts-count">
            {{ t('Showing') }} {{ allContacts.length }} {{ t('of') }} {{ contacts.length }} {{ t('contacts') }}
          </div>
          <div v-for="contact in allContacts" :key="contact.uid" class="contact-card" @click="viewContact(contact)">
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

    <ContactDetail
      v-if="viewingContact"
      :contact="viewingContact"
      :color="getContactColor(viewingContact)"
      @close="viewingContact = null"
      @edit="openEditModal"
    />

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
import ContactDetail from '../components/contacts/ContactDetail.vue'

const t = translate

const client = getCardDAVClient()

const addressbooks = ref<Addressbook[]>([])
const contacts = ref<Contact[]>([])
const loading = ref(true)
const error = ref(false)
const saveError = ref<string | null>(null)
const showContactModal = ref(false)
const selectedContact = ref<Contact | null>(null)
const selectedAddressbook = ref('')
const viewingContact = ref<Contact | null>(null)
const searchQuery = ref('')

const allContacts = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const filtered = query
    ? contacts.value.filter(
        c =>
          c.fn.toLowerCase().includes(query) ||
          c.organization?.toLowerCase().includes(query) ||
          c.email?.some(e => e.toLowerCase().includes(query))
      )
    : contacts.value
  return filtered.toSorted((a, b) => a.fn.localeCompare(b.fn))
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

function openNewContact() {
  viewingContact.value = null
  selectedContact.value = null
  selectedAddressbook.value = addressbooks.value[0]?.href || ''
  showContactModal.value = true
}

function viewContact(contact: Contact) {
  viewingContact.value = contact
}

function openEditModal() {
  if (viewingContact.value) {
    selectedContact.value = viewingContact.value
    selectedAddressbook.value = getAddressbookHref(viewingContact.value)
    viewingContact.value = null
    showContactModal.value = true
  }
}

function closeContactModal() {
  showContactModal.value = false
  selectedContact.value = null
  viewingContact.value = null
}

async function saveContact(formData: ContactFormData) {
  try {
    if (selectedContact.value) {
      await client.updateContact(selectedContact.value, formData)
    } else {
      await client.createContact({ ...formData, addressbookHref: selectedAddressbook.value })
    }
    await loadData()
    viewingContact.value = null
    closeContactModal()
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : String(e)
    console.error('Failed to save contact:', e)
  }
}

async function deleteContact(contact: Contact) {
  try {
    await client.deleteContact(contact)
    await loadData()
    viewingContact.value = null
    closeContactModal()
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : String(e)
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
  color: var(--oc-role-on-surface, #191c1d);
  background: var(--oc-role-surface, #ffffff);
}
.contacts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #bfc8cc);
}
.contacts-title {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0;
}
.contacts-search {
  flex: 1;
  max-width: 300px;
  padding: 8px 12px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  font-size: 0.9em;
  margin: 0 16px;
}
.contacts-search:focus {
  outline: none;
  border-color: var(--oc-role-primary, #00677f);
}
.contacts-btn-primary {
  padding: 8px 16px;
  background: var(--oc-role-primary, #00677f);
  color: var(--oc-role-on-primary, #ffffff);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}
.contacts-btn-primary:hover {
  background: #004d5e;
}
.contacts-body {
  display: flex;
  flex: 1;
  overflow: hidden;
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
  color: var(--oc-role-on-surface-variant, #40484c);
}
.contacts-empty {
  text-align: center;
  padding: 48px 16px;
  color: var(--oc-role-on-surface-variant, #40484c);
}
.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.contacts-count {
  grid-column: 1 / -1;
  font-size: 0.85em;
  color: var(--oc-role-on-surface-variant, #40484c);
  padding: 4px 0;
}
.contact-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
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
  color: var(--oc-role-on-surface-variant, #40484c);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.contact-email {
  font-size: 0.85em;
  color: var(--oc-role-on-surface-variant, #40484c);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.contacts-save-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  margin: 16px;
  background: color-mix(in srgb, var(--oc-role-error-container, #ffdad6) 15%, transparent);
  border: 1px solid var(--oc-role-error, #ba1a1a);
  border-radius: 4px;
  color: var(--oc-role-error, #ba1a1a);
  font-size: 0.85rem;
}
.contacts-save-error-dismiss {
  padding: 4px 12px;
  border: 1px solid var(--oc-role-error, #ba1a1a);
  border-radius: 4px;
  background: transparent;
  color: var(--oc-role-error, #ba1a1a);
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}
.contacts-save-error-dismiss:hover {
  background: var(--oc-role-error, #ba1a1a);
  color: var(--oc-role-on-error, #ffffff);
}
</style>
