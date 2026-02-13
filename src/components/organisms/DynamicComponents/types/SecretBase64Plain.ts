import { CSSProperties } from 'react'
import { FlexProps } from 'antd'

export type TSecretBase64PlainProps = {
  id: number | string
  type?: 'base64' | 'plain'
  value?: string // primary single-value input
  reqIndex?: string
  jsonPathToSecrets?: string
  base64Value?: string // deprecated: use value + type='base64'
  plainTextValue?: string // deprecated: use value + type='plain'
  multiline?: boolean
  multilineRows?: number
  textStyle?: CSSProperties
  emptyText?: string
  containerStyle?: CSSProperties
  inputContainerStyle?: CSSProperties
  flexProps?: Omit<FlexProps, 'children'>
  niceLooking?: boolean
  notificationWidth?: string // default 300px
  notificationText?: string // Text copied to clipboard
}
