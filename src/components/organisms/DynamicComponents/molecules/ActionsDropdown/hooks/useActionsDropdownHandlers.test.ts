/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react'
import { useActionsDropdownHandlers } from './useActionsDropdownHandlers'
import { TActionUnion } from '../../../types/ActionsDropdown'

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */
const mockNavigate = jest.fn()
const mockLocation = { pathname: '/openapi-ui/cluster1/table/pods', search: '' }
const mockSearchParams = new URLSearchParams()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  useSearchParams: () => [mockSearchParams],
}))

const mockInvalidateQueries = jest.fn()
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

const mockNotificationSuccess = jest.fn()
const mockNotificationError = jest.fn()
const mockNotificationWarning = jest.fn()
jest.mock('antd', () => {
  const actual = jest.requireActual('antd')
  return {
    ...actual,
    notification: {
      useNotification: () => [
        { success: mockNotificationSuccess, error: mockNotificationError, warning: mockNotificationWarning },
        null, // contextHolder
      ],
    },
  }
})

const mockCreateNewEntry = jest.fn()
const mockPatchEntryWithReplaceOp = jest.fn()
const mockPatchEntryWithMergePatch = jest.fn()
jest.mock('api/forms', () => ({
  createNewEntry: (...args: unknown[]) => mockCreateNewEntry(...args),
  patchEntryWithReplaceOp: (...args: unknown[]) => mockPatchEntryWithReplaceOp(...args),
  patchEntryWithMergePatch: (...args: unknown[]) => mockPatchEntryWithMergePatch(...args),
}))

const mockAxiosPost = jest.fn()
jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  __esModule: true,
  default: { post: (...args: unknown[]) => mockAxiosPost(...args) },
}))

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const baseParams = {
  replaceValues: { '0': 'openapi-ui', '1': 'default', '2': 'my-cluster' } as Record<string, string | undefined>,
  multiQueryData: {} as Record<string, unknown>,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCreateNewEntry.mockResolvedValue({})
  mockPatchEntryWithReplaceOp.mockResolvedValue({})
  mockPatchEntryWithMergePatch.mockResolvedValue({})
  mockAxiosPost.mockResolvedValue({ data: {} })
})

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('useActionsDropdownHandlers - edit and delete', () => {
  describe('edit action', () => {
    it('navigates to the edit form URL', () => {
      const editAction: TActionUnion = {
        type: 'edit',
        props: {
          text: 'Edit',
          cluster: 'my-cluster',
          namespace: 'default',
          apiVersion: 'v1',
          plural: 'pods',
          name: 'my-pod',
          baseprefix: '/openapi-ui',
        },
      }

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(editAction)
      })

      expect(mockNavigate).toHaveBeenCalledTimes(1)
      const url = mockNavigate.mock.calls[0][0] as string
      expect(url).toContain('/openapi-ui/my-cluster/default/forms/builtin/v1/pods/my-pod')
      expect(url).toContain('backlink=')
    })
  })

  describe('delete action', () => {
    it('sets deleteModalData with parsed fields', () => {
      const deleteAction: TActionUnion = {
        type: 'delete',
        props: {
          text: 'Delete',
          endpoint: '/api/clusters/{2}/delete',
          name: 'my-pod',
          redirectTo: '/openapi-ui/{2}/table',
        },
      }

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(deleteAction)
      })

      expect(result.current.deleteModalData).toEqual({
        name: 'my-pod',
        endpoint: '/api/clusters/my-cluster/delete',
        redirectTo: '/openapi-ui/my-cluster/table',
      })
    })

    it('handleDeleteModalClose navigates to redirectTo when provided', () => {
      const deleteAction: TActionUnion = {
        type: 'delete',
        props: {
          text: 'Delete',
          endpoint: '/api/delete',
          name: 'my-pod',
          redirectTo: '/openapi-ui/table',
        },
      }

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(deleteAction)
      })

      mockNavigate.mockClear()

      act(() => {
        result.current.handleDeleteModalClose()
      })

      expect(mockNavigate).toHaveBeenCalledWith('/openapi-ui/table')
      expect(result.current.deleteModalData).toBeNull()
    })

    it('handleDeleteModalClose does not navigate when no redirectTo and no backlink', () => {
      const deleteAction: TActionUnion = {
        type: 'delete',
        props: {
          text: 'Delete',
          endpoint: '/api/delete',
          name: 'my-pod',
        },
      }

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(deleteAction)
      })

      mockNavigate.mockClear()

      act(() => {
        result.current.handleDeleteModalClose()
      })

      expect(mockNavigate).not.toHaveBeenCalled()
      expect(result.current.deleteModalData).toBeNull()
    })
  })
})

