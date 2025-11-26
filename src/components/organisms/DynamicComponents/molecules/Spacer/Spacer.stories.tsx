// src/components/organisms/DynamicComponents/molecules/Spacer/Spacer.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { Spacer } from './Spacer'
import { TDynamicComponentsAppTypeMap } from '../../types'

type TInner = TDynamicComponentsAppTypeMap['Spacer']
type TArgs = TInner

const meta: Meta<TArgs> = {
  title: 'Factory/Spacer',
  component: Spacer as any,
  argTypes: {
    id: { control: 'text', description: 'data.id' },
    $space: {
      control: 'number',
      description: 'data.$space – desktop height in px (default 48)',
    },
    $spaceMob: {
      control: 'number',
      description: 'data.$spaceMob – mobile height in px (overrides $space below 1024px)',
    },
    $samespace: {
      control: 'boolean',
      description: 'data.$samespace – if true, desktop height = $space as well',
    },
  },

  render: args => {
    const data: TInner = {
      id: args.id,
      $space: args.$space,
      $spaceMob: args.$spaceMob,
      $samespace: args.$samespace,
    }

    return (
      <>
        <div style={{ padding: 16 }}>
          <div style={{ border: '1px dashed #ccc', padding: 8 }}>
            <div style={{ background: '#f5f5f5', padding: 8 }}>Above spacer</div>
            <Spacer data={data} />
            <div style={{ background: '#f0f0ff', padding: 8 }}>Below spacer</div>
          </div>
        </div>

        <Editor
          defaultLanguage="yaml"
          width="100%"
          height={220}
          value={yaml.stringify({
            type: 'Spacer',
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
    id: 'example-spacer',
    $space: 48,
    $spaceMob: 24,
    $samespace: false,
  },
}

export const SameSpaceEverywhere: Story = {
  args: {
    ...Default.args,
    id: 'example-spacer-samespace',
    $space: 32,
    $spaceMob: undefined,
    $samespace: true,
  },
}

export const MobileOnlyOverride: Story = {
  args: {
    ...Default.args,
    id: 'example-spacer-mobile',
    $space: 64,
    $spaceMob: 16,
    $samespace: false,
  },
}
