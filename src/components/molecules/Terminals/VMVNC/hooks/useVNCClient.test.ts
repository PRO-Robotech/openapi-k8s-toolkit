/* eslint-disable no-restricted-syntax */
/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// useVNCClient.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react'
import RFB from 'novnc-next'
import { useVNCClient } from './useVNCClient'

// --- Mocks & helpers ---

// Keep listeners accessible from tests
const listeners: Record<string, Array<(e?: any) => void>> = {}

const mockDisconnect = jest.fn()
const mockSendCtrlAltDel = jest.fn()

jest.mock('novnc-next', () => {
  return jest.fn().mockImplementation((_el: HTMLElement, _url: string, _options: any) => {
    return {
      addEventListener: (event: string, cb: (e?: any) => void) => {
        if (!listeners[event]) listeners[event] = []
        listeners[event].push(cb)
      },
      disconnect: mockDisconnect,
      sendCtrlAltDel: mockSendCtrlAltDel,
      scaleViewport: false,
      resizeSession: false,
      showDotCursor: false,
    }
  })
})

describe('useVNCClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    for (const key of Object.keys(listeners)) {
      delete listeners[key]
    }

    // Ensure a sane window.location for URL building
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'http:',
        host: 'localhost',
      },
      writable: true,
    })
  })

  it('returns "not configured" state when required options are missing', () => {
    const { result } = renderHook(() => useVNCClient({}))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isConnected).toBe(false)
    expect(result.current.status).toBe('VNC not configured')
    expect(result.current.error).toBe('Provide forcedFullWsPath or both namespace and vmName for VNC connection')

    expect(RFB).not.toHaveBeenCalled()
  })

  it('creates an RFB instance when namespace and vmName are provided', async () => {
    const { result } = renderHook(() =>
      useVNCClient({
        namespace: 'test-ns',
        vmName: 'test-vm',
      }),
    )

    // Attach a screen element via callback ref
    const container = document.createElement('div')
    act(() => {
      result.current.screenRef(container)
    })

    await waitFor(() => {
      expect(RFB).toHaveBeenCalledTimes(1)
    })

    // Check that RFB was called with correct ws URL
    const [elArg, urlArg, optionsArg] = (RFB as jest.Mock).mock.calls[0]

    expect(elArg).toBe(container)
    expect(urlArg).toBe(
      'ws://localhost/k8s/apis/subresources.kubevirt.io/v1/namespaces/test-ns/virtualmachineinstances/test-vm/vnc',
    )
    expect(optionsArg).toMatchObject({
      credentials: { password: '' },
    })
  })

  it('updates state on connect and desktopname events', async () => {
    const { result } = renderHook(() =>
      useVNCClient({
        namespace: 'test-ns',
        vmName: 'test-vm',
      }),
    )

    const container = document.createElement('div')

    act(() => {
      result.current.screenRef(container)
    })

    await waitFor(() => {
      expect(RFB).toHaveBeenCalledTimes(1)
    })

    // Fire connect event
    act(() => {
      listeners['connect']?.forEach(cb => cb())
    })

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.status).toBe('Connected')
    })

    // Fire desktopname event
    act(() => {
      listeners['desktopname']?.forEach(cb => cb({ detail: { name: 'MyDesktop' } }))
    })

    await waitFor(() => {
      expect(result.current.status).toBe('Connected to MyDesktop')
    })
  })

  it('disconnect() calls RFB.disconnect and updates state', async () => {
    const { result } = renderHook(() =>
      useVNCClient({
        namespace: 'test-ns',
        vmName: 'test-vm',
      }),
    )

    const container = document.createElement('div')
    act(() => {
      result.current.screenRef(container)
    })

    await waitFor(() => {
      expect(RFB).toHaveBeenCalledTimes(1)
    })

    // Simulate we are connected
    act(() => {
      listeners['connect']?.forEach(cb => cb())
    })

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    // Call disconnect()
    act(() => {
      result.current.disconnect()
    })

    expect(mockDisconnect).toHaveBeenCalled()
    expect(result.current.isConnected).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.status).toBe('Disconnected')
  })

  it('reconnect() triggers a new RFB connection', async () => {
    const { result } = renderHook(() =>
      useVNCClient({
        namespace: 'test-ns',
        vmName: 'test-vm',
      }),
    )

    const container = document.createElement('div')
    act(() => {
      result.current.screenRef(container)
    })

    await waitFor(() => {
      expect(RFB).toHaveBeenCalledTimes(1)
    })

    // Manually disconnect first
    act(() => {
      result.current.disconnect()
    })

    // Then reconnect
    act(() => {
      result.current.reconnect()
    })

    // After reconnect, the effect should run again and create a new RFB instance
    await waitFor(() => {
      expect(RFB).toHaveBeenCalledTimes(2)
    })

    // We're mainly interested that it's trying to connect again
    expect(result.current.isLoading).toBe(true)
    expect(['Reconnecting...', 'Connecting...']).toContain(result.current.status)
  })

  it('sendCtrlAltDel delegates to RFB instance', async () => {
    const { result } = renderHook(() =>
      useVNCClient({
        namespace: 'test-ns',
        vmName: 'test-vm',
      }),
    )

    const container = document.createElement('div')
    act(() => {
      result.current.screenRef(container)
    })

    await waitFor(() => {
      expect(RFB).toHaveBeenCalledTimes(1)
    })

    act(() => {
      result.current.sendCtrlAltDel()
    })

    expect(mockSendCtrlAltDel).toHaveBeenCalled()
  })
})
