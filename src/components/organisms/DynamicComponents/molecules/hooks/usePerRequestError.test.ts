import { renderHook } from '@testing-library/react'
import { AxiosError } from 'axios'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePerRequestError } from './usePerRequestError'

jest.mock('../../../DynamicRendererWithProviders/providers/hybridDataProvider', () => ({
  useMultiQuery: jest.fn(),
}))

const mockUseMultiQuery = useMultiQuery as unknown as jest.Mock

describe('usePerRequestError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns shouldShowError: false and errorToShow: null when reqIndex is undefined and isError is false', () => {
    mockUseMultiQuery.mockReturnValue({
      isError: false,
      hasErrorForReq: jest.fn(),
      getErrorForReq: jest.fn(),
      errors: [null, null],
    })

    const { result } = renderHook(() => usePerRequestError(undefined))

    expect(result.current.shouldShowError).toBe(false)
    expect(result.current.errorToShow).toBeNull()
  })

  test('returns shouldShowError: true and errorToShow: first non-null error when reqIndex is undefined and isError is true', () => {
    const error = new Error('Something went wrong')
    mockUseMultiQuery.mockReturnValue({
      isError: true,
      hasErrorForReq: jest.fn(),
      getErrorForReq: jest.fn(),
      errors: [null, error],
    })

    const { result } = renderHook(() => usePerRequestError(undefined))

    expect(result.current.shouldShowError).toBe(true)
    expect(result.current.errorToShow).toBe(error)
  })

  test('returns shouldShowError: false and errorToShow: null when reqIndex is "0" and req0 has no error', () => {
    mockUseMultiQuery.mockReturnValue({
      isError: false,
      hasErrorForReq: jest.fn().mockImplementation((idx: number) => idx !== 0),
      getErrorForReq: jest.fn().mockReturnValue(null),
      errors: [null, new Error('req1 error')],
    })

    const { result } = renderHook(() => usePerRequestError('0'))

    expect(result.current.shouldShowError).toBe(false)
    expect(result.current.errorToShow).toBeNull()
  })

  test('returns shouldShowError: true and errorToShow: the error when reqIndex is "1" and req1 has error', () => {
    const req1Error = new AxiosError('Request failed')
    mockUseMultiQuery.mockReturnValue({
      isError: true,
      hasErrorForReq: jest.fn().mockImplementation((idx: number) => idx === 1),
      getErrorForReq: jest.fn().mockImplementation((idx: number) => (idx === 1 ? req1Error : null)),
      errors: [null, req1Error],
    })

    const { result } = renderHook(() => usePerRequestError('1'))

    expect(result.current.shouldShowError).toBe(true)
    expect(result.current.errorToShow).toBe(req1Error)
  })

  test('returns shouldShowError: false when reqIndex is "0" and req0 is OK but req1 has error (isolation test)', () => {
    const req1Error = new Error('req1 failed')
    mockUseMultiQuery.mockReturnValue({
      isError: true,
      hasErrorForReq: jest.fn().mockImplementation((idx: number) => idx === 1),
      getErrorForReq: jest.fn().mockImplementation((idx: number) => (idx === 1 ? req1Error : null)),
      errors: [null, req1Error],
    })

    const { result } = renderHook(() => usePerRequestError('0'))

    expect(result.current.shouldShowError).toBe(false)
    expect(result.current.errorToShow).toBeNull()
  })

  test('works when reqIndex is a number (not string)', () => {
    const req0Error = new Error('req0 failed')
    mockUseMultiQuery.mockReturnValue({
      isError: true,
      hasErrorForReq: jest.fn().mockImplementation((idx: number) => idx === 0),
      getErrorForReq: jest.fn().mockImplementation((idx: number) => (idx === 0 ? req0Error : null)),
      errors: [req0Error, null],
    })

    const { result } = renderHook(() => usePerRequestError(0))

    expect(result.current.shouldShowError).toBe(true)
    expect(result.current.errorToShow).toBe(req0Error)
  })

  test('returns string error when errors array contains a string', () => {
    mockUseMultiQuery.mockReturnValue({
      isError: true,
      hasErrorForReq: jest.fn(),
      getErrorForReq: jest.fn(),
      errors: ['Network timeout'],
    })

    const { result } = renderHook(() => usePerRequestError(undefined))

    expect(result.current.shouldShowError).toBe(true)
    expect(result.current.errorToShow).toBe('Network timeout')
  })
})