describe('useActionsDropdownHandlers - patch actions', () => {
  describe('cordon/uncordon/suspend/resume actions', () => {
    const cordonAction: TActionUnion = {
      type: 'cordon',
      props: {
        text: 'Cordon',
        endpoint: '/api/clusters/{2}/nodes/my-node',
        pathToValue: '/spec/unschedulable',
        value: true,
      },
    }

    it('calls patchEntryWithReplaceOp with parsed endpoint and value', () => {
      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(cordonAction)
      })

      expect(mockPatchEntryWithReplaceOp).toHaveBeenCalledWith({
        endpoint: '/api/clusters/my-cluster/nodes/my-node',
        pathToValue: '/spec/unschedulable',
        body: true,
      })
    })

    it('shows success notification on resolve', async () => {
      mockPatchEntryWithReplaceOp.mockResolvedValue({})

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      await act(async () => {
        result.current.handleActionClick(cordonAction)
      })

      expect(mockNotificationSuccess).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cordon successful' }))
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['multi'] })
    })

    it('shows error notification on reject', async () => {
      mockPatchEntryWithReplaceOp.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      await act(async () => {
        result.current.handleActionClick(cordonAction)
      })

      expect(mockNotificationError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cordon failed' }))
    })
  })
})

describe('useActionsDropdownHandlers - rollout restart', () => {
  describe('rolloutRestart action', () => {
    const rolloutRestartAction: TActionUnion = {
      type: 'rolloutRestart',
      props: {
        text: 'Rollout Restart',
        endpoint: '/api/clusters/{2}/deployments/my-deploy',
      },
    }

    it('calls patchEntryWithMergePatch with restart annotation', () => {
      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(rolloutRestartAction)
      })

      expect(mockPatchEntryWithMergePatch).toHaveBeenCalledTimes(1)
      const callArg = mockPatchEntryWithMergePatch.mock.calls[0][0]
      expect(callArg.endpoint).toBe('/api/clusters/my-cluster/deployments/my-deploy')
      expect(callArg.body.spec.template.metadata.annotations).toHaveProperty(['kubectl.kubernetes.io/restartedAt'])
    })

    it('uses custom annotationKey when provided', () => {
      const customAction: TActionUnion = {
        type: 'rolloutRestart',
        props: {
          text: 'Rollout Restart',
          endpoint: '/api/deploy',
          annotationKey: 'custom.io/restarted',
        },
      }

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(customAction)
      })

      const callArg = mockPatchEntryWithMergePatch.mock.calls[0][0]
      expect(callArg.body.spec.template.metadata.annotations).toHaveProperty(['custom.io/restarted'])
    })

    it('shows success notification on resolve', async () => {
      mockPatchEntryWithMergePatch.mockResolvedValue({})

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      await act(async () => {
        result.current.handleActionClick(rolloutRestartAction)
      })

      expect(mockNotificationSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Rollout Restart successful' }),
      )
    })
  })
})

