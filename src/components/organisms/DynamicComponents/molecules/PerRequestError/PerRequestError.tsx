import React, { FC } from 'react'
import { Alert } from 'antd'
import { AxiosError } from 'axios'

type TPerRequestErrorProps = {
  error: AxiosError | Error | string | null
}

export const PerRequestError: FC<TPerRequestErrorProps> = ({ error }) => {
  if (!error) return null

  const message = typeof error === 'string' ? error : error.message

  return <Alert type="error" message={message} showIcon />
}
