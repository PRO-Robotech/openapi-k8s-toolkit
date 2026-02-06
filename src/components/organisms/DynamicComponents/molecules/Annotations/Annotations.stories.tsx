import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { Annotations } from './Annotations'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['Annotations']

type TProviderArgs = {
  isLoading: boolean
  isError: boolean
  errors: { message: string }[]
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/Annotations',
  component: Annotations as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    reqIndex: {
      control: 'text',
      description: 'data.reqIndex (string; used as `multiQueryData["req" + reqIndex]`, e.g. "0" -> req0)',
    },
    jsonPathToObj: {
      control: 'text',
      description: 'data.jsonPathToObj (used as `$${jsonPathToObj}` with jsonpath)',
    },
    text: {
      control: 'text',
      description: 'data.text (supports "~counter~" placeholder)',
    },
    errorText: {
      control: 'text',
      description: 'data.errorText (shown when root is missing or invalid)',
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
    inputLabel: { control: 'text', description: 'data.inputLabel' },
    inputLabelStyle: { control: 'object', description: 'data.inputLabelStyle' },
    endpoint: {
      control: 'text',
      description: 'data.endpoint (optional; API endpoint used by EditModal -> patchEntryWithReplaceOp)',
    },
    pathToValue: {
      control: 'text',
      description: 'data.pathToValue (optional; JSON pointer or path passed to patchEntryWithReplaceOp)',
    },
    editModalWidth: {
      control: 'text',
      description: 'data.editModalWidth (number or string)',
    },
    cols: {
      control: 'object',
      description: 'data.cols [keyCol, valueCol, actionsCol] (AntD grid spans, length 3)',
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
    isLoading: { control: 'boolean', description: 'useMultiQuery.isLoading' },
    isError: { control: 'boolean', description: 'useMultiQuery.isError' },
    errors: { control: 'object', description: 'useMultiQuery.errors' },
    multiQueryData: {
      control: 'object',
      description: 'mock data fed into MultiQueryMockProvider',
    },
    partsOfUrl: {
      control: 'object',
      description: 'mocked partsOfUrl.partsOfUrl array',
    },
  },

  render: args => {
    const data: TDynamicComponentsAppTypeMap['Annotations'] = {
      id: args.id,
      reqIndex: args.reqIndex,
      jsonPathToObj: args.jsonPathToObj,
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
          multiQueryValue={{
            isLoading: args.isLoading,
            isError: args.isError,
            errors: args.errors,
            data: args.multiQueryData,
          }}
          partsOfUrl={args.partsOfUrl}
        >
          <div style={{ padding: 16 }}>
            <Annotations data={data}>
              <div style={{ fontSize: 12, color: '#999' }}>(children slot content)</div>
            </Annotations>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'Annotations',
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
    id: 'example-annotations',
    reqIndex: '0',
    jsonPathToObj: '.data.annotations', // -> jsonpath: "$.data.annotations"
    text: 'Annotations: ~counter~ items',
    errorText: 'No annotations found',
    containerStyle: {
      padding: 12,
      border: '1px solid #eee',
      borderRadius: 4,
    },
    notificationSuccessMessage: 'Annotations saved',
    notificationSuccessMessageDescription: 'Your annotations were successfully updated.',
    modalTitle: 'Edit annotations',
    modalDescriptionText: 'Add or edit annotations for this resource.',
    modalDescriptionTextStyle: { fontSize: 12, color: '#666' },
    inputLabel: 'Annotations',
    inputLabelStyle: { fontWeight: 600 },
    endpoint: '/api/example/resource',
    pathToValue: '/metadata/annotations',
    editModalWidth: 720,
    cols: [8, 12, 4],
    permissions: {
      canPatch: true,
    },

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      req0: {
        data: {
          annotations: {
            'example.com/foo': 'bar',
            'example.com/hello': 'world',
          },
        },
      },
    },
    partsOfUrl: [],
  },
}

/**
 * Missing root for reqIndex/jsonPathToObj -> shows errorText.
 */
export const MissingRoot: Story = {
  args: {
    ...Default.args!,
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
    ...Default.args!,
    isLoading: true,
  },
}

/**
 * Simulated error state from useMultiQuery (before jsonPath is even used).
 */
export const ProviderError: Story = {
  args: {
    ...Default.args!,
    isError: true,
    errors: [{ message: 'Failed to fetch data for annotations' }],
  },
}

export const NoPatchPermission: Story = {
  args: {
    ...Default.args!,
    id: 'example-annotations-no-patch-permission',
    permissions: {
      canPatch: false,
    },
  },
}

export const NoAnnotations: Story = {
  args: {
    ...Default.args!,
    id: 'example-annotations-empty',
    multiQueryData: {
      req0: {
        data: {
          annotations: {},
        },
      },
    },
  },
}
