import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { AntdResult } from './AntdResult'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['antdResult']

type TProviderArgs = {
  isLoading: boolean
  isError: boolean
  errors: ({ message: string } | null)[]
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/AntdResult',
  component: AntdResult as any,
  argTypes: {
    id: { control: 'text', description: 'data.id' },
    reqIndex: { control: 'number', description: 'data.reqIndex — auto-detect error from this request index' },
    checkEmpty: {
      control: 'boolean',
      description: 'data.checkEmpty — check if array at itemsPath is empty and show 404 (default: true)',
    },
    status: {
      control: { type: 'select' },
      options: [undefined, 'success', 'error', 'info', 'warning', '403', '404', '500'],
      description: 'data.status — override or manual status',
    },
    title: { control: 'text', description: 'data.title (supports template syntax)' },
    subTitle: { control: 'text', description: 'data.subTitle (supports template syntax)' },
    style: { control: 'object', description: 'data.style' },

    // provider knobs
    isLoading: { control: 'boolean' },
    isError: { control: 'boolean' },
    errors: { control: 'object' },
    multiQueryData: { control: 'object' },
    partsOfUrl: { control: 'object' },
  },

  render: args => (
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
          <AntdResult
            data={{
              id: args.id,
              reqIndex: args.reqIndex,
              checkEmpty: args.checkEmpty,
              status: args.status,
              title: args.title,
              subTitle: args.subTitle,
              style: args.style,
            }}
          />
        </div>
      </SmartProvider>

      <Editor
        defaultLanguage="yaml"
        width="100%"
        height={150}
        value={yaml.stringify({
          type: 'antdResult',
          data: {
            id: args.id,
            ...(args.reqIndex !== undefined && { reqIndex: args.reqIndex }),
            ...(args.checkEmpty && { checkEmpty: args.checkEmpty }),
            ...(args.status && { status: args.status }),
            ...(args.title && { title: args.title }),
            ...(args.subTitle && { subTitle: args.subTitle }),
            ...(args.style && { style: args.style }),
          },
        })}
        theme={'vs-dark'}
        options={{
          theme: 'vs-dark',
          readOnly: true,
        }}
      />
    </>
  ),

  parameters: {
    controls: { expanded: true },
  },
}
export default meta

type Story = StoryObj<TArgs>

// ── Manual mode stories ─────────────────────────────────────────

export const NotFound: Story = {
  args: {
    id: 'result-404',
    reqIndex: undefined,
    status: '404',
    title: 'Not Found',
    subTitle: 'The requested resource does not exist.',
    style: undefined,

    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: null,
    partsOfUrl: [],
  },
}

export const Forbidden: Story = {
  args: {
    ...NotFound.args,
    id: 'result-403',
    status: '403',
    title: 'Access Denied',
    subTitle: 'You do not have permission to view this resource.',
  },
}

export const ServerError: Story = {
  args: {
    ...NotFound.args,
    id: 'result-500',
    status: '500',
    title: 'Server Error',
    subTitle: 'Something went wrong on the server.',
  },
}

export const Warning: Story = {
  args: {
    ...NotFound.args,
    id: 'result-warning',
    status: 'warning',
    title: 'No Data',
    subTitle: 'No items match the current filter.',
  },
}

export const Success: Story = {
  args: {
    ...NotFound.args,
    id: 'result-success',
    status: 'success',
    title: 'Operation Complete',
    subTitle: 'The resource has been created successfully.',
  },
}

export const WithTemplates: Story = {
  args: {
    ...NotFound.args,
    id: 'result-templates',
    status: 'warning',
    title: "Pod {reqsJsonPath[0]['.metadata.name']['unknown']} not ready",
    subTitle: 'Namespace: {0}',
    multiQueryData: { req0: { metadata: { name: 'my-pod-xyz' } } },
    partsOfUrl: ['default'],
  },
}

// ── Auto-detect mode stories ────────────────────────────────────

export const AutoDetectError: Story = {
  name: 'Auto-detect: request failed',
  args: {
    id: 'result-auto-error',
    reqIndex: 0,
    status: undefined,
    title: undefined,
    subTitle: undefined,
    style: undefined,

    isLoading: false,
    isError: true,
    errors: [{ message: 'Request failed with status code 403' }],
    multiQueryData: null,
    partsOfUrl: [],
  },
}

export const AutoDetectNoError: Story = {
  name: 'Auto-detect: request succeeded (renders nothing)',
  args: {
    ...AutoDetectError.args,
    id: 'result-auto-ok',
    isError: false,
    errors: [null],
    multiQueryData: { req0: { metadata: { name: 'some-pod' } } },
  },
}

export const CheckEmptyEnabled: Story = {
  name: 'checkEmpty: empty K8s list treated as 404',
  args: {
    id: 'result-empty-list',
    reqIndex: 0,
    checkEmpty: true,
    status: undefined,
    title: 'Pod {0} is not found',
    subTitle: 'Namespace: {1}',
    style: undefined,

    isLoading: false,
    isError: false,
    errors: [null],
    multiQueryData: { req0: { items: [] } },
    partsOfUrl: ['nginx-missing-pod', 'default'],
  },
}

export const CheckEmptyDisabled: Story = {
  name: 'checkEmpty: disabled — empty list renders children',
  args: {
    ...CheckEmptyEnabled.args,
    id: 'result-empty-list-disabled',
    checkEmpty: false,
  },
}

export const Loading: Story = {
  args: {
    ...NotFound.args,
    isLoading: true,
  },
}
