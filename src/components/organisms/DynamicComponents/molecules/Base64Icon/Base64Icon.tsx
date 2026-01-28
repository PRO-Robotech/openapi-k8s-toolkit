/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useMemo } from 'react'
import { theme as antdtheme } from 'antd'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { renderIcon, resolveTokenStyle } from './utils'

export const Base64Icon: FC<{ data: TDynamicComponentsAppTypeMap['Base64Icon']; children?: any }> = ({
  data,
  children,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, base64Icon, containerStyle } = data

  const { token } = antdtheme.useToken()

  const iconComponent = renderIcon(base64Icon, token.colorText)

  const resolvedContainerStyle = useMemo(() => resolveTokenStyle(containerStyle, token), [containerStyle, token])

  return (
    <div style={resolvedContainerStyle}>
      {iconComponent}
      {children}
    </div>
  )
}
