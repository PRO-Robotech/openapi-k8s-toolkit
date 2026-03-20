/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { parseMutliqueryText } from '../utils'
import { usePerRequestError } from '../hooks/usePerRequestError'
import { PerRequestError } from '../PerRequestError'

export const MultiQuery: FC<{ data: TDynamicComponentsAppTypeMap['multiQuery'] }> = ({ data }) => {
  const { data: multiQueryData, isLoading } = useMultiQuery()

  const preparedText = parseMutliqueryText({ text: data.text, multiQueryData })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const { shouldShowError, errorToShow } = usePerRequestError(data.reqIndex)

  if (shouldShowError) {
    return <PerRequestError error={errorToShow} />
  }

  return <span>{preparedText}</span>
}
