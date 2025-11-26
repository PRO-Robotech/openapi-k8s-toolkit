// src/components/organisms/DynamicComponents/molecules/ItemCounter/ItemCounter.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { ItemCounter } from './ItemCounter'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['ItemCounter']

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
  title: 'Factory/ItemCounter',
  component: ItemCounter as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    reqIndex: {
      control: 'text',
      description: 'data.reqIndex (used as multiQueryData[`req${reqIndex}`])',
    },
    jsonPathToArray: {
      control: 'text',
      description: 'data.jsonPathToArray (jsonpath appended to `$` and queried via jsonpath)',
    },
    text: {
      control: 'text',
      description: 'data.text (supports "~counter~" placeholder to inject array length)',
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
      description: 'Mock UI Theme context (not used by ItemCounter directly)',
    },
  },

  render: args => {
    const data: TInner = {
      id: args.id,
      reqIndex: args.reqIndex,
      jsonPathToArray: args.jsonPathToArray,
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
            <ItemCounter data={data}>
              <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>(children slot)</span>
            </ItemCounter>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={220}
          value={yaml.stringify({
            type: 'ItemCounter',
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
    id: 'example-item-counter',
    reqIndex: '0',
    jsonPathToArray: '.data.items', // used as `$${jsonPathToArray}` => `$.data.items`
    text: 'Items count: ~counter~',
    errorText: 'No items found',
    style: { fontSize: 16, fontWeight: 500 },

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        data: {
          items: [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }],
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
    id: 'example-item-counter-missing-root',
    reqIndex: '99', // no req99 in multiQueryData
    errorText: 'Root array not found',
  },
}

export const CustomStyle: Story = {
  args: {
    ...Default.args,
    id: 'example-item-counter-custom-style',
    style: { fontSize: 24, color: '#1677ff', fontWeight: 600 },
    text: 'We have ~counter~ items 🔍',
  },
}
