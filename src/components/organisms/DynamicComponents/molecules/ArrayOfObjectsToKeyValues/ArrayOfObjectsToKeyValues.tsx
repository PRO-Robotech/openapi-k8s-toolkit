/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import jp from 'jsonpath'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { unknownToString, parseArrayOfAny } from './utils'

export const ArrayOfObjectsToKeyValues: FC<{
  data: TDynamicComponentsAppTypeMap['ArrayOfObjectsToKeyValues']
  children?: any
}> = ({ data, children }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    reqIndex,
    jsonPathToArray,
    keyFieldName,
    valueFieldName,
    separator,
    containerStyle,
    rowStyle,
    keyFieldStyle,
    valueFieldStyle,
  } = data

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors, errors } = useMultiQuery()

  if (isMultiQueryLoading) {
    return <div>Loading...</div>
  }

  if (isMultiQueryErrors) {
    return (
      <div>
        <h4>Errors:</h4>
        <ul>{errors.map((e, i) => e && <li key={i}>{typeof e === 'string' ? e : e.message}</li>)}</ul>
      </div>
    )
  }

  const jsonRoot = multiQueryData[`req${reqIndex}`]

  if (jsonRoot === undefined) {
    return <div>No root for json path</div>
  }

  const anythingForNow = jp.query(jsonRoot || {}, `$${jsonPathToArray}`)

  const { data: arrayOfObjects, error: errorArrayOfObjects } = parseArrayOfAny(anythingForNow)

  if (!arrayOfObjects) {
    if (errorArrayOfObjects) {
      return <div>{errorArrayOfObjects}</div>
    }
    return <div>Not a valid data structure</div>
  }

  const separatorPrepared = separator || ':'

  return (
    <div style={containerStyle}>
      {arrayOfObjects.map(item => {
        return (
          <div key={JSON.stringify(item)} style={rowStyle}>
            <span style={keyFieldStyle}>
              {unknownToString(item[keyFieldName])}
              {separatorPrepared}{' '}
            </span>
            <span style={valueFieldStyle}>{unknownToString(item[valueFieldName])}</span>
          </div>
        )
      })}
      {children}
    </div>
  )
}
