import { useMemo } from 'react'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { extractReqIndicesFromData, parseReqIndex } from '../utils'
import { TPerRequestErrorResult } from './types'

/**
 * Auto-detects which requests a component depends on
 * by scanning template strings in its `data` props for
 * {reqs[N]...} and {reqsJsonPath[N]...} patterns.
 *
 * Also picks up an explicit `data.reqIndex` prop (used by
 * direct-access components like Labels, Annotations, etc.).
 *
 * If no req references are found (layout components like antdFlex,
 * or programmatically rendered components like ConverterBytes inside
 * UsageGraphCard), returns no error — the component does not consume
 * multiQuery data, so multiQuery errors are irrelevant to it.
 *
 */
export const useAutoPerRequestError = (data: Record<string, unknown>): TPerRequestErrorResult => {
  const { hasErrorForReq, getErrorForReq } = useMultiQuery()

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
    return { shouldShowError: false, errorToShow: null }
  }

  const failedIdx = reqIndices.find(idx => hasErrorForReq(idx))
  if (failedIdx !== undefined) {
    return { shouldShowError: true, errorToShow: getErrorForReq(failedIdx) }
  }

  return { shouldShowError: false, errorToShow: null }
}
