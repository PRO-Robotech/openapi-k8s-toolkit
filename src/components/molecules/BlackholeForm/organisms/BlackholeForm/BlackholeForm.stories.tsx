import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
// import { OpenAPIV2 } from 'openapi-types'
import { TJSON } from '../../../../../localTypes/JSON'
import { TFormPrefill } from '../../../../../localTypes/formExtensions'
import { TUrlParams } from '../../../../../localTypes/form'
import { BlackholeForm } from './BlackholeForm'

type BlackholeFormProps = {
  cluster: string
  theme: 'light' | 'dark'
  urlParams: TUrlParams
  urlParamsForPermissions: {
    apiGroup?: string
    plural?: string
  }
  formsPrefills?: TFormPrefill
  // staticProperties: OpenAPIV2.SchemaObject['properties']
  staticProperties: any
  required: string[]
  hiddenPaths?: string[][]
  expandedPaths: string[][]
  persistedPaths: string[][]
  prefillValuesSchema?: TJSON
  prefillValueNamespaceOnly?: string
  isNameSpaced?: false | string[]
  isCreate?: boolean
  type: 'builtin' | 'apis'
  apiGroupApiVersion: string
  kind: string
  plural: string
  backlink?: string | null
  designNewLayout?: boolean
  designNewLayoutHeight?: number
}

type ProviderArgs = {}

type Args = BlackholeFormProps & ProviderArgs

const queryClient = new QueryClient()

const meta: Meta<Args> = {
  title: 'Core/BlackholeForm',
  component: BlackholeForm as any,
  // Expose *inner* fields as top-level controls
  argTypes: {
    cluster: { control: 'text', description: 'cluster' },
    theme: { options: ['dark', 'light'], control: { type: 'radio' }, description: 'theme' },
    urlParams: { control: 'object' },
    urlParamsForPermissions: { control: 'object' },
    formsPrefills: { control: 'object' },
    staticProperties: { control: 'object' },
    required: { control: 'object' },
    hiddenPaths: { control: 'object' },
    expandedPaths: { control: 'object' },
    persistedPaths: { control: 'object' },
    prefillValuesSchema: { control: 'object' },
    prefillValueNamespaceOnly: { control: 'text' },
    isNameSpaced: { control: 'object' },
    isCreate: { control: { type: 'boolean' } },
    type: { options: ['builtin', 'apis'], control: { type: 'radio' } },
    apiGroupApiVersion: { control: 'text' },
    kind: { control: 'text' },
    plural: { control: 'text' },
    backlink: { control: 'text' },
    designNewLayout: { control: { type: 'boolean' } },
    designNewLayoutHeight: { control: 'number' },
  },

  // Map flat args -> component's { data } prop
  render: args => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Routes>
          <Route
            path="*"
            element={
              <BlackholeForm
                cluster={args.cluster}
                theme={args.theme}
                urlParams={args.urlParams}
                urlParamsForPermissions={args.urlParamsForPermissions}
                formsPrefills={args.formsPrefills}
                staticProperties={args.staticProperties}
                required={args.required}
                hiddenPaths={args.hiddenPaths}
                expandedPaths={args.expandedPaths}
                persistedPaths={args.persistedPaths}
                prefillValuesSchema={args.prefillValuesSchema}
                prefillValueNamespaceOnly={args.prefillValueNamespaceOnly}
                isCreate={args.isCreate}
                type={args.type}
                isNameSpaced={args.isNameSpaced}
                apiGroupApiVersion={args.apiGroupApiVersion}
                kind={args.kind}
                plural={args.plural}
                backlink={args.backlink}
                designNewLayout={args.designNewLayout}
                designNewLayoutHeight={args.designNewLayoutHeight}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  ),

  parameters: {
    controls: { expanded: true },
  },
}
export default meta

type Story = StoryObj<Args>

export const Default: Story = {
  args: {
    cluster: 'default',
    theme: 'dark',
    urlParams: {},
    urlParamsForPermissions: {},
    formsPrefills: undefined,
    staticProperties: {
      apiVersion: { type: 'string' },
      kind: { type: 'string' },
      spec: {
        type: 'object',
        properties: {
          users: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                password: { type: 'string' },
                replication: { type: 'boolean' },
              },
            },
          },
          limits: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                default: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string',
                  },
                },
                default2: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    required: [],
    hiddenPaths: [],
    expandedPaths: undefined,
    persistedPaths: undefined,
    prefillValuesSchema: undefined,
    prefillValueNamespaceOnly: undefined,
    isNameSpaced: false,
    isCreate: true,
    type: 'apis',
    apiGroupApiVersion: 'demo.story/v1',
    kind: 'Demo',
    plural: 'demo',
    backlink: '',
    designNewLayout: true,
    designNewLayoutHeight: 700,
  },
}
