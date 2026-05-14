<template>
  <div class="contact-modal-overlay" @click.self="$emit('close')">
    <div class="contact-modal">
      <h2 class="contact-modal-title">
        {{ contact ? t('Edit Contact') : t('New Contact') }}
      </h2>

      <form @submit.prevent="save" class="contact-modal-form">
        <div class="contact-modal-field">
          <label class="contact-modal-label">{{ t('Name') }}</label>
          <input v-model="form.fn" type="text" class="contact-modal-input" required />
        </div>

        <div class="contact-modal-field">
          <label class="contact-modal-label">{{ t('Email') }}</label>
          <div v-for="(_, idx) in form.email" :key="idx" class="contact-modal-input-row">
            <input
              v-model="form.email[idx]"
              type="email"
              class="contact-modal-input contact-modal-input-flex"
              placeholder="email@example.com"
            />
            <button type="button" @click="removeEmail(idx)" class="contact-modal-remove-btn">x</button>
          </div>
          <button type="button" @click="addEmail" class="contact-modal-add-link">{{ t('+ Add email') }}</button>
        </div>

        <div class="contact-modal-field">
          <label class="contact-modal-label">{{ t('Phone') }}</label>
          <div v-for="(_, idx) in form.tel" :key="idx" class="contact-modal-input-row">
            <input
              v-model="form.tel[idx]"
              type="tel"
              class="contact-modal-input contact-modal-input-flex"
              placeholder="+1 234 567 8900"
            />
            <button type="button" @click="removeTel(idx)" class="contact-modal-remove-btn">x</button>
          </div>
          <button type="button" @click="addTel" class="contact-modal-add-link">{{ t('+ Add phone') }}</button>
        </div>

        <div class="contact-modal-field">
          <label class="contact-modal-label">{{ t('Organization') }}</label>
          <input v-model="form.organization" type="text" class="contact-modal-input" />
        </div>

        <div class="contact-modal-field">
          <label class="contact-modal-label">{{ t('Title.Job') }}</label>
          <input v-model="form.title" type="text" class="contact-modal-input" />
        </div>

        <div class="contact-modal-field">
          <label class="contact-modal-label">{{ t('Birthday') }}</label>
          <input v-model="form.birthday" type="date" class="contact-modal-input" />
        </div>

        <div class="contact-modal-field">
          <label class="contact-modal-label">{{ t('Address') }}</label>
          <div v-for="(_, idx) in form.address" :key="idx" class="contact-modal-address-block">
            <div class="contact-modal-address-grid">
              <input
                v-model="form.address[idx].street"
                type="text"
                class="contact-modal-input"
                :placeholder="t('Street')"
              />
              <input
                v-model="form.address[idx].city"
                type="text"
                class="contact-modal-input"
                :placeholder="t('City')"
              />
              <input
                v-model="form.address[idx].region"
                type="text"
                class="contact-modal-input"
                :placeholder="t('Region')"
              />
              <input
                v-model="form.address[idx].postcode"
                type="text"
                class="contact-modal-input"
                :placeholder="t('Postcode')"
              />
              <input
                v-model="form.address[idx].country"
                type="text"
                class="contact-modal-input"
                :placeholder="t('Country')"
              />
            </div>
          </div>
          <button type="button" @click="addAddress" class="contact-modal-add-link">{{ t('+ Add address') }}</button>
          <button v-if="form.address.length > 0" type="button" @click="removeAddress" class="contact-modal-add-link">
            {{ t('Remove address') }}
          </button>
        </div>

        <div class="contact-modal-field">
          <label class="contact-modal-label">{{ t('Note') }}</label>
          <textarea v-model="form.note" rows="3" class="contact-modal-textarea"></textarea>
        </div>

        <div class="contact-modal-actions">
          <button
            v-if="contact"
            type="button"
            @click="$emit('delete', contact)"
            class="contact-modal-btn contact-modal-btn-danger"
          >
            {{ t('Delete') }}
          </button>
          <div class="contact-modal-actions-right">
            <button type="button" @click="$emit('close')" class="contact-modal-btn contact-modal-btn-cancel">
              {{ t('Cancel') }}
            </button>
            <button type="submit" class="contact-modal-btn contact-modal-btn-save">
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
import type { Contact, ContactFormData, ContactAddress } from '../../types/contacts'
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

const emptyAddress = (): ContactAddress => ({ street: '', city: '', region: '', postcode: '', country: '' })

function formatDateForInput(bday: string): string {
  if (!bday || bday.length !== 8) return ''
  return `${bday.substring(0, 4)}-${bday.substring(4, 6)}-${bday.substring(6, 8)}`
}

