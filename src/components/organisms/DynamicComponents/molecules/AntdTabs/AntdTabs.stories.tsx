/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { AntdTabs } from './AntdTabs'
import type { TDynamicComponentsAppTypeMap } from '../../types'

type TInner = TDynamicComponentsAppTypeMap['antdTabs']

type TArgs = TInner & {
  children?: React.ReactNode
  showYaml?: boolean
}

const meta: Meta<TArgs> = {
  title: 'Factory/AntdTabs',
  component: AntdTabs as any,

  argTypes: {
    // data.*
    id: { control: 'text', description: 'data.id (used by Dynamic Renderer)' },

    activeKey: {
      control: 'text',
      description: 'Currently active tab key',
    },
    defaultActiveKey: {
      control: 'text',
      description: 'Default active tab key',
    },
    size: {
      control: 'radio',
      options: ['small', 'middle', 'large'],
      description: 'Tabs size',
    },
    tabPosition: {
      control: 'radio',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Tabs position',
    },
    type: {
      control: 'radio',
      options: ['line', 'card', 'editable-card'],
      description: 'Tabs type',
    },
    centered: {
      control: 'boolean',
      description: 'Center tabs',
    },
    destroyInactiveTabPane: {
      control: 'boolean',
      description: 'Destroy inactive tab pane',
    },
    animated: {
      control: 'boolean',
      description: 'Enable/disable animated transitions',
    },
    tabBarGutter: {
      control: 'number',
      description: 'Gap between tabs',
    },

    // items as plain object control
    items: {
      control: 'object',
      description: 'Tabs items: [{ key, label, children }]. Passed directly to antd Tabs `items` prop',
    },

    // extras
    showYaml: {
      control: 'boolean',
      description: 'Show YAML configuration preview',
    },
    children: {
      control: false,
      description: 'Children passed inside <Tabs> (usually unused when using items)',
    },
  },

  render: args => {
    const { showYaml, children, ...data } = args

    return (
      <>
        <div style={{ padding: 16 }}>
          <AntdTabs data={data}>{children}</AntdTabs>
        </div>

        {showYaml && (
          <Editor
            defaultLanguage="yaml"
            width="100%"
            height={260}
            value={yaml.stringify({
              type: 'antdTabs',
              data,
            })}
            theme="vs-dark"
            options={{
              theme: 'vs-dark',
              readOnly: true,
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
    id: 'example-antd-tabs',
    defaultActiveKey: 'tab1',
    size: 'middle',
    tabPosition: 'top',
    type: 'line',
    centered: false,
    destroyInactiveTabPane: false,
    animated: true,
    tabBarGutter: 16,
    items: [
      { key: 'tab1', label: 'Tab One', children: 'Content of Tab One' },
      { key: 'tab2', label: 'Tab Two', children: 'Content of Tab Two' },
      { key: 'tab3', label: 'Tab Three', children: 'Content of Tab Three' },
    ],
    showYaml: true,
  },
}

export const CardTabs: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-tabs-card',
    type: 'card',
  },
}

export const BottomPosition: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-tabs-bottom',
    tabPosition: 'bottom',
  },
}

export const CenteredLarge: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-tabs-centered',
    centered: true,
    size: 'large',
  },
}
