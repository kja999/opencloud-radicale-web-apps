export interface Addressbook {
  href: string
  displayName: string
  description?: string
  color?: string
  ctag: string
  visible: boolean
}

export interface Contact {
  uid: string
  href: string
  etag: string
  vcardData: string
  fn: string
  email?: string[]
  tel?: string[]
  address?: string[]
  organization?: string
  title?: string
  photo?: string
  note?: string
}

export interface ContactFormData {
  uid?: string
  fn: string
  email?: string[]
  tel?: string[]
  address?: string[]
  organization?: string
  title?: string
  photo?: string
  note?: string
  addressbookHref: string
}

export interface DateRange {
  start: Date
  end: Date
}
