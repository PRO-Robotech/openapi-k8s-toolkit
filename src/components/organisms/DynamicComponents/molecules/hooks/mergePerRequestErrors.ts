import { TPerRequestErrorResult } from './types'

/**
 * Merges the result of useAutoPerRequestError with additional
 * nested req index checks (e.g. labelSelectorFull.reqIndex,
 * additionalReqsDataToEachItem).
 *
 * Use this when a component accesses multiQueryData via nested reqIndex
 * fields that useAutoPerRequestError cannot auto-detect.
 */
export const mergePerRequestErrors = (
  autoResult: TPerRequestErrorResult,
  hasErrorForReq: (idx: number) => boolean,
  nestedReqIndices: (number | undefined)[],
): TPerRequestErrorResult => {
  if (autoResult.shouldShowError) return autoResult

  const failedIdx = nestedReqIndices.find(idx => idx !== undefined && hasErrorForReq(idx))
  if (failedIdx !== undefined) {
    return {
      shouldShowError: true,
      errorToShow: 'A dependent request failed',
    }
  }

  return autoResult
}