describe('useActionsDropdownHandlers - evict action', () => {
  describe('evict action', () => {
    const evictAction: TActionUnion = {
      type: 'evict',
      props: {
        text: 'Evict',
        endpoint: '/api/clusters/{2}/evict',
        name: 'my-pod',
        namespace: 'default',
        apiVersion: 'policy/v1',
        gracePeriodSeconds: 30,
      },
    }

    it('sets evictModalData with parsed fields on click', () => {
      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(evictAction)
      })

      expect(result.current.evictModalData).toEqual({
        endpoint: '/api/clusters/my-cluster/evict',
        name: 'my-pod',
        namespace: 'default',
        apiVersion: 'policy/v1',
        gracePeriodSeconds: 30,
        dryRun: undefined,
      })
    })

    it('handleEvictConfirm calls createNewEntry with eviction body', async () => {
      mockCreateNewEntry.mockResolvedValue({})

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(evictAction)
      })

      await act(async () => {
        result.current.handleEvictConfirm()
      })

      expect(mockCreateNewEntry).toHaveBeenCalledTimes(1)
      const callArg = mockCreateNewEntry.mock.calls[0][0]
      expect(callArg.endpoint).toBe('/api/clusters/my-cluster/evict')
      expect(callArg.body).toEqual({
        apiVersion: 'policy/v1',
        kind: 'Eviction',
        metadata: { name: 'my-pod', namespace: 'default' },
        deleteOptions: { gracePeriodSeconds: 30 },
      })
    })

    it('handleEvictConfirm shows success and clears modal on resolve', async () => {
      mockCreateNewEntry.mockResolvedValue({})

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(evictAction)
      })

      await act(async () => {
        result.current.handleEvictConfirm()
      })

      expect(mockNotificationSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Evict my-pod successful' }),
      )
      expect(result.current.evictModalData).toBeNull()
      expect(result.current.isEvictLoading).toBe(false)
    })

    it('handleEvictConfirm shows error and clears modal on reject', async () => {
      mockCreateNewEntry.mockRejectedValue(new Error('PDB blocked'))

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(evictAction)
      })

      await act(async () => {
        result.current.handleEvictConfirm()
      })

      expect(mockNotificationError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Evict my-pod failed' }))
      expect(result.current.evictModalData).toBeNull()
      expect(result.current.isEvictLoading).toBe(false)
    })

    it('handleEvictCancel clears modal data', () => {
      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(evictAction)
      })

      expect(result.current.evictModalData).not.toBeNull()

      act(() => {
        result.current.handleEvictCancel()
      })

      expect(result.current.evictModalData).toBeNull()
      expect(result.current.isEvictLoading).toBe(false)
    })

    it('handleEvictConfirm does nothing when evictModalData is null', () => {
      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleEvictConfirm()
      })

      expect(mockCreateNewEntry).not.toHaveBeenCalled()
    })
  })
})

describe('useActionsDropdownHandlers - openKubeletConfig', () => {
  describe('openKubeletConfig action', () => {
    it('opens modal with parsed URL', () => {
      const action: TActionUnion = {
        type: 'openKubeletConfig',
        props: {
          text: 'Kubelet Config',
          url: '/api/clusters/{2}/proxy/configz',
        },
      }

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(action)
      })

      expect(result.current.modalOpen).toBe(true)
      expect(result.current.activeAction).toEqual({
        type: 'openKubeletConfig',
        props: {
          text: 'Kubelet Config',
          url: '/api/clusters/my-cluster/proxy/configz',
        },
      })
    })

    it('parses optional modal fields', () => {
      const action: TActionUnion = {
        type: 'openKubeletConfig',
        props: {
          text: 'Kubelet Config',
          url: '/api/clusters/{2}/proxy/configz',
          modalTitle: 'Kubelet Config: {2}',
          modalDescriptionText: 'Read-only config for cluster {2}',
        },
      }

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(action)
      })

      expect(result.current.activeAction).toEqual({
        type: 'openKubeletConfig',
        props: {
          text: 'Kubelet Config',
          url: '/api/clusters/my-cluster/proxy/configz',
          modalTitle: 'Kubelet Config: my-cluster',
          modalDescriptionText: 'Read-only config for cluster my-cluster',
        },
      })
    })
  })
})

