import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import type { TDynamicComponentsAppTypeMap } from '../../types'

type TInner = TDynamicComponentsAppTypeMap['Volumes']
type TArgs = TInner

const VolumesDocsOnly: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p style={{ marginBottom: 8 }}>
      <strong>Volumes</strong> builds table rows from mounted container volumes and renders them through the shared
      <code> EnrichedTable </code>.
    </p>
    <p style={{ marginBottom: 8 }}>
      It depends on runtime app providers (<code>useMultiQuery</code>, theme context, and lazy table wiring), so this
      Storybook entry is <strong>docs-only</strong> and does not render the real component.
    </p>
    <p style={{ marginBottom: 0 }}>
      Use controls to edit factory <code>data</code> and copy the YAML snippet into your dynamic layout config.
    </p>
  </div>
)

const meta: Meta<TArgs> = {
  title: 'Factory/Volumes',
  component: VolumesDocsOnly,
  argTypes: {
    id: { control: 'text', description: 'data.id (unique identifier in your schema)' },
    baseprefix: {
      control: 'text',
      description: 'Optional: data.baseprefix (URL prefix used when building resource links)',
    },
    cluster: {
      control: 'text',
      description: 'data.cluster (cluster name or template string used for navigation and resource links)',
    },
    reqIndex: {
      control: 'text',
      description: 'data.reqIndex (string; used as multiQueryData["req" + reqIndex])',
    },
    jsonPathToSpec: {
      control: 'text',
      description: 'data.jsonPathToSpec (jsonpath to object containing .containers and .volumes)',
    },
    jsonPathToPodName: {
      control: 'text',
      description: 'Optional: data.jsonPathToPodName (jsonpath to the pod name when req root is not the Pod itself)',
    },
    forcedNamespace: {
      control: 'text',
      description: 'Optional: data.forcedNamespace (templated namespace override, for example "{2}")',
    },
    errorText: {
      control: 'text',
      description: 'data.errorText (shown when req root is missing)',
    },
    containerStyle: {
      control: 'object',
      description: 'Optional: container style applied to the outer wrapper div',
    },
    baseFactoryNamespacedAPIKey: {
      control: 'text',
      description: 'data.baseFactoryNamespacedAPIKey (default factory key for namespaced API resources)',
    },
    baseFactoryClusterSceopedAPIKey: {
      control: 'text',
      description: 'data.baseFactoryClusterSceopedAPIKey (default factory key for cluster-scoped API resources)',
    },
    baseFactoryNamespacedBuiltinKey: {
      control: 'text',
      description: 'data.baseFactoryNamespacedBuiltinKey (default factory key for namespaced builtin resources)',
    },
    baseFactoryClusterSceopedBuiltinKey: {
      control: 'text',
      description:
        'data.baseFactoryClusterSceopedBuiltinKey (default factory key for cluster-scoped builtin resources)',
    },
    baseNavigationPluralName: {
      control: 'text',
      description: 'data.baseNavigationPluralName (plural used to fetch navigation resource)',
    },
    baseNavigationSpecificName: {
      control: 'text',
      description: 'data.baseNavigationSpecificName (name used to fetch navigation resource)',
    },
  },
  render: args => {
    const data: TInner = {
      id: args.id,
      baseprefix: args.baseprefix,
      cluster: args.cluster,
      reqIndex: args.reqIndex,
      jsonPathToSpec: args.jsonPathToSpec,
      jsonPathToPodName: args.jsonPathToPodName,
      forcedNamespace: args.forcedNamespace,
      errorText: args.errorText,
      containerStyle: args.containerStyle,
      baseFactoryNamespacedAPIKey: args.baseFactoryNamespacedAPIKey,
      baseFactoryClusterSceopedAPIKey: args.baseFactoryClusterSceopedAPIKey,
      baseFactoryNamespacedBuiltinKey: args.baseFactoryNamespacedBuiltinKey,
      baseFactoryClusterSceopedBuiltinKey: args.baseFactoryClusterSceopedBuiltinKey,
      baseNavigationPluralName: args.baseNavigationPluralName,
      baseNavigationSpecificName: args.baseNavigationSpecificName,
    }

    return (
      <>
        <VolumesDocsOnly />
        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'Volumes',
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
    docs: {
      description: {
        component:
          'Docs-only story for the **DynamicComponents Volumes** factory. ' +
          'The real component relies on runtime providers and lazy EnrichedTable rendering, so it is not rendered live here. ' +
          'Use controls to tune `data` and copy generated YAML into your factory definitions.',
      },
    },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-volumes',
    baseprefix: '/openapi-ui',
    cluster: '{2}',
    reqIndex: '0',
    jsonPathToSpec: '.data.spec',
    jsonPathToPodName: '.metadata.name',
    forcedNamespace: '{3}',
    errorText: 'No volume mounts found',
    containerStyle: {
      padding: 12,
      border: '1px solid #eee',
      borderRadius: 4,
    },
    baseFactoryNamespacedAPIKey: 'factory-namespaced-api',
    baseFactoryClusterSceopedAPIKey: 'factory-clusterscoped-api',
    baseFactoryNamespacedBuiltinKey: 'factory-namespaced-builtin',
    baseFactoryClusterSceopedBuiltinKey: 'factory-clusterscoped-builtin',
    baseNavigationPluralName: 'navigations',
    baseNavigationSpecificName: 'navigation',
  },
}
