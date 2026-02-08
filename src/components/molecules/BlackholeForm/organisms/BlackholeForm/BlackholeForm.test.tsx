/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { BlackholeForm, TBlackholeFormProps } from './BlackholeForm'

// -----------------------------
// Global DOM polyfills for jsdom
// -----------------------------
beforeAll(() => {
  // antd / your code calls scrollTo on a div ref
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    value: jest.fn(),
    writable: true,
  })
})

// -----------------------------
// Mocks (keep them minimal & stable)
// -----------------------------

// Make debounce synchronous to avoid act warnings
jest.mock('usehooks-ts', () => ({
  useDebounceCallback: (fn: any) => fn,
}))

// Mock axios default export + isAxiosError
const axiosPostMock = jest.fn()
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: (...args: any[]) => axiosPostMock(...args),
  },
  isAxiosError: (e: any) => Boolean(e?.isAxiosError),
}))

// Router navigate
const navigateMock = jest.fn()
jest.mock('react-router-dom', () => ({
  __esModule: true,
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => navigateMock,
}))

// Aliased modules might not be mapped in Jest config,
// so we declare them as virtual mocks.
const usePermissionsMock = jest.fn()
jest.mock(
  'hooks/usePermissions',
  () => ({
    usePermissions: (args: any) => usePermissionsMock(args),
  }),
  { virtual: true },
)

const createNewEntryMock = jest.fn()
const updateEntryMock = jest.fn()
jest.mock(
  'api/forms',
  () => ({
    createNewEntry: (args: any) => createNewEntryMock(args),
    updateEntry: (args: any) => updateEntryMock(args),
  }),
  { virtual: true },
)

jest.mock(
  'utils/filterSelectOptions',
  () => ({
    filterSelectOptions: jest.fn((x: any) => x),
  }),
  { virtual: true },
)

jest.mock(
  'utils/normalizeValuesForQuotas',
  () => ({
    normalizeValuesForQuotasToNumber: (schema: any) => schema,
  }),
  { virtual: true },
)

jest.mock(
  'utils/getAllPathsFromObj',
  () => ({
    getAllPathsFromObj: () => [],
  }),
  { virtual: true },
)

jest.mock(
  'utils/getPrefixSubArrays',
  () => ({
    getPrefixSubarrays: () => [],
  }),
  { virtual: true },
)

jest.mock(
  'utils/deepMerge',
  () => ({
    deepMerge: (a: any, b: any) => ({ ...(a || {}), ...(b || {}) }),
  }),
  { virtual: true },
)

jest.mock(
  'components/atoms',
  () => {
    const React = require('react')
    return {
      FlexGrow: () => React.createElement('div', { 'data-testid': 'flex-grow' }),
      Spacer: () => React.createElement('div', { 'data-testid': 'spacer' }),
      PlusIcon: () => React.createElement('span', { 'data-testid': 'plus-icon' }),
    }
  },
  { virtual: true },
)

// Local helpers used heavily in effects — simplify them
jest.mock('./helpers/debugs', () => ({
  DEBUG_PREFILLS: false,
  dbg: jest.fn(),
  group: jest.fn(),
  end: jest.fn(),
  wdbg: jest.fn(),
  wgroup: jest.fn(),
  wend: jest.fn(),
  prettyPath: (p: any) => (Array.isArray(p) ? p.join('.') : String(p)),
}))

jest.mock('./helpers/hiddenExpanded', () => ({
  sanitizeWildcardPath: (p: any) => p,
  expandWildcardTemplates: () => [],
  toStringPath: (p: any) => p,
  isPrefix: () => false,
}))

jest.mock('./helpers/prefills', () => ({
  toWildcardPath: (p: any) => p,
  collectArrayLengths: () => new Map(),
  templateMatchesArray: () => false,
  buildConcretePathForNewItem: (_tpl: any, arrayPath: any, newIndex: any) => [...arrayPath, newIndex],
  scrubLiteralWildcardKeys: (v: any) => v,
}))

jest.mock('./helpers/casts', () => ({
  pathKey: (p: any) => JSON.stringify(p),
  pruneAdditionalForValues: (props: any) => props,
  materializeAdditionalFromValues: (props: any) => ({ props, toPersist: [] }),
}))

jest.mock('./utilsErrorHandler', () => ({
  handleSubmitError: () => [],
  handleValidationError: () => [],
}))

// Stub the huge recursive form builder
jest.mock('./utils', () => {
  const React = require('react')
  return {
    getObjectFormItemsDraft: jest.fn(() => React.createElement('div', { 'data-testid': 'draft-items' })),
  }
})

