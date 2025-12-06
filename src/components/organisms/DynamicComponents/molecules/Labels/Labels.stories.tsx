import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { Labels } from './Labels'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['Labels']

type TProviderArgs = {
  isLoading: boolean
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/Labels',
  component: Labels as any,
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
      description: 'data.linkPrefix (prefix for navigate when clicking a label)',
    },
    selectProps: {
      control: 'object',
      description: 'data.selectProps (forwarded to UncontrolledSelect)',
    },
    maxTagKeyLength: {
      control: 'number',
      description: 'data.maxTagKeyLength (truncate key before "=")',
    },
    maxTagValueLength: {
      control: 'number',
      description: 'data.maxTagValueLength (truncate value after "=")',
    },
    verticalViewList: {
      control: 'boolean',
      description: 'data.verticalViewList (render labels as vertical list instead of select)',
    },
    verticalViewListFlexProps: {
      control: 'object',
      description: 'data.verticalViewListFlexProps (Flex props in vertical mode)',
    },
    emptyListMessage: {
      control: 'text',
      description: 'data.emptyListMessage (shown when no labels and verticalViewList=true)',
    },
    emptyListMessageStyle: {
      control: 'object',
      description: 'data.emptyListMessageStyle',
    },
    readOnly: {
      control: 'boolean',
      description: 'data.readOnly (hides edit controls when true)',
    },
    notificationSuccessMessage: {
      control: 'text',
      description: 'data.notificationSuccessMessage (AntD notification title)',
    },
    notificationSuccessMessageDescription: {
      control: 'text',
      description: 'data.notificationSuccessMessageDescription (AntD notification description)',
    },
    modalTitle: {
      control: 'text',
      description: 'data.modalTitle (Edit modal title)',
    },
    modalDescriptionText: {
      control: 'text',
      description: 'data.modalDescriptionText (shown above form in modal)',
    },
    modalDescriptionTextStyle: {
      control: 'object',
      description: 'data.modalDescriptionTextStyle',
    },
    inputLabel: {
      control: 'text',
      description: 'data.inputLabel (label for the labels input in modal)',
    },
    inputLabelStyle: {
      control: 'object',
      description: 'data.inputLabelStyle',
    },
    containerStyle: {
      control: 'object',
      description: 'data.containerStyle (outer wrapper)',
    },
    maxEditTagTextLength: {
      control: 'number',
      description: 'data.maxEditTagTextLength (truncate in modal select)',
    },
    allowClearEditSelect: {
      control: 'boolean',
      description: 'data.allowClearEditSelect (allow clear option in modal select)',
    },
    endpoint: {
      control: 'text',
      description: 'data.endpoint (API endpoint used by EditModal/patchEntryWithReplaceOp)',
    },
    pathToValue: {
      control: 'text',
      description: 'data.pathToValue (path for patchEntryWithReplaceOp)',
    },
    editModalWidth: {
      control: 'text',
      description: 'data.editModalWidth (number or string)',
    },
    paddingContainerEnd: {
      control: 'text',
      description: 'data.paddingContainerEnd (padding in EditModal footer)',
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
      jsonPathToLabels: args.jsonPathToLabels,
      linkPrefix: args.linkPrefix,
      selectProps: args.selectProps,
      maxTagKeyLength: args.maxTagKeyLength,
      maxTagValueLength: args.maxTagValueLength,
      verticalViewList: args.verticalViewList,
      verticalViewListFlexProps: args.verticalViewListFlexProps,
      emptyListMessage: args.emptyListMessage,
      emptyListMessageStyle: args.emptyListMessageStyle,
      readOnly: args.readOnly,
      notificationSuccessMessage: args.notificationSuccessMessage,
      notificationSuccessMessageDescription: args.notificationSuccessMessageDescription,
      modalTitle: args.modalTitle,
      modalDescriptionText: args.modalDescriptionText,
      modalDescriptionTextStyle: args.modalDescriptionTextStyle,
      inputLabel: args.inputLabel,
      inputLabelStyle: args.inputLabelStyle,
      containerStyle: args.containerStyle,
      maxEditTagTextLength: args.maxEditTagTextLength,
      allowClearEditSelect: args.allowClearEditSelect,
      endpoint: args.endpoint,
      pathToValue: args.pathToValue,
      editModalWidth: args.editModalWidth,
      paddingContainerEnd: args.paddingContainerEnd,
    }

    return (
      <>
        <SmartProvider
          multiQueryValue={{ data: args.multiQueryData, isLoading: args.isLoading }}
          partsOfUrl={args.partsOfUrl}
          theme={args.theme}
        >
          <div style={{ padding: 16 }}>
            <Labels data={data}>
              <div style={{ fontSize: 12, color: '#999' }}>(children slot content)</div>
            </Labels>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'Labels',
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
    id: 'example-labels',
    reqIndex: '0',
    jsonPathToLabels: '.data.metadata.labels', // jsonpath -> "$.data.metadata.labels"
    linkPrefix: '/labels?filter=',
    selectProps: {
      maxTagTextLength: 40,
    },
    maxTagKeyLength: 20,
    maxTagValueLength: 20,
    verticalViewList: false,
    verticalViewListFlexProps: undefined,
    emptyListMessage: 'No labels',
    emptyListMessageStyle: { fontStyle: 'italic', color: '#999' },
    readOnly: undefined,
    notificationSuccessMessage: 'Labels updated',
    notificationSuccessMessageDescription: 'The labels were successfully saved.',
    modalTitle: 'Edit labels',
    modalDescriptionText: 'Manage labels for this resource.',
    modalDescriptionTextStyle: { fontSize: 12, color: '#666' },
    inputLabel: 'Labels',
    inputLabelStyle: { fontWeight: 600 },
    containerStyle: {
      padding: 12,
      border: '1px solid #eee',
      borderRadius: 4,
    },
    maxEditTagTextLength: 40,
    allowClearEditSelect: true,
    endpoint: '/api/example/labels',
    pathToValue: '/metadata/labels',
    editModalWidth: 720,
    paddingContainerEnd: '16px',

    // providers
    isLoading: false,
    multiQueryData: {
      req0: {
        data: {
          metadata: {
            labels: {
              'app.kubernetes.io/name': 'demo-app',
              'app.kubernetes.io/component': 'frontend',
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

export const VerticalView: Story = {
  args: {
    ...Default.args,
    id: 'example-labels-vertical',
    verticalViewList: true,
  },
}

export const ReadOnly: Story = {
  args: {
    ...Default.args,
    id: 'example-labels-readonly',
    readOnly: true as any, // matches `readOnly?: true` in the type map
  },
}

export const Empty: Story = {
  args: {
    ...Default.args,
    id: 'example-labels-empty',
    multiQueryData: {
      req0: {
        data: {
          metadata: {
            labels: {},
          },
        },
      },
    },
  },
}

export const LoadingMultiQuery: Story = {
  args: {
    ...Default.args,
    id: 'example-labels-loading',
    isLoading: true,
  },
}
