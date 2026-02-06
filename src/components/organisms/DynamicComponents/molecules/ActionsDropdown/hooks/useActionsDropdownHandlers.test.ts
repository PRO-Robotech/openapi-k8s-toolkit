/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react'
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
jest.mock('antd', () => {
  const actual = jest.requireActual('antd')
  return {
    ...actual,
    notification: {
      useNotification: () => [
        { success: mockNotificationSuccess, error: mockNotificationError },
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

const mockWindowOpen = jest.fn()
const originalWindowOpen = window.open

import { useActionsDropdownHandlers } from './useActionsDropdownHandlers'

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
  window.open = mockWindowOpen
})

afterAll(() => {
  window.open = originalWindowOpen
})

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('useActionsDropdownHandlers', () => {
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

      expect(mockNotificationSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Cordon successful' }),
      )
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['multi'] })
    })

    it('shows error notification on reject', async () => {
      mockPatchEntryWithReplaceOp.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      await act(async () => {
        result.current.handleActionClick(cordonAction)
      })

      expect(mockNotificationError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Cordon failed' }),
      )
    })
  })

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
      expect(callArg.body.spec.template.metadata.annotations).toHaveProperty([
        'kubectl.kubernetes.io/restartedAt',
      ])
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

      expect(mockNotificationError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Evict my-pod failed' }),
      )
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

  describe('openKubeletConfig action', () => {
    it('opens URL in new tab by default', () => {
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

      expect(mockWindowOpen).toHaveBeenCalledWith('/api/clusters/my-cluster/proxy/configz', '_blank')
    })

    it('respects custom target', () => {
      const action: TActionUnion = {
        type: 'openKubeletConfig',
        props: {
          text: 'Kubelet Config',
          url: '/api/kubelet',
          target: '_self',
        },
      }

      const { result } = renderHook(() => useActionsDropdownHandlers(baseParams))

      act(() => {
        result.current.handleActionClick(action)
      })

      expect(mockWindowOpen).toHaveBeenCalledWith('/api/kubelet', '_self')
    })
  })

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
