/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { AntdIcons } from './AntdIcons'
import type { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['antdIcons']

type TProviderArgs = {
  isLoading: boolean
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/AntdIcons',
  component: AntdIcons as any,

  argTypes: {
    // data.*
    id: {
      control: 'text',
      description: 'data.id (Dynamic Renderer id)',
    },
    iconName: {
      control: 'text',
      description: 'data.iconName (Ant Design icon component name e.g. UserOutlined, SettingFilled)',
    },
    iconProps: {
      control: 'object',
      description: 'data.iconProps (AntdIconProps forwarded to the icon component)',
    },
    containerStyle: {
      control: 'object',
      description: 'data.containerStyle (style applied to the wrapping div)',
    },

    // provider knobs
    isLoading: {
      control: 'boolean',
      description: 'useMultiQuery.isLoading (simulated)',
    },
    multiQueryData: {
      control: 'object',
      description: 'mock data fed into MultiQuery context',
    },
    partsOfUrl: {
      control: 'object',
      description: 'mocked partsOfUrl.partsOfUrl array (used by parseAll placeholders like {0}, {1}, ... if relevant)',
    },
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
      description: 'Mock UI Theme context',
    },
  },

  render: args => {
    const { isLoading, multiQueryData, partsOfUrl, theme, ...rest } = args

    const data: TInner = {
      id: rest.id,
      iconName: rest.iconName,
      iconProps: rest.iconProps,
      containerStyle: rest.containerStyle,
    }

    return (
      <>
        <SmartProvider multiQueryValue={{ data: multiQueryData, isLoading }} partsOfUrl={partsOfUrl} theme={theme}>
          <div style={{ padding: 16 }}>
            <AntdIcons data={data}>
              <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>(child content)</span>
            </AntdIcons>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={220}
          value={yaml.stringify({
            type: 'antdIcons',
            data,
          })}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
          }}
        />
      </>
    )
  },

  parameters: {
    controls: { expanded: true },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-antd-icons',
    iconName: 'UserOutlined' as any,
    iconProps: {
      style: { fontSize: 24 },
    } as any,
    containerStyle: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
    } as any,

    // providers
    isLoading: false,
    multiQueryData: null,
    partsOfUrl: [],
    theme: 'light',
  },
}

export const Spinning: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-icons-spinning',
    iconName: 'LoadingOutlined' as any,
    iconProps: {
      spin: true,
      style: { fontSize: 24 },
    } as any,
  },
}

export const RotatedAndColored: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-icons-rotated-colored',
    iconName: 'SettingOutlined' as any,
    iconProps: {
      rotate: 45,
      style: { fontSize: 24, color: '#1677ff' },
    } as any,
  },
}

export const WithContainerStyle: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-icons-container',
    iconName: 'SmileOutlined' as any,
    iconProps: {
      style: { fontSize: 28 },
    } as any,
    containerStyle: {
      padding: 12,
      border: '1px dashed #d9d9d9',
      borderRadius: 8,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
    } as any,
  },
}
