import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse, delay } from 'msw'
import { formatBytesAuto } from '../../../../../../../../utils/converterBytes'
import { formatCoresAuto } from '../../../../../../../../utils/converterCores'

import { VectorToBarGauge } from './VectorToBarGauge'
import { SmartProvider } from '../../../../../../../../../.storybook/mocks/SmartProvider'

type TExtraArgs = {
  theme: 'dark' | 'light'
  state: 'success' | 'loading' | 'error'
  formatter?: 'bytes' | 'cores'
}

const buildFormatValue = (formatter?: TExtraArgs['formatter']) => {
  if (formatter === 'bytes') {
    return (value: unknown) => {
      const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
      return Number.isFinite(num) ? formatBytesAuto(num) : value != null ? String(value) : ''
    }
  }

  if (formatter === 'cores') {
    return (value: unknown) => {
      const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
      return Number.isFinite(num) ? formatCoresAuto(num) : value != null ? String(value) : ''
    }
  }

  return undefined
}

const EMPTY_MULTI_QUERY_VALUE = {
  data: null,
  isLoading: false,
  isError: false,
  errors: [],
}

const successHandler = http.get('http://localhost:9090/api/v1/query', () => {
  // 12 entries -> shows TopN slicing + sorting
  const result = Array.from({ length: 12 }).map((_, i) => ({
    metric: { pod: `pod-${i + 1}` },
    value: [1700000000, String((12 - i) * 1000)],
  }))

  return HttpResponse.json({
    status: 'success',
    data: { resultType: 'vector', result },
  })
})

const loadingHandler = http.get('http://localhost:9090/api/v1/query', async () => {
  await delay(60_000)
  return HttpResponse.json({})
})


const meta: Meta<typeof VectorToBarGauge> = {
  title: 'Factory/Prometheus Internal/Vector/ToBar/Gauge',
  component: VectorToBarGauge,
  argTypes: {
    query: { control: 'text' },
    title: { control: 'text' },
    topN: { control: 'number' },

    // extra args (used only by render/SmartProvider)
    theme: { control: 'radio', options: ['light', 'dark'] },
    state: { control: 'radio', options: ['success', 'loading', 'error'] },
    formatter: { control: 'radio', options: ['bytes', 'cores'] },
  } as any,

  render: (args: any) => {
    const { query, title, topN, theme, formatter } = args as TExtraArgs & {
      query?: string
      title?: string
      topN?: number
    }

    const data = { query, title, topN, ...(formatter ? { formatter } : {}) }

    return (
      <>
        <SmartProvider multiQueryValue={EMPTY_MULTI_QUERY_VALUE} theme={theme} partsOfUrl={[]}>
          <div style={{ padding: 16 }}>
            <VectorToBarGauge query={query} title={title} topN={topN} formatValue={buildFormatValue(formatter)} />
          </div>
        </SmartProvider>

        <div style={{ marginTop: 150 }}>
          <Editor
            defaultLanguage="yaml"
            width="100%"
            height={260}
            value={yaml.stringify({ type: 'PrometheusGraph', data })}
            theme="vs-dark"
            options={{ readOnly: true }}
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
type TStory = StoryObj<any>

export const Success: TStory = {
  args: {
    query: 'container_memory_usage_bytes_success',
    title: 'Vector → Bar Gauge',
    topN: 10,
    formatter: 'bytes',
    theme: 'light',
    state: 'success',
  },
  parameters: { msw: { handlers: [successHandler] } },
}

export const Top5: TStory = {
  args: {
    query: 'container_memory_usage_bytes_success_top5',
    title: 'Vector → Bar Gauge',
    topN: 5,
    formatter: 'bytes',
    theme: 'light',
    state: 'success',
  },
  parameters: { msw: { handlers: [successHandler] } },
}

export const Loading: TStory = {
  args: {
    query: 'container_memory_usage_bytes_loading',
    title: 'Vector → Bar Gauge',
    topN: 10,
    formatter: 'bytes',
    theme: 'light',
    state: 'loading',
  },
  parameters: { msw: { handlers: [loadingHandler] } },
}

