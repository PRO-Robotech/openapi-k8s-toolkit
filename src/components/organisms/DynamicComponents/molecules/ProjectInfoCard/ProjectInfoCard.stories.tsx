/* eslint-disable max-lines */
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import type { TDynamicComponentsAppTypeMap } from '../../types'

// 🔹 Inner factory props (what goes into `data` in the schema)
type TInner = TDynamicComponentsAppTypeMap['ProjectInfoCard']

// 🔹 Extra knobs for explaining the config (no providers here on purpose)
type TArgs = TInner

// A tiny docs-only component so Storybook has something to render
const ProjectInfoCardDocsOnly: React.FC = () => (
  <div style={{ padding: 16 }}>
    <p style={{ marginBottom: 8 }}>
      <strong>ProjectInfoCard</strong> is a dynamic factory component that wraps the shared
      <code> ProjectInfoCard </code> molecule and shows project metadata & related resources.
    </p>
    <p style={{ marginBottom: 8 }}>
      It relies on application context (hybrid data provider, URL parts, etc.), so this Storybook entry is{' '}
      <strong>docs-only</strong> and does not render the real card.
    </p>
    <p style={{ marginBottom: 0 }}>
      Use the controls on the right to tweak the <code>data</code> configuration and see the generated YAML snippet that
      you would put into your factory JSON/YAML.
    </p>
  </div>
)

const meta: Meta<TArgs> = {
  title: 'Factory/ProjectInfoCard',
  component: ProjectInfoCardDocsOnly,
  argTypes: {
    // 🔹 Core factory props
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
      description:
        'data.namespace – namespace for the project, can contain placeholders resolved via parseAll / partsOfUrl / multiQueryData',
    },

    baseApiGroup: {
      control: 'text',
      description: 'data.baseApiGroup – API group used for related resources (e.g. in-cloud.io)',
    },
    baseApiVersion: {
      control: 'text',
      description: 'data.baseApiVersion – API version for related resources (e.g. v1alpha1)',
    },
    baseProjectApiGroup: {
      control: 'text',
      description: 'data.baseProjectApiGroup – API group for the Project CRD (e.g. in-cloud.io)',
    },
    baseProjectVersion: {
      control: 'text',
      description: 'data.baseProjectVersion – API version for the Project CRD (e.g. v1alpha1)',
    },
    projectPlural: {
      control: 'text',
      description: 'data.projectPlural – plural name of the Project resource (e.g. projects)',
    },
    marketplacePlural: {
      control: 'text',
      description: 'data.marketplacePlural – plural name of related marketplace resources (e.g. marketplacepanels)',
    },

    accessGroups: {
      control: 'object',
      description:
        'data.accessGroups – array of template strings for access groups; each value is parsed via parseAll against URL parts & multiQueryData',
    },

    baseprefix: {
      control: 'text',
      description:
        'Optional: data.baseprefix – base path used when constructing navigation links (e.g. /clusters/:cluster/namespaces/:namespace)',
    },
    showZeroResources: {
      control: 'boolean',
      description:
        'Optional: data.showZeroResources – if true, card may render even when no related resources are found',
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
      baseProjectApiGroup: args.baseProjectApiGroup,
      baseProjectVersion: args.baseProjectVersion,
      projectPlural: args.projectPlural,
      marketplacePlural: args.marketplacePlural,
      accessGroups: args.accessGroups,
      baseprefix: args.baseprefix,
      showZeroResources: args.showZeroResources,
    }

    return (
      <>
        <ProjectInfoCardDocsOnly />
        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={260}
          value={yaml.stringify({
            type: 'ProjectInfoCard',
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
          'Docs-only story for the **DynamicComponents ProjectInfoCard** factory. ' +
          'The actual component relies on hybrid data provider, URL parts, and project/marketplace APIs, so it is not rendered live here. ' +
          'Use the controls to explore the `data` configuration and copy the YAML into your layout definitions.',
      },
    },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-project-info-card',
    cluster: 'my-cluster',
    namespace: 'my-namespace',
    baseApiGroup: 'in-cloud.io',
    baseApiVersion: 'v1alpha1',
    baseProjectApiGroup: 'in-cloud.io',
    baseProjectVersion: 'v1alpha1',
    projectPlural: 'projects',
    marketplacePlural: 'marketplacepanels',
    accessGroups: ['project-admins', 'project-viewers'],
    baseprefix: '/openapi-ui',
    showZeroResources: false,
  },
}
