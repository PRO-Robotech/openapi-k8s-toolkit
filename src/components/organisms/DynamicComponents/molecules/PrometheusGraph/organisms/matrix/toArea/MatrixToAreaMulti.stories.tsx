import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse, delay } from 'msw'

import { MatrixToAreaMulti } from './MatrixToAreaMulti'
import { SmartProvider } from '../../../../../../../../../.storybook/mocks/SmartProvider'

/* -------------------------------- types -------------------------------- */

type TInner = {
  range?: string
}

type TArgs = TInner & {
  theme: 'light' | 'dark'
  state: 'success' | 'loading' | 'error'
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
  const m = s.match(/^(\d+)([smhd])?$/)
  if (!m) return fallback

  const n = Number(m[1])
  const unit = m[2] ?? 's'
  const mult = unit === 'm' ? 60 : unit === 'h' ? 3600 : unit === 'd' ? 86400 : 1
  return Math.max(1, n * mult)
}

const mkSeries = (pod: string, base: number, start: number, end: number, step: number) => {
  const count = Math.floor((end - start) / step) + 1
  const values: [number, string][] = []

  for (let i = 0; i < count; i++) {
    const ts = start + i * step
    const wave = Math.sin((i / count) * Math.PI * 6)
    const v = base + wave * 300_000_000 + (i % 17) * 20_000_000
    values.push([ts, String(Math.max(0, Math.round(v)))])
  }

  return {
    metric: { __name__: 'container_memory_usage_bytes', pod },
    values,
  }
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
        mkSeries('pod-a', 400_000_000, start, end, step),
        mkSeries('pod-b', 900_000_000, start, end, step),
        mkSeries('pod-c', 1_500_000_000, start, end, step),
      ],
    },
  })
})

/* -------------------------------- meta --------------------------------- */

const meta: Meta<TArgs> = {
  title: 'Factory/Prometheus Internal/Matrix/ToArea/Multi',
  component: MatrixToAreaMulti as any,
  argTypes: {
    range: { control: 'text' },
    theme: { control: 'radio', options: ['light', 'dark'] },
    state: { control: 'radio', options: ['success', 'loading', 'error'] },
  },

  render: args => {
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
            <MatrixToAreaMulti range={args.range} />
          </div>
        </SmartProvider>

        <div style={{ marginTop: 150 }}>
          <Editor
            defaultLanguage="yaml"
            width="100%"
            height={260}
            theme="vs-dark"
            options={{ readOnly: true }}
            value={yaml.stringify({
              type: 'PrometheusGraph',
              data: { range: args.range },
            })}
          />
        </div>
      </>
    )
  },
}

export default meta

type TStory = StoryObj<TArgs>

/* -------------------------------- stories ------------------------------- */

export const Default: TStory = {
  args: {
    range: '1h',
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
