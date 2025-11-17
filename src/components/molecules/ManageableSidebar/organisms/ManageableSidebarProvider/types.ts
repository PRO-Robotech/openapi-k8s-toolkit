export type TLink = {
  key: string
  label: string
  link?: string
  children?: TLink[]
}

export type TCrdResource = {
  apiVersion: string
  kind: string
  spec: {
    id: string
    menuItems: TLink[]
    keysAndTags?: Record<string, string[]>
    externalKeys?: string[]
  }
} & unknown

export type TSidebarResponse = {
  apiVersion: string
  items: TCrdResource[]
}
