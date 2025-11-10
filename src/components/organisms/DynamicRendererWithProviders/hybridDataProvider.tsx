/* eslint-disable react-hooks/exhaustive-deps */
import React, { FC, ReactNode, createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import axios, { AxiosError } from 'axios'
import { useQueries } from '@tanstack/react-query'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'

/** Param type your hook accepts */
export type UseK8sSmartResourceParams<T> = Parameters<typeof useK8sSmartResource<T>>[0]

/** The union for items: either all URLs or all K8s param objects */
type UrlItems = ReadonlyArray<string>
type K8sItems = ReadonlyArray<UseK8sSmartResourceParams<unknown>>
type HybridItems = UrlItems | K8sItems

type DataMap = Record<string, unknown>

type MultiQueryContextValue = {
  data: DataMap
  isLoading: boolean
  isError: boolean
  errors: ReadonlyArray<AxiosError | Error | string | null>
}

const MultiQueryContext = createContext<MultiQueryContextValue | undefined>(undefined)

type BaseProps = {
  items: HybridItems
  /**
   * If provided, skip fetching and set data.req0 to this (same fast-path as before).
   */
  dataToApplyToContext?: unknown
  children: ReactNode
  /**
   * Only needed when items.length === 0 (runtime can’t infer the branch).
   * If omitted and items is empty, defaults to 'urls'.
   */
  modeIfEmpty?: 'urls' | 'k8s'
}

export type MultiQueryProviderProps = BaseProps

/** ---------------- Aggregation (used for the K8s branch) ----------------- */

type ResultEntry = {
  data: unknown
  isLoading: boolean
  isError: boolean
  error: AxiosError | Error | string | null
}

type AggState = { entries: ResultEntry[] }
type AggAction =
  | { type: 'RESET'; total: number }
  | { type: 'SET_ENTRY'; index: number; total: number; entry: ResultEntry }

const makeEmptyEntry = (): ResultEntry => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
})

const aggReducer = (state: AggState, action: AggAction): AggState => {
  switch (action.type) {
    case 'RESET':
      return { entries: Array.from({ length: action.total }, makeEmptyEntry) }
    case 'SET_ENTRY': {
      const size = Math.max(action.total, state.entries.length)
      const entries = Array.from({ length: size }, (_, i) => state.entries[i] ?? makeEmptyEntry())
      entries[action.index] = action.entry
      return { entries }
    }
    default:
      return state
  }
}

/** ----------------- Child allowed to call the K8s hook ------------------- */

type K8sFetcherProps = {
  index: number
  total: number
  params: UseK8sSmartResourceParams<unknown>
  dispatch: React.Dispatch<AggAction>
}

const K8sFetcher: FC<K8sFetcherProps> = ({ index, total, params, dispatch }) => {
  const res = useK8sSmartResource<unknown>(params)

  useEffect(() => {
    dispatch({
      type: 'SET_ENTRY',
      index,
      total,
      entry: {
        data: res.data,
        isLoading: res.isLoading,
        isError: res.isError,
        error: (res.error as AxiosError | Error | string | undefined) ?? null,
      },
    })
  }, [index, total, res.data, res.isLoading, res.isError, res.error, dispatch])

  return null
}

/** ------------------------------ Provider -------------------------------- */

const isUrlArray = (arr: HybridItems): arr is UrlItems => (arr.length === 0 ? false : typeof arr[0] === 'string')

export const MultiQueryProvider: FC<MultiQueryProviderProps> = ({
  items,
  dataToApplyToContext,
  children,
  modeIfEmpty = 'urls',
}) => {
  // Decide branch: urls vs k8s (empty array needs a hint)
  const urlsMode = items.length === 0 ? modeIfEmpty === 'urls' : isUrlArray(items)

  const total = items.length

  // K8s aggregator state (only used if we’re in k8s mode)
  const [state, dispatch] = useReducer(aggReducer, { entries: Array.from({ length: total }, makeEmptyEntry) })

  useEffect(() => {
    dispatch({ type: 'RESET', total })
  }, [total])

  // URL branch queries (only meaningful if urlsMode === true)
  const urlQueries = useQueries({
    queries: urlsMode
      ? (items as UrlItems).map((url, i) => ({
          queryKey: ['multi-url', i, url],
          queryFn: async () => {
            const res = await axios.get(url)
            return res.data as unknown
          },
        }))
      : [],
  })

  // Build context value
  const value: MultiQueryContextValue = useMemo(() => {
    // Short-circuit
    if (typeof dataToApplyToContext !== 'undefined') {
      return {
        data: { req0: dataToApplyToContext },
        isLoading: false,
        isError: false,
        errors: [],
      }
    }

    const data: DataMap = {}
    const errors: Array<AxiosError | Error | string | null> = []

    if (urlsMode) {
      // URLs: sequential req{i}
      const qs = urlQueries
      for (let i = 0; i < total; i++) {
        const q = qs[i]
        data[`req${i}`] = q?.data
        errors[i] = q?.isError ? ((q.error ?? null) as AxiosError | Error | string | null) : null
      }
      const isLoading = qs.some(q => q.isLoading)
      const isError = qs.some(q => q.isError)
      return { data, isLoading, isError, errors }
    }
    // K8s: sequential req{i}
    for (let i = 0; i < total; i++) {
      const e = state.entries[i] ?? makeEmptyEntry()
      data[`req${i}`] = e.data
      errors[i] = e.isError ? e.error : null
    }
    const isLoading = state.entries.some(e => e.isLoading)
    const isError = state.entries.some(e => e.isError)
    return { data, isLoading, isError, errors }
  }, [dataToApplyToContext, urlsMode, total, state.entries, urlQueries])

  return (
    <MultiQueryContext.Provider value={value}>
      {/* If K8s mode, mount one fetcher per item (Rules of Hooks compliant) */}
      {!urlsMode &&
        (items as K8sItems).map((params, i) => (
          <K8sFetcher
            // eslint-disable-next-line react/no-array-index-key
            key={`${i}-${JSON.stringify(params)}`}
            index={i}
            total={total}
            params={params}
            dispatch={dispatch}
          />
        ))}
      {children}
    </MultiQueryContext.Provider>
  )
}

/** Consumer hook */
export const useMultiQuery = (): MultiQueryContextValue => {
  const ctx = useContext(MultiQueryContext)
  if (!ctx) throw new Error('useMultiQuery must be used within a MultiQueryProvider')
  return ctx
}
