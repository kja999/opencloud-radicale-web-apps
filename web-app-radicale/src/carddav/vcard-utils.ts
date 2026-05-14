import type { Contact, ContactFormData, ContactAddress } from '../types/contacts'

function unescapeVCardText(text: string): string {
  return text.replace(/\\n/gi, '\n').replace(/\\;/g, ';').replace(/\\,/g, ',').replace(/\\\\/g, '\\')
}

export function parseVCard(vcardData: string, href: string, etag: string): Contact | null {
  try {
    const unfoldedLines: string[] = []
    const rawLines = vcardData.split(/\r?\n/)
    for (const line of rawLines) {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        if (unfoldedLines.length > 0) {
          unfoldedLines[unfoldedLines.length - 1] += line.substring(1)
        }
      } else {
        unfoldedLines.push(line)
      }
    }

    let fn = ''
    const email: string[] = []
    const tel: string[] = []
    const address: ContactAddress[] = []
    let organization = ''
    let title = ''
    let photo = ''
    let note = ''
    let uid = ''
    let nValue = ''
    let birthday = ''

    for (const line of unfoldedLines) {
      if (!line.trim()) continue

      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) continue

      const keyPart = line.substring(0, colonIndex)
      const baseKey = keyPart.split(';')[0].toUpperCase()
      const rawValue = line.substring(colonIndex + 1).trim()
      const value = unescapeVCardText(rawValue)

      switch (baseKey) {
        case 'FN':
          fn = value
          break
        case 'N':
          nValue = rawValue
          break
        case 'EMAIL':
          email.push(value)
          break
        case 'TEL':
          tel.push(value)
          break
        case 'ADR': {
          const parts = rawValue.split(';')
          address.push({
            street: parts[2] || undefined,
            city: parts[3] || undefined,
            region: parts[4] || undefined,
            postcode: parts[5] || undefined,
            country: parts[6] || undefined
          })
          break
        }
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
        case 'BDAY':
          birthday = value
          break
        case 'UID':
          uid = value
          break
      }
    }

    if (!fn && nValue) {
      const parts = nValue.split(';')
      const lastName = parts[0] || ''
      const firstName = parts[1] || ''
      fn = [firstName, lastName].filter(p => p.trim()).join(' ') || lastName
    }

    if (!fn) {
      console.log('[parseVCard] Skipping contact - no FN:', href, 'N value:', nValue)
      return null
    }

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
      note: note || undefined,
      birthday: birthday || undefined
    }
  } catch {
    return null
  }
}

export function generateVCard(formData: ContactFormData): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeVCardText(formData.fn)}`]

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
      lines.push(
        `ADR:;;${escapeVCardText(a.street || '')};${escapeVCardText(a.city || '')};${escapeVCardText(a.region || '')};${escapeVCardText(a.postcode || '')};${escapeVCardText(a.country || '')}`
      )
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

  if (formData.birthday) {
    lines.push(`BDAY:${formData.birthday}`)
  }

  if (formData.note) {
    lines.push(`NOTE:${escapeVCardText(formData.note.replace(/\n/g, '\\n'))}`)
  }

  lines.push(`UID:${generateUID()}`)
  lines.push('END:VCARD')

  return lines.join('\r\n')
}

export function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@radicale`
}

function escapeVCardText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
}
