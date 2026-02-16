/* eslint-disable max-lines-per-function */
/* eslint-disable no-unneeded-ternary */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
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
    post: (url: any, data?: any, config?: any) => axiosPostMock(url, data, config),
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

const isPrefixMock = jest.fn((full: any[], prefix: any[]) => {
  if (!Array.isArray(full) || !Array.isArray(prefix) || prefix.length > full.length) return false
  return prefix.every((seg, idx) => full[idx] === seg)
})
jest.mock('./helpers/hiddenExpanded', () => ({
  sanitizeWildcardPath: (p: any) => p,
  expandWildcardTemplates: () => [],
  toStringPath: (p: any) => p,
  isPrefix: (full: any[], prefix: any[]) => isPrefixMock(full, prefix),
}))

jest.mock('./helpers/prefills', () => ({
  toWildcardPath: (p: any) => p,
  collectArrayLengths: () => new Map(),
  templateMatchesArray: () => false,
  buildConcretePathForNewItem: (_tpl: any, arrayPath: any, newIndex: any) => [...arrayPath, newIndex],
  scrubLiteralWildcardKeys: (v: any) => v,
}))

const pruneAdditionalForValuesMock = jest.fn((props: any, _values?: any, _blockedPathsRef?: any) => props)
const materializeAdditionalFromValuesMock = jest.fn((props: any, _values?: any, _blockedPathsRef?: any) => ({
  props,
  toPersist: [] as (string | number)[][],
}))
jest.mock('./helpers/casts', () => ({
  pathKey: (p: any) => JSON.stringify(p),
  pruneAdditionalForValues: (props: any, values: any, blockedPathsRef: any) =>
    pruneAdditionalForValuesMock(props, values, blockedPathsRef),
  materializeAdditionalFromValues: (props: any, values: any, blockedPathsRef: any) =>
    materializeAdditionalFromValuesMock(props, values, blockedPathsRef),
}))

jest.mock('./utilsErrorHandler', () => ({
  handleSubmitError: () => [],
  handleValidationError: () => [],
}))

// Stub the huge recursive form builder
const getObjectFormItemsDraftMock = jest.fn()
jest.mock('./utils', () => {
  const React = require('react')
  return {
    getObjectFormItemsDraft: (args: any) => getObjectFormItemsDraftMock(args),
  }
})

