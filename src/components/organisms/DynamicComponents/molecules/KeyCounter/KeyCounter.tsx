/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React, { FC } from 'react'
import jp from 'jsonpath'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/multiQueryProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { parseAll } from '../utils'
import { getItemsInside } from './utils'

export const KeyCounter: FC<{ data: TDynamicComponentsAppTypeMap['KeyCounter']; children?: any }> = ({
  data,
  children,
}) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    reqIndex,
    jsonPathToObj,
    text,
    errorText,
    style,
  } = data

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  if (isMultiQueryLoading) {
    return <div>Loading...</div>
  }

  if (isMultiQueryErrors) {
    return (
      <div>
        <h4>Errors:</h4>
        <ul>{errors.map((e, i) => e && <li key={i}>{e.message}</li>)}</ul>
      </div>
    )
  }

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const jsonRoot = multiQueryData[`req${reqIndex}`]

  if (jsonRoot === undefined) {
    console.log(`Key Counter: ${id}: No root for json path`)
    return <span style={style}>{errorText}</span>
  }

  const anythingForNow = jp.query(jsonRoot, `$${jsonPathToObj}`)

  const { counter, error: errorArrayOfObjects } = getItemsInside(anythingForNow)

  if (errorArrayOfObjects) {
    console.log(`Key Counter: ${id}: ${errorArrayOfObjects}`)
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
