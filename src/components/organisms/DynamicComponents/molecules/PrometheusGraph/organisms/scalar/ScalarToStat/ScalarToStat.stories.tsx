import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse, delay } from 'msw'
import { formatBytesAuto } from '../../../../../../../../utils/converterBytes'
import { formatCoresAuto } from '../../../../../../../../utils/converterCores'

import { ScalarToStat } from './ScalarToStat'
import { SmartProvider } from '../../../../../../../../../.storybook/mocks/SmartProvider'

type TInner = {
  query?: string
  title?: string
  formatter?: 'bytes' | 'cores'
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

    return HttpResponse.json({
      status: 'success',
      data: {
        resultType: 'scalar',
        result: [now, '42.42'],
      },
    })
  })

/* -------------------------------- meta --------------------------------- */

const meta: Meta<TArgs> = {
  title: 'Factory/Prometheus Internal/Scalar/ToStat',
  component: ScalarToStat as any,
  argTypes: {
    query: { control: 'text' },
    title: { control: 'text' },
    formatter: { control: 'radio', options: ['bytes', 'cores'] },
    theme: { control: 'radio', options: ['light', 'dark'] },
    state: { control: 'radio', options: ['success', 'loading', 'error'] },
  },

  render: args => {
    const data: TInner = {
      query: args.query,
      title: args.title,
      ...(args.formatter ? { formatter: args.formatter } : {}),
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
          <div style={{ padding: 16, maxWidth: 420 }}>
            <ScalarToStat
              query={data.query ?? 'scalar(42.42)'}
              title={data.title ?? 'Stat'}
              formatValue={buildFormatValue(args.formatter)}
            />
          </div>
        </SmartProvider>

        <div style={{ marginTop: 150 }}>
          <Editor
            defaultLanguage="yaml"
            width="100%"
            height={260}
            value={yaml.stringify({
              type: 'PrometheusScalar',
              data: { query: data.query ?? 'scalar(42.42)', ...(data.formatter ? { formatter: data.formatter } : {}) },
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
    query: 'scalar(42.42)',
    title: 'Scalar Stat',
    theme: 'light',
    state: 'success',
  },
  parameters: { msw: { handlers: [handlerByState('success')] } },
}

export const DarkTheme: TStory = {
  args: { ...Default.args, theme: 'dark' },
  parameters: { msw: { handlers: [handlerByState('success')] } },
}
