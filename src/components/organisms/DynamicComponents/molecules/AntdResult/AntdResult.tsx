/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Result } from 'antd'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { isEmptyAtPath } from './utils'

type TErrorWithResponse = { response?: { status?: number; statusText?: string }; message?: string }

const httpStatusToResultStatus = (statusCode: number | undefined) => {
  if (statusCode === 403) return '403' as const
  if (statusCode === 404) return '404' as const
  if (statusCode && statusCode >= 500) return '500' as const
  return 'error' as const
}

const getDefaultTitle = (status: string | number) => {
  if (status === '403') return 'Access Denied'
  if (status === '404') return 'Not Found'
  if (status === '500') return 'Server Error'
  return 'Error'
}

export const AntdResult: FC<{
  data: TDynamicComponentsAppTypeMap['antdResult']
  children?: any
}> = ({ data, children }) => {
  const { data: multiQueryData, isLoading, getErrorForReq } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  if (isLoading) {
    return null
  }

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  // Auto-detect mode: reqIndex provided → check errors for that request
  if (typeof data.reqIndex === 'number') {
    const error = getErrorForReq(data.reqIndex)

    // checkEmpty (default: true): response has empty array at itemsPath → treat as 404
    const shouldCheckEmpty = data.checkEmpty !== false
    const itemsPath = data.itemsPath ?? '.items'
    const emptyListDetected = !error && shouldCheckEmpty && isEmptyAtPath(multiQueryData, data.reqIndex, itemsPath)

    if (!error && !emptyListDetected) {
      return children ?? null
    }

    const errorObj = error as TErrorWithResponse
    const httpStatus = emptyListDetected ? 404 : errorObj?.response?.status
    const autoStatus = httpStatusToResultStatus(httpStatus)
    const autoMessage = emptyListDetected
      ? 'The requested resource was not found'
      : errorObj?.response?.statusText || errorObj?.message || String(error)

    const status = data.status ?? autoStatus
    const title = data.title ? parseAll({ text: data.title, replaceValues, multiQueryData }) : getDefaultTitle(status)
    const subTitle = data.subTitle ? parseAll({ text: data.subTitle, replaceValues, multiQueryData }) : autoMessage

    return <Result status={status} title={title} subTitle={subTitle} style={data.style} />
  }

  // Manual mode: no reqIndex → fully static/template-driven
  const parsedTitle = data.title ? parseAll({ text: data.title, replaceValues, multiQueryData }) : undefined

  const parsedSubTitle = data.subTitle ? parseAll({ text: data.subTitle, replaceValues, multiQueryData }) : undefined

  return (
    <Result status={data.status} title={parsedTitle} subTitle={parsedSubTitle} style={data.style}>
      {children}
    </Result>
  )
}
