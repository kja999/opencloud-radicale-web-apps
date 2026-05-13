<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
      <h2 class="text-xl font-semibold mb-4">
        {{ contact ? t('Edit Contact') : t('New Contact') }}
      </h2>

      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('Name') }}</label>
          <input
            v-model="form.fn"
            type="text"
            class="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">{{ t('Email') }}</label>
          <div v-for="(_, idx) in form.email" :key="idx" class="flex gap-2 mb-2">
            <input
              v-model="form.email[idx]"
              type="email"
              class="flex-1 border rounded px-3 py-2"
              placeholder="email@example.com"
            />
            <button type="button" @click="removeEmail(idx)" class="text-red-500">×</button>
          </div>
          <button type="button" @click="addEmail" class="text-sm text-primary-500">
            + Add email
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">{{ t('Phone') }}</label>
          <div v-for="(_, idx) in form.tel" :key="idx" class="flex gap-2 mb-2">
            <input
              v-model="form.tel[idx]"
              type="tel"
              class="flex-1 border rounded px-3 py-2"
              placeholder="+1 234 567 8900"
            />
            <button type="button" @click="removeTel(idx)" class="text-red-500">×</button>
          </div>
          <button type="button" @click="addTel" class="text-sm text-primary-500">
            + Add phone
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">{{ t('Organization') }}</label>
          <input
            v-model="form.organization"
            type="text"
            class="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">{{ t('Title.Job') }}</label>
          <input
            v-model="form.title"
            type="text"
            class="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">{{ t('Address') }}</label>
          <div v-for="(_, idx) in form.address" :key="idx" class="mb-2">
            <textarea
              v-model="form.address[idx]"
              rows="2"
              class="w-full border rounded px-3 py-2"
              placeholder="Street, City, Country"
            ></textarea>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">{{ t('Note') }}</label>
          <textarea
            v-model="form.note"
            rows="2"
            class="w-full border rounded px-3 py-2"
          ></textarea>
        </div>

        <div class="flex justify-between pt-4">
          <button
            v-if="contact"
            type="button"
            @click="$emit('delete', contact)"
            class="px-4 py-2 text-red-600 hover:bg-red-50 rounded"
          >
            {{ t('Delete') }}
          </button>
          <div class="flex gap-2 ml-auto">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 border rounded hover:bg-gray-50"
            >
              {{ t('Cancel') }}
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              {{ t('Save') }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Contact, ContactFormData } from '../../types/contacts'
import { t as translate } from '../../composables/useLanguage'

const t = translate

const props = defineProps<{
  contact: Contact | null
  addressbookHref: string
}>()

const emit = defineEmits<{
  close: []
  save: [formData: ContactFormData]
  delete: [contact: Contact]
}>()

const form = ref({
  fn: '',
  email: [''],
  tel: [''],
  address: [''],
  organization: '',
  title: '',
  note: ''
})

watch(
  () => props.contact,
  (c) => {
    if (c) {
      form.value = {
        fn: c.fn,
        email: c.email?.length ? [...c.email] : [''],
        tel: c.tel?.length ? [...c.tel] : [''],
        address: c.address?.length ? [...c.address] : [''],
        organization: c.organization || '',
        title: c.title || '',
        note: c.note || ''
      }
    } else {
      form.value = {
        fn: '',
        email: [''],
        tel: [''],
        address: [''],
        organization: '',
        title: '',
        note: ''
      }
    }
  },
  { immediate: true }
)

function addEmail() {
  form.value.email.push('')
}

function removeEmail(idx: number) {
  form.value.email.splice(idx, 1)
  if (form.value.email.length === 0) {
    form.value.email.push('')
  }
}

function addTel() {
  form.value.tel.push('')
}

function removeTel(idx: number) {
  form.value.tel.splice(idx, 1)
  if (form.value.tel.length === 0) {
    form.value.tel.push('')
  }
}

function save() {
  const email = form.value.email.filter((e) => e.trim())
  const tel = form.value.tel.filter((t) => t.trim())
  const address = form.value.address.filter((a) => a.trim())

  emit('save', {
    fn: form.value.fn,
    email: email.length ? email : undefined,
    tel: tel.length ? tel : undefined,
    address: address.length ? address : undefined,
    organization: form.value.organization || undefined,
    title: form.value.title || undefined,
    note: form.value.note || undefined,
    addressbookHref: props.addressbookHref
  })
}
</script>