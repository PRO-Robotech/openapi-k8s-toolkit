import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { AggregatedCounterCard } from './AggregatedCounterCard'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['AggregatedCounterCard']

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
  title: 'Factory/AggregatedCounterCard',
  component: AggregatedCounterCard as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    text: {
      control: 'text',
      description: 'data.text (supports parseAll placeholders like {0}, {reqs[0][\'data\',\'name\']})',
    },
    iconBase64Encoded: {
      control: 'text',
      description: 'data.iconBase64Encoded (base64 SVG; supports {token.colorText} placeholder in SVG)',
    },
    counter: {
      control: 'object',
      description:
        'data.counter ({ type: "item" | "key", props: { reqIndex, jsonPathToArray/jsonPathToObj, errorText, style } })',
    },
    activeType: {
      control: 'object',
      description:
        'data.activeType (optional; { type: "labels" | "annotations" | "taints" | "tolerations" | "table", props: ... })',
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
      description: 'Mock UI Theme context',
    },
  },

  render: args => {
    const data: TInner = {
      id: args.id,
      text: args.text,
      iconBase64Encoded: args.iconBase64Encoded,
      counter: args.counter,
      activeType: args.activeType,
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
            <AggregatedCounterCard data={data}>
              <div style={{ fontSize: 12, color: '#999' }}>(children slot content)</div>
            </AggregatedCounterCard>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'AggregatedCounterCard',
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
    id: 'example-aggregated-counter-card',
    text: 'Pods in {0}',
    iconBase64Encoded:
      'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJ7dG9rZW4uY29sb3JUZXh0fSI+PHBhdGggZD0iTTMgM2gxOHY0SDNWM3ptMCA2aDE4djRIM1Y5em0wIDZoMTh2NEgzdi00eiIvPjwvc3ZnPgo=',
    counter: {
      type: 'item',
      props: {
        reqIndex: '0',
        jsonPathToArray: '.data.items',
        errorText: 'No pods found',
        style: { color: '#999' },
      },
    },
    activeType: {
      type: 'labels',
      props: {
        reqIndex: '0',
        jsonPathToLabels: '.data.metadata.labels',
        modalTitle: 'Edit labels',
        modalDescriptionText: 'Manage labels for this resource.',
        inputLabel: 'Labels',
        endpoint: '/api/example/labels',
        pathToValue: '/metadata/labels',
        editModalWidth: 720,
        paddingContainerEnd: '16px',
      },
    },

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        data: {
          items: [{ name: 'pod-a' }, { name: 'pod-b' }, { name: 'pod-c' }],
          metadata: {
            labels: {
              app: 'demo',
              tier: 'frontend',
            },
          },
        },
      },
    },
    partsOfUrl: ['default'],
    theme: 'light',
  },
}

export const KeyCounter: Story = {
  args: {
    ...Default.args,
    id: 'example-aggregated-counter-card-keys',
    text: 'Metadata keys',
    counter: {
      type: 'key',
      props: {
        reqIndex: '0',
        jsonPathToObj: '.data.metadata',
        errorText: 'No metadata found',
        style: { color: '#999' },
      },
    },
    activeType: undefined,
  },
}

export const WithTaintsActiveType: Story = {
  args: {
    ...Default.args,
    id: 'example-aggregated-counter-card-taints',
    text: 'Node taints',
    counter: {
      type: 'item',
      props: {
        reqIndex: '1',
        jsonPathToArray: '.spec.taints',
        errorText: 'No taints found',
        style: { color: '#999' },
      },
    },
    activeType: {
      type: 'taints',
      props: {
        reqIndex: '1',
        jsonPathToArray: '.spec.taints',
        notificationSuccessMessage: 'Taints updated',
        notificationSuccessMessageDescription: 'Taints were successfully patched',
        modalTitle: 'Edit taints',
        modalDescriptionText: 'Add, edit or remove taints for this node.',
        inputLabel: 'Taints',
        endpoint: '/api/mock/taints',
        pathToValue: '.spec.taints',
        editModalWidth: 720,
        cols: [6, 6, 6, 6],
      },
    },
    multiQueryData: {
      req0: (Default.args as TArgs).multiQueryData?.req0,
      req1: {
        spec: {
          taints: [
            {
              key: 'dedicated',
              value: 'gpu',
              effect: 'NoSchedule',
            },
            {
              key: 'node-role.kubernetes.io/control-plane',
              value: '',
              effect: 'NoSchedule',
            },
          ],
        },
      },
    },
  },
}

export const MissingRoot: Story = {
  args: {
    ...Default.args,
    id: 'example-aggregated-counter-card-missing-root',
    counter: {
      type: 'item',
      props: {
        reqIndex: '99',
        jsonPathToArray: '.data.items',
        errorText: 'No data for this counter',
        style: { color: '#c00' },
      },
    },
  },
}
