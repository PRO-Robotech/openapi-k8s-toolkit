/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseWithoutPartsOfUrl, parseAll } from '../utils'
import { Styled } from './styled'

export const VisibilityContainer: FC<{ data: TDynamicComponentsAppTypeMap['VisibilityContainer']; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    value,
    criteria,
    valueToCompare,
  } = data

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const valuePrepared = parseWithoutPartsOfUrl({
    text: value,
    multiQueryData,
    customFallback: '~undefined-value~',
  })

  const shouldHideByCriteria = (() => {
    if (!criteria) return false

    if (criteria === 'exists') {
      return !valuePrepared || valuePrepared === '~undefined-value~'
    }
    if (criteria === 'notExists') {
      return !!valuePrepared && valuePrepared !== '~undefined-value~'
    }

    if (!valueToCompare) return false

    const targets = Array.isArray(valueToCompare)
      ? valueToCompare.map(target => parseAll({ text: target, replaceValues, multiQueryData }))
      : [parseAll({ text: String(valueToCompare), replaceValues, multiQueryData })]

    const matches = targets.includes(String(valuePrepared))

    if (criteria === 'equals') return !matches
    if (criteria === 'notEquals') return matches
    return false
  })()

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  const shouldAutoHide = !criteria && (!valuePrepared || valuePrepared === '~undefined-value~')

  return (
    <Styled.VisibilityContainer $hidden={shouldAutoHide || shouldHideByCriteria}>{children}</Styled.VisibilityContainer>
  )
}