// Stub YAML editor UI
jest.mock('../../molecules', () => {
  const React = require('react')
  return {
    YamlEditor: ({ editorUri, theme }: any) =>
      React.createElement(
        'div',
        {
          'data-testid': 'yaml-editor',
          'data-editor-uri': editorUri,
          'data-theme': theme,
        },
        'YAML_EDITOR',
      ),
  }
})

// -----------------------------
// Test data
// -----------------------------
const baseProps: TBlackholeFormProps = {
  cluster: 'c1',
  theme: 'light',
  urlParams: {} as any,
  urlParamsForPermissions: { apiGroup: 'apps', plural: 'deployments' },
  staticProperties: {} as any,
  required: [],
  hiddenPaths: [],
  expandedPaths: [],
  persistedPaths: [],
  sortPaths: [],
  prefillValuesSchema: undefined,
  prefillValueNamespaceOnly: undefined,
  isNameSpaced: false,
  isCreate: true,
  type: 'apis',
  apiGroupApiVersion: 'apps/v1',
  kind: 'Deployment',
  plural: 'deployments',
  backlink: undefined,
  designNewLayout: false,
  designNewLayoutHeight: undefined,
}

const editPrefills = {
  spec: {
    values: [
      { path: ['metadata', 'name'], value: 'dep1' },
      { path: ['metadata', 'namespace'], value: 'default' },
    ],
  },
} as any

// -----------------------------
// Setup
// -----------------------------
beforeEach(() => {
  jest.clearAllMocks()

  // Silence noisy logs from the component
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})

  // Permissions are allowed by default
  usePermissionsMock.mockReturnValue({
    data: { status: { allowed: true } },
  })

  // Default axios behaviour: resolve with empty object
  axiosPostMock.mockResolvedValue({ data: {} })

  // Default API calls resolve
  createNewEntryMock.mockResolvedValue({ ok: true })
  updateEntryMock.mockResolvedValue({ ok: true })
})

// -----------------------------
// Tests
// -----------------------------
describe('BlackholeForm', () => {
  test('renders YAML editor with correct editorUri in create mode', () => {
    render(<BlackholeForm {...baseProps} />)

    expect(screen.getByTestId('yaml-editor')).toHaveAttribute(
      'data-editor-uri',
      'inmemory://openapi-ui/c1/apps/v1/apis/deployments/Deployment/create.yaml',
    )
  })

  test('renders YAML editor with correct editorUri in edit mode', () => {
    render(<BlackholeForm {...baseProps} isCreate={false} formsPrefills={editPrefills} />)

    expect(screen.getByTestId('yaml-editor')).toHaveAttribute(
      'data-editor-uri',
      'inmemory://openapi-ui/c1/apps/v1/apis/deployments/Deployment/edit.yaml',
    )
  })

  test('submit (create mode) calls createNewEntry with correct endpoint/body', async () => {
    // Return a stable "yaml body" for any values->yaml call
    axiosPostMock.mockImplementation(async (url: string) => {
      if (String(url).includes('getYamlValuesByFromValues')) {
        return { data: 'YAML_BODY_CREATE' }
      }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(createNewEntryMock).toHaveBeenCalled()
    })

    const callArg = createNewEntryMock.mock.calls[0][0]
    expect(callArg.endpoint).toBe('/api/clusters/c1/k8s/apis/apps/v1/deployments/')
    expect(callArg.body).toBe('YAML_BODY_CREATE')
  })

  test('submit (edit mode) calls updateEntry with correct endpoint/body', async () => {
    axiosPostMock.mockImplementation(async (url: string) => {
      if (String(url).includes('getYamlValuesByFromValues')) {
        return { data: 'YAML_BODY_EDIT' }
      }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate={false} formsPrefills={editPrefills} />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(updateEntryMock).toHaveBeenCalled()
    })

    const callArg = updateEntryMock.mock.calls[0][0]
    expect(callArg.endpoint).toBe('/api/clusters/c1/k8s/apis/apps/v1/deployments/dep1')
    expect(callArg.body).toBe('YAML_BODY_EDIT')
  })

  test('shows error modal when createNewEntry fails', async () => {
    axiosPostMock.mockImplementation(async (url: string) => {
      if (String(url).includes('getYamlValuesByFromValues')) {
        return { data: 'YAML_BODY_CREATE' }
      }
      return { data: {} }
    })

    createNewEntryMock.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'boom' } },
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Modal content
    expect(await screen.findByText(/An error has occurred:/i)).toBeInTheDocument()
    expect(await screen.findByText(/boom/i)).toBeInTheDocument()
  })

  test('Cancel navigates to backlink', async () => {
    const user = userEvent.setup()

    render(<BlackholeForm {...baseProps} backlink="/back" />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(navigateMock).toHaveBeenCalledWith('/back')
  })
})
