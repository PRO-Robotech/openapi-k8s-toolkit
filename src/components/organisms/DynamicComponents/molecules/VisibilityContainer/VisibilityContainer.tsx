/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
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
  } = data

  const valuePrepared = parseWithoutPartsOfUrl({
    text: value,
    multiQueryData,
    customFallback: '~undefined-value~',
  })

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  return (
    <Styled.VisibilityContainer $hidden={valuePrepared === '~undefined-value~'}>{children}</Styled.VisibilityContainer>
  )
}
