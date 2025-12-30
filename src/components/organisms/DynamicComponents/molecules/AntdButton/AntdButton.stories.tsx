import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { AntdButton } from './AntdButton'
import type { TDynamicComponentsAppTypeMap } from '../../types'

type TInner = TDynamicComponentsAppTypeMap['antdButton']

const meta: Meta<TInner> = {
  title: 'Factory / AntdButton',
  component: AntdButton as any,
  argTypes: {
    id: {
      control: 'text',
      description: 'Dynamic Renderer internal ID',
    },
    text: {
      control: 'text',
      description: 'Button label text',
    },
    type: {
      control: 'radio',
      options: ['default', 'primary', 'link', 'dashed', 'text'],
    },
    danger: {
      control: 'boolean',
    },
    size: {
      control: 'radio',
      options: ['small', 'middle', 'large'],
    },
    disabled: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
    style: {
      control: 'object',
    },
  },
  render: args => {
    const data: TInner = {
      id: args.id,
      text: args.text,
      type: args.type,
      danger: args.danger,
      size: args.size,
      disabled: args.disabled,
      loading: args.loading,
      style: args.style,
    }

    return (
      <div style={{ padding: 20 }}>
        <AntdButton data={data} />
      </div>
    )
  },
  parameters: { controls: { expanded: true } },
}

export default meta

type Story = StoryObj<TInner>

export const Default: Story = {
  args: {
    id: 'example-button',
    text: 'Click me',
    type: 'primary',
    size: 'middle',
  },
}

export const Danger: Story = {
  args: {
    ...Default.args,
    id: 'danger',
    danger: true,
    text: 'Delete',
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    id: 'loading',
    loading: true,
    text: 'Processing...',
  },
}

export const Disabled: Story = {
  args: {
    ...Default.args,
    id: 'disabled',
    disabled: true,
    text: 'Disabled Button',
  },
}
