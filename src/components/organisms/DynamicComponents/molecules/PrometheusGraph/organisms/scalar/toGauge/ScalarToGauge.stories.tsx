import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse, delay } from 'msw'

import { ScalarToGauge } from './ScalarToGauge'
import { SmartProvider } from '../../../../../../../../../.storybook/mocks/SmartProvider'

type TInner = {
  query?: string
  title?: string
  min?: number
  max?: number
}

type TArgs = TInner & {
  theme: 'dark' | 'light'
  state: 'success' | 'loading' | 'error'
}

/* ------------------------------ MSW handlers ----------------------------- */

const handlerByState = (state: TArgs['state']) =>
  http.get('http://localhost:9090/api/v1/query', async () => {
    if (state === 'loading') {
      await delay(1_500)
    }

    if (state === 'error') {
      return HttpResponse.json({ status: 'error', errorType: 'server_error', error: 'Mocked error' }, { status: 500 })
    }

    const now = Math.floor(Date.now() / 1000)

    // value around the middle of min/max by default
    return HttpResponse.json({
      status: 'success',
      data: {
        resultType: 'scalar',
        result: [now, '55'],
      },
    })
  })

/* -------------------------------- meta --------------------------------- */

const meta: Meta<TArgs> = {
  title: 'Factory/Prometheus Internal/Scalar/ToGauge',
  component: ScalarToGauge as any,
  argTypes: {
    query: { control: 'text' },
    title: { control: 'text' },
    min: { control: 'number' },
    max: { control: 'number' },
    theme: { control: 'radio', options: ['light', 'dark'] },
    state: { control: 'radio', options: ['success', 'loading', 'error'] },
  },

  render: args => {
    const data: TInner = { query: args.query, title: args.title, min: args.min, max: args.max }

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
          <div style={{ padding: 16, maxWidth: 520 }}>
            <ScalarToGauge
              query={data.query ?? 'scalar(55)'}
              title={data.title ?? 'Gauge'}
              min={data.min ?? 0}
              max={data.max ?? 100}
            />
          </div>
        </SmartProvider>

        <div style={{ marginTop: 150 }}>
          <Editor
            defaultLanguage="yaml"
            width="100%"
            height={260}
            value={yaml.stringify({
              type: 'PrometheusGauge',
              data: { query: data.query ?? 'scalar(55)', min: data.min ?? 0, max: data.max ?? 100 },
            })}
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
    query: 'scalar(55)',
    title: 'Scalar Gauge',
    min: 0,
    max: 100,
    theme: 'light',
    state: 'success',
  },
  parameters: { msw: { handlers: [handlerByState('success')] } },
}

export const TightRange: TStory = {
  args: { ...Default.args, min: 40, max: 60, title: 'Tight range (40–60)' },
  parameters: { msw: { handlers: [handlerByState('success')] } },
}

export const WideRange: TStory = {
  args: { ...Default.args, min: 0, max: 1000, title: 'Wide range (0–1000)' },
  parameters: { msw: { handlers: [handlerByState('success')] } },
}

export const DarkTheme: TStory = {
  args: { ...Default.args, theme: 'dark' },
  parameters: { msw: { handlers: [handlerByState('success')] } },
}
