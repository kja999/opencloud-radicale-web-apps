import { XMLParser } from 'fast-xml-parser'

export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  trimValues: true,
  removeNSPrefix: true
})

export interface PropfindResponse {
  multistatus?: {
    response?: PropfindResponseItem | PropfindResponseItem[]
  }
}

export interface PropfindResponseItem {
  href: string
  propstat?: PropstatContainer | PropstatContainer[]
}

export interface PropstatContainer {
  prop: Record<string, unknown>
}

export function extractProp(propstat: unknown): Record<string, unknown> | null {
  if (!propstat) return null
  if (Array.isArray(propstat)) {
    for (const p of propstat) {
      if (p && typeof p === 'object' && 'prop' in p) {
        const container = p as PropstatContainer
        return container.prop || null
      }
    }
    return null
  }
  if (typeof propstat === 'object' && propstat !== null && 'prop' in propstat) {
    const container = propstat as PropstatContainer
    return container.prop || null
  }
  return null
}

export function extractResponses(xml: string): PropfindResponseItem[] {
  try {
    const result = parser.parse(xml) as PropfindResponse
    const responses = result.multistatus?.response
    if (!responses) return []
    return Array.isArray(responses) ? responses : [responses]
  } catch {
    return []
  }
}
