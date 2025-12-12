// MatrixToReducedBar.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse } from 'msw'

import { MatrixToReducedBar } from './MatrixToReducedBar'
import { SmartProvider } from '../../../../../../../../../.storybook/mocks/SmartProvider'

type TInner = {
  range?: string
  mode?: 'last' | 'avg' | 'sum' | 'max' | 'min'
}

type TArgs = TInner & {
  theme: 'dark' | 'light'
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
    const v = base + wave * 320_000_000 + (i % 19) * 18_000_000
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
        mkSeries('pod-a', 350_000_000, start, end, step),
        mkSeries('pod-b', 850_000_000, start, end, step),
        mkSeries('pod-c', 1_350_000_000, start, end, step),
        mkSeries('pod-d', 1_750_000_000, start, end, step),
      ],
    },
  })
})

/* -------------------------------- meta --------------------------------- */

const meta: Meta<TArgs> = {
  title: 'Factory/Prometheus Internal/Matrix/ToReducedBar',
  component: MatrixToReducedBar as any,
  argTypes: {
    range: { control: 'text' },
    mode: { control: 'radio', options: ['last', 'avg', 'sum', 'max', 'min'] },
    theme: { control: 'radio', options: ['light', 'dark'] },
    state: { control: 'radio', options: ['success', 'loading', 'error'] },
  },

  render: args => {
    const data: TInner = { range: args.range, mode: args.mode }

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
            <MatrixToReducedBar range={data.range} mode={data.mode} />
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
  args: { range: '1h', mode: 'avg', theme: 'light', state: 'success' },
  parameters: { msw: { handlers: [successHandler] } },
}

export const LastValue: TStory = {
  args: { ...Default.args, mode: 'last' },
  parameters: { msw: { handlers: [successHandler] } },
}

export const Sum: TStory = {
  args: { ...Default.args, mode: 'sum' },
  parameters: { msw: { handlers: [successHandler] } },
}

export const Max: TStory = {
  args: { ...Default.args, mode: 'max' },
  parameters: { msw: { handlers: [successHandler] } },
}

export const Min: TStory = {
  args: { ...Default.args, mode: 'min' },
  parameters: { msw: { handlers: [successHandler] } },
}

export const DarkTheme: TStory = {
  args: { ...Default.args, theme: 'dark' },
  parameters: { msw: { handlers: [successHandler] } },
}
