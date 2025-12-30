import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { AntdCard } from './AntdCard'
import type { TDynamicComponentsAppTypeMap } from '../../types'

type TInner = TDynamicComponentsAppTypeMap['antdCard']

const meta: Meta<TInner> = {
  title: 'Factory/AntdCard',
  component: AntdCard as any,
  argTypes: {
    id: {
      control: 'text',
      description: 'data.id (Dynamic Renderer internal id)',
    },
    title: {
      control: 'text',
      description: 'Card title',
    },
    bordered: {
      control: 'boolean',
      description: 'Show card border',
    },
    hoverable: {
      control: 'boolean',
      description: 'Lift on hover',
    },
    size: {
      control: 'radio',
      options: ['default', 'small'],
      description: 'Card size',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading skeleton',
    },
    style: {
      control: 'object',
      description: 'Inline style passed to Card',
    },
  },
  render: args => {
    const data: TInner = {
      id: args.id,
      title: args.title,
      bordered: args.bordered,
      hoverable: args.hoverable,
      size: args.size,
      loading: args.loading,
      style: args.style,
    }

    return (
      <div style={{ padding: 24, maxWidth: 480 }}>
        <AntdCard data={data}>
          <div>Card content (children slot)</div>
        </AntdCard>
      </div>
    )
  },
  parameters: {
    controls: { expanded: true },
  },
}

export default meta

type Story = StoryObj<TInner>

export const Default: Story = {
  args: {
    id: 'example-antd-card',
    title: 'Example Antd Card',
    bordered: true,
    hoverable: false,
    size: 'default',
    loading: false,
    style: { maxWidth: 400 },
  },
}

export const Hoverable: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-card-hoverable',
    hoverable: true,
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    id: 'example-antd-card-loading',
    loading: true,
  },
}
