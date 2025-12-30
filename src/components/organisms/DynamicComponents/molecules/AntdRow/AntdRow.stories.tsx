/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { AntdRow } from './AntdRow'
import type { TDynamicComponentsAppTypeMap } from '../../types'
import { Col } from 'antd'

type TInner = TDynamicComponentsAppTypeMap['antdRow']

type TArgs = TInner & {
  children?: React.ReactNode
  showYaml?: boolean
}

const meta: Meta<TArgs> = {
  title: 'Factory/AntdRow',
  component: AntdRow as any,

  argTypes: {
    id: { control: 'text', description: 'Unique identifier for Dynamic Renderer' },

    // Flex/Grid
    gutter: {
      control: 'object',
      description: 'Spacing between columns: number | [horizontal, vertical]',
    },
    justify: {
      control: 'radio',
      options: ['start', 'end', 'center', 'space-around', 'space-between'],
      description: 'Row horizontal alignment',
    },
    align: {
      control: 'radio',
      options: ['top', 'middle', 'bottom', 'stretch'],
      description: 'Row vertical alignment',
    },
    wrap: {
      control: 'boolean',
      description: 'Enable wrapping of columns',
    },

    children: { control: false, description: 'Placed inside Row' },

    showYaml: {
      control: 'boolean',
      description: 'Display YAML serialization preview',
    },
  },

  render: args => {
    const { showYaml, children, ...data } = args

    return (
      <>
        <div style={{ padding: 16, border: '1px dashed #999' }}>
          <AntdRow data={data}>
            {children ?? (
              <>
                <Col span={6} style={{ background: '#eee', padding: 8 }}>
                  Col 6
                </Col>
                <Col span={6} style={{ background: '#ccc', padding: 8 }}>
                  Col 6
                </Col>
                <Col span={6} style={{ background: '#eee', padding: 8 }}>
                  Col 6
                </Col>
                <Col span={6} style={{ background: '#ccc', padding: 8 }}>
                  Col 6
                </Col>
              </>
            )}
          </AntdRow>
        </div>

        {showYaml && (
          <Editor
            defaultLanguage="yaml"
            width="100%"
            height={220}
            value={yaml.stringify({
              type: 'antdRow',
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
    id: 'example-antd-row',
    gutter: 16,
    justify: 'start',
    align: 'top',
    wrap: true,
    showYaml: true,
  },
}
