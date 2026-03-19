/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { parseMutliqueryText, parseReqIndex } from '../utils'

export const MultiQuery: FC<{ data: TDynamicComponentsAppTypeMap['multiQuery'] }> = ({ data }) => {
  const { data: multiQueryData, isLoading, isError, hasErrorForReq, getErrorForReq, errors } = useMultiQuery()

  const preparedText = parseMutliqueryText({ text: data.text, multiQueryData })

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

  return <span>{preparedText}</span>
}
