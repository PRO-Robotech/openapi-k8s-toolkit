import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { ArrayOfObjectsToKeyValues } from './ArrayOfObjectsToKeyValues'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { MultiQueryMockProvider } from '../../../../../../.storybook/mocks/hybridDataProvider'

type TInner = TDynamicComponentsAppTypeMap['ArrayOfObjectsToKeyValues']

type TProviderArgs = {
  isLoading: boolean
  isError: boolean
  errors: { message: string }[]
  multiQueryData: Record<string, unknown> | null
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/ArrayOfObjectsToKeyValues',
  component: ArrayOfObjectsToKeyValues as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    reqIndex: {
      control: 'text',
      description: 'data.reqIndex (string; used as `multiQueryData["req" + reqIndex]`, e.g. "0" -> req0)',
    },
    jsonPathToArray: {
      control: 'text',
      description: 'data.jsonPathToArray (used as `$${jsonPathToArray}` with jsonpath)',
    },
    keyFieldName: {
      control: 'text',
      description: 'data.keyFieldName (field name taken as key from each object)',
    },
    valueFieldName: {
      control: 'text',
      description: 'data.valueFieldName (field name taken as value from each object)',
    },
    separator: {
      control: 'text',
      description: 'data.separator (defaults to ":")',
    },
    containerStyle: { control: 'object', description: 'data.containerStyle' },
    rowStyle: { control: 'object', description: 'data.rowStyle' },
    keyFieldStyle: { control: 'object', description: 'data.keyFieldStyle' },
    valueFieldStyle: { control: 'object', description: 'data.valueFieldStyle' },

    // provider knobs
    isLoading: { control: 'boolean', description: 'useMultiQuery.isLoading' },
    isError: { control: 'boolean', description: 'useMultiQuery.isError' },
    errors: { control: 'object', description: 'useMultiQuery.errors' },
    multiQueryData: {
      control: 'object',
      description: 'mock data fed into MultiQueryMockProvider',
    },
  },

  render: args => {
    const data: TDynamicComponentsAppTypeMap['ArrayOfObjectsToKeyValues'] = {
      id: args.id,
      reqIndex: args.reqIndex,
      jsonPathToArray: args.jsonPathToArray,
      keyFieldName: args.keyFieldName,
      valueFieldName: args.valueFieldName,
      separator: args.separator,
      containerStyle: args.containerStyle,
      rowStyle: args.rowStyle,
      keyFieldStyle: args.keyFieldStyle,
      valueFieldStyle: args.valueFieldStyle,
    }

    return (
      <>
        <MultiQueryMockProvider
          value={{
            isLoading: args.isLoading,
            isError: args.isError,
            errors: args.errors,
            data: args.multiQueryData,
          }}
        >
          <div style={{ padding: 16 }}>
            <ArrayOfObjectsToKeyValues data={data}>
              <div style={{ fontSize: 12, color: '#999' }}>(children slot content)</div>
            </ArrayOfObjectsToKeyValues>
          </div>
        </MultiQueryMockProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={240}
          value={yaml.stringify({
            type: 'ArrayOfObjectsToKeyValues',
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
    id: 'example-array-of-objects',
    reqIndex: '0',
    jsonPathToArray: '.data.items', // -> jsonpath: "$.data.items"
    keyFieldName: 'name',
    valueFieldName: 'value',
    separator: ':',
    containerStyle: {
      padding: 12,
      border: '1px solid #eee',
      borderRadius: 4,
    },
    rowStyle: { marginBottom: 4 },
    keyFieldStyle: { fontWeight: 600, marginRight: 4 },
    valueFieldStyle: {},

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        data: {
          items: [
            { name: 'foo', value: 'bar' },
            { name: 'answer', value: 42 },
            { name: 'enabled', value: true },
          ],
        },
      },
    },
  },
}

/**
 * Missing root for reqIndex/jsonPathToArray -> component shows "No root for json path".
 */
export const MissingRoot: Story = {
  args: {
    ...Default.args,
    multiQueryData: {
      // no req0 -> jsonRoot === undefined
    },
  },
}

/**
 * Simulated loading state from useMultiQuery.
 */
export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
}

/**
 * Simulated error state from useMultiQuery (before jsonPath is even used).
 */
export const ProviderError: Story = {
  args: {
    ...Default.args,
    isError: true,
    errors: [{ message: 'Multi query failed' }],
  },
}

/**
 * jsonPath points to something that parseArrayOfAny can't parse as an array of objects.
 * This should hit the "Not a valid data structure" or errorArrayOfObjects branch.
 */
export const InvalidStructure: Story = {
  args: {
    ...Default.args,
    jsonPathToArray: '.data.notArray',
    multiQueryData: {
      req0: {
        data: {
          notArray: { foo: 'bar' }, // not an array
        },
      },
    },
  },
}
