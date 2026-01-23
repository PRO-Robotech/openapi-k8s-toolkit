import { CardProps, FlexProps, RowProps, ColProps, ButtonProps, TabsProps } from 'antd'
import type { TextProps } from 'antd/es/typography/Text'
import type { LinkProps } from 'antd/es/typography/Link'

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

export type TAntdTabsProps = { id: number | string } & Omit<TabsProps, 'id' | 'children'>

export type TAntdButtonProps = { id: number | string; text: string } & Omit<ButtonProps, 'id' | 'children'>
