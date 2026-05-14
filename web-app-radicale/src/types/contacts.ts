export interface Addressbook {
  href: string
  displayName: string
  description?: string
  color?: string
  ctag: string
  visible: boolean
}

export interface ContactAddress {
  street?: string
  city?: string
  region?: string
  postcode?: string
  country?: string
}

export interface Contact {
  uid: string
  href: string
  etag: string
  vcardData: string
  fn: string
  email?: string[]
  tel?: string[]
  address?: ContactAddress[]
  organization?: string
  title?: string
  photo?: string
  note?: string
  birthday?: string
}

export interface ContactFormData {
  uid?: string
  fn: string
  email?: string[]
  tel?: string[]
  address?: ContactAddress[]
  organization?: string
  title?: string
  photo?: string
  note?: string
  birthday?: string
  addressbookHref: string
}

export interface DateRange {
  start: Date
  end: Date
}
