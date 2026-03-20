import { AxiosError } from 'axios'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { parseReqIndex } from '../utils'

type TPerRequestErrorResult = {
  shouldShowError: boolean
  errorToShow: AxiosError | Error | string | null
}

export const usePerRequestError = (reqIndex?: string | number): TPerRequestErrorResult => {
  const { isError, hasErrorForReq, getErrorForReq, errors } = useMultiQuery()
  const reqIdx = parseReqIndex(reqIndex)
  const shouldShowError = reqIdx != null ? hasErrorForReq(reqIdx) : isError
  const resolveError = (): AxiosError | Error | string | null => {
    if (!shouldShowError) return null
    if (reqIdx != null) return getErrorForReq(reqIdx)
    return errors.find(e => e !== null) ?? null
  }
  const errorToShow = resolveError()
  return { shouldShowError, errorToShow }
}
