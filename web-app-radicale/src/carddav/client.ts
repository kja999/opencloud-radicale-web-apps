import { discoverAddressbooks, listAddressbooks } from './discovery'
import {
  fetchContacts as fetchContactsFromAddressbook,
  createContact,
  updateContact,
  deleteContact,
  fetchSingleContact
} from './contacts'
import type { Addressbook, Contact, ContactFormData } from '../types/contacts'

export {
  CardDAVError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  NetworkError
} from './errors'

export interface CardDAVClient {
  discoverAddressbooks(): Promise<Addressbook[]>
  refreshAddressbooks(addressbookHomeUrl: string): Promise<Addressbook[]>
  fetchContacts(addressbookHref: string): Promise<Contact[]>
  fetchAllContacts(addressbooks: Addressbook[]): Promise<Contact[]>
  createContact(formData: ContactFormData): Promise<Contact>
  updateContact(contact: Contact, formData: ContactFormData): Promise<Contact>
  deleteContact(contact: Contact): Promise<void>
  fetchSingleContact(href: string): Promise<Contact | null>
}

export function createCardDAVClient(): CardDAVClient {
  return {
    discoverAddressbooks,

    refreshAddressbooks: listAddressbooks,

    fetchContacts: fetchContactsFromAddressbook,

    async fetchAllContacts(addressbooks: Addressbook[]): Promise<Contact[]> {
      const visibleAddressbooks = addressbooks.filter((ab) => ab.visible)
      const results = await Promise.all(
        visibleAddressbooks.map((ab) => fetchContactsFromAddressbook(ab.href))
      )
      return results.flat()
    },

    createContact,
    updateContact,
    deleteContact,
    fetchSingleContact
  }
}

let clientInstance: CardDAVClient | null = null

export function getCardDAVClient(): CardDAVClient {
  if (!clientInstance) {
    clientInstance = createCardDAVClient()
  }
  return clientInstance
}