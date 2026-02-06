import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { Taints } from './Taints'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['Taints']

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
  title: 'Factory/Taints',
  component: Taints as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    reqIndex: {
      control: 'text',
      description: 'data.reqIndex – which multiQuery request to read, e.g. "0" for req0',
    },
    jsonPathToArray: {
      control: 'text',
      description: 'data.jsonPathToArray – JSONPath from root of req{reqIndex} to taints array',
    },
    text: {
      control: 'text',
      description: 'data.text – label text, supports "~counter~" placeholder',
    },
    errorText: {
      control: 'text',
      description: 'data.errorText – shown when root/jsonPath is invalid',
    },
    style: {
      control: 'object',
      description: 'data.style – style of the inline fallback span (when root is missing)',
    },
    notificationSuccessMessage: {
      control: 'text',
      description: 'data.notificationSuccessMessage – optional, parsed with parseAll',
    },
    notificationSuccessMessageDescription: {
      control: 'text',
      description: 'data.notificationSuccessMessageDescription – optional, parsed with parseAll',
    },
    modalTitle: {
      control: 'text',
      description: 'data.modalTitle – optional title for EditModal (parsed with parseAll)',
    },
    modalDescriptionText: {
      control: 'text',
      description: 'data.modalDescriptionText – optional description text for EditModal',
    },
    modalDescriptionTextStyle: {
      control: 'object',
      description: 'data.modalDescriptionTextStyle – style for modal description text',
    },
    inputLabel: {
      control: 'text',
      description: 'data.inputLabel – optional label above taints editor',
    },
    inputLabelStyle: {
      control: 'object',
      description: 'data.inputLabelStyle – style for inputLabel',
    },
    containerStyle: {
      control: 'object',
      description: 'data.containerStyle – wrapper div style around counter + edit button',
    },
    endpoint: {
      control: 'text',
      description:
        'data.endpoint – API endpoint for patching taints (parsed via parseAll, default "no-endpoint-provided")',
    },
    pathToValue: {
      control: 'text',
      description:
        'data.pathToValue – JSON path inside PATCH body for taints (parsed via parseAll, default "no-pathToValue-provided")',
    },
    editModalWidth: {
      control: 'text',
      description: 'data.editModalWidth – Modal width (number or string)',
    },
    cols: {
      control: 'object',
      description: 'data.cols – column spans for EditModal grid (4 numbers)',
    },
    permissions: {
      control: 'object',
      description: 'data.permissions (optional; { canPatch?: boolean } manual override)',
    },
    permissionContext: {
      control: 'object',
      description: 'data.permissionContext (optional; auto permission check context)',
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
      jsonPathToArray: args.jsonPathToArray,
      text: args.text,
      errorText: args.errorText,
      style: args.style,
      notificationSuccessMessage: args.notificationSuccessMessage,
      notificationSuccessMessageDescription: args.notificationSuccessMessageDescription,
      modalTitle: args.modalTitle,
      modalDescriptionText: args.modalDescriptionText,
      modalDescriptionTextStyle: args.modalDescriptionTextStyle,
      inputLabel: args.inputLabel,
      inputLabelStyle: args.inputLabelStyle,
      containerStyle: args.containerStyle,
      endpoint: args.endpoint,
      pathToValue: args.pathToValue,
      editModalWidth: args.editModalWidth,
      cols: args.cols,
      permissions: args.permissions,
      permissionContext: args.permissionContext,
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
            <Taints data={data}>
              <div style={{ fontSize: 12, color: '#999' }}>(children slot content)</div>
            </Taints>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'Taints',
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
    id: 'example-taints',
    reqIndex: '0',
    jsonPathToArray: ".spec['tolerations_like_taints']",
    text: 'Taints (~counter~)',
    errorText: 'No taints information',
    style: { color: 'red' },
    notificationSuccessMessage: 'Taints updated',
    notificationSuccessMessageDescription: 'Taints were successfully patched',
    modalTitle: 'Edit taints',
    modalDescriptionText: 'Add, edit or remove taints for this node',
    modalDescriptionTextStyle: undefined,
    inputLabel: 'Taints',
    inputLabelStyle: undefined,
    containerStyle: { fontSize: 14 },
    endpoint: '/api/mock/taints',
    pathToValue: '.spec.taints',
    editModalWidth: 720,
    cols: [6, 6, 6, 6], // 4 columns for your EditModal layout
    permissions: {
      canPatch: true,
    },

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        spec: {
          // whatever structure your getItemsInside expects
          tolerations_like_taints: [
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
    partsOfUrl: [],
    theme: 'light',
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
}

export const ErrorFromMultiQuery: Story = {
  args: {
    ...Default.args,
    isLoading: false,
    isError: true,
    errors: [{ message: 'Simulated multiQuery error' }],
  },
}

export const NoRootForJsonPath: Story = {
  args: {
    ...Default.args,
    reqIndex: '99',
    multiQueryData: {
      // no req99 -> triggers "No root for json path"
    },
  },
}

export const NoPatchPermission: Story = {
  args: {
    ...Default.args,
    id: 'example-taints-no-patch-permission',
    permissions: {
      canPatch: false,
    },
  },
}
