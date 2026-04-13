/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/** @jest-environment jsdom */

import React from 'react'
import { act, render, screen } from '@testing-library/react'
import { Events } from './Events'

jest.mock('hooks/useKinds', () => ({
  useKinds: jest.fn(() => ({ data: undefined })),
}))

jest.mock('hooks/useK8sSmartResource', () => ({
  useK8sSmartResource: jest.fn(() => ({ data: { items: [] } })),
}))

type Listener = (event: any) => void

class MockWebSocket {
  static instances: any[] = []

  static CONNECTING = 0

  static OPEN = 1

  static CLOSING = 2

  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING

  sent: string[] = []

  listeners: Record<string, Listener[]> = {}

  constructor(public url: string) {
    MockWebSocket.instances.push(this)
  }

  addEventListener(type: string, listener: Listener) {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(listener)
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners[type] = (this.listeners[type] || []).filter(l => l !== listener)
  }

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.emit('close', {})
  }

  open() {
    this.readyState = MockWebSocket.OPEN
    this.emit('open', {})
  }

  message(frame: unknown) {
    this.emit('message', { data: JSON.stringify(frame) })
  }

  private emit(type: string, event: unknown) {
    ;(this.listeners[type] || []).forEach(listener => listener(event))
  }
}

const baseProps = {
  theme: 'light' as const,
  cluster: 'default',
  wsUrl: '/api/clusters/default/openapi-bff-ws/events/eventsWs',
  baseFactoryNamespacedAPIKey: 'base-factory-namespaced-api',
  baseFactoryClusterSceopedAPIKey: 'base-factory-clusterscoped-api',
  baseFactoryNamespacedBuiltinKey: 'base-factory-namespaced-builtin',
  baseFactoryClusterSceopedBuiltinKey: 'base-factory-clusterscoped-builtin',
  baseNamespaceFactoryKey: 'namespace-details',
  baseNavigationPlural: 'navigations',
  baseNavigationName: 'navigation',
}

describe('Events error handling', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    ;(global as any).WebSocket = MockWebSocket
    ;(global as any).IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(console.warn as jest.Mock).mockClear()
  })

  afterEach(() => {
    ;(console.error as jest.Mock).mockRestore?.()
  })

  test('renders blocking error for INITIAL_ERROR and does not show No events', () => {
    render(<Events {...baseProps} />)

    const ws = MockWebSocket.instances[0]
    act(() => {
      ws.open()
      ws.message({ type: 'INITIAL_ERROR', message: 'Access denied', statusCode: 403, reason: 'Forbidden' })
    })

    expect(screen.getByText('Access denied (403)')).toBeInTheDocument()
    expect(screen.queryByText('No events')).not.toBeInTheDocument()
    expect(console.error).toHaveBeenCalledWith('[Events][initial]', {
      message: 'Access denied',
      statusCode: 403,
      reason: 'Forbidden',
    })
  })

  test('logs SERVER_LOG frame with console level', () => {
    render(<Events {...baseProps} />)

    const ws = MockWebSocket.instances[0]
    act(() => {
      ws.open()
      ws.message({ type: 'SERVER_LOG', level: 'warn', message: 'watch failed' })
    })

    expect(console.warn).toHaveBeenCalledWith('[Events][server]', 'watch failed')
  })

  test('keeps PAGE_ERROR non-fatal', () => {
    render(<Events {...baseProps} />)

    const ws = MockWebSocket.instances[0]
    act(() => {
      ws.open()
      ws.message({ type: 'PAGE_ERROR', error: 'page failed' })
    })

    expect(screen.getByText('No events')).toBeInTheDocument()
    expect(screen.getByText(/page failed/)).toBeInTheDocument()
  })
})
