export function buildPropfindCurrentUserPrincipal(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:current-user-principal />
  </D:prop>
</D:propfind>`
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