function formatDateForSave(bday: string): string {
  if (!bday) return ''
  return bday.replace(/-/g, '')
}

const form = ref({
  fn: '',
  email: [''],
  tel: [''],
  address: [emptyAddress()],
  organization: '',
  title: '',
  birthday: '',
  note: ''
})

watch(
  () => props.contact,
  c => {
    if (c) {
      form.value = {
        fn: c.fn,
        email: c.email?.length ? [...c.email] : [''],
        tel: c.tel?.length ? [...c.tel] : [''],
        address: c.address?.length ? c.address.map(a => ({ ...a })) : [emptyAddress()],
        organization: c.organization || '',
        title: c.title || '',
        birthday: formatDateForInput(c.birthday || ''),
        note: c.note || ''
      }
    } else {
      form.value = {
        fn: '',
        email: [''],
        tel: [''],
        address: [emptyAddress()],
        organization: '',
        title: '',
        birthday: '',
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

function addAddress() {
  form.value.address.push(emptyAddress())
}

function removeAddress() {
  form.value.address.pop()
  if (form.value.address.length === 0) {
    form.value.address.push(emptyAddress())
  }
}

function save() {
  const email = form.value.email.filter(e => e.trim())
  const tel = form.value.tel.filter(t => t.trim())
  const address = form.value.address.filter(a => a.street || a.city || a.region || a.postcode || a.country)

  emit('save', {
    fn: form.value.fn,
    email: email.length ? email : undefined,
    tel: tel.length ? tel : undefined,
    address: address.length ? address : undefined,
    organization: form.value.organization || undefined,
    title: form.value.title || undefined,
    birthday: formatDateForSave(form.value.birthday) || undefined,
    note: form.value.note || undefined,
    addressbookHref: props.addressbookHref
  })
}
</script>

<style scoped>
.contact-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.contact-modal {
  background: var(--oc-role-surface, #ffffff);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 448px;
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
}

.contact-modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--oc-role-on-surface, #191c1d);
}

.contact-modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-modal-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-modal-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--oc-role-on-surface, #191c1d);
}

.contact-modal-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  font-size: 0.9rem;
  background: var(--oc-role-surface, #ffffff);
  color: var(--oc-role-on-surface, #191c1d);
  box-sizing: border-box;
}

.contact-modal-input:focus {
  outline: none;
  border-color: var(--oc-role-primary, #00677f);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--oc-role-primary, #00677f) 15%, transparent);
}

.contact-modal-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.contact-modal-input-flex {
  flex: 1;
}

.contact-modal-remove-btn {
  padding: 8px 12px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  background: var(--oc-role-surface, #ffffff);
  color: var(--oc-role-error, #ba1a1a);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.contact-modal-remove-btn:hover {
  background: color-mix(in srgb, var(--oc-role-error-container, #ffdad6) 20%, transparent);
}

.contact-modal-add-link {
  font-size: 0.85rem;
  color: var(--oc-role-primary, #00677f);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
}

.contact-modal-add-link:hover {
  text-decoration: underline;
}

.contact-modal-address-block {
  margin-bottom: 8px;
}

.contact-modal-address-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.mb-2 {
  margin-bottom: 8px;
}

.contact-modal-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
  background: var(--oc-role-surface, #ffffff);
  color: var(--oc-role-on-surface, #191c1d);
  resize: vertical;
  box-sizing: border-box;
}

.contact-modal-textarea:focus {
  outline: none;
  border-color: var(--oc-role-primary, #00677f);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--oc-role-primary, #00677f) 15%, transparent);
}

.contact-modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
}

.contact-modal-actions-right {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.contact-modal-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  border: 1px solid var(--oc-role-outline-variant, #bfc8cc);
  background: var(--oc-role-surface, #ffffff);
  color: var(--oc-role-on-surface, #191c1d);
  font-weight: 500;
}

.contact-modal-btn:hover {
  background: var(--oc-role-surface-container-low, #fbfcfe);
}

.contact-modal-btn-save {
  background: var(--oc-role-primary, #00677f);
  color: var(--oc-role-on-primary, #ffffff);
  border-color: var(--oc-role-primary, #00677f);
}

.contact-modal-btn-save:hover {
  background: #004d5e;
}

.contact-modal-btn-danger {
  color: var(--oc-role-error, #ba1a1a);
  border-color: var(--oc-role-error, #ba1a1a);
}

.contact-modal-btn-danger:hover {
  background: color-mix(in srgb, var(--oc-role-error-container, #ffdad6) 20%, transparent);
}
</style>
