// src/components/ParsedText/ParsedText.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { ParsedText } from './ParsedText'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['parsedText']

type TProviderArgs = {
  isLoading: boolean
  isError: boolean
  errors: { message: string }[]
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/ParsedText',
  component: ParsedText as any,
  // Expose *inner* fields as top-level controls
  argTypes: {
    id: { control: 'text', description: 'data.id' },
    text: { control: 'text', description: 'data.text' },
    formatter: {
      control: { type: 'select' },
      options: [undefined, 'timestamp'],
      description: "data.formatter ('timestamp' only)",
    },
    style: { control: 'object', description: 'data.style' },

    // provider knobs
    isLoading: { control: 'boolean' },
    isError: { control: 'boolean' },
    errors: { control: 'object' },
    multiQueryData: { control: 'object' },
    partsOfUrl: { control: 'object' },
  },

  // Map flat args -> component's { data } prop
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
          <ParsedText
            data={{
              id: args.id,
              text: args.text,
              formatter: args.formatter,
              style: args.style,
            }}
          />
        </div>
      </SmartProvider>

      <Editor
        defaultLanguage="yaml"
        width="100%"
        height={150}
        value={yaml.stringify({
          type: 'ParsedText',
          data: { id: args.id, text: args.text, formatter: args.formatter, style: args.style },
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

export const Default: Story = {
  args: {
    id: 'example-parsed-text',
    text: 'Hello, Storybook!',
    formatter: undefined, // or 'timestamp'
    style: { fontSize: 24 },

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: null,
    partsOfUrl: [],
  },
}

export const WithUrlParts: Story = {
  args: {
    ...Default.args,
    text: 'User: {0}, Section: {1}',
    partsOfUrl: ['alice', 'settings'],
  },
}

export const WithJsonPath: Story = {
  args: {
    ...Default.args,
    text: "User: {reqsJsonPath[0]['.data.block.user']['-']}. Do not exist: {reqsJsonPath[0]['.foo']['fallback']}",
    multiQueryData: { req0: { data: { block: { user: 'alice', section: 'settings' } } } },
  },
}

export const WithFormatter: Story = {
  args: {
    ...Default.args,
    text: '2025-08-13T10:00:00Z',
    formatter: 'timestamp',
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
}

export const Error: Story = {
  args: {
    ...Default.args,
    isError: true,
    errors: [{ message: 'Something went wrong.' }],
  },
}
