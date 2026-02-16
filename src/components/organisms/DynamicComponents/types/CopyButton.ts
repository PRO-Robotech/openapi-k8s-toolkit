import { CSSProperties } from 'react'

export type TCopyButtonProps = {
  id: number | string
  copyText: string
  successMessage?: string
  errorMessage?: string
  buttonType?: 'text' | 'link' | 'default' | 'primary' | 'dashed'
  tooltip?: string
  style?: CSSProperties
}
