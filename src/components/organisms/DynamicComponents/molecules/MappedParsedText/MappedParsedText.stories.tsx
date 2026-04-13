import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { MappedParsedText } from './MappedParsedText'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['MappedParsedText']

type TProviderArgs = {
  isLoading: boolean
  isError: boolean
  errors: { message: string }[]
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/MappedParsedText',
  component: MappedParsedText as any,
  argTypes: {
    id: { control: 'text', description: 'data.id' },
    value: {
      control: 'text',
      description: 'data.value - template parsed via parseAll, including reqsJsonPath placeholders',
    },
    valueMap: {
      control: 'object',
      description: 'data.valueMap - object map of parsed value to rendered label',
    },
    style: { control: 'object', description: 'data.style' },

    // provider knobs
    isLoading: { control: 'boolean' },
    isError: { control: 'boolean' },
    errors: { control: 'object' },
    multiQueryData: { control: 'object' },
    partsOfUrl: { control: 'object' },
  },

  render: args => (
    <>
      <SmartProvider
        multiQueryValue={{
          isLoading: args.isLoading,
          isError: args.isError,
          errors: args.errors,
          data: args.multiQueryData,
        }}
        partsOfUrl={args.partsOfUrl}
      >
        <div style={{ padding: 16 }}>
          <MappedParsedText
            data={{
              id: args.id,
              value: args.value,
              valueMap: args.valueMap,
              style: args.style,
            }}
          />
        </div>
      </SmartProvider>

      <Editor
        defaultLanguage="yaml"
        width="100%"
        height={180}
        value={yaml.stringify({
          type: 'mappedParsedText',
          data: {
            id: args.id,
            value: args.value,
            valueMap: args.valueMap,
            style: args.style,
          },
        })}
        theme={'vs-dark'}
        options={{
          theme: 'vs-dark',
          readOnly: true,
        }}
      />
    </>
  ),

  parameters: {
    controls: { expanded: true },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const MappedFromJsonPath: Story = {
  args: {
    id: 'example-mapped-parsed-text',
    value: "{reqsJsonPath[0]['.data.spec.status']['-']}",
    valueMap: {
      running: 'Running',
      stopped: 'Stopped',
      error: 'Error',
    },
    style: { fontWeight: 600 },

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        data: {
          spec: {
            status: 'running',
          },
        },
      },
    },
    partsOfUrl: [],
  },
}

export const FallbackToRawValue: Story = {
  args: {
    ...MappedFromJsonPath.args,
    id: 'example-mapped-parsed-text-fallback',
    multiQueryData: {
      req0: {
        data: {
          spec: {
            status: 'unknown-state',
          },
        },
      },
    },
  },
}
