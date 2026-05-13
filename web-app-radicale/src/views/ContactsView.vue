<template>
  <div class="h-full flex flex-col bg-white">
    <div class="flex items-center justify-between p-4 border-b">
      <h2 class="text-xl font-semibold">{{ t('Contacts') }}</h2>
      <button
        @click="openNewContact"
        class="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
      >
        {{ t('New Contact') }}
      </button>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="w-64 border-r p-4 overflow-y-auto">
        <h3 class="font-medium mb-3">{{ t('Contacts') }}</h3>
        <div v-for="ab in addressbooks" :key="ab.href" class="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            :checked="ab.visible"
            @change="toggleAddressbook(ab)"
            class="rounded"
          />
          <span
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: ab.color }"
          ></span>
          <span class="text-sm truncate">{{ ab.displayName }}</span>
        </div>
        <div v-if="loading" class="text-sm text-gray-500">{{ t('Loading...') }}</div>
        <div v-if="error" class="text-sm text-red-500">{{ t('Error loading data') }}</div>
      </div>

      <div class="flex-1 overflow-auto p-4">
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="text-gray-500">{{ t('Loading...') }}</div>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="contact in allContacts"
            :key="contact.uid"
            class="border rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
            @click="openContact(contact)"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium"
                :style="{ backgroundColor: getContactColor(contact) }"
              >
                {{ contact.fn.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ contact.fn }}</div>
                <div v-if="contact.organization" class="text-sm text-gray-500 truncate">
                  {{ contact.organization }}
                </div>
              </div>
            </div>
            <div v-if="contact.email?.length" class="mt-3 text-sm text-gray-600">
              <div class="truncate">{{ contact.email[0] }}</div>
            </div>
          </div>
        </div>
        <div v-if="!loading && allContacts.length === 0" class="text-center text-gray-500 py-8">
          {{ t('No contacts') }}
        </div>
      </div>
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
import type { Addressbook, Contact } from '../types/contacts'
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
  const visibleAddressbooks = addressbooks.value.filter((ab) => ab.visible)
  return contacts.value
    .filter((c) => visibleAddressbooks.some((ab) => ab.href === getAddressbookHref(c)))
    .sort((a, b) => a.fn.localeCompare(b.fn))
})

function getAddressbookHref(contact: Contact): string {
  const parts = contact.href.split('/')
  parts.pop()
  return parts.join('/') + '/'
}

function getContactColor(contact: Contact): string {
  const href = getAddressbookHref(contact)
  const ab = addressbooks.value.find((a) => a.href === href)
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
  selectedAddressbook.value = addressbooks.value.find((ab) => ab.visible)?.href || addressbooks.value[0]?.href || ''
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

async function saveContact(formData: any) {
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