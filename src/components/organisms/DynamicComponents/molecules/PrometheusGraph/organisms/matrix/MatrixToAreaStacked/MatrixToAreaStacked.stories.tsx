import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse, delay } from 'msw'
import { formatBytesAuto } from '../../../../../../../../utils/converterBytes'
import { formatCoresAuto } from '../../../../../../../../utils/converterCores'
import { formatDateAuto, type TDateFormatOptions } from '../../../../../../../../utils/converterDates'

import { MatrixToAreaStacked } from './MatrixToAreaStacked'
import { SmartProvider } from '../../../../../../../../../.storybook/mocks/SmartProvider'

type TInner = {
  range?: string
  formatter?: 'bytes' | 'cores'
  dateFormatter?: TDateFormatOptions
}

type TArgs = TInner & {
  theme: 'dark' | 'light'
  state: 'success' | 'loading' | 'error'
}

const buildFormatValue = (formatter?: TInner['formatter']) => {
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

/* ----------------------------- MSW helpers ------------------------------- */

const parseTimeToSec = (s: string | null, fallback: number) => {
  if (!s) return fallback
  const n = Number(s)
  if (Number.isFinite(n)) return n
  const ms = Date.parse(s)
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : fallback
}

const parseStepToSec = (s: string | null, fallback: number) => {
  if (!s) return fallback
  const m = String(s)
    .trim()
    .match(/^(\d+)([smhd])?$/i)
  if (!m) return fallback
  const n = Number(m[1])
  const unit = (m[2] ?? 's').toLowerCase()
  const mult = unit === 'm' ? 60 : unit === 'h' ? 3600 : unit === 'd' ? 86400 : 1
  return Math.max(1, n * mult)
}

const mkSeries = (pod: string, base: number, start: number, end: number, step: number) => {
  const count = Math.max(2, Math.floor((end - start) / step) + 1)
  const values: [number, string][] = []

  for (let i = 0; i < count; i++) {
    const ts = start + i * step
    const wave = Math.sin((i / count) * Math.PI * 6)
    const v = base + wave * 280_000_000 + (i % 23) * 15_000_000
    values.push([ts, String(Math.max(0, Math.round(v)))])
  }

  return { metric: { __name__: 'container_memory_usage_bytes', pod }, values }
}

/* ------------------------------ MSW handlers ----------------------------- */

const successHandler = http.get('http://localhost:9090/api/v1/query_range', ({ request }) => {
  const url = new URL(request.url)
  const now = Math.floor(Date.now() / 1000)

  const start = parseTimeToSec(url.searchParams.get('start'), now - 3600)
  const end = parseTimeToSec(url.searchParams.get('end'), now)
  const step = parseStepToSec(url.searchParams.get('step'), 60)

  return HttpResponse.json({
    status: 'success',
    data: {
      resultType: 'matrix',
      result: [
        mkSeries('pod-a', 250_000_000, start, end, step),
        mkSeries('pod-b', 700_000_000, start, end, step),
        mkSeries('pod-c', 1_200_000_000, start, end, step),
        mkSeries('pod-d', 1_700_000_000, start, end, step),
      ],
    },
  })
})

/* -------------------------------- meta --------------------------------- */

const meta: Meta<TArgs> = {
  title: 'Factory/Prometheus Internal/Matrix/ToArea/Stacked',
  component: MatrixToAreaStacked as any,
  argTypes: {
    range: { control: 'text' },
    formatter: { control: 'radio', options: ['bytes', 'cores'] },
    dateFormatter: { control: 'object' },
    theme: { control: 'radio', options: ['light', 'dark'] },
    state: { control: 'radio', options: ['success', 'loading', 'error'] },
  },

  render: args => {
    const data: TInner = {
      range: args.range,
      ...(args.formatter ? { formatter: args.formatter } : {}),
      ...(args.dateFormatter ? { dateFormatter: args.dateFormatter } : {}),
    }

    return (
      <>
        <SmartProvider
          theme={args.theme}
          partsOfUrl={[]}
          multiQueryValue={{
            data: null,
            isLoading: false,
            isError: false,
            errors: [],
          }}
        >
          <div style={{ padding: 16 }}>
            <MatrixToAreaStacked
              range={data.range}
              formatValue={buildFormatValue(args.formatter)}
              formatTimestamp={buildFormatTimestamp(args.dateFormatter)}
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
            options={{ theme: 'vs-dark', readOnly: true }}
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

type TStory = StoryObj<TArgs>

/* -------------------------------- stories ------------------------------- */

export const Default: TStory = {
  args: {
    range: '1h',
    formatter: 'bytes',
    dateFormatter: { style: 'time', seconds: true },
    theme: 'light',
    state: 'success',
  },
  parameters: { msw: { handlers: [successHandler] } },
}

export const SixHours: TStory = {
  args: { ...Default.args, range: '6h' },
  parameters: { msw: { handlers: [successHandler] } },
}

export const OneDay: TStory = {
  args: { ...Default.args, range: '24h' },
  parameters: { msw: { handlers: [successHandler] } },
}

export const DarkTheme: TStory = {
  args: { ...Default.args, theme: 'dark' },
  parameters: { msw: { handlers: [successHandler] } },
}
