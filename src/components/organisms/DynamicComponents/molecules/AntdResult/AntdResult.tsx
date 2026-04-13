/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { Result } from 'antd'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { checkReqIndex, findWorstError, getDefaultTitle, resolveItemsPath } from './utils'
import { Styled } from './styled'

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

  // Auto-detect mode: reqIndex provided → check errors for that request (or requests)
  if (typeof data.reqIndex === 'number') {
    const itemsPath = resolveItemsPath(data.itemsPath, 0)
    const result = checkReqIndex(data.reqIndex, multiQueryData, getErrorForReq, shouldCheckEmpty, itemsPath)

    if (!result) {
      return children ?? null
    }

    const status = data.status ?? result.resultStatus
    const title = data.title ? parseAll({ text: data.title, replaceValues, multiQueryData }) : getDefaultTitle(status)
    const subTitle = data.subTitle ? parseAll({ text: data.subTitle, replaceValues, multiQueryData }) : result.message

    return (
      <Styled.CenteredResultWrapper>
        <Result status={status} title={title} subTitle={subTitle} style={data.style} />
      </Styled.CenteredResultWrapper>
    )
  }

  if (Array.isArray(data.reqIndex)) {
    const worst = findWorstError(data.reqIndex, multiQueryData, getErrorForReq, shouldCheckEmpty, data.itemsPath)

    if (!worst) {
      return children ?? null
    }

    const status = data.status ?? worst.resultStatus
    const title = data.title ? parseAll({ text: data.title, replaceValues, multiQueryData }) : getDefaultTitle(status)
    const subTitle = data.subTitle ? parseAll({ text: data.subTitle, replaceValues, multiQueryData }) : worst.message

    return (
      <Styled.CenteredResultWrapper>
        <Result status={status} title={title} subTitle={subTitle} style={data.style} />
      </Styled.CenteredResultWrapper>
    )
  }

  // Manual mode: no reqIndex → fully static/template-driven
  const parsedTitle = data.title ? parseAll({ text: data.title, replaceValues, multiQueryData }) : undefined

  const parsedSubTitle = data.subTitle ? parseAll({ text: data.subTitle, replaceValues, multiQueryData }) : undefined

  return (
    <Styled.CenteredResultWrapper>
      <Result status={data.status} title={parsedTitle} subTitle={parsedSubTitle} style={data.style}>
        {children}
      </Result>
    </Styled.CenteredResultWrapper>
  )
}
