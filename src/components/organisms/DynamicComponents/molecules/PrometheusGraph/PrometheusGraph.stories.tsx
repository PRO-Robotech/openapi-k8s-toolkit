/* eslint-disable max-lines */
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import type { TDynamicComponentsAppTypeMap } from '../../types'

// 🔹 Inner factory props (what goes into `data` in the schema)
type TInner = TDynamicComponentsAppTypeMap['PrometheusGraph']

// 🔹 Extra knobs for explaining the config (no providers here on purpose)
type TArgs = TInner

// A tiny docs-only component so Storybook has something to render
const PrometheusGraphDocsOnly: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p style={{ marginBottom: 8 }}>
      <strong>PrometheusGraph</strong> is a dynamic factory component that chooses a graph organism by{' '}
      <code>data.type</code> and forwards the rest of the config as props.
    </p>
    <p style={{ marginBottom: 8 }}>
      It relies on app context (<code>useMultiQuery</code>, <code>usePartsOfUrl</code>, and template parsing via{' '}
      <code>parseAll</code>), so this Storybook entry is <strong>docs-only</strong> and does not render the real graph.
    </p>
    <p style={{ marginBottom: 0 }}>
      Use the controls to tweak the <code>data</code> configuration and copy the generated YAML snippet into your
      factory JSON/YAML.
    </p>
  </div>
)

const GRAPH_TYPES = [
  'MatrixToAreaMulti',
  'MatrixToAreaSingle',
  'MatrixToAreaStacked',
  'MatrixToLineMulti',
  'MatrixToLineSingle',
  'MatrixToReducedBar',
  'MatrixToTableRows',
  'VectorToBarGauge',
  'VectorToBarHorizontal',
  'VectorToBarVertical',
  'VectorToGaugeRadial',
  'VectorToPie',
  'VectorToTableRows',
  'ScalarToGauge',
  'ScalarToStat',
] as const

const meta: Meta<TArgs> = {
  title: 'Factory/PrometheusGraph',
  component: PrometheusGraphDocsOnly,
  argTypes: {
    // 🔹 Core factory props
    id: { control: 'text', description: 'data.id (unique identifier in your schema)' },

    type: {
      control: { type: 'select' },
      options: GRAPH_TYPES as unknown as string[],
      description: 'data.type (selects which graph organism is rendered)',
    },

    // 🔹 Layout
    width: { control: 'text', description: "data.width (CSS width: e.g. '100%', 600, '40rem')" },
    height: { control: 'text', description: "data.height (CSS height: e.g. 260, '260px')" },

    // 🔹 Prometheus connectivity / query
    baseUrl: {
      control: 'text',
      description: 'Optional: data.baseUrl (Prometheus base URL; often parsed via placeholders in real app)',
    },
    query: {
      control: 'text',
      description: 'Optional: data.query (PromQL). Parsed via parseAll in the real component.',
    },
    range: {
      control: 'text',
      description: "Optional: data.range (e.g. '5m', '1h', '24h')",
    },

    // 🔹 Refresh & display
    refetchInterval: {
      control: 'number',
      description:
        'Optional: data.refetchInterval (ms) or false to disable polling. Forwarded to organism/query logic.',
    },
    title: {
      control: 'text',
      description: 'Optional: data.title (string shown by organism). Parsed via parseAll in the real component.',
    },

    // 🔹 Value constraints / reduction
    min: { control: 'number', description: 'Optional: data.min (y-axis/value lower bound)' },
    max: { control: 'number', description: 'Optional: data.max (y-axis/value upper bound)' },
    mode: {
      control: { type: 'select' },
      options: ['last', 'avg', 'sum', 'max', 'min'],
      description: "Optional: data.mode (how to reduce values: 'last' | 'avg' | 'sum' | 'max' | 'min')",
    },
    topN: { control: 'number', description: 'Optional: data.topN (limit to top-N series/items)' },
    formatter: {
      control: { type: 'select' },
      options: ['bytes', 'cores'],
      description: 'Optional: data.formatter (value formatter applied to y-axis and table values)',
    },
    dateFormatter: {
      control: 'object',
      description: 'Optional: data.dateFormatter (timestamp formatter for x-axis/table dates)',
    },
  },

  render: args => {
    // Build a strongly typed `data` object to show as YAML
    const data: TInner = {
      id: args.id,
      type: args.type,
      width: args.width,
      height: args.height,
      baseUrl: args.baseUrl,
      query: args.query,
      refetchInterval: args.refetchInterval,
      range: args.range,
      title: args.title,
      min: args.min,
      max: args.max,
      mode: args.mode,
      topN: args.topN,
      formatter: args.formatter,
      dateFormatter: args.dateFormatter,
    }

    return (
      <>
        <PrometheusGraphDocsOnly />
        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'PrometheusGraph',
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
          'Docs-only story for the **DynamicComponents PrometheusGraph** factory. ' +
          'The real component depends on `useMultiQuery`, `usePartsOfUrl`, and `parseAll`, so it is not rendered live. ' +
          'Use the controls to explore the `data` config and copy the YAML into layout definitions.',
      },
    },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-prometheus-graph',
    type: 'MatrixToLineSingle',
    width: '100%',
    height: 260,
    baseUrl: '/api/prometheus',
    query: 'sum(rate(container_cpu_usage_seconds_total[5m]))',
    refetchInterval: 30_000,
    range: '1h',
    title: 'CPU usage (cores)',
    formatter: 'cores',
    min: 0,
    max: undefined,
    mode: 'avg',
    topN: 5,
  },
}
