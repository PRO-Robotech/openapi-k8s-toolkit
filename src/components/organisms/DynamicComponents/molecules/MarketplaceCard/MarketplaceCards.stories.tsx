/* eslint-disable max-lines */
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import type { TDynamicComponentsAppTypeMap } from '../../types'

// 🔹 Inner factory props (what goes into `data` in the schema)
type TInner = TDynamicComponentsAppTypeMap['MarketplaceCard']

// 🔹 Extra knobs for explaining the config (no providers here on purpose)
type TArgs = TInner

// A tiny docs-only component so Storybook has something to render
const MarketplaceCardDocsOnly: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p style={{ marginBottom: 8 }}>
      <strong>MarketplaceCard</strong> is a dynamic factory component that wraps the shared&nbsp;
      <code> MarketPlace </code> molecule and wires it to your Kubernetes marketplace resources.
    </p>
    <p style={{ marginBottom: 8 }}>
      It relies on application context (hybrid data provider, URL parts, etc.), so this Storybook entry is&nbsp;
      <strong>docs-only</strong> and does not render the real marketplace card.
    </p>
    <p style={{ marginBottom: 0 }}>
      Use the controls on the right to tweak the <code>data</code> configuration and see the generated YAML snippet that
      you would put into your factory JSON/YAML.
    </p>
  </div>
)

const meta: Meta<TArgs> = {
  title: 'Factory/MarketplaceCard',
  component: MarketplaceCardDocsOnly,
  argTypes: {
    // 🔹 Core factory props
    id: {
      control: 'text',
      description: 'data.id (unique identifier in your schema; can be string or number)',
    },
    cluster: {
      control: 'text',
      description:
        'data.cluster – cluster identifier, can contain placeholders resolved via parseAll / partsOfUrl / multiQueryData',
    },
    namespace: {
      control: 'text',
      description:
        'data.namespace – namespace where marketplace resources live, can also contain placeholders resolved via parseAll',
    },

    baseApiGroup: {
      control: 'text',
      description: 'data.baseApiGroup – API group for the marketplace resource (e.g. in-cloud.io or front.in-cloud.io)',
    },
    baseApiVersion: {
      control: 'text',
      description: 'data.baseApiVersion – API version for the marketplace resource (e.g. v1alpha1)',
    },
    marketplacePlural: {
      control: 'text',
      description: 'data.marketplacePlural – plural name of the marketplace resource (e.g. marketplacepanels)',
    },
    marketplaceKind: {
      control: 'text',
      description: 'data.marketplaceKind – Kubernetes kind of the marketplace resource (e.g. MarketplacePanel)',
    },

    baseprefix: {
      control: 'text',
      description:
        'Optional: data.baseprefix – base path used when constructing navigation links (e.g. /clusters/:cluster/namespaces/:namespace)',
    },
    standalone: {
      control: 'boolean',
      description:
        'Optional: data.standalone – if true, card behaves as a standalone marketplace view instead of being embedded in a larger layout',
    },
    addedMode: {
      control: 'boolean',
      description:
        'Optional: data.addedMode – force the card to behave as if resources are already “added” (implementation detail of the MarketPlace molecule)',
    },
    showZeroResources: {
      control: 'boolean',
      description:
        'Optional: data.showZeroResources – if true, card may render even when no marketplace resources are found',
    },
  },

  render: args => {
    // Build a strongly typed `data` object to show as YAML
    const data: TInner = {
      id: args.id,
      cluster: args.cluster,
      namespace: args.namespace,
      baseApiGroup: args.baseApiGroup,
      baseApiVersion: args.baseApiVersion,
      marketplacePlural: args.marketplacePlural,
      marketplaceKind: args.marketplaceKind,
      baseprefix: args.baseprefix,
      standalone: args.standalone,
      addedMode: args.addedMode,
      showZeroResources: args.showZeroResources,
    }

    return (
      <>
        <MarketplaceCardDocsOnly />
        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'MarketplaceCard',
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
          'Docs-only story for the **DynamicComponents MarketplaceCard** factory. ' +
          'The actual component relies on hybrid data provider, URL parts, and marketplace API resources, so it is not rendered live here. ' +
          'Use the controls to explore the `data` configuration and copy the YAML into your layout definitions.',
      },
    },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-marketplace-card',
    cluster: 'my-cluster',
    namespace: 'my-namespace',
    baseApiGroup: 'in-cloud.io',
    baseApiVersion: 'v1alpha1',
    marketplacePlural: 'marketplacepanels',
    marketplaceKind: 'MarketplacePanel',
    baseprefix: '/openapi-ui',
    standalone: false,
    addedMode: false,
    showZeroResources: false,
  },
}
