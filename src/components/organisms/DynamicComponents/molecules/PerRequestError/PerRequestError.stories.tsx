import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { AxiosError } from 'axios'
import { PerRequestError } from './PerRequestError'

const meta: Meta<typeof PerRequestError> = {
  title: 'Factory/PerRequestError',
  component: PerRequestError,
  argTypes: {
    error: { control: false },
  },
  parameters: {
    controls: { expanded: true },
  },
}
export default meta

type Story = StoryObj<typeof PerRequestError>

export const StringError: Story = {
  name: 'String error',
  args: {
    error: 'A dependent request failed',
  },
}

export const ErrorObject: Story = {
  name: 'Error object',
  args: {
    error: new Error('Request failed with status code 500'),
  },
}

export const AxiosErrorObject: Story = {
  name: 'AxiosError (404)',
  args: {
    error: new AxiosError('Request failed with status code 404'),
  },
}

export const LongMessage: Story = {
  name: 'Long error message',
  args: {
    error: new AxiosError(
      'Request failed: the server responded with 502 Bad Gateway while trying to reach upstream service kube-apiserver at https://kubernetes.default.svc/api/v1/nodes',
    ),
  },
}

export const NullError: Story = {
  name: 'Null (renders nothing)',
  args: {
    error: null,
  },
}

// ── Width stress tests ─────────────────────────────────────────

export const FullWidth: Story = {
  name: 'Width: full (table/editor context)',
  args: {
    error: new AxiosError('Request failed with status code 404'),
  },
  decorators: [
    Story => (
      <div style={{ width: '100%', padding: 16 }}>
        <Story />
      </div>
    ),
  ],
}

export const CardWidth: Story = {
  name: 'Width: 300px (card context)',
  args: {
    error: new AxiosError('Request failed with status code 404'),
  },
  decorators: [
    Story => (
      <div style={{ width: 300, padding: 16, border: '1px solid #d9d9d9', borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
}

export const NarrowWidth: Story = {
  name: 'Width: 150px (badge/button context)',
  args: {
    error: new AxiosError('Request failed with status code 404'),
  },
  decorators: [
    Story => (
      <div style={{ width: 150, padding: 8, border: '1px solid #d9d9d9', borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
}
