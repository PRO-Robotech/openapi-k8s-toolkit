import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TActionUnion, TActionsPermissions } from '../../../types/ActionsDropdown'
import { useActionsDropdownPermissions } from './useActionsDropdownPermissions'

/* ------------------------------------------------------------------ */
/*  Mock checkPermission                                               */
/* ------------------------------------------------------------------ */
const mockCheckPermission = jest.fn()
jest.mock('api/permissions', () => ({
  checkPermission: (...args: unknown[]) => mockCheckPermission(...args),
}))

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const makeClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  })

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(QueryClientProvider, { client: makeClient() }, children)

const checkPermissionResponse = (allowed?: boolean) => ({
  data: allowed !== undefined ? { status: { allowed } } : undefined,
})

const baseParams = {
  replaceValues: { '0': 'openapi-ui', '1': 'default', '2': 'my-cluster' } as Record<string, string | undefined>,
  multiQueryData: {} as Record<string, unknown>,
  isMultiQueryLoading: false,
}

const permCtx = { cluster: '{2}', plural: 'pods' }

const editAction: TActionUnion = {
  type: 'edit',
  props: { text: 'Edit', cluster: 'c', apiVersion: 'v1', plural: 'pods', name: 'p', permissionContext: permCtx },
}

const deleteAction: TActionUnion = {
  type: 'delete',
  props: { text: 'Delete', endpoint: '/api/delete', name: 'p', permissionContext: permCtx },
}

const editLabelsAction: TActionUnion = {
  type: 'editLabels',
  props: {
    text: 'Edit Labels',
    reqIndex: '0',
    jsonPathToLabels: '.metadata.labels',
    endpoint: '/api/labels',
    pathToValue: '/metadata/labels',
    modalTitle: 'Edit Labels',
    permissionContext: permCtx,
  },
}

const evictAction: TActionUnion = {
  type: 'evict',
  props: { text: 'Evict', endpoint: '/api/evict', name: 'p', permissionContext: permCtx },
}

const openKubeletConfigAction: TActionUnion = {
  type: 'openKubeletConfig',
  props: { text: 'Kubelet Config', url: '/api/kubelet', permissionContext: { cluster: '{2}', plural: 'nodes' } },
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCheckPermission.mockResolvedValue(checkPermissionResponse(undefined))
})

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('useActionsDropdownPermissions - manual override', () => {
  it('returns manual permissions when provided, skipping RBAC checks', () => {
    const manualPermissions: TActionsPermissions = { 'edit-0': true, 'editLabels-1': false, 'delete-2': true }

    const { result } = renderHook(
      () =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [editAction, editLabelsAction, deleteAction],
          permissions: manualPermissions,
        }),
      { wrapper },
    )

    expect(result.current).toEqual(manualPermissions)
    expect(mockCheckPermission).not.toHaveBeenCalled()
  })
})

