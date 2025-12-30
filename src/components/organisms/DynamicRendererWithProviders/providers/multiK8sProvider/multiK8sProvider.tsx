import React, { FC, ReactNode, createContext, useContext, useMemo, useReducer, useEffect } from 'react'
import type { AxiosError } from 'axios'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'

/** Reuse your hook's param type */
export type UseK8sSmartResourceParams<T> = Parameters<typeof useK8sSmartResource<T>>[0]

type DataMap = Record<string, unknown>

type MultiK8sContextValue = {
  data: DataMap
  isLoading: boolean
  isError: boolean
  errors: ReadonlyArray<AxiosError | Error | string | null>
}

const MultiK8sContext = createContext<MultiK8sContextValue | undefined>(undefined)

type MultiK8sProviderProps = {
  resources: ReadonlyArray<UseK8sSmartResourceParams<unknown>>
  dataToApplyToContext?: unknown
  children: ReactNode
}

/** --- Aggregation State & Reducer --------------------------------------- */

type ResultEntry = {
  data: unknown
  isLoading: boolean
  isError: boolean
  error: AxiosError | Error | string | null
}

type AggState = {
  entries: ResultEntry[]
}

type AggAction =
  | {
      type: 'SET_ENTRY'
      index: number
      entry: ResultEntry
      total: number
    }
  | {
      type: 'RESET'
      total: number
    }

const makeEmptyEntry = (): ResultEntry => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
})

const aggReducer = (state: AggState, action: AggAction): AggState => {
  switch (action.type) {
    case 'RESET': {
      const next: AggState = { entries: Array.from({ length: action.total }, makeEmptyEntry) }
      return next
    }
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

/** --- Child that is allowed to call the hook ----------------------------- */

type ResourceFetcherProps = {
  index: number
  total: number
  params: UseK8sSmartResourceParams<unknown>
  dispatch: React.Dispatch<AggAction>
}

const ResourceFetcher: FC<ResourceFetcherProps> = ({ index, total, params, dispatch }) => {
  const res = useK8sSmartResource<unknown>(params)

  // Push latest result to the aggregator
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
  }, [dispatch, index, total, res.data, res.isLoading, res.isError, res.error])

  // This component renders nothing; it just feeds context.
  return null
}

/** --- Provider ----------------------------------------------------------- */

export const MultiK8sProvider: FC<MultiK8sProviderProps> = ({ resources, dataToApplyToContext, children }) => {
  const total = resources.length

  const [state, dispatch] = useReducer(aggReducer, { entries: Array.from({ length: total }, makeEmptyEntry) })

  // Reset aggregator size when the resources list changes length
  useEffect(() => {
    dispatch({ type: 'RESET', total })
  }, [total])

  // Build context value: either short-circuit or aggregated
  const value: MultiK8sContextValue = useMemo(() => {
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
    state.entries.forEach((e, i) => {
      data[`req${i}`] = e.data
      errors[i] = e.isError ? e.error : null
    })

    const isLoading = state.entries.some(e => e.isLoading)
    const isError = state.entries.some(e => e.isError)

    return { data, isLoading, isError, errors }
  }, [dataToApplyToContext, state.entries])

  return (
    <MultiK8sContext.Provider value={value}>
      {/* Mount one fetcher per resource (rules-of-hooks compliant) */}
      {resources.map((params, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <ResourceFetcher key={i} index={i} total={total} params={params} dispatch={dispatch} />
      ))}
      {children}
    </MultiK8sContext.Provider>
  )
}

/** --- Consumer Hook ------------------------------------------------------ */

export const useMultiK8s = (): MultiK8sContextValue => {
  const ctx = useContext(MultiK8sContext)
  if (!ctx) throw new Error('useMultiK8s must be used within a MultiK8sProvider')
  return ctx
}
