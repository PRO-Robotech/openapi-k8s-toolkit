/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useMemo } from 'react'
import { theme as antdtheme } from 'antd'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { renderAntIcon, resolveTokenColor } from './utils'

export const AntdIcons: FC<{ data: TDynamicComponentsAppTypeMap['antdIcons']; children?: any }> = ({
  data,
  children,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, iconName, iconProps, containerStyle } = data

  const { token } = antdtheme.useToken()

  const resolvedIconProps = useMemo(() => {
    if (!iconProps) return iconProps

    const colorFromProps = (iconProps as any).color
    const colorFromStyle = iconProps.style?.color

    // 1️⃣ resolve color (iconProps.color wins over style.color)
    const resolvedColor = resolveTokenColor(colorFromProps ?? colorFromStyle, token)

    // 2️⃣ build final style
    const style =
      resolvedColor !== undefined
        ? {
            ...iconProps.style,
            color: resolvedColor,
          }
        : iconProps.style

    // 3️⃣ return normalized props (color removed, style.color enforced)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { color, ...rest } = iconProps as any

    return {
      ...rest,
      style,
    }
  }, [iconProps, token])

  const iconComponent = renderAntIcon(iconName, resolvedIconProps)

  return (
    <div style={containerStyle}>
      {iconComponent}
      {children}
    </div>
  )
}
