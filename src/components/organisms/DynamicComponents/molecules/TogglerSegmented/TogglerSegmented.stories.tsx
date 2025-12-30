import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { TogglerSegmented } from './TogglerSegmented'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['TogglerSegmented']

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
  title: 'Factory/TogglerSegmented',
  component: TogglerSegmented as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    reqIndex: {
      control: 'text',
      description: 'data.reqIndex – which multiQuery request to read, e.g. "0" for req0',
    },
    jsonPathToValue: {
      control: 'text',
      description: 'data.jsonPathToValue – JSONPath from root of req{reqIndex} to value used for Segmented state',
    },
    notificationSuccessMessage: {
      control: 'text',
      description: 'data.notificationSuccessMessage – title for success notification (parseAll applied)',
    },
    notificationSuccessMessageDescription: {
      control: 'text',
      description: 'data.notificationSuccessMessageDescription – body for success notification (parseAll applied)',
    },
    notificationErrorMessage: {
      control: 'text',
      description: 'data.notificationErrorMessage – title for error notification (parseAll applied)',
    },
    notificationErrorMessageDescription: {
      control: 'text',
      description: 'data.notificationErrorMessageDescription – body for error notification (parseAll applied)',
    },
    containerStyle: {
      control: 'object',
      description: 'data.containerStyle – wrapper div style around Segmented + children',
    },
    endpoint: {
      control: 'text',
      description: 'data.endpoint – API endpoint used by patchEntryWithReplaceOp',
    },
    pathToValue: {
      control: 'text',
      description: 'data.pathToValue – path used by backend to locate value (passed to patchEntryWithReplaceOp)',
    },
    possibleValues: {
      control: 'object',
      description:
        'data.possibleValues – passed directly to antd Segmented.options (e.g. ["Low","Medium","High"] or option objects)',
    },
    valuesMap: {
      control: 'object',
      description:
        'data.valuesMap – optional mapping between raw value and renderedValue { value, renderedValue }[] (used both for reading & sending)',
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
      description: 'useMultiQuery.errors (simulated)',
    },
    multiQueryData: {
      control: 'object',
      description: 'mock multiQuery data (object with req{index} keys)',
    },
    partsOfUrl: {
      control: 'object',
      description: 'mocked partsOfUrl.partsOfUrl array',
    },
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
      description: 'Mock UI Theme context',
    },
  },

  render: args => {
    const data: TInner = {
      id: args.id,
      reqIndex: args.reqIndex,
      jsonPathToValue: args.jsonPathToValue,
      notificationSuccessMessage: args.notificationSuccessMessage,
      notificationSuccessMessageDescription: args.notificationSuccessMessageDescription,
      notificationErrorMessage: args.notificationErrorMessage,
      notificationErrorMessageDescription: args.notificationErrorMessageDescription,
      containerStyle: args.containerStyle,
      endpoint: args.endpoint,
      pathToValue: args.pathToValue,
      possibleValues: args.possibleValues,
      valuesMap: args.valuesMap,
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
            <TogglerSegmented data={data}>
              <div style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>(children slot content)</div>
            </TogglerSegmented>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'TogglerSegmented',
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
    id: 'example-toggler-segmented',
    reqIndex: '0',
    jsonPathToValue: '.spec.mode',
    notificationSuccessMessage: 'Mode updated',
    notificationSuccessMessageDescription: 'The mode has been successfully changed.',
    notificationErrorMessage: 'Failed to update mode',
    notificationErrorMessageDescription: 'Something went wrong while changing the mode.',
    containerStyle: { display: 'inline-flex', alignItems: 'center', gap: 8 },
    endpoint: '/api/mock/resource-mode',
    pathToValue: '/spec/mode',
    possibleValues: ['Low', 'Medium', 'High'],
    valuesMap: undefined,

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        spec: {
          mode: 'Medium',
        },
      },
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const WithValuesMap: Story = {
  args: {
    ...Default.args,
    id: 'example-toggler-segmented-map',
    // now we store "low|med|high" in the backend, but show nice labels
    possibleValues: ['Low', 'Medium', 'High'],
    valuesMap: [
      { value: 'low', renderedValue: 'Low' },
      { value: 'med', renderedValue: 'Medium' },
      { value: 'high', renderedValue: 'High' },
    ],
    multiQueryData: {
      req0: {
        spec: {
          mode: 'med', // will map to renderedValue "Medium"
        },
      },
    },
  },
}

export const LoadingMultiQuery: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
}

export const MultiQueryError: Story = {
  args: {
    ...Default.args,
    isError: true,
    errors: [{ message: 'Simulated multiQuery error' }],
  },
}

export const NoRootForJsonPath: Story = {
  args: {
    ...Default.args,
    reqIndex: '42',
    multiQueryData: {
      // no req42 -> triggers "No root for json path"
    },
  },
}
