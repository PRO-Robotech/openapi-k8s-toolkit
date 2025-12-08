/* eslint-disable max-lines */
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import type { TDynamicComponentsAppTypeMap } from '../../types'

// 🔹 Inner factory props (what goes into `data` in the schema)
type TInner = TDynamicComponentsAppTypeMap['VMVNC']

// 🔹 Extra knobs for explaining the config (no providers / real VNC mount here)
type TArgs = TInner

// A tiny docs-only component so Storybook has something to render
const VMVNCDocsOnly: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p style={{ marginBottom: 8 }}>
      <strong>VMVNC</strong> is a dynamic factory component that wraps the shared
      <code> VMVNC </code> viewer and connects it to a KubeVirt VirtualMachineInstance over VNC.
    </p>
    <p style={{ marginBottom: 8 }}>
      It relies on application context (factory config, URL parts, hybrid data provider, etc.), so this Storybook entry
      is <strong>docs-only</strong> and does not render the real VNC session.
    </p>
    <p style={{ marginBottom: 0 }}>
      Use the controls on the right to tweak the <code>data</code> configuration and see the generated YAML snippet that
      you would put into your factory JSON/YAML.
    </p>
  </div>
)

const meta: Meta<TArgs> = {
  title: 'Factory/VMVNC',
  component: VMVNCDocsOnly,

  argTypes: {
    id: {
      control: 'text',
      description: 'data.id – unique identifier in your schema (string or number)',
    },
    cluster: {
      control: 'text',
      description:
        'data.cluster – optional cluster identifier, can contain placeholders resolved via parseAll / partsOfUrl / multiQueryData',
    },
    namespace: {
      control: 'text',
      description:
        'data.namespace – Kubernetes namespace of the VirtualMachineInstance; can contain placeholders resolved via parseAll',
    },
    vmName: {
      control: 'text',
      description:
        'data.vmName – name of the VirtualMachineInstance to open VNC on; can contain placeholders resolved via parseAll',
    },
    forcedFullWsPath: {
      control: 'text',
      description:
        'Optional: data.forcedFullWsPath – override WebSocket path or full ws(s) URL; ' +
        'if it starts with ws:// or wss:// it is used as-is, otherwise treated as a path under the current host.',
    },
    substractHeight: {
      control: 'number',
      description:
        'Optional: data.substractHeight – pixels to subtract from available height when computing viewer height (default ~400).',
    },
    // If your VMVNC data type has additional props (e.g. scalingMode, showDotCursor),
    // you can expose them here too, e.g.:
    // showDotCursor: {
    //   control: 'boolean',
    //   description: 'Optional: data.showDotCursor – show a small dot cursor when the VM does not send a cursor.',
    // },
    // scalingMode: {
    //   control: 'radio',
    //   options: ['none', 'local', 'remote'],
    //   description:
    //     "Optional: data.scalingMode – 'none' = no scaling, 'local' = scale viewport, 'remote' = resize remote session.",
    // },
  },

  render: args => {
    // Build a strongly typed `data` object to show as YAML
    const data: TInner = {
      id: args.id,
      cluster: args.cluster,
      namespace: args.namespace,
      vmName: args.vmName,
      forcedFullWsPath: args.forcedFullWsPath,
      substractHeight: args.substractHeight,
      // Spread any other fields so Storybook controls can still drive them if present
      // (TS will allow this if extra properties are optional on TInner)
      ...(args as unknown as Record<string, unknown>),
    }

    return (
      <>
        <VMVNCDocsOnly />
        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'VMVNC',
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
          'Docs-only story for the **DynamicComponents VMVNC** factory. ' +
          'The actual component relies on factory config, URL parts, and the hybrid data provider, so it is not rendered live here. ' +
          'Use the controls to explore the `data` configuration and copy the YAML into your layout definitions.',
      },
    },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-vm-vnc',
    cluster: 'my-cluster',
    namespace: 'my-namespace',
    vmName: 'my-virtual-machine',
    forcedFullWsPath: '',
    substractHeight: 400,
    // showDotCursor: false,
    // scalingMode: 'local',
  },
}
