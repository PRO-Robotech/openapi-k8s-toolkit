import type { LinkProps } from 'antd/es/typography/Link'

export type TLabelsToSearchParamsProps = {
  id: number | string
  reqIndex: string
  jsonPathToLabels: string
  linkPrefix: string
  textLink?: string
  errorText: string
  maxTextLength?: number
} & Omit<LinkProps, 'id' | 'children' | 'href'>
