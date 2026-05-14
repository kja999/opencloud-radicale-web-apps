import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EventModal from '../../src/components/calendar/EventModal.vue'

vi.mock('../../src/composables/useLanguage', () => ({
  t: (key: string) => key,
  useLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } })
}))

describe('EventModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createWrapper = (props = {}) => {
    return mount(EventModal, {
      props: {
        event: null,
        calendarHref: '/cal/',
        ...props
      },
      global: {
        stubs: {
          teleport: true
        }
      }
    })
  }

  describe('rendering', () => {
    it('renders with new event title when no event prop', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.event-modal-title').text()).toBe('New Event')
    })

    it('renders with edit event title when event prop provided', () => {
      const event = {
        uid: 'event-123',
        summary: 'Test Event',
        start: new Date(),
        end: new Date(),
        allDay: false,
        isRecurring: false
      }
      const wrapper = createWrapper({ event })
      expect(wrapper.find('.event-modal-title').text()).toBe('Edit Event')
    })

    it('shows all-day checkbox checked by default', () => {
      const wrapper = createWrapper()
      const checkbox = wrapper.find('#eventAllDay')
      expect((checkbox.element as HTMLInputElement).checked).toBe(true)
    })

    it('shows recurrence section when editing recurring event', () => {
      const event = {
        uid: 'event-123',
        summary: 'Recurring Event',
        start: new Date(),
        end: new Date(),
        allDay: true,
        isRecurring: true,
        rrule: { freq: 'WEEKLY', interval: 1 }
      }
      const wrapper = createWrapper({ event })
      const repeatCheckbox = wrapper.find('#eventRepeat')
      expect((repeatCheckbox.element as HTMLInputElement).checked).toBe(true)
    })
  })

  describe('form fields', () => {
    it('has title input field', () => {
      const wrapper = createWrapper()
      const inputs = wrapper.findAll('input')
      const titleInput = inputs.find(i => i.attributes('type') === 'text' && i.attributes('required') !== undefined)
      expect(titleInput.exists()).toBe(true)
    })

    it('has location input field', () => {
      const wrapper = createWrapper()
      const labels = wrapper.findAll('label')
      const locationLabel = labels.find(l => l.text() === 'Location')
      expect(locationLabel.exists()).toBe(true)
    })

    it('has description textarea', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('textarea').exists()).toBe(true)
    })

    it('has save button', () => {
      const wrapper = createWrapper()
      const saveBtn = wrapper.find('.event-modal-btn-save')
      expect(saveBtn.exists()).toBe(true)
    })

    it('has cancel button', () => {
      const wrapper = createWrapper()
      const cancelBtn = wrapper.find('.event-modal-btn-cancel')
      expect(cancelBtn.exists()).toBe(true)
    })
  })

  describe('color picker', () => {
    it('has color swatches for new event', () => {
      const wrapper = createWrapper()
      const colorSwatches = wrapper.findAll('.color-swatch')
      expect(colorSwatches.length).toBe(12)
    })
  })

  describe('validation', () => {
    it('has date inputs for start and end', () => {
      const wrapper = createWrapper()
      const dateInputs = wrapper.findAll('input[type="date"]')
      expect(dateInputs.length).toBe(2)
    })

    it('has time inputs hidden when all-day is checked', () => {
      const wrapper = createWrapper()
      expect(wrapper.findAll('input[type="time"]').length).toBe(0)
    })
  })

  describe('events', () => {
    it('emits close when cancel clicked', async () => {
      const wrapper = createWrapper()

      const cancelBtn = wrapper.find('.event-modal-btn-cancel')
      await cancelBtn.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits delete when delete button clicked', async () => {
      const event = {
        uid: 'event-123',
        summary: 'Test',
        start: new Date(),
        end: new Date(),
        allDay: false,
        isRecurring: false
      }
      const wrapper = createWrapper({ event })

      const deleteBtn = wrapper.find('.event-modal-btn-danger')
      await deleteBtn.trigger('click')

      expect(wrapper.emitted('delete')).toBeTruthy()
    })

    it('does not show delete button for new events', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.event-modal-btn-danger').exists()).toBe(false)
    })
  })

  describe('recurring event save', () => {
    it('shows save dropdown for recurring events', () => {
      const event = {
        uid: 'event-123',
        summary: 'Recurring Event',
        start: new Date(),
        end: new Date(),
        allDay: false,
        isRecurring: true,
        rrule: { freq: 'WEEKLY', interval: 1 }
      }
      const wrapper = createWrapper({ event })
      const saveDropdown = wrapper.find('.save-dropdown')
      expect(saveDropdown.exists()).toBe(true)
    })

    it('shows scope options when save dropdown clicked', async () => {
      const event = {
        uid: 'event-123',
        summary: 'Recurring Event',
        start: new Date(),
        end: new Date(),
        allDay: false,
        isRecurring: true,
        rrule: { freq: 'WEEKLY', interval: 1 }
      }
      const wrapper = createWrapper({ event })

      const saveBtn = wrapper.find('.save-dropdown .event-modal-btn-save')
      await saveBtn.trigger('click')

      const menu = wrapper.find('.save-dropdown-menu')
      expect(menu.exists()).toBe(true)
      expect(menu.findAll('button').length).toBe(3)
    })
  })
})
