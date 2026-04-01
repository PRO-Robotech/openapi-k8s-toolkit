import React, { FC, ReactNode } from 'react'
import { AntdResult } from 'components/organisms/DynamicComponents/molecules/AntdResult'

type TEffectiveAntdResultWrapperProps = {
  effectiveReqIndexes: number[]
  children: ReactNode
}

export const EffectiveAntdResultWrapper: FC<TEffectiveAntdResultWrapperProps> = ({ effectiveReqIndexes, children }) => (
  <AntdResult data={{ id: 'effective-antd-result', reqIndex: effectiveReqIndexes }}>{children}</AntdResult>
)