// Stub YAML editor UI
jest.mock('../../molecules', () => {
  const React = require('react')
  return {
    YamlEditor: ({ editorUri, theme, onChange }: any) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          'div',
          {
            'data-testid': 'yaml-editor',
            'data-editor-uri': editorUri,
            'data-theme': theme,
          },
          'YAML_EDITOR',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'yaml-editor-trigger-change',
            onClick: () => onChange?.({ spec: { fromYaml: 'yes' } }),
          },
          'trigger-yaml-change',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'yaml-editor-trigger-paste',
            onClick: () =>
              onChange?.({
                spec: { userExtra: 'edited-via-yaml', pastedOne: 'v1', pastedObj: { nested: 'x' } },
                metadata: { labels: { pasted: 'true' } },
              }),
          },
          'trigger-yaml-paste',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'yaml-editor-trigger-array-add',
            onClick: () =>
              onChange?.({
                spec: {
                  rules: [
                    { name: 'rule-a', value: '1' },
                    { name: 'rule-b', value: '2' },
                  ],
                },
              }),
          },
          'trigger-yaml-array-add',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'yaml-editor-trigger-array-remove',
            onClick: () =>
              onChange?.({
                spec: {
                  rules: [{ name: 'rule-a', value: '1' }],
                },
              }),
          },
          'trigger-yaml-array-remove',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'yaml-editor-trigger-deep-paste',
            onClick: () =>
              onChange?.({
                spec: {
                  template: {
                    spec: {
                      containers: [
                        {
                          env: {
                            EXTRA_NESTED: 'v2',
                            KEEP: 'x',
                          },
                        },
                      ],
                    },
                  },
                },
              }),
          },
          'trigger-yaml-deep-paste',
        ),
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
    customizationId: 'test-customization-edit',
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
  isPrefixMock.mockImplementation((full: any[], prefix: any[]) => {
    if (!Array.isArray(full) || !Array.isArray(prefix) || prefix.length > full.length) return false
    return prefix.every((seg, idx) => full[idx] === seg)
  })
  getObjectFormItemsDraftMock.mockImplementation(() => React.createElement('div', { 'data-testid': 'draft-items' }))
  pruneAdditionalForValuesMock.mockImplementation((props: any) => props)
  materializeAdditionalFromValuesMock.mockImplementation((props: any) => ({ props, toPersist: [] }))

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

  test('submit (create mode) with backlink navigates after success', async () => {
    axiosPostMock.mockImplementation(async (url: string) => {
      if (String(url).includes('getYamlValuesByFromValues')) {
        return { data: 'YAML_BODY_CREATE' }
      }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate backlink="/list" />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(createNewEntryMock).toHaveBeenCalled()
      expect(navigateMock).toHaveBeenCalledWith('/list')
    })
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

  test('submit (edit mode) with backlink navigates after success', async () => {
    axiosPostMock.mockImplementation(async (url: string) => {
      if (String(url).includes('getYamlValuesByFromValues')) {
        return { data: 'YAML_BODY_EDIT' }
      }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate={false} formsPrefills={editPrefills} backlink="/details" />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(updateEntryMock).toHaveBeenCalled()
      expect(navigateMock).toHaveBeenCalledWith('/details')
    })
  })

  test('submit button is disabled in create mode when create permission is denied', () => {
    usePermissionsMock.mockImplementation((args: any) => ({
      data: { status: { allowed: args.verb === 'create' ? false : true } },
    }))

    render(<BlackholeForm {...baseProps} isCreate />)

    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
  })

  test('submit button is disabled in edit mode when update permission is denied', () => {
    usePermissionsMock.mockImplementation((args: any) => ({
      data: { status: { allowed: args.verb === 'update' ? false : true } },
    }))

    render(<BlackholeForm {...baseProps} isCreate={false} formsPrefills={editPrefills} />)

    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
  })

  test('calls usePermissions with correct create/edit enablers and request identity fields', () => {
    render(
      <BlackholeForm {...baseProps} isCreate urlParamsForPermissions={{ apiGroup: 'apps', plural: 'deployments' }} />,
    )

    expect(usePermissionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiGroup: 'apps',
        plural: 'deployments',
        namespace: undefined,
        cluster: 'c1',
        verb: 'create',
        enabler: true,
      }),
    )
    expect(usePermissionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiGroup: 'apps',
        plural: 'deployments',
        namespace: undefined,
        cluster: 'c1',
        verb: 'update',
        enabler: false,
      }),
    )
  })

  test('builtin type passes undefined apiGroup to usePermissions and endpoint excludes /apis', async () => {
    axiosPostMock.mockImplementation(async (url: string) => {
      if (String(url).includes('getYamlValuesByFromValues')) {
        return { data: 'YAML_BODY_BUILTIN' }
      }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(
      <BlackholeForm
        {...baseProps}
        isCreate
        type="builtin"
        apiGroupApiVersion="api/v1"
        plural="pods"
        kind="Pod"
        urlParamsForPermissions={{ apiGroup: 'ignored', plural: 'pods' }}
      />,
    )

    expect(usePermissionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiGroup: undefined,
        plural: 'pods',
      }),
    )

    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => {
      expect(createNewEntryMock).toHaveBeenCalled()
    })

    expect(createNewEntryMock.mock.calls[0][0].endpoint).toBe('/api/clusters/c1/k8s/api/v1/pods/')
  })

  test('create mode includes namespace in endpoint for namespaced resources', async () => {
    axiosPostMock.mockImplementation(async (url: string) => {
      if (String(url).includes('getYamlValuesByFromValues')) {
        return { data: 'YAML_BODY_CREATE_NAMESPACED' }
      }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(
      <BlackholeForm
        {...baseProps}
        isCreate
        isNameSpaced={['team-a']}
        prefillValueNamespaceOnly="team-a"
        formsPrefills={{
          spec: { customizationId: 'test-customization', values: [{ path: ['metadata', 'name'], value: 'dep1' }] },
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => {
      expect(createNewEntryMock).toHaveBeenCalled()
    })

    expect(createNewEntryMock.mock.calls[0][0].endpoint).toBe(
      '/api/clusters/c1/k8s/apis/apps/v1/namespaces/team-a/deployments/',
    )
  })

  test('user-added additionalProperties field is persisted and sent in formSync payload', async () => {
    axiosPostMock.mockImplementation(async (url: string) => {
      if (String(url).includes('getYamlValuesByFromValues')) return { data: 'YAML_BODY_CREATE' }
      if (String(url).includes('getFormValuesByYaml')) return { data: {} }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate />)

    const draftArgs = getObjectFormItemsDraftMock.mock.calls.at(-1)?.[0]
    expect(draftArgs).toBeTruthy()

    act(() => {
      draftArgs.addField({
        path: ['spec'],
        name: 'userExtra',
        type: 'string',
      })
    })

    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(createNewEntryMock).toHaveBeenCalled())

    const formSyncCalls = axiosPostMock.mock.calls.filter((c: any[]) =>
      String(c[0]).includes('getYamlValuesByFromValues'),
    )
    const payload = formSyncCalls.at(-1)?.[1]

    expect(payload.persistedKeys).toEqual(expect.arrayContaining([['spec', 'userExtra']]))
    expect(payload.properties.spec.properties.userExtra).toEqual(
      expect.objectContaining({
        type: 'string',
        isAdditionalProperties: true,
      }),
    )
  })

  test('removed user-added additionalProperties field is pruned and no longer persisted', async () => {
    pruneAdditionalForValuesMock.mockImplementation((props: any) => {
      const next = JSON.parse(JSON.stringify(props || {}))
      if (next?.spec?.properties?.userExtra) {
        delete next.spec.properties.userExtra
      }
      return next
    })
    axiosPostMock.mockImplementation(async (url: string) => {
      if (String(url).includes('getYamlValuesByFromValues')) return { data: 'YAML_BODY_CREATE' }
      if (String(url).includes('getFormValuesByYaml')) return { data: {} }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate />)

    const draftArgs = getObjectFormItemsDraftMock.mock.calls.at(-1)?.[0]
    expect(draftArgs).toBeTruthy()

    act(() => {
      draftArgs.addField({
        path: ['spec'],
        name: 'userExtra',
        type: 'string',
      })
    })
    act(() => {
      draftArgs.removeField({
        path: ['spec', 'userExtra'],
      })
    })

    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(createNewEntryMock).toHaveBeenCalled())

    const formSyncCalls = axiosPostMock.mock.calls.filter((c: any[]) =>
      String(c[0]).includes('getYamlValuesByFromValues'),
    )
    const payload = formSyncCalls.at(-1)?.[1]

    expect(pruneAdditionalForValuesMock).toHaveBeenCalled()
    expect(JSON.stringify(payload.values)).not.toContain('userExtra')
    expect(payload.persistedKeys).not.toEqual(expect.arrayContaining([['spec', 'userExtra']]))
    expect(payload.properties.spec?.properties?.userExtra).toBeUndefined()
  })

  test('BFF materialized additionalProperties marks paths for persist and updates properties', async () => {
    materializeAdditionalFromValuesMock.mockImplementation((props: any) => ({
      props: {
        ...(props || {}),
        spec: {
          properties: {
            ...((props && props.spec && props.spec.properties) || {}),
            bffExtra: { type: 'string', isAdditionalProperties: true },
          },
        },
      },
      toPersist: [['spec', 'bffExtra']],
    }))
    axiosPostMock.mockImplementation(async (url: string) => {
      if (String(url).includes('getFormValuesByYaml')) return { data: { spec: {} } }
      if (String(url).includes('getYamlValuesByFromValues')) return { data: 'YAML_BODY_CREATE' }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate />)

    await user.click(screen.getByTestId('yaml-editor-trigger-change'))
    await waitFor(() => expect(materializeAdditionalFromValuesMock).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(createNewEntryMock).toHaveBeenCalled())

    const formSyncCalls = axiosPostMock.mock.calls.filter((c: any[]) =>
      String(c[0]).includes('getYamlValuesByFromValues'),
    )
    const payload = formSyncCalls.at(-1)?.[1]

    expect(payload.persistedKeys).toEqual(expect.arrayContaining([['spec', 'bffExtra']]))
    expect(payload.properties.spec.properties.bffExtra).toEqual(
      expect.objectContaining({ type: 'string', isAdditionalProperties: true }),
    )
  })

  test('editing user-added additionalProperties via YAML sync sends edited value to yaml->values API', async () => {
    axiosPostMock.mockImplementation(async (url: string) => {
      if (String(url).includes('getFormValuesByYaml')) {
        return { data: { spec: { userExtra: 'edited-via-yaml' } } }
      }
      if (String(url).includes('getYamlValuesByFromValues')) return { data: 'YAML_BODY_CREATE' }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate />)

    const draftArgs = getObjectFormItemsDraftMock.mock.calls.at(-1)?.[0]
    expect(draftArgs).toBeTruthy()
    act(() => {
      draftArgs.addField({
        path: ['spec'],
        name: 'userExtra',
        type: 'string',
      })
    })

    await user.click(screen.getByTestId('yaml-editor-trigger-paste'))

    await waitFor(() => {
      const yamlToValuesCall = axiosPostMock.mock.calls.find((c: any[]) => String(c[0]).includes('getFormValuesByYaml'))
      expect(yamlToValuesCall).toBeTruthy()
      expect(yamlToValuesCall[1].values.spec.userExtra).toBe('edited-via-yaml')
    })
  })

  test('pasted YAML properties are sent to yaml->values and can materialize additionalProperties', async () => {
    materializeAdditionalFromValuesMock.mockImplementation((props: any) => ({
      props: {
        ...(props || {}),
        spec: {
          properties: {
            ...((props && props.spec && props.spec.properties) || {}),
            pastedOne: { type: 'string', isAdditionalProperties: true },
            pastedObj: { type: 'object', isAdditionalProperties: true },
          },
        },
      },
      toPersist: [
        ['spec', 'pastedOne'],
        ['spec', 'pastedObj'],
      ] as (string | number)[][],
    }))
    axiosPostMock.mockImplementation(async (url: string) => {
      if (String(url).includes('getFormValuesByYaml')) {
        return {
          data: {
            spec: { pastedOne: 'v1', pastedObj: { nested: 'x' } },
            metadata: { labels: { pasted: 'true' } },
          },
        }
      }
      if (String(url).includes('getYamlValuesByFromValues')) return { data: 'YAML_BODY_CREATE' }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate />)

    await user.click(screen.getByTestId('yaml-editor-trigger-paste'))
    await waitFor(() => expect(materializeAdditionalFromValuesMock).toHaveBeenCalled())

    const yamlToValuesCall = axiosPostMock.mock.calls.find((c: any[]) => String(c[0]).includes('getFormValuesByYaml'))
    expect(yamlToValuesCall[1].values.spec.pastedOne).toBe('v1')
    expect(yamlToValuesCall[1].values.spec.pastedObj).toEqual({ nested: 'x' })
    expect(yamlToValuesCall[1].values.metadata.labels.pasted).toBe('true')

    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(createNewEntryMock).toHaveBeenCalled())

    const formSyncCalls = axiosPostMock.mock.calls.filter((c: any[]) =>
      String(c[0]).includes('getYamlValuesByFromValues'),
    )
    const payload = formSyncCalls.at(-1)?.[1]
    expect(payload.persistedKeys).toEqual(
      expect.arrayContaining([
        ['spec', 'pastedOne'],
        ['spec', 'pastedObj'],
      ]),
    )
    expect(payload.properties.spec.properties.pastedOne).toEqual(
      expect.objectContaining({ type: 'string', isAdditionalProperties: true }),
    )
    expect(payload.properties.spec.properties.pastedObj).toEqual(
      expect.objectContaining({ type: 'object', isAdditionalProperties: true }),
    )
  })

  test('manual remove blocks re-materialization of the same empty/additional field across YAML sync', async () => {
    materializeAdditionalFromValuesMock.mockImplementation((props: any, _values: any, blockedPathsRef: any) => {
      const isBlocked = blockedPathsRef?.current?.has?.(JSON.stringify(['spec', 'userExtra'])) === true
      return {
        props: isBlocked
          ? props
          : {
              ...(props || {}),
              spec: {
                properties: {
                  ...((props && props.spec && props.spec.properties) || {}),
                  userExtra: { type: 'string', isAdditionalProperties: true },
                },
              },
            },
        toPersist: isBlocked ? [] : ([['spec', 'userExtra']] as (string | number)[][]),
      }
    })

    axiosPostMock.mockImplementation(async (url: string, payload?: any) => {
      if (String(url).includes('getFormValuesByYaml')) {
        return { data: payload?.values || { spec: { userExtra: 'edited-via-yaml' } } }
      }
      if (String(url).includes('getYamlValuesByFromValues')) return { data: 'YAML_BODY_CREATE' }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate />)

    const draftArgs = getObjectFormItemsDraftMock.mock.calls.at(-1)?.[0]
    expect(draftArgs).toBeTruthy()
    act(() => {
      draftArgs.addField({
        path: ['spec'],
        name: 'userExtra',
        type: 'string',
      })
    })
    act(() => {
      draftArgs.removeField({
        path: ['spec', 'userExtra'],
      })
    })

    await user.click(screen.getByTestId('yaml-editor-trigger-paste'))
    await waitFor(() => expect(materializeAdditionalFromValuesMock).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(createNewEntryMock).toHaveBeenCalled())

    expect(
      materializeAdditionalFromValuesMock.mock.calls.some(
        (c: any[]) => c[2]?.current?.has?.(JSON.stringify(['spec', 'userExtra'])) === true,
      ),
    ).toBe(true)

    const formSyncCalls = axiosPostMock.mock.calls.filter((c: any[]) =>
      String(c[0]).includes('getYamlValuesByFromValues'),
    )
    const payload = formSyncCalls.at(-1)?.[1]
    expect(payload.persistedKeys).not.toEqual(expect.arrayContaining([['spec', 'userExtra']]))
  })

  test('array items from YAML can be added then removed and submit keeps latest array state', async () => {
    axiosPostMock.mockImplementation(async (url: string, payload?: any) => {
      if (String(url).includes('getFormValuesByYaml')) return { data: payload?.values || {} }
      if (String(url).includes('getYamlValuesByFromValues')) return { data: 'YAML_BODY_CREATE' }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate />)

    await user.click(screen.getByTestId('yaml-editor-trigger-array-add'))
    await user.click(screen.getByTestId('yaml-editor-trigger-array-remove'))

    await waitFor(() => {
      const yamlToValuesCalls = axiosPostMock.mock.calls.filter((c: any[]) =>
        String(c[0]).includes('getFormValuesByYaml'),
      )
      expect(yamlToValuesCalls.length).toBeGreaterThanOrEqual(2)
      expect(yamlToValuesCalls.at(-2)?.[1]?.values?.spec?.rules?.length).toBe(2)
      expect(yamlToValuesCalls.at(-1)?.[1]?.values?.spec?.rules?.length).toBe(1)
    })

    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(createNewEntryMock).toHaveBeenCalled())
  })

  test('deep nested object->array->object additionalProperties supports add/edit/remove cycle', async () => {
    pruneAdditionalForValuesMock.mockImplementation((props: any) => {
      const next = JSON.parse(JSON.stringify(props || {}))
      const envProps =
        next?.spec?.properties?.template?.properties?.spec?.properties?.containers?.properties?.[0]?.properties?.env
          ?.properties
      if (envProps?.EXTRA_NESTED) {
        delete envProps.EXTRA_NESTED
      }
      return next
    })
    materializeAdditionalFromValuesMock.mockImplementation((props: any) => ({
      props: {
        ...(props || {}),
        spec: {
          properties: {
            ...((props && props.spec && props.spec.properties) || {}),
            template: {
              properties: {
                spec: {
                  properties: {
                    containers: {
                      properties: {
                        0: {
                          properties: {
                            env: {
                              properties: {
                                KEEP: { type: 'string', isAdditionalProperties: true },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      toPersist: [['spec', 'template', 'spec', 'containers', 0, 'env', 'KEEP']] as (string | number)[][],
    }))
    axiosPostMock.mockImplementation(async (url: string, payload?: any) => {
      if (String(url).includes('getFormValuesByYaml')) return { data: payload?.values || {} }
      if (String(url).includes('getYamlValuesByFromValues')) return { data: 'YAML_BODY_CREATE' }
      return { data: {} }
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate />)

    const draftArgs = getObjectFormItemsDraftMock.mock.calls.at(-1)?.[0]
    expect(draftArgs).toBeTruthy()
    act(() => {
      draftArgs.addField({
        path: ['spec', 'template', 'spec', 'containers', 0, 'env'],
        name: 'EXTRA_NESTED',
        type: 'string',
      })
    })

    await user.click(screen.getByTestId('yaml-editor-trigger-deep-paste'))
    await waitFor(() => expect(materializeAdditionalFromValuesMock).toHaveBeenCalled())

    act(() => {
      draftArgs.removeField({
        path: ['spec', 'template', 'spec', 'containers', 0, 'env', 'EXTRA_NESTED'],
      })
    })

    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(createNewEntryMock).toHaveBeenCalled())

    const formSyncCalls = axiosPostMock.mock.calls.filter((c: any[]) =>
      String(c[0]).includes('getYamlValuesByFromValues'),
    )
    const payload = formSyncCalls.at(-1)?.[1]

    expect(payload.persistedKeys).toEqual(
      expect.arrayContaining([['spec', 'template', 'spec', 'containers', 0, 'env', 'KEEP']]),
    )
    expect(payload.persistedKeys).not.toEqual(
      expect.arrayContaining([['spec', 'template', 'spec', 'containers', 0, 'env', 'EXTRA_NESTED']]),
    )
    expect(
      payload.properties.spec.properties.template.properties.spec.properties.containers.properties[0].properties.env
        .properties.KEEP,
    ).toEqual(expect.objectContaining({ type: 'string', isAdditionalProperties: true }))
    expect(
      payload.properties.spec.properties.template.properties.spec.properties.containers.properties[0].properties.env
        .properties.EXTRA_NESTED,
    ).toBeUndefined()
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

  test('shows error modal when BFF transform fails and does not call create/update APIs', async () => {
    axiosPostMock.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'transform failed' } },
    })

    const user = userEvent.setup()
    render(<BlackholeForm {...baseProps} isCreate />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/An error has occurred:/i)).toBeInTheDocument()
    expect(await screen.findByText(/transform failed/i)).toBeInTheDocument()
    expect(createNewEntryMock).not.toHaveBeenCalled()
    expect(updateEntryMock).not.toHaveBeenCalled()
  })

  test('closes error modal when clicking OK', async () => {
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
    expect(await screen.findByText(/boom/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^ok$/i }))

    await waitFor(() => {
      expect(screen.queryByText(/boom/i)).not.toBeInTheDocument()
    })
  })

  test('Cancel navigates to backlink', async () => {
    const user = userEvent.setup()

    render(<BlackholeForm {...baseProps} backlink="/back" />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(navigateMock).toHaveBeenCalledWith('/back')
  })

  test('does not render Cancel button when backlink is not provided', () => {
    render(<BlackholeForm {...baseProps} backlink={undefined} />)

    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
  })
})
