import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { LabelsToSearchParams } from './LabelsToSearchParams'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['LabelsToSearchParams']

type TProviderArgs = {
  isLoading: boolean
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/LabelsToSearchParams',
  component: LabelsToSearchParams as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    reqIndex: {
      control: 'text',
      description: 'data.reqIndex (string; used as `multiQueryData["req" + reqIndex]`, e.g. "0" -> req0)',
    },
    jsonPathToLabels: {
      control: 'text',
      description: 'data.jsonPathToLabels (used as `$${jsonPathToLabels}` with jsonpath)',
    },
    linkPrefix: {
      control: 'text',
      description: 'data.linkPrefix (URL prefix; labels are encoded and appended as query part)',
    },
    textLink: {
      control: 'text',
      description: 'data.textLink (link text override; if omitted, labels or truncated labels are shown)',
    },
    errorText: {
      control: 'text',
      description: 'data.errorText (shown as plain text when labels structure is invalid / missing)',
    },
    maxTextLength: {
      control: 'number',
      description: 'data.maxTextLength (truncate rendered text; full labels in Popover)',
    },
    renderLabelsAsRows: {
      control: 'boolean',
      description: 'data.renderLabelsAsRows (render labels as multiline `key=value,` rows; disables Popover)',
    },

    // Typography.Link props (from LinkProps, minus id/children/href)
    underline: {
      control: 'boolean',
      description: 'Typography.Link underline',
    },
    target: {
      control: 'text',
      description: 'Typography.Link target (e.g. "_blank")',
    },

    // provider knobs
    isLoading: {
      control: 'boolean',
      description: 'useMultiQuery.isLoading (simulated)',
    },
    multiQueryData: {
      control: 'object',
      description: 'mock data fed into MultiQueryMockProvider',
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
    const { underline, target, ...rest } = args

    const data: TInner = {
      id: rest.id,
      reqIndex: rest.reqIndex,
      jsonPathToLabels: rest.jsonPathToLabels,
      linkPrefix: rest.linkPrefix,
      textLink: rest.textLink,
      errorText: rest.errorText,
      maxTextLength: rest.maxTextLength,
      renderLabelsAsRows: rest.renderLabelsAsRows,
      underline,
      target,
    }

    return (
      <>
        <SmartProvider
          multiQueryValue={{ data: args.multiQueryData, isLoading: args.isLoading }}
          partsOfUrl={args.partsOfUrl}
          theme={args.theme}
        >
          <div style={{ padding: 16 }}>
            <LabelsToSearchParams data={data}>
              <span style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>(children slot)</span>
            </LabelsToSearchParams>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={220}
          value={yaml.stringify({
            type: 'LabelsToSearchParams',
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
    id: 'example-labels-to-search-params',
    reqIndex: '0',
    jsonPathToLabels: '.data.metadata.labels', // -> "$.data.metadata.labels"
    linkPrefix: '/workloads?labels=',
    textLink: undefined,
    errorText: 'Unable to build labels filter',
    maxTextLength: 40,
    renderLabelsAsRows: false,
    underline: true,
    target: '_blank',

    // providers
    isLoading: false,
    multiQueryData: {
      req0: {
        data: {
          metadata: {
            labels: {
              'app.kubernetes.io/name': 'demo-app',
              'app.kubernetes.io/component': 'backend',
              environment: 'production',
            },
          },
        },
      },
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const WithTextLink: Story = {
  args: {
    ...Default.args,
    id: 'example-labels-to-search-params-textlink',
    textLink: 'Filter by labels',
    maxTextLength: 20,
  },
}

export const TooLongTextTruncated: Story = {
  args: {
    ...Default.args,
    id: 'example-labels-to-search-params-truncated',
    textLink: undefined,
    maxTextLength: 10,
  },
}

export const InvalidStructureFallback: Story = {
  args: {
    ...Default.args,
    id: 'example-labels-to-search-params-invalid',
    // labels path points to non-object / non-parseable shape
    jsonPathToLabels: '.data.metadata.notLabels',
    multiQueryData: {
      req0: {
        data: {
          metadata: {
            notLabels: 'I am not a labels object',
          },
        },
      },
    },
  },
}

export const MissingLabelsFallback: Story = {
  args: {
    ...Default.args,
    id: 'example-labels-to-search-params-missing',
    jsonPathToLabels: '.data.metadata.labels',
    multiQueryData: {
      req0: {
        data: {
          metadata: {},
        },
      },
    },
    errorText: 'Labels are unavailable',
  },
}

export const RenderLabelsAsRows: Story = {
  args: {
    ...Default.args,
    id: 'example-labels-to-search-params-rows',
    renderLabelsAsRows: true,
    textLink: 'This is ignored when renderLabelsAsRows is true',
    maxTextLength: 12,
  },
}

export const LoadingMultiQuery: Story = {
  args: {
    ...Default.args,
    id: 'example-labels-to-search-params-loading',
    isLoading: true,
  },
}
