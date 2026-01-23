export type TPodTerminalProps = {
  id: number | string
  cluster: string
  namespace: string
  podName: string
  substractHeight?: number
}
export type TNodeTerminalProps = {
  id: number | string
  cluster: string
  nodeName: string
  substractHeight?: number
  listPodTemplatesNs: string // Required - namespace where PodTemplates are stored
}

export type TPodLogsProps = {
  id: number | string
  cluster: string
  namespace: string
  podName: string
  substractHeight?: number
  tailLines?: number
  sinceSeconds?: number
  sinceTime?: string // RFC3339 timestamp (e.g., "2024-01-01T00:00:00Z")
  limitBytes?: number
}
