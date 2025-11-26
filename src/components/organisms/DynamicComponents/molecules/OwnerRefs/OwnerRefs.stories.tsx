// src/components/organisms/DynamicComponents/molecules/OwnerRefs/OwnerRefs.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { OwnerRefs } from './OwnerRefs'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['OwnerRefs']

type TProviderArgs = {
  isLoading: boolean
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/OwnerRefs',
  component: OwnerRefs as any,
  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id' },
    baseprefix: {
      control: 'text',
      description: 'data.baseprefix (optional prefix for navigation URLs inside RefsList)',
    },
    cluster: {
      control: 'text',
      description: 'data.cluster (can contain placeholders resolved via parseAll)',
    },
    reqIndex: {
      control: 'text',
      description: 'data.reqIndex (string; used as `multiQueryData["req" + reqIndex]`, e.g. "0" -> req0)',
    },
    jsonPathToArrayOfRefs: {
      control: 'text',
      description: 'data.jsonPathToArrayOfRefs (jsonpath used as `$${jsonPathToArrayOfRefs}` to find ownerReferences)',
    },
    errorText: {
      control: 'text',
      description: 'data.errorText (shown when jsonRoot is undefined for reqIndex)',
    },
    notArrayErrorText: {
      control: 'text',
      description: 'data.notArrayErrorText (shown when the result is not an array)',
    },
    emptyArrayErrorText: {
      control: 'text',
      description: 'data.emptyArrayErrorText (shown when array is empty)',
    },
    isNotRefsArrayErrorText: {
      control: 'text',
      description: 'data.isNotRefsArrayErrorText (shown when elements are not valid OwnerReference objects)',
    },
    containerStyle: {
      control: 'object',
      description: 'data.containerStyle (outer wrapper style)',
    },
    listFlexProps: {
      control: 'object',
      description: 'data.listFlexProps (Flex props passed to RefsList layout)',
    },
    forcedApiVersion: {
      control: 'object',
      description: 'data.forcedApiVersion [{ kind, apiVersion }] (override apiVersion for given kinds)',
    },
    forcedNamespace: {
      control: 'text',
      description: 'data.forcedNamespace (override namespace when navigating to owners)',
    },
    keysToForcedLabel: {
      control: 'object',
      description: 'data.keysToForcedLabel (jsonpath or string[] for label extraction used by RefsList)',
    },
    forcedRelatedValuePath: {
      control: 'text',
      description: 'data.forcedRelatedValuePath (path to value used for related info in RefsList)',
    },
    baseFactoryNamespacedAPIKey: {
      control: 'text',
      description: 'data.baseFactoryNamespacedAPIKey (factory key for namespaced API resources)',
    },
    baseFactoryClusterSceopedAPIKey: {
      control: 'text',
      description: 'data.baseFactoryClusterSceopedAPIKey (factory key for cluster-scoped API resources)',
    },
    baseFactoryNamespacedBuiltinKey: {
      control: 'text',
      description: 'data.baseFactoryNamespacedBuiltinKey (factory key for namespaced builtin resources)',
    },
    baseFactoryClusterSceopedBuiltinKey: {
      control: 'text',
      description: 'data.baseFactoryClusterSceopedBuiltinKey (factory key for cluster-scoped builtin resources)',
    },
    baseNavigationPlural: {
      control: 'text',
      description: 'data.baseNavigationPlural (plural used in navigation URLs)',
    },
    baseNavigationName: {
      control: 'text',
      description: 'data.baseNavigationName (name used in navigation URLs)',
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
      description: 'mocked partsOfUrl.partsOfUrl array (used by prepareTemplate/parseAll)',
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
      baseprefix: args.baseprefix,
      cluster: args.cluster,
      reqIndex: args.reqIndex,
      errorText: args.errorText,
      notArrayErrorText: args.notArrayErrorText,
      emptyArrayErrorText: args.emptyArrayErrorText,
      isNotRefsArrayErrorText: args.isNotRefsArrayErrorText,
      containerStyle: args.containerStyle,
      listFlexProps: args.listFlexProps,
      jsonPathToArrayOfRefs: args.jsonPathToArrayOfRefs,
      forcedApiVersion: args.forcedApiVersion,
      forcedNamespace: args.forcedNamespace,
      keysToForcedLabel: args.keysToForcedLabel,
      forcedRelatedValuePath: args.forcedRelatedValuePath,
      baseFactoryNamespacedAPIKey: args.baseFactoryNamespacedAPIKey,
      baseFactoryClusterSceopedAPIKey: args.baseFactoryClusterSceopedAPIKey,
      baseFactoryNamespacedBuiltinKey: args.baseFactoryNamespacedBuiltinKey,
      baseFactoryClusterSceopedBuiltinKey: args.baseFactoryClusterSceopedBuiltinKey,
      baseNavigationPlural: args.baseNavigationPlural,
      baseNavigationName: args.baseNavigationName,
    }

    return (
      <>
        <SmartProvider
          multiQueryValue={{ data: args.multiQueryData, isLoading: args.isLoading }}
          partsOfUrl={args.partsOfUrl}
          theme={args.theme}
        >
          <div style={{ padding: 16 }}>
            <OwnerRefs data={data}>
              <div style={{ fontSize: 12, color: '#999' }}>(children slot content)</div>
            </OwnerRefs>
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'OwnerRefs',
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
    id: 'example-owner-refs',
    baseprefix: '/k8s',
    cluster: 'my-cluster',
    reqIndex: '0',
    jsonPathToArrayOfRefs: '.metadata.ownerReferences',
    errorText: 'Owner references not available',
    notArrayErrorText: 'Owner references payload is not an array',
    emptyArrayErrorText: 'No owner references found',
    isNotRefsArrayErrorText: 'Value is not an array of OwnerReference objects',
    containerStyle: {
      padding: 12,
      border: '1px solid #eee',
      borderRadius: 4,
    },
    listFlexProps: {
      wrap: 'wrap',
      gap: 8,
      children: null,
    },
    forcedApiVersion: [
      {
        kind: 'Deployment',
        apiVersion: 'apps/v1',
      },
    ],
    forcedNamespace: 'default',
    keysToForcedLabel: '.metadata.labels',
    forcedRelatedValuePath: '.metadata.name',
    baseFactoryNamespacedAPIKey: 'factory-namespaced-api',
    baseFactoryClusterSceopedAPIKey: 'factory-cluster-api',
    baseFactoryNamespacedBuiltinKey: 'factory-namespaced-builtin',
    baseFactoryClusterSceopedBuiltinKey: 'factory-cluster-builtin',
    baseNavigationPlural: 'deployments',
    baseNavigationName: 'deployment',

    // providers
    isLoading: false,
    multiQueryData: {
      req0: {
        metadata: {
          name: 'example-pod',
          namespace: 'default',
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              kind: 'ReplicaSet',
              name: 'example-replicaset',
              uid: '1111-2222-3333-4444',
              controller: true,
              blockOwnerDeletion: true,
            },
            {
              apiVersion: 'v1',
              kind: 'ConfigMap',
              name: 'example-config',
              uid: '5555-6666-7777-8888',
            },
          ],
        },
      },
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const NoRefs: Story = {
  args: {
    ...Default.args,
    id: 'example-owner-refs-empty',
    multiQueryData: {
      req0: {
        metadata: {
          name: 'no-owners',
          namespace: 'default',
          ownerReferences: [],
        },
      },
    },
  },
}

export const NotArray: Story = {
  args: {
    ...Default.args,
    id: 'example-owner-refs-not-array',
    multiQueryData: {
      req0: {
        metadata: {
          name: 'invalid-owners',
          namespace: 'default',
          // not an array → triggers notArrayErrorText
          ownerReferences: 'not-an-array',
        },
      },
    },
  },
}

export const LoadingMultiQuery: Story = {
  args: {
    ...Default.args,
    id: 'example-owner-refs-loading',
    isLoading: true,
  },
}
