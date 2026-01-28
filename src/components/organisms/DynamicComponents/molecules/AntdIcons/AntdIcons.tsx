/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { renderAntIcon } from './utils'

export const AntdIcons: FC<{ data: TDynamicComponentsAppTypeMap['antdIcons']; children?: any }> = ({
  data,
  children,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, iconName, iconProps, containerStyle } = data

  const iconComponent = renderAntIcon(iconName, iconProps)

  return (
    <div style={containerStyle}>
      {iconComponent}
      {children}
    </div>
  )
}
