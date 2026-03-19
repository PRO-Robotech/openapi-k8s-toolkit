/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { Volumes } from './Volumes'

type TCapturedEnrichedTableProps = {
  dataSource: Array<Record<string, unknown>>
  additionalPrinterColumnsKeyTypeProps: {
    typeName: {
      customProps: {
        items: Array<{
          children: Array<{
            children?: Array<{
              data: {
                href: string
              }
            }>
          }>
        }>
      }
    }
    containerName: {
      customProps: {
        items: Array<{
          children: Array<{
            type?: string
            data?: {
              href?: string
              text?: string
              tooltip?: string
            }
          }>
        }>
      }
    }
  }
}

const enrichedTableMock = jest.fn<void, [TCapturedEnrichedTableProps]>()

jest.mock('components/molecules', () => ({
  EnrichedTable: (props: any) => {
    enrichedTableMock(props)
    return <div data-testid="enriched-table" />
  },
}))

jest.mock('hooks/useK8sSmartResource', () => ({
  useK8sSmartResource: jest.fn(),
}))

jest.mock('../../../DynamicRendererWithProviders/providers/hybridDataProvider', () => ({
  useMultiQuery: jest.fn(),
}))

jest.mock('../../../DynamicRendererWithProviders/providers/partsOfUrlContext', () => ({
  usePartsOfUrl: jest.fn(() => ({ partsOfUrl: ['ignored', 'ignored', 'forced-ns', 'cluster-a'] })),
}))

jest.mock('../../../DynamicRendererWithProviders/providers/themeContext', () => ({
  useTheme: jest.fn(() => 'light'),
}))

const { useMultiQuery } = jest.requireMock('../../../DynamicRendererWithProviders/providers/hybridDataProvider') as {
  useMultiQuery: jest.Mock
}

const mockUseK8sSmartResource = useK8sSmartResource as unknown as jest.Mock

const getCapturedProps = (): TCapturedEnrichedTableProps => {
  const firstCall = enrichedTableMock.mock.calls[0]
  expect(firstCall).toBeDefined()
  return firstCall[0]
}

const getTypeHrefTemplate = (props: TCapturedEnrichedTableProps): string => {
  const linkContainer = props.additionalPrinterColumnsKeyTypeProps.typeName.customProps.items[0]?.children[1]
  expect(linkContainer).toBeDefined()

  const linkItem = linkContainer?.children?.[0]
  expect(linkItem).toBeDefined()

  return linkItem!.data.href
}

const getContainerHrefTemplate = (props: TCapturedEnrichedTableProps): string => {
  const linkItem = props.additionalPrinterColumnsKeyTypeProps.containerName.customProps.items[0]?.children[1]
  expect(linkItem?.data?.href).toBeDefined()

  return linkItem!.data!.href!
}

const getContainerColumnItem = (props: TCapturedEnrichedTableProps) =>
  props.additionalPrinterColumnsKeyTypeProps.containerName.customProps.items[0]?.children[1]

const baseData = {
  id: 'volumes',
  baseprefix: '/openapi-ui',
  cluster: '{3}',
  reqIndex: '0',
  jsonPathToSpec: '.spec',
  jsonPathToPodName: '.metadata.name',
  errorText: 'No data',
  baseFactoryNamespacedAPIKey: 'factory-namespaced-api',
  baseFactoryClusterSceopedAPIKey: 'factory-clusterscoped-api',
  baseFactoryNamespacedBuiltinKey: 'factory-namespaced-builtin',
  baseFactoryClusterSceopedBuiltinKey: 'factory-clusterscoped-builtin',
  baseNavigationPluralName: 'navigations',
  baseNavigationSpecificName: 'navigation',
}

const multiQueryData = {
  req0: {
    metadata: {
      name: 'pod-a',
      namespace: 'root-ns',
    },
    spec: {
      containers: [
        {
          name: 'main',
          volumeMounts: [
            { name: 'cfg-vol', mountPath: '/etc/config' },
            { name: 'sec-vol', mountPath: '/etc/secret', readOnly: true },
            { name: 'cache-vol', mountPath: '/cache' },
            { name: 'projected-vol', mountPath: '/projected' },
          ],
        },
      ],
      volumes: [
        { name: 'cfg-vol', configMap: { name: 'cfg-one' } },
        { name: 'sec-vol', secret: { secretName: 'sec-one' } },
        { name: 'cache-vol', emptyDir: {} },
        {
          name: 'projected-vol',
          projected: {
            sources: [{ configMap: { name: 'projected-cm' } }, { secret: { name: 'projected-secret' } }],
          },
        },
      ],
    },
  },
}

