/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { AntdLink } from './AntdLink'
import type { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['antdLink']

type TProviderArgs = {
  isLoading: boolean
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/AntdLink',
  component: AntdLink as any,

  argTypes: {
    // data.*
    id: {
      control: 'text',
      description: 'data.id (Dynamic Renderer id)',
    },
    text: {
      control: 'text',
      description: 'data.text (link label; supports parseAll placeholders)',
    },
    href: {
      control: 'text',
      description: 'data.href (navigation target; supports parseAll placeholders)',
    },

    // LinkProps (subset, href/children excluded by type)
    target: {
      control: 'text',
      description: 'HTML anchor target',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the link',
    },
    underline: {
      control: 'boolean',
      description: 'Antd Typography.Link underline prop',
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
      description: 'mocked partsOfUrl.partsOfUrl array (used by parseAll placeholders like {0}, {1}, ...)',
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
      text: rest.text,
      href: rest.href,
      target: rest.target,
      disabled: rest.disabled,
      underline: rest.underline,
    }

    return (
      <>
        <SmartProvider multiQueryValue={{ data: multiQueryData, isLoading }} partsOfUrl={partsOfUrl} theme={theme}>
          <div style={{ padding: 16 }}>
            <AntdLink data={data}>
              <span style={{ marginLeft: 4, fontSize: 12, color: '#999' }}>(child content)</span>
            </AntdLink>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={220}
          value={yaml.stringify({
            type: 'antdLink',
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
    id: 'example-antd-link',
    text: 'Go to Pods page',
    href: '/clusters/my-cluster/namespaces/default/pods',
    target: undefined,
    disabled: false,
    underline: true,

    // providers
    isLoading: false,
    multiQueryData: null,
    partsOfUrl: [],
    theme: 'light',
  },
}

export const WithPartsOfUrlPlaceholders: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-link-parts-of-url',
    // imagine partsOfUrl = ['my-cluster', 'default']
    href: '/clusters/{0}/namespaces/{1}/pods',
    text: 'Pods in {1} on {0}',
    partsOfUrl: ['my-cluster', 'default'],
  },
}

export const Disabled: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-link-disabled',
    text: 'Disabled link',
    disabled: true,
  },
}
