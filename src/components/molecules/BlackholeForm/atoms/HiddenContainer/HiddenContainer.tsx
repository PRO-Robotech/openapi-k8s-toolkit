import React, { FC, PropsWithChildren } from 'react'
import { TFormName } from 'localTypes/form'
import { useHiddenPathsLayout } from '../../organisms/BlackholeForm/context'
import { PossibleHiddenContainer } from '../../atoms'
import { includesPath, toArray } from './utils'

type THiddenContainerProps = PropsWithChildren<{
  name?: TFormName
  secondName?: TFormName
}>

export const HiddenContainer: FC<THiddenContainerProps> = ({ name, secondName, children }) => {
  const hiddenPaths = useHiddenPathsLayout() // type: string[][]

  const nameArr = toArray(name)
  const secondArr = toArray(secondName)

  const isHidden = !!hiddenPaths && !!nameArr && includesPath(hiddenPaths, nameArr)

  const isHiddenSecond = !!hiddenPaths && !!secondArr && includesPath(hiddenPaths, secondArr)

  return (
    <PossibleHiddenContainer $isHidden={!hiddenPaths || isHidden || isHiddenSecond}>{children}</PossibleHiddenContainer>
  )
}
