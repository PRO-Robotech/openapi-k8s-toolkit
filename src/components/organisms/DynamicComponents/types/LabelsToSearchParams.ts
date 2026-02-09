import type { LinkProps } from 'antd/es/typography/Link'

export type TLabelsToSearchParamsProps = {
  id: number | string
  reqIndex: string
  jsonPathToLabels: string
  linkPrefix: string
  textLink?: string
  errorText: string
  maxTextLength?: number
  renderLabelsAsRows?: boolean
} & Omit<LinkProps, 'id' | 'children' | 'href'>
