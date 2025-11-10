/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
import { parseMutliqueryText } from '../utils'

export const MultiQuery: FC<{ data: TDynamicComponentsAppTypeMap['multiQuery'] }> = ({ data }) => {
  const { data: multiQueryData, isLoading, isError, errors } = useMultiQuery()

  const preparedText = parseMutliqueryText({ text: data.text, multiQueryData })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError) {
    return (
      <div>
        <h4>Errors:</h4>
        <ul>{errors.map((e, i) => e && <li key={i}>{typeof e === 'string' ? e : e.message}</li>)}</ul>
      </div>
    )
  }

  return <span>{preparedText}</span>
}
