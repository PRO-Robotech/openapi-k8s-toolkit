/* eslint-disable react-hooks/exhaustive-deps */
import React, { FC, ReactNode, createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import axios, { AxiosError } from 'axios'
import { useQueries } from '@tanstack/react-query'
import { TUseK8sSmartResourceParams, useK8sSmartResource } from 'hooks/useK8sSmartResource'

type DataMap = Record<string, unknown>

type MultiQueryContextValue = {
  data: DataMap
  isLoading: boolean
  isError: boolean
  errors: ReadonlyArray<AxiosError | Error | string | null>
}

const MultiQueryContext = createContext<MultiQueryContextValue | undefined>(undefined)

type MultiQueryProviderProps = {
  /** Mixed array: first (any number of) K8s resources, then (any number of) URL strings */
  items: ReadonlyArray<string | TUseK8sSmartResourceParams<unknown>>
  /** Optional short-circuit to set data.req0 directly */
  dataToApplyToContext?: unknown
  children: ReactNode
}

/** ---------------- Aggregation for K8s branch --------------------------- */

type ResultEntry = {
  data: unknown
  isLoading: boolean
  isError: boolean
  error: AxiosError | Error | string | null
}

type AggState = { entries: ResultEntry[] }
type AggAction = { type: 'RESET'; total: number } | { type: 'SET_ENTRY'; index: number; entry: ResultEntry }

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
      const entries = state.entries.slice()
      entries[action.index] = action.entry
      return { entries }
    }
    default:
      return state
  }
}

/** ----------------- Child allowed to call the K8s hook ------------------- */

type K8sFetcherProps = {
  index: number // index within the K8s subset (0..k8sCount-1)
  params: TUseK8sSmartResourceParams<unknown>
  dispatch: React.Dispatch<AggAction>
}

const K8sFetcher: FC<K8sFetcherProps> = ({ index, params, dispatch }) => {
  const res = useK8sSmartResource<unknown>(params)

  useEffect(() => {
    dispatch({
      type: 'SET_ENTRY',
      index,
      entry: {
        data: res.data,
        isLoading: res.isLoading,
        isError: res.isError,
        error: (res.error as AxiosError | Error | string | undefined) ?? null,
      },
    })
  }, [index, res.data, res.isLoading, res.isError, res.error, dispatch])

  return null
}

/** ------------------------------ Provider -------------------------------- */

export const MultiQueryProvider: FC<MultiQueryProviderProps> = ({ items, dataToApplyToContext, children }) => {
  // Partition while preserving relative order
  const k8sItems = useMemo(
    () => items.filter((x): x is TUseK8sSmartResourceParams<unknown> => typeof x !== 'string'),
    [items],
  )
  const urlItems = useMemo(() => items.filter((x): x is string => typeof x === 'string'), [items])

  const k8sCount = k8sItems.length
  const urlCount = urlItems.length

  // Aggregator for K8s subset only
  const [state, dispatch] = useReducer(aggReducer, { entries: Array.from({ length: k8sCount }, makeEmptyEntry) })

  // Reset when K8s count changes
  useEffect(() => {
    dispatch({ type: 'RESET', total: k8sCount })
  }, [k8sCount])

  // URL queries for the URL subset only
  const urlQueries = useQueries({
    queries: urlItems.map((url, i) => ({
      queryKey: ['multi-url', i, url],
      queryFn: async () => {
        const res = await axios.get(url)
        return structuredClone(res.data) as unknown
      },
      structuralSharing: false,
      refetchInterval: 5000,
    })),
  })

  // Assemble context value
  const value: MultiQueryContextValue = (() => {
    // if (typeof dataToApplyToContext !== 'undefined') {
    //   return { data: { req0: dataToApplyToContext }, isLoading: false, isError: false, errors: [] }
    // }

    const data: DataMap = {}
    const errors: Array<AxiosError | Error | string | null> = []

    // ⭐ dataToApplyToContext becomes req0
    const hasExtraReq0 = typeof dataToApplyToContext !== 'undefined'
    const baseIndex = hasExtraReq0 ? 1 : 0

    // 1) K8s occupy req[0..k8sCount-1]
    for (let i = 0; i < k8sCount; i++) {
      const e = state.entries[i] ?? makeEmptyEntry()
      // data[`req${i}`] = e.data
      // errors[i] = e.isError ? e.error : null
      const idx = baseIndex + i
      data[`req${idx}`] = e.data
      errors[idx] = e.isError ? e.error : null
    }

    // 2) URLs continue after K8s: req[k8sCount..total-1]
    for (let i = 0; i < urlCount; i++) {
      const q = urlQueries[i]
      // const idx = k8sCount + i
      // data[`req${idx}`] = q?.data
      // errors[idx] = q?.isError ? ((q.error ?? null) as AxiosError | Error | string | null) : null
      const idx = baseIndex + k8sCount + i
      data[`req${idx}`] = q?.data
      errors[idx] = q?.isError ? ((q.error ?? null) as AxiosError | Error | string | null) : null
    }

    // ⭐ Ensure dataToApplyToContext becomes req0 (override or create)
    if (hasExtraReq0) {
      data.req0 = dataToApplyToContext
      // You can decide what you want for errors[0]; null is reasonable:
      errors[0] = null
    }

    const isLoading = state.entries.some(e => e.isLoading) || urlQueries.some(q => q.isLoading)

    const isError = state.entries.some(e => e.isError) || urlQueries.some(q => q.isError)

    return { data, isLoading, isError, errors }
  })()

  return (
    <MultiQueryContext.Provider value={value}>
      {/* Mount one fetcher per K8s resource (Rules of Hooks compliant) */}
      {k8sItems.map((params, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <K8sFetcher key={i} index={i} params={params} dispatch={dispatch} />
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
