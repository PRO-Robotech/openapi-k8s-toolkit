import React from 'react'
import * as AntIcons from '@ant-design/icons'
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'

type TAntIconName = Exclude<keyof typeof AntIcons, 'createFromIconfontCN'>

const isReactComponentType = (v: unknown): v is React.ElementType<AntdIconProps> => {
  // Function components / class components
  if (typeof v === 'function') return true

  // React.forwardRef / React.memo etc. (usually objects with $$typeof)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof v === 'object' && v !== null && '$$typeof' in (v as any)
}

export const renderAntIcon = (iconName: TAntIconName, iconProps?: AntdIconProps): JSX.Element | null => {
  const candidate = AntIcons[iconName] as unknown
  if (!isReactComponentType(candidate)) return null

  const IconComponent = candidate
  return <IconComponent {...iconProps} />
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resolveTokenColor = (value: unknown, token: Record<string, any>) => {
  if (typeof value !== 'string') return value
  if (!value.startsWith('token.')) return value

  const tokenKey = value.replace('token.', '')
  return token[tokenKey] ?? value
}
