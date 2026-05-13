export function buildPropfindCurrentUserPrincipal(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:current-user-principal />
  </D:prop>
</D:propfind>`
}

export function buildPropfindCalendarHome(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <C:calendar-home-set />
  </D:prop>
</D:propfind>`
}

export function buildPropfindCalendars(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:displayname />
    <D:resourcetype />
    <C:calendar-description />
    <C:calendar-color />
    <C:ctag />
  </D:prop>
</D:propfind>`
}

export function buildCalendarQuery(start: Date, end: Date): string {
  const formatDate = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')

  return `<?xml version="1.0" encoding="UTF-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag />
    <C:calendar-data />
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${formatDate(start)}" end="${formatDate(end)}" />
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`
}

export function buildPropfindAddressbookHome(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:" xmlns:CA="urn:ietf:params:xml:ns:carddav">
  <D:prop>
    <CA:addressbook-home-set />
  </D:prop>
</D:propfind>`
}

export function buildPropfindAddressbooks(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:" xmlns:CA="urn:ietf:params:xml:ns:carddav">
  <D:prop>
    <D:displayname />
    <D:resourcetype />
    <CA:addressbook-description />
    <CA:addressbook-color />
    <C:ctag />
  </D:prop>
</D:propfind>`
}

export function buildAddressbookQuery(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<D:addressbook-query xmlns:D="DAV:" xmlns:CA="urn:ietf:params:xml:ns:carddav">
  <D:prop>
    <D:getetag />
    <CA:address-data />
  </D:prop>
  <CA:filter />
</D:addressbook-query>`
}
