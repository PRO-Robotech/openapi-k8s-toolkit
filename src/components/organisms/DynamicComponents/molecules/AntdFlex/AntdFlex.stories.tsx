// src/components/organisms/DynamicComponents/molecules/AntdFlex/AntdFlex.stories.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { AntdFlex } from './AntdFlex'
import type { TDynamicComponentsAppTypeMap } from '../../types'

type TInner = TDynamicComponentsAppTypeMap['antdFlex']

type TArgs = TInner & {
  children?: React.ReactNode
  showYaml?: boolean
}

const meta: Meta<TArgs> = {
  title: 'Factory/AntdFlex',
  component: AntdFlex as any,

  argTypes: {
    id: {
      control: 'text',
      description: 'data.id (Dynamic Renderer id)',
    },

    // layout props
    vertical: {
      control: 'boolean',
      description: 'data.vertical (shorthand for direction="column")',
    },
    align: {
      control: 'select',
      options: [
        'flex-start',
        'center',
        'flex-end',
        'stretch',
        'baseline',
        'normal',
        'start',
        'end',
        'self-start',
        'self-end',
        'inherit',
        'initial',
        'revert',
        'revert-layer',
        'unset',
      ],
      description: 'data.align (align-items)',
    },
    justify: {
      control: 'select',
      options: [
        'flex-start',
        'center',
        'flex-end',
        'space-between',
        'space-around',
        'space-evenly',
        'start',
        'end',
        'left',
        'right',
      ],
      description: 'data.justify (justify-content)',
    },
    wrap: {
      control: 'select',
      options: ['nowrap', 'wrap', 'wrap-reverse'],
      description: 'data.wrap (flex-wrap)',
    },
    gap: {
      control: 'number',
      description: 'data.gap (gap between items, in px)',
    },

    style: {
      control: 'object',
      description: 'data.style (inline style for Flex container)',
    },

    children: {
      control: false,
      description: 'Content rendered inside Flex',
    },

    showYaml: {
      control: 'boolean',
      description: 'Show YAML serialization preview of { type, data }',
    },
  },

  render: args => {
    const { showYaml, children, ...data } = args

    return (
      <>
        <div style={{ padding: 16, border: '1px dashed #999' }}>
          <AntdFlex data={data}>
            {children ?? (
              <>
                <div style={{ padding: 8, background: '#eee' }}>Item 1</div>
                <div style={{ padding: 8, background: '#ddd' }}>Item 2</div>
                <div style={{ padding: 8, background: '#ccc' }}>Item 3</div>
              </>
            )}
          </AntdFlex>
        </div>

        {showYaml && (
          <Editor
            defaultLanguage="yaml"
            width="100%"
            height={220}
            value={yaml.stringify({
              type: 'antdFlex',
              data,
            })}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
            }}
          />
        )}
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
    id: 'example-antd-flex',
    vertical: false,
    align: 'center',
    justify: 'flex-start',
    wrap: 'nowrap',
    gap: 8,
    style: { border: '1px solid #ddd', padding: 8 },
    showYaml: true,
  },
}

export const Vertical: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-flex-vertical',
    vertical: true,
    justify: 'flex-start',
  },
}

export const SpaceBetween: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-flex-space-between',
    justify: 'space-between',
  },
}

export const WrapWithGap: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-flex-wrap-gap',
    wrap: 'wrap',
    gap: 16,
    style: { border: '1px solid #ddd', padding: 8, maxWidth: 320 },
  },
}
