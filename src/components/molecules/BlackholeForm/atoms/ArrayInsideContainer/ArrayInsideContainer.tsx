import React, { FC, PropsWithChildren } from 'react'
import { useDesignNewLayout } from '../../organisms/BlackholeForm/context'
import { Styled } from './styled'

type TArrayInsideContainerProps = PropsWithChildren

export const ArrayInsideContainer: FC<TArrayInsideContainerProps> = ({ children }) => {
  const designNewLayout = useDesignNewLayout()

  return <Styled.Content $designNewLayout={designNewLayout}>{children}</Styled.Content>
}
