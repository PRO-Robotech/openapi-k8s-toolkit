/* eslint-disable max-lines-per-function */
/* eslint-disable consistent-return */
/* eslint-disable no-console */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useCallback, useEffect, useRef, useState, type RefCallback } from 'react'
// @ts-ignore
import RFB from 'novnc-next'

type TRFBInstance = any

export type TScalingMode = 'none' | 'local' | 'remote'

type TUseVNCClientOptions = {
  cluster?: string
  namespace?: string
  vmName?: string

  /**
   * Override websocket path or full ws(s) URL.
   * - If starts with ws:// or wss:// it's used as-is.
   * - Otherwise it's treated as a path under current host.
   */
  forcedFullWsPath?: string
}

type TUseVNCClientResult = {
  // refs
  screenRef: RefCallback<HTMLDivElement> // IMPORTANT: callback ref compatible

  // state
  isLoading: boolean
  error: string | null
  status: string
  isConnected: boolean
  showDotCursor: boolean
  scalingMode: TScalingMode

  // actions
  setShowDotCursor: (value: boolean) => void
  setScalingMode: (mode: TScalingMode) => void
  disconnect: () => void
  reconnect: () => void
  sendCtrlAltDel: () => void
}

/**
 * Builds default KubeVirt VNC WS path.
 *
 * Assumption (adjust if your backend differs):
 * - Single-cluster proxy: /k8s/...
 * - Multi-cluster proxy:  /k8s/clusters/<cluster>/...
 */
const buildDefaultWsPath = (cluster: string | undefined, namespace: string, vmName: string) => {
  const base = cluster ? `/k8s/clusters/${encodeURIComponent(cluster)}` : `/k8s`

  return `${base}/apis/subresources.kubevirt.io/v1/namespaces/${encodeURIComponent(
    namespace,
  )}/virtualmachineinstances/${encodeURIComponent(vmName)}/vnc`
}

const normalizePath = (p: string) => (p.startsWith('/') ? p : `/${p}`)

