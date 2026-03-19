/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll, parseReqIndex } from '../utils'

export const MappedParsedText: FC<{ data: TDynamicComponentsAppTypeMap['MappedParsedText'] }> = ({ data }) => {
  const { value, valueMap, style } = data

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

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, item, index) => {
    acc[index.toString()] = item
    return acc
  }, {})

  const parsedValue = parseAll({ text: value, replaceValues, multiQueryData })
  const renderedValue = Object.prototype.hasOwnProperty.call(valueMap, parsedValue)
    ? valueMap[parsedValue]
    : parsedValue

  return <span style={style}>{renderedValue}</span>
}
