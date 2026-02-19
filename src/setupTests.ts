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
