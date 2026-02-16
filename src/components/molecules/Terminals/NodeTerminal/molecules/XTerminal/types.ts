export type TNodeTerminalPayload = {
  nodeName: string
  podTemplateName: string
  podTemplateNamespace: string
}

export type TPodReadyPayload = {
  namespace: string
  podName: string
  containers: string[]
}

export type TPodTerminalPayload = {
  namespace: string
  podName: string
  container: string
}
