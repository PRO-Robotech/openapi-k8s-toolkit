import { renderHook } from '@testing-library/react'
import { TActionUnion, TActionsPermissions } from '../../../types/ActionsDropdown'
import { useActionsDropdownPermissions } from './useActionsDropdownPermissions'

/* ------------------------------------------------------------------ */
/*  Mock usePermissions                                                */
/* ------------------------------------------------------------------ */
const mockUsePermissions = jest.fn()
jest.mock('hooks/usePermissions', () => ({
  usePermissions: (...args: unknown[]) => mockUsePermissions(...args),
}))

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const permissionResult = (allowed?: boolean) => ({
  data: allowed !== undefined ? { status: { allowed } } : undefined,
  isLoading: false,
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
  mockUsePermissions.mockReturnValue(permissionResult(undefined))
})

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('useActionsDropdownPermissions - manual override', () => {
  it('returns manual permissions when provided, skipping RBAC checks', () => {
    const manualPermissions: TActionsPermissions = { 'edit-0': true, 'editLabels-1': false, 'delete-2': true }

    const { result } = renderHook(() =>
      useActionsDropdownPermissions({
        ...baseParams,
        actions: [editAction, editLabelsAction, deleteAction],
        permissions: manualPermissions,
      }),
    )

    expect(result.current).toEqual(manualPermissions)
    // All usePermissions calls should have enabler: false
    mockUsePermissions.mock.calls.forEach(call => {
      expect(call[0].enabler).toBe(false)
    })
  })
})

describe('useActionsDropdownPermissions - per-action permissions', () => {
  it('computes per-action permissions using each action permissionContext', () => {
    mockUsePermissions.mockImplementation((params: { verb: string }) => {
      if (params.verb === 'update') return permissionResult(true)
      if (params.verb === 'patch') return permissionResult(false)
      if (params.verb === 'delete') return permissionResult(true)
      return permissionResult(undefined)
    })

    const { result } = renderHook(() =>
      useActionsDropdownPermissions({
        ...baseParams,
        actions: [editAction, editLabelsAction, deleteAction],
      }),
    )

    expect(result.current['edit-0']).toBe(true)
    expect(result.current['editLabels-1']).toBe(false)
    expect(result.current['delete-2']).toBe(true)
  })

  it('passes cluster and plural from per-action permissionContext with interpolation', () => {
    mockUsePermissions.mockReturnValue(permissionResult(true))

    renderHook(() =>
      useActionsDropdownPermissions({
        ...baseParams,
        actions: [editAction],
      }),
    )

    // Find the enabled call (the one with enabler: true)
    const enabledCall = mockUsePermissions.mock.calls.find((call: { enabler: boolean }[]) => call[0].enabler === true)
    expect(enabledCall).toBeDefined()
    expect(enabledCall[0].cluster).toBe('my-cluster')
    expect(enabledCall[0].plural).toBe('pods')
  })

  it('passes namespace from permissionContext when provided', () => {
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

    mockUsePermissions.mockReturnValue(permissionResult(true))

    renderHook(() =>
      useActionsDropdownPermissions({
        ...baseParams,
        actions: [actionWithNs],
      }),
    )

    const enabledCall = mockUsePermissions.mock.calls.find((call: { enabler: boolean }[]) => call[0].enabler === true)
    expect(enabledCall[0].namespace).toBe('default')
  })

  it('deduplicates identical permission checks across actions', () => {
    // cordon and uncordon both need 'patch' on the same resource
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

    mockUsePermissions.mockReturnValue(permissionResult(true))

    const { result } = renderHook(() =>
      useActionsDropdownPermissions({
        ...baseParams,
        actions: [cordonAction, uncordonAction],
      }),
    )

    // Both actions should share the same permission result
    expect(result.current['cordon-0']).toBe(true)
    expect(result.current['uncordon-1']).toBe(true)

    // Only one enabled permission call (deduplicated)
    const enabledCalls = mockUsePermissions.mock.calls.filter(
      (call: { enabler: boolean }[]) => call[0].enabler === true,
    )
    expect(enabledCalls).toHaveLength(1)
  })

  it('supports cross-resource permissions (different permissionContext per action)', () => {
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

    mockUsePermissions.mockImplementation((params: { verb: string; plural: string }) => {
      if (params.plural === 'deployments' && params.verb === 'update') return permissionResult(true)
      if (params.plural === 'jobs' && params.verb === 'create') return permissionResult(false)
      return permissionResult(undefined)
    })

    const { result } = renderHook(() =>
      useActionsDropdownPermissions({
        ...baseParams,
        actions: [scaleAction, triggerRunAction],
      }),
    )

    expect(result.current['scale-0']).toBe(true)
    expect(result.current['triggerRun-1']).toBe(false)
  })
})

describe('useActionsDropdownPermissions - subresource permissions', () => {
  it('passes eviction subresource for evict action (create verb)', () => {
    mockUsePermissions.mockReturnValue(permissionResult(true))

    renderHook(() =>
      useActionsDropdownPermissions({
        ...baseParams,
        actions: [evictAction],
      }),
    )

    const enabledCall = mockUsePermissions.mock.calls.find((call: { enabler: boolean }[]) => call[0].enabler === true)
    expect(enabledCall).toBeDefined()
    expect(enabledCall[0].verb).toBe('create')
    expect(enabledCall[0].subresource).toBe('eviction')
  })

  it('passes proxy subresource for openKubeletConfig action (get verb)', () => {
    mockUsePermissions.mockReturnValue(permissionResult(true))

    renderHook(() =>
      useActionsDropdownPermissions({
        ...baseParams,
        actions: [openKubeletConfigAction],
      }),
    )

    const enabledCall = mockUsePermissions.mock.calls.find((call: { enabler: boolean }[]) => call[0].enabler === true)
    expect(enabledCall).toBeDefined()
    expect(enabledCall[0].verb).toBe('get')
    expect(enabledCall[0].subresource).toBe('proxy')
  })
})

describe('useActionsDropdownPermissions - enablement', () => {
  it('disables permission checks while multiQuery is loading', () => {
    const { result } = renderHook(() =>
      useActionsDropdownPermissions({
        ...baseParams,
        isMultiQueryLoading: true,
        actions: [editAction],
      }),
    )

    mockUsePermissions.mock.calls.forEach(call => {
      expect(call[0].enabler).toBe(false)
    })

    // No keys should be set in computed permissions
    expect(Object.keys(result.current)).toHaveLength(0)
  })

  it('skips actions without permissionContext', () => {
    const actionWithoutCtx: TActionUnion = {
      type: 'edit',
      props: { text: 'Edit', cluster: 'c', apiVersion: 'v1', plural: 'pods', name: 'p' },
    }

    mockUsePermissions.mockReturnValue(permissionResult(true))

    const { result } = renderHook(() =>
      useActionsDropdownPermissions({
        ...baseParams,
        actions: [actionWithoutCtx],
      }),
    )

    // No enabled permission calls
    mockUsePermissions.mock.calls.forEach(call => {
      expect(call[0].enabler).toBe(false)
    })

    // No permission result for the action
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

    renderHook(() =>
      useActionsDropdownPermissions({
        ...baseParams,
        replaceValues: {},
        actions: [actionWithBadCluster],
      }),
    )

    // All hooks should have enabler: false because context is invalid
    mockUsePermissions.mock.calls.forEach(call => {
      expect(call[0].enabler).toBe(false)
    })
  })
})
