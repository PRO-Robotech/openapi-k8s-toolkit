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
