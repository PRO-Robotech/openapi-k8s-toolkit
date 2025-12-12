import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import { http, HttpResponse, delay } from 'msw'

import { VectorToBarHorizontal } from './VectorToBarHorizontal'
import { SmartProvider } from '../../../../../../../../../.storybook/mocks/SmartProvider'

type TExtraArgs = {
  theme: 'dark' | 'light'
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
        { metric: { pod: 'pod-a' }, value: [1700000000, '12345678'] },
        { metric: { pod: 'pod-b' }, value: [1700000000, '9876543'] },
        { metric: { pod: 'pod-c' }, value: [1700000000, '5555555'] },
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

const meta: Meta<typeof VectorToBarHorizontal> = {
  title: 'Factory/Prometheus Internal/Vector/ToBar/Horizontal',
  component: VectorToBarHorizontal,
  argTypes: {
    query: { control: 'text' },
    title: { control: 'text' },

    // 👇 extra arg not in component props
    theme: { control: 'radio', options: ['light', 'dark'] },
  } as any,

  render: (args: any) => {
    const { theme, query, title } = args as TExtraArgs & { query?: string; title?: string }
    const data = { query, title }

    return (
      <>
        <SmartProvider multiQueryValue={EMPTY_MULTI_QUERY_VALUE} theme={theme} partsOfUrl={[]}>
          <div style={{ padding: 16 }}>
            <VectorToBarHorizontal query={query} title={title} />
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

type TStory = StoryObj<typeof VectorToBarHorizontal & ((p: any) => any)>

export const Success: TStory = {
  args: {
    query: 'container_memory_usage_bytes_success',
    title: 'Vector → Bar (Horizontal)',
    theme: 'light',
  },
  parameters: { msw: { handlers: [successHandler] } },
}

export const Loading: TStory = {
  args: {
    query: 'container_memory_usage_bytes_loading',
    title: 'Vector → Bar (Horizontal)',
    theme: 'light',
  },
  parameters: { msw: { handlers: [loadingHandler] } },
}

export const Error: TStory = {
  args: {
    query: 'container_memory_usage_bytes_error',
    title: 'Vector → Bar (Horizontal)',
    theme: 'light',
  },
  parameters: { msw: { handlers: [errorHandler] } },
}

export const DarkTheme: TStory = {
  args: {
    query: 'container_memory_usage_bytes_dark',
    title: 'Vector → Bar (Horizontal)',
    theme: 'dark',
  },
  parameters: { msw: { handlers: [successHandler] } },
}
