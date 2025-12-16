import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse, delay } from 'msw'

import { VectorToPie } from './VectorToPie'
import { SmartProvider } from '../../../../../../../../../.storybook/mocks/SmartProvider'

type TExtraArgs = {
  theme: 'dark' | 'light'
  state: 'success' | 'loading' | 'error'
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
    title: { control: 'text' },

    // extra args (used only by render/SmartProvider)
    theme: { control: 'radio', options: ['light', 'dark'] },
    state: { control: 'radio', options: ['success', 'loading', 'error'] },
  } as any,

  render: (args: any) => {
    const { query, title, theme } = args as TExtraArgs & { query?: string; title?: string }

    const data = { query, title }

    return (
      <>
        <SmartProvider multiQueryValue={EMPTY_MULTI_QUERY_VALUE} theme={theme} partsOfUrl={[]}>
          <div style={{ padding: 16 }}>
            <VectorToPie query={query} title={title} />
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
    title: 'Vector → Pie',
    theme: 'light',
    state: 'success',
  },
  parameters: { msw: { handlers: [successHandler] } },
}

export const Loading: TStory = {
  args: {
    query: 'some_distribution_metric_loading',
    title: 'Vector → Pie',
    theme: 'light',
    state: 'loading',
  },
  parameters: { msw: { handlers: [loadingHandler] } },
}

export const Error: TStory = {
  args: {
    query: 'some_distribution_metric_error',
    title: 'Vector → Pie',
    theme: 'light',
    state: 'error',
  },
  parameters: { msw: { handlers: [errorHandler] } },
}

export const DarkTheme: TStory = {
  args: {
    query: 'some_distribution_metric_dark',
    title: 'Vector → Pie',
    theme: 'dark',
    state: 'success',
  },
  parameters: { msw: { handlers: [successHandler] } },
}
