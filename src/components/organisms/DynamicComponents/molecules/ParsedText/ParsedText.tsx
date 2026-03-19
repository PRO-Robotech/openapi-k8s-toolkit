/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { Tooltip } from 'antd'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll, parseReqIndex } from '../utils'
import { formatLocalDate } from './utils'

export const ParsedText: FC<{ data: TDynamicComponentsAppTypeMap['parsedText'] }> = ({ data }) => {
  const { data: multiQueryData, isLoading, isError, hasErrorForReq, getErrorForReq, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  if (isLoading) {
    return <div>Loading...</div>
  }

  const reqIdx = parseReqIndex(data.reqIndex)
  const shouldShowError = reqIdx != null ? hasErrorForReq(reqIdx) : isError

  if (shouldShowError) {
    const errorToShow = reqIdx != null ? getErrorForReq(reqIdx) : errors.find(e => e !== null)
    return (
      <div>
        <h4>Errors:</h4>
        <ul>{errorToShow && <li>{typeof errorToShow === 'string' ? errorToShow : errorToShow.message}</li>}</ul>
      </div>
    )
  }

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const parsedText = parseAll({ text: data.text, replaceValues, multiQueryData })
  const parsedTooltip = data.tooltip ? parseAll({ text: data.tooltip, replaceValues, multiQueryData }) : undefined

  const formattedText = data.formatter ? formatLocalDate(parsedText) : parsedText

  const content = <span style={data.style}>{formattedText}</span>

  if (parsedTooltip) {
    return <Tooltip title={parsedTooltip}>{content}</Tooltip>
  }

  return content
}
