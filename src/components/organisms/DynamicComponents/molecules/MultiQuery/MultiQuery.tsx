/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { parseMutliqueryText } from '../utils'
import { usePerRequestError } from '../hooks/usePerRequestError'
import { PerRequestError } from '../PerRequestError'

export const MultiQuery: FC<{ data: TDynamicComponentsAppTypeMap['multiQuery'] }> = ({ data }) => {
  const { data: multiQueryData, isLoading } = useMultiQuery()
  const { shouldShowError, errorToShow } = usePerRequestError(data.reqIndex)

  const preparedText = parseMutliqueryText({ text: data.text, multiQueryData })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (shouldShowError) {
    return <PerRequestError error={errorToShow} />
  }

  return <span>{preparedText}</span>
}
