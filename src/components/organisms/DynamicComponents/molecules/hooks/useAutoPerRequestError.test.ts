import { renderHook } from '@testing-library/react'
import { AxiosError } from 'axios'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { useAutoPerRequestError } from './useAutoPerRequestError'

jest.mock('../../../DynamicRendererWithProviders/providers/hybridDataProvider', () => ({
  useMultiQuery: jest.fn(),
}))

const mockUseMultiQuery = useMultiQuery as unknown as jest.Mock

const makeCtx = ({
  isError = false,
  errors = [null, null],
  hasErrorForReq = jest.fn().mockReturnValue(false),
  getErrorForReq = jest.fn().mockReturnValue(null),
}: {
  isError?: boolean
  errors?: ReadonlyArray<AxiosError | Error | string | null>
  hasErrorForReq?: jest.Mock
  getErrorForReq?: jest.Mock
} = {}) => ({ isError, errors, hasErrorForReq, getErrorForReq })

describe('useAutoPerRequestError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ---- Type A: template components (no explicit reqIndex) ----

  test('detects error for req referenced in template string', () => {
    const err = new Error('req0 failed')
    mockUseMultiQuery.mockReturnValue(
      makeCtx({
        hasErrorForReq: jest.fn().mockImplementation((idx: number) => idx === 0),
        getErrorForReq: jest.fn().mockImplementation((idx: number) => (idx === 0 ? err : null)),
      }),
    )

    const { result } = renderHook(() =>
      useAutoPerRequestError({
        id: 'badge',
        value: '{reqsJsonPath[0][".items.0.kind"]["-"]}',
      }),
    )

    expect(result.current.shouldShowError).toBe(true)
    expect(result.current.errorToShow).toBe(err)
  })

  test('no error when referenced req is healthy', () => {
    mockUseMultiQuery.mockReturnValue(makeCtx())

    const { result } = renderHook(() =>
      useAutoPerRequestError({
        id: 'badge',
        value: '{reqsJsonPath[0][".items.0.kind"]["-"]}',
      }),
    )

    expect(result.current.shouldShowError).toBe(false)
    expect(result.current.errorToShow).toBeNull()
  })

  test('shows error if ANY referenced req failed (multi-req component)', () => {
    const err = new Error('req1 failed')
    mockUseMultiQuery.mockReturnValue(
      makeCtx({
        hasErrorForReq: jest.fn().mockImplementation((idx: number) => idx === 1),
        getErrorForReq: jest.fn().mockImplementation((idx: number) => (idx === 1 ? err : null)),
      }),
    )

    const { result } = renderHook(() =>
      useAutoPerRequestError({
        id: 'text',
        value: '{reqsJsonPath[0][".name"]} in {reqsJsonPath[1][".ns"]}',
      }),
    )

    expect(result.current.shouldShowError).toBe(true)
    expect(result.current.errorToShow).toBe(err)
  })

  test('isolates error: req1 fails but component only uses req0', () => {
    mockUseMultiQuery.mockReturnValue(
      makeCtx({
        hasErrorForReq: jest.fn().mockImplementation((idx: number) => idx === 1),
        getErrorForReq: jest.fn().mockImplementation((idx: number) => (idx === 1 ? new Error('req1') : null)),
      }),
    )

    const { result } = renderHook(() =>
      useAutoPerRequestError({
        id: 'badge',
        value: '{reqsJsonPath[0][".items.0.kind"]["-"]}',
      }),
    )

    expect(result.current.shouldShowError).toBe(false)
    expect(result.current.errorToShow).toBeNull()
  })

  // ---- Layout components (no req references) ----

  test('falls back to global isError for layout components with no req references', () => {
    const err = new Error('global error')
    mockUseMultiQuery.mockReturnValue(
      makeCtx({
        isError: true,
        errors: [err],
      }),
    )

    const { result } = renderHook(() => useAutoPerRequestError({ id: 'flex', gap: 6, align: 'center' }))

    expect(result.current.shouldShowError).toBe(true)
    expect(result.current.errorToShow).toBe(err)
  })

  test('no error for layout components when global isError is false', () => {
    mockUseMultiQuery.mockReturnValue(makeCtx())

    const { result } = renderHook(() => useAutoPerRequestError({ id: 'flex', gap: 6 }))

    expect(result.current.shouldShowError).toBe(false)
    expect(result.current.errorToShow).toBeNull()
  })

  // ---- Type B: direct-access components (explicit reqIndex) ----

  test('picks up explicit data.reqIndex as string', () => {
    const err = new Error('req0 failed')
    mockUseMultiQuery.mockReturnValue(
      makeCtx({
        hasErrorForReq: jest.fn().mockImplementation((idx: number) => idx === 0),
        getErrorForReq: jest.fn().mockImplementation((idx: number) => (idx === 0 ? err : null)),
      }),
    )

    const { result } = renderHook(() =>
      useAutoPerRequestError({
        id: 'labels',
        reqIndex: '0',
        jsonPathToLabels: '.items.0.metadata.labels',
      }),
    )

    expect(result.current.shouldShowError).toBe(true)
    expect(result.current.errorToShow).toBe(err)
  })

  test('picks up explicit data.reqIndex as number', () => {
    const err = new Error('req2 failed')
    mockUseMultiQuery.mockReturnValue(
      makeCtx({
        hasErrorForReq: jest.fn().mockImplementation((idx: number) => idx === 2),
        getErrorForReq: jest.fn().mockImplementation((idx: number) => (idx === 2 ? err : null)),
      }),
    )

    const { result } = renderHook(() =>
      useAutoPerRequestError({
        id: 'counter',
        reqIndex: 2,
        jsonPath: '.items',
      }),
    )

    expect(result.current.shouldShowError).toBe(true)
    expect(result.current.errorToShow).toBe(err)
  })

  // ---- Edge cases for data.reqIndex ----

  test('ignores data.reqIndex when it is undefined', () => {
    mockUseMultiQuery.mockReturnValue(makeCtx())

    const { result } = renderHook(() =>
      useAutoPerRequestError({
        id: 'text',
        reqIndex: undefined,
        value: '{reqsJsonPath[0][".name"]}',
      }),
    )

    expect(result.current.shouldShowError).toBe(false)
  })

  test('ignores data.reqIndex when it is a boolean', () => {
    mockUseMultiQuery.mockReturnValue(makeCtx())

    const { result } = renderHook(() =>
      useAutoPerRequestError({
        id: 'text',
        reqIndex: true,
        value: '{reqsJsonPath[0][".name"]}',
      }),
    )

    // should still work — picks up req0 from template, ignores boolean reqIndex
    expect(result.current.shouldShowError).toBe(false)
  })

  test('ignores data.reqIndex when it is an object', () => {
    mockUseMultiQuery.mockReturnValue(makeCtx())

    const { result } = renderHook(() =>
      useAutoPerRequestError({
        id: 'text',
        reqIndex: { bad: 'value' },
        value: '{reqsJsonPath[0][".name"]}',
      }),
    )

    expect(result.current.shouldShowError).toBe(false)
  })

  // ---- Deduplication ----

  test('deduplicates between template indices and explicit reqIndex', () => {
    const hasErrorForReq = jest.fn().mockReturnValue(false)
    mockUseMultiQuery.mockReturnValue(makeCtx({ hasErrorForReq }))

    renderHook(() =>
      useAutoPerRequestError({
        id: 'labels',
        reqIndex: '0',
        endpoint: '{reqsJsonPath[0][".items.0.metadata.name"]}',
      }),
    )

    // hasErrorForReq should be called only once for index 0, not twice
    expect(hasErrorForReq).toHaveBeenCalledTimes(1)
    expect(hasErrorForReq).toHaveBeenCalledWith(0)
  })

  // ---- AxiosError support ----

  test('returns AxiosError when that is what the provider stores', () => {
    const axiosErr = new AxiosError('Request failed')
    mockUseMultiQuery.mockReturnValue(
      makeCtx({
        hasErrorForReq: jest.fn().mockImplementation((idx: number) => idx === 0),
        getErrorForReq: jest.fn().mockImplementation((idx: number) => (idx === 0 ? axiosErr : null)),
      }),
    )

    const { result } = renderHook(() =>
      useAutoPerRequestError({
        id: 'badge',
        value: '{reqsJsonPath[0][".kind"]}',
      }),
    )

    expect(result.current.errorToShow).toBe(axiosErr)
  })
})
