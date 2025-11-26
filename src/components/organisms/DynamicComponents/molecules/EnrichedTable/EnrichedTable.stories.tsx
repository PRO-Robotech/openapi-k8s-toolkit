// src/components/organisms/DynamicComponents/molecules/EnrichedTable/EnrichedTable.stories.tsx
/* eslint-disable max-lines */
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import type { TDynamicComponentsAppTypeMap } from '../../types'

// 🔹 Inner factory props (what goes into `data` in the schema)
type TInner = TDynamicComponentsAppTypeMap['EnrichedTable']

// 🔹 Extra knobs for explaining the config (no providers here on purpose)
type TArgs = TInner

// A tiny docs-only component so Storybook has something to render
const EnrichedTableDocsOnly: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p style={{ marginBottom: 8 }}>
      <strong>EnrichedTable</strong> is a dynamic factory component that wraps the shared
      <code> EnrichedTableProvider </code> and a rich table renderer.
    </p>
    <p style={{ marginBottom: 8 }}>
      It relies heavily on application context (router, permissions, data fetching, BFF table configs), so this
      Storybook entry is <strong>docs-only</strong> and does not render the real table.
    </p>
    <p style={{ marginBottom: 0 }}>
      Use the controls on the right to tweak the <code>data</code> configuration and see the generated YAML snippet that
      you would put into your factory JSON/YAML.
    </p>
  </div>
)

const meta: Meta<TArgs> = {
  title: 'Factory/EnrichedTable',
  component: EnrichedTableDocsOnly,
  argTypes: {
    // 🔹 Core factory props
    id: { control: 'text', description: 'data.id (unique identifier in your schema)' },
    cluster: {
      control: 'text',
      description: 'data.cluster (can contain placeholders resolved via parseAll)',
    },
    fetchUrl: {
      control: 'text',
      description:
        'Optional: data.fetchUrl – if provided, table fetches items via HTTP from this URL instead of k8s websocket',
    },
    k8sResourceToFetch: {
      control: 'object',
      description:
        'Optional: data.k8sResourceToFetch – if provided, table watches k8s resources via websocket (cluster, apiGroup, apiVersion, plural, namespace)',
    },
    pathToItems: {
      control: 'object',
      description: 'data.pathToItems – jsonpath string or string[] path to the items array inside fetched data',
    },
    additionalReqsDataToEachItem: {
      control: 'object',
      description:
        'Optional: data.additionalReqsDataToEachItem – array of req indices, each value is merged into every row as `additionalReqsData`',
    },
    labelSelector: {
      control: 'object',
      description:
        'Optional: data.labelSelector – simple map of label key->template value (parsed via parseAll) used to build labelSelector query param',
    },
    labelSelectorFull: {
      control: 'object',
      description:
        'Optional: data.labelSelectorFull – { reqIndex, pathToLabels } used to extract full labelSelector from another request',
    },
    fieldSelector: {
      control: 'object',
      description:
        'Optional: data.fieldSelector – map of field key->template value (parsed via parseAll) used to build fieldSelector query param',
    },

    // 🔹 Props coming from TEnrichedTableProviderProps (exposed in the schema)
    customizationId: {
      control: 'text',
      description: 'Optional: customizationId used by BFF to pick table columns / layout presets',
    },
    forceDefaultAdditionalPrinterColumns: {
      control: 'object',
      description:
        'Optional: override additionalPrinterColumns coming from the server (rare – mostly for special cases)',
    },
    dataForControls: {
      control: 'object',
      description:
        'Optional: dataForControls – describes which resource is controlled by Add/Edit/Delete toolbar (cluster, apiGroup, apiVersion, plural, syntheticProject)',
    },
    k8sResource: {
      control: 'object',
      description:
        'Optional: k8sResource – describes which resource schema to use for table columns (plural, apiGroup, apiVersion)',
    },
    baseprefix: {
      control: 'text',
      description: 'Optional: baseprefix – used when constructing links to forms / navigation',
    },
    selectData: {
      control: false,
      description:
        'Reserved: selectData is injected internally by factory – you should not set this in the schema directly',
    },
    tableProps: {
      control: false,
      description:
        'Reserved: tableProps are mostly controlled internally; dynamic factory sets pagination, icons, etc.',
    },
    withoutControls: {
      control: false,
      description:
        'Reserved: withoutControls is derived from presence/absence of dataForControls; not usually set manually.',
    },
  },

  render: args => {
    // Build a strongly typed `data` object to show as YAML
    const data: TInner = {
      id: args.id,
      cluster: args.cluster,
      fetchUrl: args.fetchUrl,
      k8sResourceToFetch: args.k8sResourceToFetch,
      pathToItems: args.pathToItems,
      additionalReqsDataToEachItem: args.additionalReqsDataToEachItem,
      labelSelector: args.labelSelector,
      labelSelectorFull: args.labelSelectorFull,
      fieldSelector: args.fieldSelector,
      customizationId: args.customizationId,
      forceDefaultAdditionalPrinterColumns: args.forceDefaultAdditionalPrinterColumns,
      dataForControls: args.dataForControls,
      k8sResource: args.k8sResource,
      baseprefix: args.baseprefix,
      // NOTE: selectData / tableProps / withoutControls are intentionally NOT included here,
      // they are internal wiring of the EnrichedTableProvider and not meant to be authored in config.
    }

    return (
      <>
        <EnrichedTableDocsOnly />
        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'EnrichedTable',
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
          'Docs-only story for the **DynamicComponents EnrichedTable** factory. ' +
          'The actual component relies on router, permissions, and BFF endpoints, so it is not rendered live here. ' +
          'Use the controls to explore the `data` configuration and copy the YAML into your layout definitions.',
      },
    },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-enriched-table',
    cluster: 'my-cluster',
    fetchUrl: '/api/clusters/my-cluster/custom/resource',
    k8sResourceToFetch: undefined,
    pathToItems: '.items',
    additionalReqsDataToEachItem: undefined,
    labelSelector: undefined,
    labelSelectorFull: undefined,
    fieldSelector: undefined,
    customizationId: 'example-enriched-table',
    forceDefaultAdditionalPrinterColumns: undefined,
    dataForControls: {
      cluster: 'my-cluster',
      plural: 'pods',
      apiVersion: 'v1',
    },
    k8sResource: {
      plural: 'pods',
      apiVersion: 'v1',
    },
    baseprefix: '/openapi-ui',
  },
}
