import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse, delay } from 'msw'
import { formatBytesAuto } from '../../../../../../../../utils/converterBytes'
import { formatCoresAuto } from '../../../../../../../../utils/converterCores'

import { VectorToGaugeRadial } from './VectorToGaugeRadial'
import { SmartProvider } from '../../../../../../../../../.storybook/mocks/SmartProvider'

type TExtraArgs = {
  theme: 'dark' | 'light'
  state: 'success' | 'loading' | 'error'
  valueMode: '0.3' | '0.7' | '1.2'
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

const valueFromMode = (mode: TExtraArgs['valueMode']) => {
  if (mode === '0.3') return '0.3'
  if (mode === '1.2') return '1.2'
  return '0.7'
}

const successHandler = (mode: TExtraArgs['valueMode']) =>
  http.get('http://localhost:9090/api/v1/query', () =>
    HttpResponse.json({
      status: 'success',
      data: {
        resultType: 'vector',
        result: [{ metric: { __name__: 'up' }, value: [1700000000, valueFromMode(mode)] }],
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

const meta: Meta<typeof VectorToGaugeRadial> = {
  title: 'Factory/Prometheus Internal/Vector/ToGaugeRadial',
  component: VectorToGaugeRadial,
  argTypes: {
    query: { control: 'text' },
    title: { control: 'text' },
    min: { control: 'number' },
    max: { control: 'number' },

    // extra args (used only by render/SmartProvider/MSW selection)
    theme: { control: 'radio', options: ['light', 'dark'] },
    state: { control: 'radio', options: ['success', 'loading', 'error'] },
    valueMode: { control: 'radio', options: ['0.3', '0.7', '1.2'] },
    formatter: { control: 'radio', options: ['bytes', 'cores'] },
  } as any,

  render: (args: any) => {
    const { query, title, min, max, theme, formatter } = args as TExtraArgs & {
      query?: string
      title?: string
      min?: number
      max?: number
    }

    const data = { query, title, min, max, ...(formatter ? { formatter } : {}) }

    return (
      <>
        <SmartProvider multiQueryValue={EMPTY_MULTI_QUERY_VALUE} theme={theme} partsOfUrl={[]}>
          <div style={{ padding: 16 }}>
            <VectorToGaugeRadial
              query={query}
              title={title}
              min={min}
              max={max}
              formatValue={buildFormatValue(formatter)}
            />
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

export const Default: TStory = {
  args: {
    query: 'up_success_default',
    title: 'Vector → Gauge (Radial)',
    min: 0,
    max: 1,
    theme: 'light',
    state: 'success',
    valueMode: '0.7',
  },
  parameters: { msw: { handlers: [successHandler('0.7')] } },
}

export const Low: TStory = {
  args: {
    ...Default.args,
    query: 'up_success_low',
    valueMode: '0.3',
  },
  parameters: { msw: { handlers: [successHandler('0.3')] } },
}

export const OverMax: TStory = {
  args: {
    ...Default.args,
    query: 'up_success_overmax',
    valueMode: '1.2',
  },
  parameters: { msw: { handlers: [successHandler('1.2')] } },
}

export const Loading: TStory = {
  args: {
    ...Default.args,
    query: 'up_loading',
    state: 'loading',
  },
  parameters: { msw: { handlers: [loadingHandler] } },
}

export const Error: TStory = {
  args: {
    ...Default.args,
    query: 'up_error',
    state: 'error',
  },
  parameters: { msw: { handlers: [errorHandler] } },
}

