export type TPodTemplateData = {
  metadata?: { name?: string }
  template?: {
    spec?: {
      containers?: Array<{ name?: string }>
    }
  }
}
