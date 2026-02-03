import type { Decorator, Preview } from '@storybook/react'
import { ConfigProvider, theme as antdTheme } from 'antd'
import { initialize, mswLoader } from 'msw-storybook-addon'
import styled from 'styled-components'
import { getConfigProviderProps } from './_constants/colors'
import './preview.css'

initialize()

type TDefaultColorProviderProps = {
  $color: string
}

const DefaultColorProvider = styled.div<TDefaultColorProviderProps>`
  color: ${({ $color }) => $color};

  td {
    color: ${({ $color }) => $color};
  }
`

const DefaultColorWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = antdTheme.useToken()
  return <DefaultColorProvider $color={token.colorText}>{children}</DefaultColorProvider>
}

const withAntdConfigProvider: Decorator = (Story, context) => {
  const theme =
    (context.globals?.theme as 'light' | 'dark' | undefined) ??
    (context.args?.theme as 'light' | 'dark' | undefined) ??
    (context.parameters?.theme as 'light' | 'dark' | undefined) ??
    'light'

  return (
    <ConfigProvider theme={getConfigProviderProps({ theme })}>
      <DefaultColorWrapper>
        <Story args={{ ...context.args, theme }} />
      </DefaultColorWrapper>
    </ConfigProvider>
  )
}

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for all stories',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withAntdConfigProvider],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    a11y: { disable: false },
    layout: 'padded',
    options: {
      storySort: {
        order: ['Welcome', ['overview']],
      },
    },
    docs: { autodocs: true },
  },
  loaders: [mswLoader],
}

export default preview
