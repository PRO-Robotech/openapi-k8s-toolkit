/* eslint-disable max-lines */
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import type { TDynamicComponentsAppTypeMap } from '../../types'

// 🔹 Inner factory props (what goes into `data` in the schema)
type TInner = TDynamicComponentsAppTypeMap['Events']

// 🔹 Extra knobs for explaining the config (no providers here on purpose)
type TArgs = TInner

// A tiny docs-only component so Storybook has something to render
const EventsDocsOnly: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p style={{ marginBottom: 8 }}>
      <strong>Events</strong> is a dynamic factory component that wires websocket-backed Kubernetes events into a shared{' '}
      <code>Events</code> UI (list/table) via application providers.
    </p>
    <p style={{ marginBottom: 8 }}>
      It relies heavily on application context (router, theme, hybrid data provider, URL parts), so this Storybook entry
      is <strong>docs-only</strong> and does not render the real events view.
    </p>
    <p style={{ marginBottom: 0 }}>
      Use the controls on the right to tweak the <code>data</code> configuration and see the generated YAML snippet that
      you would put into your factory JSON/YAML.
    </p>
  </div>
)

const meta: Meta<TArgs> = {
  title: 'Factory/Events',
  component: EventsDocsOnly,
  argTypes: {
    // 🔹 Core factory props
    id: {
      control: 'text',
      description: 'data.id (unique identifier in your schema; string or number)',
    },
    baseprefix: {
      control: 'text',
      description:
        'Optional: data.baseprefix – base path used when constructing navigation links (e.g. /clusters/:cluster)',
    },
    cluster: {
      control: 'text',
      description:
        'data.cluster – cluster identifier, can contain placeholders resolved via parseAll / partsOfUrl / multiQueryData',
    },
    wsUrl: {
      control: 'text',
      description:
        'data.wsUrl – websocket URL to stream Kubernetes events (can contain placeholders resolved via parseAll)',
    },
    pageSize: {
      control: 'number',
      description: 'Optional: data.pageSize – page size for the events list/table',
    },
    substractHeight: {
      control: 'number',
      description:
        'Optional: data.substractHeight – pixels to subtract from available height when computing events view height',
    },
    limit: {
      control: 'number',
      description:
        'Optional: data.limit – query param `limit` applied to the events endpoint (max number of events to fetch)',
    },
    labelSelector: {
      control: 'object',
      description:
        'Optional: data.labelSelector – simple map of label key->template value (parsed via parseAll) used to build labelSelector query param',
    },
    labelSelectorFull: {
      control: 'object',
      description:
        'Optional: data.labelSelectorFull – { reqIndex, pathToLabels } used to extract full labelSelector from another request (hybrid data provider)',
    },
    fieldSelector: {
      control: 'object',
      description:
        'Optional: data.fieldSelector – map of field key->template value (parsed via parseAll) used to build fieldSelector query param',
    },

    baseFactoryNamespacedAPIKey: {
      control: 'text',
      description:
        'data.baseFactoryNamespacedAPIKey – key for base namespaced API factory (used to build resource URLs)',
    },
    baseFactoryClusterSceopedAPIKey: {
      control: 'text',
      description:
        'data.baseFactoryClusterSceopedAPIKey – key for base cluster-scoped API factory (used to build resource URLs)',
    },
    baseFactoryNamespacedBuiltinKey: {
      control: 'text',
      description:
        'data.baseFactoryNamespacedBuiltinKey – key for base namespaced builtin factory (used to build resource URLs)',
    },
    baseFactoryClusterSceopedBuiltinKey: {
      control: 'text',
      description:
        'data.baseFactoryClusterSceopedBuiltinKey – key for base cluster-scoped builtin factory (used to build resource URLs)',
    },
    baseNamespaceFactoryKey: {
      control: 'text',
      description:
        'data.baseNamespaceFactoryKey – key describing the namespace-level factory (used for navigation / links)',
    },
    baseNavigationPlural: {
      control: 'text',
      description:
        'data.baseNavigationPlural – base plural resource name used when constructing navigation paths for events',
    },
    baseNavigationName: {
      control: 'text',
      description:
        'data.baseNavigationName – base resource name used when constructing navigation paths for a single resource',
    },
  },

  render: args => {
    // Build a strongly typed `data` object to show as YAML
    const data: TInner = {
      id: args.id,
      baseprefix: args.baseprefix,
      cluster: args.cluster,
      wsUrl: args.wsUrl,
      pageSize: args.pageSize,
      substractHeight: args.substractHeight,
      limit: args.limit,
      labelSelector: args.labelSelector,
      labelSelectorFull: args.labelSelectorFull,
      fieldSelector: args.fieldSelector,
      baseFactoryNamespacedAPIKey: args.baseFactoryNamespacedAPIKey,
      baseFactoryClusterSceopedAPIKey: args.baseFactoryClusterSceopedAPIKey,
      baseFactoryNamespacedBuiltinKey: args.baseFactoryNamespacedBuiltinKey,
      baseFactoryClusterSceopedBuiltinKey: args.baseFactoryClusterSceopedBuiltinKey,
      baseNamespaceFactoryKey: args.baseNamespaceFactoryKey,
      baseNavigationPlural: args.baseNavigationPlural,
      baseNavigationName: args.baseNavigationName,
    }

    return (
      <>
        <EventsDocsOnly />
        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'Events',
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
          'Docs-only story for the **DynamicComponents Events** factory. ' +
          'The actual component relies on router, theme, URL parts, and hybrid data provider, so it is not rendered live here. ' +
          'Use the controls to explore the `data` configuration and copy the YAML into your layout definitions.',
      },
    },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-events',
    baseprefix: '/openapi-ui',
    cluster: 'my-cluster',
    wsUrl: 'wss://example.com/api/clusters/my-cluster/events',
    pageSize: 50,
    substractHeight: 340,
    limit: 200,
    labelSelector: undefined,
    labelSelectorFull: undefined,
    fieldSelector: undefined,
    baseFactoryNamespacedAPIKey: 'base-factory-namespaced-api',
    baseFactoryClusterSceopedAPIKey: 'base-factory-clusterscoped-api',
    baseFactoryNamespacedBuiltinKey: 'base-factory-builtin-api',
    baseFactoryClusterSceopedBuiltinKey: 'base-factory-clusterscoped-buitin',
    baseNamespaceFactoryKey: 'namespaces',
    baseNavigationPlural: 'navigations',
    baseNavigationName: 'navigation',
  },
}
