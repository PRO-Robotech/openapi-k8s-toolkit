import React, { FC } from 'react'
import { DynamicRendererWithProviders, DynamicComponents } from 'components/organisms'
import '@xterm/xterm/css/xterm.css'

type TTableFactoryProps = {
  theme: 'dark' | 'light'
  record: unknown
  customProps: unknown
}

export const TableFactory: FC<TTableFactoryProps> = ({ record, customProps, theme }) => {
  if (!customProps) {
    return null
  }

  return (
    <DynamicRendererWithProviders
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      urlsToFetch={(customProps as any).urlsToFetch || []}
      dataToApplyToContext={record}
      theme={theme}
      // nodeTerminalDefaultProfile={}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      disableEventBubbling={(customProps as any).disableEventBubbling}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items={(customProps as any).items}
      components={DynamicComponents}
    />
  )
}
