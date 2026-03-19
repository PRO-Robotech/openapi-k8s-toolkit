import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react'
import axios, { AxiosError } from 'axios'
import { useQueries } from '@tanstack/react-query'
import { TUseK8sSmartResourceParams, useManyK8sSmartResource } from 'hooks/useK8sSmartResource'

type DataMap = Record<string, unknown>

type MultiQueryContextValue = {
  data: DataMap
  isLoading: boolean
  isError: boolean
  errors: ReadonlyArray<AxiosError | Error | string | null>
  /** Check whether a specific request (by index) has an error */
  hasErrorForReq: (reqIndex: number) => boolean
  /** Get the error object for a specific request (by index), or null if it succeeded */
  getErrorForReq: (reqIndex: number) => AxiosError | Error | string | null
}

const MultiQueryContext = createContext<MultiQueryContextValue | undefined>(undefined)

type MultiQueryProviderProps = {
  /** Mixed array: first (any number of) K8s resources, then (any number of) URL strings */
  items: ReadonlyArray<string | TUseK8sSmartResourceParams<unknown>>
  /** Optional short-circuit to set data.req0 directly */
  dataToApplyToContext?: unknown
  children: ReactNode
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

  // Direct hook call — replaces K8sFetcher + useReducer + useEffect bridge
  // Data is available synchronously in the same render frame (no 1-frame lag)
  const k8sResults = useManyK8sSmartResource(k8sItems)

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
    const data: DataMap = {}
    const errors: Array<AxiosError | Error | string | null> = []

    // ⭐ dataToApplyToContext becomes req0
    const hasExtraReq0 = typeof dataToApplyToContext !== 'undefined'
    const baseIndex = hasExtraReq0 ? 1 : 0

    // 1) K8s results from useManyK8sSmartResource (synchronous, no useEffect delay)
    for (let i = 0; i < k8sCount; i++) {
      const result = k8sResults[i]
      const idx = baseIndex + i
      data[`req${idx}`] = result?.data
      errors[idx] = result?.isError ? ((result.error ?? null) as AxiosError | Error | string | null) : null
    }

    // 2) URLs continue after K8s: req[k8sCount..total-1]
    for (let i = 0; i < urlCount; i++) {
      const q = urlQueries[i]
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

    const isLoading = k8sResults.some(r => r.isLoading) || urlQueries.some(q => q.isLoading)

    const isError = k8sResults.some(r => r.isError) || urlQueries.some(q => q.isError)

    const hasErrorForReq = (reqIndex: number): boolean => Boolean(errors[reqIndex])
    const getErrorForReq = (reqIndex: number): AxiosError | Error | string | null => errors[reqIndex] ?? null

    return { data, isLoading, isError, errors, hasErrorForReq, getErrorForReq }
  })()

  return <MultiQueryContext.Provider value={value}>{children}</MultiQueryContext.Provider>
}

/** Consumer hook */
export const useMultiQuery = (): MultiQueryContextValue => {
  const ctx = useContext(MultiQueryContext)
  if (!ctx) throw new Error('useMultiQuery must be used within a MultiQueryProvider')
  return ctx
}
