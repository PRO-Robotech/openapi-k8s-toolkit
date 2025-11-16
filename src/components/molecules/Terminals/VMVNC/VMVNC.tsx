/* eslint-disable no-console */
import React, { FC, useEffect, useState, useRef, useCallback } from 'react'
import { Result, Spin, Button, Switch, Space, Tooltip, Dropdown, MenuProps, Radio } from 'antd'
import { CloseOutlined, FullscreenOutlined, FullscreenExitOutlined, PoweroffOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { Styled } from './styled'

// Type definition for RFB (noVNC doesn't have TypeScript definitions)
type RFB = any

export type TVMVNCProps = {
  cluster: string
  namespace: string
  vmName: string
  substractHeight: number
}

export const VMVNC: FC<TVMVNCProps> = ({ cluster, namespace, vmName, substractHeight }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('Loading VNC client...')
  const [rfbModule, setRfbModule] = useState<any>(null)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [showDotCursor, setShowDotCursor] = useState<boolean>(false)
  // Scaling mode state (default: 'local' - local scaling)
  const [scalingMode, setScalingMode] = useState<'none' | 'local' | 'remote'>('local')
  // Derived states for scaleViewport and resizeSession based on scalingMode
  const scaleViewport = scalingMode === 'local'
  const resizeSession = scalingMode === 'remote'
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState<boolean>(false)
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0)
  const [shouldReconnect, setShouldReconnect] = useState<boolean>(true)

  const screenRef = useRef<HTMLDivElement>(null)
  const rfbRef = useRef<RFB | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isManuallyDisconnectedRef = useRef<boolean>(false)
  const shouldReconnectRef = useRef<boolean>(true)
  const rfbModuleRef = useRef<any>(null)
  const scheduleReconnectRef = useRef<(() => void) | null>(null)
  const showDotCursorRef = useRef<boolean>(false)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000 // 3 seconds

  // Dynamically load noVNC to avoid build issues with top-level await
  useEffect(() => {
    let isMounted = true

    const loadNoVNC = async () => {
      try {
        // Dynamic import of noVNC
        // The consuming app's Vite config will resolve this module and bundle it properly
        // @ts-ignore - noVNC doesn't have TypeScript definitions
        const RFBModule = await import('@novnc/novnc/lib/rfb.js')
        
        // Log module structure for debugging
        console.log('[VMVNC]: RFB module structure:', {
          keys: Object.keys(RFBModule),
          default: RFBModule.default,
          RFB: RFBModule.RFB,
          moduleType: typeof RFBModule,
          defaultType: typeof RFBModule.default,
          defaultConstructor: RFBModule.default?.prototype?.constructor,
        })
        
        // Extract RFB constructor - noVNC exports RFB as default export
        // RFB is defined as: var RFB = exports["default"] = function (_EventTargetMixin) { ... }
        // So it should be available as RFBModule.default
        let RFB: any = null
        
        // Try default export first (this is how noVNC exports it)
        if (RFBModule.default && typeof RFBModule.default === 'function') {
          RFB = RFBModule.default
          console.log('[VMVNC]: Using RFB from default export')
        }
        // Try named export RFB
        else if (RFBModule.RFB && typeof RFBModule.RFB === 'function') {
          RFB = RFBModule.RFB
          console.log('[VMVNC]: Using RFB from named export')
        }
        // Try if the module itself is the constructor
        else if (typeof RFBModule === 'function') {
          RFB = RFBModule
          console.log('[VMVNC]: Using RFB as module itself')
        }
        // Try nested default (in case of double wrapping)
        else if (RFBModule.default?.default && typeof RFBModule.default.default === 'function') {
          RFB = RFBModule.default.default
          console.log('[VMVNC]: Using RFB from nested default')
        }
        
        // Verify it's actually a constructor function
        if (!RFB || typeof RFB !== 'function') {
          console.error('[VMVNC]: Failed to extract RFB constructor. Module structure:', RFBModule)
          throw new Error('Failed to extract RFB constructor from module - invalid export structure')
        }
        
        // Verify it's a class constructor (has prototype)
        if (!RFB.prototype) {
          console.error('[VMVNC]: RFB does not have prototype, it may not be a class constructor')
          throw new Error('RFB is not a class constructor')
        }
        
        // IMPORTANT: Check if RFB is wrapped or if we need to extract the real constructor
        // The error "Cannot call a class as a function" suggests the class might be wrapped
        let actualRFB = RFB
        
        // Check prototype.constructor
        const prototypeConstructor = RFB.prototype?.constructor
        if (prototypeConstructor && prototypeConstructor !== RFB && typeof prototypeConstructor === 'function') {
          console.log('[VMVNC]: Found different constructor in prototype, checking it:', {
            original: RFB.name,
            prototypeConstructor: prototypeConstructor.name,
          })
          // Only use it if it has the same prototype structure
          if (prototypeConstructor.prototype && prototypeConstructor.prototype.constructor === prototypeConstructor) {
            actualRFB = prototypeConstructor
            console.log('[VMVNC]: Using prototype.constructor as RFB')
          }
        }
        
        // Final check: ensure the constructor we're using is valid
        if (!actualRFB || typeof actualRFB !== 'function' || !actualRFB.prototype) {
          throw new Error('Invalid RFB constructor extracted')
        }
        
        console.log('[VMVNC]: RFB constructor extracted successfully:', {
          name: actualRFB.name,
          prototype: actualRFB.prototype,
          isFunction: typeof actualRFB === 'function',
          prototypeConstructor: actualRFB.prototype?.constructor?.name,
          isOriginal: actualRFB === RFB,
        })
        
        // Use the actual constructor
        RFB = actualRFB
        
        // Store both the constructor and the original module reference
        // The original module reference is needed for Reflect.construct's newTarget
        // to ensure `this instanceof RFB` passes in _classCallCheck
        if (isMounted) {
          // Store both the constructor and the original module default export
          // This ensures we can use the original RFB as newTarget in Reflect.construct
          const moduleData = {
            constructor: RFB,
            original: RFBModule.default, // Keep reference to original for instanceof checks
          }
          rfbModuleRef.current = moduleData
          // Initialize showDotCursorRef with current state value
          showDotCursorRef.current = showDotCursor
          setRfbModule(moduleData)
          setStatus('Connecting...')
        }
      } catch (err) {
        console.error('[VMVNC]: Failed to load noVNC library:', err)
        if (isMounted) {
          setError(`Failed to load VNC client: ${err instanceof Error ? err.message : 'Unknown error'}. Please ensure @novnc/novnc is installed.`)
          setIsLoading(false)
        }
      }
    }

    loadNoVNC()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!screenRef.current || !rfbModule) {
      return
    }

    // rfbModule can be either the constructor directly or an object with constructor and original
    const RFB = typeof rfbModule === 'function' ? rfbModule : rfbModule.constructor
    const originalRFB = typeof rfbModule === 'function' ? rfbModule : rfbModule.original || rfbModule.constructor

    // Build WebSocket URL for VNC connection
    // Format: wss://host/k8s/apis/subresources.kubevirt.io/v1/namespaces/{namespace}/virtualmachineinstances/{vmName}/vnc
    // RFB needs full URL with proper protocol for WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsPath = `/k8s/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachineinstances/${vmName}/vnc`
    // Use full URL - RFB requires full WebSocket URL
    const wsUrl = `${protocol}//${host}${wsPath}`
    
    console.log(`[VMVNC ${namespace}/${vmName}]: WebSocket URL: ${wsUrl}`)
    console.log(`[VMVNC ${namespace}/${vmName}]: WebSocket path: ${wsPath}`)
    console.log(`[VMVNC ${namespace}/${vmName}]: Current host: ${host}`)
    console.log(`[VMVNC ${namespace}/${vmName}]: Current protocol: ${window.location.protocol}`)

    console.log(`[VMVNC ${namespace}/${vmName}]: Connecting to ${wsUrl}`)
    console.log(`[VMVNC ${namespace}/${vmName}]: RFB constructor details:`, {
      type: typeof RFB,
      name: RFB?.name,
      prototype: RFB?.prototype,
      isConstructor: RFB?.prototype?.constructor === RFB,
      toString: typeof RFB?.toString === 'function' ? RFB.toString().substring(0, 100) : String(RFB),
    })

    try {
      // Verify RFB is a constructor function
      if (typeof RFB !== 'function') {
        throw new Error(`RFB is not a constructor function. Type: ${typeof RFB}`)
      }
      
      // Verify RFB has prototype (it's a class/constructor)
      if (!RFB.prototype) {
        throw new Error('RFB does not have prototype - cannot be used as constructor')
      }
      
      // Try to create RFB instance
      // The error "Cannot call a class as a function" occurs inside RFB class initialization
      // This suggests that RFB might be wrapped or called incorrectly
      // Let's try to extract the real constructor and use it properly
      let rfb: any = null
      
      // Check if RFB.prototype.constructor is different (might be the real constructor)
      const actualConstructor = RFB.prototype?.constructor
      let constructorToUse = RFB
      
      // If prototype.constructor is different, use it
      if (actualConstructor && actualConstructor !== RFB && typeof actualConstructor === 'function') {
        console.log('[VMVNC]: Using prototype.constructor instead of RFB:', {
          RFB: RFB.name,
          constructor: actualConstructor.name,
        })
        constructorToUse = actualConstructor
      }
      
      console.log('[VMVNC]: Constructor details before instantiation:', {
        RFB: RFB.name,
        constructorToUse: constructorToUse.name,
        areEqual: RFB === constructorToUse,
        hasPrototype: !!constructorToUse.prototype,
        prototypeConstructor: constructorToUse.prototype?.constructor?.name,
      })
      
      // The error "Cannot call a class as a function" occurs because _classCallCheck(this, RFB) fails
      // This happens when RFB is wrapped by Vite/Rollup and `this instanceof RFB` fails
      // Solution: Use Reflect.construct with the original constructor as newTarget
      // This ensures that `this instanceof RFB` passes the check
      try {
        console.log('[VMVNC]: Creating RFB instance')
        console.log('[VMVNC]: Constructor details:', {
          name: constructorToUse.name,
          type: typeof constructorToUse,
          hasPrototype: !!constructorToUse.prototype,
          prototypeConstructor: constructorToUse.prototype?.constructor?.name,
        })
        
        // Use Reflect.construct with originalRFB as newTarget
        // This ensures that `this instanceof originalRFB` passes in _classCallCheck
        // The third parameter (newTarget) determines what `this instanceof` checks against
        // We use originalRFB (from module.default) as newTarget to ensure the instanceof check passes
        // RFB constructor: new RFB(target, urlOrChannel, options)
        // urlOrChannel can be:
        // - A string URL (full URL or relative path)
        // - A WebSocket object
        // - A WebSocket-like object
        rfb = Reflect.construct(
          constructorToUse, // target constructor (may be wrapped)
          [
            screenRef.current,
            wsUrl, // URL or path - RFB will handle WebSocket connection
            {
              credentials: {
                password: '', // VNC password if needed
              },
              // Set showDotCursor in options to avoid reconnection issues
              showDotCursor: showDotCursorRef.current, // Use ref value to avoid dependency issues
            },
          ],
          originalRFB // newTarget - use original RFB from module for instanceof check
        )
        
        // Verify the instance was created correctly
        if (!(rfb instanceof constructorToUse)) {
          console.warn('[VMVNC]: Instance is not instanceof constructor, but continuing anyway')
        }
        
        console.log('[VMVNC]: RFB instance created successfully')
      } catch (err) {
        console.error('[VMVNC]: Failed to create RFB instance:', err)
        console.error('[VMVNC]: Error details:', {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          constructorName: constructorToUse.name,
          constructorType: typeof constructorToUse,
        })
        throw err
      }
      
      // Verify rfb instance was created correctly
      if (!rfb || typeof rfb !== 'object') {
        throw new Error('Failed to create RFB instance - result is not an object')
      }
      
      rfbRef.current = rfb

      // Set connection parameters based on scaling mode
      rfb.scaleViewport = scalingMode === 'local'
      rfb.resizeSession = scalingMode === 'remote'
      
      // showDotCursor is already set in constructor options, but apply it again to ensure it's set
      // This property can be changed at runtime without reconnecting
      if (typeof rfb.showDotCursor !== 'undefined') {
        try {
          rfb.showDotCursor = showDotCursorRef.current
          console.log(`[VMVNC ${namespace}/${vmName}]: showDotCursor setting: ${showDotCursorRef.current}`)
        } catch (err) {
          console.error('Error setting dot cursor:', err)
        }
      }

      // Event handlers
      rfb.addEventListener('connect', () => {
        console.log(`[VMVNC ${namespace}/${vmName}]: Connected`)
        setStatus('Connected')
        setIsLoading(false)
        setError(null)
        setIsConnected(true)
        isManuallyDisconnectedRef.current = false
        setReconnectAttempts(0) // Reset reconnect attempts on successful connection
        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      })

      rfb.addEventListener('disconnect', (e: any) => {
        const detail = e.detail as { clean?: boolean }
        const wasManuallyDisconnected = isManuallyDisconnectedRef.current
        const shouldAutoReconnect = shouldReconnectRef.current
        
        setIsConnected(false)
        setIsLoading(false)
        
        // Check if this is a manual disconnect
        if (wasManuallyDisconnected) {
          console.log(`[VMVNC ${namespace}/${vmName}]: Manually disconnected`)
          setStatus('Disconnected')
          setError(null)
          return
        }
        
        // Auto-reconnect logic - only if auto-reconnect is enabled
        if (shouldAutoReconnect) {
          if (detail.clean) {
            console.log(`[VMVNC ${namespace}/${vmName}]: Disconnected (clean) - will auto-reconnect`)
            setStatus('Disconnected - Reconnecting...')
            setError(null)
          } else {
            console.error(`[VMVNC ${namespace}/${vmName}]: Connection closed unexpectedly - will auto-reconnect`)
            setStatus('Connection closed - Reconnecting...')
            setError('Connection closed unexpectedly')
          }
          
          // Call scheduleReconnect after a delay to avoid nested state updates
          // This ensures the disconnect event handler completes before reconnect logic runs
          const reconnectTimer = setTimeout(() => {
            // Double-check conditions before reconnecting
            if (!isManuallyDisconnectedRef.current && shouldReconnectRef.current && scheduleReconnectRef.current) {
              console.log(`[VMVNC ${namespace}/${vmName}]: Triggering auto-reconnect from disconnect handler`)
              scheduleReconnectRef.current()
            } else {
              console.log(`[VMVNC ${namespace}/${vmName}]: Auto-reconnect cancelled (manual disconnect or disabled)`)
              setStatus('Disconnected')
            }
          }, reconnectDelay)
          
          // Store timer for cleanup
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
          reconnectTimeoutRef.current = reconnectTimer
        } else {
          // No auto-reconnect
          if (detail.clean) {
            console.log(`[VMVNC ${namespace}/${vmName}]: Disconnected (auto-reconnect disabled)`)
            setStatus('Disconnected')
          } else {
            console.error(`[VMVNC ${namespace}/${vmName}]: Connection closed unexpectedly (auto-reconnect disabled)`)
            setStatus('Connection closed')
            setError('Connection closed unexpectedly')
          }
        }
      })

      rfb.addEventListener('credentialsrequired', () => {
        console.log(`[VMVNC ${namespace}/${vmName}]: Credentials required`)
        setStatus('Credentials required')
        // For now, we'll try without password
        // In the future, you might want to prompt for password
      })

      rfb.addEventListener('securityfailure', (e: any) => {
        const detail = e.detail as { status?: number; reason?: string }
        console.error(`[VMVNC ${namespace}/${vmName}]: Security failure`, detail)
        setError(`Security failure: ${detail.reason || 'Unknown error'}`)
        setIsLoading(false)
      })

      rfb.addEventListener('desktopname', (e: any) => {
        const detail = e.detail as { name?: string }
        if (detail.name) {
          console.log(`[VMVNC ${namespace}/${vmName}]: Desktop name: ${detail.name}`)
          setStatus(`Connected to ${detail.name}`)
        }
      })

      // Cleanup function
      return () => {
        console.log(`[VMVNC ${namespace}/${vmName}]: Cleaning up`)
        // Clear reconnect timeout if exists
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
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
      }
    } catch (err) {
      console.error(`[VMVNC ${namespace}/${vmName}]: Error creating RFB connection:`, err)
      setError(`Failed to create VNC connection: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsLoading(false)
      setIsConnected(false)
      
      // Schedule reconnect on error if enabled
      if (shouldReconnectRef.current && reconnectAttempts < maxReconnectAttempts && scheduleReconnectRef.current) {
        // Use setTimeout to avoid calling scheduleReconnect during render
        setTimeout(() => {
          if (scheduleReconnectRef.current) {
            scheduleReconnectRef.current()
          }
        }, 0)
      }
    }
  }, [cluster, namespace, vmName, rfbModule, scalingMode, reconnectAttempts])

  // Sync showDotCursorRef with state (but don't recreate connection on change)
  useEffect(() => {
    showDotCursorRef.current = showDotCursor
    // Apply to existing RFB instance if connected (without recreating connection)
    if (rfbRef.current && isConnected && typeof rfbRef.current.showDotCursor !== 'undefined') {
      try {
        rfbRef.current.showDotCursor = showDotCursor
        console.log(`[VMVNC ${namespace}/${vmName}]: Updated showDotCursor to ${showDotCursor} (runtime, no reconnect)`)
      } catch (err) {
        console.error('Error updating dot cursor:', err)
      }
    }
  }, [showDotCursor, namespace, vmName, isConnected])

  // Schedule reconnect after delay
  const scheduleReconnect = useCallback(() => {
    // Check if we should reconnect (before clearing timeout)
    if (isManuallyDisconnectedRef.current || !shouldReconnectRef.current) {
      console.log(`[VMVNC ${namespace}/${vmName}]: Reconnect cancelled - manual disconnect or disabled`)
      return
    }
    
    // Clear any existing reconnect timeout first
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    // Get current attempt count and increment
    setReconnectAttempts(prev => {
      const attempts = prev + 1
      
      if (attempts > maxReconnectAttempts) {
        console.log(`[VMVNC ${namespace}/${vmName}]: Max reconnect attempts reached (${maxReconnectAttempts})`)
        setStatus('Connection failed - Max reconnect attempts reached')
        setError('Failed to reconnect after multiple attempts')
        shouldReconnectRef.current = false
        setIsLoading(false)
        return prev
      }
      
      console.log(`[VMVNC ${namespace}/${vmName}]: Scheduling reconnect attempt ${attempts}/${maxReconnectAttempts}`)
      setStatus(`Reconnecting... (Attempt ${attempts}/${maxReconnectAttempts})`)
      setIsLoading(true)
      setError(null)
      
      // Schedule actual reconnection after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        // Final check before reconnecting
        if (isManuallyDisconnectedRef.current || !shouldReconnectRef.current) {
          console.log(`[VMVNC ${namespace}/${vmName}]: Reconnect cancelled during delay`)
          setIsLoading(false)
          setStatus('Reconnect cancelled')
          return
        }
        
        console.log(`[VMVNC ${namespace}/${vmName}]: Attempting reconnect (${attempts}/${maxReconnectAttempts})`)
        
        // Clear existing connection
        if (rfbRef.current) {
          try {
            rfbRef.current.disconnect()
          } catch (err) {
            console.error('Error disconnecting RFB during reconnect:', err)
          }
          rfbRef.current = null
        }
        
        // Clear screen ref to allow reconnection
        if (screenRef.current) {
          // Remove all children
          while (screenRef.current.firstChild) {
            screenRef.current.removeChild(screenRef.current.firstChild)
          }
        }
        
        // Trigger reconnection by resetting and then setting rfbModule
        setRfbModule(null)
        setTimeout(() => {
          if (rfbModuleRef.current && !isManuallyDisconnectedRef.current && shouldReconnectRef.current) {
            console.log(`[VMVNC ${namespace}/${vmName}]: Restoring RFB module for reconnect`)
            setRfbModule(rfbModuleRef.current)
          } else {
            console.log(`[VMVNC ${namespace}/${vmName}]: Reconnect cancelled - conditions changed`)
            setIsLoading(false)
          }
        }, 500)
      }, reconnectDelay)
      
      return attempts
    })
  }, [namespace, vmName])

  // Store scheduleReconnect in ref so it can be accessed from event handlers
  useEffect(() => {
    scheduleReconnectRef.current = scheduleReconnect
  }, [scheduleReconnect])

  // Handle toolbar actions
  const handleDisconnect = useCallback(() => {
    isManuallyDisconnectedRef.current = true
    shouldReconnectRef.current = false
    setIsManuallyDisconnected(true)
    setShouldReconnect(false)
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (rfbRef.current) {
      try {
        rfbRef.current.disconnect()
        setStatus('Disconnected')
        setIsLoading(false)
        setIsConnected(false)
      } catch (err) {
        console.error('Error disconnecting RFB:', err)
      }
    }
  }, [])

  const handleReconnect = useCallback(() => {
    isManuallyDisconnectedRef.current = false
    shouldReconnectRef.current = true
    setIsManuallyDisconnected(false)
    setShouldReconnect(true)
    setReconnectAttempts(0)
    setError(null)
    setIsLoading(true)
    setStatus('Reconnecting...')
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    // Clear existing connection
    if (rfbRef.current) {
      try {
        rfbRef.current.disconnect()
      } catch (err) {
        console.error('Error disconnecting RFB:', err)
      }
      rfbRef.current = null
    }
    
    // Clear screen ref to allow reconnection
    if (screenRef.current) {
      // Remove all children
      while (screenRef.current.firstChild) {
        screenRef.current.removeChild(screenRef.current.firstChild)
      }
    }
    
    // Trigger reconnection by resetting and then setting rfbModule
    setRfbModule(null)
    setTimeout(() => {
      if (rfbModuleRef.current) {
        setRfbModule(rfbModuleRef.current)
      }
    }, 500)
  }, [])

  const handleSendCtrlAltDel = () => {
    if (rfbRef.current) {
      try {
        // Send Ctrl+Alt+Del key combination
        rfbRef.current.sendCtrlAltDel()
      } catch (err) {
        console.error('Error sending Ctrl+Alt+Del:', err)
      }
    }
  }

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        ;(containerRef.current as any).webkitRequestFullscreen()
      } else if ((containerRef.current as any).msRequestFullscreen) {
        ;(containerRef.current as any).msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        ;(document as any).webkitExitFullscreen()
      } else if ((document as any).msExitFullscreen) {
        ;(document as any).msExitFullscreen()
      }
    }
  }

  const handleShowDotCursorChange = useCallback((checked: boolean) => {
    setShowDotCursor(checked)
  }, [])

  const handleScalingModeChange = useCallback((e: any) => {
    const mode = e.target.value as 'none' | 'local' | 'remote'
    setScalingMode(mode)
    
    // Apply changes immediately if connected
    if (rfbRef.current) {
      if (mode === 'none') {
        rfbRef.current.scaleViewport = false
        rfbRef.current.resizeSession = false
      } else if (mode === 'local') {
        rfbRef.current.scaleViewport = true
        rfbRef.current.resizeSession = false
      } else if (mode === 'remote') {
        rfbRef.current.scaleViewport = false
        rfbRef.current.resizeSession = true
      }
    }
  }, [])

  // Create dropdown menu items
  const optionsMenuItems: MenuProps['items'] = [
    {
      key: 'show-cursor',
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 200 }}>
          <span>Show Cursor</span>
          <Switch
            checked={showDotCursor}
            onChange={handleShowDotCursorChange}
            disabled={!isConnected}
            size="small"
          />
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'scaling-mode',
      label: (
        <div style={{ minWidth: 200 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Scaling Mode</div>
          <Radio.Group
            value={scalingMode}
            onChange={handleScalingModeChange}
            disabled={!isConnected}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <Radio value="none">None</Radio>
            <Radio value="local">Local scaling</Radio>
            <Radio value="remote">Remote resizing</Radio>
          </Radio.Group>
        </div>
      ),
    },
  ]

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <Styled.Container ref={containerRef} $substractHeight={substractHeight}>
      <Styled.CustomCard $isVisible={!isLoading && !error} $substractHeight={substractHeight}>
        <Styled.StatusBar>
          <Space size="small">
            <Tooltip title="Send Ctrl+Alt+Del">
              <Button
                type="text"
                size="small"
                icon={<PoweroffOutlined />}
                onClick={handleSendCtrlAltDel}
                disabled={!isConnected}
                style={{ color: '#ffffff' }}
              >
                Send Ctrl+Alt+Del
              </Button>
            </Tooltip>
            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              <Button
                type="text"
                size="small"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={handleToggleFullscreen}
                disabled={!isConnected}
                style={{ color: '#ffffff' }}
              >
                Fullscreen
              </Button>
            </Tooltip>
            <Dropdown
              menu={{ items: optionsMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                style={{ color: '#ffffff' }}
              >
                Options
              </Button>
            </Dropdown>
            <Tooltip title="Reconnect">
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleReconnect}
                loading={isLoading}
                style={{ color: '#ffffff' }}
              >
                Reconnect
              </Button>
            </Tooltip>
            <Styled.StatusDivider>|</Styled.StatusDivider>
            <span>{status}</span>
          </Space>
        </Styled.StatusBar>
        <Styled.ContentWrapper>
          <Styled.FullWidthDiv $substractHeight={substractHeight}>
            <div ref={screenRef} style={{ width: '100%', height: '100%' }} />
          </Styled.FullWidthDiv>
        </Styled.ContentWrapper>
      </Styled.CustomCard>
      {isLoading && !error && (
        <Styled.LoadingContainer>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>{status}</div>
        </Styled.LoadingContainer>
      )}
      {error && !isLoading && (
        <Styled.ErrorContainer>
          <Result
            status="error"
            title="VNC Connection Error"
            subTitle={error}
            extra={
              <Button type="primary" onClick={handleReconnect} loading={isLoading}>
                Reconnect
              </Button>
            }
          />
        </Styled.ErrorContainer>
      )}
    </Styled.Container>
  )
}