describe('useActionsDropdownPermissions - per-action permissions', () => {
  it('computes per-action permissions using each action permissionContext', async () => {
    mockCheckPermission.mockImplementation(({ body }: { body: { verb: string } }) => {
      if (body.verb === 'update') return Promise.resolve(checkPermissionResponse(true))
      if (body.verb === 'patch') return Promise.resolve(checkPermissionResponse(false))
      if (body.verb === 'delete') return Promise.resolve(checkPermissionResponse(true))
      return Promise.resolve(checkPermissionResponse(undefined))
    })

    const { result } = renderHook(
      () =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [editAction, editLabelsAction, deleteAction],
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(result.current['edit-0']).toBe(true)
      expect(result.current['editLabels-1']).toBe(false)
      expect(result.current['delete-2']).toBe(true)
    })
  })

  it('passes cluster and plural from per-action permissionContext with interpolation', async () => {
    mockCheckPermission.mockResolvedValue(checkPermissionResponse(true))

    renderHook(
      () =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [editAction],
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(mockCheckPermission).toHaveBeenCalled()
    })

    const call = mockCheckPermission.mock.calls[0][0]
    expect(call.cluster).toBe('my-cluster')
    expect(call.body.plural).toBe('pods')
  })

  it('passes namespace from permissionContext when provided', async () => {
    const actionWithNs: TActionUnion = {
      type: 'edit',
      props: {
        text: 'Edit',
        cluster: 'c',
        apiVersion: 'v1',
        plural: 'pods',
        name: 'p',
        permissionContext: { cluster: '{2}', namespace: '{1}', plural: 'pods' },
      },
    }

    mockCheckPermission.mockResolvedValue(checkPermissionResponse(true))

    renderHook(
      () =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [actionWithNs],
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(mockCheckPermission).toHaveBeenCalled()
    })

    const call = mockCheckPermission.mock.calls[0][0]
    expect(call.body.namespace).toBe('default')
  })

  it('deduplicates identical permission checks across actions', async () => {
    const cordonAction: TActionUnion = {
      type: 'cordon',
      props: {
        text: 'Cordon',
        endpoint: '/api/cordon',
        pathToValue: '/spec/unschedulable',
        value: true,
        permissionContext: permCtx,
      },
    }
    const uncordonAction: TActionUnion = {
      type: 'uncordon',
      props: {
        text: 'Uncordon',
        endpoint: '/api/uncordon',
        pathToValue: '/spec/unschedulable',
        value: false,
        permissionContext: permCtx,
      },
    }

    mockCheckPermission.mockResolvedValue(checkPermissionResponse(true))

    const { result } = renderHook(
      () =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [cordonAction, uncordonAction],
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(result.current['cordon-0']).toBe(true)
      expect(result.current['uncordon-1']).toBe(true)
    })

    // Only one API call (deduplicated — same cluster/plural/verb)
    expect(mockCheckPermission).toHaveBeenCalledTimes(1)
  })

  it('supports cross-resource permissions (different permissionContext per action)', async () => {
    const scaleAction: TActionUnion = {
      type: 'scale',
      props: {
        text: 'Scale',
        endpoint: '/api/scale',
        currentReplicas: '3',
        name: 'my-deploy',
        permissionContext: { cluster: '{2}', plural: 'deployments', subresource: 'scale' },
      },
    }
    const triggerRunAction: TActionUnion = {
      type: 'triggerRun',
      props: {
        text: 'Trigger Run',
        createEndpoint: '/api/jobs',
        cronJobName: 'my-cron',
        jobTemplate: "{reqs[0]['spec','jobTemplate']}",
        permissionContext: { cluster: '{2}', plural: 'jobs' },
      },
    }

    mockCheckPermission.mockImplementation(({ body }: { body: { verb: string; plural: string } }) => {
      if (body.plural === 'deployments' && body.verb === 'update') return Promise.resolve(checkPermissionResponse(true))
      if (body.plural === 'jobs' && body.verb === 'create') return Promise.resolve(checkPermissionResponse(false))
      return Promise.resolve(checkPermissionResponse(undefined))
    })

    const { result } = renderHook(
      () =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [scaleAction, triggerRunAction],
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(result.current['scale-0']).toBe(true)
      expect(result.current['triggerRun-1']).toBe(false)
    })
  })
})

describe('useActionsDropdownPermissions - subresource permissions', () => {
  it('passes eviction subresource for evict action (create verb)', async () => {
    mockCheckPermission.mockResolvedValue(checkPermissionResponse(true))

    renderHook(
      () =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [evictAction],
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(mockCheckPermission).toHaveBeenCalled()
    })

    const call = mockCheckPermission.mock.calls[0][0]
    expect(call.body.verb).toBe('create')
    expect(call.body.subresource).toBe('eviction')
  })

  it('passes proxy subresource for openKubeletConfig action (get verb)', async () => {
    mockCheckPermission.mockResolvedValue(checkPermissionResponse(true))

    renderHook(
      () =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [openKubeletConfigAction],
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(mockCheckPermission).toHaveBeenCalled()
    })

    const call = mockCheckPermission.mock.calls[0][0]
    expect(call.body.verb).toBe('get')
    expect(call.body.subresource).toBe('proxy')
  })
})

describe('useActionsDropdownPermissions - enablement', () => {
  it('disables permission checks while multiQuery is loading', () => {
    const { result } = renderHook(
      () =>
        useActionsDropdownPermissions({
          ...baseParams,
          isMultiQueryLoading: true,
          actions: [editAction],
        }),
      { wrapper },
    )

    expect(mockCheckPermission).not.toHaveBeenCalled()
    expect(Object.keys(result.current)).toHaveLength(0)
  })

  it('skips actions without permissionContext', () => {
    const actionWithoutCtx: TActionUnion = {
      type: 'edit',
      props: { text: 'Edit', cluster: 'c', apiVersion: 'v1', plural: 'pods', name: 'p' },
    }

    mockCheckPermission.mockResolvedValue(checkPermissionResponse(true))

    const { result } = renderHook(
      () =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [actionWithoutCtx],
        }),
      { wrapper },
    )

    expect(mockCheckPermission).not.toHaveBeenCalled()
    expect(result.current['edit-0']).toBeUndefined()
  })

  it('disables permission checks when cluster resolves to dash placeholder', () => {
    const actionWithBadCluster: TActionUnion = {
      type: 'edit',
      props: {
        text: 'Edit',
        cluster: 'c',
        apiVersion: 'v1',
        plural: 'pods',
        name: 'p',
        permissionContext: { cluster: '{99}', plural: 'pods' },
      },
    }

    renderHook(
      () =>
        useActionsDropdownPermissions({
          ...baseParams,
          replaceValues: {},
          actions: [actionWithBadCluster],
        }),
      { wrapper },
    )

    expect(mockCheckPermission).not.toHaveBeenCalled()
  })
})
