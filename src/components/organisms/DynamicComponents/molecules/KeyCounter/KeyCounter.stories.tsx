// src/components/organisms/DynamicComponents/molecules/KeyCounter/KeyCounter.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { KeyCounter } from './KeyCounter'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['KeyCounter']

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
  title: 'Factory/KeyCounter',
  component: KeyCounter as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    reqIndex: {
      control: 'text',
      description: 'data.reqIndex (used as multiQueryData[`req${reqIndex}`])',
    },
    jsonPathToObj: {
      control: 'text',
      description: 'data.jsonPathToObj (jsonpath appended to `$` and queried via jsonpath)',
    },
    text: {
      control: 'text',
      description: 'data.text (supports "~counter~" placeholder to inject key count)',
    },
    errorText: {
      control: 'text',
      description: 'data.errorText (rendered on missing root / invalid structure)',
    },
    style: {
      control: 'object',
      description: 'data.style (applied to outer <span>)',
    },

    // provider knobs
    isLoading: {
      control: 'boolean',
      description: 'useMultiQuery.isLoading (simulated)',
    },
    isError: {
      control: 'boolean',
      description: 'useMultiQuery.isError (simulated)',
    },
    errors: {
      control: 'object',
      description: 'useMultiQuery.errors (array of { message })',
    },
    multiQueryData: {
      control: 'object',
      description: 'mock data fed into SmartProvider -> useMultiQuery',
    },
    partsOfUrl: {
      control: 'object',
      description: 'mocked partsOfUrl.partsOfUrl array',
    },
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
      description: 'Mock UI Theme context (not used by KeyCounter directly)',
    },
  },

  render: args => {
    const data: TInner = {
      id: args.id,
      reqIndex: args.reqIndex,
      jsonPathToObj: args.jsonPathToObj,
      text: args.text,
      errorText: args.errorText,
      style: args.style,
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
            <KeyCounter data={data}>
              <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>(children slot)</span>
            </KeyCounter>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={220}
          value={yaml.stringify({
            type: 'KeyCounter',
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
    id: 'example-key-counter',
    reqIndex: '0',
    jsonPathToObj: '.data.metadata', // will be used as `$${jsonPathToObj}` => `$.data.metadata`
    text: 'Metadata keys: ~counter~',
    errorText: 'No metadata found',
    style: { fontSize: 16, fontWeight: 500 },

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        data: {
          metadata: {
            name: 'example-resource',
            namespace: 'default',
            labels: { app: 'demo' },
          },
        },
      },
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const ErrorMissingRoot: Story = {
  args: {
    ...Default.args,
    id: 'example-key-counter-missing-root',
    reqIndex: '99', // no req99 in multiQueryData
    errorText: 'Root object not found',
  },
}

export const CustomStyle: Story = {
  args: {
    ...Default.args,
    id: 'example-key-counter-custom-style',
    style: { fontSize: 24, color: '#1677ff', fontWeight: 600 },
    text: 'Total metadata keys: ~counter~',
  },
}
