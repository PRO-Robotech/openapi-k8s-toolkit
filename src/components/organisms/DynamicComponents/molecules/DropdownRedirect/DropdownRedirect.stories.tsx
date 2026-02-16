import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import type { TDynamicComponentsAppTypeMap } from '../../types'

type TInner = TDynamicComponentsAppTypeMap['DropdownRedirect']
type TArgs = TInner

const DropdownRedirectDocsOnly: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p style={{ marginBottom: 8 }}>
      <strong>DropdownRedirect</strong> is a dynamic factory component that renders a dropdown populated with resources
      fetched via <code>useK8sSmartResource</code>. Selecting an option navigates to a templated URL.
    </p>
    <p style={{ marginBottom: 8 }}>
      It relies on application context (hybrid data provider, URL parts, smart K8s resource fetching), so this Storybook
      entry is <strong>docs-only</strong> and does not render the real dropdown.
    </p>
    <p style={{ marginBottom: 8 }}>
      <strong>Key features:</strong>
    </p>
    <ul style={{ marginBottom: 8, paddingLeft: 20 }}>
      <li>Fetches resources using list-then-watch parameters (cluster, apiVersion, namespace, plural)</li>
      <li>
        Extracts dropdown options via JSONPath (e.g., <code>.metadata.name</code>)
      </li>
      <li>
        Supports URL templating with <code>{'{chosenEntryValue}'}</code> placeholder
      </li>
      <li>Works with any K8s resource type (Pods, Nodes, CRDs, etc.)</li>
    </ul>
    <p style={{ marginBottom: 0 }}>
      Use the controls on the right to tweak the <code>data</code> configuration and see the generated YAML snippet.
    </p>
  </div>
)

