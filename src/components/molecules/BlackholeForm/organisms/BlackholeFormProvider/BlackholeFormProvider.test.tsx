/* eslint-disable react/destructuring-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/** @jest-environment jsdom */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import { BlackholeFormProvider } from './BlackholeFormProvider'

jest.mock('axios')
const mockPost = axios.post as unknown as jest.Mock

jest.mock('../BlackholeForm', () => ({
  BlackholeForm: (props: any) => (
    <div data-testid="blackhole-form">
      kind:{props.kind}; type:{props.type}; gvr:{props.apiGroupApiVersion}
    </div>
  ),
}))

jest.mock('../../../YamlEditorSingleton', () => ({
  YamlEditorSingleton: () => <div data-testid="yaml-editor-singleton" />,
}))

const baseProps = {
  theme: 'light' as const,
  cluster: 'c1',
  urlParams: {} as any,
  urlParamsForPermissions: { apiGroup: 'apps', plural: 'deployments' },
  data: {
    type: 'apis' as const,
    apiGroup: 'apps',
    apiVersion: 'v1',
    plural: 'deployments',
  },
}

describe('BlackholeFormProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders BlackholeForm on success', async () => {
    mockPost.mockResolvedValue({
      data: {
        result: 'ok',
        properties: { spec: { type: 'object' } },
        required: ['spec'],
        expandedPaths: [],
        persistedPaths: [],
        kind: 'Deployment',
        isNamespaced: true,
        namespacesData: ['ns1'],
      },
    })

    render(<BlackholeFormProvider {...(baseProps as any)} />)

    expect(await screen.findByTestId('blackhole-form')).toBeInTheDocument()
    expect(screen.getByText(/kind:Deployment/)).toBeInTheDocument()
  })

  test('backend result=error: shows Alert and requests manual fallback when parent does not update mode', async () => {
    const onChange = jest.fn()
    const onDisabled = jest.fn()

    mockPost.mockResolvedValue({
      data: {
        result: 'error',
        error: 'prepare failed',
        isNamespaced: false,
      },
    })

    render(<BlackholeFormProvider {...(baseProps as any)} modeData={{ current: 'Auto', onChange, onDisabled }} />)

    expect(await screen.findByText('prepare failed')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith('Manual')
    expect(onDisabled).toHaveBeenCalled()
  })

  test('backend result=error: renders YamlEditorSingleton when parent updates mode to Manual', async () => {
    mockPost.mockResolvedValue({
      data: {
        result: 'error',
        error: 'prepare failed',
        isNamespaced: false,
      },
    })

    const Harness = () => {
      const [current, setCurrent] = React.useState<'Auto' | 'Manual'>('Auto')
      const modeData = {
        current,
        onChange: (v: string) => setCurrent(v as any),
        onDisabled: jest.fn(),
      }

      return <BlackholeFormProvider {...(baseProps as any)} modeData={modeData} />
    }

    render(<Harness />)

    // parent state will flip to Manual via onChange
    expect(await screen.findByTestId('yaml-editor-singleton')).toBeInTheDocument()
  })

  test('handles axios error (shows Alert)', async () => {
    mockPost.mockRejectedValue(new Error('network down'))

    render(<BlackholeFormProvider {...(baseProps as any)} />)

    expect(await screen.findByText('network down')).toBeInTheDocument()
  })

  test('cluster empty: still does not explode (basic smoke)', async () => {
    mockPost.mockResolvedValue({
      data: {
        result: 'ok',
        properties: { spec: { type: 'object' } },
        required: [],
        expandedPaths: [],
        persistedPaths: [],
        kind: 'Deployment',
      },
    })

    render(<BlackholeFormProvider {...(baseProps as any)} cluster="" />)

    // Should still handle response
    await waitFor(() => {
      expect(screen.queryByTestId('blackhole-form')).toBeInTheDocument()
    })
  })
})
