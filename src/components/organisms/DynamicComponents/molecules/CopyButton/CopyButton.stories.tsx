import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { CopyButton } from './CopyButton'
import { TDynamicComponentsAppTypeMap } from '../../types'

import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['CopyButton']

type TProviderArgs = {
  isLoading: boolean
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/CopyButton',
  component: CopyButton as any,
  argTypes: {
    id: { control: 'text', description: 'data.id – unique identifier' },
    copyText: {
      control: 'text',
      description: 'data.copyText – text to copy, supports templating ({0}, {reqsJsonPath[...][...][fallback]}, etc.)',
    },
    successMessage: {
      control: 'text',
      description: 'data.successMessage – message shown on successful copy (default: "Copied!")',
    },
    errorMessage: {
      control: 'text',
      description: 'data.errorMessage – message shown on copy failure (default: "Failed to copy")',
    },
    buttonType: {
      control: { type: 'select' },
      options: ['text', 'link', 'default', 'primary', 'dashed'],
      description: 'data.buttonType – Ant Design button type (default: "text")',
    },
    tooltip: {
      control: 'text',
      description: 'data.tooltip – tooltip text shown on hover',
    },
    style: {
      control: 'object',
      description: 'data.style – inline CSS styles',
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
  },

  render: args => {
    const data: TInner = {
      id: args.id,
      copyText: args.copyText,
      successMessage: args.successMessage,
      errorMessage: args.errorMessage,
      buttonType: args.buttonType,
      tooltip: args.tooltip,
      style: args.style,
    }

    return (
      <>
        <SmartProvider
          multiQueryValue={{ data: args.multiQueryData, isLoading: args.isLoading }}
          partsOfUrl={args.partsOfUrl}
        >
          <div style={{ padding: 16 }}>
            <p style={{ marginBottom: 16 }}>
              Click the button below to copy the resolved <code>copyText</code> to clipboard:
            </p>
            <CopyButton data={data} />
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={200}
          value={yaml.stringify({
            type: 'CopyButton',
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
    id: 'example-copy-button',
    copyText: 'Hello, World!',
    successMessage: 'Copied!',
    errorMessage: 'Failed to copy',
    buttonType: 'text',
    tooltip: 'Copy to clipboard',
    style: undefined,

    // providers
    isLoading: false,
    multiQueryData: null,
    partsOfUrl: [],
  },
}

export const WithUrlParts: Story = {
  args: {
    ...Default.args,
    id: 'copy-with-url-parts',
    copyText: 'kubectl get pods -n {2}',
    partsOfUrl: ['', '', 'my-namespace', 'pods'],
  },
}

export const WithJsonPath: Story = {
  args: {
    ...Default.args,
    id: 'copy-with-jsonpath',
    copyText: "{reqsJsonPath[0]['.metadata.name']['-']}",
    multiQueryData: {
      req0: {
        metadata: {
          name: 'my-pod-abc123',
          namespace: 'default',
        },
      },
    },
  },
}

export const WithComplexTemplate: Story = {
  args: {
    ...Default.args,
    id: 'copy-complex-template',
    copyText: "kubectl exec -it {reqsJsonPath[0]['.metadata.name']['-']} -n {2} -- /bin/bash",
    partsOfUrl: ['', '', 'production', 'pods'],
    multiQueryData: {
      req0: {
        metadata: {
          name: 'nginx-deployment-abc123',
        },
      },
    },
  },
}

export const PrimaryButton: Story = {
  args: {
    ...Default.args,
    id: 'copy-primary-button',
    copyText: 'Important text to copy',
    buttonType: 'primary',
    tooltip: 'Copy important text',
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    id: 'copy-loading',
    isLoading: true,
  },
}
