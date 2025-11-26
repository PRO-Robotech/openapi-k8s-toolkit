// src/components/organisms/DynamicComponents/molecules/AntdText/AntdText.stories.tsx

import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { AntdText } from './AntdText'
import type { TDynamicComponentsAppTypeMap } from '../../types'

type TInner = TDynamicComponentsAppTypeMap['antdText']

type TArgs = TInner & {
  children?: React.ReactNode
  showYaml?: boolean
}

const meta: Meta<TArgs> = {
  title: 'Factory/AntdText',
  component: AntdText as any,

  argTypes: {
    id: {
      control: 'text',
      description: 'Identifier for Dynamic Renderer',
    },
    text: {
      control: 'text',
      description: 'Displayed text',
    },
    type: {
      control: 'select',
      options: [undefined, 'secondary', 'success', 'warning', 'danger'],
      description: 'AntD <Typography.Text> type',
    },
    code: { control: 'boolean', description: 'Render text as <code>' },
    keyboard: { control: 'boolean', description: 'Render as keyboard-tag style' },
    underline: { control: 'boolean' },
    delete: { control: 'boolean' },
    strong: { control: 'boolean' },
    mark: { control: 'boolean' },
    disabled: { control: 'boolean' },
    italic: { control: 'boolean' },

    children: {
      control: 'text',
      description: 'Node appended after the text',
    },

    showYaml: {
      control: 'boolean',
      description: 'Show YAML configuration preview',
    },
  },

  render: args => {
    const { showYaml, children, ...data } = args

    return (
      <>
        <div style={{ padding: 16 }}>
          <AntdText data={data}>{children}</AntdText>
        </div>

        {showYaml && (
          <Editor
            height={200}
            width="100%"
            defaultLanguage="yaml"
            theme="vs-dark"
            value={yaml.stringify({
              type: 'antdText',
              data,
            })}
            options={{ readOnly: true }}
          />
        )}
      </>
    )
  },

  parameters: { controls: { expanded: true } },
}

export default meta

type Story = StoryObj<TArgs>

export const Default: Story = {
  args: {
    id: 'example-text',
    text: 'Hello world!',
    strong: false,
    italic: false,
    underline: false,
    showYaml: true,
  },
}

export const Strong: Story = {
  args: {
    ...Default.args,
    strong: true,
    text: 'Bold text',
  },
}

export const StatusText: Story = {
  args: {
    ...Default.args,
    type: 'success',
    text: 'Operation completed successfully.',
  },
}

export const KeyboardStyle: Story = {
  args: {
    ...Default.args,
    keyboard: true,
    text: 'Ctrl + S',
  },
}