describe('Volumes', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    useMultiQuery.mockReturnValue({
      data: multiQueryData,
      isLoading: false,
      isError: false,
      errors: [],
      hasErrorForReq: () => false,
      getErrorForReq: () => null,
    })

    mockUseK8sSmartResource.mockReturnValue({
      data: {
        items: [
          {
            spec: {
              baseFactoriesMapping: {
                'factory-namespaced-builtin-v1-secrets': 'secret-details',
              },
            },
          },
        ],
      },
      isLoading: false,
      isError: false,
    })
  })

  test('builds navigation-aware configmap and secret links with forced namespace', () => {
    render(<Volumes data={{ ...baseData, forcedNamespace: '{2}' }} />)

    expect(screen.getByTestId('enriched-table')).toBeInTheDocument()
    expect(mockUseK8sSmartResource).toHaveBeenCalledWith({
      cluster: 'cluster-a',
      apiGroup: 'front.in-cloud.io',
      apiVersion: 'v1alpha1',
      plural: 'navigations',
      fieldSelector: 'metadata.name=navigation',
    })

    const props = getCapturedProps()
    expect(getTypeHrefTemplate(props)).toBe("{reqsJsonPath[0]['.typeHref']['']}")

    expect(props.dataSource).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          typeKey: 'configMap',
          typeName: 'cfg-one',
          namespace: 'forced-ns',
          typeHref: '/openapi-ui/cluster-a/forced-ns/factory/factory-namespaced-builtin/v1/configmaps/cfg-one',
        }),
        expect.objectContaining({
          typeKey: 'secret',
          typeName: 'sec-one',
          namespace: 'forced-ns',
          typeHref: '/openapi-ui/cluster-a/forced-ns/factory/secret-details/v1/secrets/sec-one',
        }),
      ]),
    )
  })

  test('uses containerFactoryKey for container links when provided', () => {
    render(<Volumes data={{ ...baseData, containerFactoryKey: 'factory-container-runtime' }} />)

    const props = getCapturedProps()
    expect(getContainerHrefTemplate(props)).toBe(
      "/openapi-ui/{2}/{3}/factory/factory-container-runtime/v1/containers/{reqsJsonPath[0]['.podName']['-']}/{reqsJsonPath[0]['.containerName']['-']}",
    )
  })

  test('renders container name as parsed text with tooltip when containerFactoryKey is missing', () => {
    render(<Volumes data={baseData} />)

    const props = getCapturedProps()
    expect(getContainerColumnItem(props)).toEqual(
      expect.objectContaining({
        type: 'parsedText',
        data: expect.objectContaining({
          text: "{reqsJsonPath[0]['.containerName']['-']}",
          tooltip: "{reqsJsonPath[0]['.containerName']['-']}",
        }),
      }),
    )
  })

  test('falls back to detected namespace and keeps non-linkable types as plain text', () => {
    render(<Volumes data={baseData} />)

    const props = getCapturedProps()
    expect(props.dataSource).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          typeKey: 'emptyDir',
          namespace: 'root-ns',
          typeHref: '',
        }),
      ]),
    )
  })

  test('waits for navigation data before rendering the table', () => {
    mockUseK8sSmartResource.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(<Volumes data={baseData} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(enrichedTableMock).not.toHaveBeenCalled()
  })

  test('falls back to base factory keys when navigation returns no mapping', () => {
    mockUseK8sSmartResource.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })

    render(<Volumes data={{ ...baseData, forcedNamespace: '{2}' }} />)

    expect(screen.getByTestId('enriched-table')).toBeInTheDocument()

    const props = getCapturedProps()
    expect(props.dataSource).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          typeKey: 'configMap',
          typeName: 'cfg-one',
          typeHref: '/openapi-ui/cluster-a/forced-ns/factory/factory-namespaced-builtin/v1/configmaps/cfg-one',
        }),
        expect.objectContaining({
          typeKey: 'secret',
          typeName: 'sec-one',
          typeHref: '/openapi-ui/cluster-a/forced-ns/factory/factory-namespaced-builtin/v1/secrets/sec-one',
        }),
      ]),
    )
  })

  test('keeps loading while computed factory keys are still placeholders', () => {
    mockUseK8sSmartResource.mockReturnValue({
      data: {
        items: [
          {
            spec: {
              baseFactoriesMapping: {
                'factory-namespaced-builtin-v1-secrets': '...',
              },
            },
          },
        ],
      },
      isLoading: false,
      isError: false,
    })

    render(<Volumes data={{ ...baseData, forcedNamespace: '{2}' }} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(enrichedTableMock).not.toHaveBeenCalled()
  })

  test('builds links for projected configmap and secret sources', () => {
    render(<Volumes data={{ ...baseData, forcedNamespace: '{2}' }} />)

    const props = getCapturedProps()
    expect(props.dataSource).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          typeKey: 'configMap',
          typeName: 'projected-cm',
          typeHref: '/openapi-ui/cluster-a/forced-ns/factory/factory-namespaced-builtin/v1/configmaps/projected-cm',
        }),
        expect.objectContaining({
          typeKey: 'secret',
          typeName: 'projected-secret',
          typeHref: '/openapi-ui/cluster-a/forced-ns/factory/secret-details/v1/secrets/projected-secret',
        }),
      ]),
    )
  })
})
