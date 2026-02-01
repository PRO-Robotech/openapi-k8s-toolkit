import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse, delay } from 'msw'
import { formatBytesAuto } from '../../../../../../../../utils/converterBytes'
import { formatCoresAuto } from '../../../../../../../../utils/converterCores'

import { VectorToPie } from './VectorToPie'
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

type TProviderArgs = {
  isLoading: boolean
  isError: boolean
  errors: { message: string }[]
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
  theme: 'dark' | 'light'
  state: 'success' | 'loading' | 'error'
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
        { metric: { pod: 'pod-a' }, value: [1700000000, '30'] },
        { metric: { pod: 'pod-b' }, value: [1700000000, '50'] },
        { metric: { pod: 'pod-c' }, value: [1700000000, '20'] },
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

const meta: Meta<typeof VectorToPie> = {
  title: 'Factory/Prometheus Internal/Vector/ToPie',
  component: VectorToPie,
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
            <VectorToPie query={query} formatValue={buildFormatValue(formatter)} />
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
    query: 'some_distribution_metric_success',
    formatter: 'bytes',
    theme: 'light',
    state: 'success',
  },
  parameters: { msw: { handlers: [successHandler] } },
}

export const Loading: TStory = {
  args: {
    query: 'some_distribution_metric_loading',
    formatter: 'bytes',
    theme: 'light',
    state: 'loading',
  },
  parameters: { msw: { handlers: [loadingHandler] } },
}

export const Error: TStory = {
  args: {
    query: 'some_distribution_metric_error',
    formatter: 'bytes',
    theme: 'light',
    state: 'error',
  },
  parameters: { msw: { handlers: [errorHandler] } },
}

