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
    }
    instances?: {
      clear: string
      change: string
      mapOptionsPattern?: string
    }
    namespaces?: {
      clear: string
      change: string
    }
    baseFactoriesMapping?: Record<string, string>
  }
}