const meta: Meta<TArgs> = {
  title: 'Factory/DropdownRedirect',
  component: DropdownRedirectDocsOnly,
  argTypes: {
    id: {
      control: 'text',
      description: 'data.id – unique identifier in your schema (string or number)',
    },
    cluster: {
      control: 'text',
      description: 'data.cluster – cluster identifier, supports templating (e.g., "{2}")',
    },
    apiVersion: {
      control: 'text',
      description: 'data.apiVersion – K8s API version (e.g., "v1", "apps/v1")',
    },
    apiGroup: {
      control: 'text',
      description: 'data.apiGroup – optional API group for CRDs',
    },
    namespace: {
      control: 'text',
      description: 'data.namespace – optional namespace, supports templating (e.g., "{3}"). Omit for cluster-scoped.',
    },
    plural: {
      control: 'text',
      description: 'data.plural – resource plural name (e.g., "pods", "nodes", "deployments")',
    },
    jsonPath: {
      control: 'text',
      description: 'data.jsonPath – JSONPath to extract option values (e.g., ".metadata.name")',
    },
    redirectUrl: {
      control: 'text',
      description:
        'data.redirectUrl – URL template with {chosenEntryValue} placeholder and other templating (e.g., "/openapi-ui/{2}/{3}/factory/pod-details/{chosenEntryValue}")',
    },
    currentValue: {
      control: 'text',
      description:
        'data.currentValue – currently selected value, supports templating. Use URL segment (e.g., "{6}") for immediate availability.',
    },
    placeholder: {
      control: 'text',
      description: 'data.placeholder – placeholder text (default: "Select...")',
    },
    showSearch: {
      control: 'boolean',
      description: 'data.showSearch – enable search/filter in dropdown (default: true)',
    },
    style: {
      control: 'object',
      description: 'data.style – inline CSS styles',
    },
    popupMatchSelectWidth: {
      control: 'select',
      options: [undefined, true, false, 150, 200, 250, 300],
      description:
        'data.popupMatchSelectWidth – whether popup matches dropdown select width (default: true). Can be boolean or number for specific min-width.',
    },
  },

  render: args => {
    const data: TInner = {
      id: args.id,
      cluster: args.cluster,
      apiVersion: args.apiVersion,
      apiGroup: args.apiGroup,
      namespace: args.namespace,
      plural: args.plural,
      jsonPath: args.jsonPath,
      redirectUrl: args.redirectUrl,
      currentValue: args.currentValue,
      placeholder: args.placeholder,
      showSearch: args.showSearch,
      style: args.style,
      popupMatchSelectWidth: args.popupMatchSelectWidth,
    }

    return (
      <>
        <DropdownRedirectDocsOnly />
        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={340}
          value={yaml.stringify({
            type: 'DropdownRedirect',
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
          'Docs-only story for the **DynamicComponents DropdownRedirect** factory. ' +
          'The actual component relies on URL parts, multi-query data, and smart K8s resource fetching, so it is not rendered live here. ' +
          'Use the controls to explore the `data` configuration and copy the YAML into your layout definitions.',
      },
    },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const PodsInNamespace: Story = {
  args: {
    id: 'pod-dropdown',
    cluster: '{2}',
    apiVersion: 'v1',
    apiGroup: undefined,
    namespace: '{3}',
    plural: 'pods',
    jsonPath: '.metadata.name',
    redirectUrl: '/openapi-ui/{2}/{3}/factory/pod-details/{chosenEntryValue}',
    currentValue: '{6}',
    placeholder: 'Select pod...',
    showSearch: true,
    style: undefined,
    popupMatchSelectWidth: undefined,
  },
}

export const NodesClusterScoped: Story = {
  args: {
    id: 'node-dropdown',
    cluster: '{2}',
    apiVersion: 'v1',
    apiGroup: undefined,
    namespace: undefined,
    plural: 'nodes',
    jsonPath: '.metadata.name',
    redirectUrl: '/openapi-ui/{2}/nodes/factory/node-details/{chosenEntryValue}',
    currentValue: '{5}',
    placeholder: 'Select node...',
    showSearch: true,
    style: undefined,
    popupMatchSelectWidth: undefined,
  },
}

export const DeploymentsInNamespace: Story = {
  args: {
    id: 'deployment-dropdown',
    cluster: '{2}',
    apiVersion: 'v1',
    apiGroup: 'apps',
    namespace: '{3}',
    plural: 'deployments',
    jsonPath: '.metadata.name',
    redirectUrl: '/openapi-ui/{2}/{3}/factory/deployment-details/{chosenEntryValue}',
    currentValue: '{6}',
    placeholder: 'Select deployment...',
    showSearch: true,
    style: undefined,
    popupMatchSelectWidth: undefined,
  },
}

export const CustomResourceDefinition: Story = {
  args: {
    id: 'crd-dropdown',
    cluster: '{2}',
    apiVersion: 'v1',
    apiGroup: 'example.com',
    namespace: '{3}',
    plural: 'myresources',
    jsonPath: '.metadata.name',
    redirectUrl: '/openapi-ui/{2}/{3}/factory/myresource-details/{chosenEntryValue}',
    currentValue: '{6}',
    placeholder: 'Select resource...',
    showSearch: true,
    style: undefined,
    popupMatchSelectWidth: undefined,
  },
}

export const AllPodsAcrossNamespaces: Story = {
  args: {
    id: 'all-pods-dropdown',
    cluster: '{2}',
    apiVersion: 'v1',
    apiGroup: undefined,
    namespace: undefined,
    plural: 'pods',
    jsonPath: '.metadata.name',
    redirectUrl: '/openapi-ui/{2}/{3}/factory/pod-details/{chosenEntryValue}',
    currentValue: '{6}',
    placeholder: 'Select pod (all namespaces)...',
    showSearch: true,
    style: undefined,
    popupMatchSelectWidth: undefined,
  },
}

export const WithCustomPopupWidth: Story = {
  args: {
    id: 'wide-popup-dropdown',
    cluster: '{2}',
    apiVersion: 'v1',
    apiGroup: undefined,
    namespace: '{3}',
    plural: 'pods',
    jsonPath: '.metadata.name',
    redirectUrl: '/openapi-ui/{2}/{3}/factory/pod-details/{chosenEntryValue}',
    currentValue: '{6}',
    placeholder: 'Select pod...',
    showSearch: true,
    style: undefined,
    popupMatchSelectWidth: 300,
  },
}
