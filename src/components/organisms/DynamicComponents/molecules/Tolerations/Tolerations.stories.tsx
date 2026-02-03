import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { Tolerations } from './Tolerations'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['Tolerations']

type TProviderArgs = {
  isLoading: boolean
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/Tolerations',
  component: Tolerations as any,
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
    text: {
      control: 'text',
      description: 'data.text (supports "~counter~" placeholder)',
    },
    errorText: {
      control: 'text',
      description: 'data.errorText (shown when root is missing/invalid or parsing fails)',
    },
    containerStyle: { control: 'object', description: 'data.containerStyle' },
    notificationSuccessMessage: {
      control: 'text',
      description: 'data.notificationSuccessMessage (AntD notification title)',
    },
    notificationSuccessMessageDescription: {
      control: 'text',
      description: 'data.notificationSuccessMessageDescription (AntD notification description)',
    },
    modalTitle: { control: 'text', description: 'data.modalTitle' },
    modalDescriptionText: {
      control: 'text',
      description: 'data.modalDescriptionText',
    },
    modalDescriptionTextStyle: {
      control: 'object',
      description: 'data.modalDescriptionTextStyle',
    },
    inputLabel: {
      control: 'text',
      description: 'data.inputLabel (label for the annotations form section in modal)',
    },
    inputLabelStyle: { control: 'object', description: 'data.inputLabelStyle' },
    endpoint: {
      control: 'text',
      description: 'data.endpoint (API endpoint for patchEntryWithReplaceOp)',
    },
    pathToValue: {
      control: 'text',
      description: 'data.pathToValue (JSON pointer/path passed to patchEntryWithReplaceOp)',
    },
    editModalWidth: {
      control: 'text',
      description: 'data.editModalWidth (number or string)',
    },
    cols: {
      control: 'object',
      description: 'data.cols [key, value, effect, operator, actions] (AntD grid spans, length 5)',
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
      reqIndex: args.reqIndex,
      jsonPathToArray: args.jsonPathToArray,
      text: args.text,
      errorText: args.errorText,
      containerStyle: args.containerStyle,
      notificationSuccessMessage: args.notificationSuccessMessage,
      notificationSuccessMessageDescription: args.notificationSuccessMessageDescription,
      modalTitle: args.modalTitle,
      modalDescriptionText: args.modalDescriptionText,
      modalDescriptionTextStyle: args.modalDescriptionTextStyle,
      inputLabel: args.inputLabel,
      inputLabelStyle: args.inputLabelStyle,
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
          multiQueryValue={{ data: args.multiQueryData, isLoading: args.isLoading }}
          partsOfUrl={args.partsOfUrl}
          theme={args.theme}
        >
          <div style={{ padding: 16 }}>
            <Tolerations data={data}>
              <div style={{ fontSize: 12, color: '#999' }}>(children slot content)</div>
            </Tolerations>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'Tolerations',
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
    id: 'example-tolerations',
    reqIndex: '0',
    jsonPathToArray: '.data.spec.tolerations', // jsonpath -> "$.data.spec.tolerations"
    text: 'Tolerations: ~counter~ items',
    errorText: 'No tolerations found',
    containerStyle: {
      padding: 12,
      border: '1px solid #eee',
      borderRadius: 4,
    },
    notificationSuccessMessage: 'Tolerations updated',
    notificationSuccessMessageDescription: 'The tolerations were successfully saved.',
    modalTitle: 'Edit tolerations',
    modalDescriptionText: 'Add, edit or remove tolerations for this workload.',
    modalDescriptionTextStyle: { fontSize: 12, color: '#666' },
    inputLabel: 'Tolerations',
    inputLabelStyle: { fontWeight: 600 },
    endpoint: '/api/example/tolerations',
    pathToValue: '/spec/template/spec/tolerations',
    editModalWidth: 720,
    cols: [6, 6, 4, 4, 4], // example AntD grid spans
    permissions: {
      canPatch: true,
    },

    // providers
    isLoading: false,
    multiQueryData: {
      req0: {
        data: {
          spec: {
            tolerations: [
              {
                key: 'example.com/dedicated',
                operator: 'Equal',
                value: 'batch',
                effect: 'NoSchedule',
              },
              {
                key: 'node.kubernetes.io/unreachable',
                operator: 'Exists',
                effect: 'NoExecute',
                tolerationSeconds: 300,
              },
            ],
          },
        },
      },
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const MissingRoot: Story = {
  args: {
    ...Default.args,
    // no req0 -> jsonRoot === undefined -> errorText + containerStyle
    multiQueryData: {},
  },
}

export const LoadingMultiQuery: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
}
