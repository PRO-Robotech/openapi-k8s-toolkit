// src/components/organisms/DynamicComponents/molecules/Toggler/Toggler.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { Toggler } from './Toggler'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['Toggler']

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
  title: 'Factory/Toggler',
  component: Toggler as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    reqIndex: {
      control: 'text',
      description: 'data.reqIndex – which multiQuery request to read, e.g. "0" for req0',
    },
    jsonPathToValue: {
      control: 'text',
      description: 'data.jsonPathToValue – JSONPath from root of req{reqIndex} to value used for toggle state',
    },
    criteria: {
      control: 'object',
      description:
        'data.criteria – defines when toggle is considered ON/OFF based on current value (type & operator logic)',
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
      description: 'data.containerStyle – wrapper div style around Switch + children',
    },
    endpoint: {
      control: 'text',
      description: 'data.endpoint – API endpoint used by patchEntryWithReplaceOp / patchEntryWithDeleteOp',
    },
    pathToValue: {
      control: 'text',
      description: 'data.pathToValue – path used by backend to locate value (passed to patchEntry* helpers)',
    },
    valueToSubmit: {
      control: 'object',
      description:
        'data.valueToSubmit – on/off payload and optional deletion flag ({ onValue, offValue?, toRemoveWhenOff? })',
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
      criteria: args.criteria,
      notificationSuccessMessage: args.notificationSuccessMessage,
      notificationSuccessMessageDescription: args.notificationSuccessMessageDescription,
      notificationErrorMessage: args.notificationErrorMessage,
      notificationErrorMessageDescription: args.notificationErrorMessageDescription,
      containerStyle: args.containerStyle,
      endpoint: args.endpoint,
      pathToValue: args.pathToValue,
      valueToSubmit: args.valueToSubmit,
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
            <Toggler data={data}>
              <div style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>(children slot content)</div>
            </Toggler>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'Toggler',
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
    id: 'example-toggler',
    reqIndex: '0',
    jsonPathToValue: '.spec.featureEnabled',
    criteria: {
      type: 'forSuccess',
      operator: 'equals',
      valueToCompare: 'true',
    },
    notificationSuccessMessage: 'Feature flag updated',
    notificationSuccessMessageDescription: 'The feature has been successfully toggled.',
    notificationErrorMessage: 'Failed to update feature',
    notificationErrorMessageDescription: 'Something went wrong while toggling the feature.',
    containerStyle: { display: 'inline-flex', alignItems: 'center', gap: 8 },
    endpoint: '/api/mock/feature-flag',
    pathToValue: '/spec/featureEnabled',
    valueToSubmit: {
      onValue: true,
      offValue: false,
      toRemoveWhenOff: false,
    },

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        spec: {
          featureEnabled: true,
        },
      },
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const ExistsCriteria: Story = {
  args: {
    ...Default.args,
    id: 'example-toggler-exists',
    jsonPathToValue: '.metadata.annotations.featureFlag',
    criteria: {
      type: 'forSuccess',
      operator: 'exists',
    },
    multiQueryData: {
      req0: {
        metadata: {
          annotations: {
            featureFlag: 'on',
          },
        },
      },
    },
    endpoint: '/api/mock/feature-annotation',
    pathToValue: '/metadata/annotations/featureFlag',
    valueToSubmit: {
      onValue: 'on',
      toRemoveWhenOff: true,
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
