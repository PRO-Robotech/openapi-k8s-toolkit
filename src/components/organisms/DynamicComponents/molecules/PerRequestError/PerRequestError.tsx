import React, { FC } from 'react'
import { AxiosError } from 'axios'

type TPerRequestErrorProps = {
  error: AxiosError | Error | string | null
}

export const PerRequestError: FC<TPerRequestErrorProps> = ({ error }) => {
  if (!error) return null
  return (
    <div>
      <h4>Errors:</h4>
      <ul>
        <li>{typeof error === 'string' ? error : error.message}</li>
      </ul>
    </div>
  )
}
