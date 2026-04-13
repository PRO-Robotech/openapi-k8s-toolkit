/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { useActionsDropdownPermissions, useActionsDropdownHandlers } from './hooks'
import { getDropdownPlacement } from './dropdownPlacement'
import { ActionsDropdown } from './ActionsDropdown'
import { TActionsDropdownProps } from '../../types/ActionsDropdown'

const DropdownMock = jest.fn()
const ConfigProviderMock = jest.fn()

jest.mock('components/atoms', () => ({
  ConfirmModal: () => null,
  DeleteModal: () => null,
  DeleteModalMany: () => null,
}))

jest.mock('antd', () => {
  const actual = jest.requireActual('antd')
  return {
    ...actual,
    ConfigProvider: (props: any) => {
      ConfigProviderMock(props)
      return React.createElement(actual.ConfigProvider, props)
    },
    Dropdown: (props: any) => {
      DropdownMock(props)
      return React.createElement(actual.Dropdown, props)
    },
  }
})

jest.mock('../../../DynamicRendererWithProviders/providers/hybridDataProvider', () => ({
  useMultiQuery: jest.fn(),
}))

jest.mock('../../../DynamicRendererWithProviders/providers/partsOfUrlContext', () => ({
  usePartsOfUrl: jest.fn(),
}))

jest.mock('./hooks', () => ({
  useActionsDropdownPermissions: jest.fn(),
  useActionsDropdownHandlers: jest.fn(),
}))

jest.mock('./dropdownPlacement', () => ({
  DEFAULT_MENU_MAX_HEIGHT_PX: 320,
  getDropdownPlacement: jest.fn(),
}))

const mockUseMultiQuery = useMultiQuery as unknown as jest.Mock
const mockUsePartsOfUrl = usePartsOfUrl as unknown as jest.Mock
const mockUseActionsDropdownPermissions = useActionsDropdownPermissions as unknown as jest.Mock
const mockUseActionsDropdownHandlers = useActionsDropdownHandlers as unknown as jest.Mock
const mockGetDropdownPlacement = getDropdownPlacement as jest.Mock

const buildHandlers = () => ({
  notificationContextHolder: null,
  activeAction: null,
  modalOpen: false,
  deleteModalData: null,
  evictModalData: null,
  isEvictLoading: false,
  scaleModalData: null,
  isScaleLoading: false,
  deleteChildrenModalData: null,
  rerunModalData: null,
  isRerunLoading: false,
  drainModalData: null,
  isDrainLoading: false,
  rollbackModalData: null,
  isRollbackLoading: false,
  handleActionClick: jest.fn(),
  handleCloseModal: jest.fn(),
  handleDeleteModalClose: jest.fn(),
  handleEvictConfirm: jest.fn(),
  handleEvictCancel: jest.fn(),
  handleScaleConfirm: jest.fn(),
  handleScaleCancel: jest.fn(),
  handleDeleteChildrenClose: jest.fn(),
  handleRerunConfirm: jest.fn(),
  handleRerunCancel: jest.fn(),
  handleDrainConfirm: jest.fn(),
  handleDrainCancel: jest.fn(),
  handleRollbackConfirm: jest.fn(),
  handleRollbackCancel: jest.fn(),
  createFromFilesModalData: null,
  isCreateFromFilesLoading: false,
  handleCreateFromFilesConfirm: jest.fn(),
  handleCreateFromFilesCancel: jest.fn(),
})

const buildData = (overrides: Partial<TActionsDropdownProps> = {}): TActionsDropdownProps => ({
  id: 'actions-dropdown',
  buttonText: 'Actions',
  buttonVariant: 'default',
  actions: [
    {
      type: 'edit',
      props: {
        text: 'Edit',
        cluster: 'my-cluster',
        apiVersion: 'v1',
        plural: 'pods',
        name: 'my-pod',
      },
    },
    {
      type: 'delete',
      props: {
        text: 'Delete',
        endpoint: '/api/delete',
        name: 'my-pod',
      },
    },
  ],
  ...overrides,
})

describe('ActionsDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseMultiQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: false,
      errors: [],
    })
    mockUsePartsOfUrl.mockReturnValue({ partsOfUrl: ['openapi-ui', 'cluster', 'namespace'] })
    mockUseActionsDropdownPermissions.mockReturnValue({ 'edit-0': true, 'delete-1': true })
    mockUseActionsDropdownHandlers.mockReturnValue(buildHandlers())
    mockGetDropdownPlacement.mockReturnValue({ placement: 'bottomLeft', maxMenuHeightPx: 320 })
  })

  it('opens menu on click and keeps menu items for default button variant', async () => {
    render(<ActionsDropdown data={buildData()} />)

    fireEvent.click(screen.getByRole('button', { name: /actions/i }))

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    const dropdownProps = DropdownMock.mock.calls[0][0] as {
      menu: { items: Array<{ label: unknown }>; style: { maxHeight: number; overflowY: string } }
      placement: string
    }
    expect(dropdownProps.menu.items.map(item => item.label)).toEqual(['Edit', 'Delete'])
    expect(dropdownProps.placement).toBe('bottomLeft')
    expect(dropdownProps.menu.style).toEqual({ maxHeight: 320, overflowY: 'auto' })
  })

  it('opens menu on click and keeps menu items for icon button variant', async () => {
    render(<ActionsDropdown data={buildData({ buttonVariant: 'icon' })} />)

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    const dropdownProps = DropdownMock.mock.calls[0][0] as {
      menu: { items: Array<{ label: unknown }> }
    }
    expect(dropdownProps.menu.items.map(item => item.label)).toEqual(['Edit', 'Delete'])
  })

  it('recomputes placement and menu max height on open', async () => {
    mockGetDropdownPlacement.mockReturnValue({ placement: 'topLeft', maxMenuHeightPx: 240 })

    render(<ActionsDropdown data={buildData()} />)

    const initialDropdownProps = DropdownMock.mock.calls[0][0] as {
      onOpenChange?: (open: boolean) => void
    }

    act(() => {
      initialDropdownProps.onOpenChange?.(true)
    })

    await waitFor(() => {
      const latestDropdownProps = DropdownMock.mock.calls[DropdownMock.mock.calls.length - 1][0] as {
        placement: string
        menu: { style: { maxHeight: number; overflowY: string } }
      }
      expect(latestDropdownProps.placement).toBe('topLeft')
      expect(latestDropdownProps.menu.style).toEqual({ maxHeight: 240, overflowY: 'auto' })
    })

    expect(mockGetDropdownPlacement).toHaveBeenCalledWith(
      expect.objectContaining({
        actionsCount: 2,
        triggerTop: expect.any(Number),
        triggerBottom: expect.any(Number),
        viewportHeight: expect.any(Number),
      }),
    )
  })

  it('provides local dropdown popup configuration through ConfigProvider', () => {
    render(<ActionsDropdown data={buildData()} />)

    const configProviderProps = ConfigProviderMock.mock.calls[0][0] as {
      theme: { components: { Dropdown: { zIndexPopup: number } } }
      getPopupContainer: (trigger?: HTMLElement) => HTMLElement
    }

    expect(configProviderProps.theme.components.Dropdown.zIndexPopup).toBe(2000)

    const trigger = document.createElement('button')
    expect(configProviderProps.getPopupContainer(trigger)).toBe(document.body)
    expect(configProviderProps.getPopupContainer(undefined)).toBe(document.body)
  })
})