export const useVNCClient = ({
  cluster,
  namespace,
  vmName,
  forcedFullWsPath,
}: TUseVNCClientOptions): TUseVNCClientResult => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Loading VNC client...')
  const [isConnected, setIsConnected] = useState(false)

  const [showDotCursor, setShowDotCursor] = useState(false)
  const [scalingMode, setScalingModeState] = useState<TScalingMode>('local')

  // This is the critical fix: store the actual mounted element in state
  const [screenEl, setScreenEl] = useState<HTMLDivElement | null>(null)

  // Callback ref so mounting triggers state update -> effect reruns
  const screenRef = useCallback<RefCallback<HTMLDivElement>>(node => {
    setScreenEl(node)
  }, [])

  const rfbRef = useRef<TRFBInstance | null>(null)

  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState(false)
  const [, setReconnectAttempts] = useState(0)
  const [shouldReconnect, setShouldReconnect] = useState(true)
  const [connectionKey, setConnectionKey] = useState(0)

  const reconnectTimeoutRef = useRef<number | null>(null)
  const isManuallyDisconnectedRef = useRef(false)
  const shouldReconnectRef = useRef(true)
  const showDotCursorRef = useRef(showDotCursor)

  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  // keep refs in sync with state
  useEffect(() => {
    isManuallyDisconnectedRef.current = isManuallyDisconnected
  }, [isManuallyDisconnected])

  useEffect(() => {
    shouldReconnectRef.current = shouldReconnect
  }, [shouldReconnect])

  useEffect(() => {
    showDotCursorRef.current = showDotCursor

    if (rfbRef.current && typeof rfbRef.current.showDotCursor !== 'undefined') {
      try {
        rfbRef.current.showDotCursor = showDotCursor
      } catch (err) {
        console.error('Error updating dot cursor:', err)
      }
    }
  }, [showDotCursor, isConnected])

  const applyScalingMode = (rfb: TRFBInstance, mode: TScalingMode) => {
    if (!rfb) return

    if (mode === 'none') {
      rfb.scaleViewport = false
      rfb.resizeSession = false
    } else if (mode === 'local') {
      rfb.scaleViewport = true
      rfb.resizeSession = false
    } else {
      rfb.scaleViewport = false
      rfb.resizeSession = true
    }
  }

  const setScalingMode = useCallback((mode: TScalingMode) => {
    setScalingModeState(mode)
    if (rfbRef.current) {
      applyScalingMode(rfbRef.current, mode)
    }
  }, [])

  // ---- Core connection effect ----
  useEffect(() => {
    console.log('[VMVNC hook] effect run', {
      cluster,
      namespace,
      vmName,
      connectionKey,
      hasScreenEl: !!screenEl,
      forcedFullWsPath,
    })

    const hasForced = !!forcedFullWsPath
    const hasNamespaceVm = !!namespace && !!vmName

    // Validate config:
    // You want to use (cluster + namespace + vmName) OR forcedFullWsPath
    if (!hasForced && !hasNamespaceVm) {
      setIsLoading(false)
      setIsConnected(false)
      setStatus('VNC not configured')
      setError('Provide forcedFullWsPath or both namespace and vmName for VNC connection')
      return
    }

    // Wait until target element exists
    if (!screenEl) {
      setIsLoading(true)
      setError(null)
      setStatus('Waiting for VNC container...')
      return
    }

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setIsLoading(true)
    setError(null)
    setStatus('Connecting...')

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const { host } = window.location

    // Build default path only when we have the required pieces
    const defaultWsPath = namespace && vmName ? buildDefaultWsPath(cluster, namespace, vmName) : undefined

    // Resolve final wsPath/wsUrl
    const wsPath = (() => {
      if (forcedFullWsPath && !forcedFullWsPath.startsWith('ws')) {
        return normalizePath(forcedFullWsPath)
      }
      return defaultWsPath
    })()

    const wsUrl =
      forcedFullWsPath && forcedFullWsPath.startsWith('ws') ? forcedFullWsPath : `${protocol}//${host}${wsPath ?? ''}`

    console.log(`[VMVNC ${namespace ?? 'no-ns'}/${vmName ?? 'no-vm'}]: WebSocket URL: ${wsUrl}`)
    console.log(`[VMVNC ${namespace ?? 'no-ns'}/${vmName ?? 'no-vm'}]: WebSocket path: ${wsPath}`)

    // If we got here without forced ws URL and failed to build a path, bail safely
    if (!forcedFullWsPath?.startsWith('ws') && !wsPath) {
      setIsLoading(false)
      setIsConnected(false)
      setStatus('VNC not configured')
      setError('Unable to build WebSocket path. Provide forcedFullWsPath or namespace+vmName.')
      return
    }

    let cancelled = false

    try {
      // Create RFB
      const rfb: TRFBInstance = new (RFB as any)(screenEl, wsUrl, {
        credentials: { password: '' },
        showDotCursor: showDotCursorRef.current,
      })

      rfbRef.current = rfb
      applyScalingMode(rfb, scalingMode)

      // Safety re-apply
      if (typeof rfb.showDotCursor !== 'undefined') {
        try {
          rfb.showDotCursor = showDotCursorRef.current
        } catch (err) {
          console.error('Error setting dot cursor on RFB instance:', err)
        }
      }

      const handleConnect = () => {
        if (cancelled) return
        console.log(`[VMVNC ${namespace}/${vmName}]: Connected`)
        setStatus('Connected')
        setIsLoading(false)
        setError(null)
        setIsConnected(true)
        setReconnectAttempts(0)

        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      const handleDisconnect = (e: any) => {
        if (cancelled) return

        const detail = e?.detail as { clean?: boolean } | undefined
        const wasManuallyDisconnected = isManuallyDisconnectedRef.current
        const autoReconnectEnabled = shouldReconnectRef.current

        console.log(
          `[VMVNC ${namespace}/${vmName}]: Disconnected (clean=${detail?.clean}, manual=${wasManuallyDisconnected}, autoReconnect=${autoReconnectEnabled})`,
        )

        setIsConnected(false)
        setIsLoading(false)

        if (wasManuallyDisconnected) {
          setStatus('Disconnected')
          setError(null)
          return
        }

        if (!autoReconnectEnabled) {
          if (detail?.clean) {
            setStatus('Disconnected')
          } else {
            setStatus('Connection closed')
            setError('Connection closed unexpectedly')
          }
          return
        }

        if (detail?.clean) {
          setStatus('Disconnected - Reconnecting...')
          setError(null)
        } else {
          setStatus('Connection closed - Reconnecting...')
          setError('Connection closed unexpectedly')
        }

        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (isManuallyDisconnectedRef.current || !shouldReconnectRef.current) {
            console.log(`[VMVNC ${namespace}/${vmName}]: Reconnect cancelled before attempting`)
            return
          }

          setReconnectAttempts(prev => {
            const next = prev + 1
            if (next > maxReconnectAttempts) {
              console.log(`[VMVNC ${namespace}/${vmName}]: Max reconnect attempts reached (${maxReconnectAttempts})`)
              setStatus('Connection failed - Max reconnect attempts reached')
              setError('Failed to reconnect after multiple attempts')
              setIsLoading(false)
              setShouldReconnect(false)
              return prev
            }

            console.log(
              `[VMVNC ${namespace}/${vmName}]: Reconnect attempt ${next}/${maxReconnectAttempts} (bump connectionKey)`,
            )

            setStatus(`Reconnecting... (Attempt ${next}/${maxReconnectAttempts})`)
            setIsLoading(true)
            setError(null)

            setConnectionKey(k => k + 1)
            return next
          })
        }, reconnectDelay)
      }

      const handleCredentialsRequired = () => {
        if (cancelled) return
        console.log(`[VMVNC ${namespace}/${vmName}]: Credentials required`)
        setStatus('Credentials required')
      }

      const handleSecurityFailure = (e: any) => {
        if (cancelled) return
        const detail = e?.detail as { status?: number; reason?: string } | undefined
        console.error(`[VMVNC ${namespace}/${vmName}]: Security failure`, detail)
        setError(`Security failure: ${detail?.reason || 'Unknown error'}`)
        setIsLoading(false)
        setIsConnected(false)
      }

      const handleDesktopName = (e: any) => {
        if (cancelled) return
        const detail = e?.detail as { name?: string } | undefined
        if (detail?.name) {
          console.log(`[VMVNC ${namespace}/${vmName}]: Desktop name: ${detail.name}`)
          setStatus(`Connected to ${detail.name}`)
        }
      }

      rfb.addEventListener('connect', handleConnect)
      rfb.addEventListener('disconnect', handleDisconnect)
      rfb.addEventListener('credentialsrequired', handleCredentialsRequired)
      rfb.addEventListener('securityfailure', handleSecurityFailure)
      rfb.addEventListener('desktopname', handleDesktopName)

      return () => {
        cancelled = true
        console.log(`[VMVNC ${namespace}/${vmName}]: Cleaning up connection`)

        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }

        if (rfbRef.current) {
          try {
            rfbRef.current.disconnect()
          } catch (err) {
            console.error('Error disconnecting RFB during cleanup:', err)
          }
          rfbRef.current = null
        }

        // clear target children
        if (screenEl) {
          while (screenEl.firstChild) {
            screenEl.removeChild(screenEl.firstChild)
          }
        }
      }
    } catch (err) {
      console.error(`[VMVNC ${namespace}/${vmName}]: Error creating RFB connection:`, err)
      setError(`Failed to create VNC connection: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsLoading(false)
      setIsConnected(false)
      setStatus('Failed to create VNC connection')
    }
  }, [cluster, namespace, vmName, forcedFullWsPath, scalingMode, connectionKey, screenEl])

  // ---- Public actions ----

  const disconnect = useCallback(() => {
    isManuallyDisconnectedRef.current = true
    shouldReconnectRef.current = false
    setIsManuallyDisconnected(true)
    setShouldReconnect(false)

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (rfbRef.current) {
      try {
        rfbRef.current.disconnect()
      } catch (err) {
        console.error('Error disconnecting RFB:', err)
      }
      rfbRef.current = null
    }

    setStatus('Disconnected')
    setIsLoading(false)
    setIsConnected(false)
  }, [])

  const reconnect = useCallback(() => {
    isManuallyDisconnectedRef.current = false
    shouldReconnectRef.current = true
    setIsManuallyDisconnected(false)
    setShouldReconnect(true)
    setReconnectAttempts(0)
    setError(null)
    setIsLoading(true)
    setStatus('Reconnecting...')

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (rfbRef.current) {
      try {
        rfbRef.current.disconnect()
      } catch (err) {
        console.error('Error disconnecting RFB before manual reconnect:', err)
      }
      rfbRef.current = null
    }

    setConnectionKey(k => k + 1)
  }, [])

  const sendCtrlAltDel = () => {
    if (!rfbRef.current) return
    try {
      rfbRef.current.sendCtrlAltDel()
    } catch (err) {
      console.error('Error sending Ctrl+Alt+Del:', err)
    }
  }

  return {
    screenRef,
    isLoading,
    error,
    status,
    isConnected,
    showDotCursor,
    scalingMode,
    setShowDotCursor,
    setScalingMode,
    disconnect,
    reconnect,
    sendCtrlAltDel,
  }
}
