/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

import { DynamicRendererWithProviders } from './DynamicRendererWithProviders'

// ----- Mocks -----

// Make CursorDefaultDiv a simple div that exposes $default as data-default
jest.mock('components/atoms', () => ({
  CursorDefaultDiv: ({ children, onClick, $default }: any) => (
    <div data-testid="cursor" data-default={String(Boolean($default))} onClick={onClick}>
      {children}
    </div>
  ),
}))

// Mock prepare util so we can predict outputs AND verify behavior.
// We'll prefix each url with `${locationPathname}::`
const prepareMock = jest.fn(({ urls, locationPathname }: { urls: string[]; locationPathname: string }) =>
  urls.map(u => `${locationPathname}::${u}`),
)

jest.mock('utils/prepareUrlsToFetchForDynamicRenderer', () => ({
  prepareUrlsToFetchForDynamicRenderer: (args: any) => prepareMock(args),
}))

// Theme provider mock
const ThemeProviderMock = jest.fn(({ theme, children }: any) => (
  <div data-testid="theme-provider" data-theme={theme}>
    {children}
  </div>
))
jest.mock('./providers/themeContext', () => ({
  ThemeProvider: (props: any) => ThemeProviderMock(props),
}))

// Factory config provider mock
const FactoryConfigProviderMock = jest.fn(({ value, children }: any) => (
  <div data-testid="factory-provider" data-profile={value?.nodeTerminalDefaultProfile ?? ''}>
    {children}
  </div>
))
jest.mock('./providers/factoryConfigProvider', () => ({
  FactoryConfigContextProvider: (props: any) => FactoryConfigProviderMock(props),
}))

// PartsOfUrl provider mock
const PartsOfUrlProviderMock = jest.fn(({ value, children }: any) => (
  <div data-testid="parts-provider" data-parts={JSON.stringify(value?.partsOfUrl ?? [])}>
    {children}
  </div>
))
jest.mock('./providers/partsOfUrlContext', () => ({
  PartsOfUrlProvider: (props: any) => PartsOfUrlProviderMock(props),
}))

// MultiQueryProvider (hybrid) mock
const MultiQueryProviderMock = jest.fn(({ items, dataToApplyToContext, children }: any) => (
  <div
    data-testid="multi-provider"
    data-items={JSON.stringify(items)}
    data-extra={typeof dataToApplyToContext === 'undefined' ? 'undefined' : JSON.stringify(dataToApplyToContext)}
  >
    {children}
  </div>
))
jest.mock('./providers/hybridDataProvider', () => ({
  MultiQueryProvider: (props: any) => MultiQueryProviderMock(props),
}))

// DynamicRenderer mock
const DynamicRendererMock = jest.fn((props: any) => (
  <div data-testid="dynamic-renderer" data-props-has-urls={Array.isArray(props.urlsToFetch) ? 'yes' : 'no'} />
))
jest.mock('../DynamicRenderer', () => ({
  DynamicRenderer: (props: any) => DynamicRendererMock(props),
}))

// ----- Helpers -----

const renderWithRoute = (ui: React.ReactElement, route = '/alpha/beta') =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)

