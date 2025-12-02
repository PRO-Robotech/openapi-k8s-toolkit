export type TNavigationResource = unknown & {
  metadata: {
    name: string
    creationTimestamp: string
    uid?: string
    namespace?: string
  }
  spec?: {
    projects?: {
      clear: string
      change: string
      aliasPath?: string
    }
    instances?: {
      clear: string
      change: string
      mapOptionsPattern?: string
      aliasPath?: string
    }
    namespaces?: {
      clear: string
      change: string
      aliasPath?: string
    }
    baseFactoriesMapping?: Record<string, string>
  }
}
