// src/components/organisms/DynamicComponents/molecules/NodeTerminal/NodeTerminal.stories.tsx
/* eslint-disable max-lines */
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import type { TDynamicComponentsAppTypeMap } from '../../types'

// 🔹 Inner factory props (what goes into `data` in the schema)
type TInner = TDynamicComponentsAppTypeMap['NodeTerminal']

// 🔹 Extra knobs for explaining the config (no providers here on purpose)
type TArgs = TInner

// A tiny docs-only component so Storybook has something to render
const NodeTerminalDocsOnly: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p style={{ marginBottom: 8 }}>
      <strong>NodeTerminal</strong> is a dynamic factory component that wraps the shared
      <code> NodeTerminal </code> console UI and connects it to a Kubernetes node.
    </p>
    <p style={{ marginBottom: 8 }}>
      It relies on application context (factory config, URL parts, hybrid data provider), so this Storybook entry is{' '}
      <strong>docs-only</strong> and does not render the real terminal.
    </p>
    <p style={{ marginBottom: 0 }}>
      Use the controls on the right to tweak the <code>data</code> configuration and see the generated YAML snippet that
      you would put into your factory JSON/YAML.
    </p>
  </div>
)

const meta: Meta<TArgs> = {
  title: 'Factory/NodeTerminal',
  component: NodeTerminalDocsOnly,
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
    nodeName: {
      control: 'text',
      description:
        'data.nodeName – name of the node to open the terminal on; can contain placeholders resolved via parseAll',
    },
    substractHeight: {
      control: 'number',
      description:
        'Optional: data.substractHeight – pixels to subtract from available height when computing terminal height (default ~340)',
    },
  },

  render: args => {
    // Build a strongly typed `data` object to show as YAML
    const data: TInner = {
      id: args.id,
      cluster: args.cluster,
      nodeName: args.nodeName,
      substractHeight: args.substractHeight,
    }

    return (
      <>
        <NodeTerminalDocsOnly />
        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'NodeTerminal',
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
          'Docs-only story for the **DynamicComponents NodeTerminal** factory. ' +
          'The actual component relies on factory config, URL parts, and hybrid data provider, so it is not rendered live here. ' +
          'Use the controls to explore the `data` configuration and copy the YAML into your layout definitions.',
      },
    },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-node-terminal',
    cluster: 'my-cluster',
    nodeName: 'worker-node-1',
    substractHeight: 340,
  },
}
