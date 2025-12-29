// Payload sent to lifecycle WebSocket (terminalNode endpoint)
export type TNodeTerminalPayload = {
  nodeName: string
  podTemplateName: string
  podTemplateNamespace: string
}

// Response from lifecycle WebSocket when pod is ready
export type TPodReadyPayload = {
  namespace: string
  podName: string
  containers: string[]
}

// Payload sent to container terminal WebSocket (terminalPod endpoint)
export type TPodTerminalPayload = {
  namespace: string
  podName: string
  container: string
}
