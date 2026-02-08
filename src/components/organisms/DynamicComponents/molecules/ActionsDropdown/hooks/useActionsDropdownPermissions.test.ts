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

const editAction: TActionUnion = {
  type: 'edit',
  props: { text: 'Edit', cluster: 'c', apiVersion: 'v1', plural: 'pods', name: 'p' },
}

const deleteAction: TActionUnion = {
  type: 'delete',
  props: { text: 'Delete', endpoint: '/api/delete', name: 'p' },
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
  },
}

const evictAction: TActionUnion = {
  type: 'evict',
  props: { text: 'Evict', endpoint: '/api/evict', name: 'p' },
}

const openKubeletConfigAction: TActionUnion = {
  type: 'openKubeletConfig',
  props: { text: 'Kubelet Config', url: '/api/kubelet' },
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUsePermissions.mockReturnValue(permissionResult(undefined))
})

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('useActionsDropdownPermissions', () => {
  describe('manual permissions override', () => {
    it('returns manual permissions when provided, skipping RBAC checks', () => {
      const manualPermissions: TActionsPermissions = { canUpdate: true, canPatch: false, canDelete: true }

      const { result } = renderHook(() =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [editAction, editLabelsAction, deleteAction],
          permissions: manualPermissions,
          permissionContext: { cluster: '{2}', plural: 'pods' },
        }),
      )

      expect(result.current).toEqual(manualPermissions)
      // All usePermissions calls should have enabler: false
      mockUsePermissions.mock.calls.forEach(call => {
        expect(call[0].enabler).toBe(false)
      })
    })
  })

  describe('computed permissions via permissionContext', () => {
    it('calls usePermissions with correct verbs for edit/patch/delete actions', () => {
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
          permissionContext: { cluster: '{2}', plural: 'pods' },
        }),
      )

      expect(result.current.canUpdate).toBe(true)
      expect(result.current.canPatch).toBe(false)
      expect(result.current.canDelete).toBe(true)
    })

    it('passes cluster and plural from permissionContext with interpolation', () => {
      mockUsePermissions.mockReturnValue(permissionResult(true))

      renderHook(() =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [editAction],
          permissionContext: { cluster: '{2}', plural: 'pods' },
        }),
      )

      const updateCall = mockUsePermissions.mock.calls.find((call: { verb: string }[]) => call[0].verb === 'update')
      expect(updateCall).toBeDefined()
      expect(updateCall[0].cluster).toBe('my-cluster')
      expect(updateCall[0].plural).toBe('pods')
    })

    it('passes namespace from permissionContext when provided', () => {
      mockUsePermissions.mockReturnValue(permissionResult(true))

      renderHook(() =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [editAction],
          permissionContext: { cluster: '{2}', namespace: '{1}', plural: 'pods' },
        }),
      )

      const updateCall = mockUsePermissions.mock.calls.find((call: { verb: string }[]) => call[0].verb === 'update')
      expect(updateCall[0].namespace).toBe('default')
    })
  })

  describe('subresource-specific permissions', () => {
    it('passes eviction subresource for evict action (create verb)', () => {
      mockUsePermissions.mockReturnValue(permissionResult(true))

      renderHook(() =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [evictAction],
          permissionContext: { cluster: '{2}', plural: 'pods' },
        }),
      )

      const createCall = mockUsePermissions.mock.calls.find((call: { verb: string }[]) => call[0].verb === 'create')
      expect(createCall).toBeDefined()
      expect(createCall[0].subresource).toBe('eviction')
      expect(createCall[0].enabler).toBe(true)
    })

    it('passes proxy subresource for openKubeletConfig action (get verb)', () => {
      mockUsePermissions.mockReturnValue(permissionResult(true))

      renderHook(() =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [openKubeletConfigAction],
          permissionContext: { cluster: '{2}', plural: 'nodes' },
        }),
      )

      const getCall = mockUsePermissions.mock.calls.find((call: { verb: string }[]) => call[0].verb === 'get')
      expect(getCall).toBeDefined()
      expect(getCall[0].subresource).toBe('proxy')
      expect(getCall[0].enabler).toBe(true)
    })

    it('does not pass subresource for standard actions', () => {
      mockUsePermissions.mockReturnValue(permissionResult(true))

      renderHook(() =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [editAction, editLabelsAction, deleteAction],
          permissionContext: { cluster: '{2}', plural: 'pods' },
        }),
      )

      const callsWithSubresource = mockUsePermissions.mock.calls.filter(
        (call: { subresource?: string }[]) => call[0].subresource !== undefined,
      )
      expect(callsWithSubresource).toHaveLength(0)
    })
  })

  describe('permission check enablement', () => {
    it('disables permission checks while multiQuery is loading', () => {
      const { result } = renderHook(() =>
        useActionsDropdownPermissions({
          ...baseParams,
          isMultiQueryLoading: true,
          actions: [editAction],
          permissionContext: { cluster: '{2}', plural: 'pods' },
        }),
      )

      // All hooks should have enabler: false
      mockUsePermissions.mock.calls.forEach(call => {
        expect(call[0].enabler).toBe(false)
      })

      // Computed permissions should be undefined (not yet resolved)
      expect(result.current.canUpdate).toBeUndefined()
    })

    it('disables permission checks when permissionContext is not provided', () => {
      renderHook(() =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [editAction],
        }),
      )

      // All hooks should have enabler: false because context is invalid
      mockUsePermissions.mock.calls.forEach(call => {
        expect(call[0].enabler).toBe(false)
      })
    })

    it('disables permission checks when cluster resolves to dash placeholder', () => {
      renderHook(() =>
        useActionsDropdownPermissions({
          ...baseParams,
          replaceValues: { '2': undefined },
          actions: [editAction],
          permissionContext: { cluster: '{2}', plural: 'pods' },
        }),
      )

      const updateCall = mockUsePermissions.mock.calls.find((call: { verb: string }[]) => call[0].verb === 'update')
      expect(updateCall[0].enabler).toBe(false)
    })

    it('only enables hooks for verbs required by the actions', () => {
      mockUsePermissions.mockReturnValue(permissionResult(true))

      renderHook(() =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [editAction], // only needs 'update'
          permissionContext: { cluster: '{2}', plural: 'pods' },
        }),
      )

      const updateCall = mockUsePermissions.mock.calls.find((call: { verb: string }[]) => call[0].verb === 'update')
      const patchCall = mockUsePermissions.mock.calls.find((call: { verb: string }[]) => call[0].verb === 'patch')
      const deleteCall = mockUsePermissions.mock.calls.find((call: { verb: string }[]) => call[0].verb === 'delete')

      expect(updateCall[0].enabler).toBe(true)
      expect(patchCall[0].enabler).toBe(false)
      expect(deleteCall[0].enabler).toBe(false)
    })
  })

  describe('computed permission values', () => {
    it('returns undefined for verbs not required by any action', () => {
      mockUsePermissions.mockReturnValue(permissionResult(true))

      const { result } = renderHook(() =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [editAction], // only needs 'update'
          permissionContext: { cluster: '{2}', plural: 'pods' },
        }),
      )

      expect(result.current.canUpdate).toBe(true)
      expect(result.current.canPatch).toBeUndefined()
      expect(result.current.canDelete).toBeUndefined()
      expect(result.current.canCreate).toBeUndefined()
      expect(result.current.canGet).toBeUndefined()
    })

    it('returns canCreate for evict and canGet for openKubeletConfig', () => {
      mockUsePermissions.mockImplementation((params: { verb: string }) => {
        if (params.verb === 'create') return permissionResult(true)
        if (params.verb === 'get') return permissionResult(false)
        return permissionResult(undefined)
      })

      const { result } = renderHook(() =>
        useActionsDropdownPermissions({
          ...baseParams,
          actions: [evictAction, openKubeletConfigAction],
          permissionContext: { cluster: '{2}', plural: 'pods' },
        }),
      )

      expect(result.current.canCreate).toBe(true)
      expect(result.current.canGet).toBe(false)
    })
  })
})
