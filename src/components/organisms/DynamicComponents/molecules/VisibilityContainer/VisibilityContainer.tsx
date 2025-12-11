/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { parseWithoutPartsOfUrl } from '../utils'
import { Styled } from './styled'

export const VisibilityContainer: FC<{ data: TDynamicComponentsAppTypeMap['VisibilityContainer']; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    value,
    criteria,
    valueToCompare,
  } = data

  const valuePrepared = parseWithoutPartsOfUrl({
    text: value,
    multiQueryData,
    customFallback: '~undefined-value~',
  })

  const shouldHideByCriteria = (() => {
    if (!criteria || !valueToCompare) return false

    const targets = Array.isArray(valueToCompare) ? valueToCompare.map(String) : [String(valueToCompare)]
    const matches = targets.includes(String(valuePrepared))

    if (criteria === 'equals') return !matches
    if (criteria === 'notEquals') return matches
    return false
  })()

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  return (
    <Styled.VisibilityContainer
      $hidden={!valuePrepared || valuePrepared === '~undefined-value~' || shouldHideByCriteria}
    >
      {children}
    </Styled.VisibilityContainer>
  )
}
