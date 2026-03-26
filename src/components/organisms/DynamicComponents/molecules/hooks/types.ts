import { AxiosError } from 'axios'

export type TPerRequestErrorResult = {
  shouldShowError: boolean
  errorToShow: AxiosError | Error | string | null
}
