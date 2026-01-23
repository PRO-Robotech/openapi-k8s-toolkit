import { CSSProperties } from 'react'

export type TDropdownRedirectProps = {
  id: number | string
  cluster: string
  apiVersion: string
  apiGroup?: string
  namespace?: string
  plural: string
  jsonPath: string
  redirectUrl: string
  currentValue?: string
  placeholder?: string
  style?: CSSProperties
  showSearch?: boolean
  loading?: boolean
}
