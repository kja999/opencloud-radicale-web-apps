import { ref } from 'vue'
import { useUserStore } from '@opencloud-eu/web-pkg'

const messages: Record<string, Record<string, string>> = {
  en: {
    'Web Calendar': 'My Calendar',
    'Web Contacts': 'My Contacts',
    Calendar: 'My Calendar',
    Contacts: 'My Contacts',
    Today: 'Today',
    Month: 'Month',
    Week: 'Week',
    Day: 'Day',
    List: 'List',
    'All Day': 'All day',
    Title: 'Title',
    Start: 'Start',
    End: 'End',
    Description: 'Description',
    Location: 'Location',
    Save: 'Save',
    Cancel: 'Cancel',
    Delete: 'Delete',
    Edit: 'Edit',
    Create: 'Create',
    'Delete Event': 'Delete Event',
    'Edit Event': 'Edit Event',
    'New Event': 'New Event',
    'Delete Contact': 'Delete Contact',
    'Edit Contact': 'Edit Contact',
    'New Contact': 'New Contact',
    Name: 'Name',
    Email: 'Email',
    Phone: 'Phone',
    Address: 'Address',
    Organization: 'Organization',
    'Title.Job': 'Title',
    Note: 'Note',
    'No events': 'No events',
    'No contacts': 'No contacts',
    'Loading...': 'Loading...',
    'Error loading data': 'Error loading data',
    Dismiss: 'Dismiss',
    'Recurring event': 'Recurring event',
    'First Name': 'First Name',
    'Last Name': 'Last Name',
    'End must be after start': 'End must be after start',
    Repeat: 'Repeat',
    Frequency: 'Frequency',
    Every: 'Every',
    Ends: 'Ends',
    Never: 'Never',
    After: 'After',
    'On date': 'On date',
    occurrences: 'occurrences',
    Daily: 'Daily',
    Weekly: 'Weekly',
    Monthly: 'Monthly',
    Yearly: 'Yearly',
    'This event only': 'This event only',
    'This and future events': 'This and future events',
    'All events in series': 'All events in series'
  },
  de: {
    'Web Calendar': 'Mein Kalender',
    'Web Contacts': 'Meine Kontakte',
    Calendar: 'Mein Kalender',
    Contacts: 'Meine Kontakte',
    Today: 'Heute',
    Month: 'Monat',
    Week: 'Woche',
    Day: 'Tag',
    List: 'Liste',
    'All Day': 'Ganztägig',
    Title: 'Titel',
    Start: 'Start',
    End: 'Ende',
    Description: 'Beschreibung',
    Location: 'Ort',
    Save: 'Speichern',
    Cancel: 'Abbrechen',
    Delete: 'Löschen',
    Edit: 'Bearbeiten',
    Create: 'Erstellen',
    'Delete Event': 'Termin löschen',
    'Edit Event': 'Termin bearbeiten',
    'New Event': 'Neuer Termin',
    'Delete Contact': 'Kontakt löschen',
    'Edit Contact': 'Kontakt bearbeiten',
    'New Contact': 'Neuer Kontakt',
    Name: 'Name',
    Email: 'E-Mail',
    Phone: 'Telefon',
    Address: 'Adresse',
    Organization: 'Organisation',
    'Title.Job': 'Titel',
    Note: 'Notiz',
    'No events': 'Keine Termine',
    'No contacts': 'Keine Kontakte',
    'Loading...': 'Laden...',
    'Error loading data': 'Fehler beim Laden',
    'Recurring event': 'Wiederkehrender Termin',
    'End must be after start': 'Ende muss nach Start liegen',
    Repeat: 'Wiederholen',
    Frequency: 'Häufigkeit',
    Every: 'Alle',
    Ends: 'Endet',
    Never: 'Nie',
    After: 'Nach',
    'On date': 'Am Datum',
    occurrences: 'Wiederholungen',
    Daily: 'Täglich',
    Weekly: 'Wöchentlich',
    Monthly: 'Monatlich',
    Yearly: 'Jährlich',
    'This event only': 'Nur dieses Ereignis',
    'This and future events': 'Dieses und zukünftige Ereignisse',
    'All events in series': 'Alle Ereignisse der Serie'
  }
}

const currentLocale = ref('en')

export function initLanguage(): void {
  try {
    const userStore = useUserStore()
    if (userStore.user) {
      const user = userStore.user
      const info = 'value' in user ? user.value : user
      if (info && typeof info === 'object' && 'displayName' in info) {
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