describe('useActionsDropdownHandlers - modal actions', () => {
  describe('modal actions (editLabels, editAnnotations, etc.)', () => {
    it('opens modal for editLabels action', () => {
      const action: TActionUnion = {
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

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(action)
      })

      expect(result.current.activeAction).toEqual(action)
      expect(result.current.modalOpen).toBe(true)
    })

    it('handleCloseModal resets activeAction and modalOpen', () => {
      const action: TActionUnion = {
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

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(action)
      })

      expect(result.current.modalOpen).toBe(true)

      act(() => {
        result.current.handleCloseModal()
      })

      expect(result.current.activeAction).toBeNull()
      expect(result.current.modalOpen).toBe(false)
    })
  })
})

describe('useActionsDropdownHandlers - drain action', () => {
  const drainAction: TActionUnion = {
    type: 'drain',
    props: {
      text: 'Drain',
      bffEndpoint: '/api/clusters/{2}/openapi-bff/actions/drain',
      nodeName: 'my-node',
    },
  }

  it('sets drainModalData with parsed fields on click', () => {
    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleActionClick(drainAction)
    })

    expect(result.current.drainModalData).toEqual({
      bffEndpoint: '/api/clusters/my-cluster/openapi-bff/actions/drain',
      nodeName: 'my-node',
    })
  })

  it('handleDrainConfirm calls axios.post with correct body', async () => {
    mockAxiosPost.mockResolvedValue({ data: { drained: 3, failed: [], skipped: 1 } })

    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleActionClick(drainAction)
    })

    await act(async () => {
      result.current.handleDrainConfirm()
    })

    expect(mockAxiosPost).toHaveBeenCalledTimes(1)
    expect(mockAxiosPost).toHaveBeenCalledWith('/api/clusters/my-cluster/openapi-bff/actions/drain', {
      nodeName: 'my-node',
      apiPath: '/api/v1/nodes/my-node',
    })
  })

  it('shows success notification with drained/skipped counts on full success', async () => {
    mockAxiosPost.mockResolvedValue({ data: { drained: 3, failed: [], skipped: 1 } })

    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleActionClick(drainAction)
    })

    await act(async () => {
      result.current.handleDrainConfirm()
    })

    expect(mockNotificationSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Drain my-node successful',
        description: 'Evicted 3 pod(s), skipped 1',
      }),
    )
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['multi'] })
    expect(result.current.drainModalData).toBeNull()
    expect(result.current.isDrainLoading).toBe(false)
  })

  it('shows success notification with drained: 0 when all skipped', async () => {
    mockAxiosPost.mockResolvedValue({ data: { drained: 0, failed: [], skipped: 5 } })

    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleActionClick(drainAction)
    })

    await act(async () => {
      result.current.handleDrainConfirm()
    })

    expect(mockNotificationSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Drain my-node successful',
        description: 'Evicted 0 pod(s), skipped 5',
      }),
    )
  })

  it('shows warning notification with pod failure details on partial failure', async () => {
    mockAxiosPost.mockResolvedValue({
      data: {
        drained: 2,
        failed: [
          { name: 'pod-a', namespace: 'ns1', error: 'PDB violated' },
          { name: 'pod-b', namespace: 'ns2', error: 'timeout' },
        ],
        skipped: 1,
      },
    })

    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleActionClick(drainAction)
    })

    await act(async () => {
      result.current.handleDrainConfirm()
    })

    expect(mockNotificationWarning).toHaveBeenCalledTimes(1)
    const call = mockNotificationWarning.mock.calls[0][0]
    expect(call.message).toBe('Drain my-node partially completed')
    expect(call.duration).toBe(0)
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['multi'] })
    expect(result.current.drainModalData).toBeNull()
    expect(result.current.isDrainLoading).toBe(false)
  })

  it('handleDrainConfirm shows error and clears modal on reject', async () => {
    mockAxiosPost.mockRejectedValue(new Error('Cordon failed'))

    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleActionClick(drainAction)
    })

    await act(async () => {
      result.current.handleDrainConfirm()
    })

    expect(mockNotificationError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Drain my-node failed' }))
    expect(result.current.drainModalData).toBeNull()
    expect(result.current.isDrainLoading).toBe(false)
  })

  it('handleDrainCancel clears modal data', () => {
    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleActionClick(drainAction)
    })

    expect(result.current.drainModalData).not.toBeNull()

    act(() => {
      result.current.handleDrainCancel()
    })

    expect(result.current.drainModalData).toBeNull()
    expect(result.current.isDrainLoading).toBe(false)
  })

  it('handleDrainConfirm does nothing when drainModalData is null', () => {
    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleDrainConfirm()
    })

    expect(mockAxiosPost).not.toHaveBeenCalled()
  })
})

