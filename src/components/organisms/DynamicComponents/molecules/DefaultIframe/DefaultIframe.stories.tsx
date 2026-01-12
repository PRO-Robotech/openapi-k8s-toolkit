import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { DefaultIframe } from './DefaultIframe'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['DefaultIframe']

type TProviderArgs = {
  isLoading: boolean
  isError: boolean
  errors: { message: string }[]
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/DefaultIframe',
  component: DefaultIframe as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    src: {
      control: 'text',
      description:
        'data.src – template resolved via parseAll (e.g. "{reqsJsonPath[0][\'.data.url\'][\'-\']}" or "{2}")',
    },
    title: {
      control: 'text',
      description:
        'data.title – template resolved via parseAll (e.g. "Pod: {2}" or "{reqsJsonPath[0][\'.metadata.name\'][\'-\']}")',
    },

    // passthrough iframe props (optional)
    width: { control: 'text', description: 'iframe width' },
    height: { control: 'text', description: 'iframe height' },
    style: { control: 'object', description: 'iframe style' },
    allow: { control: 'text', description: 'iframe allow' },
    sandbox: { control: 'text', description: 'iframe sandbox' },

    // provider knobs
    isLoading: { control: 'boolean', description: 'useMultiQuery.isLoading (simulated)' },
    isError: { control: 'boolean', description: 'useMultiQuery.isError (simulated)' },
    errors: { control: 'object', description: 'useMultiQuery.errors (simulated)' },
    multiQueryData: { control: 'object', description: 'mock multiQuery data (object with req{index} keys)' },
    partsOfUrl: { control: 'object', description: 'mocked partsOfUrl.partsOfUrl array' },
    theme: { control: 'radio', options: ['light', 'dark'], description: 'Mock UI Theme context' },
  },

  render: args => {
    const data: TInner = {
      id: args.id,
      src: args.src,
      title: args.title,

      // passthrough props
      width: (args as any).width,
      height: (args as any).height,
      style: (args as any).style,
      allow: (args as any).allow,
      sandbox: (args as any).sandbox,
    }

    return (
      <>
        <SmartProvider
          multiQueryValue={{
            data: args.multiQueryData,
            isLoading: args.isLoading,
            isError: args.isError,
            errors: args.errors,
          }}
          partsOfUrl={args.partsOfUrl}
          theme={args.theme}
        >
          <div style={{ padding: 16 }}>
            <DefaultIframe data={data}>
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>(children slot content)</div>
            </DefaultIframe>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={240}
          value={yaml.stringify({
            type: 'DefaultIframe',
            data,
          })}
          theme="vs-dark"
          options={{
            theme: 'vs-dark',
            readOnly: true,
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
    id: 'example-default-iframe',
    src: 'https://example.com',
    title: 'Example Iframe',
    width: '100%',
    height: '260',
    style: { border: '1px solid #ddd', borderRadius: 6 },

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        data: {
          url: 'https://example.com/?from=req0',
          title: 'From req0',
        },
      },
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const TemplatingFromMultiQuery: Story = {
  args: {
    ...Default.args,
    id: 'example-default-iframe-mq',
    // ✅ matches your syntax: {reqsJsonPath[index]['.path']['fallback']}
    src: "{reqsJsonPath[0]['.data.url']['-']}",
    title: "{reqsJsonPath[0]['.data.title']['-']}",
  },
}

export const TemplatingFromPartsOfUrl: Story = {
  args: {
    ...Default.args,
    id: 'example-default-iframe-parts',
    // ✅ matches your syntax: {2} etc (partsOfUrl index)
    src: 'https://example.com/ns/{2}/pod/{4}',
    title: 'Namespace {2} / Pod {4}',
    partsOfUrl: ['', '', 'default', 'pods', 'my-pod'],
  },
}

export const LoadingMultiQuery: Story = {
  args: {
    ...Default.args,
    id: 'example-default-iframe-loading',
    isLoading: true,
  },
}

export const MultiQueryError: Story = {
  args: {
    ...Default.args,
    id: 'example-default-iframe-error',
    isError: true,
    errors: [{ message: 'Simulated multiQuery error' }],
  },
}
