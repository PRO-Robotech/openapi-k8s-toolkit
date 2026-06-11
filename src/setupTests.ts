/* eslint-disable no-console */
import '@testing-library/jest-dom'

beforeAll(() => {
  jest.spyOn(console, 'debug').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'info').mockImplementation(() => {})
})

afterAll(() => {
  ;(console.debug as jest.Mock).mockRestore()
  ;(console.warn as jest.Mock).mockRestore()
  ;(console.info as jest.Mock).mockRestore()
})

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  configurable: true,
  writable: true,
  value: jest.fn(),
})

// Optional but often helpful with antd:
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: jest.fn(),
})

// jsdom doesn't implement matchMedia, but Ant Design responsive utilities call it during modal/list render.
// Provide a stable mock so component tests can mount without browser-only API failures.
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// antd 6 (the React scheduler and @rc-component internals) relies on MessageChannel for task
// scheduling, which jsdom does not implement. The scheduler needs messages to actually be delivered,
// so this polyfill wires the two ports together and dispatches asynchronously.
if (typeof globalThis.MessageChannel === 'undefined') {
  type TPort = {
    onmessage: ((event: { data: unknown }) => void) | null
    postMessage: (data: unknown) => void
  }

  class PolyfilledMessageChannel {
    port1: TPort

    port2: TPort

    constructor() {
      this.port1 = {
        onmessage: null,
        postMessage: data => {
          const { onmessage } = this.port2
          if (onmessage) setTimeout(() => onmessage({ data }), 0)
        },
      }
      this.port2 = {
        onmessage: null,
        postMessage: data => {
          const { onmessage } = this.port1
          if (onmessage) setTimeout(() => onmessage({ data }), 0)
        },
      }
    }
  }

  Object.defineProperty(globalThis, 'MessageChannel', {
    configurable: true,
    writable: true,
    value: PolyfilledMessageChannel,
  })
}

// antd 6 components (Tooltip, Input.TextArea autosize, Dropdown, Table, etc.) observe element size via
// @rc-component/resize-observer, which relies on the ResizeObserver API that jsdom does not implement.
Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
})
