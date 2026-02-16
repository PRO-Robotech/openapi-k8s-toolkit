import type { LinkProps } from 'antd/es/typography/Link'

export type TLabelsToSearchParamsProps = {
  id: number | string
  reqIndex: string
  jsonPathToLabels: string
  // Base URL only (for example: "/workloads"); component appends `?labels=` automatically.
  linkPrefix: string
  textLink?: string
  errorText: string
  // `errorText`: show plain text fallback, `default`: show linkPrefix fallback without selectors.
  errorMode?: 'errorText' | 'default'
  maxTextLength?: number
  renderLabelsAsRows?: boolean
} & Omit<LinkProps, 'id' | 'children' | 'href'>
