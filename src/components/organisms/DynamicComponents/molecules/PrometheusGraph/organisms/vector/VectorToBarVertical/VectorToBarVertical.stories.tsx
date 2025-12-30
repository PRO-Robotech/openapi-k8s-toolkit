import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { http, HttpResponse, delay } from 'msw'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { formatBytesAuto } from '../../../../../../../../utils/converterBytes'
import { formatCoresAuto } from '../../../../../../../../utils/converterCores'

import { VectorToBarVertical } from './VectorToBarVertical'
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

const meta: Meta<typeof VectorToBarVertical> = {
  title: 'Factory/Prometheus Internal/Vector/ToBar/Vertical',
  component: VectorToBarVertical,
  argTypes: {
    query: { control: 'text' },

    // extra args (used only by render/SmartProvider)
    theme: { control: 'radio', options: ['light', 'dark'] },
    state: { control: 'radio', options: ['success', 'loading', 'error'] },
    formatter: { control: 'radio', options: ['bytes', 'cores'] },
  } as any,

  render: (args: any) => {
    const { query, theme, formatter } = args as TExtraArgs & { query?: string }

    const data = { query, ...(formatter ? { formatter } : {}) }

    return (
      <>
        <SmartProvider multiQueryValue={EMPTY_MULTI_QUERY_VALUE} theme={theme} partsOfUrl={[]}>
          <div style={{ padding: 16 }}>
            <VectorToBarVertical query={query} formatValue={buildFormatValue(formatter)} />
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
    formatter: 'bytes',
    theme: 'light',
    state: 'success',
  },
  parameters: { msw: { handlers: [successHandler] } },
}

export const Loading: TStory = {
  args: {
    query: 'container_memory_usage_bytes_loading',
    formatter: 'bytes',
    theme: 'light',
    state: 'loading',
  },
  parameters: { msw: { handlers: [loadingHandler] } },
}

export const Error: TStory = {
  args: {
    query: 'container_memory_usage_bytes_error',
    formatter: 'bytes',
    theme: 'light',
    state: 'error',
  },
  parameters: { msw: { handlers: [errorHandler] } },
}

export const DarkTheme: TStory = {
  args: {
    query: 'container_memory_usage_bytes_dark',
    formatter: 'bytes',
    theme: 'dark',
    state: 'success',
  },
  parameters: { msw: { handlers: [successHandler] } },
}
