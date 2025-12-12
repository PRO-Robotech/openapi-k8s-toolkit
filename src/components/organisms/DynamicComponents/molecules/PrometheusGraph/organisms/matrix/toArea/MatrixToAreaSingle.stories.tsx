import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse, delay } from 'msw'

import { MatrixToAreaSingle } from './MatrixToAreaSingle'
import { SmartProvider } from '../../../../../../../../../.storybook/mocks/SmartProvider'

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
  state: 'success' | 'loading' | 'error'
}

type TArgs = TInner & TProviderArgs

/* ----------------------------- MSW helpers ------------------------------- */

const parseTimeToSec = (s: string | null, fallback: number) => {
  if (!s) return fallback
  const n = Number(s)
  if (Number.isFinite(n)) return n
  const ms = Date.parse(s) // ISO from your hook
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : fallback
}

const parseStepToSec = (s: string | null, fallback: number) => {
  if (!s) return fallback
  const m = String(s)
    .trim()
    .match(/^(\d+)([smhd])?$/i) // "10s", "60", "5m"
  if (!m) return fallback

  const n = Number(m[1])
  const unit = (m[2] ?? 's').toLowerCase()
  const mult = unit === 'm' ? 60 : unit === 'h' ? 3600 : unit === 'd' ? 86400 : 1
  return Math.max(1, n * mult)
}

const mkSingleValues = (base: number, start: number, end: number, step: number): [number, string][] => {
  const count = Math.max(2, Math.floor((end - start) / step) + 1)
  const values: [number, string][] = []

  for (let i = 0; i < count; i++) {
    const ts = start + i * step
    const wave = Math.sin((i / count) * Math.PI * 6)
    const v = base + wave * 300_000_000 + (i % 17) * 20_000_000
    values.push([ts, String(Math.max(0, Math.round(v)))])
  }

  return values
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
        {
          metric: { __name__: 'container_memory_usage_bytes', pod: 'pod-a' },
          values: mkSingleValues(900_000_000, start, end, step),
        },
      ],
    },
  })
})

/* -------------------------------- meta --------------------------------- */

const meta: Meta<TArgs> = {
  title: 'Factory/Prometheus Internal/Matrix/ToArea/Single',
  component: MatrixToAreaSingle as any,
  argTypes: {
    range: { control: 'text' },

    isLoading: { control: 'boolean' },
    isError: { control: 'boolean' },
    errors: { control: 'object' },
    multiQueryData: { control: 'object' },
    partsOfUrl: { control: 'object' },
    theme: { control: 'radio', options: ['light', 'dark'] },
    state: { control: 'radio', options: ['success', 'loading', 'error'] },
  },

  render: args => {
    const data: TInner = { range: args.range }

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
            <MatrixToAreaSingle range={data.range} />
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

  parameters: { controls: { expanded: true } },
}

export default meta

type TStory = StoryObj<TArgs>

/* -------------------------------- stories ------------------------------- */

export const Default: TStory = {
  args: {
    range: '1h',
    state: 'success',
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: {},
    partsOfUrl: [],
    theme: 'light',
  },
  parameters: { msw: { handlers: [successHandler] } },
}

export const SixHours: TStory = {
  args: { ...Default.args, range: '6h', state: 'success' },
  parameters: { msw: { handlers: [successHandler] } },
}

export const OneDay: TStory = {
  args: { ...Default.args, range: '24h', state: 'success' },
  parameters: { msw: { handlers: [successHandler] } },
}

export const DarkTheme: TStory = {
  args: { ...Default.args, theme: 'dark', state: 'success' },
  parameters: { msw: { handlers: [successHandler] } },
}
