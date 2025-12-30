import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { ConverterCores } from './ConverterCores'
import { TDynamicComponentsAppTypeMap } from '../../types'

// Storybook-only mocks (aliased in .storybook/main.ts via viteFinal)
import { SmartProvider } from '../../../../../../.storybook/mocks/SmartProvider'

type TInner = TDynamicComponentsAppTypeMap['ConverterCores']

type ProviderArgs = {
  isLoading: boolean
  isError: boolean
  errors: { message: string }[]
  multiQueryData: Record<string, unknown> | null
  partsOfUrl: string[]
}

type TArgs = TInner & ProviderArgs

const meta: Meta<TArgs> = {
  title: 'Factory/ConverterCores',
  component: ConverterCores as any,
  // Expose *inner* fields as top-level controls
  argTypes: {
    id: { control: 'text', description: 'data.id' },
    coresValue: {
      control: 'object',
      description:
        'data.coresValue (string or string[]). Values can include units like "500m", "10u", "1000000n", "2 vcpu". If array, all entries are converted to cores, summed, then formatted.',
    },
    unit: {
      control: 'text',
      description:
        'data.unit (cores -> this unit, e.g. "core", "m", "mcore", "u", "ucore", "n", "ncore"). Leave empty for auto-scale.',
    },
    fromUnit: {
      control: 'text',
      description:
        'data.fromUnit (value is in this unit instead of raw cores; overrides inline units for all entries).',
    },
    toUnit: {
      control: 'text',
      description: 'data.toUnit (explicit target unit when using fromUnit or inline unit).',
    },
    format: { control: { type: 'boolean' }, description: 'data.format' },
    precision: { control: 'number', description: 'data.precision' },
    locale: { control: 'text', description: 'data.locale' },
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
          <ConverterCores
            data={{
              id: args.id,
              coresValue: args.coresValue,
              unit: args.unit,
              fromUnit: args.fromUnit,
              toUnit: args.toUnit,
              format: args.format,
              precision: args.precision,
              locale: args.locale,
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
          type: 'ConverterCores',
          data: {
            id: args.id,
            coresValue: args.coresValue,
            unit: args.unit,
            fromUnit: args.fromUnit,
            toUnit: args.toUnit,
            format: args.format,
            precision: args.precision,
            locale: args.locale,
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
    id: 'example-converter-cores',
    coresValue: "{reqsJsonPath[0]['.data.block.cores']['-']}",
    format: true,
    style: { fontSize: 24 },

    // providers
    isLoading: false,
    isError: false,
    errors: [],
    multiQueryData: { req0: { data: { block: { cores: 0.5 } } } },
    partsOfUrl: [],
  },
}

// Single string value, force millicores
export const MillicoresUnit: Story = {
  args: {
    ...Default.args,
    coresValue: '0.5', // 0.5 core
    unit: 'm', // -> 500 mcore
  },
}

// Single string value, force microcores
export const MicrocoresUnit: Story = {
  args: {
    ...Default.args,
    coresValue: '0.0001', // 1e-4 core
    unit: 'ucore', // -> 100 ucore
  },
}

// Single string value, force nanocores
export const NanocoresUnit: Story = {
  args: {
    ...Default.args,
    coresValue: '0.0000001', // 1e-7 core
    unit: 'ncore', // -> 100 ncore
  },
}

export const FormatOff: Story = {
  args: {
    ...Default.args,
    coresValue: '0.5',
    unit: 'core',
    format: false,
  },
}

export const Precision: Story = {
  args: {
    ...Default.args,
    coresValue: '0.5',
    precision: 5,
  },
}

export const Locale: Story = {
  args: {
    ...Default.args,
    coresValue: '1234.5',
    locale: 'de-DE',
  },
}

export const Error: Story = {
  args: {
    ...Default.args,
    id: 'example-converter-cores-error',
    coresValue: "{reqsJsonPath[0]['.data.block.coressss']['-']}",
    notANumberText: '0',
  },
}

/**
 * Inline unit + auto-scale:
 * - "500m"   -> 0.5 core  -> auto chooses core/mcore/ucore/ncore depending on thresholds
 */
export const InlineUnitAutoScaleMilli: Story = {
  args: {
    ...Default.args,
    id: 'inline-unit-auto-milli',
    coresValue: '500m',
    unit: undefined,
    fromUnit: undefined,
    toUnit: undefined,
    format: true,
  },
}

/**
 * Inline micro unit + auto-scale:
 * - "100u"   -> 100 microcores -> 1e-4 core
 */
export const InlineUnitAutoScaleMicro: Story = {
  args: {
    ...Default.args,
    id: 'inline-unit-auto-micro',
    coresValue: '100u',
    unit: undefined,
    fromUnit: undefined,
    toUnit: undefined,
    format: true,
  },
}

/**
 * Inline nano unit + auto-scale:
 * - "1000000n" -> 1e6 nanocores -> 1e-3 core
 */
export const InlineUnitAutoScaleNano: Story = {
  args: {
    ...Default.args,
    id: 'inline-unit-auto-nano',
    coresValue: '1000000n',
    unit: undefined,
    fromUnit: undefined,
    toUnit: undefined,
    format: true,
  },
}

/**
 * Array of values: all converted to cores and summed.
 * Example:
 *  - "500m"      -> 0.5 core
 *  - "0.25 core" -> 0.25 core
 *  - "250m"      -> 0.25 core
 *  Total = 1.0 core
 */
export const ArrayValuesSum: Story = {
  args: {
    ...Default.args,
    id: 'array-values-sum',
    coresValue: ['500m', '0.25 core', '250m'],
    unit: 'core',
    format: true,
    precision: 3,
  },
}

/**
 * Explicit fromUnit + toUnit, ignoring inline units.
 * Here we treat ALL entries as "m" regardless of inline unit.
 */
export const FromToUnitsArray: Story = {
  args: {
    ...Default.args,
    id: 'from-to-units-array',
    coresValue: ['500', '250', '250'], // all "m" because fromUnit='m'
    fromUnit: 'm',
    toUnit: 'core',
    format: true,
    precision: 3,
  },
}

/**
 * Inline unit overridden by fromUnit for array values.
 */
export const OverrideInlineFromUnitArray: Story = {
  args: {
    ...Default.args,
    id: 'override-inline-from-array',
    coresValue: ['500m', '0.5 core'],
    fromUnit: 'core', // both treated as "core"
    toUnit: 'mcore',
    format: true,
    precision: 2,
  },
}
