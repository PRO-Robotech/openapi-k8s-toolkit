import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import Editor from '@monaco-editor/react'
import * as yaml from 'yaml'

import { DefaultDiv } from './DefaultDiv'
import { TDynamicComponentsAppTypeMap } from '../../types'

type TInner = TDynamicComponentsAppTypeMap['DefaultDiv']

type TArgs = TInner & {
  previewYaml?: boolean
}

const meta: Meta<TArgs> = {
  title: 'Factory/DefaultDiv',
  component: DefaultDiv as any,
  args: {
    id: 'default-div-example',
    style: { padding: 16, background: '#f5f5f5', borderRadius: 6 },
    children: 'This is a Dynamic DefaultDiv component.',
  },
  argTypes: {
    id: { control: 'text' },
    style: { control: 'object' },
    className: { control: 'text' },
    title: { control: 'text' },
    onClick: { action: 'clicked' },
    previewYaml: { control: 'boolean' },
  },
  render: args => {
    const { previewYaml, children, ...data } = args

    return (
      <>
        <DefaultDiv data={data}>{children}</DefaultDiv>

        {previewYaml && (
          <Editor
            defaultLanguage="yaml"
            width="100%"
            height={180}
            value={yaml.stringify({
              type: 'DefaultDiv',
              data,
            })}
            theme="vs-dark"
            options={{ readOnly: true }}
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

export const Basic: Story = {}

export const StyledCard: Story = {
  args: {
    style: {
      padding: 24,
      background: '#fff',
      border: '1px solid #ddd',
      borderRadius: 8,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    },
    children: 'A styled version of DefaultDiv acting like a card.',
  },
}
