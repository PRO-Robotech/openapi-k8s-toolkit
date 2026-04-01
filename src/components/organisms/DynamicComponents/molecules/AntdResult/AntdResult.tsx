/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Result } from 'antd'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { isEmptyAtPath, extractHttpStatus, extractErrorMessage } from './utils'

const STATUS_SEVERITY: Record<string, number> = {
  '500': 3,
  '403': 2,
  '404': 1,
  error: 0,
}

export const httpStatusToResultStatus = (statusCode: number | undefined) => {
  if (statusCode === 403) return '403' as const
  if (statusCode === 404) return '404' as const
  if (statusCode && statusCode >= 500) return '500' as const
  return 'error' as const
}

export const getDefaultTitle = (status: string | number) => {
  if (status === '403') return 'Access Denied'
  if (status === '404') return 'Not Found'
  if (status === '500') return 'Server Error'
  return 'Error'
}

type TResultStatus = '403' | '404' | '500' | 'error'

// Check a single reqIndex for errors/empty state. Returns null if OK.
const checkReqIndex = (
  reqIndex: number,
  multiQueryData: Record<string, unknown>,
  getErrorForReq: (i: number) => unknown,
  shouldCheckEmpty: boolean,
  itemsPath: string,
): { resultStatus: TResultStatus; severity: number; message: string } | null => {
  const error = getErrorForReq(reqIndex)
  const emptyListDetected = !error && shouldCheckEmpty && isEmptyAtPath(multiQueryData, reqIndex, itemsPath)

  if (!error && !emptyListDetected) return null

  const httpStatus = emptyListDetected ? 404 : extractHttpStatus(error)
  const resultStatus = httpStatusToResultStatus(httpStatus)
  const severity = STATUS_SEVERITY[resultStatus] ?? 0
  const message = emptyListDetected ? 'The requested resource was not found' : extractErrorMessage(error)

  return { resultStatus, severity, message }
}

/** Find the worst error across an array of reqIndexes. Returns null if all OK. */
const findWorstError = (
  reqIndexes: number[],
  multiQueryData: Record<string, unknown>,
  getErrorForReq: (i: number) => unknown,
  shouldCheckEmpty: boolean,
  itemsPath: string,
): { resultStatus: TResultStatus; message: string } | null =>
  reqIndexes.reduce<{ resultStatus: TResultStatus; message: string; severity: number } | null>((worst, reqIndex) => {
    const result = checkReqIndex(reqIndex, multiQueryData, getErrorForReq, shouldCheckEmpty, itemsPath)
    if (!result) return worst
    if (!worst || result.severity > worst.severity) {
      return { resultStatus: result.resultStatus, message: result.message, severity: result.severity }
    }
    return worst
  }, null)

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

  const shouldCheckEmpty = data.checkEmpty !== false
  const itemsPath = data.itemsPath ?? '.items'

  // Auto-detect mode: reqIndex provided → check errors for that request (or requests)
  if (typeof data.reqIndex === 'number') {
    const result = checkReqIndex(data.reqIndex, multiQueryData, getErrorForReq, shouldCheckEmpty, itemsPath)

    if (!result) {
      return children ?? null
    }

    const status = data.status ?? result.resultStatus
    const title = data.title ? parseAll({ text: data.title, replaceValues, multiQueryData }) : getDefaultTitle(status)
    const subTitle = data.subTitle ? parseAll({ text: data.subTitle, replaceValues, multiQueryData }) : result.message

    return <Result status={status} title={title} subTitle={subTitle} style={data.style} />
  }

  if (Array.isArray(data.reqIndex)) {
    const worst = findWorstError(data.reqIndex, multiQueryData, getErrorForReq, shouldCheckEmpty, itemsPath)

    if (!worst) {
      return children ?? null
    }

    const status = data.status ?? worst.resultStatus
    const title = data.title ? parseAll({ text: data.title, replaceValues, multiQueryData }) : getDefaultTitle(status)
    const subTitle = data.subTitle ? parseAll({ text: data.subTitle, replaceValues, multiQueryData }) : worst.message

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