describe('useActionsDropdownHandlers - rollback action', () => {
  const rollbackAction: TActionUnion = {
    type: 'rollback',
    props: {
      text: 'Rollback',
      bffEndpoint: '/api/clusters/{2}/openapi-bff/actions/rollback',
      resourceName: 'my-deploy',
      resourceEndpoint: '/apis/apps/v1/namespaces/{1}/deployments/my-deploy',
    },
  }

  it('sets rollbackModalData with parsed fields on click', () => {
    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleActionClick(rollbackAction)
    })

    expect(result.current.rollbackModalData).toEqual({
      bffEndpoint: '/api/clusters/my-cluster/openapi-bff/actions/rollback',
      resourceName: 'my-deploy',
      resourceEndpoint: '/apis/apps/v1/namespaces/default/deployments/my-deploy',
    })
  })

  it('handleRollbackConfirm calls axios.post with correct body', async () => {
    mockAxiosPost.mockResolvedValue({ data: { rolledBack: true, fromRevision: 3, toRevision: 2 } })

    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleActionClick(rollbackAction)
    })

    await act(async () => {
      result.current.handleRollbackConfirm()
    })

    expect(mockAxiosPost).toHaveBeenCalledTimes(1)
    expect(mockAxiosPost).toHaveBeenCalledWith('/api/clusters/my-cluster/openapi-bff/actions/rollback', {
      resourceEndpoint: '/apis/apps/v1/namespaces/default/deployments/my-deploy',
      resourceName: 'my-deploy',
    })
  })

  it('handleRollbackConfirm shows success and clears modal on resolve', async () => {
    mockAxiosPost.mockResolvedValue({ data: {} })

    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleActionClick(rollbackAction)
    })

    await act(async () => {
      result.current.handleRollbackConfirm()
    })

    expect(mockNotificationSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Rollback my-deploy successful' }),
    )
    expect(result.current.rollbackModalData).toBeNull()
    expect(result.current.isRollbackLoading).toBe(false)
  })

  it('handleRollbackConfirm shows error and clears modal on reject', async () => {
    mockAxiosPost.mockRejectedValue(new Error('No previous revision'))

    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleActionClick(rollbackAction)
    })

    await act(async () => {
      result.current.handleRollbackConfirm()
    })

    expect(mockNotificationError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Rollback my-deploy failed' }),
    )
    expect(result.current.rollbackModalData).toBeNull()
    expect(result.current.isRollbackLoading).toBe(false)
  })

  it('handleRollbackCancel clears modal data', () => {
    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleActionClick(rollbackAction)
    })

    expect(result.current.rollbackModalData).not.toBeNull()

    act(() => {
      result.current.handleRollbackCancel()
    })

    expect(result.current.rollbackModalData).toBeNull()
    expect(result.current.isRollbackLoading).toBe(false)
  })

  it('handleRollbackConfirm does nothing when rollbackModalData is null', () => {
    const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

    act(() => {
      result.current.handleRollbackConfirm()
    })

    expect(mockAxiosPost).not.toHaveBeenCalled()
  })
})
