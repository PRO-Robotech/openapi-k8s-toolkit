import React, { FC, ReactNode } from 'react'
import { AntdResult } from 'components/organisms/DynamicComponents/molecules/AntdResult'

type TEffectiveAntdResultWrapperProps = {
  effectiveReqIndexes: number[]
  itemsPath?: string | string[]
  children: ReactNode
}

export const EffectiveAntdResultWrapper: FC<TEffectiveAntdResultWrapperProps> = ({
  effectiveReqIndexes,
  itemsPath,
  children,
}) => (
  <AntdResult data={{ id: 'effective-antd-result', reqIndex: effectiveReqIndexes, itemsPath }}>{children}</AntdResult>
)
