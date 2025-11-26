// src/components/organisms/DynamicComponents/molecules/StatusText/StatusText.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { StatusText } from './StatusText'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['StatusText']

type TProviderArgs = {
  isLoading: boolean
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/StatusText',
  component: StatusText as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },

    values: {
      control: 'object',
      description: 'data.values – array of templates resolved via parseAll (usually reqsJsonPath expressions)',
    },
    criteriaSuccess: {
      options: ['equals', 'notEquals'],
      control: { type: 'radio' },
      description: 'data.criteriaSuccess – how to compare values with valueToCompareSuccess',
    },
    criteriaError: {
      options: ['equals', 'notEquals'],
      control: { type: 'radio' },
      description: 'data.criteriaError – how to compare values with valueToCompareError',
    },
    stategySuccess: {
      options: ['some', 'every'],
      control: { type: 'radio' },
      description: 'data.stategySuccess – aggregation strategy for success (default: every)',
    },
    strategyError: {
      options: ['some', 'every'],
      control: { type: 'radio' },
      description: 'data.strategyError – aggregation strategy for error (default: every)',
    },
    valueToCompareSuccess: {
      control: 'object',
      description: 'data.valueToCompareSuccess – array of values compared according to criteriaSuccess',
    },
    valueToCompareError: {
      control: 'object',
      description: 'data.valueToCompareError – array of values compared according to criteriaError',
    },
    successText: {
      control: 'text',
      description: 'data.successText – shown when success condition matches',
    },
    errorText: {
      control: 'text',
      description: 'data.errorText – shown when error condition matches',
    },
    fallbackText: {
      control: 'text',
      description: 'data.fallbackText – shown when neither success nor error condition matches',
    },

    // Typography.Text props (subset)
    strong: {
      control: 'boolean',
      description: 'Typography.Text strong',
    },
    underline: {
      control: 'boolean',
      description: 'Typography.Text underline',
    },

    // provider knobs
    isLoading: {
      control: 'boolean',
      description: 'useMultiQuery.isLoading (simulated)',
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
      values: args.values,
      criteriaSuccess: args.criteriaSuccess,
      criteriaError: args.criteriaError,
      stategySuccess: args.stategySuccess,
      strategyError: args.strategyError,
      valueToCompareSuccess: args.valueToCompareSuccess,
      valueToCompareError: args.valueToCompareError,
      successText: args.successText,
      errorText: args.errorText,
      fallbackText: args.fallbackText,
      strong: args.strong,
      underline: args.underline,
    }

    return (
      <>
        <SmartProvider
          multiQueryValue={{ data: args.multiQueryData, isLoading: args.isLoading }}
          partsOfUrl={args.partsOfUrl}
          theme={args.theme}
        >
          <div style={{ padding: 16 }}>
            <StatusText data={data}>
              <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>(children slot)</span>
            </StatusText>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'StatusText',
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

export const DefaultSuccess: Story = {
  args: {
    id: 'example-status-text-success',
    values: ["{reqsJsonPath[0]['.data.phase']['-']}"],
    criteriaSuccess: 'equals',
    criteriaError: 'equals',
    stategySuccess: 'every',
    strategyError: 'every',
    valueToCompareSuccess: ['Running'],
    valueToCompareError: ['Failed'],
    successText: 'Pod is healthy (phase: Running)',
    errorText: 'Pod is failing',
    fallbackText: 'Pod is in a transitional state',
    strong: true,
    underline: false,

    // providers
    isLoading: false,
    multiQueryData: {
      req0: {
        data: {
          phase: 'Running',
        },
      },
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const ErrorState: Story = {
  args: {
    ...DefaultSuccess.args,
    id: 'example-status-text-error',
    valueToCompareSuccess: ['Running'],
    valueToCompareError: ['Failed'],
    multiQueryData: {
      req0: {
        data: {
          phase: 'Failed',
        },
      },
    },
  },
}

export const FallbackState: Story = {
  args: {
    ...DefaultSuccess.args,
    id: 'example-status-text-fallback',
    multiQueryData: {
      req0: {
        data: {
          phase: 'Pending',
        },
      },
    },
  },
}

export const LoadingMultiQuery: Story = {
  args: {
    ...(DefaultSuccess.args as TArgs),
    id: 'example-status-text-loading',
    isLoading: true,
  },
}
