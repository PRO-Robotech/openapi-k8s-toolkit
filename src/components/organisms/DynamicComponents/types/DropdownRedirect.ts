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
  /**
   * Current selected value. Use {reqsJsonPath[...]} format, not URL segments like {8}.
   * Example: "{reqsJsonPath[0]['.items.0.metadata.name']['~undefined-value~']}"
   */
  currentValue?: string
  placeholder?: string
  style?: CSSProperties
  showSearch?: boolean
  loading?: boolean
  /**
   * Whether popup menu matches select width. Default true (popup min-width equals select width).
   * Can be a number to set specific min-width for popup.
   */
  popupMatchSelectWidth?: boolean | number
}