describe('DynamicRendererWithProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('prepares mixed urlsToFetch and passes combined items to MultiQueryProvider', () => {
    const route = '/alpha/beta'

    const direct1 = 'url-a'
    const direct2 = 'url-b'

    const k8sRes = {
      cluster: 'cl-1',
      apiGroup: 'apps',
      apiVersion: 'v1',
      plural: 'deployments',
      namespace: 'default',
      fieldSelector: 'app=myapp',
      labelSelector: 'team=core',
      limit: 10,
    }

    const dataToApplyToContext = { hello: 'world' }

    renderWithRoute(
      <DynamicRendererWithProviders
        // DynamicRenderer props (unknown shape) + required extras for this wrapper
        {...({} as any)}
        urlsToFetch={[k8sRes as any, direct1, direct2]}
        dataToApplyToContext={dataToApplyToContext}
        theme="light"
        nodeTerminalDefaultProfile="profile-1"
      />,
      route,
    )

    // ThemeProvider receives theme
    expect(ThemeProviderMock).toHaveBeenCalled()
    expect(screen.getByTestId('theme-provider')).toHaveAttribute('data-theme', 'light')

    // FactoryConfig gets profile
    expect(FactoryConfigProviderMock).toHaveBeenCalled()
    expect(screen.getByTestId('factory-provider')).toHaveAttribute('data-profile', 'profile-1')

    // PartsOfUrl gets pathname parts
    expect(PartsOfUrlProviderMock).toHaveBeenCalled()
    const partsAttr = screen.getByTestId('parts-provider').getAttribute('data-parts')
    expect(partsAttr).toBe(JSON.stringify(route.split('/')))

    // prepare util should be called:
    // - once for direct urls array
    // - once per string key in the K8s resource (7 keys)
    //
    // STRING_KEYS: cluster, apiGroup, apiVersion, plural, namespace, fieldSelector, labelSelector
    // all are non-empty strings in our test
    expect(prepareMock).toHaveBeenCalled()

    // Build expected prepared direct urls
    const preparedDirect = [`${route}::${direct1}`, `${route}::${direct2}`]

    // Build expected prepared K8s resource (each string key prepared)
    const expectedPreparedK8s = {
      ...k8sRes,
      cluster: `${route}::${k8sRes.cluster}`,
      apiGroup: `${route}::${k8sRes.apiGroup}`,
      apiVersion: `${route}::${k8sRes.apiVersion}`,
      plural: `${route}::${k8sRes.plural}`,
      namespace: `${route}::${k8sRes.namespace}`,
      fieldSelector: `${route}::${k8sRes.fieldSelector}`,
      labelSelector: `${route}::${k8sRes.labelSelector}`,
      limit: 10,
    }

    // MultiQueryProvider should receive items: [preparedK8s..., preparedDirect...]
    expect(MultiQueryProviderMock).toHaveBeenCalledTimes(1)

    const itemsJson = screen.getByTestId('multi-provider').getAttribute('data-items')
    expect(itemsJson).toBe(JSON.stringify([expectedPreparedK8s, ...preparedDirect]))

    const extraJson = screen.getByTestId('multi-provider').getAttribute('data-extra')
    expect(extraJson).toBe(JSON.stringify(dataToApplyToContext))

    // DynamicRenderer is rendered
    expect(DynamicRendererMock).toHaveBeenCalled()
    expect(screen.getByTestId('dynamic-renderer')).toBeInTheDocument()
  })

  test('disableEventBubbling=true stops click propagation', () => {
    const parentClick = jest.fn()

    const k8sRes = {
      cluster: 'cl-1',
      apiGroup: 'apps',
      apiVersion: 'v1',
      plural: 'deployments',
    }

    renderWithRoute(
      <div onClick={parentClick}>
        <DynamicRendererWithProviders
          {...({} as any)}
          urlsToFetch={[k8sRes as any, 'u1']}
          theme="dark"
          disableEventBubbling
        />
      </div>,
      '/x/y',
    )

    fireEvent.click(screen.getByTestId('cursor'))
    expect(screen.getByTestId('cursor')).toHaveAttribute('data-default', 'true')
    expect(parentClick).not.toHaveBeenCalled()
  })

  test('disableEventBubbling=false allows click propagation', () => {
    const parentClick = jest.fn()

    const k8sRes = {
      cluster: 'cl-1',
      apiGroup: 'apps',
      apiVersion: 'v1',
      plural: 'deployments',
    }

    renderWithRoute(
      <div onClick={parentClick}>
        <DynamicRendererWithProviders
          {...({} as any)}
          urlsToFetch={[k8sRes as any, 'u1']}
          theme="dark"
          disableEventBubbling={false}
        />
      </div>,
      '/x/y',
    )

    fireEvent.click(screen.getByTestId('cursor'))
    expect(screen.getByTestId('cursor')).toHaveAttribute('data-default', 'false')
    expect(parentClick).toHaveBeenCalledTimes(1)
  })
})
