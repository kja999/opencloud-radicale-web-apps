import { CardDAVError, AuthenticationError, NotFoundError } from './errors'
import {
  buildPropfindCurrentUserPrincipal,
  buildPropfindAddressbookHome,
  buildPropfindAddressbooks
} from './xml-builder'
import { parseCurrentUserPrincipal, parseAddressbookHomeSet, parseAddressbooks } from './xml-parser'
import { authenticatedFetch } from './auth'
import type { Addressbook } from '../types/contacts'

const CARDDAV_BASE = '/carddav/'

async function propfind(url: string, body: string, depth: '0' | '1' = '0'): Promise<string> {
  const response = await authenticatedFetch(url, {
    method: 'PROPFIND',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: depth
    },
    body
  })

  if (response.status === 401) {
    throw new AuthenticationError()
  }
  if (response.status === 404) {
    throw new NotFoundError(`Resource not found: ${url}`)
  }
  if (!response.ok && response.status !== 207) {
    throw new CardDAVError(`PROPFIND failed: ${response.statusText}`, response.status)
  }

  return response.text()
}

export async function discoverUserPrincipal(): Promise<string> {
  const xml = await propfind(CARDDAV_BASE, buildPropfindCurrentUserPrincipal())
  const principal = parseCurrentUserPrincipal(xml)
  if (!principal) {
    throw new CardDAVError('Could not discover user principal')
  }
  return principal
}

export async function discoverAddressbookHome(principalUrl: string): Promise<string> {
  const xml = await propfind(principalUrl, buildPropfindAddressbookHome())
  const home = parseAddressbookHomeSet(xml)
  if (!home) {
    throw new CardDAVError('Could not discover addressbook home')
  }
  return home
}

export async function listAddressbooks(addressbookHomeUrl: string): Promise<Addressbook[]> {
  const xml = await propfind(addressbookHomeUrl, buildPropfindAddressbooks(), '1')
  const addressbookData = parseAddressbooks(xml)

  return addressbookData.map(data => ({
    href: data.href || '',
    displayName: data.displayName || 'Contacts',
    color: data.color || '#e74c3c',
    ctag: data.ctag || '',
    description: data.description,
    visible: true
  }))
}

export async function discoverAddressbooks(): Promise<Addressbook[]> {
  const principal = await discoverUserPrincipal()
  const home = await discoverAddressbookHome(principal)
  return listAddressbooks(home)
}
