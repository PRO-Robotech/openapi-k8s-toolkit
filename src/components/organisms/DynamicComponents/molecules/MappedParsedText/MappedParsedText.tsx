/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { usePerRequestError } from '../hooks/usePerRequestError'
import { PerRequestError } from '../PerRequestError'

export const MappedParsedText: FC<{ data: TDynamicComponentsAppTypeMap['MappedParsedText'] }> = ({ data }) => {
  const { value, valueMap, style } = data

  const { data: multiQueryData, isLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()
  const { shouldShowError, errorToShow } = usePerRequestError(data.reqIndex)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (shouldShowError) {
    return <PerRequestError error={errorToShow} />
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
