import { CardProps, FlexProps, RowProps, ColProps, ButtonProps, TabsProps } from 'antd'
import type { TextProps } from 'antd/es/typography/Text'
import type { LinkProps } from 'antd/es/typography/Link'
import * as AntIcons from '@ant-design/icons'
import { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'

export type TAntdTextProps = { id: number | string; text: string } & Omit<TextProps, 'id' | 'children'>

export type TAntdLinkProps = {
  id: number | string
  text: string
  href: string
} & Omit<LinkProps, 'id' | 'children' | 'href'>

export type TAntdCardProps = { id: number | string } & Omit<CardProps, 'id'>

export type TAntdFlexProps = { id: number | string } & Omit<FlexProps, 'id' | 'children'>

export type TAntdRowProps = { id: number | string } & Omit<RowProps, 'id' | 'children'>

export type TAntdColProps = { id: number | string } & Omit<ColProps, 'id' | 'children'>

export type TAntdTabsProps = {
  id: number | string
  // If true, active tab key is synced with URL hash fragment (#tabKey).
  syncActiveKeyWithHash?: boolean
  // If true, tab labels become links that can be opened in a new browser tab.
  allowOpenInNewBrowserTab?: boolean
  // If true, inactive tab pane content is unmounted on tab change.
  // True by default
  unmountOnTabChange?: boolean
} & Omit<TabsProps, 'id' | 'children'>

export type TAntdButtonProps = { id: number | string; text: string } & Omit<ButtonProps, 'id' | 'children'>

export type TAntdIconsProps = {
  id: number | string
  iconName: Exclude<keyof typeof AntIcons, 'createFromIconfontCN'> // https://5x.ant.design/components/icon/
  iconProps?: AntdIconProps // color can be like token.colorSuccess
  containerStyle?: React.CSSProperties
}
