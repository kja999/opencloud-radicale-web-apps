import { ref } from 'vue'
import { useUserStore } from '@opencloud-eu/web-pkg'

type MessageFunction = () => string

const messages: Record<string, Record<string, string>> = {
  en: {
    'Web Calendar': 'Calendar',
    'Web Contacts': 'Contacts',
    'Calendar': 'Calendar',
    'Contacts': 'Contacts',
    'Today': 'Today',
    'Month': 'Month',
    'Week': 'Week',
    'Day': 'Day',
    'List': 'List',
    'All Day': 'All day',
    'Title': 'Title',
    'Start': 'Start',
    'End': 'End',
    'Description': 'Description',
    'Location': 'Location',
    'Save': 'Save',
    'Cancel': 'Cancel',
    'Delete': 'Delete',
    'Edit': 'Edit',
    'Create': 'Create',
    'Delete Event': 'Delete Event',
    'Edit Event': 'Edit Event',
    'New Event': 'New Event',
    'Delete Contact': 'Delete Contact',
    'Edit Contact': 'Edit Contact',
    'New Contact': 'New Contact',
    'Name': 'Name',
    'Email': 'Email',
    'Phone': 'Phone',
    'Address': 'Address',
    'Organization': 'Organization',
    'Title.Job': 'Title',
    'Note': 'Note',
    'No events': 'No events',
    'No contacts': 'No contacts',
    'Loading...': 'Loading...',
    'Error loading data': 'Error loading data',
    'Recurring event': 'Recurring event',
    'First Name': 'First Name',
    'Last Name': 'Last Name'
  },
  de: {
    'Web Calendar': 'Kalender',
    'Web Contacts': 'Kontakte',
    'Calendar': 'Kalender',
    'Contacts': 'Kontakte',
    'Today': 'Heute',
    'Month': 'Monat',
    'Week': 'Woche',
    'Day': 'Tag',
    'List': 'Liste',
    'All Day': 'Ganztägig',
    'Title': 'Titel',
    'Start': 'Start',
    'End': 'Ende',
    'Description': 'Beschreibung',
    'Location': 'Ort',
    'Save': 'Speichern',
    'Cancel': 'Abbrechen',
    'Delete': 'Löschen',
    'Edit': 'Bearbeiten',
    'Create': 'Erstellen',
    'Delete Event': 'Termin löschen',
    'Edit Event': 'Termin bearbeiten',
    'New Event': 'Neuer Termin',
    'Delete Contact': 'Kontakt löschen',
    'Edit Contact': 'Kontakt bearbeiten',
    'New Contact': 'Neuer Kontakt',
    'Name': 'Name',
    'Email': 'E-Mail',
    'Phone': 'Telefon',
    'Address': 'Adresse',
    'Organization': 'Organisation',
    'Title.Job': 'Titel',
    'Note': 'Notiz',
    'No events': 'Keine Termine',
    'No contacts': 'Keine Kontakte',
    'Loading...': 'Laden...',
    'Error loading data': 'Fehler beim Laden',
    'Recurring event': 'Wiederkehrender Termin'
  }
}

const currentLocale = ref('en')

export function initLanguage(): void {
  try {
    const userStore = useUserStore()
    if (userStore.user) {
      const user = userStore.user
      const info = 'value' in user ? user.value : user
      if (info && (info as any).displayName) {
        // Could check user preferences for language
      }
    }
  } catch {
    // Fall back to English
  }
}

export function t(key: string): string {
  const locale = currentLocale.value
  return messages[locale]?.[key] || messages['en']?.[key] || key
}

export function useLanguage() {
  return {
    t: (key: string) => messages[currentLocale.value]?.[key] || messages['en']?.[key] || key,
    locale: currentLocale
  }
}