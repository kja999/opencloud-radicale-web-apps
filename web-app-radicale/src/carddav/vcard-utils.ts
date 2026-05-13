import type { Contact, ContactFormData } from '../types/contacts'

export function parseVCard(vcardData: string, href: string, etag: string): Contact | null {
  try {
    const lines = vcardData.split(/\r?\n/)
    let fn = ''
    const email: string[] = []
    const tel: string[] = []
    const address: string[] = []
    let organization = ''
    let title = ''
    let photo = ''
    let note = ''
    let uid = ''

    for (const line of lines) {
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) continue

      const key = line.substring(0, colonIndex).toUpperCase()
      const value = line.substring(colonIndex + 1).trim()

      switch (key) {
        case 'FN':
          fn = value
          break
        case 'EMAIL':
          email.push(value)
          break
        case 'TEL':
          tel.push(value)
          break
        case 'ADR':
          address.push(value)
          break
        case 'ORG':
          organization = value
          break
        case 'TITLE':
          title = value
          break
        case 'PHOTO':
          photo = value
          break
        case 'NOTE':
          note = value
          break
        case 'UID':
          uid = value
          break
      }
    }

    if (!fn) return null

    return {
      uid: uid || generateUID(),
      href,
      etag,
      vcardData,
      fn,
      email: email.length > 0 ? email : undefined,
      tel: tel.length > 0 ? tel : undefined,
      address: address.length > 0 ? address : undefined,
      organization: organization || undefined,
      title: title || undefined,
      photo: photo || undefined,
      note: note || undefined
    }
  } catch {
    return null
  }
}

export function generateVCard(formData: ContactFormData): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardText(formData.fn)}`
  ]

  if (formData.email?.length) {
    for (const e of formData.email) {
      lines.push(`EMAIL:${escapeVCardText(e)}`)
    }
  }

  if (formData.tel?.length) {
    for (const t of formData.tel) {
      lines.push(`TEL:${escapeVCardText(t)}`)
    }
  }

  if (formData.address?.length) {
    for (const a of formData.address) {
      lines.push(`ADR:;;${escapeVCardText(a)}`)
    }
  }

  if (formData.organization) {
    lines.push(`ORG:${escapeVCardText(formData.organization)}`)
  }

  if (formData.title) {
    lines.push(`TITLE:${escapeVCardText(formData.title)}`)
  }

  if (formData.photo) {
    lines.push(`PHOTO:${formData.photo}`)
  }

  if (formData.note) {
    lines.push(`NOTE:${escapeVCardText(formData.note)}`)
  }

  lines.push(`UID:${generateUID()}`)
  lines.push('END:VCARD')

  return lines.join('\r\n')
}

export function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@radicale`
}

function escapeVCardText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}