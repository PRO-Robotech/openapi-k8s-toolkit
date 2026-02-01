import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse, delay } from 'msw'
import { formatBytesAuto } from '../../../../../../../../utils/converterBytes'
import { formatCoresAuto } from '../../../../../../../../utils/converterCores'

import { VectorToBarHorizontal } from './VectorToBarHorizontal'
import { SmartProvider } from '../../../../../../../../../.storybook/mocks/SmartProvider'

type TExtraArgs = {
  theme: 'dark' | 'light'
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

const successHandler = http.get('http://localhost:9090/api/v1/query', () =>
  HttpResponse.json({
    status: 'success',
    data: {
      resultType: 'vector',
      result: [
        { metric: { pod: 'pod-a' }, value: [1700000000, '12345678'] },
        { metric: { pod: 'pod-b' }, value: [1700000000, '9876543'] },
        { metric: { pod: 'pod-c' }, value: [1700000000, '5555555'] },
      ],
    },
  }),
)

const loadingHandler = http.get('http://localhost:9090/api/v1/query', async () => {
  await delay(60_000)
  return HttpResponse.json({})
})

const errorHandler = http.get('http://localhost:9090/api/v1/query', () =>
  HttpResponse.json({ status: 'error', errorType: 'internal', error: 'boom' }, { status: 500 }),
)

const meta: Meta<typeof VectorToBarHorizontal> = {
  title: 'Factory/Prometheus Internal/Vector/ToBar/Horizontal',
  component: VectorToBarHorizontal,
  argTypes: {
    query: { control: 'text' },

    // 👇 extra arg not in component props
    theme: { control: 'radio', options: ['light', 'dark'] },
    formatter: { control: 'radio', options: ['bytes', 'cores'] },
  } as any,

  render: (args: any) => {
    const { theme, query, formatter } = args as TExtraArgs & { query?: string }
    const data = { query, ...(formatter ? { formatter } : {}) }

    return (
      <>
        <SmartProvider multiQueryValue={EMPTY_MULTI_QUERY_VALUE} theme={theme} partsOfUrl={[]}>
          <div style={{ padding: 16 }}>
            <VectorToBarHorizontal query={query} formatValue={buildFormatValue(formatter)} />
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

type TStory = StoryObj<typeof VectorToBarHorizontal & ((p: any) => any)>

export const Success: TStory = {
  args: {
    query: 'container_memory_usage_bytes_success',
    formatter: 'bytes',
    theme: 'light',
  },
  parameters: { msw: { handlers: [successHandler] } },
}

export const Loading: TStory = {
  args: {
    query: 'container_memory_usage_bytes_loading',
    formatter: 'bytes',
    theme: 'light',
  },
  parameters: { msw: { handlers: [loadingHandler] } },
}

export const Error: TStory = {
  args: {
    query: 'container_memory_usage_bytes_error',
    formatter: 'bytes',
    theme: 'light',
  },
  parameters: { msw: { handlers: [errorHandler] } },
}

