import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse, delay } from 'msw'
import { formatBytesAuto } from '../../../../../../../../utils/converterBytes'
import { formatCoresAuto } from '../../../../../../../../utils/converterCores'
import { formatDateAuto, type TDateFormatOptions } from '../../../../../../../../utils/converterDates'

import { VectorToTableRows } from './VectorToTableRows'
import { SmartProvider } from '../../../../../../../../../.storybook/mocks/SmartProvider'

type TExtraArgs = {
  theme: 'dark' | 'light'
  state: 'success' | 'loading' | 'error'
  formatter?: 'bytes' | 'cores'
  dateFormatter?: TDateFormatOptions
  tableColumns?: {
    id?: boolean
    value?: boolean
    timestamp?: boolean
  }
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

const buildFormatTimestamp = (options?: TDateFormatOptions) => {
  if (!options) return undefined

  return (value: unknown) => {
    if (value == null) return ''

    let input: string | number | Date | null = null

    if (value instanceof Date) {
      input = value
    } else if (typeof value === 'number') {
      input = value
    } else if (typeof value === 'string') {
      const num = Number(value)
      input = Number.isFinite(num) ? num : value
    }

    if (input == null) return ''

    const formatted = formatDateAuto(input, options)
    return formatted === 'Invalid date' ? '' : formatted
  }
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
        { metric: { pod: 'pod-a', container: 'c1' }, value: [1700000000, '12345678'] },
        { metric: { pod: 'pod-b', container: 'c2' }, value: [1700000000, '9876543'] },
        { metric: { pod: 'pod-c', container: 'c3' }, value: [1700000000, '5555555'] },
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

const meta: Meta<typeof VectorToTableRows> = {
  title: 'Factory/Prometheus Internal/Vector/ToTableRows',
  component: VectorToTableRows,
  argTypes: {
    query: { control: 'text' },
    title: { control: 'text' },

    // extra args (used only by render/SmartProvider)
    theme: { control: 'radio', options: ['light', 'dark'] },
    state: { control: 'radio', options: ['success', 'loading', 'error'] },
    formatter: { control: 'radio', options: ['bytes', 'cores'] },
    dateFormatter: { control: 'object' },
    tableColumns: { control: 'object' },
  } as any,

  render: (args: any) => {
    const { query, title, theme, formatter, dateFormatter, tableColumns } = args as TExtraArgs & {
      query?: string
      title?: string
    }

    const data = {
      query,
      title,
      ...(tableColumns ? { tableColumns } : {}),
      ...(formatter ? { formatter } : {}),
      ...(dateFormatter ? { dateFormatter } : {}),
    }

    return (
      <>
        <SmartProvider multiQueryValue={EMPTY_MULTI_QUERY_VALUE} theme={theme} partsOfUrl={[]}>
          <div style={{ padding: 16 }}>
            <VectorToTableRows
              query={query}
              title={title}
              formatValue={buildFormatValue(formatter)}
              formatTimestamp={buildFormatTimestamp(dateFormatter)}
              tableColumns={tableColumns}
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

export const Success: TStory = {
  args: {
    query: 'container_memory_usage_bytes_success',
    formatter: 'bytes',
    dateFormatter: { style: 'time', seconds: true },
    tableColumns: { id: true, value: true, timestamp: true },
    title: 'Vector → Table',
    theme: 'light',
    state: 'success',
  },
  parameters: { msw: { handlers: [successHandler] } },
}

export const Loading: TStory = {
  args: {
    query: 'container_memory_usage_bytes_loading',
    formatter: 'bytes',
    title: 'Vector → Table',
    theme: 'light',
    state: 'loading',
  },
  parameters: { msw: { handlers: [loadingHandler] } },
}

export const Error: TStory = {
  args: {
    query: 'container_memory_usage_bytes_error',
    formatter: 'bytes',
    title: 'Vector → Table',
    theme: 'light',
    state: 'error',
  },
  parameters: { msw: { handlers: [errorHandler] } },
}

