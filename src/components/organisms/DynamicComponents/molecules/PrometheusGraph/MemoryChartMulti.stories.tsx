// src/components/organisms/DynamicComponents/molecules/PrometheusGraph/MemoryChart.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { MemoryChartMulti } from './MemoryChartMulti'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = {
  range?: string
}

type TProviderArgs = {
  isLoading: boolean
  isError: boolean
  errors: { message: string }[]
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
}

type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/Prometheus/MemoryChartMulti (PoW; not exported)',
  component: MemoryChartMulti as any,
  argTypes: {
    // MemoryChart props
    range: {
      control: 'text',
      description: 'Time range string passed to Prometheus query_range, e.g. "1h", "6h", "24h"',
    },

    // provider knobs (для соответствия стилю Toggler.stories)
    isLoading: {
      control: 'boolean',
      description: 'useMultiQuery.isLoading (simulated, for SmartProvider only)',
    },
    isError: {
      control: 'boolean',
      description: 'useMultiQuery.isError (simulated, for SmartProvider only)',
    },
    errors: {
      control: 'object',
      description: 'useMultiQuery.errors (simulated, for SmartProvider only)',
    },
    multiQueryData: {
      control: 'object',
      description: 'mock multiQuery data (object with req{index} keys, passed to SmartProvider)',
    },
    partsOfUrl: {
      control: 'object',
      description: 'mocked partsOfUrl.partsOfUrl array (passed to SmartProvider)',
    },
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
      description: 'Mock UI Theme context (passed to SmartProvider)',
    },
  },

  render: args => {
    const data: TInner = {
      range: args.range,
    }

    return (
      <>
        <SmartProvider
          multiQueryValue={{
            data: args.multiQueryData,
            isLoading: args.isLoading,
            isError: args.isError,
            errors: args.errors,
          }}
          partsOfUrl={args.partsOfUrl}
          theme={args.theme}
        >
          <div style={{ padding: 16 }}>
            <MemoryChartMulti range={data.range} />
          </div>
        </SmartProvider>

        <div style={{ marginTop: '150px' }}>
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
        </div>
      </>
    )
  },

  parameters: {
    controls: { expanded: true },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    range: '1h',

    // SmartProvider mocks (ничего не ломают, просто для консистентности)
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {
      // можно что-то положить, если SmartProvider что-то рисует
    },
    partsOfUrl: [],
    theme: 'light',
  },
}

export const SixHours: Story = {
  args: {
    ...Default.args,
    range: '6h',
  },
}

export const OneDay: Story = {
  args: {
    ...Default.args,
    range: '24h',
  },
}

export const DarkTheme: Story = {
  args: {
    ...Default.args,
    theme: 'dark',
  },
}
