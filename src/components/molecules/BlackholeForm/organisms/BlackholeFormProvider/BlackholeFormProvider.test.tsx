/* eslint-disable react/destructuring-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/** @jest-environment jsdom */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { BlackholeFormProvider } from './BlackholeFormProvider'

jest.mock('axios')
const mockPost = axios.post as unknown as jest.Mock

jest.mock('hooks/useK8sSmartResource', () => ({
  useK8sSmartResource: jest.fn(),
}))
const mockUseK8sSmartResource = useK8sSmartResource as jest.Mock

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
  partsOfUrl: ['', 'openapi-ui', 'c1', 'ns1'],
  forcingCustomization: {
    baseApiGroup: 'front.in-cloud.io',
    baseApiVersion: 'v1alpha1',
    cfoMappingPlural: 'cfomappings',
    cfoMappinResourceName: 'default',
  },
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
    mockUseK8sSmartResource.mockImplementation(({ plural }: { plural: string }) => {
      if (plural === 'customformsoverrides' || plural === 'customformsprefills') {
        return {
          data: undefined,
          isLoading: false,
          isError: false,
        }
      }

      return {
        data: undefined,
        isLoading: false,
        isError: false,
      }
    })
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
    expect(mockPost).toHaveBeenCalledWith(`/api/clusters/c1/openapi-bff/forms/formPrepare/prepareFormProps`, {
      cluster: 'c1',
      partsOfUrl: ['', 'openapi-ui', 'c1', 'ns1'],
      data: baseProps.data,
      customizationId: undefined,
      customizationIdPrefill: undefined,
    })
  })

  test('sends direct customizationId for prefill when matching prefill exists', async () => {
    mockUseK8sSmartResource.mockImplementation(({ plural }: { plural: string }) => {
      if (plural === 'customformsoverrides') {
        return {
          data: { items: [{ spec: { customizationId: 'custom-a' } }] },
          isLoading: false,
          isError: false,
        }
      }

      if (plural === 'customformsprefills') {
        return {
          data: { items: [{ spec: { customizationId: 'custom-a' } }] },
          isLoading: false,
          isError: false,
        }
      }

      return {
        data: { items: [{ spec: { mappings: { 'custom-a': 'mapped-a' } } }] },
        isLoading: false,
        isError: false,
      }
    })

    mockPost.mockResolvedValue({
      data: {
        result: 'ok',
        properties: { spec: { type: 'object' } },
        required: ['spec'],
        expandedPaths: [],
        persistedPaths: [],
        kind: 'Deployment',
        isNamespaced: true,
      },
    })

    render(<BlackholeFormProvider {...(baseProps as any)} customizationId="custom-a" />)

    await screen.findByTestId('blackhole-form')

    expect(mockPost).toHaveBeenCalledWith(`/api/clusters/c1/openapi-bff/forms/formPrepare/prepareFormProps`, {
      cluster: 'c1',
      partsOfUrl: ['', 'openapi-ui', 'c1', 'ns1'],
      data: baseProps.data,
      customizationId: 'custom-a',
      customizationIdPrefill: 'custom-a',
    })
  })

  test('falls back to fallbackId for prefill when customizationId and mapped id are missing in prefills', async () => {
    mockUseK8sSmartResource.mockImplementation(({ plural }: { plural: string }) => {
      if (plural === 'customformsoverrides') {
        return {
          data: { items: [{ spec: { customizationId: 'mapped-a' } }] },
          isLoading: false,
          isError: false,
        }
      }

      if (plural === 'customformsprefills') {
        return {
          data: { items: [{ spec: { customizationId: 'fallback-a' } }] },
          isLoading: false,
          isError: false,
        }
      }

      return {
        data: { items: [{ spec: { mappings: { 'custom-a': 'mapped-a' } } }] },
        isLoading: false,
        isError: false,
      }
    })

    mockPost.mockResolvedValue({
      data: {
        result: 'ok',
        properties: { spec: { type: 'object' } },
        required: ['spec'],
        expandedPaths: [],
        persistedPaths: [],
        kind: 'Deployment',
        isNamespaced: true,
      },
    })

    render(
      <BlackholeFormProvider
        {...(baseProps as any)}
        customizationId="custom-a"
        forcingCustomization={{ ...baseProps.forcingCustomization, fallbackId: 'fallback-a' }}
      />,
    )

    await screen.findByTestId('blackhole-form')

    expect(mockPost).toHaveBeenCalledWith(`/api/clusters/c1/openapi-bff/forms/formPrepare/prepareFormProps`, {
      cluster: 'c1',
      partsOfUrl: ['', 'openapi-ui', 'c1', 'ns1'],
      data: baseProps.data,
      customizationId: 'mapped-a',
      customizationIdPrefill: 'fallback-a',
    })
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

    render(<BlackholeFormProvider {...(baseProps as any)} modeData={{ current: 'OpenAPI', onChange, onDisabled }} />)

    expect(await screen.findByText('prepare failed')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith('Manual')
    expect(onDisabled).not.toHaveBeenCalled()
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
      const [current, setCurrent] = React.useState<'OpenAPI' | 'Manual'>('OpenAPI')
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

  test('cluster empty: skips prepareFormProps request', async () => {
    render(<BlackholeFormProvider {...(baseProps as any)} cluster="" />)

    await waitFor(() => {
      expect(mockPost).not.toHaveBeenCalled()
    })
  })
})
