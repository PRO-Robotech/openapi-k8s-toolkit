// .storybook/docs/Intro.stories.tsx
import React, { FC } from 'react'
import { theme as antdTheme } from 'antd'
import type { Meta, StoryObj } from '@storybook/react'

const IntroPage: FC = () => {
  const { token } = antdTheme.useToken()

  return (
    <div style={{ background: token.colorBgLayout, minHeight: '100vh' }}>
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', color: token.colorText }}>
    <h1 style={{ fontSize: 32, marginBottom: 8 }}>🚀 Welcome to openapi-k8s-toolkit</h1>

    <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 24 }}>
      A dynamic UI toolkit built around Kubernetes resources and factory-driven layouts.
    </p>

    <hr style={{ margin: '24px 0', opacity: 0.2 }} />

    <h2 style={{ fontSize: 22, marginBottom: 8 }}>📦 What’s in this Storybook?</h2>
    <ul style={{ lineHeight: 1.6 }}>
      <li>Docs-only stories for dynamic factory components.</li>
      <li>
        Controls to tweak <code>data</code> configs and copy the generated YAML.
      </li>
      <li>
        Examples for things like <code>EnrichedTable</code>, <code>Events</code>, <code>MarketplaceCard</code>,{' '}
        <code>ProjectInfoCard</code>, <code>PodLogs</code>, <code>PodTerminal</code>, <code>NodeTerminal</code>, and
        more.
      </li>
    </ul>

    <hr style={{ margin: '24px 0', opacity: 0.2 }} />

    <h2 style={{ fontSize: 22, marginBottom: 8 }}>📄 Example YAML</h2>
    <pre
      style={{
        background: '#020617',
        color: '#e5e7eb',
        padding: 12,
        borderRadius: 6,
        fontSize: 13,
        overflowX: 'auto',
      }}
    >
      {`type: EnrichedTable
data:
  id: example-enriched-table
  cluster: my-cluster
  fetchUrl: "/api/clusters/my-cluster/custom/resource"
`}
    </pre>

    <hr style={{ margin: '24px 0', opacity: 0.2 }} />

    <h2 style={{ fontSize: 22, marginBottom: 8 }}>ℹ️ How to use this Storybook</h2>
    <ol style={{ lineHeight: 1.6 }}>
      <li>
        Pick a factory component in the sidebar (e.g. <code>Factory/EnrichedTable</code>).
      </li>
      <li>
        Use Controls to tweak its <code>data</code> configuration.
      </li>
      <li>Copy the YAML from the editor into your layout/factory config.</li>
    </ol>
      </div>
    </div>
  )
}

const meta: Meta<typeof IntroPage> = {
  title: 'Welcome',
  component: IntroPage,
  parameters: {
    options: {
      initialActive: 'overview',
    },
  },
}

export default meta

type IntroStory = StoryObj<typeof IntroPage>

// Empty story – we only care about the custom docs.page above
export const Overview: IntroStory = {}
