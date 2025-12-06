/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { Row } from 'antd'
import { AntdCol } from './AntdCol'
import type { TDynamicComponentsAppTypeMap } from '../../types'

type TInner = TDynamicComponentsAppTypeMap['antdCol']

type TArgs = TInner & {
  children?: React.ReactNode
  showYaml?: boolean
}

const meta: Meta<TArgs> = {
  title: 'Factory/AntdCol',
  component: AntdCol as any,

  argTypes: {
    id: { control: 'text', description: 'data.id (Dynamic Renderer id)' },

    span: {
      control: 'number',
      description: 'Number of columns the Col occupies (0-24)',
    },
    offset: {
      control: 'number',
      description: 'Number of columns to offset on the left (0-24)',
    },
    pull: {
      control: 'number',
      description: 'Number of columns the Col is pulled left',
    },
    push: {
      control: 'number',
      description: 'Number of columns the Col is pushed right',
    },
    flex: {
      control: 'text',
      description: 'Flex CSS value, e.g. "1", "100px", "0 0 50%"',
    },

    xs: {
      control: 'object',
      description: 'Responsive settings for xs breakpoint',
    },
    sm: {
      control: 'object',
      description: 'Responsive settings for sm breakpoint',
    },
    md: {
      control: 'object',
      description: 'Responsive settings for md breakpoint',
    },
    lg: {
      control: 'object',
      description: 'Responsive settings for lg breakpoint',
    },
    xl: {
      control: 'object',
      description: 'Responsive settings for xl breakpoint',
    },
    xxl: {
      control: 'object',
      description: 'Responsive settings for xxl breakpoint',
    },

    children: { control: false, description: 'Content rendered inside Col' },

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
          <Row gutter={16}>
            <AntdCol data={data}>
              {children ?? (
                <div style={{ background: '#eee', padding: 12, textAlign: 'center' }}>
                  AntdCol span={data.span ?? 8}
                </div>
              )}
            </AntdCol>
          </Row>
        </div>

        {showYaml && (
          <Editor
            defaultLanguage="yaml"
            width="100%"
            height={220}
            value={yaml.stringify({
              type: 'antdCol',
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
    id: 'example-antd-col',
    span: 8,
    offset: 0,
    pull: 0,
    push: 0,
    flex: undefined,
    showYaml: true,
  },
}

export const Offset: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-col-offset',
    span: 6,
    offset: 6,
  },
}

export const FlexGrow: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-col-flex',
    span: undefined,
    flex: '1',
  },
}

export const Responsive: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-col-responsive',
    span: undefined,
    xs: { span: 24 },
    sm: { span: 12 },
    md: { span: 8 },
    lg: { span: 6 },
  },
}
