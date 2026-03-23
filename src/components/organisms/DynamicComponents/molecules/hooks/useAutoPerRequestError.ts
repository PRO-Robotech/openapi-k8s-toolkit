import { useMemo } from 'react'
import { AxiosError } from 'axios'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { extractReqIndicesFromData, parseReqIndex } from '../utils'

type TAutoPerRequestErrorResult = {
  shouldShowError: boolean
  errorToShow: AxiosError | Error | string | null
}

/**
 * Auto-detects which requests a component depends on
 * by scanning template strings in its `data` props for
 * {reqs[N]...} and {reqsJsonPath[N]...} patterns.
 *
 * Also picks up an explicit `data.reqIndex` prop (used by
 * direct-access components like Labels, Annotations, etc.).
 *
 * If no req references are found (layout components like antdFlex),
 * falls back to the global isError flag from the provider.
 */
export const useAutoPerRequestError = (data: Record<string, unknown>): TAutoPerRequestErrorResult => {
  const { isError, errors, hasErrorForReq, getErrorForReq } = useMultiQuery()

  const reqIndices = useMemo(() => {
    const fromTemplates = extractReqIndicesFromData(data)

    const raw = data.reqIndex
    if (typeof raw === 'string' || typeof raw === 'number') {
      const explicit = parseReqIndex(raw)
      if (explicit !== undefined) {
        fromTemplates.push(explicit)
      }
    }

    return [...new Set(fromTemplates)]
  }, [data])

  if (reqIndices.length === 0) {
    const globalError = isError ? errors.find(e => e !== null) ?? null : null
    return { shouldShowError: isError, errorToShow: globalError }
  }

  const failedIdx = reqIndices.find(idx => hasErrorForReq(idx))
  if (failedIdx !== undefined) {
    return { shouldShowError: true, errorToShow: getErrorForReq(failedIdx) }
  }

  return { shouldShowError: false, errorToShow: null }
}
