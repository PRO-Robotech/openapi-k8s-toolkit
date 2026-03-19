/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import jp from 'jsonpath'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { parseReqIndex } from '../utils'
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

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors, hasErrorForReq, getErrorForReq, errors } = useMultiQuery()

  if (isMultiQueryLoading) {
    return <div>Loading...</div>
  }

  const reqIdx = parseReqIndex(data.reqIndex)
  const shouldShowError = reqIdx != null ? hasErrorForReq(reqIdx) : isMultiQueryErrors

  if (shouldShowError) {
    const errorToShow = reqIdx != null ? getErrorForReq(reqIdx) : errors.find(e => e !== null)
    return (
      <div>
        <h4>Errors:</h4>
        <ul>{errorToShow && <li>{typeof errorToShow === 'string' ? errorToShow : errorToShow.message}</li>}</ul>
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
