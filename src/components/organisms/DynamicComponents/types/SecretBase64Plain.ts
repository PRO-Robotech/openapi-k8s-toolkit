import { CSSProperties } from 'react'
import { FlexProps } from 'antd'

export type TSecretBase64PlainProps = {
  id: number | string
  base64Value?: string // reqs | one of required
  plainTextValue?: string // reqs | one of required
  multiline?: boolean
  multilineRows?: number
  containerStyle?: CSSProperties
  inputContainerStyle?: CSSProperties
  flexProps?: Omit<FlexProps, 'children'>
  niceLooking?: boolean
  notificationWidth?: string // default 300px
  notificationText?: string // Text copied to clipboard
}
