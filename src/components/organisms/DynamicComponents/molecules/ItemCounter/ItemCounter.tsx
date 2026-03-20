/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React, { FC } from 'react'
import jp from 'jsonpath'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { getItemCounterItemsInside } from '../../utils/ItemCounter'
import { parseAll } from '../utils'
import { usePerRequestError } from '../hooks/usePerRequestError'
import { PerRequestError } from '../PerRequestError'

export const ItemCounter: FC<{ data: TDynamicComponentsAppTypeMap['ItemCounter']; children?: any }> = ({
  data,
  children,
}) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    reqIndex,
    jsonPathToArray,
    text,
    errorText,
    style,
  } = data

  const { data: multiQueryData, isLoading: isMultiQueryLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()
  const { shouldShowError, errorToShow } = usePerRequestError(data.reqIndex)

  if (isMultiQueryLoading) {
    return <div>Loading...</div>
  }

  if (shouldShowError) {
    return <PerRequestError error={errorToShow} />
  }

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const jsonRoot = multiQueryData[`req${reqIndex}`]

  if (jsonRoot === undefined) {
    // console.log(`Item Counter: ${id}: No root for json path`)
    return <span style={style}>{errorText}</span>
  }

  const anythingForNow = jp.query(jsonRoot || {}, `$${jsonPathToArray}`)

  const { counter, error: errorArrayOfObjects } = getItemCounterItemsInside(anythingForNow)

  if (errorArrayOfObjects) {
    // console.log(`Item Counter: ${id}: ${errorArrayOfObjects}`)
    return <span style={style}>{errorText}</span>
  }

  const parsedText = parseAll({ text, replaceValues, multiQueryData })

  const parsedTextWithCounter = parsedText.replace('~counter~', String(counter || 0))

  return (
    <span style={style}>
      {parsedTextWithCounter}
      {children}
    </span>
  )
}
