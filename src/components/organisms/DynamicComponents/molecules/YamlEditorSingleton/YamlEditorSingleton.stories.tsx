// src/components/organisms/DynamicComponents/molecules/YamlEditorSingleton/YamlEditorSingleton.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { YamlEditorSingleton } from './YamlEditorSingleton'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['YamlEditorSingleton']

type TProviderArgs = {
  isLoading: boolean
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/YamlEditorSingleton',
  component: YamlEditorSingleton as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    cluster: {
      control: 'text',
      description: 'data.cluster (can contain placeholders resolved via parseAll)',
    },
    isNameSpaced: {
      control: 'boolean',
      description: 'data.isNameSpaced (namespace-scoped resource)',
    },
    type: {
      options: ['builtin', 'apis'],
      control: { type: 'radio' },
      description: 'data.type ("builtin" -> api/v1, "apis" -> apiGroup/apiVersion)',
    },
    apiGroup: {
      control: 'text',
      description: 'data.apiGroup (optional; used when type === "apis")',
    },
    apiVersion: {
      control: 'text',
      description: 'data.apiVersion (optional; used when type === "apis")',
    },
    plural: {
      control: 'text',
      description: 'data.plural (resource plural name, e.g. "pods")',
    },
    forcedKind: {
      control: 'text',
      description: 'data.forcedKind (forces kind in prefill schema)',
    },
    prefillValuesRequestIndex: {
      control: 'number',
      description: 'data.prefillValuesRequestIndex (used as multiQueryData[`req${index}`])',
    },
    pathToData: {
      control: 'object',
      description: 'data.pathToData (optional; jsonpath string or string[] path used by getDataByPath)',
    },
    substractHeight: {
      control: 'number',
      description: 'data.substractHeight (pixels subtracted from window.innerHeight to compute editor height)',
    },
    readOnly: {
      control: 'boolean',
      description: 'data.readOnly (passed through to underlying Editor via {...props})',
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
    const data: TInner = {
      id: args.id,
      cluster: args.cluster,
      isNameSpaced: args.isNameSpaced,
      type: args.type,
      apiGroup: args.apiGroup,
      apiVersion: args.apiVersion,
      plural: args.plural,
      forcedKind: args.forcedKind,
      prefillValuesRequestIndex: args.prefillValuesRequestIndex,
      pathToData: args.pathToData,
      substractHeight: args.substractHeight,
      readOnly: args.readOnly,
    }

    return (
      <>
        <SmartProvider
          multiQueryValue={{ data: args.multiQueryData, isLoading: args.isLoading }}
          partsOfUrl={args.partsOfUrl}
          theme={args.theme}
        >
          <div style={{ padding: 16, height: '100vh', boxSizing: 'border-box' }}>
            <YamlEditorSingleton data={data}>
              <div style={{ fontSize: 12, color: '#999' }}>(children slot content)</div>
            </YamlEditorSingleton>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'YamlEditorSingleton',
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
    id: 'example-yaml-editor-singleton',
    cluster: 'my-cluster',
    isNameSpaced: true,
    type: 'builtin',
    apiGroup: undefined,
    apiVersion: undefined,
    plural: 'pods',
    forcedKind: 'Pod',
    prefillValuesRequestIndex: 0,
    pathToData: undefined,
    substractHeight: 340,
    readOnly: false,

    // providers
    isLoading: false,
    multiQueryData: {
      req0: {
        // whatever shape your prefillValues look like; this is just a simple example
        metadata: {
          name: 'example-pod',
          namespace: 'default',
          labels: { app: 'demo' },
        },
        spec: {
          containers: [
            {
              name: 'demo',
              image: 'nginx:1.27',
            },
          ],
        },
      },
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const ApisCRD: Story = {
  args: {
    ...Default.args,
    id: 'example-yaml-editor-crd',
    type: 'apis',
    apiGroup: 'example.com',
    apiVersion: 'v1alpha1',
    plural: 'widgets',
    forcedKind: 'Widget',
  },
}

export const WithPathToData: Story = {
  args: {
    ...Default.args,
    id: 'example-yaml-editor-path',
    prefillValuesRequestIndex: 0,
    // assume the relevant part is nested under `.result.resource`
    pathToData: '.result.resource',
    multiQueryData: {
      req0: {
        result: {
          resource: {
            metadata: {
              name: 'nested-resource',
              namespace: 'kube-system',
            },
            spec: {
              replicas: 3,
            },
          },
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

export const ReadOnly: Story = {
  args: {
    ...Default.args,
    readOnly: true,
  },
}
