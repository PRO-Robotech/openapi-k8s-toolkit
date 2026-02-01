import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'
import type { TDynamicComponentsAppTypeMap } from '../../types'
import { UsageGraphCard } from './UsageGraphCard'
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

// 🔹 Inner factory props (what goes into `data` in the schema)
type TInner = TDynamicComponentsAppTypeMap['UsageGraphCard']

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
type TProviderArgs = {
  theme: 'light' | 'dark'
}
type TArgs = TInner & TProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/UsageGraphCard',
  component: UsageGraphCard as any,
  argTypes: {
    title: { control: 'text', description: 'data.title' },
    series: { control: 'object', description: 'data.series (array of { value, label? })' },
    containerStyle: { control: 'object', description: 'data.containerStyle' },
    minColor: { control: 'color', description: 'data.minColor' },
    midColor: { control: 'color', description: 'data.midColor' },
    maxColor: { control: 'color', description: 'data.maxColor' },
    requested: { control: 'number', description: 'data.requested' },
    requestedQuery: { control: 'text', description: 'data.requestedQuery (PromQL for requested)' },
    used: { control: 'number', description: 'data.used' },
    usedQuery: { control: 'text', description: 'data.usedQuery (PromQL for used/current)' },
    limit: { control: 'number', description: 'data.limit' },
    limitQuery: { control: 'text', description: 'data.limitQuery (PromQL for limit)' },
    baseUrl: { control: 'text', description: 'data.baseUrl (Prometheus base URL)' },
    query: { control: 'text', description: 'data.query (PromQL for range matrix)' },
    range: { control: 'text', description: 'data.range (Prometheus range e.g. 1h)' },
    refetchInterval: { control: 'number', description: 'data.refetchInterval (ms) or false' },
    valueStrategy: {
      control: { type: 'select' },
      options: ['cpu', 'memory', 'bytes', undefined],
      description: 'data.valueStrategy (formats requested/used/limit values)',
    },
    valuePrecision: { control: 'number', description: 'data.valuePrecision (max fraction digits)' },
    hideUnit: { control: 'boolean', description: 'data.hideUnit (hide units in labels/badge)' },
    converterBytesProps: { control: 'object', description: 'data.converterBytesProps (ConverterBytes overrides)' },
    converterCoresProps: { control: 'object', description: 'data.converterCoresProps (ConverterCores overrides)' },
    theme: {
      control: 'radio',
      options: ['light', 'dark'],
      description: 'Mock UI Theme context',
    },
  },

  render: args => {
    const data: TInner = {
      title: args.title,
      series: args.series,
      containerStyle: args.containerStyle,
      minColor: args.minColor,
      midColor: args.midColor,
      maxColor: args.maxColor,
      requested: args.requested,
      requestedQuery: args.requestedQuery,
      used: args.used,
      usedQuery: args.usedQuery,
      limit: args.limit,
      limitQuery: args.limitQuery,
      baseUrl: args.baseUrl,
      query: args.query,
      range: args.range,
      refetchInterval: args.refetchInterval,
      valueStrategy: args.valueStrategy,
      valuePrecision: args.valuePrecision,
      hideUnit: args.hideUnit,
      converterBytesProps: args.converterBytesProps,
      converterCoresProps: args.converterCoresProps,
    }
    const isDark = args.theme === 'dark'

    return (
      <>
        <SmartProvider
          theme={args.theme}
          multiQueryValue={{
            data: null,
            isLoading: false,
            isError: false,
            errors: [],
          }}
          partsOfUrl={[]}
        >
          <div
            style={{
              padding: 16,
              maxWidth: 420,
              background: isDark ? '#1f242e' : 'transparent',
            }}
          >
            <UsageGraphCard data={data} />
          </div>
        </SmartProvider>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={220}
          value={yaml.stringify({
            type: 'UsageGraphCard',
            data,
          })}
          theme="vs-dark"
          options={{
            theme: 'vs-dark',
            readOnly: true,
          }}
        />
      </>
    )
  },

  parameters: {
    controls: { expanded: true },
  },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    theme: 'light',
    title: 'CPU, core',
    requested: 0,
    used: 40,
    limit: 80,
    valueStrategy: 'cpu',
    hideUnit: true,
    converterCoresProps: { precision: 0 },
    containerStyle: { width: '200px' },
    series: [
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 21 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      // { value: 20 },
      { value: 20 },
      { value: 22 },
      { value: 30 },
      { value: 26 },
      { value: 28 },
      { value: 24 },
      { value: 31 },
      { value: 27 },
      { value: 29 },
      { value: 25 },
      { value: 33 },
      { value: 28 },
      { value: 26 },
      { value: 30 },
      { value: 27 },
      { value: 32 },
      { value: 35 },
      { value: 31 },
      { value: 38 },
      { value: 29 },
      { value: 34 },
      { value: 30 },
      { value: 28 },
      { value: 33 },
      { value: 31 },
      { value: 36 },
      { value: 29 },
      { value: 32 },
      { value: 30 },
      { value: 34 },
      { value: 31 },
    ],
    minColor: '#00ae89',
    midColor: '#adad4c',
    maxColor: '#d95a00',
  },
}

export const MemoryUsage: Story = {
  args: {
    ...Default.args,
    theme: 'light',
    title: 'Memory, GiB',
    requested: 18,
    used: 50,
    limit: 80,
    valueStrategy: 'memory',
    converterBytesProps: { standard: 'iec', precision: 1 },
    series: [
      { value: 1.2 },
      { value: 1.4 },
      { value: 1.1 },
      { value: 1.6 },
      { value: 1.3 },
      { value: 1.8 },
      { value: 1.5 },
      { value: 1.7 },
      { value: 1.4 },
      { value: 1.9 },
      { value: 1.6 },
      { value: 1.5 },
    ],
  },
}

export const CustomGradient: Story = {
  args: {
    ...Default.args,
    theme: 'light',
    title: 'Disk, IOPS',
    minColor: '#1d4ed8',
    midColor: '#14b8a6',
    maxColor: '#f97316',
  },
}

