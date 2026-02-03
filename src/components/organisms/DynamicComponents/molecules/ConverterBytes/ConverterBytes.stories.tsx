import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { ConverterBytes } from './ConverterBytes'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['ConverterBytes']

type ProviderArgs = {
  isLoading: boolean
  isError: boolean
  errors: { message: string }[]
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
}

type TArgs = TInner & ProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/ConverterBytes',
  component: ConverterBytes as any,
  // Expose *inner* fields as top-level controls
  argTypes: {
    id: { control: 'text', description: 'data.id' },
    bytesValue: {
      control: 'object',
      description:
        'data.bytesValue (string or string[]). Values can include units like "1536Ki". If array, all entries are converted to bytes, summed, then formatted.',
    },
    unit: {
      control: 'text',
      description: 'data.unit (bytes -> this unit). Leave empty for auto-scale.',
    },
    fromUnit: {
      control: 'text',
      description: 'data.fromUnit (value is in this unit instead of bytes; can override inline units for all entries).',
    },
    toUnit: {
      control: 'text',
      description: 'data.toUnit (explicit target unit when using fromUnit or inline unit).',
    },
    format: { control: { type: 'boolean' }, description: 'data.format' },
    showUnit: { control: { type: 'boolean' }, description: 'data.showUnit (when format=true)' },
    precision: { control: 'number', description: 'data.precision' },
    locale: { control: 'text', description: 'data.locale' },
    standard: {
      options: ['si', 'iec'],
      control: { type: 'radio' },
      description: 'data.standard (auto-scale base)',
    },
    notANumberText: { control: 'text', description: 'data.notANumberText' },
    style: { control: 'object', description: 'data.style' },

    // provider knobs
    isLoading: { control: 'boolean' },
    isError: { control: 'boolean' },
    errors: { control: 'object' },
    multiQueryData: { control: 'object' },
    partsOfUrl: { control: 'object' },
  },

  // Map flat args -> component's { data } prop
  render: args => (
    <>
      <SmartProvider
        multiQueryValue={{
          isLoading: args.isLoading,
          isError: args.isError,
          errors: args.errors,
          data: args.multiQueryData,
        }}
        partsOfUrl={args.partsOfUrl}
      >
        <div style={{ padding: 16 }}>
          <ConverterBytes
            data={{
              id: args.id,
              bytesValue: args.bytesValue,
              unit: args.unit,
              fromUnit: args.fromUnit,
              toUnit: args.toUnit,
              format: args.format,
              showUnit: args.showUnit,
              precision: args.precision,
              locale: args.locale,
              standard: args.standard,
              notANumberText: args.notANumberText,
              style: args.style,
            }}
          />
        </div>
      </SmartProvider>
      <Editor
        defaultLanguage="yaml"
        width="100%"
        height={220}
        value={yaml.stringify({
          type: 'ConverterBytes',
          data: {
            id: args.id,
            bytesValue: args.bytesValue,
            unit: args.unit,
            fromUnit: args.fromUnit,
            toUnit: args.toUnit,
            format: args.format,
            showUnit: args.showUnit,
            precision: args.precision,
            locale: args.locale,
            standard: args.standard,
            notANumberText: args.notANumberText,
            style: args.style,
          },
        })}
        theme="vs-dark"
        options={{
          theme: 'vs-dark',
          readOnly: true,
        }}
      />
    </>
  ),

  parameters: {
    controls: { expanded: true },
  },
}
export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-converter-bytes',
    bytesValue: "{reqsJsonPath[0]['.data.block.bytes']['-']}",
    format: true,
    style: { fontSize: 24 },

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: { req0: { data: { block: { bytes: 123456 } } } },
    partsOfUrl: [],
  },
}

export const Unit: Story = {
  args: {
    ...Default.args,
    unit: 'Mi',
  },
}

export const FormatOff: Story = {
  args: {
    ...Default.args,
    unit: 'k',
    format: false,
  },
}

export const FormatNoUnit: Story = {
  args: {
    ...Default.args,
    unit: 'Mi',
    format: true,
    showUnit: false,
  },
}

export const Precision: Story = {
  args: {
    ...Default.args,
    precision: 5,
  },
}

export const Locale: Story = {
  args: {
    ...Default.args,
    locale: 'de-DE',
  },
}

export const Standard: Story = {
  args: {
    ...Default.args,
    standard: 'iec',
  },
}

export const Error: Story = {
  args: {
    ...Default.args,
    id: 'example-converter-bytes-error',
    bytesValue: "{reqsJsonPath[0]['.data.block.bytessss']['-']}",
    notANumberText: '0',
  },
}

/**
 * Demonstrates parsing inline unit in bytesValue (e.g. "1536Ki")
 * and auto-scaling from that.
 */
export const InlineUnitAutoScale: Story = {
  args: {
    ...Default.args,
    id: 'inline-unit-auto',
    // directly embed the value + unit
    bytesValue: '1536Ki',
    unit: undefined,
    fromUnit: undefined,
    toUnit: undefined,
    standard: 'iec',
    format: true,
  },
}

/**
 * Demonstrates explicit fromUnit + toUnit, ignoring inline unit if present.
 */
export const FromToUnits: Story = {
  args: {
    ...Default.args,
    id: 'from-to-units',
    bytesValue: '10', // numeric value only
    fromUnit: 'GB',
    toUnit: 'GiB',
    format: true,
    precision: 3,
  },
}

/**
 * Demonstrates inline unit overridden by fromUnit.
 * bytesValue says "Gi" but we force treat it as "GB".
 */
export const OverrideInlineFromUnit: Story = {
  args: {
    ...Default.args,
    id: 'override-inline-from',
    bytesValue: '10Gi', // inline "Gi"
    fromUnit: 'GB', // we override and treat as GB
    toUnit: 'GiB',
    format: true,
    precision: 4,
  },
}

/**
 * Array of values: all converted to bytes and summed.
 * Example:
 *  - "10GiB"
 *  - "512Mi"
 *  - "1024" (bytes)
 */
export const ArrayValuesSum: Story = {
  args: {
    ...Default.args,
    id: 'array-values-sum',
    bytesValue: ['10GiB', '512Mi', '1024'],
    unit: 'GiB',
    standard: 'iec',
    format: true,
    precision: 3,
  },
}

/**
 * Explicit fromUnit + toUnit for array, ignoring inline units.
 * Here we treat ALL entries as "MB" regardless of inline unit.
 */
export const FromToUnitsArray: Story = {
  args: {
    ...Default.args,
    id: 'from-to-units-array',
    bytesValue: ['10', '20', '30'], // all "MB" because fromUnit='MB'
    fromUnit: 'MB',
    toUnit: 'GiB',
    format: true,
    precision: 4,
    standard: 'iec',
  },
}
