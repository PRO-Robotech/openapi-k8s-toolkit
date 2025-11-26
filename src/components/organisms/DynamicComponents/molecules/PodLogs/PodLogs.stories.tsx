// src/components/organisms/DynamicComponents/molecules/PodLogs/PodLogs.stories.tsx
/* eslint-disable max-lines */
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import type { TDynamicComponentsAppTypeMap } from '../../types'

// 🔹 Inner factory props (what goes into `data` in the schema)
type TInner = TDynamicComponentsAppTypeMap['PodLogs']

// 🔹 Extra knobs for explaining the config (no providers here on purpose)
type TArgs = TInner

// A tiny docs-only component so Storybook has something to render
const PodLogsDocsOnly: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p style={{ marginBottom: 8 }}>
      <strong>PodLogs</strong> is a dynamic factory component that wraps the shared
      <code> PodLogsMonaco </code> editor and streams logs from a Kubernetes Pod.
    </p>
    <p style={{ marginBottom: 8 }}>
      It relies on application context (theme, hybrid data provider, URL parts, smart k8s resource fetching), so this
      Storybook entry is <strong>docs-only</strong> and does not render the real log viewer.
    </p>
    <p style={{ marginBottom: 0 }}>
      Use the controls on the right to tweak the <code>data</code> configuration and see the generated YAML snippet that
      you would put into your factory JSON/YAML.
    </p>
  </div>
)

const meta: Meta<TArgs> = {
  title: 'Factory/PodLogs',
  component: PodLogsDocsOnly,
  argTypes: {
    id: {
      control: 'text',
      description: 'data.id – unique identifier in your schema (string or number)',
    },
    cluster: {
      control: 'text',
      description:
        'data.cluster – cluster identifier, can contain placeholders resolved via parseAll / partsOfUrl / multiQueryData',
    },
    namespace: {
      control: 'text',
      description: 'data.namespace – namespace where the Pod lives; can contain placeholders resolved via parseAll',
    },
    podName: {
      control: 'text',
      description:
        'data.podName – name of the Pod whose logs should be displayed; can contain placeholders resolved via parseAll',
    },
    substractHeight: {
      control: 'number',
      description:
        'Optional: data.substractHeight – pixels to subtract from available height when computing log viewer height (defaults to ~383)',
    },
  },

  render: args => {
    // Build a strongly typed `data` object to show as YAML
    const data: TInner = {
      id: args.id,
      cluster: args.cluster,
      namespace: args.namespace,
      podName: args.podName,
      substractHeight: args.substractHeight,
    }

    return (
      <>
        <PodLogsDocsOnly />
        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'PodLogs',
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
          'Docs-only story for the **DynamicComponents PodLogs** factory. ' +
          'The actual component relies on theme, URL parts, multi-query data, and smart k8s resource fetching, so it is not rendered live here. ' +
          'Use the controls to explore the `data` configuration and copy the YAML into your layout definitions.',
      },
    },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-pod-logs',
    cluster: 'my-cluster',
    namespace: 'my-namespace',
    podName: 'my-pod',
    substractHeight: 340 + 35 + 8,
  },
}
